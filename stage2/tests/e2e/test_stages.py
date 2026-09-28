"""Stage 1, the replay, and the SVG projector, end to end in a browser.

    python3 -m unittest stage2.tests.e2e.test_stages

Stage 1 is plain Mafia: no fire, no choice, and the map kept back until the game
master replays it at the end. These run against a second server so the main
journey tests can stay on the terminal board.
"""
from __future__ import annotations
import json
import os
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
PORT = int(os.environ.get("STAGE1_TEST_PORT", "8033"))
BASE = f"http://localhost:{PORT}"

_server = _pw = _browser = None


def api(path, body=None):
    if body is None:
        return json.loads(urllib.request.urlopen(BASE + path, timeout=10).read())
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def setUpModule():
    global _server, _pw, _browser
    env = dict(os.environ, STAGE2_FAST="1")
    _server = subprocess.Popen(
        [sys.executable, "-m", "stage2.server", "--stage", "1",
         "--style", "drawn", "--port", str(PORT), "--fast"],
        cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            api("/api/state")
            break
        except (urllib.error.URLError, ConnectionError, OSError):
            time.sleep(0.25)
    else:
        raise RuntimeError("stage 1 server did not come up")
    _pw = sync_playwright().start()
    _browser = _pw.chromium.launch()


def tearDownModule():
    if _browser:
        _browser.close()
    if _pw:
        _pw.stop()
    if _server:
        _server.terminate()
        _server.wait(timeout=10)


def page(w=1280, h=820):
    return _browser.new_context(viewport={"width": w, "height": h}).new_page()


def settled(limit=200):
    """Wait for an animated replay step to finish."""
    for _ in range(limit):
        s = api("/api/state")
        if not s.get("replaying"):
            return s
        time.sleep(0.05)
    raise AssertionError("the replay never settled")


def drain(limit=40):
    for _ in range(limit):
        s = api("/api/state")
        if s["mode"] == "explain":
            api("/api/gm/advance", {})
        elif s["mode"] == "playing":
            time.sleep(0.05)
        else:
            return
    raise AssertionError("the projector never went idle")


def fresh(seed=5, players=12):
    api("/api/gm/reset", {"seed": seed})
    api("/api/gm/seed", {"n": players})
    api("/api/gm/start", {})
    return api("/api/state")


def play_round(kill_role=None):
    st = api("/api/state")
    if kill_role:
        who = next((p["id"] for p in st["players"]
                    if p["alive"] and p["role"] == kill_role), None)
        if who:
            api("/api/gm/eliminate", {"id": who})
    api("/api/gm/night", {})
    out = api("/api/steps")["steps"]
    drain()
    if api("/api/state")["phase"] != "playing":
        return out
    api("/api/gm/vote", {})
    out += api("/api/steps")["steps"]
    drain()
    return out


class StageOne(unittest.TestCase):
    def test_no_fire_and_no_choice(self):
        fresh()
        self.assertEqual(api("/api/state")["stage"], 1)
        for _ in range(3):
            if api("/api/state")["phase"] != "playing":
                break
            keys = [s["key"] for s in play_round("native")]
            self.assertNotIn("fire", keys, "stage 1 must not run a fire")
            self.assertNotIn("line", keys)
            self.assertNotIn("water", keys)
            self.assertNotIn("ews", keys)
        for rec in api("/api/state")["history"]:
            self.assertIsNone(rec.get("fire") or None,
                              "no fire should be recorded in stage 1")

    def test_the_vote_needs_no_choice(self):
        """In stage 1 there is nothing to shelter from, so Finish vote must work
        without the game master picking anything."""
        fresh(seed=9)
        api("/api/gm/night", {})
        drain()
        api("/api/gm/vote", {})      # deliberately no /api/gm/choice first
        drain()
        self.assertEqual(api("/api/state")["round"], 2)

    def test_the_console_hides_the_choice(self):
        fresh(seed=11)
        gm = page(1100, 950)
        errors = []
        gm.on("pageerror", lambda e: errors.append(str(e)))
        gm.goto(BASE + "/gm")
        gm.wait_for_selector("#night:not([hidden])", timeout=8000)
        gm.click("#finishnight")
        # Two cards now: what the night took, then where lantana went.
        for _ in range(4):
            if gm.locator("#day").is_visible():
                break
            gm.wait_for_selector("#advance:not([hidden])", timeout=15000)
            gm.click("#advance")
            gm.wait_for_timeout(600)
        gm.wait_for_selector("#day:not([hidden])", timeout=15000)
        self.assertTrue(gm.locator("#choicebox").is_hidden(),
                        "stage 1 has no hunt-or-shelter choice")
        self.assertFalse(gm.locator("#finishvote").is_disabled(),
                         "Finish vote must be live without a choice")
        self.assertEqual(errors, [])


class StageOneEndsEarly(unittest.TestCase):
    def test_both_specialists_out_ends_it(self):
        """With no fire there is no way back, so stage 1 stops rather than play
        out a foregone conclusion. Stage 2 deliberately keeps going."""
        fresh(seed=17)
        for role in ("ecologist", "ranger"):
            st = api("/api/state")
            if st["phase"] != "playing":
                break
            who = next(p["id"] for p in st["players"]
                       if p["alive"] and p["role"] == role)
            api("/api/gm/eliminate", {"id": who})
            api("/api/gm/night", {})
            drain()
            st = api("/api/state")
            if st["phase"] != "playing":
                break
            api("/api/gm/vote", {})
            drain()
        st = api("/api/state")
        self.assertEqual(st["phase"], "ended")
        self.assertEqual(st["ending"]["reason"], "team")


class StageOneContinue(unittest.TestCase):
    def test_continue_applies_the_round_without_showing_it(self):
        """The game master keeps a room moving with one press. The state must
        advance exactly as it would have, with nothing put on the projector."""
        fresh(seed=23)
        before = api("/api/state")["health"]
        who = next(p["id"] for p in api("/api/state")["players"]
                   if p["alive"] and p["role"] == "native")
        api("/api/gm/eliminate", {"id": who})
        api("/api/gm/night", {})
        self.assertGreater(api("/api/state")["steps_left"], 0)
        st = api("/api/gm/skip", {})
        self.assertEqual(st["mode"], "idle")
        self.assertEqual(st["steps_left"], 0)
        self.assertEqual(st["step"], "day", "the round still moved on")
        self.assertLessEqual(st["health"], before)

    def test_the_projector_stays_on_the_map(self):
        """Continue skips the cards, not the map. The board stays up through the
        whole evening so the room can look at it whenever they want."""
        fresh(seed=29)
        self.assertIn("forest", api("/api/frame")["frame"], "the map is up from the start")
        who = next(p["id"] for p in api("/api/state")["players"] if p["alive"])
        api("/api/gm/eliminate", {"id": who})
        api("/api/gm/night", {})
        api("/api/gm/skip", {})
        after = api("/api/frame")["frame"]
        self.assertIn("forest", after, "and still up after a round is applied")
        self.assertIn("one player's ground", after)

    def test_the_console_offers_it_and_drops_the_animation(self):
        fresh(seed=31)
        gm = page(1100, 950)
        errors = []
        gm.on("pageerror", lambda e: errors.append(str(e)))
        gm.goto(BASE + "/gm")
        gm.wait_for_selector("#night:not([hidden])", timeout=8000)
        gm.click("#finishnight")
        gm.wait_for_selector("#skip:not([hidden])", timeout=8000)
        self.assertEqual(gm.locator("#animbox").count(), 0,
                         "the show-animation panel is gone")
        gm.click("#skip")
        gm.wait_for_selector("#day:not([hidden])", timeout=8000)
        self.assertEqual(errors, [])


class StageOneMap(unittest.TestCase):
    def test_the_replay_outlines_the_ground_each_player_started_with(self):
        fresh(seed=37)
        for _ in range(2):
            if api("/api/state")["phase"] != "playing":
                break
            play_round("native")
        api("/api/gm/replay", {})
        api("/api/gm/replay", {})
        frame = api("/api/frame")["frame"]
        self.assertIn("one player's ground", frame)
        self.assertNotIn(">fire<", frame, "stage 1 cannot burn, so the legend must not say so")


class StartPage(unittest.TestCase):
    """The jump off page for the whole evening. One person opens this and works
    down it, so every link on it has to go somewhere."""

    def test_it_serves_and_names_every_piece(self):
        pg = page(1280, 900)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE + "/start")
        pg.wait_for_selector(".tile", timeout=8000)
        self.assertEqual(pg.locator(".tile").count(), 6)
        text = pg.inner_text("main")
        for name in ("Stage 1", "Stage 2", "Fire lab",
                     "Forest structure studies", "Stage 3", "Stage 4"):
            self.assertIn(name, text)
        self.assertEqual(errors, [])

    def test_the_room_links_point_at_the_three_screens(self):
        pg = page(1280, 900)
        pg.goto(BASE + "/start")
        pg.wait_for_selector(".tile", timeout=8000)
        hrefs = [pg.locator(".ways a").nth(i).get_attribute("href")
                 for i in range(pg.locator(".ways a").count())]
        self.assertEqual(hrefs, ["/?stage=1", "/gm?stage=1", "/projector",
                                 "/?stage=2", "/gm?stage=2", "/projector"],
                         "each stage hands out its own player and console link")

    def test_every_link_on_it_resolves(self):
        """A dead link on this page is a dead end in front of a room."""
        pg = page(1280, 900)
        pg.goto(BASE + "/start")
        pg.wait_for_selector(".tile", timeout=8000)
        n = pg.locator("a").count()
        local = []
        for i in range(n):
            href = pg.locator("a").nth(i).get_attribute("href")
            if href and href.startswith("/"):
                local.append(href)
        self.assertGreaterEqual(len(local), 7)
        for href in sorted(set(local)):
            with urllib.request.urlopen(BASE + href, timeout=10) as r:
                self.assertEqual(r.status, 200, href)

    def test_the_film_link_follows_the_host_you_came_in_on(self):
        """Built from location.hostname so the same page works over wifi, over
        tailscale and on the laptop itself."""
        pg = page(1280, 900)
        pg.goto(BASE + "/start")
        pg.wait_for_selector("#films", timeout=8000)
        href = pg.get_attribute("#films", "href")
        self.assertIn(":8022/", href)
        self.assertIn(urllib.parse.urlparse(BASE).hostname, href)

    def test_the_stage_four_link_follows_the_host_you_came_in_on(self):
        pg = page(1280, 900)
        pg.goto(BASE + "/start")
        pg.wait_for_selector("#stage4", timeout=8000)
        href = pg.get_attribute("#stage4", "href")
        self.assertIn(":8024/", href)
        self.assertIn(urllib.parse.urlparse(BASE).hostname, href)

    def test_it_says_almost_nothing(self):
        """The whole point is that it is a board, not a page to read."""
        pg = page(1280, 900)
        pg.goto(BASE + "/start")
        pg.wait_for_selector(".tile", timeout=8000)
        words = pg.inner_text("main").split()
        self.assertLess(len(words), 40, f"too much text: {len(words)} words")


class Handover(unittest.TestCase):
    """Stage 1 ends and the room walks into stage 2 without a restart. This used
    to need stopping the server, which meant everyone rejoining and retyping
    their name while the room waited."""

    def tearDown(self):
        api("/api/gm/reset", {"stage": 1, "seed": 5})

    def _finish_stage_one(self, seed=41):
        fresh(seed=seed)
        guard = 0
        while api("/api/state")["phase"] == "playing" and guard < 12:
            guard += 1
            play_round()
        return api("/api/state")

    def test_it_keeps_the_people_and_deals_again(self):
        st = self._finish_stage_one()
        self.assertEqual(st["phase"], "ended")
        before = {p["name"]: p["role"] for p in st["players"]}
        tokens = [p["id"] for p in st["players"]]
        st = api("/api/gm/next_stage", {})
        self.assertEqual(st["stage"], 2)
        self.assertEqual(st["phase"], "playing")
        self.assertEqual(st["round"], 1)
        after = {p["name"]: p["role"] for p in st["players"]}
        self.assertEqual(sorted(before), sorted(after), "the same people carry over")
        self.assertEqual(tokens, [p["id"] for p in st["players"]])
        self.assertNotEqual(before, after,
                            "a fresh deal, or stage 1 tells you who lantana is")
        self.assertTrue(all(p["alive"] for p in st["players"]))

    def test_a_phone_stays_joined(self):
        api("/api/gm/reset", {"stage": 1, "seed": 43})
        tok = api("/api/join", {"name": "Meera"})["token"]
        api("/api/gm/seed", {"n": 11})
        api("/api/gm/start", {})
        guard = 0
        while api("/api/state")["phase"] == "playing" and guard < 12:
            guard += 1
            play_round()
        api("/api/gm/next_stage", {})
        me = api("/api/me?token=" + tok)
        self.assertEqual(me["name"], "Meera")
        self.assertTrue(me["alive"])
        self.assertIn(me["role"], ("lantana", "native", "ecologist", "ranger"))

    def test_it_refuses_before_stage_one_is_over(self):
        fresh(seed=45)
        with self.assertRaises(urllib.error.HTTPError):
            api("/api/gm/next_stage", {})

    def test_the_console_offers_it_only_at_the_end(self):
        fresh(seed=47)
        gm = page(1100, 1000)
        errors = []
        gm.on("pageerror", lambda e: errors.append(str(e)))
        gm.goto(BASE + "/gm")
        gm.wait_for_selector("#night:not([hidden])", timeout=8000)
        self.assertTrue(gm.locator("#nextstage").is_hidden(),
                        "not while the game is still on")
        guard = 0
        while api("/api/state")["phase"] == "playing" and guard < 12:
            guard += 1
            play_round()
        gm.wait_for_selector("#nextstage:not([hidden])", timeout=8000)
        gm.click("#tostage2")
        # Stage 2 opens on night 1, so the day panel that holds the choice is
        # not up yet. The header is what tells the game master where they are.
        gm.wait_for_function("document.querySelector('#phase').textContent.includes('stage 2')",
                             timeout=8000)
        # Stage 2 opens on a card saying how a night goes.
        gm.wait_for_selector("#onscreen:not([hidden])", timeout=8000)
        self.assertIn("night", gm.locator("#cardtitle").inner_text().lower())
        gm.click("#advance")
        gm.wait_for_selector("#night:not([hidden])", timeout=8000)
        gm.wait_for_selector("#seasonbox:not([hidden])", timeout=8000)
        self.assertEqual(api("/api/state")["stage"], 2)
        self.assertEqual(errors, [])


class Replay(unittest.TestCase):
    def test_it_walks_the_map_one_night_at_a_time(self):
        fresh(seed=5)
        for _ in range(3):
            if api("/api/state")["phase"] != "playing":
                break
            play_round("native")
        st = api("/api/state")
        self.assertTrue(st["can_replay"])

        api("/api/gm/replay", {})
        s = api("/api/state")
        self.assertEqual(s["mode"], "replay")
        self.assertEqual(s["replay_at"], 0, "it opens on the board as it started")
        total = s["replay_total"]
        self.assertGreaterEqual(total, 1)
        self.assertEqual(total, len(st["history"]), "one step per night played")

        seen = []
        for _ in range(total + 2):
            if api("/api/state")["mode"] != "replay":
                break
            api("/api/gm/replay", {})
            s = settled()
            if s["mode"] == "replay":
                seen.append(s["replay_at"])
        self.assertEqual(seen, list(range(1, total + 1)), "every night, in order, once")
        self.assertEqual(api("/api/state")["mode"], "idle", "it hands the game back")

    def test_each_night_of_the_replay_is_animated(self):
        """A still frame per night made the room hunt for the difference. Each
        press now runs the same hold-then-turn transition as live play."""
        fresh(seed=5)
        for _ in range(3):
            if api("/api/state")["phase"] != "playing":
                break
            play_round("native")
        api("/api/gm/replay", {})
        opening = api("/api/frame")["frame"]
        api("/api/gm/replay", {})
        s = settled()
        self.assertEqual(s["replay_at"], 1)
        self.assertNotEqual(api("/api/frame")["frame"], opening,
                            "the board has to move when a night is played")

    def test_the_forest_visibly_declines_across_the_replay(self):
        """The whole point of the replay is the room seeing what their voting
        cost. If the health never moves there is nothing to show them."""
        fresh(seed=5)
        for _ in range(4):
            if api("/api/state")["phase"] != "playing":
                break
            play_round("native")
        api("/api/gm/replay", {})
        healths = []
        while api("/api/state")["mode"] == "replay":
            frame = api("/api/frame")["frame"]
            healths.append(frame)
            api("/api/gm/replay", {})
        self.assertGreater(len(healths), 2)
        self.assertNotEqual(healths[0], healths[-1], "the map never changed")

    def test_stop_hands_the_game_back(self):
        fresh(seed=7)
        play_round("native")
        api("/api/gm/replay", {})
        self.assertEqual(api("/api/state")["mode"], "replay")
        api("/api/gm/replay_stop", {})
        self.assertEqual(api("/api/state")["mode"], "idle")


class SvgProjector(unittest.TestCase):
    def test_the_projector_draws_the_map_style(self):
        fresh(seed=5)
        self.assertEqual(api("/api/state")["style"], "drawn")
        self.assertTrue(api("/api/frame")["frame"].startswith("<svg"))

        pg = page()
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE + "/projector")
        pg.wait_for_function("window.__beat !== null", timeout=10000)
        pg.wait_for_selector("#svg svg", timeout=8000)
        self.assertTrue(pg.locator("#svg").is_visible(), "the SVG map should be showing")
        self.assertTrue(pg.locator(".screen").is_hidden(), "the terminal should be put away")
        self.assertEqual(errors, [])

    def test_cards_draw_in_the_same_hand(self):
        fresh(seed=5)
        api("/api/gm/night", {})
        card = api("/api/frame")["frame"]
        self.assertTrue(card.startswith("<svg"))
        self.assertIn("NIGHT 1", card, "the eyebrow says which night")
        drain()


if __name__ == "__main__":
    unittest.main(verbosity=2)
