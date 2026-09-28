#!/usr/bin/env python3
"""Render comparable Pyrocene film prototypes from one event log.

The recorded fire waves remain authoritative. Decorative positions and audio
are seeded from the game seed so the same log always produces the same film.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


IVORY = (236, 233, 220)
ASH = (166, 177, 170)
CYAN = (95, 211, 226)
AMBER = (239, 179, 87)
EMBER = (255, 89, 22)


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def smooth(v):
    v = clamp(v)
    return v * v * (3.0 - 2.0 * v)


def cell_xy(name: str) -> tuple[int, int]:
    letters = "".join(c for c in name if c.isalpha())
    digits = "".join(c for c in name if c.isdigit())
    col = 0
    for c in letters:
        col = col * 26 + ord(c.upper()) - 64
    return col - 1, int(digits) - 1


def normalized_cover(value: str) -> str:
    return "invasive" if str(value).startswith("invasive") else value


def apply_changes(board, changes):
    result = {k: dict(v) for k, v in board.items()}
    for change in changes:
        old = result.get(change["cell"], {"cell": change["cell"]})
        result[change["cell"]] = {**old, "cover": normalized_cover(change["to"])}
    return result


class FilmModel:
    def __init__(self, data):
        game = data["game"]
        self.seed = int(game.get("seed", 1701))
        self.cols = int(game["cols"])
        self.rows = int(game["rows"])
        self.initial = {c["cell"]: dict(c) for c in game["terrain"]}
        self.rounds = []
        board = {k: dict(v) for k, v in self.initial.items()}
        lines = set()
        for raw in data.get("rounds", []):
            changes = raw.get("landscape_changes", [])
            burned = set((raw.get("fire") or {}).get("burned_cells", []))
            cut = len(changes)
            while cut and changes[cut - 1]["cell"] in burned and changes[cut - 1]["to"] == "bare":
                cut -= 1
            before = {k: dict(v) for k, v in board.items()}
            pre = apply_changes(before, changes[:cut])
            end = apply_changes(pre, changes[cut:])
            resilience = raw.get("resilience") or {}
            if resilience.get("type") == "fire_line":
                lines.update(resilience.get("cells", []))
            self.rounds.append({"raw": raw, "before": before, "pre": pre,
                                "end": end, "lines": set(lines)})
            board = end
        if not self.rounds:
            raise ValueError("The log has no completed nights to render")
        self.major = max(self.rounds,
                         key=lambda r: len((r["raw"].get("fire") or {}).get("burned_cells", [])))
        self.pre = self.major["pre"]
        self.post = self.major["end"]
        self.fire = self.major["raw"].get("fire") or {}
        self.turn = self.major["raw"]["turn"]
        self.health_before = self.major["raw"].get("health_before", 0)
        self.health_after = self.major["raw"].get("health", 0)
        self.burned = set(self.fire.get("burned_cells", []))
        self.waves = self.fire.get("waves", [])
        self.wave_for = {name: i for i, wave_cells in enumerate(self.waves)
                         for name in wave_cells}
        self.cell_names = list(self.initial)
        self.cell_index = {name: i for i, name in enumerate(self.cell_names)}


class Fonts:
    def __init__(self, scale=1.0):
        sans = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Regular.otf"
        bold = "/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf"
        serif = "/usr/share/fonts/opentype/urw-base35/P052-Roman.otf"
        self.micro = ImageFont.truetype(bold, round(13 * scale))
        self.small = ImageFont.truetype(sans, round(17 * scale))
        self.body = ImageFont.truetype(sans, round(22 * scale))
        self.title = ImageFont.truetype(serif, round(47 * scale))
        self.number = ImageFont.truetype(sans, round(29 * scale))


def story(model: FilmModel, t: float, duration: float):
    fire_start = duration * 0.43
    fire_end = duration * 0.78
    if t < duration * 0.18:
        return ("THE LANDSCAPE BEFORE THE FIRE",
                f"Night {model.turn}. The room has made this forest.",
                "Every point is tied to the final game record.")
    if t < duration * 0.34:
        return ("CONNECTED FUEL",
                "The invaded stands no longer sit apart.",
                "Survival has turned separate patches into a route.")
    if t < fire_start:
        cause = "inside a thick stand" if model.fire.get("ignition_cause") == "dense_lantana" else "beside the road"
        return ("IGNITION",
                f"One ignition begins {cause}.",
                "The spark is local. The fuel determines where it can travel.")
    if t < fire_end:
        return ("THE FIRE RUNS",
                f"{len(model.burned)} cells burn in {len(model.waves)} recorded waves.",
                "The front follows the landscape the room created.")
    return ("AFTERMATH",
            f"Forest health falls from {model.health_before}% to {model.health_after}%.",
            "The flames pass. The altered ground remains.")


def add_hud(image: Image.Image, model: FilmModel, t: float, duration: float,
            variant_name: str, fonts: Fonts):
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = image.size
    kicker, title, detail = story(model, t, duration)
    fade = smooth(t / 0.65) * smooth((duration - t) / 0.7)
    alpha = round(255 * fade)
    draw.rectangle((0, 0, w, 22), fill=(0, 0, 0, 255))
    draw.rectangle((0, h - 22, w, h), fill=(0, 0, 0, 255))
    draw.text((52, 47), "PYROCENE", font=fonts.micro, fill=(*IVORY, alpha),
              stroke_width=0)
    draw.text((52, 68), variant_name.upper(), font=fonts.micro, fill=(*ASH, alpha))
    health_mix = smooth((t / duration - 0.72) / 0.14)
    health = round(model.health_before + (model.health_after - model.health_before) * health_mix)
    right = f"NIGHT {model.turn}   FOREST HEALTH  {health}%"
    bbox = draw.textbbox((0, 0), right, font=fonts.micro)
    draw.text((w - 52 - (bbox[2] - bbox[0]), 48), right, font=fonts.micro,
              fill=(*IVORY, alpha))
    y = h - 210
    draw.rectangle((54, y, 105, y + 3), fill=(*AMBER, alpha))
    draw.text((54, y + 18), kicker, font=fonts.micro, fill=(*AMBER, alpha))
    draw.text((54, y + 44), title, font=fonts.title, fill=(*IVORY, alpha))
    draw.text((57, y + 108), detail, font=fonts.small, fill=(*ASH, alpha))
    progress = clamp(t / duration)
    draw.line((52, h - 51, w - 52, h - 51), fill=(180, 191, 183, 60), width=1)
    draw.line((52, h - 51, 52 + (w - 104) * progress, h - 51),
              fill=(*AMBER, 210), width=2)


def add_grade(image: Image.Image, seed: int, frame: int):
    w, h = image.size
    yy, xx = np.mgrid[0:h, 0:w]
    dx = (xx - w / 2) / (w / 2)
    dy = (yy - h / 2) / (h / 2)
    vignette = np.clip(1.03 - 0.40 * (dx * dx + dy * dy), 0.43, 1.0)
    arr = np.asarray(image, dtype=np.float32)
    arr *= vignette[..., None]
    rng = np.random.default_rng(seed + frame * 7919)
    grain = rng.normal(0, 2.1, (h, w, 1))
    arr += grain
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def camera_basis(eye, target):
    eye = np.asarray(eye, dtype=np.float32)
    target = np.asarray(target, dtype=np.float32)
    forward = target - eye
    forward /= np.linalg.norm(forward)
    right = np.cross(forward, np.array([0, 0, 1], dtype=np.float32))
    right /= np.linalg.norm(right)
    up = np.cross(right, forward)
    return eye, right, up, forward


def project(points, eye, target, width, height, fov=42):
    eye, right, up, forward = camera_basis(eye, target)
    rel = points - eye
    z = rel @ forward
    x = rel @ right
    y = rel @ up
    focal = width * 0.5 / math.tan(math.radians(fov) * 0.5)
    sx = width * 0.5 + focal * x / np.maximum(z, 0.01)
    sy = height * 0.53 - focal * y / np.maximum(z, 0.01)
    visible = (z > 0.2) & (sx >= 0) & (sx < width) & (sy >= 0) & (sy < height)
    return sx[visible].astype(np.int32), sy[visible].astype(np.int32), z[visible], visible


def terrain_height(x, y, hill=False):
    return 0.14 * np.sin(x * 0.7) + 0.11 * np.cos(y * 0.55) + (0.75 if hill else 0.0)


class PointCloudRenderer:
    def __init__(self, model: FilmModel, width: int, height: int):
        self.model = model
        self.w = width // 2
        self.h = height // 2
        self.out_size = (width, height)
        self.rng = np.random.default_rng(model.seed)
        self.pre_cover = np.asarray([normalized_cover(model.pre[name]["cover"])
                                     for name in model.cell_names])
        self.burned_cell_ids = np.asarray([model.cell_index[name] for name in model.burned],
                                          dtype=np.int16)
        self.groups = self._make_points()
        self.fire_points = self._make_fire_points()

    def _make_points(self):
        groups = {"ground": [], "native": [], "invasive": [], "bare": []}
        colors = {k: [] for k in groups}
        ids = {k: [] for k in groups}
        cx0, cy0 = (self.model.cols - 1) / 2, (self.model.rows - 1) / 2
        for cell_id, name in enumerate(self.model.cell_names):
            c, r = cell_xy(name)
            base_x, base_y = c - cx0, r - cy0
            hill = bool(self.model.initial[name].get("hill"))
            for _ in range(18):
                x, y = base_x + self.rng.uniform(-.60, .60, 2)
                z = terrain_height(x, y, hill) + self.rng.uniform(-.03, .03)
                groups["ground"].append((x, y, z))
                colors["ground"].append((20, 38, 29))
                ids["ground"].append(cell_id)
            for tree in range(4):
                tx, ty = base_x + self.rng.uniform(-.55, .55, 2)
                trunk_h = self.rng.uniform(1.7, 3.5)
                for z in np.linspace(.1, trunk_h, 8):
                    groups["native"].append((tx + self.rng.normal(0, .015), ty + self.rng.normal(0, .015), z))
                    colors["native"].append((68, 88, 69))
                    ids["native"].append(cell_id)
                for _ in range(18):
                    a = self.rng.uniform(0, math.tau)
                    rr = math.sqrt(self.rng.random()) * .59
                    z = trunk_h + self.rng.normal(.10, .26)
                    groups["native"].append((tx + math.cos(a) * rr, ty + math.sin(a) * rr, z))
                    colors["native"].append((48 + self.rng.integers(0, 25), 104 + self.rng.integers(0, 34), 67 + self.rng.integers(0, 22)))
                    ids["native"].append(cell_id)
            for _ in range(95):
                x, y = base_x + self.rng.uniform(-.61, .61, 2)
                z = terrain_height(x, y, hill) + self.rng.uniform(.08, 1.08)
                groups["invasive"].append((x, y, z))
                colors["invasive"].append((110 + self.rng.integers(0, 36), 45 + self.rng.integers(0, 18), 75 + self.rng.integers(0, 22)))
                ids["invasive"].append(cell_id)
            for _ in range(34):
                x, y = base_x + self.rng.uniform(-.5, .5, 2)
                z = terrain_height(x, y, hill) + self.rng.uniform(.02, .20)
                groups["bare"].append((x, y, z))
                colors["bare"].append((66 + self.rng.integers(0, 25), 39 + self.rng.integers(0, 18), 27))
                ids["bare"].append(cell_id)
        return {k: (np.asarray(groups[k], np.float32), np.asarray(colors[k], np.float32),
                    np.asarray(ids[k], np.int16)) for k in groups}

    def _make_fire_points(self):
        result = {}
        cx0, cy0 = (self.model.cols - 1) / 2, (self.model.rows - 1) / 2
        for name in self.model.burned:
            c, r = cell_xy(name)
            base = np.empty((56, 4), np.float32)
            base[:, 0] = c - cx0 + self.rng.uniform(-.47, .47, 56)
            base[:, 1] = r - cy0 + self.rng.uniform(-.47, .47, 56)
            base[:, 2] = self.rng.uniform(0, 1, 56)
            base[:, 3] = self.rng.uniform(0, math.tau, 56)
            result[name] = base
        return result

    def _camera(self, t, duration):
        p = t / duration
        if p < .34:
            q = smooth(p / .34)
            eye = (12 - 9*q, -18 + 6*q, 10 - 3*q)
            target = (1, 0, 1.0)
        elif p < .78:
            q = smooth((p - .34) / .44)
            eye = (3 - 9*q, -12 + 8*q, 7 - 2*q)
            target = (-1 + 2*q, 1, 1.0)
        else:
            q = smooth((p - .78) / .22)
            eye = (-6 + 5*q, -4 - 11*q, 5 + 7*q)
            target = (0, 0, .4)
        return eye, target

    def _deposit(self, acc, points, colors, eye, target, strength=1.0, radius=0):
        if not len(points):
            return
        x, y, depth, visible = project(points, eye, target, self.w, self.h)
        col = colors[visible] * strength * np.clip(1.35 - depth[:, None] / 32, .45, 1.0)
        for dx, dy, falloff in [(0, 0, 1.0), (1, 0, .32), (-1, 0, .32), (0, 1, .32), (0, -1, .32)][:1 + radius * 4]:
            xx, yy = x + dx, y + dy
            ok = (xx >= 0) & (xx < self.w) & (yy >= 0) & (yy < self.h)
            for channel in range(3):
                np.add.at(acc[..., channel], (yy[ok], xx[ok]), col[ok, channel] * falloff)

    def render(self, t, duration, frame):
        acc = np.zeros((self.h, self.w, 3), np.float32)
        eye, target = self._camera(t, duration)
        after = smooth((t/duration-.78)/.16)
        for kind in ("ground", "native", "invasive", "bare"):
            points, colors, cell_ids = self.groups[kind]
            if kind == "ground":
                mask = np.ones(len(points), bool)
                self._deposit(acc, points, colors, eye, target, .95)
                continue
            burned_mask = np.isin(cell_ids, self.burned_cell_ids)
            if kind == "bare":
                old_mask = self.pre_cover[cell_ids] == "bare"
                new_mask = burned_mask
                self._deposit(acc, points[old_mask], colors[old_mask], eye, target, 1.0)
                self._deposit(acc, points[new_mask], colors[new_mask], eye, target, after*1.35)
            else:
                mask = self.pre_cover[cell_ids] == kind
                self._deposit(acc, points[mask & ~burned_mask], colors[mask & ~burned_mask], eye, target, 1.42)
                self._deposit(acc, points[mask & burned_mask], colors[mask & burned_mask], eye, target, 1.42*(1-after))
        fire_start, fire_end = duration * .43, duration * .78
        fire_p = clamp((t - fire_start) / (fire_end - fire_start))
        active = []
        for name, base in self.fire_points.items():
            wave_no = self.model.wave_for.get(name, 0)
            if t >= fire_start and wave_no <= fire_p * max(1, len(self.model.waves)):
                phase = base[:, 3]
                rise = np.mod((t - fire_start) * (1.1 + base[:, 2]) + phase, 3.3)
                pts = np.column_stack((base[:, 0] + np.sin(phase + t * 2) * .035,
                                       base[:, 1], .16 + rise * .82))
                hot = np.clip(1 - rise / 3.3, 0, 1)
                cols = np.column_stack((np.full(len(base), 255), 55 + hot * 180,
                                        8 + hot * 30))
                active.append((pts.astype(np.float32), cols.astype(np.float32)))
        fire_fade = 1-smooth((t-fire_end)/max(.01, duration-fire_end))
        for points, colors in active:
            self._deposit(acc, points, colors, eye, target, 1.62*fire_fade, radius=1)
        core = Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8), "RGB")
        glow = core.filter(ImageFilter.GaussianBlur(2.5))
        image = Image.blend(core, glow, .38).resize(self.out_size, Image.Resampling.LANCZOS)
        image = ImageEnhance.Brightness(image).enhance(1.28)
        draw = ImageDraw.Draw(image, "RGBA")
        scan_p = clamp((t / duration - .12) / .22)
        if 0 < scan_p < 1:
            x_world = -self.model.cols / 2 + scan_p * self.model.cols
            scan_points = np.array([[x_world, -self.model.rows/2, 0], [x_world, self.model.rows/2, 0],
                                    [x_world, self.model.rows/2, 5], [x_world, -self.model.rows/2, 5]], np.float32)
            sx, sy, _, vis = project(scan_points, eye, target, self.out_size[0], self.out_size[1])
            if vis.sum() == 4:
                polygon = list(zip(sx.tolist(), sy.tolist()))
                draw.polygon(polygon, fill=(*CYAN, 18), outline=(*CYAN, 105), width=2)
        return image


class DocumentaryRenderer:
    def __init__(self, model: FilmModel, width: int, height: int):
        self.model, self.w, self.h = model, width, height
        self.rng = np.random.default_rng(model.seed + 120)
        self.base_pre = self._map_image(model.pre)
        self.base_post = self._map_image(model.post)

    def _map_image(self, board):
        cell = 46
        w, h = self.model.cols * cell, self.model.rows * cell
        arr = np.zeros((h, w, 3), np.float32)
        palette = {"native": (28, 76, 48), "invasive": (91, 40, 65),
                   "bare": (36, 27, 20), "water": (20, 66, 77),
                   "village": (99, 87, 69)}
        grid = np.zeros((self.model.rows, self.model.cols, 3), np.float32)
        for name, data in board.items():
            c, r = cell_xy(name)
            grid[r, c] = palette.get(normalized_cover(data["cover"]), (30, 55, 39))
        yy, xx = np.mgrid[0:h, 0:w]
        wx = xx + 10*np.sin(yy*.045) + 7*np.sin((xx+yy)*.019)
        wy = yy + 9*np.sin(xx*.034) + 6*np.cos((xx-yy)*.021)
        cc = np.clip((wx/cell).astype(int), 0, self.model.cols-1)
        rr = np.clip((wy/cell).astype(int), 0, self.model.rows-1)
        arr[:] = grid[rr, cc]
        noise = self.rng.normal(0, 11, arr.shape[:2])
        arr += noise[..., None]
        image = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(13.5))
        draw = ImageDraw.Draw(image, "RGBA")
        road_cells = {name for name, data in self.model.initial.items() if data.get("road")}
        for name, data in self.model.initial.items():
            c, r = cell_xy(name)
            x, y = c*cell + cell/2, r*cell + cell/2
            if name in road_cells:
                for dc, dr in ((1, 0), (0, 1)):
                    other = next((n for n in road_cells if cell_xy(n) == (c+dc, r+dr)), None)
                    if other:
                        ox, oy = (c+dc)*cell+cell/2, (r+dr)*cell+cell/2
                        draw.line((x, y, ox, oy), fill=(164, 149, 119, 170), width=5)
            if data.get("cover") == "village":
                draw.ellipse((x-8, y-8, x+8, y+8), fill=(255, 197, 104, 230))
        return image.filter(ImageFilter.GaussianBlur(.7))

    def _fit(self, image, t, duration):
        q = smooth(t / duration)
        scale = 1.03 + .25 * q
        target_w, target_h = round(self.w * scale), round(self.h * scale)
        fitted = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
        x = round((target_w - self.w) * (.18 + .58*q))
        y = round((target_h - self.h) * (.62 - .28*q))
        return fitted.crop((x, y, x+self.w, y+self.h))

    def render(self, t, duration, frame):
        after = smooth((t / duration - .77) / .13)
        terrain = Image.blend(self.base_pre, self.base_post, after)
        terrain = terrain.resize((self.w, self.h), Image.Resampling.LANCZOS)
        terrain = self._fit(terrain, t, duration)
        image = Image.new("RGB", (self.w, self.h), (3, 8, 8))
        terrain = ImageEnhance.Contrast(terrain).enhance(1.2)
        image.paste(terrain)
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        heat = Image.new("L", image.size, 0)
        heat_draw = ImageDraw.Draw(heat)
        fire_start, fire_end = duration*.43, duration*.78
        p = clamp((t-fire_start)/(fire_end-fire_start))
        cell_w, cell_h = self.w/self.model.cols, self.h/self.model.rows
        for name in self.model.burned:
            wave_no = self.model.wave_for.get(name, 0)
            if t < fire_start or wave_no > p * max(1, len(self.model.waves)):
                continue
            c, r = cell_xy(name)
            x, y = (c+.5)*cell_w, (r+.5)*cell_h
            age = p - wave_no/max(1, len(self.model.waves))
            rad = max(cell_w, cell_h) * (.66 + .34*clamp(age*5))
            fire_fade = 1-smooth((t-fire_end)/max(.01, duration-fire_end))
            heat_draw.ellipse((x-rad, y-rad, x+rad, y+rad), fill=round(145*fire_fade))
            for k in range(3):
                phase = self.model.seed + frame*7 + c*31 + r*53 + k*97
                ex = x + math.sin(phase)*rad*.65
                ey = y - (frame % 26)*1.5 + math.cos(phase*.7)*rad*.35
                draw.ellipse((ex-2, ey-2, ex+2, ey+2), fill=(255, 188, 74, round(190*fire_fade)))
        heat = heat.filter(ImageFilter.GaussianBlur(max(cell_w, cell_h)*.42))
        heat_color = Image.new("RGBA", image.size, (255, 70, 13, 0))
        heat_color.putalpha(heat)
        glow = heat_color.filter(ImageFilter.GaussianBlur(18))
        image = Image.alpha_composite(image.convert("RGBA"), glow)
        image = Image.alpha_composite(image, heat_color)
        image = Image.alpha_composite(image, overlay)
        scan = clamp((t/duration-.18)/.18)
        if 0 < scan < 1:
            d = ImageDraw.Draw(image, "RGBA")
            x = round(scan*self.w)
            d.rectangle((x-4, 0, x+4, self.h), fill=(*CYAN, 28))
            d.line((x, 0, x, self.h), fill=(*CYAN, 155), width=1)
        return image.convert("RGB")


class HybridRenderer:
    def __init__(self, model, width, height, base_path, fire_path):
        self.model, self.w, self.h = model, width, height
        self.base = Image.open(base_path).convert("RGB")
        self.fire = Image.open(fire_path).convert("RGB")

    def _crop(self, image, t, duration):
        aspect = self.w / self.h
        iw, ih = image.size
        crop_h = min(ih, iw/aspect) * (1 - .10*smooth(t/duration))
        crop_w = crop_h * aspect
        q = smooth(t/duration)
        left = (iw-crop_w) * (.18 + .42*q)
        top = (ih-crop_h) * (.48 - .20*q)
        return image.crop((left, top, left+crop_w, top+crop_h)).resize((self.w, self.h), Image.Resampling.LANCZOS)

    def board_screen(self, name):
        c, r = cell_xy(name)
        u, v = c/(self.model.cols-1), r/(self.model.rows-1)
        index = self.model.cell_index[name]
        jx = math.sin((index+self.model.seed)*12.9898)*.008
        jy = math.sin((index+self.model.seed)*31.417)*.008
        x = self.w*(.17 + .60*u + .075*math.sin(math.pi*v) + .04*v + jx)
        y = self.h*(.31 + .37*v - .075*u + .025*math.sin(math.pi*u) + jy)
        return x, y

    def render(self, t, duration, frame):
        fire_start, fire_end = duration*.43, duration*.78
        p = smooth((t-fire_start)/(fire_end-fire_start))
        base = self._crop(self.base, t, duration)
        burning = self._crop(self.fire, t, duration)
        fire_mix = p*.88
        if t > fire_end:
            fire_mix *= 1-.78*smooth((t-fire_end)/(duration-fire_end))
        image = Image.blend(base, burning, fire_mix)
        if t > fire_end:
            image = ImageEnhance.Color(image).enhance(1-.55*smooth((t-fire_end)/(duration-fire_end)))
            image = ImageEnhance.Brightness(image).enhance(1-.25*smooth((t-fire_end)/(duration-fire_end)))
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        active = []
        for name in self.model.burned:
            wave_no = self.model.wave_for.get(name, 0)
            if t >= fire_start and wave_no <= p*max(1, len(self.model.waves)):
                active.append(name)
        overlay_fade = 1-smooth((t-fire_end)/max(.01, duration-fire_end))
        for name in active:
            x, y = self.board_screen(name)
            cell_index = self.model.cell_index[name]
            wave_no = self.model.wave_for.get(name, 0)
            newest = abs(wave_no-p*max(1, len(self.model.waves))) < 1.3
            for k in range(5):
                angle = math.sin((cell_index+1)*(k+3)*9.71)*math.tau
                spread = 2.5 + 7.5*((k+1)/5)
                px, py = x+math.cos(angle)*spread, y+math.sin(angle)*spread*.55
                pulse = .72 + .28*math.sin(frame*.35 + cell_index + k)
                rad = (1.4 if not newest else 2.2) + 1.4*pulse
                draw.ellipse((px-rad, py-rad, px+rad, py+rad),
                             fill=(*EMBER, round((92 if not newest else 190)*overlay_fade)),
                             outline=(255, 215, 132, round((175 if newest else 65)*overlay_fade)), width=1)
        if active:
            draw.text((self.w-285, 108), "RECORDED FIRE FRONT", font=ImageFont.truetype("/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf", 13), fill=(*CYAN, 210))
        scan = clamp((t/duration-.13)/.17)
        if 0 < scan < 1:
            x = self.w*(.18+.69*scan)
            draw.polygon([(x-15, self.h*.24), (x+15, self.h*.23), (x+70, self.h*.78), (x+25, self.h*.80)], fill=(*CYAN, 20), outline=(*CYAN, 105))
        overlay = overlay.filter(ImageFilter.GaussianBlur(.35))
        return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def make_audio(path: Path, duration: float, sample_rate=48000):
    n = round(duration * sample_rate)
    t = np.arange(n, dtype=np.float32) / sample_rate
    rng = np.random.default_rng(4401)
    noise = rng.normal(0, 1, n).astype(np.float32)
    window = 900
    cumulative = np.cumsum(np.pad(noise, (1, 0)), dtype=np.float64)
    wind = np.zeros(n, np.float32)
    wind[window:] = ((cumulative[window+1:] - cumulative[1:-window]) / window).astype(np.float32)
    wind /= max(.001, np.max(np.abs(wind)))
    fire_gate = np.clip((t-duration*.39)/1.2, 0, 1) * np.clip((duration*.84-t)/1.1, 0, 1)
    crackle = np.sign(noise) * np.power(np.abs(noise), 5) * fire_gate
    drone = .08*np.sin(math.tau*43*t) + .035*np.sin(math.tau*64.5*t)
    impact_t = duration*.40
    impact_age = t-impact_t
    impact = np.where((impact_age >= 0) & (impact_age < 1.6),
                      np.sin(math.tau*(58-16*np.clip(impact_age, 0, 1.6))*impact_age)*np.exp(-impact_age*2.4), 0)
    audio = .11*wind + drone + .045*crackle + .22*impact
    fade = np.minimum(np.clip(t/.8, 0, 1), np.clip((duration-t)/.8, 0, 1))
    audio = np.clip(audio*fade, -.95, .95)
    pcm = (audio*32767).astype("<i2")
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())


def render(args):
    data = json.loads(Path(args.log).read_text())
    model = FilmModel(data)
    width, height = map(int, args.size.lower().split("x"))
    fonts = Fonts(width/1280)
    if args.variant == "point-cloud":
        renderer = PointCloudRenderer(model, width, height)
        label = "SPATIAL RECONSTRUCTION"
    elif args.variant == "documentary":
        renderer = DocumentaryRenderer(model, width, height)
        label = "DOCUMENTARY MAP"
    else:
        if not args.base_plate or not args.fire_plate:
            raise ValueError("hybrid rendering requires --base-plate and --fire-plate")
        renderer = HybridRenderer(model, width, height, args.base_plate, args.fire_plate)
        label = "CINEMATIC RECONSTRUCTION"

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists() and not args.overwrite:
        raise FileExistsError(f"Refusing to overwrite {output}; pass --overwrite")
    frames = round(args.duration * args.fps)
    with tempfile.TemporaryDirectory(prefix="pyrocene-render-") as temp:
        silent = Path(temp)/"silent.mp4"
        audio = Path(temp)/"sound.wav"
        command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                   "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
                   "-r", str(args.fps), "-i", "-", "-an", "-c:v", args.encoder]
        if args.encoder == "h264_nvenc":
            command += ["-preset", "p5", "-cq", "20", "-b:v", "0"]
        else:
            command += ["-preset", "medium", "-crf", "18"]
        command += ["-pix_fmt", "yuv420p", str(silent)]
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        try:
            for frame in range(frames):
                t = frame/args.fps
                image = renderer.render(t, args.duration, frame)
                add_hud(image, model, t, args.duration, label, fonts)
                image = add_grade(image, model.seed, frame)
                process.stdin.write(np.asarray(image, dtype=np.uint8).tobytes())
                if frame % max(1, args.fps*2) == 0:
                    print(f"{args.variant}: {frame}/{frames}", flush=True)
        finally:
            if process.stdin:
                process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError("ffmpeg video encoder failed")
        make_audio(audio, args.duration)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                        "-i", str(silent), "-i", str(audio), "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
                        str(output)], check=True)
    manifest = {"source_log": str(Path(args.log).resolve()), "game_seed": model.seed,
                "variant": args.variant, "resolution": [width, height], "fps": args.fps,
                "duration": args.duration, "major_night": model.turn,
                "burned_cells": len(model.burned), "fire_waves": len(model.waves),
                "note": "Recorded game outcome; decorative rendering is deterministic."}
    output.with_suffix(".json").write_text(json.dumps(manifest, indent=2)+"\n")
    print(output)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--log", required=True)
    parser.add_argument("--variant", required=True,
                        choices=("point-cloud", "documentary", "hybrid"))
    parser.add_argument("--output", required=True)
    parser.add_argument("--base-plate")
    parser.add_argument("--fire-plate")
    parser.add_argument("--size", default="1280x720")
    parser.add_argument("--fps", type=int, default=24)
    parser.add_argument("--duration", type=float, default=22.0)
    parser.add_argument("--encoder", choices=("h264_nvenc", "libx264"), default="h264_nvenc")
    parser.add_argument("--overwrite", action="store_true")
    render(parser.parse_args())


if __name__ == "__main__":
    main()
