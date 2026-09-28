#!/usr/bin/env python3
"""Render one restrained film from a real Amazon photo and real LiDAR.

Every forest point comes from a prepared measurement artifact. The opening is
a credited documentary photograph. No generated imagery or synthetic point
geometry is used.
"""

from __future__ import annotations

import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from render_lidar_films import (
    CYAN,
    GREEN,
    IVORY,
    MAGENTA,
    MUTED,
    Cloud,
    PointPainter,
    clamp,
    grade,
    interval,
    lerp,
    sha256,
    smooth,
)


DURATION = 56.0


class StoryFonts:
    def __init__(self, scale: float):
        sans = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Regular.otf"
        bold = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf"
        mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
        self.header = ImageFont.truetype(bold, round(18 * scale))
        self.legend = ImageFont.truetype(bold, round(14 * scale))
        self.caption = ImageFont.truetype(sans, round(42 * scale))
        self.location = ImageFont.truetype(mono, round(15 * scale))


class PhotoPainter:
    def __init__(self, path: Path, width: int, height: int):
        self.image = Image.open(path).convert("RGB")
        self.width = width
        self.height = height

    def render(self, progress: float) -> Image.Image:
        p = smooth(progress)
        iw, ih = self.image.size
        aspect = self.width / self.height
        crop_w = min(float(iw), float(ih) * aspect) / (1.0 + 0.105 * p)
        crop_h = crop_w / aspect
        center_x = iw * (0.505 + 0.035 * p)
        center_y = ih * (0.485 - 0.018 * p)
        left = clamp(center_x - crop_w / 2, 0, iw - crop_w)
        top = clamp(center_y - crop_h / 2, 0, ih - crop_h)
        image = self.image.crop((left, top, left + crop_w, top + crop_h))
        image = image.resize((self.width, self.height), Image.Resampling.LANCZOS)
        image = ImageEnhance.Contrast(image).enhance(1.08)
        image = ImageEnhance.Color(image).enhance(0.84)
        return ImageEnhance.Brightness(image).enhance(0.76)


def load_copy(path: Path) -> dict:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-lidar-single-film/1":
        raise ValueError("Unsupported caption schema")
    for key in ("header", "legend", "locations", "sentences"):
        if key not in copy:
            raise ValueError(f"Caption file is missing {key}")
    for key in ("fire", "airborne", "terrestrial", "post_fire"):
        if key not in copy["locations"]:
            raise ValueError(f"Caption file is missing locations.{key}")
    previous = -math.inf
    for sentence in copy["sentences"]:
        if not all(key in sentence for key in ("start", "end", "text")):
            raise ValueError("Every sentence needs start end and text")
        if sentence["start"] < previous or sentence["end"] <= sentence["start"]:
            raise ValueError("Sentence times must increase and cannot overlap")
        previous = sentence["end"]
    return copy


def camera_als(t: float):
    p = smooth(clamp((t - 5.5) / 11.0))
    return (lerp((118, -158, 105), (78, -112, 55), p),
            lerp((0, 0, 14), (2, 3, 12), p), 41.0)


def camera_tls(t: float):
    p = smooth(clamp((t - 15.0) / 15.0))
    return (lerp((25, -32, 25), (-11, -19, 3.4), p),
            lerp((0, 0, 12), (0, 0, 4.8), p), 45.0)


def camera_tls_out(t: float):
    p = smooth(clamp((t - 30.0) / 6.0))
    return (lerp((-11, -19, 3.4), (104, -148, 78), p),
            lerp((0, 0, 4.8), (0, 0, 11), p), 44.0)


def camera_amazon(cloud: Cloud, t: float):
    p = smooth(clamp((t - 31.0) / 25.0))
    span = max(float(np.ptp(cloud.xyz[:, 0])), float(np.ptp(cloud.xyz[:, 1])), 180.0)
    crown = max(25.0, float(np.percentile(cloud.height, 99)))
    angle = math.radians(-45.0 + 14.0 * p)
    distance = span * (1.08 - 0.13 * p)
    eye = (math.cos(angle) * distance, math.sin(angle) * distance,
           max(crown * 2.2, span * (0.47 - 0.05 * p)))
    return eye, (0.0, 0.0, crown * (0.35 - 0.04 * p)), 38.0


def location_state(t: float) -> tuple[str, float]:
    if t < 6.8:
        return "fire", t
    if t < 16.7:
        return "airborne", t - 6.8
    if t < 33.0:
        return "terrestrial", t - 16.7
    return "post_fire", t - 33.0


def active_sentence(copy: dict, t: float) -> tuple[str, float]:
    for sentence in copy["sentences"]:
        start = float(sentence["start"])
        end = float(sentence["end"])
        if start <= t < end:
            alpha = interval(t, start, start + 0.55) * (1.0 - interval(t, end - 0.45, end))
            return sentence["text"], alpha
    return "", 0.0


def rounded_glass(image: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=radius, fill=210)
    blurred = image.filter(ImageFilter.GaussianBlur(max(5, radius // 2)))
    image.paste(blurred, (0, 0), mask)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(overlay, "RGBA").rounded_rectangle(
        box, radius=radius, fill=(2, 7, 9, 172), outline=(127, 164, 158, 38), width=1)
    image.paste(overlay, (0, 0), overlay)


def draw_legend(image: Image.Image, copy: dict, fonts: StoryFonts, scale: float, alpha: int) -> None:
    x1 = image.width - round(54 * scale)
    x0 = x1 - round(360 * scale)
    y0 = round(42 * scale)
    y1 = y0 + round(158 * scale)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((x0 + round(20 * scale), y0 + round(15 * scale)), copy["legend"]["title"],
              font=fonts.legend, fill=(*IVORY, alpha))
    colors = ((GREEN, "canopy"), (CYAN, "understory"), (MAGENTA, "low"), ((120, 91, 65), "ground"))
    for index, (color, key) in enumerate(colors):
        y = y0 + round((46 + index * 25) * scale)
        draw.ellipse((x0 + round(21 * scale), y + round(4 * scale),
                      x0 + round(29 * scale), y + round(12 * scale)), fill=(*color, alpha))
        row = copy["legend"]["rows"][key]
        draw.text((x0 + round(40 * scale), y), row["name"], font=fonts.legend,
                  fill=(*IVORY, alpha))
        draw.text((x0 + round(205 * scale), y), row["band"], font=fonts.legend,
                  fill=(*MUTED, alpha))


def draw_minimal_interface(image: Image.Image, copy: dict, t: float,
                           fonts: StoryFonts, scale: float) -> None:
    fade = interval(t, 0.0, 0.65) * (1.0 - interval(t, DURATION - 0.65, DURATION))
    alpha = round(242 * fade)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), copy["header"], font=fonts.header,
              fill=(*IVORY, alpha))
    if t >= 5.7:
        draw_legend(image, copy, fonts, scale, round(220 * fade))

    text, text_alpha = active_sentence(copy, t)
    location_key, location_elapsed = location_state(t)
    location = copy["locations"][location_key]
    typed = location[:min(len(location), max(0, int((location_elapsed - 0.3) * 31)))]
    cursor = ("▌" if typed and int(max(0.0, location_elapsed) * 2.7) % 2 == 0
              and len(typed) < len(location) else "")
    if not text and not typed:
        return
    left = round(54 * scale)
    location_box = draw.textbbox((0, 0), location, font=fonts.location)
    location_width = location_box[2] - location_box[0]
    text_box = draw.textbbox((0, 0), text, font=fonts.caption) if text else (0, 0, 0, 0)
    text_width = text_box[2] - text_box[0]
    panel_width = max(round(520 * scale), location_width + round(48 * scale),
                      text_width + round(48 * scale))
    right = min(image.width - round(54 * scale), left + panel_width)
    bottom = image.height - round(45 * scale)
    if text:
        top = bottom - round(120 * scale)
        rounded_glass(image, (left, top, right, bottom), round(13 * scale))
        draw = ImageDraw.Draw(image, "RGBA")
        draw.text((left + round(23 * scale), top + round(18 * scale)), text,
                  font=fonts.caption, fill=(*IVORY, round(255 * text_alpha * fade)))
        draw.text((left + round(24 * scale), bottom - round(31 * scale)), typed + cursor,
                  font=fonts.location, fill=(*CYAN, alpha))
    else:
        top = bottom - round(53 * scale)
        rounded_glass(image, (left, top, right, bottom), round(13 * scale))
        draw = ImageDraw.Draw(image, "RGBA")
        draw.text((left + round(22 * scale), top + round(17 * scale)), typed + cursor,
                  font=fonts.location, fill=(*CYAN, alpha))


def render_scene(t: float, photo: PhotoPainter, painter: PointPainter,
                 als: Cloud, tls: Cloud, amazon: Cloud) -> Image.Image:
    if t < 9.3:
        photo_frame = photo.render(clamp(t / 8.5))
        als_eye, als_target, als_fov = camera_als(t)
        als_frame = painter.render(als, als_eye, als_target, als_fov, "all", 0.0)
        return Image.blend(photo_frame, als_frame, interval(t, 5.2, 9.3))
    if t < 16.0:
        als_eye, als_target, als_fov = camera_als(t)
        return painter.render(als, als_eye, als_target, als_fov, "canopy-peel", interval(t, 12.0, 17.0))

    tls_eye, tls_target, tls_fov = camera_tls(t)
    if t < 25.0:
        tls_mode, tls_reveal = "all", 0.0
    else:
        tls_mode, tls_reveal = "low-reveal", interval(t, 25.0, 30.6)
    tls_frame = painter.render(tls, tls_eye, tls_target, tls_fov, tls_mode, tls_reveal)
    if t < 20.0:
        als_eye, als_target, als_fov = camera_als(t)
        als_frame = painter.render(als, als_eye, als_target, als_fov, "canopy-peel", 1.0)
        return Image.blend(als_frame, tls_frame, interval(t, 16.0, 20.0))
    if t < 30.5:
        return tls_frame

    if t < 33.0:
        out_eye, out_target, out_fov = camera_tls_out(t)
        tls_out = painter.render(tls, out_eye, out_target, out_fov, "all", 0.0)
        image = ImageEnhance.Brightness(tls_out).enhance(1.0 - interval(t, 30.5, 33.0))
    else:
        amazon_eye, amazon_target, amazon_fov = camera_amazon(amazon, t)
        amazon_reveal = 0.62 * interval(t, 40.5, 48.5)
        amazon_frame = painter.render(amazon, amazon_eye, amazon_target, amazon_fov,
                                      "canopy-peel" if t >= 40.5 else "all", amazon_reveal)
        image = ImageEnhance.Brightness(amazon_frame).enhance(interval(t, 33.0, 35.5))
    if t >= 51.2:
        image = ImageEnhance.Brightness(image).enhance(1.0 - 0.18 * interval(t, 51.2, 55.5))
    return image


def encode(args) -> None:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    copy = load_copy(args.captions)
    als = Cloud.load(args.als)
    tls = Cloud.load(args.tls)
    amazon = Cloud.load(args.amazon)
    photo = PhotoPainter(args.fire_photo, width, height)
    painter = PointPainter(width, height)
    fonts = StoryFonts(scale)
    total = round(args.duration * args.fps)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists() and not args.overwrite:
        raise FileExistsError(f"Refusing to overwrite {args.output}; pass --overwrite")
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{width}x{height}", "-r", str(args.fps),
        "-i", "-", "-an", "-c:v", args.encoder,
    ]
    command += (["-preset", "p5", "-cq", "18", "-b:v", "0"] if args.encoder == "h264_nvenc"
                else ["-preset", "medium", "-crf", "17"])
    command += ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(args.output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in range(total):
            t = frame / args.fps
            image = render_scene(t, photo, painter, als, tls, amazon)
            draw_minimal_interface(image, copy, t, fonts, scale)
            image = grade(image, frame + 70_000)
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 2) == 0:
                print(f"single_lidar_story: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")
    manifest = {
        "schema": "pyrocene-single-lidar-film/1",
        "output": str(args.output),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": args.duration,
        "audio": False,
        "output_license": "CC BY-SA 4.0 because the opening photograph is adapted under that license",
        "render_contract": {
            "generated_imagery": False,
            "procedural_forest_points": False,
            "point_colors": "measured height above ground only",
            "cross_dataset_comparison": "narrative sequence not a registered before-after pair",
        },
        "inputs": {
            "fire_photo": {
                "path": str(args.fire_photo),
                "sha256": sha256(args.fire_photo),
                "title": "Floresta Nacional do Iquiri Erick Caldas Xavier (4).jpg",
                "creator": "Erick Caldas Xavier",
                "date": "2019-09-09",
                "source": "https://commons.wikimedia.org/wiki/File:Floresta_Nacional_do_Iquiri_Erick_Caldas_Xavier_(4).jpg",
                "license": "CC BY-SA 4.0",
                "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
                "changes": "cropped animated reframed color graded",
            },
            "airborne_manifest": als.manifest,
            "terrestrial_manifest": tls.manifest,
            "amazon_manifest": amazon.manifest,
            "captions": {"path": str(args.captions), "sha256": sha256(args.captions)},
            "renderer": {"path": str(Path(__file__).resolve()), "sha256": sha256(Path(__file__).resolve())},
        },
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(args.output)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--als", type=Path, required=True)
    result.add_argument("--tls", type=Path, required=True)
    result.add_argument("--amazon", type=Path, required=True)
    result.add_argument("--fire-photo", type=Path, required=True)
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
