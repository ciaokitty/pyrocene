#!/usr/bin/env python3
"""Render silent rainforest continuity candidates from real scientific sources."""

from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

LIDAR_DIR = Path(__file__).resolve().parents[1] / "lidar"
sys.path.insert(0, str(LIDAR_DIR))
from render_lidar_films import (  # noqa: E402
    CYAN, GREEN, IVORY, MAGENTA, MUTED, Cloud, PointPainter,
    clamp, grade, interval, lerp, sha256, smooth,
)

INK = (3, 7, 9)
GROUND = (120, 91, 65)
COLORS = {"green": GREEN, "cyan": CYAN, "magenta": MAGENTA, "ground": GROUND}
FORBIDDEN = (".", "—", "→", "·")


class Fonts:
    def __init__(self, scale: float):
        sans = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Regular.otf"
        bold = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf"
        mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
        self.header = ImageFont.truetype(bold, round(18 * scale))
        self.legend = ImageFont.truetype(bold, round(14 * scale))
        self.caption = ImageFont.truetype(sans, round(42 * scale))
        self.location = ImageFont.truetype(mono, round(15 * scale))


def load_copy(path: Path) -> dict:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-rainforest-continuity/1":
        raise ValueError("Unsupported caption schema")

    def inspect(value, route="copy"):
        if isinstance(value, str):
            for mark in FORBIDDEN:
                if mark in value:
                    raise ValueError(f"Forbidden on screen character {mark!r} in {route}")
        elif isinstance(value, dict):
            for key, item in value.items():
                inspect(item, f"{route}.{key}")
        elif isinstance(value, list):
            for index, item in enumerate(value):
                inspect(item, f"{route}[{index}]")

    inspect(copy)
    return copy


def active_sentence(film: dict, t: float) -> tuple[str, float]:
    for sentence in film["sentences"]:
        start, end = float(sentence["start"]), float(sentence["end"])
        if start <= t < end:
            alpha = interval(t, start, start + 0.5) * (1.0 - interval(t, end - 0.45, end))
            return sentence["text"], alpha
    return "", 0.0


def rounded_glass(image: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=radius, fill=205)
    blurred = image.filter(ImageFilter.GaussianBlur(max(5, radius // 2)))
    image.paste(blurred, (0, 0), mask)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(overlay, "RGBA").rounded_rectangle(
        box, radius=radius, fill=(2, 7, 9, 166), outline=(127, 164, 158, 38), width=1)
    image.paste(overlay, (0, 0), overlay)


def draw_legend(image: Image.Image, legend: dict, fonts: Fonts, scale: float,
                alpha: int = 220) -> None:
    x1 = image.width - round(54 * scale)
    x0 = x1 - round(372 * scale)
    y0 = round(42 * scale)
    rows = legend["rows"]
    y1 = y0 + round((55 + len(rows) * 27) * scale)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((x0 + round(20 * scale), y0 + round(15 * scale)), legend["title"],
              font=fonts.legend, fill=(*IVORY, alpha))
    for index, (name, detail, color_name) in enumerate(rows):
        y = y0 + round((46 + index * 27) * scale)
        color = COLORS[color_name]
        draw.ellipse((x0 + round(21 * scale), y + round(4 * scale),
                      x0 + round(29 * scale), y + round(12 * scale)), fill=(*color, alpha))
        draw.text((x0 + round(40 * scale), y), name, font=fonts.legend, fill=(*IVORY, alpha))
        detail_box = draw.textbbox((0, 0), detail, font=fonts.legend)
        draw.text((x1 - round(20 * scale) - (detail_box[2] - detail_box[0]), y), detail,
                  font=fonts.legend, fill=(*MUTED, alpha))


def fit_caption(text: str, draw: ImageDraw.ImageDraw, font: ImageFont.FreeTypeFont,
                maximum: int) -> str:
    words = text.split()
    lines, line = [], []
    for word in words:
        candidate = " ".join(line + [word])
        if line and draw.textlength(candidate, font=font) > maximum:
            lines.append(" ".join(line))
            line = [word]
        else:
            line.append(word)
    if line:
        lines.append(" ".join(line))
    return "\n".join(lines)


def draw_interface(image: Image.Image, copy: dict, film_key: str, t: float,
                   fonts: Fonts, scale: float, legend_key: str) -> None:
    film = copy["films"][film_key]
    duration = float(film["duration"])
    fade = interval(t, 0, 0.55) * (1.0 - interval(t, duration - 0.55, duration))
    alpha = round(242 * fade)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), copy["header"], font=fonts.header,
              fill=(*IVORY, alpha))
    draw_legend(image, copy[legend_key], fonts, scale, round(220 * fade))

    text, text_alpha = active_sentence(film, t)
    location = film["location"]
    typed = location[:min(len(location), max(0, int((t - 0.25) * 34)))]
    cursor = "▌" if typed and int(t * 2.7) % 2 == 0 and len(typed) < len(location) else ""
    left, right = round(54 * scale), image.width - round(54 * scale)
    bottom = image.height - round(45 * scale)
    wrapped = fit_caption(text, draw, fonts.caption, round(1320 * scale))
    lines = max(1, wrapped.count("\n") + 1)
    top = bottom - round((116 + (lines - 1) * 45) * scale)
    rounded_glass(image, (left, top, right, bottom), round(13 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.multiline_text((left + round(23 * scale), top + round(16 * scale)), wrapped,
                        font=fonts.caption, spacing=round(3 * scale),
                        fill=(*IVORY, round(255 * text_alpha * fade)))
    draw.text((left + round(24 * scale), bottom - round(31 * scale)), typed + cursor,
              font=fonts.location, fill=(*CYAN, alpha))


def crop_fill(image: Image.Image, size: tuple[int, int], zoom=1.0,
              center=(0.5, 0.5)) -> Image.Image:
    width, height = size
    iw, ih = image.size
    aspect = width / height
    crop_w = min(iw, ih * aspect) / zoom
    crop_h = crop_w / aspect
    cx, cy = iw * center[0], ih * center[1]
    left = clamp(cx - crop_w / 2, 0, iw - crop_w)
    top = clamp(cy - crop_h / 2, 0, ih - crop_h)
    return image.crop((left, top, left + crop_w, top + crop_h)).resize(
        size, Image.Resampling.LANCZOS)


class ScientificPanels:
    def __init__(self, seely: Path, liana: Path,
                 asner_aligned: Path, size: tuple[int, int]):
        self.size = size
        source = Image.open(seely).convert("RGB")
        self.seely = {
            "low": source.crop((128, 82, 650, 498)),
            "moderate": source.crop((742, 84, 1254, 498)),
            "high": source.crop((1326, 166, 1840, 498)),
        }
        liana_source = Image.open(liana).convert("RGB")
        self.liana = liana_source.crop((440, 8, 610, 342))
        aligned_source = Image.open(asner_aligned).convert("RGB")
        aligned_crops = {
            "lidar": aligned_source.crop((352, 5, 673, 335)),
            "composition": aligned_source.crop((10, 491, 331, 821)),
            "detection": aligned_source.crop((694, 491, 1015, 821)),
        }
        self.aligned = {
            "lidar": self._style_aligned(aligned_crops["lidar"], "lidar"),
            "composition": self._style_aligned(aligned_crops["composition"], "composition"),
            "detection": self._style_aligned(aligned_crops["detection"], "detection"),
        }

    @staticmethod
    def _style_aligned(source: Image.Image, mode: str) -> Image.Image:
        array = np.asarray(source, dtype=np.uint8)
        rgb = array.astype(np.float32)
        brightness = rgb.mean(axis=2)
        active = brightness > 18
        styled = np.zeros_like(array)
        styled[:] = INK
        if mode == "lidar":
            values = brightness[active]
            low, high = np.percentile(values, (3, 97))
            value = np.clip((brightness - low) / max(1, high - low), 0, 1)
            result = np.zeros_like(rgb)
            first = value <= 0.30
            middle = (value > 0.30) & (value <= 0.68)
            last = value > 0.68
            amount = np.clip(value / 0.30, 0, 1)[..., None]
            result[first] = (np.asarray(MAGENTA) * (1 - amount[first]) +
                             np.asarray(CYAN) * amount[first])
            amount = np.clip((value - 0.30) / 0.38, 0, 1)[..., None]
            result[middle] = (np.asarray(CYAN) * (1 - amount[middle]) +
                              np.asarray(GREEN) * amount[middle])
            amount = np.clip((value - 0.68) / 0.32, 0, 1)[..., None]
            result[last] = (np.asarray(GREEN) * (1 - amount[last]) +
                            np.asarray(IVORY) * amount[last])
            styled[active] = result[active].astype(np.uint8)
        elif mode == "composition":
            red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
            weights = np.stack((red, green, blue), axis=2)
            weights /= np.maximum(weights.sum(axis=2, keepdims=True), 1)
            result = (weights[..., 0:1] * np.asarray(MAGENTA) +
                      weights[..., 1:2] * np.asarray(GREEN) +
                      weights[..., 2:3] * np.asarray(CYAN))
            contrast = np.clip((brightness / 155.0)[..., None], 0.55, 1.18)
            styled[active] = np.clip(result * contrast, 0, 255)[active].astype(np.uint8)
        else:
            red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
            invasive = active & (red > blue * 1.08) & (red > 70)
            native = active & (green >= red * 0.72) & ~invasive
            screened = active & ~(invasive | native)
            styled[invasive] = MAGENTA
            styled[native] = CYAN
            styled[screened] = (45, 57, 57)
        return Image.fromarray(styled, "RGB")

    def point_panel(self, source: Image.Image, mode: str, zoom: float = 1.0,
                    reveal: float = 1.0) -> Image.Image:
        width, height = self.size
        canvas = Image.new("RGB", self.size, INK)
        arr = np.asarray(source, dtype=np.uint8)
        gray = arr.mean(axis=2)
        if mode == "liana":
            mask = gray < 247
            classified = gray < 105
        else:
            saturation = arr.max(axis=2) - arr.min(axis=2)
            mask = (saturation > 24) & (gray < 250)
            classified = np.zeros_like(mask)
        rgba = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
        yy = np.linspace(0, 1, arr.shape[0])[:, None]
        palette = np.empty((*arr.shape[:2], 3), dtype=np.float32)
        low = yy > 0.80
        under = (yy > 0.42) & (yy <= 0.80)
        canopy = yy <= 0.42
        palette[:] = CYAN
        if mode != "liana":
            palette[np.broadcast_to(low, mask.shape)] = MAGENTA
            palette[np.broadcast_to(under, mask.shape)] = CYAN
            palette[np.broadcast_to(canopy, mask.shape)] = GREEN
        palette[classified] = MAGENTA
        active = mask & ((~classified) | (np.random.default_rng(9).random(mask.shape) < reveal))
        rgba[..., :3] = palette.astype(np.uint8)
        rgba[..., 3] = np.where(active, np.clip((255 - gray) * 2.2 + 90, 0, 255), 0).astype(np.uint8)
        panel = Image.fromarray(rgba, "RGBA")
        target_h = round(height * 0.70 * zoom)
        target_w = round(target_h * panel.width / panel.height)
        if target_w > round(width * 0.83 * zoom):
            target_w = round(width * 0.83 * zoom)
            target_h = round(target_w * panel.height / panel.width)
        panel = panel.resize((target_w, target_h), Image.Resampling.LANCZOS)
        glow = Image.new("RGBA", self.size, (0, 0, 0, 0))
        x, y = (width - target_w) // 2, round(height * 0.47 - target_h / 2)
        glow.paste(panel, (x, y), panel)
        halo = glow.filter(ImageFilter.GaussianBlur(5))
        halo_alpha = halo.getchannel("A").point(lambda value: round(value * 0.28))
        halo.putalpha(halo_alpha)
        canvas = Image.alpha_composite(canvas.convert("RGBA"), halo)
        canvas = Image.alpha_composite(canvas, glow)
        return canvas.convert("RGB")

    def aligned_panel(self, mode: str, zoom: float = 1.0) -> Image.Image:
        width, height = self.size
        source = self.aligned[mode]
        background = Image.new("RGB", self.size, INK)
        target_h = round(height * 0.76 * zoom)
        target_w = round(target_h * source.width / source.height)
        source = source.filter(ImageFilter.GaussianBlur(0.42))
        panel = source.resize((target_w, target_h), Image.Resampling.LANCZOS)
        x = (width - target_w) // 2
        y = round(height * 0.43 - target_h / 2)
        background.paste(panel, (x, y))
        bloom = background.filter(ImageFilter.GaussianBlur(5))
        return Image.blend(background, bloom, 0.06)


def tls_camera(cloud: Cloud, t: float):
    crown = float(np.percentile(cloud.height, 99.7))
    span = max(float(np.ptp(cloud.xyz[:, 0])), float(np.ptp(cloud.xyz[:, 1])))
    p = smooth(clamp(t / 16.0))
    angle = math.radians(-92 + 20 * p)
    distance = max(span * 1.9, crown * 0.82)
    eye = (math.cos(angle) * distance, math.sin(angle) * distance, crown * (0.52 - 0.08 * p))
    return eye, (0, 0, crown * 0.42), 38.0


def als_camera(cloud: Cloud, t: float):
    span = max(float(np.ptp(cloud.xyz[:, 0])), float(np.ptp(cloud.xyz[:, 1])))
    crown = float(np.percentile(cloud.height, 99.5))
    p = smooth(clamp(t / 18.0))
    angle = math.radians(-52 + 12 * p)
    distance = span * (0.92 - 0.10 * p)
    eye = (math.cos(angle) * distance, math.sin(angle) * distance, span * (0.53 + 0.18 * p))
    return eye, (0, 0, crown * 0.25), 39.0 - 2 * p


def render_liana(t: float, painter: PointPainter, als: Cloud, als_liana: Cloud,
                 panels: ScientificPanels) -> tuple[Image.Image, str]:
    eye, target, fov = als_camera(als, t)
    reference = painter.render(als, eye, target, fov, "all", 0)
    liana_zone = painter.render(als_liana, eye, target, fov,
                                "canopy-peel" if t >= 8 else "all", interval(t, 9, 14))
    cloud = Image.blend(reference, liana_zone, interval(t, 5, 11))
    if t < 13:
        return cloud, "height_legend"
    reveal = interval(t, 17, 24)
    panel = panels.point_panel(panels.liana, "liana", 1.0 + 0.035 * interval(t, 18, 31), reveal)
    return Image.blend(cloud, panel, interval(t, 13, 17)), (
        "class_legend" if t >= 16 else "height_legend")


def render_invasive(t: float, panels: ScientificPanels) -> tuple[Image.Image, str]:
    low = panels.point_panel(panels.seely["low"], "height", 1.0 + 0.015 * smooth(t / 8))
    moderate = panels.point_panel(panels.seely["moderate"], "height", 1.0)
    high = panels.point_panel(panels.seely["high"], "height", 1.0 + 0.02 * interval(t, 12, 20))
    if t < 8:
        return low, "height_legend"
    if t < 13:
        return Image.blend(low, moderate, interval(t, 8, 13)), "height_legend"
    if t < 20:
        return Image.blend(moderate, high, interval(t, 13, 18)), "height_legend"
    lidar_map = panels.aligned_panel("lidar", 1.0 + 0.02 * interval(t, 18, 24))
    composition = panels.aligned_panel("composition", 1.02)
    detection = panels.aligned_panel("detection", 1.02 + 0.018 * interval(t, 30, 36))
    if t < 23:
        return Image.blend(high, lidar_map, interval(t, 18, 23)), "height_legend"
    if t < 30:
        return Image.blend(lidar_map, composition, interval(t, 23, 27.5)), "composition_legend"
    return Image.blend(composition, detection, interval(t, 30, 34)), "spectral_legend"


def encode_one(args, film_key: str, copy: dict, tls: Cloud, als: Cloud, als_liana: Cloud,
               panels: ScientificPanels) -> Path:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    duration = float(copy["films"][film_key]["duration"])
    painter = PointPainter(width, height)
    fonts = Fonts(scale)
    output = args.output_dir / f"{film_key.replace('_', '-')}.mp4"
    output.parent.mkdir(parents=True, exist_ok=True)
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
               "-pix_fmt", "rgb24", "-s", f"{width}x{height}", "-r", str(args.fps),
               "-i", "-", "-an", "-c:v", args.encoder]
    command += (["-preset", "p5", "-cq", "18", "-b:v", "0"] if args.encoder == "h264_nvenc"
                else ["-preset", "medium", "-crf", "17"])
    command += ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    total = round(duration * args.fps)
    try:
        for frame in range(total):
            t = frame / args.fps
            if film_key == "liana_structure":
                image, legend = render_liana(t, painter, als, als_liana, panels)
            elif film_key == "invasive_identity":
                image, legend = render_invasive(t, panels)
            else:
                raise ValueError(f"Unsupported candidate {film_key}")
            draw_interface(image, copy, film_key, t, fonts, scale, legend)
            image = grade(image, frame + {"liana_structure": 91000,
                                          "invasive_identity": 92000}[film_key])
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 2) == 0:
                print(f"{film_key}: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")
    manifest = {
        "schema": "pyrocene-rainforest-continuity-film/1",
        "candidate": film_key,
        "output": str(output),
        "output_sha256": sha256(output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": duration,
        "audio": False,
        "generated_imagery": False,
        "procedural_forest_points": False,
        "inputs": {
            "tls": tls.manifest,
            "als": als.manifest,
            "als_liana_zone": als_liana.manifest,
            "seely_figure": str(args.seely_figure),
            "liana_figure": str(args.liana_figure),
            "asner_aligned_figure": str(args.asner_aligned_figure),
            "captions": str(args.captions)
        },
        "evidence_boundary": {
            "liana_panel": "Published model labels are recolored but their measured pixel geometry is preserved",
            "seely_panels": "Published TLS plots are grouped by field measured invasive abundance and recolored by height for continuity",
            "spectral_panel": "Published aligned LiDAR height spectral composition and invasive detection panels from one fifty three hectare Hawaiian forest stand"
        }
    }
    output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--tls", type=Path, required=True)
    result.add_argument("--als", type=Path, required=True)
    result.add_argument("--als-liana", type=Path, required=True)
    result.add_argument("--seely-figure", type=Path, required=True)
    result.add_argument("--liana-figure", type=Path, required=True)
    result.add_argument("--asner-aligned-figure", type=Path, required=True)
    result.add_argument("--captions", type=Path, default=Path(__file__).with_name("captions.json"))
    result.add_argument("--candidate", choices=("all", "liana_structure", "invasive_identity"), default="all")
    result.add_argument("--output-dir", type=Path, required=True)
    result.add_argument("--size", default="1920x1080")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--encoder", choices=("libx264", "h264_nvenc"), default="h264_nvenc")
    return result


def main() -> None:
    args = parser().parse_args()
    copy = load_copy(args.captions)
    tls, als, als_liana = Cloud.load(args.tls), Cloud.load(args.als), Cloud.load(args.als_liana)
    size = tuple(map(int, args.size.lower().split("x")))
    panels = ScientificPanels(args.seely_figure, args.liana_figure,
                              args.asner_aligned_figure, size)
    names = tuple(copy["films"]) if args.candidate == "all" else (args.candidate,)
    for name in names:
        print(encode_one(args, name, copy, tls, als, als_liana, panels))


if __name__ == "__main__":
    main()
