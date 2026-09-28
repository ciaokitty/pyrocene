#!/usr/bin/env python3
"""Render the real Central Amazon 2017/2018 repeat-LiDAR change film."""

from __future__ import annotations

import argparse
import json
import math
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

from render_lidar_films import (
    AMBER,
    CYAN,
    INK,
    IVORY,
    MUTED,
    Cloud,
    Fonts,
    PointPainter,
    clamp,
    draw_interface,
    grade,
    interval,
    lerp,
    load_caption_copy,
    project,
    sha256,
    smooth,
)


LOSS = (239, 92, 74)
STABLE = (178, 185, 177)
GAIN = (74, 207, 191)


@dataclass
class AmazonSeries:
    cloud_2017: Cloud
    cloud_2018: Cloud
    grid_x: np.ndarray
    grid_y: np.ndarray
    chm_2017: np.ndarray
    chm_2018: np.ndarray
    chm_delta: np.ndarray
    manifest: dict

    @classmethod
    def load(cls, path: Path) -> "AmazonSeries":
        data = np.load(path)
        manifest = json.loads(path.with_suffix(".manifest.json").read_text())

        def cloud(year: str) -> Cloud:
            return Cloud(
                data[f"xyz_{year}"], data[f"height_{year}"],
                data[f"intensity_{year}"], data[f"classification_{year}"], manifest,
            )

        return cls(
            cloud("2017"), cloud("2018"), data["grid_x"], data["grid_y"],
            data["chm_2017"], data["chm_2018"], data["chm_delta"], manifest,
        )


def camera_for(series: AmazonSeries, progress: float, locked: bool = False):
    points = series.cloud_2017.xyz
    center_x = float((points[:, 0].min() + points[:, 0].max()) * 0.5)
    center_y = float((points[:, 1].min() + points[:, 1].max()) * 0.5)
    span = max(float(np.ptp(points[:, 0])), float(np.ptp(points[:, 1])), 120.0)
    crown = max(25.0, float(np.percentile(series.cloud_2017.height, 99)))
    p = 0.5 if locked else smooth(progress)
    azimuth = math.radians(-34.0 + 8.0 * p)
    distance = span * (1.04 - 0.08 * p)
    eye = (center_x + math.cos(azimuth) * distance,
           center_y + math.sin(azimuth) * distance,
           max(crown * 2.0, span * 0.48))
    target = (center_x, center_y, crown * 0.34)
    return eye, target, 38.0


def change_cloud(series: AmazonSeries) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    gx, gy = np.meshgrid(series.grid_x, series.grid_y)
    valid = np.isfinite(series.chm_2017) & np.isfinite(series.chm_2018)
    xyz = np.column_stack((gx[valid], gy[valid], series.chm_2018[valid])).astype(np.float32)
    delta = series.chm_delta[valid].astype(np.float32)
    colors = np.empty((len(delta), 3), dtype=np.float32)
    colors[delta <= -2.0] = np.asarray(LOSS) / 255.0
    colors[(delta > -2.0) & (delta < 2.0)] = np.asarray(STABLE) / 255.0
    colors[delta >= 2.0] = np.asarray(GAIN) / 255.0
    return xyz, delta, colors


def render_colored_points(painter: PointPainter, xyz: np.ndarray, colors: np.ndarray,
                          eye, target, fov: float) -> Image.Image:
    sx, sy, depth, visible = project(xyz, eye, target, painter.rw, painter.rh, fov)
    colors = colors[visible]
    depth_light = np.clip(1.45 - depth / max(30.0, np.percentile(depth, 98)), 0.46, 1.18)
    alpha = depth_light.astype(np.float32) * 1.15
    xi, yi = np.rint(sx).astype(np.int32), np.rint(sy).astype(np.int32)
    acc = np.zeros((painter.rh * painter.rw, 3), dtype=np.float32)
    for dx, dy, weight in ((0, 0, 1.0), (1, 0, .42), (-1, 0, .42),
                           (0, 1, .42), (0, -1, .42)):
        xx, yy = xi + dx, yi + dy
        ok = (xx >= 0) & (xx < painter.rw) & (yy >= 0) & (yy < painter.rh)
        index = yy[ok] * painter.rw + xx[ok]
        for channel in range(3):
            acc[:, channel] += np.bincount(
                index, weights=colors[ok, channel] * alpha[ok] * weight,
                minlength=painter.rh * painter.rw,
            )
    light = 1.0 - np.exp(-acc.reshape((painter.rh, painter.rw, 3)) * 0.88)
    array = np.clip(painter.background + light * 255.0, 0, 255).astype(np.uint8)
    core = Image.fromarray(array, "RGB")
    glow = core.filter(ImageFilter.GaussianBlur(1.8))
    return Image.blend(core, glow, 0.14).resize(
        (painter.width, painter.height), Image.Resampling.LANCZOS,
    )


def wipe(left: Image.Image, right: Image.Image, amount: float) -> Image.Image:
    amount = smooth(amount)
    boundary = int(left.width * amount)
    feather = max(2, left.width // 160)
    mask = Image.new("L", left.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, 0, max(0, boundary - feather), left.height), fill=255)
    if boundary > 0:
        for x in range(max(0, boundary - feather), min(left.width, boundary + feather)):
            value = round(255 * (boundary + feather - x) / max(1, feather * 2))
            draw.line((x, 0, x, left.height), fill=value)
    return Image.composite(right, left, mask)


def draw_epoch_label(image: Image.Image, text: str, x: int, y: int, fonts: Fonts,
                     color=CYAN) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    box = draw.textbbox((0, 0), text, font=fonts.micro)
    width = box[2] - box[0]
    draw.rectangle((x - 12, y - 8, x + width + 12, y + 28), fill=(2, 6, 8, 178))
    draw.text((x, y), text, font=fonts.micro, fill=(*color, 232))


def draw_wipe_marker(image: Image.Image, amount: float, captions: dict, fonts: Fonts) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    x = round(image.width * smooth(amount))
    draw.line((x, 92, x, image.height - 302), fill=(*IVORY, 205), width=2)
    instruction = captions["amazon_ui"]["wipe_instruction"]
    bbox = draw.textbbox((0, 0), instruction, font=fonts.micro)
    draw.rectangle((image.width // 2 - (bbox[2] - bbox[0]) // 2 - 14, 91,
                    image.width // 2 + (bbox[2] - bbox[0]) // 2 + 14, 127),
                   fill=(2, 6, 8, 170))
    draw.text((image.width // 2 - (bbox[2] - bbox[0]) // 2, 99), instruction,
              font=fonts.micro, fill=(*MUTED, 230))


def draw_change_legend(image: Image.Image, captions: dict, fonts: Fonts) -> None:
    copy = captions["amazon_ui"]
    draw = ImageDraw.Draw(image, "RGBA")
    x, y = image.width - 560, 110
    draw.rectangle((x - 24, y - 20, image.width - 58, y + 150), fill=(2, 6, 8, 178))
    draw.text((x, y), copy["change_title"], font=fonts.micro, fill=(*IVORY, 235))
    for i, (color, key) in enumerate(((LOSS, "height_loss"), (STABLE, "little_change"),
                                      (GAIN, "height_gain"))):
        yy = y + 38 + i * 28
        draw.rectangle((x, yy + 2, x + 13, yy + 15), fill=(*color, 245))
        draw.text((x + 24, yy), copy[key], font=fonts.micro, fill=(*IVORY, 230))
    draw.text((x, y + 126), copy["change_ranges"], font=fonts.micro, fill=(*MUTED, 220))


def draw_profile(image: Image.Image, series: AmazonSeries, captions: dict, fonts: Fonts) -> None:
    copy = captions["amazon_ui"]
    draw = ImageDraw.Draw(image, "RGBA")
    left, top, right, bottom = image.width - 660, 112, image.width - 70, image.height - 330
    draw.rectangle((left - 28, top - 22, right + 12, bottom + 30), fill=(2, 6, 8, 196))
    draw.text((left, top), copy["profile_title"], font=fonts.micro, fill=(*IVORY, 240))
    draw.text((left, top + 28), copy["profile_note"], font=fonts.micro, fill=(*MUTED, 215))
    chart_top, chart_bottom = top + 78, bottom - 22
    chart_left, chart_right = left + 56, right - 8
    bins = np.arange(0, 52, 2)
    h17, _ = np.histogram(np.clip(series.cloud_2017.height, 0, 50), bins=bins)
    h18, _ = np.histogram(np.clip(series.cloud_2018.height, 0, 50), bins=bins)
    h17 = h17 / max(1, h17.sum())
    h18 = h18 / max(1, h18.sum())
    scale = max(float(h17.max()), float(h18.max()))
    centers = (bins[:-1] + bins[1:]) * 0.5
    points17, points18 = [], []
    for value17, value18, height in zip(h17, h18, centers):
        y = chart_bottom - (height / 50.0) * (chart_bottom - chart_top)
        points17.append((chart_left + value17 / scale * (chart_right - chart_left), y))
        points18.append((chart_left + value18 / scale * (chart_right - chart_left), y))
    draw.line((chart_left, chart_top, chart_left, chart_bottom), fill=(*MUTED, 110), width=1)
    draw.line((chart_left, chart_bottom, chart_right, chart_bottom), fill=(*MUTED, 110), width=1)
    draw.line(points17, fill=(*CYAN, 230), width=4)
    draw.line(points18, fill=(*AMBER, 230), width=4)
    draw.text((chart_left + 20, chart_top + 2), copy["height_axis"], font=fonts.micro,
              fill=(*MUTED, 205))
    draw.text((chart_right - 228, chart_bottom + 8), copy["share_axis"], font=fonts.micro,
              fill=(*MUTED, 205))
    draw_epoch_label(image, copy["epoch_2017"], left, bottom - 6, fonts, CYAN)
    draw_epoch_label(image, copy["epoch_2018"], left + 278, bottom - 6, fonts, AMBER)

    stats_x, stats_y = 72, 132
    for i, key in enumerate(("published_mean_height", "published_carbon", "published_gap")):
        draw.text((stats_x, stats_y + i * 48), copy[key], font=fonts.body,
                  fill=(*IVORY, 232))
    draw.text((stats_x, stats_y + 160), copy["published_note"], font=fonts.micro,
              fill=(*MUTED, 215))


def render_frame(t: float, duration: float, series: AmazonSeries, painter: PointPainter,
                 captions: dict, fonts: Fonts, diff_xyz: np.ndarray,
                 diff_colors: np.ndarray) -> Image.Image:
    locked = 10.8 <= t < 28.5
    eye, target, fov = camera_for(series, clamp(t / 36.0), locked=locked)
    frame17 = painter.render(series.cloud_2017, eye, target, fov, "all", 1.0)

    if t < 11.2:
        image = frame17
        if t < 5.5:
            image = ImageEnhance.Brightness(image).enhance(0.48 + 0.52 * interval(t, 0.4, 4.8))
        draw_epoch_label(image, captions["amazon_ui"]["epoch_2017"], 72, 102, fonts, CYAN)
    elif t < 20.0:
        frame18 = painter.render(series.cloud_2018, eye, target, fov, "all", 1.0)
        amount = clamp((t - 11.2) / 7.4)
        image = wipe(frame17, frame18, amount)
        draw_epoch_label(image, captions["amazon_ui"]["epoch_2017"], 72, 102, fonts, CYAN)
        text18 = captions["amazon_ui"]["epoch_2018"]
        bbox = ImageDraw.Draw(image).textbbox((0, 0), text18, font=fonts.micro)
        draw_epoch_label(image, text18, image.width - 72 - (bbox[2] - bbox[0]), 102, fonts, AMBER)
        draw_wipe_marker(image, amount, captions, fonts)
    elif t < 28.5:
        image = render_colored_points(painter, diff_xyz, diff_colors, eye, target, fov)
        draw_change_legend(image, captions, fonts)
    else:
        image = painter.render(series.cloud_2018, eye, target, fov, "all", 1.0)
        if t < 36.0:
            draw_profile(image, series, captions, fonts)
        else:
            image = ImageEnhance.Brightness(image).enhance(1.0 - 0.42 * interval(t, 36, 41.4))

    draw_interface(image, captions, "amazon_change", t, duration, fonts)
    return image


def encode(args) -> None:
    series = AmazonSeries.load(args.series)
    captions = load_caption_copy(args.captions)
    if "amazon_ui" not in captions:
        raise ValueError("Caption file is missing amazon_ui")
    width, height = map(int, args.size.lower().split("x"))
    fonts = Fonts(width / 1920)
    painter = PointPainter(width, height)
    diff_xyz, _, diff_colors = change_cloud(series)
    duration = args.duration
    total = round(duration * args.fps)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists() and not args.overwrite:
        raise FileExistsError(f"Refusing to overwrite {args.output}; pass --overwrite")

    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{width}x{height}", "-r", str(args.fps),
        "-i", "-", "-an", "-c:v", args.encoder,
    ]
    if args.encoder == "h264_nvenc":
        command += ["-preset", "p5", "-cq", "18", "-b:v", "0"]
    else:
        command += ["-preset", "medium", "-crf", "17"]
    command += ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(args.output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in range(total):
            t = frame / args.fps
            image = render_frame(t, duration, series, painter, captions, fonts,
                                 diff_xyz, diff_colors)
            image = grade(image, frame + 20_000)
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 2) == 0:
                print(f"amazon_change: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")

    manifest = {
        "film": "amazon_change",
        "output": str(args.output.resolve()),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": duration,
        "audio": False,
        "render_contract": {
            "point_cloud_geometry": "real EBA measured returns from two post-fire surveys",
            "canopy_change": "matched 1 m CHM cells, 2018 minus 2017",
            "wipe": "two epochs shown with one locked camera; points are not morphed",
            "procedural_points": False,
            "causal_limit": "the repeat survey shows fire legacy, not ignition or fire spread",
        },
        "inputs": {
            "series_manifest": series.manifest,
            "renderer": {"path": str(Path(__file__).resolve()), "sha256": sha256(Path(__file__))},
            "captions": {"path": str(args.captions.resolve()), "sha256": sha256(args.captions)},
        },
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(args.output)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--series", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--captions", type=Path,
                        default=Path(__file__).with_name("captions.json"))
    parser.add_argument("--size", default="1920x1080")
    parser.add_argument("--fps", type=int, default=24)
    parser.add_argument("--duration", type=float, default=42.0)
    parser.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    parser.add_argument("--overwrite", action="store_true")
    encode(parser.parse_args())


if __name__ == "__main__":
    main()
