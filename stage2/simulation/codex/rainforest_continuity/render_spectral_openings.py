#!/usr/bin/env python3
"""Render a silent hyperspectral to subcanopy-signature experiment."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from render_candidates import (
    CYAN,
    GREEN,
    INK,
    MAGENTA,
    Fonts,
    clamp,
    draw_interface,
    grade,
    interval,
    lerp,
    load_copy,
    sha256,
    smooth,
)


class SpectralPanels:
    """Published Figure 4 map and its linked BSVM detail panel."""

    def __init__(self, context_figure: Path, classifier_figure: Path,
                 size: tuple[int, int]):
        self.size = size
        context_source = Image.open(context_figure).convert("RGB")
        source = Image.open(classifier_figure).convert("RGB")
        if context_source.width < 2500 or source.width < 3000 or source.height < 2400:
            raise ValueError("The high resolution MDPI Figure 4 source is required")

        # Figure 1 provides a clean false-color view of the study area. The ROI
        # is transferred from the lower Figure 4 locator box using its published
        # map coordinates. The lower BSVM panel is the linked classified detail.
        map_source = context_source.crop((150, 620, 2500, 1880))
        classifier = source.crop((1070, 1430, 1925, 2230))
        self.map = self._paper_to_black(map_source)
        self.classifier = classifier
        self.roi = (1349, 504, 1630, 784)

    @staticmethod
    def _paper_to_black(source: Image.Image) -> Image.Image:
        pixels = np.asarray(source, dtype=np.uint8).copy()
        paper = np.min(pixels, axis=2) > 238
        pixels[paper] = INK
        return Image.fromarray(pixels, "RGB")

    @staticmethod
    def _camera_crop(source: Image.Image, output: tuple[int, int], zoom: float,
                     center: tuple[float, float]) -> Image.Image:
        width, height = output
        aspect = width / height
        source_width, source_height = source.size
        crop_width = min(source_width, source_height * aspect) / zoom
        crop_height = crop_width / aspect
        cx = source_width * center[0]
        cy = source_height * center[1]
        left = clamp(cx - crop_width / 2, 0, source_width - crop_width)
        top = clamp(cy - crop_height / 2, 0, source_height - crop_height)
        return source.crop((left, top, left + crop_width, top + crop_height)).resize(
            output, Image.Resampling.LANCZOS)

    def map_scene(self, t: float) -> Image.Image:
        working = self.map.copy()
        box_alpha = round(230 * interval(t, 11.8, 12.8) * (1 - interval(t, 17.2, 18.2)))
        if box_alpha:
            overlay = Image.new("RGBA", working.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay, "RGBA")
            width = max(3, round(6 + 3 * interval(t, 12.8, 17.2)))
            draw.rounded_rectangle(self.roi, radius=8, outline=(*CYAN, box_alpha), width=width)
            working = Image.alpha_composite(working.convert("RGBA"), overlay).convert("RGB")

        progress = smooth(interval(t, 12.0, 18.5))
        zoom = lerp(1.35, 2.75, progress)
        center = (lerp(0.57, 0.634, progress), lerp(0.50, 0.511, progress))
        return self._on_canvas(self._camera_crop(working, (1120, 760), zoom, center))

    def similarity_scene(self, t: float) -> Image.Image:
        source = np.asarray(self.classifier.convert("L"), dtype=np.float32)
        score = np.clip((245.0 - source) / 225.0, 0, 1)
        score = score * score * (3 - 2 * score)
        isolation = smooth(interval(t, 21.0, 29.0))
        threshold = lerp(0.06, 0.46, isolation)
        visible = np.clip((score - threshold) / max(0.08, 1 - threshold), 0, 1)

        low = np.asarray(INK, dtype=np.float32)
        cyan = np.asarray(CYAN, dtype=np.float32)
        magenta = np.asarray(MAGENTA, dtype=np.float32)
        green = np.asarray(GREEN, dtype=np.float32)
        color_mix = np.clip((score - 0.36) / 0.40, 0, 1)[..., None]
        spectral_color = cyan * (1 - color_mix) + magenta * color_mix
        if isolation < 0.35:
            spectral_color = spectral_color * 0.88 + green * 0.12
        alpha = (0.10 + 0.90 * visible)[..., None]
        styled = low * (1 - alpha) + spectral_color * alpha
        styled[score < threshold * 0.82] = low
        panel = Image.fromarray(np.clip(styled, 0, 255).astype(np.uint8), "RGB")
        panel = panel.filter(ImageFilter.GaussianBlur(0.25))
        zoom = 1.0 + 0.11 * smooth(interval(t, 18, 34))
        panel = self._camera_crop(panel, (1120, 760), zoom, (0.50, 0.49))
        return self._on_canvas(panel)

    def _on_canvas(self, panel: Image.Image) -> Image.Image:
        canvas = Image.new("RGB", self.size, INK)
        x = (canvas.width - panel.width) // 2
        y = round(canvas.height * 0.425 - panel.height / 2)
        canvas.paste(panel, (x, y))
        bloom = canvas.filter(ImageFilter.GaussianBlur(6))
        return Image.blend(canvas, bloom, 0.045)


def render_frame(t: float, panels: SpectralPanels) -> tuple[Image.Image, str]:
    map_image = panels.map_scene(t)
    if t < 18:
        return map_image, "false_color_legend"
    similarity = panels.similarity_scene(t)
    if t < 22:
        return Image.blend(map_image, similarity, interval(t, 18, 22)), (
            "similarity_legend" if t >= 20 else "false_color_legend")
    return similarity, "similarity_legend"


def encode(args: argparse.Namespace) -> Path:
    copy = load_copy(args.captions)
    film_key = "spectral_openings"
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    duration = float(copy["films"][film_key]["duration"])
    panels = SpectralPanels(args.context_figure, args.classifier_figure, (width, height))
    fonts = Fonts(scale)
    output = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
        "-r", str(args.fps), "-i", "-", "-an", "-c:v", args.encoder,
    ]
    command += (["-preset", "p5", "-cq", "18", "-b:v", "0"]
                if args.encoder == "h264_nvenc"
                else ["-preset", "medium", "-crf", "17"])
    command += ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    total = round(duration * args.fps)
    try:
        for frame in range(total):
            t = frame / args.fps
            image, legend = render_frame(t, panels)
            draw_interface(image, copy, film_key, t, fonts, scale, legend)
            image = grade(image, frame + 94000)
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
        "source": {
            "paper": "Barbosa et al 2016 Determining Subcanopy Psidium cattleianum Invasion in Hawaiian Forests Using Imaging Spectroscopy",
            "figures": [1, 4],
            "context_figure_path": str(args.context_figure),
            "context_figure_sha256": sha256(args.context_figure),
            "classifier_figure_path": str(args.classifier_figure),
            "classifier_figure_sha256": sha256(args.classifier_figure),
            "license": "CC BY 4.0"
        },
        "evidence_boundary": {
            "map": "Published false color CAO AVIRIS imagery",
            "detail": "Published BSVM spectral similarity output linked to the lower locator box in Figure 4",
            "identity": "The target signature was trained with field identified strawberry guava crowns",
            "gap": "Canopy openings affect spectral mixing but this film does not display a measured gap mask",
            "fuel": "Spectral identity is not a measurement of fuel moisture or flammability"
        }
    }
    output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--context-figure", type=Path, required=True)
    result.add_argument("--classifier-figure", type=Path, required=True)
    result.add_argument("--captions", type=Path,
                        default=Path(__file__).with_name("spectral_openings_captions.json"))
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--size", default="1920x1080")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--encoder", choices=("libx264", "h264_nvenc"), default="h264_nvenc")
    return result


if __name__ == "__main__":
    print(encode(parser().parse_args()))
