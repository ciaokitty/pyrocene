"""Rules that hold no matter who is playing. Pure logic, no server, no browser.

    python3 -m unittest stage2.tests.test_rules
"""
from __future__ import annotations
import random
import unittest

from stage2.game import (Game, across_water, LANTANA, NATIVE_P, ECOLOGIST,
                         RANGER, WATER, INVASIVE)
from stage2.engine.rules import neighbors8


def play(seed: int, rounds: int = 99, stage: int = 2, hook=None):
    """One scripted game. `hook` runs after each growth step with the game."""
    rng = random.Random(seed * 7919)
    g = Game(seed=seed, config={"stage": stage})
    for i in range(12):
        g.add_player(f"P{i + 1}")
    g.start()
    n = 0
    while g.phase == "playing" and n < rounds:
        n += 1
        prey = [p for p in g.players.values()
                if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
        if prey and rng.random() > 0.25:
            g.eliminate(rng.choice(prey).id)
        g.resolve_night()
        if hook:
            hook(g)
        if g.phase != "playing":
            break
        pool = [p for p in g.players.values() if p.alive]
        g.eliminate(rng.choice(pool).id)
        g.choose("hunt", None)
        g.resolve_vote()
        if hook:
            hook(g)
    return g


class Water(unittest.TestCase):
    """A river is a break for fire and for a trench, so it has to be a break for
    lantana too. Diagonal neighbours let a stand step around the corner of a
    one-cell channel and appear on the far bank with nothing joining it."""

    def test_the_corner_case_is_recognised(self):
        g = Game(seed=3)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        s = g.state
        # Build a corner of water by hand and check both diagonals of it.
        r, c = 4, 6
        a = r * s.cols + c
        b = (r + 1) * s.cols + (c + 1)
        s.cells[(r + 1) * s.cols + c].cover = WATER
        s.cells[r * s.cols + (c + 1)].cover = WATER
        self.assertTrue(across_water(s, a, b))
        s.cells[r * s.cols + (c + 1)].cover = "native"
        self.assertFalse(across_water(s, a, b),
                         "one dry side is enough to walk around")

    def test_spread_never_crosses_it(self):
        """Every square lantana takes must touch a square it already held, by a
        step that does not cut a water corner."""
        seen = {"grown": 0, "crossed": 0}
        original = Game._grow

        def watched(self, rng):
            s = self.state
            before = {c.index for c in s.cells if c.cover == INVASIVE}
            new, cand = original(self, rng)
            for i in new:
                seen["grown"] += 1
                if not any(j in before and not across_water(s, j, i)
                           for j, _ in neighbors8(s, i)):
                    seen["crossed"] += 1
            return new, cand

        Game._grow = watched
        try:
            for seed in range(1, 13):
                play(seed)
        finally:
            Game._grow = original
        self.assertGreater(seen["grown"], 400, "the sample has to be worth something")
        self.assertEqual(seen["crossed"], 0)

    def test_bare_ground_is_not_taken_across_it(self):
        seen = {"taken": 0, "crossed": 0}
        original = Game._leak

        def watched(self, rng):
            s = self.state
            before = {c.index for c in s.cells if c.cover == INVASIVE}
            touched = original(self, rng)
            for i in touched:
                if s.cells[i].cover != INVASIVE:
                    continue
                seen["taken"] += 1
                if not any(j in before and not across_water(s, j, i)
                           for j, _ in neighbors8(s, i)):
                    seen["crossed"] += 1
            return touched

        Game._leak = watched
        try:
            for seed in range(1, 13):
                play(seed)
        finally:
            Game._leak = original
        self.assertGreater(seen["taken"], 40)
        self.assertEqual(seen["crossed"], 0)

    def test_one_stand_does_not_span_a_channel(self):
        """Fire severity comes from the biggest connected stand of thick lantana.
        If that count reaches over water, a fire is rated for fuel it can never
        actually run through."""
        for seed in range(1, 13):
            g = play(seed)
            s = g.state
            for comp in g.dense_clusters():
                inside = set(comp)
                for i in comp:
                    for j, _ in neighbors8(s, i):
                        if j in inside:
                            self.assertFalse(
                                across_water(s, i, j) and not any(
                                    k in inside and not across_water(s, i, k)
                                    for k, _ in neighbors8(s, i)),
                                f"seed {seed}: a stand joined across water")


class Connectivity(unittest.TestCase):
    """The lesson stage 2 exists to deliver: scattered patches are a nuisance,
    one joined-up band is a different problem."""

    def test_severity_follows_the_band_not_the_thickest_patch(self):
        g = play(4, rounds=3)
        bands = g.bands()
        self.assertTrue(bands)
        sev, cluster = g.severity()
        self.assertEqual(sorted(cluster), sorted(bands[0]),
                         "severity must be read off the biggest connected band")
        load = g.band_load(bands[0])
        want = 1 if load < g.cfg["sev_t1"] else 2 if load < g.cfg["sev_t2"] else 3
        self.assertEqual(sev, want)

    def test_a_band_never_spans_open_water(self):
        for seed in (2, 6, 10, 14):
            g = play(seed)
            s = g.state
            for band in g.bands():
                inside = set(band)
                for i in band:
                    joins = [j for j, _ in neighbors8(s, i)
                             if j in inside and not across_water(s, i, j)]
                    if not joins and len(band) > 1:
                        self.fail(f"seed {seed}: a band held together only across water")

    def test_the_evening_builds(self):
        """Small scattered fires first, one big connected run later. If this
        inverts, the game teaches that early action does not matter."""
        first, early, late = [], [], []
        for seed in range(1, 31):
            g = play(seed)
            for k, h in enumerate(g.history, start=1):
                f = h.get("fire") or {}
                n = len(f.get("burned_cells") or [])
                if k == 1:
                    first.append(n)
                (early if k <= 2 else late).append(n)
        self.assertGreater(len(early), 40)
        self.assertGreater(len(late), 30)
        mean_early = sum(early) / len(early)
        mean_late = sum(late) / len(late)
        # The first night is the one that has to be small: it is where the room
        # learns that hunting now is cheap. Averaging the first two together
        # hides that, because night two is already climbing on purpose.
        self.assertLess(sum(first) / len(first), 8,
                        f"night one should be a spark, got {sum(first)/len(first):.1f}")
        self.assertGreater(mean_late, 2.5 * mean_early,
                           f"late fires should dwarf early ones: {mean_early:.1f} then {mean_late:.1f}")

    def test_the_room_is_told_once_when_it_joins_up(self):
        seen = 0
        for seed in range(1, 21):
            rng = random.Random(seed * 7919)
            g = Game(seed=seed)
            for i in range(12):
                g.add_player(f"P{i + 1}")
            g.start()
            calls = 0
            while g.phase == "playing":
                prey = [p for p in g.players.values()
                        if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
                if prey and rng.random() > 0.25:
                    g.eliminate(rng.choice(prey).id)
                g.resolve_night()
                if g.phase != "playing":
                    break
                pool = [p for p in g.players.values() if p.alive]
                g.eliminate(rng.choice(pool).id)
                g.choose("hunt", None)
                g.resolve_vote()
                # Stage 2 folds the night into one animation, so the parts are
                # read off last_phases rather than off what resolve hands back.
                calls += sum(1 for st in g.last_phases if st["key"] == "network")
            self.assertLessEqual(calls, 1, f"seed {seed}: said it more than once")
            seen += calls
        self.assertGreaterEqual(seen, 15, "most games should reach the turn")

    def test_stage_one_never_says_it(self):
        g = Game(seed=3, config={"stage": 1})
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        rng = random.Random(3)
        while g.phase == "playing":
            pool = [p for p in g.players.values() if p.alive]
            g.eliminate(rng.choice(pool).id)
            g.resolve_night()
            if g.phase != "playing":
                break
            pool = [p for p in g.players.values() if p.alive]
            g.eliminate(rng.choice(pool).id)
            g.choose("hunt", None)
            g.resolve_vote()
            for st in g.last_phases:
                self.assertNotEqual(st["key"], "network",
                                    "stage 1 has no fire, so the band means nothing there")

    def test_the_automatic_choice_does_not_hide_the_big_fire(self):
        """Water holds a fire to a few squares. Picking it the moment a band has
        formed is exactly when it must not be picked, or the room never sees the
        run they have been building towards all evening."""
        picks = []
        for seed in range(1, 26):
            g = play(seed, rounds=4)
            if g.phase != "playing":
                continue
            if g.bands() and g.connected():
                g.locked_sev, g.locked_cluster = g.severity()
                picks.append(g._auto_action()[0])
        self.assertGreater(len(picks), 8, "need a real sample")
        self.assertNotIn("water", picks)


class ReplayShowsTheFire(unittest.TestCase):
    """A snapshot taken at the end of a round only holds the bare ground a fire
    left. Rebuilding the replay from those alone handed the room the aftermath
    and never the burning, which is the part they remember."""

    def _played(self, seed=13, rounds=5):
        rng = random.Random(2)
        g = Game(seed=seed)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        for _ in range(rounds):
            prey = [p for p in g.players.values()
                    if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
            if prey:
                g.eliminate(rng.choice(prey).id)
            g.resolve_night()
            if g.phase != "playing":
                break
            g.choose("resilience", None)
            g.resolve_vote()
            if g.phase != "playing":
                break
        return g

    def test_a_night_that_burned_burns_again_in_the_replay(self):
        g = self._played()
        burned_nights = [h["round"] for h in g.history
                         if len((h.get("fire") or {}).get("burned_cells") or [])]
        self.assertTrue(burned_nights, "this game needs a fire to be worth testing")
        by_round = {st["round"]: st for st in g.replay_beats()}
        for r in burned_nights:
            kinds = [f["kind"] for f in by_round[r]["beats"]]
            self.assertIn("ignite", kinds, f"night {r} burned but never lights up")
            self.assertIn("burn", kinds)
            lit = [f for f in by_round[r]["beats"] if f["fire"]]
            self.assertTrue(lit, f"night {r} has no frame carrying fire")
            self.assertEqual(len(lit[-1]["fire"]),
                             len((g.history[r - 1].get("fire") or {})["burned_cells"]),
                             "the replay must burn the same squares the game did")

    def test_the_fire_burns_the_board_it_started_on(self):
        """Drawn on the finished board the flames would sit on ground that is
        already bare, so the run would read as nothing happening."""
        g = self._played()
        for st in g.replay_beats():
            for f in st["beats"]:
                if f["kind"] in ("ignite", "spread", "burn"):
                    cover = {c["index"]: c["cover"] for c in f["view"]["cells"]}
                    alight = [i for i in f["fire"] if cover.get(i) != "bare"]
                    self.assertTrue(alight,
                                    "every burning frame draws on the pre-fire board")
                    break

    def test_the_ground_moves_before_the_fire_does(self):
        g = self._played()
        for st in g.replay_beats():
            kinds = [f["kind"] for f in st["beats"]]
            if "creep" in kinds and "ignite" in kinds:
                self.assertLess(kinds.index("creep"), kinds.index("ignite"),
                                f"night {st['round']} burns before it grows")
            if "ignite" in kinds:
                self.assertEqual(kinds[-1], "settle")

    def test_stage_one_replay_has_no_fire_in_it(self):
        rng = random.Random(2)
        g = Game(seed=13, config={"stage": 1})
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        while g.phase == "playing":
            pool = [p for p in g.players.values() if p.alive]
            g.eliminate(rng.choice(pool).id)
            g.resolve_night()
            if g.phase != "playing":
                break
            pool = [p for p in g.players.values() if p.alive]
            g.eliminate(rng.choice(pool).id)
            g.choose("hunt", None)
            g.resolve_vote()
        for st in g.replay_beats():
            for f in st["beats"]:
                self.assertEqual(f["fire"], [], "stage 1 never burns")


class SeasonLength(unittest.TestCase):
    """The game master's one dial. Shortening the season says the year is ending
    dry; lengthening it says there is time, and the fire that follows works for
    the room instead of against it. Both are real fire behaviour."""

    def _play(self, seed, mode, call_at=4, shelter=True):
        rng = random.Random(seed * 7919)
        g = Game(seed=seed)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        at_call = None
        while g.phase == "playing":
            r = g.round
            if r == call_at:
                g.set_max_rounds(r if mode == "finale" else g.cfg["max_rounds"] + 2)
            prey = [p for p in g.players.values()
                    if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
            if prey and rng.random() > 0.25:
                g.eliminate(rng.choice(prey).id)
            g.resolve_night()
            if g.phase != "playing":
                break
            fuel_before = sum(1 for c in g.state.cells if c.cover == INVASIVE)
            if shelter:
                g.choose("resilience", None)
            else:
                pool = [p for p in g.players.values() if p.alive]
                g.eliminate(rng.choice(pool).id)
                g.choose("hunt", None)
            g.resolve_vote()
            if r == call_at:
                fire = (g.history[-1].get("fire") or {})
                at_call = {"fire": fire, "health": g.history[-1]["health"],
                           "fuel_before": fuel_before,
                           "fuel_after": sum(1 for c in g.state.cells if c.cover == INVASIVE)}
                if mode == "reprieve":
                    break
        return g, at_call

    def test_the_dial_cannot_end_a_night_before_it_is_played(self):
        """Calling time on the round you are on has to let that round happen.
        Checking the calendar during the night ended the game before the night
        the game master was calling time on had been played at all."""
        g, at = self._play(3, "finale", call_at=4)
        self.assertIsNotNone(at, "the last night never ran")
        self.assertEqual(len(g.history), 4)

    def test_calling_time_ends_it_on_a_fire(self):
        reasons, burns = [], []
        for seed in range(1, 16):
            g, at = self._play(seed, "finale", call_at=4)
            if not at:
                continue
            reasons.append((g.ending or {}).get("reason"))
            burns.append(len(at["fire"].get("burned_cells") or []))
        self.assertGreaterEqual(len(reasons), 10)
        on_fire = sum(1 for r in reasons if r in ("fire", "village"))
        self.assertGreaterEqual(on_fire, int(0.8 * len(reasons)),
                                f"the season should end on the fire, got {reasons}")
        self.assertGreater(sum(burns) / len(burns), 50,
                           "the last fire has to be the big one")

    def test_buying_a_night_burns_the_lantana_back(self):
        cleared, burns = [], []
        for seed in range(1, 21):
            g, at = self._play(seed, "reprieve", call_at=4)
            if not at:
                continue
            cleared.append(at["fuel_before"] - at["fuel_after"])
            burns.append(len(at["fire"].get("burned_cells") or []))
        self.assertGreaterEqual(len(cleared), 12)
        self.assertGreater(sum(1 for c in cleared if c > 0), len(cleared) * 0.6,
                           f"most bought nights should leave less lantana: {cleared}")
        self.assertGreater(sum(burns) / len(burns), 20)

    def test_the_dial_will_not_go_below_the_night_in_play(self):
        g = Game(seed=3)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        g.round = 5
        self.assertEqual(g.set_max_rounds(2), 5)
        self.assertTrue(g.finale)


class TwoBatchesPerNight(unittest.TestCase):
    """A round arrives in two halves. The night shows what was taken and what
    lantana gained, before the room votes, so they argue about the board in
    front of them. The vote shows what the room did and then the fire."""

    def _round(self, g, rng, choice="resilience"):
        prey = [p for p in g.players.values()
                if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
        if prey:
            g.eliminate(rng.choice(prey).id)
        night = g.resolve_night()
        if g.phase != "playing":
            return night, []
        if choice == "hunt":
            pool = [p for p in g.players.values() if p.alive]
            g.eliminate(rng.choice(pool).id)
        g.choose(choice, None)
        return night, g.resolve_vote()

    def test_the_night_is_one_reveal(self):
        """The removal and the spread go up together, and this is the reason:
        a night that takes the ecologist or the ranger moves no ground, so
        showing the removal on its own announced that a specialist had gone."""
        rng = random.Random(2)
        g = Game(seed=13)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        for _ in range(3):
            night, day = self._round(g, rng)
            if g.phase != "playing":
                break
            keys = [st["key"] for st in night if st["key"] != "network"]
            self.assertEqual(keys, ["night"], f"one reveal, not {keys}")
            self.assertTrue(all(st["text"] for st in night), "it gets a line")

    def test_a_specialist_night_looks_like_any_other(self):
        """The card and the shape of the reveal must not say which role went."""
        seen = {}
        for role in (ECOLOGIST, RANGER, NATIVE_P, LANTANA):
            g = Game(seed=13, config={"stage": 1})
            for i in range(12):
                g.add_player(f"P{i + 1}")
            g.start()
            who = next((p for p in g.players.values() if p.role == role), None)
            if not who:
                continue
            g.eliminate(who.id)
            st = g.resolve_night()[0]
            seen[role] = (st["text"], bool(st["cells"]))
        texts = {v[0] for v in seen.values()}
        self.assertEqual(len(texts), 1, f"the card differs by role: {seen}")
        self.assertTrue(all(v[1] for v in seen.values()),
                        f"every night has to move something: {seen}")

    def test_the_vote_shows_the_room_then_the_fire(self):
        rng = random.Random(2)
        g = Game(seed=13)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        seen = 0
        for _ in range(4):
            night, day = self._round(g, rng)
            if g.phase != "playing" or not day:
                break
            keys = [st["key"] for st in day if st["key"] != "ending"]
            self.assertEqual(keys[-1], "fire", f"the fire comes last, got {keys}")
            self.assertIn(keys[0], ("line", "water", "ews", "vote"))
            self.assertNotIn("growth", keys, "growth belongs to the night now")
            seen += 1
        self.assertGreater(seen, 1)

    def test_lantana_grows_before_the_room_votes(self):
        """The whole reason for moving it. If the room votes first they are
        arguing about last night's board."""
        rng = random.Random(4)
        g = Game(seed=13)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        prey = [p for p in g.players.values()
                if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
        g.eliminate(rng.choice(prey).id)
        before = sum(1 for c in g.state.cells if c.cover == INVASIVE)
        g.resolve_night()
        after = sum(1 for c in g.state.cells if c.cover == INVASIVE)
        self.assertGreater(after, before, "lantana should have moved in the night")
        self.assertEqual(g.step, "day")

    def test_each_card_is_one_line(self):
        """One word or one phrase, then the thing itself. A paragraph here and
        the room reads instead of watching."""
        rng = random.Random(6)
        g = Game(seed=13)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        for _ in range(3):
            night, day = self._round(g, rng)
            if g.phase != "playing":
                break
            for st in night + day:
                if st["key"] in ("ending", "network"):
                    continue
                self.assertLess(len(st["text"]), 70,
                                f"{st['key']} card is too long: {st['text']!r}")
                # One sentence, or the forecast, which is two short ones.
                self.assertLessEqual(st["text"].count("."), 2, st["text"])

    def test_stage_one_has_no_fire_and_no_crew(self):
        rng = random.Random(2)
        g = Game(seed=13, config={"stage": 1})
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        night, day = self._round(g, rng, choice="hunt")
        self.assertEqual([st["key"] for st in night], ["night"])
        self.assertEqual([st["key"] for st in day], ["vote"])


class Openings(unittest.TestCase):
    def test_stage_two_opens_by_saying_how_a_night_goes(self):
        g = Game(seed=3)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        steps = g.intro_steps()
        self.assertEqual(len(steps), 1)
        for word in ("Team lantana eliminates", "The room votes", "Lantana spreads",
                     "Fire sparks"):
            self.assertIn(word, steps[0]["text"])

    def test_stage_one_has_no_such_card(self):
        g = Game(seed=3, config={"stage": 1})
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        self.assertEqual(g.intro_steps(), [])

    def test_early_warning_is_one_card_with_the_forecast_on_it(self):
        """It used to put up a paragraph about a lookout going up and then give
        the actual warning three screens later."""
        rng = random.Random(2)
        g = Game(seed=13)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        for _ in range(2):
            prey = [p for p in g.players.values()
                    if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
            if prey:
                g.eliminate(rng.choice(prey).id)
            g.resolve_night()
            if g.phase != "playing":
                return
            g.choose("resilience", "ews")
            g.resolve_vote()
            said = [st for st in g.last_phases if st["key"] == "ews"]
            self.assertEqual(len(said), 1, "one card, not two")
            self.assertTrue(said[0]["text"].startswith("Forecast for next night:"),
                            said[0]["text"])
            self.assertLess(len(said[0]["text"]), 90, "no paragraph")


class TheTrenchIsALine(unittest.TestCase):
    """A firebreak is a strip cleared between the fuel and the thing being
    defended. The walk that places it used to be free to pick a cell touching
    several already in the chain, so ten cells came out as a three wide
    staircase in a corner. Connected, but not a line, and not something anybody
    digs."""

    def _first_trench(self, seed):
        rng = random.Random(seed * 7919)
        g = Game(seed=seed)
        for i in range(12):
            g.add_player(f"P{i + 1}")
        g.start()
        while g.phase == "playing":
            prey = [p for p in g.players.values()
                    if p.alive and p.role in (NATIVE_P, ECOLOGIST, RANGER)]
            if prey and rng.random() > 0.25:
                g.eliminate(rng.choice(prey).id)
            g.resolve_night()
            if g.phase != "playing":
                return g, []
            before = {c.index for c in g.state.cells if c.fireline}
            g.choose("resilience", "fireline")
            g.resolve_vote()
            dug = [c.index for c in g.state.cells
                   if c.fireline and c.index not in before]
            if dug:
                return g, dug
        return g, []

    def test_no_cell_is_surrounded_by_its_own_trench(self):
        """One square wide. A cell with four or more trench neighbours is a blob
        and reads on the projector as a smudge rather than a break."""
        checked = 0
        for seed in range(1, 26):
            g, dug = self._first_trench(seed)
            if not dug:
                continue
            checked += 1
            S = set(dug)
            for i in dug:
                n = sum(1 for j, _ in neighbors8(g.state, i) if j in S)
                self.assertLess(n, 4, f"seed {seed}: the trench thickened")
        self.assertGreater(checked, 15)

    def test_it_reads_as_a_path_not_a_patch(self):
        """Averaged over seeds, every cell should have about two neighbours,
        which is what a line looks like. A solid block averages four or more."""
        degrees = []
        for seed in range(1, 26):
            g, dug = self._first_trench(seed)
            if len(dug) < 3:
                continue
            S = set(dug)
            degrees += [sum(1 for j, _ in neighbors8(g.state, i) if j in S) for i in dug]
        self.assertGreater(len(degrees), 40)
        mean = sum(degrees) / len(degrees)
        self.assertLess(mean, 2.4, f"mean neighbours {mean:.2f}, that is a patch")

    def test_it_is_still_one_connected_run(self):
        for seed in range(1, 21):
            g, dug = self._first_trench(seed)
            if not dug:
                continue
            S = set(dug)
            seen = {dug[0]}
            stack = [dug[0]]
            while stack:
                i = stack.pop()
                for j, _ in neighbors8(g.state, i):
                    if j in S and j not in seen:
                        seen.add(j)
                        stack.append(j)
            self.assertEqual(len(seen), len(S), f"seed {seed}: the trench is in pieces")


class ReplayNames(unittest.TestCase):
    """The replay names whoever went out, because that is what lets a room put a
    night in the game against a change on the ground. Nothing else may."""

    def test_only_people_who_went_out_and_owned_ground(self):
        g = play(5, stage=1)
        beats = g.replay_beats()
        self.assertGreaterEqual(len(beats), 1)
        for k, beat in enumerate(beats, start=1):
            for b in beat["badges"]:
                p = next(x for x in g.players.values() if x.name == b["name"])
                self.assertFalse(p.alive)
                self.assertEqual(p.out_round, k)
                self.assertIn(p.role, (LANTANA, NATIVE_P),
                              "the specialists own no ground, so they get no badge")
                self.assertTrue(b["cells"])
                self.assertIn(b["by"], ("night", "vote"))

    def test_every_landowner_who_went_out_is_named_once(self):
        g = play(8, stage=1)
        named = [b["name"] for beat in g.replay_beats() for b in beat["badges"]]
        expected = [p.name for p in g.players.values()
                    if not p.alive and p.role in (LANTANA, NATIVE_P) and p.patch]
        self.assertEqual(sorted(named), sorted(expected))
        self.assertEqual(len(named), len(set(named)), "nobody is named twice")

    def test_the_two_kinds_of_removal_are_told_apart(self):
        """Most nights two people go out, one taken by lantana and one voted out
        by the room. The replay has to say which is which or it is only telling
        the room that two people are gone."""
        g = play(6, stage=1)
        kinds = {b["by"] for beat in g.replay_beats() for b in beat["badges"]}
        self.assertTrue(kinds, "somebody must have gone out")
        for p in g.players.values():
            if not p.alive:
                self.assertIn(p.out_by, ("night", "vote"))

    def test_play_frames_carry_no_names(self):
        g = play(11, stage=1, rounds=3)
        for step in g.last_steps or []:
            for f in step.get("beats", []):
                self.assertFalse(f.get("badges"),
                                 "a frame shown during play must not name anyone")


if __name__ == "__main__":
    unittest.main()
