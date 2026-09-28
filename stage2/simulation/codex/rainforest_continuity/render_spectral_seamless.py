#!/usr/bin/env python3
"""Render one reversible camera move from fine spectra to satellite cells."""

from __future__ import annotations

import argparse
import json
import math
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from render_spectral_resolution_studies import (
    AMBER,
    CYAN,
    GREEN,
    IVORY,
    MAGENTA,
    MUTED,
    VIOLET,
    Cloud,
    Fonts,
    StudyPainter,
    grade,
    interval,
    lerp,
    rounded_glass,
    sha256,
    smooth,
)
from render_lidar_films import camera_basis


DURATION = 32.5


class SeamlessPainter(StudyPainter):
    def composite_plane(self, image: Image.Image, rgb: np.ndarray, z: float,
                        alpha: float, eye, target, fov: float,
                        cell_size: int, line: tuple[int, int, int]) -> list[tuple[float, float]]:
        """Composite a plane even when its corners travel outside the viewport."""
        texture = self.grid_texture(rgb, cell_size, line)
        corners = np.asarray((
            (self.x_min, self.y_max, z),
            (self.x_max, self.y_max, z),
            (self.x_max, self.y_min, z),
            (self.x_min, self.y_min, z),
        ), dtype=np.float32)
        eye_array, right, up, forward = camera_basis(eye, target)
        relative = corners - eye_array
        depth = relative @ forward
        if np.any(depth <= 0.2):
            return []
        focal = self.width * 0.5 / math.tan(math.radians(fov) * 0.5)
        sx = self.width * 0.5 + focal * (relative @ right) / depth
        sy = self.height * 0.51 - focal * (relative @ up) / depth
        destination = np.column_stack((sx, sy)).astype(np.float32)
        source = np.asarray((
            (0, 0), (texture.shape[1] - 1, 0),
            (texture.shape[1] - 1, texture.shape[0] - 1),
            (0, texture.shape[0] - 1),
        ), dtype=np.float32)
        transform = cv2.getPerspectiveTransform(source, destination)
        warped = cv2.warpPerspective(
            texture, transform, (self.width, self.height),
            flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT,
        )
        mask_source = np.full(texture.shape[:2], round(255 * alpha), dtype=np.uint8)
        warped_mask = cv2.warpPerspective(
            mask_source, transform, (self.width, self.height),
            flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT,
        )
        image.paste(Image.fromarray(warped, "RGB"), (0, 0), Image.fromarray(warped_mask, "L"))
        path = [tuple(value) for value in destination.tolist()]
        ImageDraw.Draw(image, "RGBA").line(
            path + [path[0]], fill=(*IVORY, round(115 * alpha)),
            width=max(1, self.width // 1000), joint="curve",
        )
        return path

    def camera(self, t: float):
        span = max(self.x_span, self.y_span, 180.0)
        crown = max(25.0, float(np.percentile(self.cloud.height, 99)))

        start_angle = math.radians(-31.0)
        map_angle = math.radians(-34.5)
        start_eye = np.asarray((
            math.cos(start_angle) * span * 0.96,
            math.sin(start_angle) * span * 0.96,
            span * 0.43,
        ), dtype=np.float32)
        map_eye = np.asarray((
            math.cos(map_angle) * span * 0.075,
            math.sin(map_angle) * span * 0.075,
            span * 2.35,
        ), dtype=np.float32)
        stack_eye = np.asarray((
            math.cos(map_angle) * span * 1.78,
            math.sin(map_angle) * span * 1.78,
            span * 0.68,
        ), dtype=np.float32)
        start_target = np.asarray((0.0, 0.0, crown * 0.31), dtype=np.float32)
        map_target = np.asarray((0.0, 0.0, 8.0), dtype=np.float32)
        stack_target = np.asarray((0.0, 0.0, 190.0), dtype=np.float32)

        if t < 9.5:
            p = interval(t, 0.4, 9.3)
            return lerp(start_eye, map_eye, p), lerp(start_target, map_target, p), 38.0
        if t < 23.5:
            outward = interval(t, 9.5, 13.5)
            inward = interval(t, 19.5, 23.5)
            stack_weight = outward * (1.0 - inward)
            eye = lerp(map_eye, stack_eye, stack_weight)
            target = lerp(map_target, stack_target, stack_weight)
            return eye, target, float(38.0 + 22.0 * stack_weight)
        p = interval(t, 23.5, 32.3)
        return lerp(map_eye, start_eye, p), lerp(map_target, start_target, p), 38.0

    @staticmethod
    def layer_strength(t: float) -> float:
        return interval(t, 9.7, 14.5) * (1.0 - interval(t, 18.4, 23.4))

    def render(self, t: float, fonts: Fonts, scale: float) -> tuple[Image.Image, str]:
        eye, target, fov = self.camera(t)
        layers = self.layer_strength(t)
        fine_strength = interval(t, 3.0, 7.0) * (1.0 - interval(t, 9.4, 12.0))
        emit_strength = interval(t, 20.0, 24.2)

        if emit_strength > 0.01:
            selected = self.emit_selected
            selected_strength = emit_strength
        elif fine_strength > 0.01:
            selected = self.neon_selected
            selected_strength = fine_strength
        else:
            selected = None
            selected_strength = 0.0

        image = self.render_cloud(
            eye, target, fov, selected, selected_strength,
            fade=1.0 - 0.52 * layers,
        )

        if fine_strength > 0.01:
            contour_t = 4.65 + 2.2 * fine_strength
            self.draw_neon_boundaries(image, contour_t, eye, target, fov)

        if layers > 0.002:
            z_middle = self.canopy_plane + 12.0 + 158.0 * layers
            z_top = self.canopy_plane + 24.0 + 366.0 * layers
            middle_path = self.composite_plane(
                image, self.sentinel_rgb, z_middle, 0.78 * layers,
                eye, target, fov, 3, (28, 92, 91),
            )
            top_path = self.composite_plane(
                image, self.emit_rgb, z_top, 0.84 * layers,
                eye, target, fov, 24, (83, 64, 126),
            )
            overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay, "RGBA")
            if middle_path and top_path:
                for index in range(4):
                    draw.line(
                        (middle_path[index], top_path[index]),
                        fill=(*MUTED, round(82 * layers)),
                        width=max(1, self.width // 1500),
                    )
            self.draw_layer_label(
                draw, top_path, "60 M HYPERSPECTRAL", VIOLET,
                fonts, scale, -18,
            )
            self.draw_layer_label(
                draw, middle_path, "10 M MULTISPECTRAL", CYAN,
                fonts, scale, 5,
            )
            overlay_array = np.asarray(overlay, dtype=np.uint8).copy()
            overlay_array[..., 3] = np.clip(
                overlay_array[..., 3].astype(np.float32) * min(1.0, layers * 2.2),
                0, 255,
            ).astype(np.uint8)
            overlay = Image.fromarray(overlay_array, "RGBA")
            image.paste(overlay, (0, 0), overlay)

        if emit_strength > 0.01:
            emit_t = 2.15 + 3.6 * emit_strength
            self.draw_emit_grid(image, emit_t, eye, target, fov)

        if t < 9.8:
            source = "selected"
        elif t < 22.4:
            source = "stack"
        else:
            source = "emit"
        return image, source


def load_copy(path: Path) -> dict:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-spectral-seamless/1":
        raise ValueError("Unsupported caption schema")
    values = [copy["header"], *copy["sources"].values()]
    values.extend(sentence["text"] for sentence in copy["sentences"])
    values.extend(value for legend in copy["legends"].values()
                  for row in legend for value in row[:2])
    for value in values:
        if any(mark in value for mark in (".", "—", "→", "·")):
            raise ValueError(f"Forbidden punctuation in on screen copy: {value}")
    return copy


def active_sentence(copy: dict, t: float) -> tuple[str, float]:
    for sentence in copy["sentences"]:
        if sentence["start"] <= t < sentence["end"]:
            fade = interval(t, sentence["start"], sentence["start"] + 0.48)
            fade *= 1.0 - interval(t, sentence["end"] - 0.42, sentence["end"])
            return sentence["text"], fade
    return "", 0.0


def draw_interface(image: Image.Image, copy: dict, source_key: str, t: float,
                   fonts: Fonts, scale: float) -> None:
    fade = interval(t, 0.0, 0.35) * (1.0 - interval(t, DURATION - 0.35, DURATION))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), copy["header"],
              font=fonts.header, fill=(*IVORY, round(238 * fade)))

    x1 = image.width - round(54 * scale)
    has_details = any(detail for _, detail, _ in copy["legends"][source_key])
    x0 = x1 - round((410 if has_details else 315) * scale)
    y0 = round(42 * scale)
    y1 = y0 + round(137 * scale)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    palette_rows = {"green": GREEN, "cyan": CYAN, "magenta": MAGENTA,
                    "violet": VIOLET, "amber": AMBER}
    draw = ImageDraw.Draw(image, "RGBA")
    for index, (name, detail, color_key) in enumerate(copy["legends"][source_key]):
        y = y0 + round((17 + index * 36) * scale)
        color = palette_rows[color_key]
        draw.ellipse((x0 + round(19 * scale), y + round(4 * scale),
                      x0 + round(29 * scale), y + round(14 * scale)),
                     fill=(*color, round(245 * fade)))
        draw.text((x0 + round(40 * scale), y), name, font=fonts.legend,
                  fill=(*IVORY, round(225 * fade)))
        if detail:
            draw.text((x0 + round(220 * scale), y), detail, font=fonts.legend,
                      fill=(*MUTED, round(225 * fade)))

    sentence, sentence_alpha = active_sentence(copy, t)
    if sentence:
        left = round(54 * scale)
        bottom = image.height - round(54 * scale)
        text_box = draw.textbbox((0, 0), sentence, font=fonts.caption)
        panel_width = min(
            image.width - round(108 * scale),
            text_box[2] - text_box[0] + round(48 * scale),
        )
        right = left + panel_width
        top = bottom - round(82 * scale)
        rounded_glass(image, (left, top, right, bottom), round(13 * scale))
        draw = ImageDraw.Draw(image, "RGBA")
        draw.text((left + round(23 * scale), top + round(16 * scale)), sentence,
                  font=fonts.caption,
                  fill=(*IVORY, round(255 * sentence_alpha * fade)))

    source = copy["sources"][source_key]
    source_y = image.height - round(31 * scale)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(59 * scale), source_y), source, font=fonts.source,
              fill=(*CYAN, round(215 * fade)))


def encode(args: argparse.Namespace) -> Path:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    copy = load_copy(args.captions)
    cloud = Cloud.load(args.amazon)
    neon = np.load(args.neon_artifact)
    amazon_data = np.load(args.amazon_spectral_artifact)
    amazon = {key: amazon_data[key] for key in amazon_data.files}
    painter = SeamlessPainter(
        width, height, cloud, neon["classifier_selected"] > 0, amazon
    )
    fonts = Fonts(scale)

    if args.stills:
        args.output.mkdir(parents=True, exist_ok=True)
        for index, value in enumerate(args.stills.split(",")):
            t = float(value)
            image, source = painter.render(t, fonts, scale)
            draw_interface(image, copy, source, t, fonts, scale)
            grade(image, 210000 + index).save(args.output / f"{index:02d}-{t:05.1f}.png")
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
    total = round(DURATION * args.fps)
    try:
        for frame in range(total):
            t = frame / args.fps
            image, source = painter.render(t, fonts, scale)
            draw_interface(image, copy, source, t, fonts, scale)
            image = grade(image, 210000 + frame)
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 2) == 0:
                print(f"seamless: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")

    manifest = {
        "schema": "pyrocene-spectral-seamless-film/1",
        "output": str(args.output),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": DURATION,
        "audio": False,
        "camera": (
            "one continuous reversible path from the forest to the map and stack "
            "then back to the starting forest orientation with no cuts or fades"
        ),
        "narrative_captions": 2,
        "inputs": {
            "amazon_lidar": {"path": str(args.amazon), "sha256": sha256(args.amazon)},
            "neon_artifact": {"path": str(args.neon_artifact),
                              "sha256": sha256(args.neon_artifact)},
            "amazon_spectral_artifact": {
                "path": str(args.amazon_spectral_artifact),
                "sha256": sha256(args.amazon_spectral_artifact),
            },
            "captions": {"path": str(args.captions), "sha256": sha256(args.captions)},
            "renderer": {"path": str(Path(__file__).resolve()),
                         "sha256": sha256(Path(__file__).resolve())},
        },
        "claim_boundary": (
            "The fine signature is a non co located educational composite "
            "The EMIT cells are measured Amazon spectra but not a species fuel or fire class"
        ),
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--amazon", type=Path, required=True)
    result.add_argument("--neon-artifact", type=Path, required=True)
    result.add_argument("--amazon-spectral-artifact", type=Path, required=True)
    result.add_argument("--captions", type=Path,
                        default=Path(__file__).with_name("spectral_seamless_captions.json"))
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--size", default="2560x1440")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    result.add_argument("--stills", help="Comma separated seconds to render as PNG files")
    return result


if __name__ == "__main__":
    print(encode(parser().parse_args()))
