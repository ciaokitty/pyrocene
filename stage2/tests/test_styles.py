"""Every map style must render every scene without falling over.

A style is a file people will edit at speed. This catches a typo in one of them
before it reaches a projector in front of a room, and checks the few things that
have to be true of all of them.
"""
import re
import unittest

from ..maps import render as mapstyle
from ..maps.scenes import all_scenes
from ..maps.gallery import STYLES


class Styles(unittest.TestCase):
    def test_every_style_renders_every_scene(self):
        scenes = all_scenes()
        for name in STYLES:
            mod = mapstyle.style(name)
            for key, scene in scenes.items():
                with self.subTest(style=name, scene=key):
                    svg = mod.render(scene)
                    self.assertTrue(svg.startswith("<svg"), f"{name}/{key} is not SVG")
                    self.assertGreater(len(svg), 2000, f"{name}/{key} is suspiciously empty")
                    self.assertNotIn("None", svg, f"{name}/{key} leaked a None into the output")
                    # unbalanced tags would break the projector page silently
                    opens = len(re.findall(r"<(?!/)(?!\?)[a-zA-Z]", svg))
                    closes = len(re.findall(r"</[a-zA-Z]", svg)) + len(re.findall(r"/>", svg))
                    self.assertLessEqual(abs(opens - closes), 2,
                                         f"{name}/{key} looks like unbalanced SVG")

    def test_every_style_carries_a_name_and_a_blurb(self):
        for name in STYLES:
            mod = mapstyle.style(name)
            self.assertEqual(getattr(mod, "NAME", None), name)
            self.assertTrue(getattr(mod, "BLURB", ""), f"{name} has no one-line description")

    def test_cards_and_lobby_render_in_every_style(self):
        scene = all_scenes()["showcase"]
        view = {"cols": scene.cols, "rows": scene.rows, "round": 3, "max_rounds": 8,
                "health": 70, "cells": [{"index": i, "r": i // scene.cols,
                                         "c": i % scene.cols, "cover": "native",
                                         "stage": 0} for i in range(scene.cols * scene.rows)]}
        for name in STYLES:
            with self.subTest(style=name):
                card = mapstyle.card_svg("The night", "Lantana took ground in the north.",
                                         view, name)
                self.assertTrue(card.startswith("<svg"))
                self.assertIn("THE NIGHT", card)
                self.assertTrue(mapstyle.lobby_svg(4, name).startswith("<svg"))

    def test_a_style_never_names_a_square(self):
        """The map points at squares by holding on them. Grid references on the
        projector would send a room hunting for coordinates instead of looking."""
        scenes = all_scenes()
        for name in STYLES:
            mod = mapstyle.style(name)
            svg = mod.render(scenes["focus"])
            text = " ".join(re.findall(r"<text[^>]*>([^<]*)</text>", svg))
            self.assertNotRegex(text, r"\b[A-V]\d{1,2}\b",
                                f"{name} printed a grid reference: {text}")


if __name__ == "__main__":
    unittest.main()
