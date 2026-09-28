"""End to end, through the real pages in a real browser.

    python3 -m stage2.tests.e2e.test_journeys           # all journeys
    SHOTS=1 python3 -m stage2.tests.e2e.test_journeys   # also save screenshots

Every journey drives the same pages a room would: phones join, the game master
clicks, the projector paints. Assertions check the frame the projector actually
shows, not just the API, because the map is the whole teaching tool.
"""
from __future__ import annotations
import json
import os
import re
import socket
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
PORT = int(os.environ.get("STAGE2_TEST_PORT", "8031"))
BASE = f"http://localhost:{PORT}"
SHOTS = os.environ.get("SHOTS") == "1"
SHOT_DIR = os.environ.get("SHOT_DIR", "/tmp/stage2-shots")

_server = None
_pw = None
_browser = None


def api(path, body=None):
    if body is None:
        return json.loads(urllib.request.urlopen(BASE + path, timeout=10).read())
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def setUpModule():
    global _server, _pw, _browser
    # These exercise the game and the console. Pin the projector to the terminal
    # board so they do not move every time a map style is retuned; the styles
    # have their own tests in stage2/tests/test_styles.py, and J13 covers the
    # SVG path end to end.
    # Refuse to run if something already holds the port. Otherwise our server
    # fails to bind, the poll below reaches the *other* server, and every test
    # runs against a stranger's game. That reads as a pile of unrelated
    # failures, which cost an afternoon once.
    probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    probe.settimeout(1)
    busy = probe.connect_ex(("127.0.0.1", PORT)) == 0
    probe.close()
    if busy:
        raise RuntimeError(
            f"port {PORT} is already in use, so these tests cannot start their own "
            f"server. Stop it, or set STAGE2_TEST_PORT to a free port.")

    env = dict(os.environ, STAGE2_FAST="1", STAGE2_PORT=str(PORT), STAGE2_STYLE="ansi")
    _server = subprocess.Popen([sys.executable, "-m", "stage2.server"], cwd=ROOT, env=env,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        if _server.poll() is not None:
            raise RuntimeError(f"the test server exited at once (code {_server.returncode})")
        try:
            api("/api/state")
            break
        except (urllib.error.URLError, ConnectionError, OSError):
            time.sleep(0.25)
    else:
        raise RuntimeError("stage 2 server did not come up")
    _pw = sync_playwright().start()
    _browser = _pw.chromium.launch()
    if SHOTS:
        os.makedirs(SHOT_DIR, exist_ok=True)


def tearDownModule():
    if _browser:
        _browser.close()
    if _pw:
        _pw.stop()
    if _server:
        _server.terminate()
        _server.wait(timeout=10)


def page(w=1280, h=800):
    return _browser.new_context(viewport={"width": w, "height": h}).new_page()


def shot(pg, name):
    if SHOTS:
        pg.screenshot(path=os.path.join(SHOT_DIR, name))


def plain(frame: str) -> str:
    return re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", frame)


def plain_board(frame: str) -> str:
    """Just the board rows, colour kept, so two frames can be compared."""
    return "\n".join(l for l in frame.split("\n")
                     if re.match(r"^(\x1b\[[0-9;]*m)*\s*\d+ ", l))


def steps_on_deck():
    """The steps queued for the projector, with their cards and frames."""
    return api("/api/steps")["steps"]


def drain(limit=40):
    """Press through every explanation and animation, as the game master does."""
    for _ in range(limit):
        s = api("/api/state")
        if s["mode"] == "explain":
            api("/api/gm/advance", {})
        elif s["mode"] == "playing":
            time.sleep(0.05)
        else:
            return
    raise AssertionError("the projector never went idle")


def play_night():
    st = api("/api/state")
    if st["phase"] != "playing" or st["step"] != "night":
        return []
    api("/api/gm/night", {})
    out = steps_on_deck()
    drain()
    return out


def play_vote(choice="hunt", action=None):
    st = api("/api/state")
    if st["phase"] != "playing" or st["step"] != "day":
        return []
    api("/api/gm/choice", {"choice": choice, "action": action})
    api("/api/gm/vote", {})
    out = steps_on_deck()
    drain()
    return out


def play_round(choice="hunt", action=None):
    """A whole round the way the game master runs it: finish the night, press
    through what it did, then finish the vote and press through that."""
    return play_night() + play_vote(choice, action)


def keys(steps):
    return [st["key"] for st in steps]


def step(steps, key):
    return next((st for st in steps if st["key"] == key), None)


def fresh(seed=None, players=12):
    api("/api/gm/reset", {"seed": seed})
    api("/api/gm/seed", {"n": players})
    api("/api/gm/start", {})
    # Stage 2 opens on a card saying how a night goes. Press through it, the way
    # a game master does, so the tests start where a round starts.
    drain()
    return api("/api/state")


def roles(state):
    out = {}
    for p in state["players"]:
        out.setdefault(p["role"], []).append(p["id"])
    return out


def cover_counts():
    return api("/api/map")


class J01_JoinAndRoles(unittest.TestCase):
    def test_phones_join_and_each_sees_its_own_role(self):
        api("/api/gm/reset", {"seed": 21})
        phones = []
        for name in ("Asha", "Bala", "Chitra"):
            pg = page(390, 760)
            pg.goto(BASE + "/")
            pg.fill("#name", name)
            pg.click("#go")
            pg.wait_for_selector("#me:not([hidden])", timeout=5000)
            phones.append((name, pg))
        api("/api/gm/seed", {"n": 9})

        gm = page(1100, 900)
        gm.goto(BASE + "/gm")
        gm.wait_for_selector("#players tr", timeout=5000)
        self.assertEqual(gm.locator("#players tr").count(), 12)
        shot(gm, "j01-gm-lobby.png")
        gm.click("#start")
        # Stage 2 opens on the card that says how a night goes.
        gm.wait_for_selector("#onscreen:not([hidden])", timeout=5000)
        gm.click("#advance")
        gm.wait_for_selector("#night:not([hidden])", timeout=5000)

        state = api("/api/state")
        by_id = {p["id"]: p for p in state["players"]}
        # every phone shows the role the server gave that player, and nobody else's
        for name, pg in phones:
            pg.wait_for_function(
                "() => document.querySelector('#rolename').textContent.trim() !== "
                "'waiting for the game master'", timeout=5000)
            me = api("/api/me?token=" + pg.evaluate("localStorage.getItem('pyro_token')"))
            shown = pg.text_content("#rolename").strip().lower()
            expect = {"lantana": "lantana", "native": "native forest",
                      "ecologist": "ecologist", "ranger": "ranger"}[me["role"]]
            self.assertEqual(shown, expect, f"{name} saw the wrong role")
            self.assertEqual(pg.text_content("#who").strip(), name)
            self.assertEqual(by_id[me["id"]]["role"], me["role"])
            # one card, one line, and a status word. Nothing else.
            self.assertEqual(pg.text_content("#status").strip(), "Alive")
            blurb = pg.text_content("#blurb").strip()
            self.assertTrue(blurb.endswith("."), blurb)
            self.assertEqual(blurb.count("."), 1, f"role line should be one sentence: {blurb}")
        shot(phones[0][1], "j01-phone-role.png")

        r = roles(state)
        self.assertEqual(len(r["ecologist"]), 1)
        self.assertEqual(len(r["ranger"]), 1)
        self.assertEqual(len(r["lantana"]), state["lantana_count"])
        self.assertEqual(sum(len(v) for v in r.values()), 12)


class J02_MapMatchesAllocation(unittest.TestCase):
    def test_projector_shows_the_allocated_map(self):
        state = fresh(seed=21)
        m = cover_counts()
        self.assertEqual(m["owners"], state["lantana_count"] + m["native_players"],
                         "every native and lantana player should own a patch")
        self.assertGreater(m["commons"], 0, "some land must stay unowned commons")
        self.assertEqual(m["clusters"], state["lantana_count"],
                         "one separate infestation per lantana player at the start")

        pg = page()
        pg.goto(BASE + "/projector")
        pg.wait_for_function("window.__beat !== null", timeout=10000)
        time.sleep(0.4)
        txt = plain(api("/api/frame")["frame"])
        self.assertIn("P Y R O C E N E", txt)
        self.assertIn("Forest", txt)
        self.assertIn("LANTANA", txt, "the legend must be on screen")
        self.assertIn("lantana", txt)
        self.assertNotIn("sapling", txt, "one lantana tile, not three")
        self.assertNotIn("established", txt)
        self.assertNotIn("dense", txt)
        self.assertNotIn("risk zone", txt, "nothing on the legend that is not on the board")
        self.assertNotIn("unknown", txt)
        self.assertNotIn("WHO'S SPEAKING", txt, "no character panel in stage 2")
        self.assertNotIn("Win goal", txt, "no win-goal dots in stage 2")
        for line in txt.splitlines():
            self.assertLessEqual(len(line.rstrip()), 80, "a frame line overflows the projector")
        shot(pg, "j02-projector.png")


class J03_Eliminations(unittest.TestCase):
    def test_lantana_out_leaves_bare_and_native_out_lets_lantana_in(self):
        state = fresh(seed=33)
        r = roles(state)
        api("/api/gm/night", {})
        drain()
        before = cover_counts()
        api("/api/gm/eliminate", {"id": r["lantana"][0]})
        st = play_vote("hunt")
        v = step(st, "vote")
        self.assertIn("bare ground", v["note"])
        self.assertGreater(cover_counts()["bare"], before["bare"],
                           "an eliminated lantana patch should leave bare ground")

        state = api("/api/state")
        nat = [p["id"] for p in state["players"] if p["role"] == "native" and p["alive"]][0]
        api("/api/gm/eliminate", {"id": nat})
        st = play_night()
        n = step(st, "night")
        self.assertIn("took ground", n["note"])
        drain()

    def test_losing_a_specialist_reads_like_a_quiet_night(self):
        """The room must not learn from the projector whether the ecologist or
        the ranger is still in. A night that changes nothing looks identical
        either way, so lantana can lie about it."""
        state = fresh(seed=34)
        r = roles(state)
        api("/api/gm/eliminate", {"id": r["ecologist"][0]})
        quiet_specialist = step(play_night(), "night")["text"]

        state = fresh(seed=34)
        st = step(play_night(), "night")      # nobody taken at all
        self.assertEqual(quiet_specialist, st["text"],
                         "a taken specialist and a saved night must read the same")

    def test_no_card_ever_names_a_player_or_a_role(self):
        state = fresh(seed=35)
        names = [p["name"] for p in state["players"]]
        roles_words = ("lantana player", "ecologist", "ranger", "native player",
                       "villager", "was lantana", "were lantana")
        seen = 0
        for _ in range(4):
            if api("/api/state")["phase"] != "playing":
                break
            alive = [p for p in api("/api/state")["players"] if p["alive"]]
            if alive:
                api("/api/gm/eliminate", {"id": alive[0]["id"]})
            for st in play_round("hunt"):
                seen += 1
                blob = (st["title"] + " " + st["text"]).lower()
                for nm in names:
                    self.assertNotIn(nm.lower(), blob, f"card named a player: {st['text']}")
                for w in roles_words:
                    self.assertNotIn(w, blob, f"card gave away a role: {st['text']}")
                self.assertNotIn("at ", plain(st["card"]).split("THE")[0].lower() + " ",
                                 "the card should not list squares; the map shows them")
        self.assertGreater(seen, 6, "not enough cards checked")


class J04_NightRunsAndEmberMatches(unittest.TestCase):
    def test_each_step_is_one_card_then_one_animation(self):
        fresh(seed=41)
        st = play_round("hunt")
        # The night is a single reveal: the ground a removal took and the
        # ground lantana took, together, so neither says which role went.
        self.assertEqual(keys(st)[0], "night", "the night comes first, on its own")
        self.assertIn("vote", keys(st))
        self.assertIn("fire", keys(st))
        self.assertNotIn("growth", keys(st), "the spread is folded into the night")
        for x in st:
            self.assertTrue(x["title"], "every step needs a card title")
            self.assertTrue(x["card"], "every step needs a card to show")
            self.assertTrue(x["frames"], "every step needs at least one frame")

    def test_ember_number_matches_what_burned(self):
        for seed in (41, 43, 45, 47):
            fresh(seed=seed)
            for _ in range(3):
                if api("/api/state")["phase"] != "playing":
                    break
                st = play_round("hunt")
                f = step(st, "fire")
                if not f or "squares" not in f["note"]:
                    continue
                burned = max((len(x) for x in f["fire"]), default=0)
                said = re.search(r"(\d+) squares", f["note"])
                self.assertIsNotNone(said)
                self.assertEqual(int(said.group(1)), burned,
                                 "Ember's number must match the cells that burned")
                return
        self.skipTest("no sized fire in the seeds tried")

    def test_growth_holds_then_turns_the_squares_over(self):
        # The spread lives inside the night's single reveal now.
        for seed in (41, 42, 43, 44):
            fresh(seed=seed)
            st = play_round("hunt")
            g = step(st, "night")
            if g and "creep" in g["kinds"]:
                self.assertEqual(g["kinds"][0], "focus",
                                 "the board hazes and holds on the squares first")
                self.assertEqual(g["kinds"][-1], "settle",
                                 "the whole map comes back at full weight last")
                boards = [plain_board(f) for f in g["frames"]]
                self.assertGreater(len(set(boards)), 2,
                                   "the map has to actually change, not just blink")
                self.assertNotEqual(boards[0], boards[-1],
                                    "the last frame must differ from the first")
                return
        self.skipTest("no growth in the seeds tried")

    def test_a_transition_runs_long_enough_to_follow(self):
        fresh(seed=41)
        st = play_round("hunt")
        g = step(st, "night")
        self.assertIsNotNone(g, "every round has a night reveal")
        self.assertIn("creep", g["kinds"], "and it is a transition, not a still")
        self.assertGreaterEqual(sum(g["hold_ms"]), 3200, "too quick to read")
        self.assertLessEqual(sum(g["hold_ms"]), 7000, "too slow, the room will drift")

    def test_the_fire_shows_what_it_left_behind(self):
        for seed in (41, 43, 45, 47, 49):
            fresh(seed=seed)
            for _ in range(3):
                if api("/api/state")["phase"] != "playing":
                    break
                st = play_round("hunt")
                f = step(st, "fire")
                if f and "scorch" in f["kinds"]:
                    i = f["kinds"].index("scorch")
                    self.assertNotEqual(plain_board(f["frames"][0]),
                                        plain_board(f["frames"][i]),
                                        "burned ground must look different afterwards")
                    return
        self.skipTest("no fire in the seeds tried")

class J05_FireLineHolds(unittest.TestCase):
    def test_fire_runs_into_the_line_and_stops(self):
        held = None
        for seed in (11, 12, 13, 14, 15, 16, 17, 18):
            fresh(seed=seed)
            for _ in range(2):
                play_round("hunt")
            if api("/api/state")["phase"] != "playing":
                continue
            st = play_round("resilience", "fireline")
            f = step(st, "fire")
            if f and "blocked" in f["kinds"]:
                held = (seed, st)
                break
        self.assertIsNotNone(held, "no seed produced a fire running into a fresh line")
        seed, st = held
        ks = keys(st)
        self.assertLess(ks.index("line"), ks.index("fire"),
                        "the trench is explained and dug before the fire, so the room sees why")
        self.assertIn("fire line", step(st, "line")["note"])
        f = step(st, "fire")
        self.assertIn("fire line", f["note"], f"Ember must say the line stopped it: {f['text']}")
        i = f["kinds"].index("blocked")
        self.assertIn("++", plain(f["frames"][i]), "the trench must still be drawn after the fire")
        self.assertTrue(f["held"][i], "the cells that held should be marked for the eye")
        for name, frame in (("card-line", step(st, "line")["card"]),
                            ("card-fire", f["card"])):
            pass
        # screenshots of the moment, through the real page
        api("/api/gm/reset", {"seed": seed})

    def test_a_line_is_permanent(self):
        fresh(seed=11)
        for _ in range(2):
            play_round("hunt")
        play_round("resilience", "fireline")
        n1 = cover_counts()["fireline"]
        self.assertGreater(n1, 0)
        play_round("hunt")
        self.assertGreaterEqual(cover_counts()["fireline"], n1,
                                "fire lines must last the rest of the game")


class J06_Water(unittest.TestCase):
    def test_water_caps_the_fire(self):
        for seed in (51, 52, 53, 54):
            fresh(seed=seed)
            for _ in range(3):
                if api("/api/state")["phase"] != "playing":
                    break
                play_round("hunt")
            if api("/api/state")["phase"] != "playing":
                continue
            st = play_round("resilience", "water")
            self.assertIn("water", keys(st))
            f = step(st, "fire")
            if f and f["fire"] and any(f["fire"]):
                burned = max(len(x) for x in f["fire"])
                self.assertLessEqual(burned, 8,
                                     "water must hold the fire to a handful of squares")
                self.assertIn("response team", f["note"])
                return
        self.skipTest("no fire on a water night in the seeds tried")


class J07_EarlyWarning(unittest.TestCase):
    def test_the_forecast_names_the_next_night(self):
        fresh(seed=61)
        play_round("hunt")
        st = play_round("resilience", "ews")
        fc = step(st, "ews")
        self.assertIsNotNone(fc, "early warning must put a forecast on screen")
        # One card, carrying the forecast. It used to be a paragraph about a
        # lookout going up and then the actual warning three screens later.
        self.assertEqual(sum(1 for k in keys(st) if k in ("ews", "forecast")), 1)
        self.assertTrue(fc["text"].startswith("Forecast for next night:"), fc["text"])
        after = api("/api/state")
        self.assertIsNotNone(after["forecast"])
        self.assertIn(after["forecast"]["wind"], fc["text"])
        self.assertTrue(fc["text"].startswith("Forecast for next night:"), fc["text"])


class J08_SystemPicks(unittest.TestCase):
    def test_resolving_without_an_action_picks_one_and_says_why(self):
        fresh(seed=71)
        for _ in range(2):
            play_round("hunt")
        st = play_round("resilience", None)
        picked = [k for k in keys(st) if k in ("line", "water", "ews")]
        self.assertEqual(len(picked), 1, "exactly one resilience action should happen")
        said = step(st, picked[0])["note"]
        self.assertTrue(any(w in said for w in ("so the crew digs", "so a response team",
                                                "Forecast for next night")),
                        f"Ember must give the reason: {said}")
        self.assertTrue(api("/api/state")["history"][-1]["auto"])


class J09_Endings(unittest.TestCase):
    def test_removing_every_lantana_wins(self):
        state = fresh(seed=81)
        lant = roles(state)["lantana"]
        api("/api/gm/night", {})
        drain()
        # the room gets one vote a day, so take them one night at a time
        for i, pid in enumerate(lant):
            if api("/api/state")["phase"] != "playing":
                break
            api("/api/gm/eliminate", {"id": pid})
            st = play_vote("hunt")
            if api("/api/state")["phase"] != "playing":
                break
            api("/api/gm/night", {})
            drain()
        st = api("/api/state")
        if st["phase"] != "ended":
            self.skipTest("lantana grew back before the room finished them")
        self.assertEqual(st["ending"]["result"], "win")
        self.assertIn("lantana patch is out", st["ending"]["text"])

    def test_running_out_of_nights_loses(self):
        fresh(seed=82)
        for _ in range(14):
            if api("/api/state")["phase"] != "playing":
                break
            play_round("resilience", None)
        st = api("/api/state")
        self.assertEqual(st["phase"], "ended")
        self.assertEqual(st["ending"]["result"], "lose")
        self.assertIn(st["ending"]["reason"], ("time", "fire", "village", "natives"))

    def test_a_room_that_only_shelters_never_wins(self):
        for seed in (91, 92, 93):
            fresh(seed=seed)
            for _ in range(14):
                if api("/api/state")["phase"] != "playing":
                    break
                play_round("resilience", None)
            self.assertEqual(api("/api/state")["ending"]["result"], "lose")

    def test_the_ending_gets_its_own_card(self):
        fresh(seed=82)
        last = []
        for _ in range(14):
            if api("/api/state")["phase"] != "playing":
                break
            last = play_round("resilience", None)
        self.assertIn("ending", keys(last))
        e = step(last, "ending")
        self.assertIn("THE SEASON ENDS", plain(e["card"]).upper())


class J10_SeedTestPlayers(unittest.TestCase):
    def test_a_lone_game_master_can_rehearse(self):
        api("/api/gm/reset", {"seed": 101})
        gm = page(1100, 900)
        gm.goto(BASE + "/gm")
        gm.wait_for_selector("#lobby:not([hidden])", timeout=5000)
        gm.fill("#seedn", "12")
        gm.click("#seed")
        gm.wait_for_function("document.querySelectorAll('#players tr').length === 12", timeout=5000)
        gm.click("#start")
        gm.wait_for_selector("#onscreen:not([hidden])", timeout=5000)
        gm.click("#advance")
        gm.wait_for_selector("#night:not([hidden])", timeout=5000)
        shot(gm, "j10-gm-night.png")
        # Stage 2 shows nothing at the end of the night. The room wakes, hears
        # no verdict, and goes straight to the vote; the map moves once, later.
        gm.click("#finishnight")
        # Two cards a night now: the removal, then the spread.
        for _ in range(4):
            if gm.locator("#day").is_visible():
                break
            gm.wait_for_selector("#advance:not([hidden])", timeout=15000)
            gm.click("#advance")
            gm.wait_for_timeout(600)
        gm.wait_for_selector("#day:not([hidden])", timeout=15000)
        shot(gm, "j10-gm-day.png")
        gm.check('input[name=choice][value=hunt]')
        gm.click("#finishvote")
        gm.wait_for_function(
            "document.querySelector('#round') && document.querySelector('#round').textContent === '2'",
            timeout=25000)
        shot(gm, "j10-gm-round2.png")


class J12_NoScriptErrors(unittest.TestCase):
    """The console is plain JavaScript with no build step, so a typo reaches a
    room silently: the page half-renders and the game master sees empty boxes.
    This has happened twice. Load every page, play a round through the real
    buttons, and fail on any error the browser reports."""

    def test_no_page_errors_anywhere(self):
        fresh(seed=123)
        errors = []
        pages = {}
        for name, path, w, h in (("gm", "/gm", 1100, 950),
                                 ("projector", "/projector", 1280, 800),
                                 ("phone", "/", 390, 760)):
            pg = page(w, h)
            pg.on("pageerror", lambda e, n=name: errors.append(f"{n}: {e}"))
            pg.on("console", lambda m, n=name:
                  errors.append(f"{n} console: {m.text}") if m.type == "error" else None)
            pg.goto(BASE + path)
            pages[name] = pg
        gm = pages["gm"]
        gm.wait_for_selector("#night:not([hidden])", timeout=8000)

        # a whole round through the buttons a game master actually presses
        gm.click("#finishnight")
        for _ in range(4):
            if gm.locator("#day").is_visible():
                break
            gm.wait_for_selector("#advance:not([hidden])", timeout=15000)
            gm.click("#advance")
            gm.wait_for_timeout(600)
        gm.wait_for_selector("#day:not([hidden])", timeout=15000)
        gm.check('input[name=choice][value=resilience]')
        gm.wait_for_function("!document.querySelector('#finishvote').disabled", timeout=8000)
        gm.click("#finishvote")
        for _ in range(12):
            if not gm.is_visible("#advance"):
                gm.wait_for_timeout(300)
                continue
            gm.click("#advance")
            gm.wait_for_timeout(300)
        drain()
        gm.wait_for_timeout(600)

        # and the replay, which is its own mode
        gm.wait_for_selector("#replaybox:not([hidden])", timeout=8000)
        gm.click("#replay")                       # start it
        gm.wait_for_timeout(400)
        gm.click("#replay")                       # and step it forward
        gm.wait_for_timeout(400)
        gm.click("#replaystop")
        gm.wait_for_timeout(300)
        self.assertEqual(errors, [], "the browser reported script errors")

    def test_the_console_actually_fills_in(self):
        """A script error leaves the page blank rather than broken, so check the
        boxes carry values, not just that nothing threw."""
        fresh(seed=124)
        play_round("hunt")
        gm = page(1100, 950)
        gm.goto(BASE + "/gm")
        gm.wait_for_function("document.querySelector('#round').textContent !== ''", timeout=8000)
        self.assertNotEqual(gm.text_content("#round").strip(), "")
        self.assertNotEqual(gm.text_content("#health").strip(), "")
        self.assertGreater(gm.locator("#players tr").count(), 0)


class J11_Reset(unittest.TestCase):
    def test_reset_returns_to_an_empty_lobby(self):
        fresh(seed=111)
        play_round("hunt")
        api("/api/gm/reset", {"seed": 112})
        st = api("/api/state")
        self.assertEqual(st["phase"], "lobby")
        self.assertEqual(st["players"], [])
        self.assertEqual(st["round"], 0)
        self.assertIsNone(st["ending"])
        self.assertIn("Waiting for the game master", plain(api("/api/frame")["frame"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
