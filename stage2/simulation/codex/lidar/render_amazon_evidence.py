#!/usr/bin/env python3
"""Render an honest Amazon repeat-LiDAR evidence cut from public artifacts.

The public EBA archive supplies the real 2017 point cloud but does not contain
the paper's cited 2018 strips. This renderer combines that measured geometry,
the authors' official fire-scar raster, and exact published repeat-survey
metrics. It never fabricates a second point cloud.
"""

from __future__ import annotations

import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
import rasterio
import shapefile
from PIL import Image, ImageDraw, ImageEnhance

from render_lidar_films import (
    AMBER,
    CYAN,
    IVORY,
    MUTED,
    Cloud,
    Fonts,
    PointPainter,
    clamp,
    draw_interface,
    grade,
    interval,
    load_caption_copy,
    sha256,
    smooth,
)


CORAL = (241, 96, 73)
TEAL = (41, 104, 103)


class StudyMap:
    def __init__(self, mask_path: Path, tiles_path: Path, width: int, height: int):
        self.width, self.height = width, height
        with rasterio.open(mask_path) as source:
            mask = source.read(1)
            transform = source.transform
        tiles = shapefile.Reader(str(tiles_path))
        bounds = [shape.shape.bbox for shape in tiles.iterShapeRecords()]
        left = min(b[0] for b in bounds) - 250
        bottom = min(b[1] for b in bounds) - 250
        right = max(b[2] for b in bounds) + 250
        top = max(b[3] for b in bounds) + 250
        row0, col0 = rasterio.transform.rowcol(transform, left, top)
        row1, col1 = rasterio.transform.rowcol(transform, right, bottom)
        row0, row1 = sorted((max(0, row0), min(mask.shape[0], row1)))
        col0, col1 = sorted((max(0, col0), min(mask.shape[1], col1)))
        crop = mask[row0:row1 + 1, col0:col1 + 1]
        rgb = np.zeros((*crop.shape, 3), dtype=np.uint8)
        rgb[:] = (3, 8, 10)
        rgb[crop == 0] = TEAL
        rgb[crop == 1] = CORAL
        base = Image.fromarray(rgb).resize((width, height), Image.Resampling.NEAREST)
        draw = ImageDraw.Draw(base, "RGBA")

        def screen(x: float, y: float) -> tuple[float, float]:
            return ((x - left) / (right - left) * width,
                    (top - y) / (top - bottom) * height)

        for item in tiles.iterShapeRecords():
            points = item.shape.points
            parts = list(item.shape.parts) + [len(points)]
            for start, end in zip(parts, parts[1:]):
                draw.line([screen(x, y) for x, y in points[start:end]],
                          fill=(*IVORY, 185), width=max(1, width // 960))
        self.base = base

    def render(self, progress: float) -> Image.Image:
        scale = 1.08 - 0.08 * smooth(progress)
        nw, nh = round(self.width * scale), round(self.height * scale)
        image = self.base.resize((nw, nh), Image.Resampling.BICUBIC)
        left = round((nw - self.width) * (0.25 + 0.25 * smooth(progress)))
        top = round((nh - self.height) * 0.45)
        return image.crop((left, top, left + self.width, top + self.height))


def camera(cloud: Cloud, progress: float):
    span = max(float(np.ptp(cloud.xyz[:, 0])), float(np.ptp(cloud.xyz[:, 1])), 180.0)
    crown = max(25.0, float(np.percentile(cloud.height, 99)))
    angle = math.radians(-42 + 10 * smooth(progress))
    distance = span * (1.05 - 0.10 * smooth(progress))
    eye = (math.cos(angle) * distance, math.sin(angle) * distance,
           max(crown * 2.2, span * 0.44))
    return eye, (0.0, 0.0, crown * 0.34), 38.0


def badge(image: Image.Image, text: str, fonts: Fonts, color=CYAN) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    x, y = 70, 104
    box = draw.textbbox((0, 0), text, font=fonts.micro)
    draw.rectangle((x - 13, y - 8, x + box[2] - box[0] + 13, y + 28),
                   fill=(2, 6, 8, 184))
    draw.text((x, y), text, font=fonts.micro, fill=(*color, 235))


def map_legend(image: Image.Image, captions: dict, fonts: Fonts) -> None:
    copy = captions["amazon_evidence_ui"]
    draw = ImageDraw.Draw(image, "RGBA")
    x, y = image.width - 530, 100
    draw.rectangle((x - 24, y - 18, image.width - 62, y + 158), fill=(2, 6, 8, 190))
    draw.text((x, y), copy["mask_title"], font=fonts.micro, fill=(*IVORY, 240))
    draw.text((x, y + 29), copy["mask_subtitle"], font=fonts.micro, fill=(*MUTED, 220))
    for i, (color, key) in enumerate(((CORAL, "burned"), (TEAL, "not_burned"))):
        yy = y + 68 + 29 * i
        draw.rectangle((x, yy, x + 16, yy + 16), fill=(*color, 255))
        draw.text((x + 27, yy - 2), copy[key], font=fonts.micro, fill=(*IVORY, 230))
    yy = y + 128
    draw.rectangle((x, yy, x + 16, yy + 16), outline=(*IVORY, 220), width=2)
    draw.text((x + 27, yy - 2), copy["survey_tiles"], font=fonts.micro, fill=(*IVORY, 230))


def metric_panel(width: int, height: int, captions: dict, fonts: Fonts,
                 reveal: float) -> Image.Image:
    copy = captions["amazon_evidence_ui"]
    image = Image.new("RGB", (width, height), (3, 8, 10))
    draw = ImageDraw.Draw(image, "RGBA")
    left, right, top = 92, width - 92, 105
    draw.text((left, top), copy["metric_title"], font=fonts.title, fill=(*IVORY, 245))
    draw.text((left + 3, top + 82), copy["metric_subtitle"], font=fonts.micro,
              fill=(*MUTED, 230))
    rows = (
        ("mean_height_name", "mean_height_2017", "mean_height_2018", "mean_height_change", .938),
        ("carbon_name", "carbon_2017", "carbon_2018", "carbon_change", .788),
        ("gap_name", "gap_2017", "gap_2018", "gap_change", 1.195),
    )
    for index, (name, value17, value18, change, ratio) in enumerate(rows):
        local = interval(reveal, index * 0.22, index * 0.22 + 0.40)
        y = top + 155 + index * 170
        draw.text((left, y), copy[name], font=fonts.body, fill=(*IVORY, round(245 * local)))
        bar_left, bar_right = left + 470, right - 180
        bar_width = bar_right - bar_left
        draw.rectangle((bar_left, y + 4, bar_right, y + 26),
                       fill=(*CYAN, round(72 * local)), outline=(*CYAN, round(180 * local)))
        fill_width = min(bar_width, round(bar_width * ratio))
        draw.rectangle((bar_left, y + 47, bar_left + round(fill_width * local), y + 69),
                       fill=(*AMBER, round(220 * local)))
        draw.text((bar_left, y + 84), copy[value17], font=fonts.small,
                  fill=(*CYAN, round(240 * local)))
        draw.text((bar_left + 225, y + 84), copy[value18], font=fonts.small,
                  fill=(*AMBER, round(240 * local)))
        draw.text((right - 132, y + 27), copy[change], font=fonts.body,
                  fill=(*CORAL, round(245 * local)))
    draw.text((left, height - 330), copy["year_2017"], font=fonts.micro, fill=(*CYAN, 230))
    draw.text((left + 300, height - 330), copy["year_2018"], font=fonts.micro, fill=(*AMBER, 230))
    draw.text((left, height - 294), copy["metric_source"], font=fonts.micro, fill=(*MUTED, 220))
    return image


def render_frame(t: float, duration: float, cloud: Cloud, painter: PointPainter,
                 study_map: StudyMap, captions: dict, fonts: Fonts) -> Image.Image:
    eye, target, fov = camera(cloud, clamp(t / 38))
    points = painter.render(cloud, eye, target, fov, "all", 1.0)
    if t < 5.5:
        image = ImageEnhance.Brightness(points).enhance(0.44 + 0.56 * interval(t, .3, 5.0))
        badge(image, captions["amazon_evidence_ui"]["lidar_badge"], fonts)
    elif t < 13.0:
        image = points
        badge(image, captions["amazon_evidence_ui"]["lidar_badge"], fonts)
    elif t < 21.0:
        mapped = study_map.render((t - 13) / 8)
        image = Image.blend(points, mapped, interval(t, 13.0, 16.0))
        map_legend(image, captions, fonts)
    elif t < 36.0:
        image = metric_panel(painter.width, painter.height, captions, fonts,
                             clamp((t - 21) / 9.5))
    else:
        panel = metric_panel(painter.width, painter.height, captions, fonts, 1.0)
        image = Image.blend(panel, points, interval(t, 36.0, 39.0))
        image = ImageEnhance.Brightness(image).enhance(1.0 - 0.35 * interval(t, 38.5, 41.5))
        badge(image, captions["amazon_evidence_ui"]["lidar_badge"], fonts)
    draw_interface(image, captions, "amazon_evidence", t, duration, fonts)
    return image


def encode(args) -> None:
    cloud = Cloud.load(args.cloud)
    captions = load_caption_copy(args.captions)
    width, height = map(int, args.size.lower().split("x"))
    fonts = Fonts(width / 1920)
    painter = PointPainter(width, height)
    study_map = StudyMap(args.fire_mask, args.tiles, width, height)
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
            image = grade(render_frame(t, args.duration, cloud, painter, study_map,
                                       captions, fonts), frame + 40_000)
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 2) == 0:
                print(f"amazon_evidence: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")
    manifest = {
        "film": "amazon_evidence", "output": str(args.output.resolve()),
        "output_sha256": sha256(args.output), "resolution": [width, height],
        "fps": args.fps, "duration_seconds": args.duration, "audio": False,
        "render_contract": {
            "2017_geometry": "real measured EBA T_0638 returns",
            "fire_mask": "unaltered values from the authors' published analysis-code raster",
            "2017_2018_change": "exact published aggregate estimates, not a fabricated point cloud",
            "procedural_points": False,
        },
        "inputs": {
            "cloud_manifest": cloud.manifest,
            "fire_mask": {"path": str(args.fire_mask.resolve()), "sha256": sha256(args.fire_mask)},
            "tiles": {"path": str(args.tiles.resolve()), "sha256": sha256(args.tiles)},
            "renderer": {"path": str(Path(__file__).resolve()), "sha256": sha256(Path(__file__))},
            "captions": {"path": str(args.captions.resolve()), "sha256": sha256(args.captions)},
        },
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(args.output)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cloud", type=Path, required=True)
    parser.add_argument("--fire-mask", type=Path, required=True)
    parser.add_argument("--tiles", type=Path, required=True)
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
