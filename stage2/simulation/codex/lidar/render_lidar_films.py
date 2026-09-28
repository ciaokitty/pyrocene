#!/usr/bin/env python3
"""Render silent cinematic studies that transition into real tropical-forest LiDAR.

No procedural forest points are generated here. Every point comes from a prepared
ForestScan artifact. The cinematic plates are explicitly labelled reconstruction.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


INK = (3, 7, 9)
IVORY = (239, 237, 225)
MUTED = (157, 172, 168)
CYAN = (83, 211, 220)
AMBER = (241, 181, 85)
MAGENTA = (238, 76, 139)
GREEN = (115, 205, 147)


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def smooth(value: float) -> float:
    value = clamp(value)
    return value * value * (3.0 - 2.0 * value)


def interval(t: float, start: float, end: float) -> float:
    return smooth((t - start) / max(1e-6, end - start))


def lerp(a, b, amount: float):
    return np.asarray(a) * (1.0 - amount) + np.asarray(b) * amount


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


class Fonts:
    def __init__(self, scale: float):
        sans = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Regular.otf"
        bold = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf"
        serif = "/usr/share/fonts/opentype/urw-base35/P052-Roman.otf"
        self.micro = ImageFont.truetype(bold, round(15 * scale))
        self.small = ImageFont.truetype(sans, round(22 * scale))
        self.body = ImageFont.truetype(sans, round(30 * scale))
        self.title = ImageFont.truetype(serif, round(66 * scale))
        self.end = ImageFont.truetype(serif, round(76 * scale))


@dataclass
class Cloud:
    xyz: np.ndarray
    height: np.ndarray
    intensity: np.ndarray
    classification: np.ndarray
    manifest: dict

    @classmethod
    def load(cls, path: Path) -> "Cloud":
        data = np.load(path)
        manifest = json.loads(path.with_suffix(".manifest.json").read_text())
        return cls(data["xyz"], data["height"], data["intensity"],
                   data["classification"], manifest)


def camera_basis(eye, target):
    eye = np.asarray(eye, dtype=np.float32)
    target = np.asarray(target, dtype=np.float32)
    forward = target - eye
    forward /= np.linalg.norm(forward)
    right = np.cross(forward, np.array([0, 0, 1], dtype=np.float32))
    right /= np.linalg.norm(right)
    up = np.cross(right, forward)
    return eye, right, up, forward


def project(points, eye, target, width, height, fov=43.0):
    eye, right, up, forward = camera_basis(eye, target)
    rel = points - eye
    depth = rel @ forward
    x = rel @ right
    y = rel @ up
    focal = width * 0.5 / math.tan(math.radians(fov) * 0.5)
    sx = width * 0.5 + focal * x / np.maximum(depth, 0.01)
    sy = height * 0.51 - focal * y / np.maximum(depth, 0.01)
    visible = ((depth > 0.2) & (sx >= -2) & (sx < width + 2) &
               (sy >= -2) & (sy < height + 2))
    return sx[visible], sy[visible], depth[visible], visible


def palette(height: np.ndarray) -> np.ndarray:
    """A structural-height palette; no ecological identity is implied."""
    result = np.empty((len(height), 3), dtype=np.float32)
    ground = height < 0.20
    low = (height >= 0.20) & (height < 2.0)
    understory = (height >= 2.0) & (height < 10.0)
    canopy = height >= 10.0
    result[ground] = (0.34, 0.27, 0.20)
    result[low] = np.array(MAGENTA) / 255.0
    result[understory] = np.array(CYAN) / 255.0
    if np.any(canopy):
        q = np.clip((height[canopy] - 10.0) / 35.0, 0, 1)[:, None]
        deep_green = np.array((48, 137, 99))
        crown_green = np.array((151, 214, 155))
        result[canopy] = ((1 - q) * deep_green + q * crown_green) / 255.0
    return result


class PointPainter:
    def __init__(self, width: int, height: int):
        self.width, self.height = width, height
        self.rw, self.rh = width // 2, height // 2
        yy = np.linspace(0, 1, self.rh, dtype=np.float32)[:, None]
        top = np.array((3, 9, 12), np.float32)
        bottom = np.array((2, 4, 5), np.float32)
        self.background = np.broadcast_to(top * (1 - yy[..., None]) + bottom * yy[..., None],
                                          (self.rh, self.rw, 3)).copy()

    def render(self, cloud: Cloud, eye, target, fov=43.0, mode="all", reveal=1.0,
               fade=1.0) -> Image.Image:
        sx, sy, depth, visible = project(cloud.xyz, eye, target, self.rw, self.rh, fov)
        height = cloud.height[visible]
        intensity = cloud.intensity[visible]
        colors = palette(height)
        alpha = np.full(len(height), fade, dtype=np.float32)

        if mode == "canopy-peel":
            peel = reveal
            alpha[height >= 10] *= 1.0 - 0.87 * peel
            alpha[(height >= 2) & (height < 10)] *= 0.72 + 0.28 * peel
            alpha[height < 2] *= 0.70 + 0.85 * peel
        elif mode == "low-focus":
            focus = reveal
            alpha[height >= 2] *= 1.0 - 0.92 * focus
            alpha[height < 0.20] *= 1.0 - 0.50 * focus
            colors[(height >= 0.20) & (height < 2)] = np.array(MAGENTA) / 255.0
        elif mode == "low-reveal":
            low = (height >= 0.20) & (height < 2.0)
            x_norm = (cloud.xyz[visible, 0] - cloud.xyz[:, 0].min()) / max(
                1e-6, np.ptp(cloud.xyz[:, 0]))
            alpha[~low] *= 0.10
            alpha[low & (x_norm > reveal)] *= 0.035
            colors[low] = np.array(MAGENTA) / 255.0

        # Reflectance/intensity is used only as subtle luminance modulation.
        alpha *= 0.68 + 0.55 * intensity
        depth_light = np.clip(1.35 - depth / max(30.0, np.percentile(depth, 98)), 0.45, 1.2)
        alpha *= depth_light.astype(np.float32)

        xi, yi = np.rint(sx).astype(np.int32), np.rint(sy).astype(np.int32)
        acc = np.zeros((self.rh * self.rw, 3), dtype=np.float32)
        for dx, dy, weight in ((0, 0, 1.0), (1, 0, .24), (-1, 0, .24),
                               (0, 1, .24), (0, -1, .24)):
            xx, yy = xi + dx, yi + dy
            ok = (xx >= 0) & (xx < self.rw) & (yy >= 0) & (yy < self.rh)
            index = yy[ok] * self.rw + xx[ok]
            weighted = alpha[ok] * weight
            for channel in range(3):
                acc[:, channel] += np.bincount(index, weights=colors[ok, channel] * weighted,
                                               minlength=self.rh * self.rw)
        acc = acc.reshape((self.rh, self.rw, 3))
        light = 1.0 - np.exp(-acc * 0.72)
        image_array = np.clip(self.background + light * 255.0, 0, 255).astype(np.uint8)
        core = Image.fromarray(image_array, "RGB")
        glow = core.filter(ImageFilter.GaussianBlur(1.6))
        result = Image.blend(core, glow, 0.12).resize((self.width, self.height), Image.Resampling.LANCZOS)
        return result


class PlatePainter:
    def __init__(self, base: Path, fire: Path, width: int, height: int):
        self.base = Image.open(base).convert("RGB")
        self.fire = Image.open(fire).convert("RGB")
        self.width, self.height = width, height

    def crop(self, image: Image.Image, progress: float, direction=1.0) -> Image.Image:
        aspect = self.width / self.height
        iw, ih = image.size
        crop_h = min(ih, iw / aspect) * (1.0 - 0.075 * smooth(progress))
        crop_w = crop_h * aspect
        left = (iw - crop_w) * (0.22 + direction * 0.26 * smooth(progress))
        left = clamp(left, 0, iw - crop_w)
        top = (ih - crop_h) * (0.38 - 0.10 * smooth(progress))
        result = image.crop((left, top, left + crop_w, top + crop_h))
        return result.resize((self.width, self.height), Image.Resampling.LANCZOS)

    def render(self, progress: float, fire_mix: float) -> Image.Image:
        base = self.crop(self.base, progress, 1.0)
        fire = self.crop(self.fire, progress, 1.0)
        image = Image.blend(base, fire, clamp(fire_mix))
        image = ImageEnhance.Contrast(image).enhance(1.07)
        image = ImageEnhance.Color(image).enhance(0.90)
        return image


def load_caption_copy(path: Path) -> dict:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-lidar-captions/1":
        raise ValueError("Unsupported or missing caption schema")
    for key in ("header_left", "header_right"):
        if key not in copy.get("global", {}):
            raise ValueError(f"Caption file is missing global.{key}")
    for key in ("canopy", "understory", "low", "ground"):
        if key not in copy.get("legend", {}).get("rows", {}):
            raise ValueError(f"Caption file is missing legend.rows.{key}")
    required_films = {"beneath", "structure", "amazon_change"}
    missing = required_films - set(copy.get("films", {}))
    if missing:
        raise ValueError(f"Caption file is missing film timelines: {sorted(missing)}")
    for film, segments in copy["films"].items():
        if not segments:
            raise ValueError(f"Caption timeline is empty: {film}")
        previous = -math.inf
        for segment in segments:
            if segment["end"] <= previous:
                raise ValueError(f"Caption end times must increase in {film}")
            previous = segment["end"]
            for key in ("kicker", "title", "detail", "source"):
                if key not in segment:
                    raise ValueError(f"Caption segment in {film} is missing {key}")
    return copy


def title_for(captions: dict, film: str, t: float) -> tuple[str, str, str, str]:
    for segment in captions["films"][film]:
        if t < segment["end"]:
            return tuple(segment[key] for key in ("kicker", "title", "detail", "source"))
    raise ValueError(f"No caption segment covers {film} at {t:.3f}s")


def draw_interface(image: Image.Image, captions: dict, film: str, t: float, duration: float, fonts: Fonts,
                   source_alpha: float = 1.0) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = image.size
    kicker, title, detail, source = title_for(captions, film, t)
    fade = smooth(t / 0.65) * smooth((duration - t) / 0.7)
    alpha = round(255 * fade)
    panel_y = h - 292
    draw.rectangle((0, panel_y - 35, w, h), fill=(2, 5, 7, 135))
    draw.rectangle((66, panel_y, 142, panel_y + 4), fill=(*AMBER, alpha))
    draw.text((66, panel_y + 22), kicker, font=fonts.micro, fill=(*AMBER, alpha))
    draw.text((66, panel_y + 52), title, font=fonts.title, fill=(*IVORY, alpha))
    draw.text((69, panel_y + 138), detail, font=fonts.small, fill=(*MUTED, alpha))
    if source:
        draw.text((69, panel_y + 177), source, font=fonts.micro,
                  fill=(*CYAN, round(alpha * source_alpha)))

    draw.text((66, 48), captions["global"]["header_left"], font=fonts.micro,
              fill=(*IVORY, round(alpha * .84)))
    right = captions["global"]["header_right"]
    bbox = draw.textbbox((0, 0), right, font=fonts.micro)
    draw.text((w - 66 - (bbox[2] - bbox[0]), 48), right, font=fonts.micro,
              fill=(*MUTED, round(alpha * .65)))
    draw.line((66, h - 42, w - 66, h - 42), fill=(180, 195, 188, 46), width=1)
    draw.line((66, h - 42, 66 + (w - 132) * clamp(t / duration), h - 42),
              fill=(*AMBER, 190), width=2)


def draw_height_legend(image: Image.Image, captions: dict, fonts: Fonts, emphasis: str = "all") -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    x, y = image.width - 344, 116
    draw.rectangle((x - 20, y - 22, image.width - 60, y + 153), fill=(2, 6, 8, 148))
    draw.text((x, y), captions["legend"]["title"], font=fonts.micro, fill=(*IVORY, 205))
    rows = [
        (GREEN, "canopy"),
        (CYAN, "understory"),
        (MAGENTA, "low"),
        ((120, 91, 65), "ground"),
    ]
    for i, (color, key) in enumerate(rows):
        name = captions["legend"]["rows"][key]["name"]
        band = captions["legend"]["rows"][key]["band"]
        yy = y + 34 + i * 27
        a = 245 if emphasis in ("all", key) else 65
        draw.ellipse((x, yy + 3, x + 8, yy + 11), fill=(*color, a))
        draw.text((x + 18, yy), name, font=fonts.micro, fill=(*IVORY, a))
        draw.text((x + 135, yy), band, font=fonts.micro, fill=(*MUTED, a))


def grade(image: Image.Image, frame: int) -> Image.Image:
    w, h = image.size
    yy, xx = np.mgrid[0:h, 0:w]
    dx = (xx - w / 2) / (w / 2)
    dy = (yy - h / 2) / (h / 2)
    vignette = np.clip(1.02 - 0.31 * (dx * dx + dy * dy), 0.53, 1.0)
    array = np.asarray(image, dtype=np.float32) * vignette[..., None]
    rng = np.random.default_rng(7127 + frame * 7919)
    array += rng.normal(0, 1.35, (h, w, 1))
    return Image.fromarray(np.clip(array, 0, 255).astype(np.uint8), "RGB")


def camera_path(kind: str, progress: float):
    p = smooth(progress)
    if kind == "als-wide":
        return lerp((105, -145, 92), (82, -118, 58), p), lerp((0, 0, 15), (3, 4, 13), p), 42
    if kind == "als-side":
        return lerp((82, -118, 58), (-76, -104, 42), p), lerp((3, 4, 13), (0, 0, 10), p), 40
    if kind == "tls-enter":
        return lerp((24, -29, 24), (16, -24, 9), p), lerp((0, 0, 12), (0, 0, 8), p), 46
    return lerp((16, -24, 9), (-11, -19, 3.2), p), lerp((0, 0, 8), (0, 0, 4.8), p), 44


def render_beneath(t: float, duration: float, plates: PlatePainter, painter: PointPainter,
                   als: Cloud, tls: Cloud, fonts: Fonts, captions: dict) -> Image.Image:
    plate_fire = interval(t, 4.2, 9.2)
    plate = plates.render(t / duration, plate_fire)

    eye, target, fov = camera_path("als-wide" if t < 18 else "als-side",
                                   clamp((t - 10.0) / (14.5 if t < 18 else 7.0)))
    als_mode = "all" if t < 18 else "canopy-peel"
    als_frame = painter.render(als, eye, target, fov, als_mode, interval(t, 18, 24))
    into_als = interval(t, 9.0, 13.2)
    image = Image.blend(plate, als_frame, into_als)

    if t >= 22.5:
        eye, target, fov = camera_path("tls-enter" if t < 31 else "tls-ground",
                                       clamp((t - 23.0) / (8.0 if t < 31 else 6.5)))
        tls_mode = "all" if t < 31 else "low-focus"
        tls_frame = painter.render(tls, eye, target, fov, tls_mode, interval(t, 31, 36.7))
        image = Image.blend(image, tls_frame, interval(t, 22.5, 27.0))

    if t >= 36.0:
        fire = plates.render(clamp((t - 36.0) / 8.0), 1.0)
        image = Image.blend(image, fire, interval(t, 36.0, 40.0))

    if 10.0 <= t < 36.8:
        emphasis = "low" if t >= 31 else "all"
        draw_height_legend(image, captions, fonts, emphasis)
    draw_interface(image, captions, "beneath", t, duration, fonts)
    return image


def render_structure(t: float, duration: float, painter: PointPainter,
                     als: Cloud, tls: Cloud, fonts: Fonts, captions: dict) -> Image.Image:
    if t < 13.0:
        eye, target, fov = camera_path("als-wide" if t < 7 else "als-side",
                                       clamp((t if t < 7 else t - 7) / 7.0))
        mode = "all" if t < 7 else "canopy-peel"
        image = painter.render(als, eye, target, fov, mode, interval(t, 7, 13))
    else:
        eye, target, fov = camera_path("tls-enter" if t < 22 else "tls-ground",
                                       clamp((t - (13 if t < 22 else 22)) / (9 if t < 22 else 8)))
        mode = "all" if t < 22 else "low-reveal"
        image = painter.render(tls, eye, target, fov, mode, interval(t, 22, 30.5))
        if t < 16.5:
            old_eye, old_target, old_fov = camera_path("als-side", 1.0)
            old = painter.render(als, old_eye, old_target, old_fov, "canopy-peel", 1.0)
            image = Image.blend(old, image, interval(t, 13.0, 16.5))
    if t > 30.5:
        image = ImageEnhance.Brightness(image).enhance(1.0 - 0.48 * interval(t, 30.5, duration))
    draw_height_legend(image, captions, fonts, "low" if t >= 22 else "all")
    draw_interface(image, captions, "structure", t, duration, fonts)
    return image


def encode(args, als: Cloud, tls: Cloud) -> None:
    width, height = map(int, args.size.lower().split("x"))
    fonts = Fonts(width / 1920)
    painter = PointPainter(width, height)
    plates = PlatePainter(args.base_plate, args.fire_plate, width, height)
    captions = load_caption_copy(args.captions)
    duration = 44.0 if args.film == "beneath" else 36.0
    if args.duration:
        duration = args.duration
    total = round(duration * args.fps)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists() and not args.overwrite:
        raise FileExistsError(f"Refusing to overwrite {args.output}; pass --overwrite")

    with tempfile.TemporaryDirectory(prefix="pyrocene-lidar-render-") as tmp:
        command = [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
            "-r", str(args.fps), "-i", "-", "-an", "-c:v", args.encoder,
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
                if args.film == "beneath":
                    image = render_beneath(t, duration, plates, painter, als, tls, fonts, captions)
                else:
                    image = render_structure(t, duration, painter, als, tls, fonts, captions)
                image = grade(image, frame)
                process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
                if frame % max(1, args.fps * 2) == 0:
                    print(f"{args.film}: {frame}/{total}", flush=True)
        finally:
            if process.stdin:
                process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError("ffmpeg encoder failed")

    manifest = {
        "film": args.film,
        "output": str(args.output.resolve()),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": duration,
        "audio": False,
        "render_contract": {
            "cinematic_plates": "visual reconstruction",
            "point_cloud_geometry": "real measured points from prepared artifacts",
            "color": "derived height-above-ground bands; not species or fuel identity",
            "procedural_points": False,
        },
        "inputs": {
            "als_manifest": als.manifest,
            "tls_manifest": tls.manifest,
            "base_plate": {"path": str(args.base_plate.resolve()), "sha256": sha256(args.base_plate)},
            "fire_plate": {"path": str(args.fire_plate.resolve()), "sha256": sha256(args.fire_plate)},
            "renderer": {"path": str(Path(__file__).resolve()), "sha256": sha256(Path(__file__))},
            "captions": {"path": str(args.captions.resolve()), "sha256": sha256(args.captions)},
        },
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(args.output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--als", type=Path, required=True)
    parser.add_argument("--tls", type=Path, required=True)
    parser.add_argument("--base-plate", type=Path, required=True)
    parser.add_argument("--fire-plate", type=Path, required=True)
    parser.add_argument("--film", choices=("beneath", "structure"), required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--size", default="1920x1080")
    parser.add_argument("--fps", type=int, default=24)
    parser.add_argument("--duration", type=float)
    parser.add_argument("--captions", type=Path,
                        default=Path(__file__).with_name("captions.json"))
    parser.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    encode(args, Cloud.load(args.als), Cloud.load(args.tls))


if __name__ == "__main__":
    main()
