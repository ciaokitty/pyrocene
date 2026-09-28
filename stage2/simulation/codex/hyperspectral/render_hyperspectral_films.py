#!/usr/bin/env python3
"""Render three silent candidate films from real hyperspectral evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


LIDAR_DIR = Path(__file__).resolve().parents[1] / "lidar"
sys.path.insert(0, str(LIDAR_DIR))
from render_lidar_films import Cloud, PointPainter  # noqa: E402


DURATION = 36.0
IVORY = (228, 232, 220)
MUTED = (150, 166, 158)
CYAN = (73, 196, 184)
MAGENTA = (217, 77, 137)
GREEN = (110, 183, 120)
AMBER = (224, 166, 82)
INK = (3, 8, 9)
FORBIDDEN_COPY = (".", "—", "→", "·")


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def smooth(value: float) -> float:
    value = clamp(value)
    return value * value * (3.0 - 2.0 * value)


def interval(value: float, start: float, end: float) -> float:
    return smooth((value - start) / max(end - start, 1e-6))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


class Fonts:
    def __init__(self, scale: float):
        sans = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Regular.otf"
        bold = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf"
        mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
        self.header = ImageFont.truetype(bold, round(18 * scale))
        self.legend = ImageFont.truetype(bold, round(15 * scale))
        self.caption = ImageFont.truetype(sans, round(41 * scale))
        self.location = ImageFont.truetype(mono, round(15 * scale))
        self.panel = ImageFont.truetype(bold, round(17 * scale))
        self.axis = ImageFont.truetype(mono, round(14 * scale))


def load_copy(path: Path, variant: str) -> tuple[str, dict]:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-hyperspectral-films/1":
        raise ValueError("Unsupported caption schema")
    selected = copy["variants"][variant]
    visible = [copy["header"], selected["location"]]
    visible.extend(item["text"] for item in selected["sentences"])
    visible.extend(selected["labels"].values())
    for text in visible:
        for character in FORBIDDEN_COPY:
            if character in text:
                raise ValueError(f"Forbidden on screen character {character!r} in {text!r}")
    return copy["header"], selected


def rounded_glass(image: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=radius, fill=205)
    blurred = image.filter(ImageFilter.GaussianBlur(max(5, radius // 2)))
    image.paste(blurred, (0, 0), mask)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(overlay, "RGBA").rounded_rectangle(
        box, radius=radius, fill=(2, 7, 9, 178), outline=(126, 165, 157, 42), width=1
    )
    image.paste(overlay, (0, 0), overlay)


def contain(image: Image.Image, box: tuple[int, int, int, int], background=INK) -> Image.Image:
    x0, y0, x1, y1 = box
    available_width, available_height = x1 - x0, y1 - y0
    scale = min(available_width / image.width, available_height / image.height)
    target = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    out = Image.new("RGB", (available_width, available_height), background)
    out.paste(target, ((out.width - target.width) // 2, (out.height - target.height) // 2))
    return out


def cover(image: Image.Image, size: tuple[int, int], progress: float = 0.0) -> Image.Image:
    width, height = size
    iw, ih = image.size
    zoom = 1.04 + 0.06 * smooth(progress)
    scale = max(width / iw, height / ih) * zoom
    resized = image.resize((round(iw * scale), round(ih * scale)), Image.Resampling.LANCZOS)
    travel_x = max(0, resized.width - width)
    travel_y = max(0, resized.height - height)
    left = round(travel_x * (0.36 + 0.20 * smooth(progress)))
    top = round(travel_y * (0.48 - 0.08 * smooth(progress)))
    return resized.crop((left, top, left + width, top + height))


def darken(image: Image.Image, factor: float) -> Image.Image:
    return ImageEnhance.Brightness(image).enhance(factor)


def vignette(image: Image.Image, amount: float = 0.42) -> Image.Image:
    width, height = image.size
    yy, xx = np.ogrid[-1:1:complex(height), -1:1:complex(width)]
    radius = np.sqrt(xx * xx + yy * yy)
    mask = np.clip(1.0 - amount * np.maximum(0, radius - 0.25), 0.52, 1.0)
    array = np.asarray(image, dtype=np.float32) * mask[..., None]
    return Image.fromarray(np.clip(array, 0, 255).astype(np.uint8))


def scalar_image(values: np.ndarray, low: float, high: float) -> Image.Image:
    normalized = np.clip((values - low) / max(high - low, 1e-6), 0, 1)
    finite = np.isfinite(normalized)
    normalized = np.nan_to_num(normalized, nan=0.0, posinf=1.0, neginf=0.0)
    stops = np.array(
        [[66, 32, 42], [164, 62, 93], [219, 147, 86], [75, 177, 167], [201, 226, 194]],
        dtype=np.float32,
    )
    position = normalized * (len(stops) - 1)
    lower = np.floor(position).astype(np.int32)
    upper = np.minimum(lower + 1, len(stops) - 1)
    weight = position - lower
    rgb = stops[lower] * (1 - weight[..., None]) + stops[upper] * weight[..., None]
    rgb[~finite] = INK
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def remove_paper_background(image: Image.Image) -> Image.Image:
    array = np.asarray(image, dtype=np.uint8).copy()
    background = (array[..., 0] > 244) & (array[..., 1] > 244) & (array[..., 2] > 244)
    array[background] = INK
    return Image.fromarray(array)


def photo_grid(source: Image.Image) -> Image.Image:
    crops = ((2170, 90, 3120, 450), (2170, 635, 3120, 1040),
             (2170, 1225, 3120, 1770), (2170, 2010, 3120, 2570))
    rows = [source.crop(box) for box in crops]
    cell_width = max(row.width for row in rows)
    cell_height = max(row.height for row in rows)
    out = Image.new("RGB", (cell_width * 2, cell_height * 2), INK)
    for index, row in enumerate(rows):
        panel = cover(row, (cell_width, cell_height), 0.5)
        out.paste(panel, ((index % 2) * cell_width, (index // 2) * cell_height))
    return out


def add_film_finish(image: Image.Image, frame: int) -> Image.Image:
    image = vignette(image)
    rng = np.random.default_rng(frame + 104729)
    noise = rng.normal(0, 1.15, (image.height, image.width, 1))
    array = np.asarray(image, dtype=np.float32) + noise
    return Image.fromarray(np.clip(array, 0, 255).astype(np.uint8))


def clean_lidar_frame(cloud: Cloud, width: int, height: int) -> Image.Image:
    painter = PointPainter(width, height)
    span = max(float(np.ptp(cloud.xyz[:, 0])), float(np.ptp(cloud.xyz[:, 1])), 180.0)
    crown = max(25.0, float(np.percentile(cloud.height, 99)))
    angle = math.radians(-33.0)
    distance = span * 0.95
    eye = (math.cos(angle) * distance, math.sin(angle) * distance, max(crown * 2.0, span * 0.42))
    target = (0.0, 0.0, crown * 0.31)
    return painter.render(cloud, eye, target, 38.0, "canopy-peel", 0.62)


class Evidence:
    def __init__(self, artifact: Path, paper_dir: Path, lidar: Path, width: int, height: int):
        with np.load(artifact) as data:
            for key in data.files:
                setattr(self, key, data[key])
        self.burned_true = Image.fromarray(self.burned_true_rgb)
        self.burned_false = Image.fromarray(self.burned_false_rgb)
        self.unburned_true = Image.fromarray(self.unburned_true_rgb)
        self.unburned_false = Image.fromarray(self.unburned_false_rgb)
        ewt_values = np.concatenate((self.burned_ewt[np.isfinite(self.burned_ewt)], self.unburned_ewt[np.isfinite(self.unburned_ewt)]))
        self.ewt_low, self.ewt_high = np.percentile(ewt_values, (5, 95))
        self.burned_ewt_image = scalar_image(self.burned_ewt, self.ewt_low, self.ewt_high)
        self.unburned_ewt_image = scalar_image(self.unburned_ewt, self.ewt_low, self.ewt_high)
        figure_one = Image.open(paper_dir / "figure-1.jpg").convert("RGB")
        figure_three = Image.open(paper_dir / "figure-3.jpg").convert("RGB")
        figure_eight = Image.open(paper_dir / "figure-8.jpg").convert("RGB")
        self.mudumalai_flight = remove_paper_background(figure_one.crop((2130, 110, 3375, 1750)))
        self.lantana_photos = photo_grid(figure_three)
        self.lantana_map = remove_paper_background(figure_eight.crop((880, 65, 1485, 1065)))
        self.chromolaena_map = remove_paper_background(figure_eight.crop((1675, 65, 2275, 1065)))
        self.lidar = clean_lidar_frame(Cloud.load(lidar), width, height)


def active_sentence(copy: dict, t: float) -> tuple[str, float]:
    for sentence in copy["sentences"]:
        start, end = float(sentence["start"]), float(sentence["end"])
        if start <= t < end:
            alpha = interval(t, start, start + 0.45) * (1 - interval(t, end - 0.38, end))
            return sentence["text"], alpha
    return "", 0.0


def draw_interface(image: Image.Image, header: str, copy: dict, t: float, fonts: Fonts, scale: float) -> None:
    fade = interval(t, 0, 0.55) * (1 - interval(t, DURATION - 0.45, DURATION))
    alpha = round(242 * fade)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), header, font=fonts.header, fill=(*IVORY, alpha))
    text, text_alpha = active_sentence(copy, t)
    location = copy["location"]
    elapsed = max(0.0, t - 4.35)
    typed = location[: min(len(location), int(elapsed * 31))]
    cursor = "▌" if typed and len(typed) < len(location) and int(elapsed * 2.7) % 2 == 0 else ""
    if not text and not typed:
        return
    left = round(54 * scale)
    bottom = image.height - round(45 * scale)
    location_box = draw.textbbox((0, 0), location, font=fonts.location)
    text_box = draw.textbbox((0, 0), text, font=fonts.caption) if text else (0, 0, 0, 0)
    width = max(round(540 * scale), location_box[2] + round(48 * scale), text_box[2] + round(48 * scale))
    right = min(image.width - round(54 * scale), left + width)
    height = round((119 if text else 54) * scale)
    top = bottom - height
    rounded_glass(image, (left, top, right, bottom), round(13 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    if text:
        draw.text((left + round(23 * scale), top + round(17 * scale)), text, font=fonts.caption,
                  fill=(*IVORY, round(255 * text_alpha * fade)))
        location_y = bottom - round(31 * scale)
    else:
        location_y = top + round(18 * scale)
    draw.text((left + round(23 * scale), location_y), typed + cursor, font=fonts.location,
              fill=(*CYAN, alpha))


def draw_legend(image: Image.Image, title: str, rows: list[tuple[tuple[int, int, int], str]], fonts: Fonts, scale: float) -> None:
    width = round(345 * scale)
    row_height = round(28 * scale)
    x1 = image.width - round(54 * scale)
    x0 = x1 - width
    y0 = round(42 * scale)
    y1 = y0 + round(48 * scale) + row_height * len(rows)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((x0 + round(20 * scale), y0 + round(14 * scale)), title, font=fonts.legend, fill=(*IVORY, 226))
    for index, (color, label) in enumerate(rows):
        y = y0 + round(47 * scale) + index * row_height
        draw.ellipse((x0 + round(21 * scale), y + round(3 * scale), x0 + round(31 * scale), y + round(13 * scale)), fill=(*color, 240))
        draw.text((x0 + round(43 * scale), y), label, font=fonts.legend, fill=(*MUTED, 236))


def lidar_bridge(evidence: Evidence, next_frame: Image.Image, t: float) -> Image.Image:
    lidar = cover(evidence.lidar, next_frame.size, clamp(t / 4.5))
    return Image.blend(lidar, next_frame, interval(t, 3.2, 5.1))


def single_tile_scene(image: Image.Image, size: tuple[int, int], t: float, start: float, end: float) -> Image.Image:
    return darken(cover(image, size, clamp((t - start) / max(end - start, 1e-6))), 0.78)


def two_tiles(evidence: Evidence, size: tuple[int, int], false_color: bool = False) -> Image.Image:
    width, height = size
    out = Image.new("RGB", size, INK)
    gap = round(width * 0.025)
    margin = round(width * 0.055)
    top = round(height * 0.12)
    bottom = round(height * 0.88)
    panel_width = (width - 2 * margin - gap) // 2
    left_image = evidence.burned_false if false_color else evidence.burned_true
    right_image = evidence.unburned_false if false_color else evidence.unburned_true
    for index, source in enumerate((left_image, right_image)):
        x0 = margin + index * (panel_width + gap)
        panel = contain(source, (x0, top, x0 + panel_width, bottom))
        out.paste(panel, (x0, top))
    return darken(out, 0.84)


def cube_scene(evidence: Evidence, size: tuple[int, int], progress: float) -> Image.Image:
    base = cover(evidence.burned_true, size, progress)
    false = cover(evidence.burned_false, size, progress)
    water = cover(scalar_image(evidence.burned_ndwi, -0.28, 0.2), size, progress)
    out = base.copy()
    width, height = size
    sweep = round(width * interval(progress, 0.05, 0.92))
    if sweep > 0:
        out.paste(false.crop((0, 0, sweep, height)), (0, 0))
    second = round(width * interval(progress, 0.42, 1.0))
    if second > 0:
        x0 = width - second
        out.paste(water.crop((x0, 0, width, height)), (x0, 0))
    draw = ImageDraw.Draw(out, "RGBA")
    for x in (sweep, width - second):
        if 2 < x < width - 2:
            draw.line((x, 0, x, height), fill=(*IVORY, 120), width=2)
    return darken(out, 0.76)


def draw_spectrum(evidence: Evidence, size: tuple[int, int], progress: float, compare: bool) -> Image.Image:
    background = darken(two_tiles(evidence, size, false_color=True), 0.25)
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    width, height = size
    x0, x1 = round(width * 0.10), round(width * 0.91)
    y0, y1 = round(height * 0.17), round(height * 0.76)
    draw.rounded_rectangle((x0 - 34, y0 - 35, x1 + 34, y1 + 42), radius=18, fill=(2, 7, 9, 215))
    wavelengths = evidence.burned_wavelengths
    x = x0 + (wavelengths - 380.0) / (2515.0 - 380.0) * (x1 - x0)
    water_left = x0 + (850 - 380) / (2515 - 380) * (x1 - x0)
    water_right = x0 + (1100 - 380) / (2515 - 380) * (x1 - x0)
    draw.rectangle((water_left, y0, water_right, y1), fill=(*CYAN, 26))
    for value in (400, 1000, 1600, 2200):
        px = x0 + (value - 380) / (2515 - 380) * (x1 - x0)
        draw.line((px, y0, px, y1), fill=(*MUTED, 25), width=1)
        draw.text((px - 18, y1 + 14), str(value), font=Fonts(width / 1920).axis, fill=(*MUTED, 205))
    for fraction in (0.0, 0.25, 0.5, 0.75):
        py = y1 - fraction / 0.75 * (y1 - y0)
        draw.line((x0, py, x1, py), fill=(*MUTED, 25), width=1)
    draw.line((x0, y1, x1, y1), fill=(*MUTED, 120), width=1)
    draw.line((x0, y0, x0, y1), fill=(*MUTED, 120), width=1)

    maximum_wavelength = 380 + progress * (2515 - 380)
    bad = (((wavelengths > 1330) & (wavelengths < 1490)) |
           ((wavelengths > 1780) & (wavelengths < 2000)) |
           (wavelengths > 2400))
    curves = [(evidence.burned_spectrum_median, MAGENTA)]
    if compare:
        curves.append((evidence.unburned_spectrum_median, CYAN))
    for values, color in curves:
        y = y1 - np.clip(values, 0, 0.75) / 0.75 * (y1 - y0)
        valid = np.isfinite(values) & (values > 0.005) & (values < 0.78) & ~bad & (wavelengths <= maximum_wavelength)
        segment: list[tuple[float, float]] = []
        for index in range(len(values)):
            if valid[index]:
                segment.append((float(x[index]), float(y[index])))
            elif len(segment) > 1:
                draw.line(segment, fill=(*color, 235), width=4, joint="curve")
                segment = []
        if len(segment) > 1:
            draw.line(segment, fill=(*color, 235), width=4, joint="curve")
    background.paste(overlay, (0, 0), overlay)
    return background


def water_maps(evidence: Evidence, size: tuple[int, int], fonts: Fonts, scale: float, labels: tuple[str, str]) -> Image.Image:
    width, height = size
    out = Image.new("RGB", size, INK)
    gap = round(width * 0.025)
    margin = round(width * 0.055)
    top = round(height * 0.12)
    bottom = round(height * 0.88)
    panel_width = (width - 2 * margin - gap) // 2
    for index, (rgb, scalar) in enumerate(((evidence.burned_true, evidence.burned_ewt_image), (evidence.unburned_true, evidence.unburned_ewt_image))):
        rgb_panel = contain(rgb, (0, 0, panel_width, bottom - top))
        scalar_panel = contain(scalar, (0, 0, panel_width, bottom - top))
        blended = Image.blend(darken(rgb_panel, 0.48), scalar_panel, 0.78)
        x0 = margin + index * (panel_width + gap)
        out.paste(blended, (x0, top))
    draw = ImageDraw.Draw(out, "RGBA")
    for index, label in enumerate(labels):
        x0 = margin + index * (panel_width + gap)
        bounds = draw.textbbox((0, 0), label, font=fonts.panel)
        text_width = bounds[2] - bounds[0]
        draw.text((x0 + (panel_width - text_width) // 2, top + round(16 * scale)), label,
                  font=fonts.panel, fill=(*IVORY, 224))
    return darken(out, 0.84)


def map_on_dark(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    canvas = Image.new("RGB", size, INK)
    panel = contain(source, (0, 0, round(size[0] * 0.86), round(size[1] * 0.88)))
    panel = darken(panel, 0.83)
    canvas.paste(panel, ((size[0] - panel.width) // 2, round(size[1] * 0.06)))
    return canvas


def invasive_maps(evidence: Evidence, size: tuple[int, int], focus: float = 0.0) -> Image.Image:
    width, height = size
    out = Image.new("RGB", size, INK)
    gap = round(width * 0.035)
    margin = round(width * 0.13)
    top = round(height * 0.10)
    bottom = round(height * 0.90)
    panel_width = (width - 2 * margin - gap) // 2
    sources = (evidence.lantana_map, evidence.chromolaena_map)
    for index, source in enumerate(sources):
        panel = contain(source, (0, 0, panel_width, bottom - top))
        if index == 1 and focus > 0:
            panel = darken(panel, 1.0 - 0.68 * focus)
        x0 = margin + index * (panel_width + gap)
        out.paste(panel, (x0, top))
    return darken(out, 0.86)


def scene(evidence: Evidence, variant: str, copy: dict, t: float, size: tuple[int, int], fonts: Fonts, scale: float) -> Image.Image:
    labels = copy["labels"]
    if variant == "water":
        first = single_tile_scene(evidence.burned_true, size, t, 3.2, 11.0)
        if t < 5.1:
            image = lidar_bridge(evidence, first, t)
        elif t < 11.0:
            image = first
        elif t < 18.0:
            image = cube_scene(evidence, size, clamp((t - 11.0) / 7.0))
            draw_legend(image, labels["measured_reflectance"], [(GREEN, labels["visible_light"]), (AMBER, labels["near_infrared"]), (CYAN, labels["shortwave_infrared"])], fonts, scale)
        elif t < 26.0:
            image = draw_spectrum(evidence, size, clamp((t - 18.0) / 6.8), compare=False)
            draw_legend(image, labels["water_absorption_fit"], [(CYAN, labels["water_fit_range"])], fonts, scale)
        else:
            image = water_maps(evidence, size, fonts, scale, (labels["fire_footprint"], labels["adjacent_unburned"]))
            draw_legend(image, labels["estimated_canopy_water"], [(MAGENTA, labels["lower"]), (CYAN, labels["higher"])], fonts, scale)
        return image

    if variant == "disturbance":
        first = two_tiles(evidence, size)
        if t < 5.1:
            image = lidar_bridge(evidence, first, t)
        elif t < 12.0:
            image = first
            draw_legend(image, labels["fire_history"], [(MAGENTA, labels["creek_fire_footprint"]), (CYAN, labels["adjacent_unburned"])], fonts, scale)
        elif t < 19.7:
            blend = interval(t, 12.0, 15.5)
            image = Image.blend(first, two_tiles(evidence, size, false_color=True), blend)
            draw_legend(image, labels["spectral_view"], [(AMBER, labels["shortwave_infrared"]), (GREEN, labels["near_infrared"])], fonts, scale)
        elif t < 27.8:
            image = draw_spectrum(evidence, size, clamp((t - 19.7) / 6.5), compare=True)
            draw_legend(image, labels["vegetation_spectra"], [(MAGENTA, labels["fire_footprint"]), (CYAN, labels["adjacent_unburned"])], fonts, scale)
        else:
            image = water_maps(evidence, size, fonts, scale, (labels["fire_footprint"], labels["adjacent_unburned"]))
            draw_legend(image, labels["estimated_canopy_water"], [(MAGENTA, labels["lower"]), (CYAN, labels["higher"])], fonts, scale)
        return image

    field = map_on_dark(evidence.lantana_photos, size)
    if t < 5.1:
        image = lidar_bridge(evidence, field, t)
    elif t < 12.0:
        image = field
        draw_legend(image, labels["field_observation"], [(GREEN, labels["lantana"])], fonts, scale)
    elif t < 20.0:
        image = map_on_dark(evidence.mudumalai_flight, size)
        draw_legend(image, labels["ground_reference"], [(AMBER, labels["lantana"]), (CYAN, labels["chromolaena"])], fonts, scale)
    else:
        image = invasive_maps(evidence, size, interval(t, 28.0, 32.0))
        draw_legend(image, labels["published_presence_class"], [(GREEN, labels["very_low"]), ((151, 194, 105), labels["low"]), ((245, 241, 170), labels["moderate"]), ((229, 127, 79), labels["high"]), ((188, 27, 29), labels["very_high"])], fonts, scale)
    return image


def encode(args: argparse.Namespace) -> None:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    header, copy = load_copy(args.captions, args.variant)
    fonts = Fonts(scale)
    evidence = Evidence(args.artifact, args.paper_dir, args.lidar, width, height)
    total = round(args.duration * args.fps)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists() and not args.overwrite:
        raise FileExistsError(f"Refusing to overwrite {args.output}")
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{width}x{height}", "-r", str(args.fps), "-i", "-",
        "-an", "-c:v", args.encoder,
    ]
    command += ["-preset", "p5", "-cq", "18", "-b:v", "0"] if args.encoder == "h264_nvenc" else ["-preset", "medium", "-crf", "17"]
    command += ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(args.output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in range(total):
            t = frame / args.fps
            image = scene(evidence, args.variant, copy, t, (width, height), fonts, scale)
            draw_interface(image, header, copy, t, fonts, scale)
            image = add_film_finish(image, frame)
            assert process.stdin is not None
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 3) == 0:
                print(f"{args.variant}: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")
    paper_files = sorted(args.paper_dir.glob("figure-*.jpg"))
    manifest = {
        "schema": "pyrocene-hyperspectral-film/1",
        "variant": args.variant,
        "output": str(args.output.resolve()),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": args.duration,
        "audio": False,
        "generated_imagery": False,
        "inputs": {
            "neon_artifact": {"path": str(args.artifact.resolve()), "sha256": sha256(args.artifact)},
            "neon_manifest": {"path": str(args.artifact.with_suffix('.manifest.json').resolve()), "sha256": sha256(args.artifact.with_suffix('.manifest.json'))},
            "lidar_bridge": {"path": str(args.lidar.resolve()), "sha256": sha256(args.lidar)},
            "captions": {"path": str(args.captions.resolve()), "sha256": sha256(args.captions)},
            "renderer": {"path": str(Path(__file__).resolve()), "sha256": sha256(Path(__file__).resolve())},
            "mudumalai_paper": {
                "doi": "10.1016/j.asr.2022.12.026",
                "title": "Mapping of understorey invasive plant species clusters of Lantana camara and Chromolaena odorata using airborne hyperspectral remote sensing",
                "figures": [{"path": str(path.resolve()), "sha256": sha256(path)} for path in paper_files] if args.variant == "invasives" else [],
                "usage": "Cropped published evidence figures for research review",
            },
        },
        "evidence_boundary": "The SOAP comparison is observational and the Mudumalai maps are published model outputs not raw species labels",
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(args.output)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--variant", required=True, choices=("water", "disturbance", "invasives"))
    result.add_argument("--artifact", type=Path, required=True)
    result.add_argument("--paper-dir", type=Path, required=True)
    result.add_argument("--lidar", type=Path, required=True)
    result.add_argument("--captions", type=Path, default=Path(__file__).with_name("captions.json"))
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--size", default="1920x1080")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--duration", type=float, default=DURATION)
    result.add_argument("--encoder", default="libx264", choices=("libx264", "h264_nvenc"))
    result.add_argument("--overwrite", action="store_true")
    return result


if __name__ == "__main__":
    encode(parser().parse_args())
