#!/usr/bin/env python3
"""Render short real-data studies of spectral classification and resolution."""

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
    grade,
    interval,
    lerp,
    palette,
    project,
    smooth,
)


DURATION = 8.0
VIOLET = (134, 92, 238)


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
        self.source = ImageFont.truetype(mono, round(13 * scale))
        self.layer = ImageFont.truetype(bold, round(15 * scale))


def load_copy(path: Path, study: str) -> tuple[dict, dict]:
    copy = json.loads(path.read_text())
    if copy.get("schema") != "pyrocene-spectral-resolution-studies/1":
        raise ValueError("Unsupported caption schema")
    selected = copy["studies"][study]
    values = [copy["header"], selected["source"]]
    values.extend(sentence["text"] for sentence in selected["sentences"])
    values.extend(value for row in selected["legend"] for value in row[:2])
    for value in values:
        if any(mark in value for mark in (".", "—", "→", "·")):
            raise ValueError(f"Forbidden punctuation in on-screen copy: {value}")
    return copy, selected


def background(width: int, height: int) -> Image.Image:
    yy = np.linspace(0, 1, height, dtype=np.float32)[:, None]
    top = np.array((3, 9, 12), np.float32)
    bottom = np.array((2, 4, 5), np.float32)
    array = np.broadcast_to(
        top * (1 - yy[..., None]) + bottom * yy[..., None],
        (height, width, 3),
    ).copy()
    return Image.fromarray(array.astype(np.uint8), "RGB")


class StudyPainter:
    def __init__(self, width: int, height: int, cloud: Cloud,
                 neon_selected: np.ndarray, amazon: dict[str, np.ndarray]):
        self.width = width
        self.height = height
        self.rw = width // 2
        self.rh = height // 2
        self.cloud = cloud
        self.neon_selected = neon_selected
        self.emit_selected = amazon["emit_selected"] > 0
        self.emit_rgb = amazon["emit_rgb"]
        self.emit_signature_rgb = amazon["emit_signature_rgb"]
        self.sentinel_rgb = amazon["sentinel_rgb"]
        self.x_min = float(np.min(cloud.xyz[:, 0]))
        self.x_max = float(np.max(cloud.xyz[:, 0]))
        self.x_span = self.x_max - self.x_min
        self.y_min = float(np.min(cloud.xyz[:, 1]))
        self.y_max = float(np.max(cloud.xyz[:, 1]))
        self.y_span = self.y_max - self.y_min
        self.canopy_plane = float(np.percentile(cloud.height, 96))
        self.bg_small = background(self.rw, self.rh)
        self.neon_contours = self._contours(neon_selected, 18, 28)

    @staticmethod
    def _contours(mask: np.ndarray, minimum_area: float, maximum: int) -> list[np.ndarray]:
        contours, _ = cv2.findContours(
            mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        return [
            contour for contour in sorted(contours, key=cv2.contourArea, reverse=True)
            if cv2.contourArea(contour) >= minimum_area
        ][:maximum]

    def overview_camera(self, t: float):
        p = smooth(interval(t, 0.55, 4.4))
        span = max(self.x_span, self.y_span, 180.0)
        crown = max(25.0, float(np.percentile(self.cloud.height, 99)))
        angle = math.radians(-32.0)
        start_eye = np.array((math.cos(angle) * span * 0.96,
                              math.sin(angle) * span * 0.96,
                              span * 0.43))
        end_eye = np.array((0.0, -4.0, span * 2.55))
        eye = lerp(start_eye, end_eye, p)
        target = lerp((0.0, 0.0, crown * 0.31), (0.0, 0.0, 8.0), p)
        return eye, target, 38.0

    def stack_camera(self, t: float):
        span = max(self.x_span, self.y_span, 180.0)
        angle = math.radians(-48.0 + 5.0 * smooth(interval(t, 0.0, DURATION)))
        eye = np.array((math.cos(angle) * span * 1.80,
                        math.sin(angle) * span * 1.80,
                        span * 0.65))
        target = np.array((0.0, 0.0, 190.0))
        return eye, target, 60.0

    def point_selection(self, visible_points: np.ndarray,
                        visible_heights: np.ndarray, mask: np.ndarray) -> np.ndarray:
        rows, cols = mask.shape
        px = np.clip(((visible_points[:, 0] - self.x_min) / self.x_span * cols).astype(np.int32), 0, cols - 1)
        py = np.clip(((self.y_max - visible_points[:, 1]) / self.y_span * rows).astype(np.int32), 0, rows - 1)
        return (visible_heights >= 10.0) & mask[py, px]

    def render_cloud(self, eye, target, fov: float, selected: np.ndarray | None,
                     selected_strength: float, fade: float = 1.0) -> Image.Image:
        cloud = self.cloud
        sx, sy, depth, visible = project(cloud.xyz, eye, target, self.rw, self.rh, fov)
        height = cloud.height[visible]
        intensity = cloud.intensity[visible]
        points = cloud.xyz[visible]
        colors = palette(height)
        alpha = (0.68 + 0.55 * intensity).astype(np.float32) * fade
        chosen = np.zeros(len(height), dtype=bool)
        if selected is not None and selected_strength > 0:
            chosen = self.point_selection(points, height, selected)
            amount = 0.92 * selected_strength
            colors[chosen] = colors[chosen] * (1.0 - amount) + np.asarray(VIOLET) / 255.0 * amount
            alpha[chosen] *= 1.0 + 0.85 * selected_strength
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
                    index,
                    weights=colors[ok, channel] * weighted,
                    minlength=self.rh * self.rw,
                )
        acc = acc.reshape((self.rh, self.rw, 3))
        light = 1.0 - np.exp(-acc * 0.31)
        array = np.clip(np.asarray(self.bg_small, dtype=np.float32) + light * 255.0, 0, 255).astype(np.uint8)
        if np.any(chosen):
            ok = chosen & (xi >= 0) & (xi < self.rw) & (yi >= 0) & (yi < self.rh)
            index = yi[ok] * self.rw + xi[ok]
            selected_acc = np.bincount(
                index, weights=alpha[ok] * 0.82,
                minlength=self.rh * self.rw,
            ).reshape((self.rh, self.rw))
            highlight = (1.0 - np.exp(-selected_acc * 0.52)) * selected_strength
            amount = np.clip(highlight * 0.84, 0, 0.84)[..., None]
            array = np.clip(
                array.astype(np.float32) * (1.0 - amount)
                + np.asarray(VIOLET, dtype=np.float32) * amount,
                0, 255,
            ).astype(np.uint8)
        core = Image.fromarray(array, "RGB")
        glow = core.filter(ImageFilter.GaussianBlur(1.6))
        return Image.blend(core, glow, 0.12).resize(
            (self.width, self.height), Image.Resampling.LANCZOS
        )

    def draw_neon_boundaries(self, image: Image.Image, t: float, eye, target, fov) -> None:
        strength = interval(t, 4.65, 6.25)
        if strength <= 0:
            return
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        rows, cols = self.neon_selected.shape
        for contour in self.neon_contours:
            pixels = contour[:, 0, :]
            points = np.column_stack((
                self.x_min + pixels[:, 0] / max(cols - 1, 1) * self.x_span,
                self.y_max - pixels[:, 1] / max(rows - 1, 1) * self.y_span,
                np.full(len(pixels), self.canopy_plane + 2.0),
            )).astype(np.float32)
            sx, sy, _, visible = project(points, eye, target, self.width, self.height, fov)
            if len(sx) < 3 or np.sum(visible) != len(points):
                continue
            path = list(zip(sx.tolist(), sy.tolist()))
            path.append(path[0])
            draw.line(path, fill=(2, 7, 9, round(210 * strength)), width=max(5, self.width // 400), joint="curve")
            draw.line(path, fill=(*AMBER, round(250 * strength)), width=max(2, self.width // 950), joint="curve")
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

    def cell_corners(self, row: int, col: int, rows: int, cols: int, z: float) -> np.ndarray:
        x0 = self.x_min + col / cols * self.x_span
        x1 = self.x_min + (col + 1) / cols * self.x_span
        y1 = self.y_max - row / rows * self.y_span
        y0 = self.y_max - (row + 1) / rows * self.y_span
        return np.asarray(((x0, y1, z), (x1, y1, z), (x1, y0, z), (x0, y0, z)), dtype=np.float32)

    def draw_emit_grid(self, image: Image.Image, t: float, eye, target, fov) -> None:
        strength = interval(t, 2.15, 5.15)
        if strength <= 0:
            return
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        rows, cols = self.emit_selected.shape
        z = self.canopy_plane + 3.0
        for row in range(rows):
            for col in range(cols):
                corners = self.cell_corners(row, col, rows, cols, z)
                sx, sy, _, visible = project(corners, eye, target, self.width, self.height, fov)
                if len(sx) != 4 or np.sum(visible) != 4:
                    continue
                path = list(zip(sx.tolist(), sy.tolist()))
                if self.emit_selected[row, col]:
                    fill = (*VIOLET, round(118 * strength))
                    outline = (*AMBER, round(245 * strength))
                    width = max(2, self.width // 900)
                else:
                    base = tuple(int(v) for v in self.emit_signature_rgb[row, col])
                    fill = (*base, round(23 * strength))
                    outline = (*CYAN, round(34 * strength))
                    width = 1
                draw.polygon(path, fill=fill)
                draw.line(path + [path[0]], fill=outline, width=width, joint="curve")
        image.paste(overlay, (0, 0), overlay)

    @staticmethod
    def grid_texture(rgb: np.ndarray, cell_size: int, line: tuple[int, int, int]) -> np.ndarray:
        rows, cols = rgb.shape[:2]
        texture = np.repeat(np.repeat(rgb, cell_size, axis=0), cell_size, axis=1)
        color = np.asarray(line, dtype=np.uint8)
        texture[::cell_size, :] = color
        texture[:, ::cell_size] = color
        texture[-1, :] = color
        texture[:, -1] = color
        return texture

    def composite_plane(self, image: Image.Image, rgb: np.ndarray, z: float,
                        alpha: float, eye, target, fov: float,
                        cell_size: int, line: tuple[int, int, int]) -> list[tuple[float, float]]:
        texture = self.grid_texture(rgb, cell_size, line)
        corners = np.asarray((
            (self.x_min, self.y_max, z),
            (self.x_max, self.y_max, z),
            (self.x_max, self.y_min, z),
            (self.x_min, self.y_min, z),
        ), dtype=np.float32)
        sx, sy, _, visible = project(corners, eye, target, self.width, self.height, fov)
        if len(sx) != 4 or np.sum(visible) != 4:
            return []
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
        layer = Image.fromarray(warped, "RGB")
        mask = Image.fromarray(warped_mask, "L")
        image.paste(layer, (0, 0), mask)
        draw = ImageDraw.Draw(image, "RGBA")
        path = [tuple(value) for value in destination.tolist()]
        draw.line(path + [path[0]], fill=(*IVORY, 115), width=max(1, self.width // 1000), joint="curve")
        return path

    def render_neon(self, t: float) -> Image.Image:
        eye, target, fov = self.overview_camera(t)
        strength = interval(t, 2.05, 4.75)
        image = self.render_cloud(eye, target, fov, self.neon_selected, strength)
        self.draw_neon_boundaries(image, t, eye, target, fov)
        return image

    def render_emit(self, t: float) -> Image.Image:
        eye, target, fov = self.overview_camera(t)
        strength = interval(t, 2.15, 5.15)
        image = self.render_cloud(eye, target, fov, self.emit_selected, strength)
        self.draw_emit_grid(image, t, eye, target, fov)
        return image

    def render_stack(self, t: float, fonts: Fonts, scale: float) -> Image.Image:
        eye, target, fov = self.stack_camera(t)
        image = self.render_cloud(eye, target, fov, None, 0.0, fade=0.48)
        split = interval(t, 0.65, 3.45)
        z_middle = self.canopy_plane + 12.0 + 158.0 * split
        z_top = self.canopy_plane + 24.0 + 366.0 * split
        middle_path = self.composite_plane(
            image, self.sentinel_rgb, z_middle, 0.78 * interval(t, 0.35, 1.7),
            eye, target, fov, 3, (28, 92, 91),
        )
        top_path = self.composite_plane(
            image, self.emit_rgb, z_top, 0.84 * interval(t, 1.15, 2.65),
            eye, target, fov, 24, (83, 64, 126),
        )
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        if middle_path and top_path:
            for index in range(4):
                draw.line(
                    [middle_path[index], top_path[index]],
                    fill=(*MUTED, round(82 * split)), width=max(1, self.width // 1500),
                )
        self.draw_layer_label(draw, top_path, "60 M HYPERSPECTRAL", VIOLET, fonts, scale, -18)
        self.draw_layer_label(draw, middle_path, "10 M MULTISPECTRAL", CYAN, fonts, scale, 5)
        base_anchor = np.asarray(((self.x_min, self.y_min, 4.0),), dtype=np.float32)
        sx, sy, _, visible = project(base_anchor, eye, target, self.width, self.height, fov)
        if len(sx) == 1 and np.sum(visible) == 1:
            self.draw_label_at(draw, (sx[0], sy[0] + 10 * scale), "LIDAR RETURNS", GREEN, fonts, scale)
        image.paste(overlay, (0, 0), overlay)
        return image

    def draw_layer_label(self, draw: ImageDraw.ImageDraw, path: list[tuple[float, float]],
                         text: str, color: tuple[int, int, int], fonts: Fonts,
                         scale: float, y_offset: float) -> None:
        if not path:
            return
        anchor = (path[0][0], path[0][1] + y_offset * scale)
        self.draw_label_at(draw, anchor, text, color, fonts, scale)

    @staticmethod
    def draw_label_at(draw: ImageDraw.ImageDraw, anchor: tuple[float, float], text: str,
                      color: tuple[int, int, int], fonts: Fonts, scale: float) -> None:
        x = round(anchor[0] + 10 * scale)
        y = round(anchor[1])
        box = draw.textbbox((x, y), text, font=fonts.layer)
        pad = round(7 * scale)
        draw.rounded_rectangle(
            (box[0] - pad, box[1] - pad // 2, box[2] + pad, box[3] + pad // 2),
            radius=max(3, round(4 * scale)), fill=(2, 7, 9, 205),
            outline=(*color, 150), width=1,
        )
        draw.text((x, y), text, font=fonts.layer, fill=(*IVORY, 238))


def rounded_glass(image: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=radius, fill=198)
    image.paste(image.filter(ImageFilter.GaussianBlur(max(5, radius // 2))), (0, 0), mask)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(overlay, "RGBA").rounded_rectangle(
        box, radius=radius, fill=(2, 7, 9, 168),
        outline=(127, 164, 158, 38), width=1,
    )
    image.paste(overlay, (0, 0), overlay)


def active_sentence(copy: dict, t: float) -> tuple[str, float]:
    for sentence in copy["sentences"]:
        if sentence["start"] <= t < sentence["end"]:
            fade = interval(t, sentence["start"], sentence["start"] + 0.35)
            fade *= 1.0 - interval(t, sentence["end"] - 0.30, sentence["end"])
            return sentence["text"], fade
    return "", 0.0


def draw_interface(image: Image.Image, header: str, copy: dict, t: float,
                   fonts: Fonts, scale: float) -> None:
    fade = interval(t, 0, 0.30) * (1.0 - interval(t, DURATION - 0.30, DURATION))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((round(62 * scale), round(45 * scale)), header, font=fonts.header,
              fill=(*IVORY, round(238 * fade)))

    x1 = image.width - round(54 * scale)
    x0 = x1 - round(410 * scale)
    y0 = round(42 * scale)
    y1 = y0 + round(137 * scale)
    rounded_glass(image, (x0, y0, x1, y1), round(12 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    palette_rows = {"green": GREEN, "cyan": CYAN, "magenta": MAGENTA,
                    "violet": VIOLET, "amber": AMBER}
    for index, (name, detail, color_key) in enumerate(copy["legend"]):
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
    left = round(54 * scale)
    bottom = image.height - round(42 * scale)
    right = min(image.width - round(54 * scale), left + round(1170 * scale))
    top = bottom - round(116 * scale)
    rounded_glass(image, (left, top, right, bottom), round(13 * scale))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((left + round(23 * scale), top + round(16 * scale)), sentence,
              font=fonts.caption, fill=(*IVORY, round(255 * sentence_alpha * fade)))
    draw.text((left + round(24 * scale), bottom - round(29 * scale)), copy["source"],
              font=fonts.source, fill=(*CYAN, round(225 * fade)))


def encode(args: argparse.Namespace) -> Path:
    width, height = map(int, args.size.lower().split("x"))
    scale = width / 1920.0
    all_copy, copy = load_copy(args.captions, args.study)
    cloud = Cloud.load(args.amazon)
    neon = np.load(args.neon_artifact)
    amazon_data = np.load(args.amazon_spectral_artifact)
    amazon = {key: amazon_data[key] for key in amazon_data.files}
    painter = StudyPainter(
        width, height, cloud, neon["classifier_selected"] > 0, amazon
    )
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
            if args.study == "neon":
                image = painter.render_neon(t)
            elif args.study == "emit":
                image = painter.render_emit(t)
            else:
                image = painter.render_stack(t, fonts, scale)
            draw_interface(image, all_copy["header"], copy, t, fonts, scale)
            image = grade(image, frame + 132000 + {"neon": 0, "emit": 1000, "stack": 2000}[args.study])
            process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
            if frame % max(1, args.fps) == 0:
                print(f"{args.study}: {frame}/{total}", flush=True)
    finally:
        if process.stdin:
            process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg encoder failed")

    manifest = {
        "schema": "pyrocene-spectral-resolution-study/1",
        "study": args.study,
        "output": str(args.output),
        "output_sha256": sha256(args.output),
        "resolution": [width, height],
        "fps": args.fps,
        "duration_seconds": DURATION,
        "audio": False,
        "amazon_lidar": {
            "path": str(args.amazon), "sha256": sha256(args.amazon),
            "source": "EBA T_0638", "acquisition": "2017-05-08",
        },
        "neon_artifact": {
            "path": str(args.neon_artifact), "sha256": sha256(args.neon_artifact),
            "role": "non co located educational spectral signature only",
        },
        "amazon_spectral_artifact": json.loads(
            args.amazon_spectral_artifact.with_suffix(".manifest.json").read_text()
        ),
        "claim_boundary": (
            "Violet identifies one unsupervised repeated spectral signature and not a species fuel moisture or fire class"
        ),
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--study", choices=("neon", "emit", "stack"), required=True)
    result.add_argument("--amazon", type=Path, required=True)
    result.add_argument("--neon-artifact", type=Path, required=True)
    result.add_argument("--amazon-spectral-artifact", type=Path, required=True)
    result.add_argument("--captions", type=Path, default=Path(__file__).with_name("spectral_resolution_captions.json"))
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--size", default="2560x1440")
    result.add_argument("--fps", type=int, default=24)
    result.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    return result


if __name__ == "__main__":
    print(encode(parser().parse_args()))
