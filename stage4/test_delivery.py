"""Black-box checks for the offline server and package builder."""

from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from . import package, serve


class DeliveryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.app = self.root / "app"
        self.assets = self.root / "assets"
        self.vendor = self.app / "vendor"
        self.app.mkdir()
        self.assets.mkdir()
        self.vendor.mkdir()
        for name in serve.APP_FILES:
            (self.app / name).parent.mkdir(parents=True, exist_ok=True)
            (self.app / name).write_text(f"fixture {name}\n", encoding="utf-8")
        (self.vendor / "three.min.js").write_text("/* three fixture */\n", encoding="utf-8")
        (self.vendor / "THREE-LICENSE.txt").write_text("license fixture\n", encoding="utf-8")
        self._write_assets()
        self.httpd = serve.create_server("127.0.0.1", 0, app_root=self.app, assets=self.assets)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.httpd.server_port}"

    def tearDown(self) -> None:
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=3)
        self.temp.cleanup()

    def _write_assets(self) -> None:
        contents = {
            "forest.bin": b"forest",
            "forest-low.bin": b"low",
            "forest-overhead.jpg": b"jpg",
            "emit.png": b"emit",
            "emit-selected.png": b"selected",
            "fine.png": b"fine",
            "sentinel.png": b"sentinel",
        }
        outputs = {}
        for name in serve.REQUIRED_ASSETS - {"manifest.json"}:
            contents.setdefault(name, b"asset fixture")
        for name, value in contents.items():
            (self.assets / name).write_bytes(value)
            outputs[name] = {"bytes": len(value), "sha256": hashlib.sha256(value).hexdigest()}
        (self.assets / "manifest.json").write_text(
            json.dumps({"schema": "fixture", "outputs": outputs}), encoding="utf-8"
        )

    def get(self, path: str) -> tuple[int, str, bytes]:
        try:
            with urllib.request.urlopen(self.base + path, timeout=3) as response:
                return response.status, response.headers.get("Content-Type", ""), response.read()
        except urllib.error.HTTPError as error:
            return error.code, error.headers.get("Content-Type", ""), error.read()

    def test_shell_mime_vendor_and_health(self) -> None:
        status, content_type, body = self.get("/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", content_type)
        self.assertIn(b"fixture index.html", body)

        status, content_type, _ = self.get("/app.mjs")
        self.assertEqual(status, 200)
        self.assertIn("text/javascript", content_type)
        status, _, body = self.get("/vendor/three.min.js")
        self.assertEqual(status, 200)
        self.assertIn(b"three fixture", body)

        status, content_type, body = self.get("/health")
        self.assertEqual(status, 200)
        self.assertIn("application/json", content_type)
        self.assertEqual(json.loads(body), {"ok": True, "assets": True, "app": True})

    def test_traversal_and_unrelated_files_are_not_exposed(self) -> None:
        (self.root / "secret.txt").write_text("do not serve", encoding="utf-8")
        (self.assets / "source-notes.txt").write_text("not a runtime asset", encoding="utf-8")
        self.assertEqual(self.get("/assets/source-notes.txt")[0], 404)
        for path in ("/assets/%2e%2e/secret.txt", "/assets/../secret.txt", "/serve.py", "/app/secret.txt", "/vendor/other.js"):
            self.assertEqual(self.get(path)[0], 404, path)
        outside = self.root / "outside.bin"
        outside.write_bytes(b"outside")
        try:
            (self.assets / "escape.bin").symlink_to(outside)
        except (OSError, NotImplementedError):
            pass
        else:
            self.assertEqual(self.get("/assets/escape.bin")[0], 404)

    def test_readiness_and_concurrent_clients(self) -> None:
        (self.assets / "forest.bin").unlink()
        status, _, body = self.get("/health")
        self.assertEqual(status, 503)
        self.assertFalse(json.loads(body)["assets"])

        # Restore the fixture and ensure ThreadingHTTPServer handles bursts.
        (self.assets / "forest.bin").write_bytes(b"forest")
        with ThreadPoolExecutor(max_workers=8) as pool:
            responses = list(pool.map(lambda _: self.get("/assets/forest-low.bin")[0], range(16)))
        self.assertEqual(responses, [200] * 16)

    def test_only_explicit_portable_archive_is_downloadable(self) -> None:
        self.assertEqual(self.get("/download")[0], 404)
        archive = self.assets.parent / "pyrocene-stage4-v0.zip"
        archive.write_bytes(b"portable fixture")
        with urllib.request.urlopen(self.base + "/download") as response:
            self.assertEqual(response.read(), b"portable fixture")
            self.assertIn("attachment", response.headers["Content-Disposition"])
            self.assertEqual(response.headers["Content-Type"], "application/zip")
        self.assertEqual(self.get("/pyrocene-stage4-v0.zip")[0], 404)

    def test_open_flag_only_targets_local_browser(self) -> None:
        with patch.object(serve.webbrowser, "open", return_value=True) as opened:
            self.assertTrue(serve.open_local_browser("0.0.0.0", 8024))
            opened.assert_called_once_with("http://127.0.0.1:8024/")
        with patch.object(serve.webbrowser, "open", return_value=True) as opened:
            self.assertFalse(serve.open_local_browser("192.0.2.7", 8024))
            opened.assert_not_called()

    def test_package_closure_and_portable_manifest(self) -> None:
        source = self.root / "source"
        source.mkdir()
        shutil.copy2(Path(serve.__file__), source / "serve.py")
        shutil.copy2(Path(serve.__file__).with_name("ash_game.py"), source / "ash_game.py")
        source_engine = Path(serve.__file__).resolve().parent.parent / "engine"
        fixture_engine = self.root / "engine"
        shutil.copytree(source_engine, fixture_engine, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        for name in package.APP_FILES:
            (source / name).parent.mkdir(parents=True, exist_ok=True)
            (source / name).write_text(f"fixture {name}\n", encoding="utf-8")
        (source / 'shared_round.py').write_text('# shared-round fixture\n', encoding='utf-8')
        (source / "DESIGN_BRIEF.md").write_text("assets at /mnt/seagate/models/pyrocene/stage4/\n", encoding="utf-8")
        vendor = source / "vendor"
        vendor.mkdir()
        for name in package.VENDOR_FILES:
            shutil.copy2(self.vendor / name, vendor / name)
        output = self.root / "build" / "stage4.zip"
        result = package.build_package(output, self.assets, source_root=source)
        self.assertEqual(result, output.resolve())
        with zipfile.ZipFile(output) as archive:
            names = set(archive.namelist())
            for name in package.APP_FILES:
                self.assertIn(f"stage4/{name}", names)
            self.assertIn("stage4/serve.py", names)
            self.assertIn("stage4/ash_game.py", names)
            self.assertIn('stage4/shared_round.py', names)
            for name in package.ENGINE_FILES:
                self.assertIn(f"engine/{name}", names)
            self.assertIn("stage4/vendor/three.min.js", names)
            self.assertIn("stage4/assets/forest.bin", names)
            self.assertIn("README.md", names)
            self.assertIn("run.sh", names)
            self.assertIn("run.command", names)
            self.assertIn("run.bat", names)
            self.assertIn("docs/DESIGN_BRIEF.md", names)
            self.assertIn(b"SCRIPT_DIR", archive.read("run.sh"))
            self.assertIn(b"%~dp0", archive.read("run.bat"))
            self.assertIn(b"stage4/assets/", archive.read("docs/DESIGN_BRIEF.md"))
            self.assertNotIn(b"/mnt/seagate", archive.read("docs/DESIGN_BRIEF.md"))
            for name in names:
                self.assertIsNotNone(archive.read(name))
            manifest = json.loads(archive.read("stage4/assets/manifest.json"))
            self.assertNotIn("/mnt/seagate", json.dumps(manifest))


if __name__ == "__main__":
    unittest.main()
