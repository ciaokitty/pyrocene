import copy
import unittest

from stage4.ash_game import AshGame


OBSERVATION_LED = [
    "lidar", "drone D4", "remove D4", "restore D4",
    "drone I4", "remove I4", "restore I4", "drone B8", "remove B8", "restore B8",
]


class AshGameTest(unittest.TestCase):
    def test_default_seed_and_bounded_view(self):
        game = AshGame()
        result = game.view()
        self.assertEqual(result["view"]["health"], 82)
        self.assertEqual((result["view"]["cols"], result["view"]["rows"]), (22, 12))
        self.assertEqual(result["view"]["max_turns"], 14)
        self.assertEqual(len(result["view"]["cells"]), 264)
        self.assertEqual(result["view"]["unlocks"]["level"], 2)
        self.assertIsNone(result["view"].get("dss_advice"))
        self.assertLessEqual(len(result["line"]), 110)

    def test_free_and_invalid_commands_do_not_advance(self):
        game = AshGame()
        start = game.view()["view"]["turn"]
        for command in ("help", "view", "nonsense", "drone Z99"):
            result = game.command(command)
            self.assertEqual(result["view"]["turn"], start)
            self.assertEqual(result["events"], [])
        self.assertEqual(game.serialize()["commands"], [])

    def test_aliases_and_public_event_whitelist(self):
        game = AshGame()
        for command in ("sat", "tls E5"):
            result = game.command(command)
            self.assertIn(result["action"], ("satellite", "tls"))
            self.assertTrue(all(set(event).issubset({
                "type", "source", "area", "detected", "removed", "reclaimed",
                "reinvaded", "bared", "planted", "mode", "firePublicCells",
            }) for event in result["events"]))
        self.assertEqual(game.view()["view"]["turn"], 3)

    def test_observation_led_seed7_route_wins(self):
        game = AshGame()
        results = [game.command(command) for command in OBSERVATION_LED]
        self.assertEqual(results[-1]["view"]["status"], "win")
        self.assertEqual(results[-1]["view"]["health"], 87)
        self.assertEqual(results[-1]["view"]["turn"], 10)
        self.assertGreaterEqual(results[-1]["view"]["wildlife"], 70)
        self.assertFalse(any(e['type']=='fire' for r in results for e in r['events']))
        self.assertTrue(any(event["type"] == "scan" for result in results for event in result["events"]))
        self.assertTrue(any(event["type"] == "remove" for result in results for event in result["events"]))

    def test_blind_pass_and_reactive_single_patch_do_not_win(self):
        passing = AshGame()
        for _ in range(14):
            passing.command("pass")
        self.assertNotEqual(passing.view()["view"]["status"], "win")

        reactive = AshGame()
        commands = ["lidar", "drone D4"] + ["remove D4"] * 5 + ["restore D4"] * 5
        for command in commands:
            reactive.command(command)
        self.assertNotEqual(reactive.view()["view"]["status"], "win")

    def test_reactive_dense_from_public_view_is_late_or_loses(self):
        # This baseline scores every possible footprint using observable cells.
        # It clears the largest visible dense cluster, not an arbitrary cell.
        game = AshGame()
        game.command("lidar")
        pending = None

        def name(cell):
            return f"{chr(65 + cell['c'])}{cell['r'] + 1}"

        for _ in range(13):
            view = game.view()["view"]
            if pending:
                command = f"restore {pending}"
                pending = None
            else:
                candidates=[]
                size=view['action_sizes']['work']
                for r in range(view['rows']):
                    for c in range(view['cols']):
                        score=sum(cell['cover']=='invasive' and cell['stage']==3 for cell in view['cells'] if r<=cell['r']<r+size and c<=cell['c']<c+size)
                        candidates.append((score,r,c))
                score,r,c=max(candidates,key=lambda x:x[0])
                if score:
                    pending = f'{chr(65+c)}{r+1}'
                    command = f"remove {pending}"
                else:
                    command = "pass"
            result = game.command(command)
            if result["view"]["status"] != "playing":
                break
        self.assertNotEqual(game.view()["view"]["status"], "win")

    def test_commands_after_terminal_are_rejected_without_advancing(self):
        game = AshGame()
        for command in OBSERVATION_LED:
            result = game.command(command)
            if result["view"]["status"] == "win":
                break
        self.assertEqual(game.view()["view"]["status"], "win")
        before = game.serialize()
        result = game.command("pass")
        self.assertEqual(result["action"], "terminal")
        self.assertEqual(game.serialize(), before)

    def test_seed_command_replay(self):
        game = AshGame()
        for command in OBSERVATION_LED:
            game.command(command)
        payload = game.serialize()
        replay = AshGame.replay(copy.deepcopy(payload))
        self.assertEqual(replay.view(), game.view())
        self.assertEqual(replay.serialize(), payload)
        bad = copy.deepcopy(payload)
        bad["commands"].append("help")
        with self.assertRaises(ValueError):
            AshGame.replay(bad)

    def test_eight_dense_reactive_timings_fail_on_curated_island(self):
        from stage4.ash_strategy_eval import dense_policy
        for delay in range(8):
            self.assertEqual(dense_policy(delay)['status'],'lose',delay)

    def test_more_than_one_informed_route_can_win(self):
        from stage4.ash_strategy_eval import scripted
        for plots in [('C3','I4','B8'),('I4','D4','B8'),('D4','I4','A8')]:
            route=['lidar']+[f'{verb} {plot}' for plot in plots for verb in ('drone','remove','restore')]
            self.assertEqual(scripted(route)['status'],'win',plots)


if __name__ == "__main__":
    unittest.main()
