#!/usr/bin/env python3
"""Render three discrete spectral studies as one restrained sequence."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

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


SCENE_SELECTED = (0.0, 11.5)
SCENE_STACK = (10.5, 21.5)
SCENE_EMIT = (20.5, 32.5)
TRANSITIONS = ((10.5, 11.5), (20.5, 21.5))


class TriptychPainter(StudyPainter):
    """Keep the old studies but replace their fast bearing change."""

    def overview_camera(self, t: float):
        p = smooth(interval(t, 0.55, 6.75))
        span = max(self.x_span, self.y_span, 180.0)
        crown = max(25.0, float(np.percentile(self.cloud.height, 99)))
        angle = math.radians(-31.0 - 3.5 * p)
        horizontal = span * (0.96 * (1.0 - p) + 0.075 * p)
        eye = np.asarray((
            math.cos(angle) * horizontal,
            math.sin(angle) * horizontal,
            span * (0.43 * (1.0 - p) + 2.35 * p),
        ), dtype=np.float32)
        target = lerp((0.0, 0.0, crown * 0.31), (0.0, 0.0, 8.0), p)
        return eye, target, 38.0

    def stack_camera(self, t: float):
        span = max(self.x_span, self.y_span, 180.0)
        p = smooth(interval(t, 0.0, 8.0))
        angle = math.radians(-45.0 + 1.8 * p)
        distance = span * (1.78 + 0.05 * p)
        eye = np.asarray((
            math.cos(angle) * distance,
            math.sin(angle) * distance,
            span * (0.64 + 0.015 * p),
        ), dtype=np.float32)
        return eye, np.asarray((0.0, 0.0, 190.0), dtype=np.float32), 60.0


def load_copy(path: Path) -> dict:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-spectral-triptych/1":
        raise ValueError("Unsupported caption schema")
    values = [copy["header"]]
    values.extend(sentence["text"] for sentence in copy["sentences"])
    for scene in copy["scenes"].values():
        values.append(scene["source"])
        values.extend(value for row in scene["legend"] for value in row[:2])
    for value in values:
        if any(mark in value for mark in (".", "—", "→", "·")):
            raise ValueError(f"Forbidden punctuation in on screen copy: {value}")
    return copy


def local_time(t: float, bounds: tuple[float, float]) -> float:
    start, end = bounds
    return float(np.clip((t - start) / (end - start) * 8.0, 0.0, 7.999))


def transition_at(t: float) -> tuple[int, float] | None:
    for index, (start, end) in enumerate(TRANSITIONS):
        if start <= t < end:
            return index, smooth((t - start) / (end - start))
    return None


def render_scene(painter: TriptychPainter, name: str, t: float,
                 fonts: Fonts, scale: float) -> Image.Image:
    if name == "selected":
        return painter.render_neon(local_time(t, SCENE_SELECTED))
    if name == "stack":
        return painter.render_stack(local_time(t, SCENE_STACK), fonts, scale)
    return painter.render_emit(local_time(t, SCENE_EMIT))


def scene_image(painter: TriptychPainter, t: float,
                fonts: Fonts, scale: float) -> tuple[Image.Image, str, float]:
    transition = transition_at(t)
    if transition is None:
        if t < TRANSITIONS[0][0]:
            return render_scene(painter, "selected", t, fonts, scale), "selected", 1.0
        if t < TRANSITIONS[1][0]:
            return render_scene(painter, "stack", t, fonts, scale), "stack", 1.0
        return render_scene(painter, "emit", t, fonts, scale), "emit", 1.0

    index, progress = transition
    first, second = (("selected", "stack"), ("stack", "emit"))[index]
    if progress < 0.5:
        image = render_scene(painter, first, t, fonts, scale)
        visibility = 1.0 - 1.72 * progress
        scene = first
    else:
        image = render_scene(painter, second, t, fonts, scale)
        visibility = 0.14 + 1.72 * (progress - 0.5)
        scene = second
    visibility = float(np.clip(visibility, 0.14, 1.0))
    return ImageEnhance.Brightness(image).enhance(visibility), scene, visibility


def active_sentence(copy: dict, t: float) -> tuple[str, float]:
    for sentence in copy["sentences"]:
        if sentence["start"] <= t < sentence["end"]:
            fade = interval(t, sentence["start"], sentence["start"] + 0.42)
            fade *= 1.0 - interval(t, sentence["end"] - 0.36, sentence["end"])
            return sentence["text"], fade
    return "", 0.0


def draw_interface(image: Image.Image, copy: dict, scene: str, t: float,
                   visibility: float, fonts: Fonts, scale: float) -> None:
    if visibility < 0.55:
        return
    duration = float(copy["duration"])
    fade = interval(t, 0.0, 0.35) * (1.0 - interval(t, duration - 0.35, duration))
    fade *= visibility
    scene_copy = copy["scenes"][scene]
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), copy["header"],
              font=fonts.header, fill=(*IVORY, round(238 * fade)))

    x1 = image.width - round(54 * scale)
    x0 = x1 - round(410 * scale)
    y0 = round(42 * scale)
    y1 = y0 + round(137 * scale)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    palette_rows = {"green": GREEN, "cyan": CYAN, "magenta": MAGENTA,
                    "violet": VIOLET, "amber": AMBER}
    draw = ImageDraw.Draw(image, "RGBA")
    for index, (name, detail, color_key) in enumerate(scene_copy["legend"]):
        y = y0 + round((17 + index * 36) * scale)
        color = palette_rows[color_key]
        draw.ellipse((x0 + round(19 * scale), y + round(4 * scale),
                      x0 + round(29 * scale), y + round(14 * scale)),
                     fill=(*color, round(245 * fade)))
        draw.text((x0 + round(40 * scale), y), name, font=fonts.legend,
                  fill=(*IVORY, round(225 * fade)))
        draw.text((x0 + round(220 * scale), y), detail, font=fonts.legend,
                  fill=(*MUTED, round(225 * fade)))

    sentence, sentence_alpha = active_sentence(copy, t)
    if not sentence:
        return
    left = round(54 * scale)
    bottom = image.height - round(42 * scale)
    right = min(image.width - round(54 * scale), left + round(1170 * scale))
    top = bottom - round(116 * scale)
    rounded_glass(image, (left, top, right, bottom), round(13 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((left + round(23 * scale), top + round(16 * scale)), sentence,
              font=fonts.caption,
              fill=(*IVORY, round(255 * sentence_alpha * fade)))
    draw.text((left + round(24 * scale), bottom - round(29 * scale)),
              scene_copy["source"], font=fonts.source,
              fill=(*CYAN, round(225 * fade)))


def encode(args: argparse.Namespace) -> Path:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    copy = load_copy(args.captions)
    duration = float(copy["duration"])
    cloud = Cloud.load(args.amazon)
    neon = np.load(args.neon_artifact)
    amazon_data = np.load(args.amazon_spectral_artifact)
    amazon = {key: amazon_data[key] for key in amazon_data.files}
    painter = TriptychPainter(
        width, height, cloud, neon["classifier_selected"] > 0, amazon
    )
    fonts = Fonts(scale)

    if args.stills:
        args.output.mkdir(parents=True, exist_ok=True)
        for index, value in enumerate(args.stills.split(",")):
            t = float(value)
            image, scene, visibility = scene_image(painter, t, fonts, scale)
            draw_interface(image, copy, scene, t, visibility, fonts, scale)
            grade(image, 190000 + index).save(args.output / f"{index:02d}-{t:05.1f}.png")
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
            image, scene, visibility = scene_image(painter, t, fonts, scale)
            draw_interface(image, copy, scene, t, visibility, fonts, scale)
            image = grade(image, 190000 + frame)
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps * 2) == 0:
                print(f"triptych: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")

    manifest = {
        "schema": "pyrocene-spectral-triptych-film/1",
        "output": str(args.output),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": duration,
        "audio": False,
        "edit": ["selected spectral signature", "resolution stack", "EMIT at 60 metres"],
        "transition": "one second dip through the near black film background",
        "camera": {
            "selected_and_emit": "3 point 5 degree anticlockwise drift over a gradual lift",
            "resolution_stack": "1 point 8 degree drift with a nearly fixed side view",
        },
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
                        default=Path(__file__).with_name("spectral_triptych_captions.json"))
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--size", default="2560x1440")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    result.add_argument("--stills", help="Comma separated seconds to render as PNG files")
    return result


if __name__ == "__main__":
    print(encode(parser().parse_args()))
