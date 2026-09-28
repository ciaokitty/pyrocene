"""Black-box contract checks for the local Ash HTTP wrapper."""

from __future__ import annotations

import json
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

from . import serve


class AshHttpTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.httpd = serve.create_server("127.0.0.1", 0)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.httpd.server_port}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=3)

    def post(self, path: str, body: object, **headers: str) -> tuple[int, dict]:
        request = urllib.request.Request(
            self.base + path,
            data=json.dumps(body).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json", **headers},
        )
        try:
            with urllib.request.urlopen(request, timeout=3) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read())

    def test_new_command_stale_and_resume_are_bounded(self) -> None:
        status, created = self.post("/api/ash/new", {"seed": 19})
        self.assertEqual(status, 200)
        self.assertIn("session", created)
        self.assertEqual(set(created) - {"session"}, {"view", "events", "line", "action", "target", "night"})
        token, turn = created["session"], created["night"]
        status, scanned = self.post("/api/ash/command", {"session": token, "command": "drone D3", "expectedTurn": turn})
        self.assertEqual(status, 200)
        self.assertEqual(scanned["action"], "drone")
        self.assertEqual(scanned["target"], "D3")
        self.assertTrue(scanned["events"], "scan events must reach the browser")
        self.assertEqual(scanned["night"], turn + 1)
        status, invalid = self.post("/api/ash/command", {"session": token, "command": "not a command", "expectedTurn": scanned["night"]})
        self.assertEqual(status, 200)
        self.assertEqual(invalid["action"], "invalid")
        self.assertEqual(invalid["night"], scanned["night"])
        status, advanced = self.post("/api/ash/command", {"session": token, "command": "pass", "expectedTurn": scanned["night"]})
        self.assertEqual(status, 200)
        self.assertGreater(advanced["night"], invalid["night"])
        status, stale = self.post("/api/ash/command", {"session": token, "command": "pass", "expectedTurn": scanned["night"]})
        self.assertEqual(status, 409)
        self.assertEqual(stale["error"], "stale expectedTurn")
        status, replay = self.post("/api/ash/resume", {"seed": 19, "commands": ["drone D3", "pass"]})
        self.assertEqual(status, 200)
        self.assertEqual(replay["view"], advanced["view"])
        from .test_ash_game import OBSERVATION_LED
        status, winning = self.post("/api/ash/resume", {"seed": 7, "commands": OBSERVATION_LED})
        self.assertEqual(status, 200)
        self.assertEqual(winning["view"]["status"], "win")
        status, losing = self.post("/api/ash/resume", {"seed": 7, "commands": ["pass"] * 12})
        self.assertEqual(status, 200)
        self.assertEqual(losing["view"]["status"], "lose")

    def test_origin_json_and_length_rejections(self) -> None:
        status, body = self.post("/api/ash/new", {}, Origin="http://example.invalid")
        self.assertEqual(status, 403)
        self.assertIn("error", body)
        request = urllib.request.Request(self.base + "/api/ash/new", data=b"{}", method="POST")
        try:
            urllib.request.urlopen(request, timeout=3)
        except urllib.error.HTTPError as error:
            self.assertEqual(error.code, 415)
        else:
            self.fail("JSON content type must be required")
        status, body = self.post("/api/ash/resume", {"seed": 1, "commands": ["pass"] * 51})
        self.assertEqual(status, 400)
        self.assertIn("error", body)
        status, body = self.post("/api/ash/resume", {"seed": 1, "commands": ["help"]})
        self.assertEqual(status, 400)
        self.assertIn("error", body)


if __name__ == "__main__":
    unittest.main()
