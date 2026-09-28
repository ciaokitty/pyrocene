#!/usr/bin/env python3
"""Render a short educational LiDAR plus spectroscopy registration study.

The Amazon point geometry is measured EBA LiDAR. Spectral color and an
unsupervised cluster boundary are derived from a real NEON imaging-spectroscopy
cube at Soaproot Saddle. The composite is intentionally labelled as an
educational registration and is not presented as a co-located observation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont

LIDAR_DIR = Path(__file__).resolve().parents[1] / "lidar"
sys.path.insert(0, str(LIDAR_DIR))

from render_lidar_films import (  # noqa: E402
    AMBER,
    CYAN,
    GREEN,
    INK,
    IVORY,
    MAGENTA,
    MUTED,
    Cloud,
    clamp,
    grade,
    interval,
    lerp,
    palette,
    project,
    smooth,
)


DURATION = 8.0


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
        mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
        self.header = ImageFont.truetype(bold, round(18 * scale))
        self.legend = ImageFont.truetype(bold, round(14 * scale))
        self.caption = ImageFont.truetype(sans, round(42 * scale))
        self.source = ImageFont.truetype(mono, round(14 * scale))


def load_copy(path: Path) -> dict:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-spectral-overlay-snippet/1":
        raise ValueError("Unsupported caption schema")
    forbidden = (".", "—", "→", "·")
    for value in [copy["header"], copy["source"], *[s["text"] for s in copy["sentences"]]]:
        if any(mark in value for mark in forbidden):
            raise ValueError(f"Forbidden punctuation in on-screen copy: {value}")
    return copy


def load_spectral_layers(path: Path) -> tuple[np.ndarray, np.ndarray, dict]:
    data = np.load(path)
    manifest = json.loads(path.with_suffix(".manifest.json").read_text())
    return data["spectral_rgb"], data["classifier_selected"] > 0, manifest


class CompositePainter:
    def __init__(self, width: int, height: int, cloud: Cloud,
                 spectral: np.ndarray, boundary: np.ndarray):
        self.width = width
        self.height = height
        self.rw = width // 2
        self.rh = height // 2
        self.cloud = cloud
        self.spectral = spectral
        contours, _ = cv2.findContours(
            boundary.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        self.contours = [
            contour for contour in sorted(contours, key=cv2.contourArea, reverse=True)
            if cv2.contourArea(contour) >= 18
        ][:24]
        self.x_min = float(np.min(cloud.xyz[:, 0]))
        self.x_span = float(np.ptp(cloud.xyz[:, 0]))
        self.y_min = float(np.min(cloud.xyz[:, 1]))
        self.y_span = float(np.ptp(cloud.xyz[:, 1]))
        yy = np.linspace(0, 1, self.rh, dtype=np.float32)[:, None]
        top = np.array((3, 9, 12), np.float32)
        bottom = np.array((2, 4, 5), np.float32)
        self.background = np.broadcast_to(
            top * (1 - yy[..., None]) + bottom * yy[..., None],
            (self.rh, self.rw, 3),
        ).copy()

    def camera(self, t: float):
        p = smooth(interval(t, 0.55, 4.4))
        span = max(self.x_span, self.y_span, 180.0)
        crown = max(25.0, float(np.percentile(self.cloud.height, 99)))
        start_angle = math.radians(-32.0)
        start_eye = np.array((math.cos(start_angle) * span * 0.96,
                              math.sin(start_angle) * span * 0.96,
                              span * 0.43))
        end_eye = np.array((0.0, -4.0, span * 2.55))
        eye = lerp(start_eye, end_eye, p)
        target = lerp((0.0, 0.0, crown * 0.31), (0.0, 0.0, 8.0), p)
        return eye, target, 38.0

    def render(self, t: float) -> Image.Image:
        eye, target, fov = self.camera(t)
        cloud = self.cloud
        sx, sy, depth, visible = project(cloud.xyz, eye, target, self.rw, self.rh, fov)
        height = cloud.height[visible]
        intensity = cloud.intensity[visible]
        points = cloud.xyz[visible]
        colors = palette(height)

        size = self.spectral.shape[0]
        px = np.clip(((points[:, 0] - self.x_min) / self.x_span * (size - 1)).astype(np.int32), 0, size - 1)
        py = np.clip(((1.0 - (points[:, 1] - self.y_min) / self.y_span) * (size - 1)).astype(np.int32), 0, size - 1)
        spectral_color = self.spectral[py, px]
        canopy = height >= 10.0
        spectral_mix = 0.68 * interval(t, 2.1, 5.25)
        colors[canopy] = colors[canopy] * (1.0 - spectral_mix) + spectral_color[canopy] * spectral_mix

        alpha = (0.68 + 0.55 * intensity).astype(np.float32)
        depth_light = np.clip(1.35 - depth / max(30.0, np.percentile(depth, 98)), 0.45, 1.2)
        alpha *= depth_light.astype(np.float32)

        xi = np.rint(sx).astype(np.int32)
        yi = np.rint(sy).astype(np.int32)
        acc = np.zeros((self.rh * self.rw, 3), dtype=np.float32)
        strokes = ((0, 0, 1.0), (1, 0, .24), (-1, 0, .24),
                   (0, 1, .24), (0, -1, .24))
        for dx, dy, weight in strokes:
            xx, yy = xi + dx, yi + dy
            ok = (xx >= 0) & (xx < self.rw) & (yy >= 0) & (yy < self.rh)
            index = yy[ok] * self.rw + xx[ok]
            weighted = alpha[ok] * weight
            for channel in range(3):
                acc[:, channel] += np.bincount(
                    index,
                    weights=colors[ok, channel] * weighted,
                    minlength=self.rh * self.rw,
                )
        acc = acc.reshape((self.rh, self.rw, 3))
        light = 1.0 - np.exp(-acc * 0.31)
        array = np.clip(self.background + light * 255.0, 0, 255).astype(np.uint8)
        core = Image.fromarray(array, "RGB")
        glow = core.filter(ImageFilter.GaussianBlur(1.6))
        result = Image.blend(core, glow, 0.12)
        result = result.resize((self.width, self.height), Image.Resampling.LANCZOS)
        return self.draw_classifier_boundaries(result, t)

    def draw_classifier_boundaries(self, image: Image.Image, t: float) -> Image.Image:
        strength = interval(t, 4.9, 6.25)
        if strength <= 0:
            return image
        eye, target, fov = self.camera(t)
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        size = self.spectral.shape[0]
        canopy_plane = float(np.percentile(self.cloud.height, 96))
        for contour in self.contours:
            pixels = contour[:, 0, :]
            points = np.column_stack((
                self.x_min + pixels[:, 0] / (size - 1) * self.x_span,
                self.y_min + (1.0 - pixels[:, 1] / (size - 1)) * self.y_span,
                np.full(len(pixels), canopy_plane),
            )).astype(np.float32)
            sx, sy, _, visible = project(points, eye, target, self.width, self.height, fov)
            if len(sx) < 3 or np.sum(visible) != len(points):
                continue
            path = list(zip(sx.tolist(), sy.tolist()))
            path.append(path[0])
            draw.line(path, fill=(2, 7, 9, round(205 * strength)), width=max(4, self.width // 420), joint="curve")
            draw.line(path, fill=(*AMBER, round(245 * strength)), width=max(2, self.width // 900), joint="curve")
        structure = np.max(np.asarray(image, dtype=np.uint8), axis=2) > 24
        structure_mask = Image.fromarray((structure * 255).astype(np.uint8), "L").filter(
            ImageFilter.MaxFilter(11)
        )
        overlay_array = np.asarray(overlay, dtype=np.uint8).copy()
        overlay_array[..., 3] = (
            overlay_array[..., 3].astype(np.uint16)
            * np.asarray(structure_mask, dtype=np.uint16)
            // 255
        ).astype(np.uint8)
        overlay = Image.fromarray(overlay_array, "RGBA")
        image.paste(overlay, (0, 0), overlay)
        return image


def rounded_glass(image: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=radius, fill=205)
    image.paste(image.filter(ImageFilter.GaussianBlur(max(5, radius // 2))), (0, 0), mask)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(overlay, "RGBA").rounded_rectangle(
        box, radius=radius, fill=(2, 7, 9, 170), outline=(127, 164, 158, 38), width=1)
    image.paste(overlay, (0, 0), overlay)


def active_sentence(copy: dict, t: float) -> tuple[str, float]:
    for sentence in copy["sentences"]:
        if sentence["start"] <= t < sentence["end"]:
            fade = interval(t, sentence["start"], sentence["start"] + 0.35)
            fade *= 1.0 - interval(t, sentence["end"] - 0.30, sentence["end"])
            return sentence["text"], fade
    return "", 0.0


def draw_interface(image: Image.Image, copy: dict, t: float, fonts: Fonts, scale: float) -> None:
    fade = interval(t, 0, 0.35) * (1.0 - interval(t, DURATION - 0.35, DURATION))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), copy["header"], font=fonts.header,
              fill=(*IVORY, round(238 * fade)))

    x1 = image.width - round(54 * scale)
    x0 = x1 - round(410 * scale)
    y0 = round(42 * scale)
    y1 = y0 + round(137 * scale)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((x0 + round(18 * scale), y0 + round(14 * scale)), copy["legend"]["title"],
              font=fonts.legend, fill=(*IVORY, round(220 * fade)))
    palette_rows = {"green": GREEN, "cyan": CYAN, "magenta": MAGENTA, "amber": AMBER}
    for index, (name, detail, color_key) in enumerate(copy["legend"]["rows"]):
        y = y0 + round((43 + index * 27) * scale)
        color = palette_rows[color_key]
        draw.ellipse((x0 + round(19 * scale), y + round(4 * scale),
                      x0 + round(28 * scale), y + round(13 * scale)),
                     fill=(*color, round(240 * fade)))
        draw.text((x0 + round(39 * scale), y), name, font=fonts.legend,
                  fill=(*IVORY, round(220 * fade)))
        draw.text((x0 + round(225 * scale), y), detail, font=fonts.legend,
                  fill=(*MUTED, round(220 * fade)))

    sentence, sentence_alpha = active_sentence(copy, t)
    left = round(54 * scale)
    bottom = image.height - round(42 * scale)
    right = min(image.width - round(54 * scale), left + round(1170 * scale))
    top = bottom - round(116 * scale)
    rounded_glass(image, (left, top, right, bottom), round(13 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((left + round(23 * scale), top + round(16 * scale)), sentence,
              font=fonts.caption, fill=(*IVORY, round(255 * sentence_alpha * fade)))
    draw.text((left + round(24 * scale), bottom - round(30 * scale)), copy["source"],
              font=fonts.source, fill=(*CYAN, round(225 * fade)))


def encode(args: argparse.Namespace) -> Path:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    copy = load_copy(args.captions)
    cloud = Cloud.load(args.amazon)
    spectral, boundary, spectral_manifest = load_spectral_layers(args.spectral_artifact)
    painter = CompositePainter(width, height, cloud, spectral, boundary)
    fonts = Fonts(scale)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
        "-r", str(args.fps), "-i", "-", "-an", "-c:v", args.encoder,
    ]
    command += (["-preset", "p5", "-cq", "17", "-b:v", "0"]
                if args.encoder == "h264_nvenc"
                else ["-preset", "medium", "-crf", "16"])
    command += ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(args.output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    total = round(DURATION * args.fps)
    try:
        for frame in range(total):
            t = frame / args.fps
            image = painter.render(t)
            draw_interface(image, copy, t, fonts, scale)
            image = grade(image, frame + 121000)
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps) == 0:
                print(f"spectral_overlay_snippet: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")

    manifest = {
        "schema": "pyrocene-spectral-overlay-snippet/1",
        "output": str(args.output),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": DURATION,
        "audio": False,
        "status": "educational composite not a co-located observation",
        "amazon_lidar": {
            "path": str(args.amazon),
            "sha256": sha256(args.amazon),
            "acquisition": "2017-05-08",
            "source": "EBA T_0638",
        },
        "spectroscopy_artifact": spectral_manifest,
        "claim_boundary": "The composite demonstrates a visual method. It does not place measured California spectra in the Amazon or identify Amazon species fuel moisture or fire risk.",
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--amazon", type=Path, required=True)
    result.add_argument("--spectral-artifact", type=Path, required=True)
    result.add_argument("--captions", type=Path,
                        default=Path(__file__).with_name("spectral_overlay_snippet_captions.json"))
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--size", default="2560x1440")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    return result


if __name__ == "__main__":
    print(encode(parser().parse_args()))
