#!/usr/bin/env python3
"""Render a fixed-bearing gap to spectral generalization sequence.

The film begins at the final Amazon bearing used by the frozen LiDAR film.
The camera only rises along that bearing. It never orbits the footprint.
Measured layers and educational transfers remain explicitly distinguished.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from render_spectral_resolution_studies import (
    AMBER,
    CYAN,
    GREEN,
    IVORY,
    MAGENTA,
    MUTED,
    VIOLET,
    Fonts,
    StudyPainter,
    grade,
    interval,
    lerp,
    palette,
    project,
    rounded_glass,
    sha256,
    smooth,
)
from render_lidar_films import camera_basis


class GeneralizationPainter(StudyPainter):
    def __init__(self, width: int, height: int, cloud, artifact: dict[str, np.ndarray]):
        # StudyPainter only needs these Amazon keys during construction.
        amazon_stub = {
            "emit_selected": artifact["emit_selected"],
            "emit_rgb": artifact["emit_plane_rgb"],
            "emit_signature_rgb": artifact["emit_plane_rgb"],
            "sentinel_rgb": artifact["fine_plane_rgb"],
        }
        super().__init__(width, height, cloud, artifact["fine_selected"] > 0, amazon_stub)
        self.artifact = artifact
        self.fine_selected = artifact["fine_selected"] > 0
        self.emit_selected = artifact["emit_selected"] > 0
        self.fine_rgb = artifact["fine_plane_rgb"]
        self.emit_rgb = artifact["emit_plane_rgb"]
        self.risk_rgb = artifact["risk_rgb"]
        self.valid = artifact["valid"] > 0
        self.local_bounds = tuple(float(value) for value in artifact["local_bounds"])
        self.signature_contours = self._contours(self.fine_selected, 10, 34)
        self.label_fonts = InterfaceFonts(width / 1920.0)

    def timing(self, t: float, variant: str) -> dict[str, float]:
        if variant == "guided":
            return {
                "signature": interval(t, 0.7, 5.8),
                "lift": interval(t, 5.9, 23.0),
                "fine": interval(t, 6.3, 10.8) * (1.0 - interval(t, 19.4, 23.4)),
                "coarse": interval(t, 11.0, 16.2),
                "collapse": interval(t, 18.0, 23.5),
                "risk": interval(t, 28.3, 33.2),
            }
        return {
            "signature": interval(t, 0.6, 4.8),
            "lift": interval(t, 5.0, 18.5),
            "fine": interval(t, 5.4, 8.8) * (1.0 - interval(t, 14.8, 18.9)),
            "coarse": interval(t, 8.8, 12.8),
            "collapse": interval(t, 13.7, 19.0),
            "risk": interval(t, 22.6, 27.1),
        }

    def camera(self, t: float, variant: str):
        timing = self.timing(t, variant)
        p = timing["lift"]
        span = max(self.x_span, self.y_span, 180.0)
        crown = max(25.0, float(np.percentile(self.cloud.height, 99)))
        angle = math.radians(-31.0)
        horizontal = span * (0.95 * (1.0 - p) + 0.035 * p)
        z = span * (0.42 * (1.0 - p) + 2.65 * p)
        eye = np.asarray((math.cos(angle) * horizontal,
                          math.sin(angle) * horizontal, z), dtype=np.float32)
        target = lerp((0.0, 0.0, crown * 0.31), (0.0, 0.0, 8.0), p)
        return eye, target, 38.0

    def render_cloud_peel(self, eye, target, fov: float, selected_strength: float,
                          fade: float = 1.0, peel: float = 0.62) -> Image.Image:
        sx, sy, depth, visible = project(
            self.cloud.xyz, eye, target, self.rw, self.rh, fov
        )
        height = self.cloud.height[visible]
        intensity = self.cloud.intensity[visible]
        points = self.cloud.xyz[visible]
        colors = palette(height)
        alpha = np.full(len(height), fade, dtype=np.float32)
        alpha[height >= 10] *= 1.0 - 0.87 * peel
        alpha[(height >= 2) & (height < 10)] *= 0.72 + 0.28 * peel
        alpha[height < 2] *= 0.70 + 0.85 * peel
        chosen = self.point_selection(points, height, self.fine_selected)
        amount = 0.92 * selected_strength
        colors[chosen] = colors[chosen] * (1.0 - amount) + np.asarray(VIOLET) / 255.0 * amount
        alpha[chosen] *= 1.0 + 0.85 * selected_strength
        alpha *= 0.68 + 0.55 * intensity
        depth_light = np.clip(
            1.35 - depth / max(30.0, np.percentile(depth, 98)), 0.45, 1.2
        )
        alpha *= depth_light.astype(np.float32)

        xi = np.rint(sx).astype(np.int32)
        yi = np.rint(sy).astype(np.int32)
        acc = np.zeros((self.rh * self.rw, 3), dtype=np.float32)
        for dx, dy, weight in ((0, 0, 1.0), (1, 0, .24), (-1, 0, .24),
                               (0, 1, .24), (0, -1, .24)):
            xx, yy = xi + dx, yi + dy
            ok = (xx >= 0) & (xx < self.rw) & (yy >= 0) & (yy < self.rh)
            index = yy[ok] * self.rw + xx[ok]
            weighted = alpha[ok] * weight
            for channel in range(3):
                acc[:, channel] += np.bincount(
                    index, weights=colors[ok, channel] * weighted,
                    minlength=self.rh * self.rw,
                )
        acc = acc.reshape((self.rh, self.rw, 3))
        light = 1.0 - np.exp(-acc * 0.72)
        array = np.clip(
            np.asarray(self.bg_small, dtype=np.float32) + light * 255.0, 0, 255
        ).astype(np.uint8)
        core = Image.fromarray(array, "RGB")
        glow = core.filter(ImageFilter.GaussianBlur(1.6))
        return Image.blend(core, glow, 0.12).resize(
            (self.width, self.height), Image.Resampling.LANCZOS
        )

    def world_bounds(self, normalized: tuple[float, float, float, float], z: float) -> np.ndarray:
        x0, y0, x1, y1 = normalized
        return np.asarray((
            (self.x_min + x0 * self.x_span, self.y_max - y0 * self.y_span, z),
            (self.x_min + x1 * self.x_span, self.y_max - y0 * self.y_span, z),
            (self.x_min + x1 * self.x_span, self.y_max - y1 * self.y_span, z),
            (self.x_min + x0 * self.x_span, self.y_max - y1 * self.y_span, z),
        ), dtype=np.float32)

    @staticmethod
    def expand_bounds(bounds: tuple[float, float, float, float], amount: float):
        x0, y0, x1, y1 = bounds
        return (max(0.0, x0 - amount), max(0.0, y0 - amount),
                min(1.0, x1 + amount), min(1.0, y1 + amount))

    @staticmethod
    def crop_texture(rgb: np.ndarray, bounds: tuple[float, float, float, float]) -> np.ndarray:
        rows, cols = rgb.shape[:2]
        x0, y0, x1, y1 = bounds
        left, right = round(x0 * cols), round(x1 * cols)
        top, bottom = round(y0 * rows), round(y1 * rows)
        return rgb[max(0, top):min(rows, bottom), max(0, left):min(cols, right)]

    def plane(self, image: Image.Image, rgb: np.ndarray,
              bounds: tuple[float, float, float, float], z: float, alpha: float,
              eye, target, fov: float, grid_pixels: int,
              line: tuple[int, int, int]) -> list[tuple[float, float]]:
        if alpha <= 0.002:
            return []
        texture = rgb.copy()
        if max(texture.shape[:2]) < 100:
            repeat = max(12, round(360 / max(texture.shape[:2])))
            texture = np.repeat(np.repeat(texture, repeat, axis=0), repeat, axis=1)
            grid_pixels = repeat
        if grid_pixels > 0:
            texture[::grid_pixels, :] = line
            texture[:, ::grid_pixels] = line
            texture[-1, :] = line
            texture[:, -1] = line
        corners = self.world_bounds(bounds, z)
        eye_array, right, up, forward = camera_basis(eye, target)
        relative = corners - eye_array
        depth = relative @ forward
        if np.any(depth <= 0.2):
            return []
        focal = self.width * 0.5 / math.tan(math.radians(fov) * 0.5)
        sx = self.width * 0.5 + focal * (relative @ right) / depth
        sy = self.height * 0.51 - focal * (relative @ up) / depth
        destination = np.column_stack((sx, sy)).astype(np.float32)
        source = np.asarray(((0, 0), (texture.shape[1] - 1, 0),
                             (texture.shape[1] - 1, texture.shape[0] - 1),
                             (0, texture.shape[0] - 1)), dtype=np.float32)
        transform = cv2.getPerspectiveTransform(source, destination)
        warped = cv2.warpPerspective(
            texture, transform, (self.width, self.height),
            flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT,
        )
        coverage = np.max(texture, axis=2) > 0
        mask_source = (coverage.astype(np.uint8) * round(255 * alpha)).astype(np.uint8)
        warped_mask = cv2.warpPerspective(
            mask_source, transform, (self.width, self.height),
            flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT,
        )
        image.paste(Image.fromarray(warped, "RGB"), (0, 0), Image.fromarray(warped_mask, "L"))
        path = [tuple(value) for value in destination.tolist()]
        ImageDraw.Draw(image, "RGBA").line(
            path + [path[0]], fill=(*IVORY, round(112 * alpha)),
            width=max(1, self.width // 1100), joint="curve",
        )
        return path

    def draw_signature_contours(self, image: Image.Image, strength: float,
                                eye, target, fov: float) -> None:
        if strength <= 0.002:
            return
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        rows, cols = self.fine_selected.shape
        for contour in self.signature_contours:
            pixels = contour[:, 0, :]
            points = np.column_stack((
                self.x_min + pixels[:, 0] / max(cols - 1, 1) * self.x_span,
                self.y_max - pixels[:, 1] / max(rows - 1, 1) * self.y_span,
                np.full(len(pixels), self.canopy_plane + 2.5),
            )).astype(np.float32)
            sx, sy, _, visible = project(points, eye, target, self.width, self.height, fov)
            if len(sx) < 3 or np.sum(visible) != len(points):
                continue
            path = list(zip(sx.tolist(), sy.tolist()))
            draw.line(path + [path[0]], fill=(2, 7, 9, round(220 * strength)),
                      width=max(4, self.width // 500), joint="curve")
            draw.line(path + [path[0]], fill=(*AMBER, round(250 * strength)),
                      width=max(2, self.width // 1100), joint="curve")
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

    def draw_frustum(self, image: Image.Image, paths: list[list[tuple[float, float]]],
                     strength: float) -> None:
        usable = [path for path in paths if len(path) == 4]
        if len(usable) < 2 or strength <= 0.002:
            return
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        for lower, upper in zip(usable, usable[1:]):
            for index in range(4):
                draw.line((lower[index], upper[index]), fill=(*AMBER, round(132 * strength)),
                          width=max(1, self.width // 1300))
        image.paste(overlay, (0, 0), overlay)

    def render(self, t: float, variant: str) -> tuple[Image.Image, str]:
        timing = self.timing(t, variant)
        eye, target, fov = self.camera(t, variant)
        cloud_fade = 1.0 - 0.48 * timing["coarse"]
        image = self.render_cloud_peel(
            eye, target, fov, timing["signature"], fade=cloud_fade,
            peel=0.62 * (1.0 - 0.30 * timing["lift"]),
        )
        self.draw_signature_contours(image, timing["signature"] * (1.0 - timing["collapse"]),
                                     eye, target, fov)

        span = max(self.x_span, self.y_span, 180.0)
        base_z = self.canopy_plane + 4.0
        middle_bounds = self.expand_bounds(self.local_bounds, 0.10)
        middle_rgb = self.crop_texture(self.fine_rgb, middle_bounds)
        middle_z = base_z + span * 0.23 * timing["fine"] * (1.0 - timing["collapse"])
        top_z = base_z + span * 0.52 * timing["coarse"] * (1.0 - timing["collapse"])

        base_path: list[tuple[float, float]] = []
        if timing["fine"] > 0.01:
            corners = self.world_bounds(self.local_bounds, base_z)
            eye_array, right, up, forward = camera_basis(eye, target)
            relative = corners - eye_array
            depth = relative @ forward
            if np.all(depth > 0.2):
                focal = self.width * 0.5 / math.tan(math.radians(fov) * 0.5)
                sx = self.width * 0.5 + focal * (relative @ right) / depth
                sy = self.height * 0.51 - focal * (relative @ up) / depth
                base_path = [tuple(value) for value in np.column_stack((sx, sy)).tolist()]
                ImageDraw.Draw(image, "RGBA").line(
                    base_path + [base_path[0]], fill=(*AMBER, round(220 * timing["fine"])),
                    width=max(2, self.width // 900), joint="curve",
                )
        middle_path = self.plane(
            image, middle_rgb, middle_bounds, middle_z,
            0.78 * timing["fine"], eye, target, fov, 12, (32, 90, 90),
        )
        top_path = self.plane(
            image, self.emit_rgb, (0.0, 0.0, 1.0, 1.0), top_z,
            0.84 * timing["coarse"], eye, target, fov, 1, (62, 52, 96),
        )
        self.draw_frustum(image, [base_path, middle_path, top_path],
                          timing["coarse"] * (1.0 - timing["collapse"]))
        if timing["coarse"] > 0.03 and timing["collapse"] < 0.88:
            labels = Image.new("RGBA", image.size, (0, 0, 0, 0))
            label_draw = ImageDraw.Draw(labels, "RGBA")
            self.draw_layer_label(label_draw, middle_path,
                                  "AIRBORNE SPECTROSCOPY : 1 TO 10 M",
                                  CYAN, self.label_fonts,
                                  self.width / 1920.0, 4)
            self.draw_layer_label(label_draw, top_path,
                                  "SATELLITE SPECTROSCOPY : 60 M",
                                  VIOLET, self.label_fonts,
                                  self.width / 1920.0, -18)
            image.paste(labels, (0, 0), labels)

        risk = timing["risk"]
        if risk > 0:
            self.plane(
                image, self.risk_rgb, (0.0, 0.0, 1.0, 1.0), base_z,
                0.88 * risk, eye, target, fov, 0, (0, 0, 0),
            )
        if risk > 0.52:
            source = "risk"
        elif timing["collapse"] > 0.68:
            source = "emit"
        elif timing["fine"] > 0.04 or timing["coarse"] > 0.04:
            source = "stack"
        else:
            source = "fine"
        return image, source


class InterfaceFonts(Fonts):
    def __init__(self, scale: float):
        super().__init__(scale)
        mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
        self.source = ImageFont.truetype(mono, round(12 * scale))


def load_copy(path: Path, variant: str) -> tuple[dict, dict]:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-signature-generalization-film/1":
        raise ValueError("Unsupported caption schema")
    selected = copy["variants"][variant]
    values = [copy["header"], *copy["sources"].values()]
    values.extend(sentence["text"] for sentence in selected["sentences"])
    for value in values:
        if any(mark in value for mark in (".", "—", "→", "·")):
            raise ValueError(f"Forbidden punctuation in on screen copy: {value}")
    return copy, selected


def active_sentence(copy: dict, t: float) -> tuple[str, float]:
    for sentence in copy["sentences"]:
        if sentence["start"] <= t < sentence["end"]:
            fade = interval(t, sentence["start"], sentence["start"] + 0.45)
            fade *= 1.0 - interval(t, sentence["end"] - 0.38, sentence["end"])
            return sentence["text"], fade
    return "", 0.0


def draw_interface(image: Image.Image, all_copy: dict, copy: dict, source_key: str,
                   t: float, duration: float, fonts: InterfaceFonts, scale: float) -> None:
    fade = interval(t, 0.0, 0.38) * (1.0 - interval(t, duration - 0.38, duration))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), all_copy["header"],
              font=fonts.header, fill=(*IVORY, round(238 * fade)))

    x1 = image.width - round(54 * scale)
    x0 = x1 - round(405 * scale)
    y0 = round(42 * scale)
    rows = ((GREEN, "GREEN CYAN PINK", "LIDAR HEIGHT"),
            (VIOLET, "VIOLET", "SPECTRAL RESPONSE"),
            (AMBER, "YELLOW", "SELECTED BOUNDARY"))
    if source_key == "risk":
        rows = ((CYAN, "CYAN", "LOWER MODEL OUTPUT"),
                (AMBER, "YELLOW", "HIGHER MODEL OUTPUT"),
                (MAGENTA, "PINK", "HIGHEST MODEL OUTPUT"))
    y1 = y0 + round(137 * scale)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    for index, (color, name, detail) in enumerate(rows):
        y = y0 + round((17 + index * 36) * scale)
        draw.ellipse((x0 + round(19 * scale), y + round(4 * scale),
                      x0 + round(29 * scale), y + round(14 * scale)),
                     fill=(*color, round(245 * fade)))
        draw.text((x0 + round(40 * scale), y), name, font=fonts.legend,
                  fill=(*IVORY, round(225 * fade)))
        draw.text((x0 + round(215 * scale), y), detail, font=fonts.legend,
                  fill=(*MUTED, round(225 * fade)))

    sentence, sentence_alpha = active_sentence(copy, t)
    left = round(54 * scale)
    bottom = image.height - round(42 * scale)
    text_box = draw.textbbox((0, 0), sentence, font=fonts.caption)
    source = all_copy["sources"][source_key]
    source_box = draw.textbbox((0, 0), source, font=fonts.source)
    panel_width = max(round(720 * scale), text_box[2] - text_box[0] + round(48 * scale),
                      source_box[2] - source_box[0] + round(48 * scale))
    right = min(image.width - round(54 * scale), left + panel_width)
    top = bottom - round(116 * scale)
    rounded_glass(image, (left, top, right, bottom), round(13 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((left + round(23 * scale), top + round(16 * scale)), sentence,
              font=fonts.caption, fill=(*IVORY, round(255 * sentence_alpha * fade)))
    draw.text((left + round(24 * scale), bottom - round(29 * scale)), source,
              font=fonts.source, fill=(*CYAN, round(225 * fade)))


def make_painter(args: argparse.Namespace, width: int, height: int):
    from render_spectral_resolution_studies import Cloud
    cloud = Cloud.load(args.amazon)
    data = np.load(args.artifact)
    artifact = {key: data[key] for key in data.files}
    return GeneralizationPainter(width, height, cloud, artifact), cloud


def render_frame(painter: GeneralizationPainter, t: float, variant: str,
                 all_copy: dict, copy: dict, fonts: InterfaceFonts,
                 scale: float, frame: int) -> Image.Image:
    image, source_key = painter.render(t, variant)
    draw_interface(image, all_copy, copy, source_key, t, float(copy["duration"]), fonts, scale)
    return grade(image, 171000 + frame)


def encode(args: argparse.Namespace) -> Path:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    all_copy, copy = load_copy(args.captions, args.variant)
    duration = float(copy["duration"])
    painter, cloud = make_painter(args, width, height)
    fonts = InterfaceFonts(scale)

    if args.stills:
        args.output.mkdir(parents=True, exist_ok=True)
        for index, value in enumerate(args.stills.split(",")):
            t = float(value)
            image = render_frame(painter, t, args.variant, all_copy, copy, fonts, scale, index)
            image.save(args.output / f"{index:02d}-{t:05.1f}.png")
        return args.output

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
    total = round(duration * args.fps)
    try:
        for frame in range(total):
            t = frame / args.fps
            image = render_frame(painter, t, args.variant, all_copy, copy, fonts, scale, frame)
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 2) == 0:
                print(f"{args.variant}: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")

    manifest = {
        "schema": "pyrocene-signature-generalization-film/1",
        "variant": args.variant,
        "output": str(args.output),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": duration,
        "audio": False,
        "camera": "fixed bearing minus 31 degrees with lift only and no orbit",
        "inputs": {
            "amazon_lidar": {"path": str(args.amazon), "sha256": sha256(args.amazon),
                             "acquisition": "2017-05-08"},
            "generalization_artifact": json.loads(args.artifact.with_suffix(".manifest.json").read_text()),
            "captions": {"path": str(args.captions), "sha256": sha256(args.captions)},
            "renderer": {"path": str(Path(__file__).resolve()),
                         "sha256": sha256(Path(__file__).resolve())},
        },
        "claim_boundary": (
            "Fine spectral texture is a labelled non co located educational composite "
            "EMIT similarity uses measured Amazon spectra but is not a species class "
            "The final surface is illustrative and is neither measured fuel nor calibrated fire risk"
        ),
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--variant", choices=("guided", "continuous"), default="guided")
    result.add_argument("--amazon", type=Path, required=True)
    result.add_argument("--artifact", type=Path, required=True)
    result.add_argument("--captions", type=Path,
                        default=Path(__file__).with_name("signature_generalization_captions.json"))
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--size", default="2560x1440")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    result.add_argument("--stills", help="Comma separated seconds to render as PNG files")
    return result


if __name__ == "__main__":
    print(encode(parser().parse_args()))
