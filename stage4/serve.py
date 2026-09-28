#!/usr/bin/env python3
"""Small, dependency-free HTTP server for the Stage 4 offline game.

The server deliberately exposes an allow-list rather than the whole checkout.
This is useful both for an event laptop and when the server is bound to a LAN
address: only the game shell, its prepared assets, and the two vendored Three
files can be requested.
"""

from __future__ import annotations

import argparse
from collections import OrderedDict
import json
import logging
import mimetypes
import os
import ipaddress
import webbrowser
import secrets
import sys
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urlsplit

try:  # Support both `python -m stage4.serve` and `python stage4/serve.py`.
    from .ash_game import AshGame
    from .shared_round import RoundStore, RoundError
except ImportError:  # pragma: no cover - exercised by portable script mode.
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from ash_game import AshGame
    from shared_round import RoundStore, RoundError


LOG = logging.getLogger("pyrocene.stage4")
MODULE_DIR = Path(__file__).resolve().parent
EXTERNAL_ASSETS = Path("/mnt/seagate/models/pyrocene/stage4/assets")
APP_FILES = frozenset({"index.html", "mission.html", "app.mjs", "render.mjs", "model.mjs", "style.css", "explore.html", "explore.mjs", "explore-render.mjs", "explore-state.mjs", "explore.css", "species.json", "plant-images.json", "dialogue.json", "lia-v2.png"})
VENDOR_FILES = frozenset({"three.min.js", "THREE-LICENSE.txt"})
APP_FILES = APP_FILES | {"field-network.mjs", "living-landscape.mjs"}
APP_FILES |= {'field-media.mjs'}
APP_FILES |= {'observation-layers.mjs'}
APP_FILES |= {'forest-neighbourhood.mjs'}
APP_FILES |= {'forest-flora.mjs', 'inventory-trees.mjs', 'forest-structure.mjs'}
APP_FILES |= {'structure-model.mjs', 'structure-lab.mjs', 'structure-lab.css'}
APP_FILES |= {'round.html', 'round.css', 'round.mjs', 'round-render.mjs', 'round-model.mjs', 'round-config.json'}
APP_FILES |= {'policy.html', 'policy.css', 'policy.mjs', 'policy-render.mjs', 'policy-model.mjs', 'policy-copy.mjs', 'policy-config.json', 'policy-bots.mjs'}
APP_FILES |= {'ledger.html', 'ledger.css', 'ledger.mjs', 'ledger-render.mjs', 'ledger-model.mjs'}
APP_FILES |= {'prelude/index.html', 'prelude/prelude.css', 'prelude/prelude.mjs', 'prelude/board.mjs'}
APP_FILES |= {'play-flow.mjs', 'play-flow.css', 'play-briefing.mjs', 'hazel.png'}
APP_FILES |= {'neglect-model.mjs'}
APP_FILES |= {'seed-study.mjs', 'seed-model.mjs', 'fire-landscape.mjs', 'canopy-grid.json'}
APP_FILES |= {'species-record.mjs', 'species-record.css'}
APP_FILES |= {'strategy.html', 'strategy.css', 'strategy.mjs', 'strategy-model.mjs', 'strategy-render.mjs'}
APP_FILES = APP_FILES | {"expedition.html", "expedition.mjs", "expedition.css", "expedition-state.mjs", "expedition-render.mjs", "world.mjs", "field-catalogue.json", "field-photos.json", "memory.html", "memory.css", "memory.mjs", "memory-model.mjs"}
APP_FILES = APP_FILES | {"ash.html", "ash.mjs", "ash.css", "ash-render.mjs", "lia-v1.png"}
REQUIRED_ASSETS = frozenset(
    {
        "manifest.json",
        "forest.bin",
        "forest-low.bin",
        "forest-overhead.jpg",
        "emit.png",
        "emit-selected.png",
        "fine.png",
        "sentinel.png",
        "tls-manifest.json",
        "tls-fg6c2-dense.bin",
        "tls-fg5c1-open.bin",
        "plant-urochloa_brizantha.jpg",
        "plant-megathyrsus_maximus.jpg",
        "plant-cecropia_obtusa.jpg",
        "plant-phenakospermum_guyannense.jpg",
        "plant-oenocarpus_bacaba.jpg",
        "plant-nephrolepis_biserrata.jpg",
    }
)
EXPEDITION_ASSETS = {"tls-expanded.json"} | {
    f"tls-expanded-{crop}.bin" for crop in ["fg6c2-a", "fg6c2-b", "fg6c2-c", "fg6c2-d", "fg5c1-a", "fg5c1-b", "fg5c1-c", "fg5c1-d", "nou11-435", "nou11-437", "nou11-449"]
} | {f"field-{taxon}.jpg" for taxon in ["urochloa_decumbens", "bertholletia_excelsa", "euterpe_oleracea", "mauritia_flexuosa", "hevea_brasiliensis", "theobroma_grandiflorum", "manihot_esculenta", "carapa_guianensis", "copaifera_reticulata", "paullinia_cupana", "bactris_gasipaes", "astrocaryum_vulgare"]}
REQUIRED_ASSETS = REQUIRED_ASSETS | EXPEDITION_ASSETS
REQUIRED_ASSETS |= {'forest-fragments.json', 'forest-fragment-wood.bin'}
REQUIRED_ASSETS = REQUIRED_ASSETS | {"ash-cinematic-forest.png", "ash-cinematic-fire.png"}
SERVED_ASSETS = REQUIRED_ASSETS | {"history.json", "forefire-bank.json", "forefire-reference.json", "tls-manifest.json", "tls-fg6c2-dense.bin", "tls-fg5c1-open.bin"}
SERVED_ASSETS |= {'observations.json', 'reference-piha.ogg', 'reference-piha.jpg', 'reference-tapirus-terrestris.jpg', 'reference-panthera-onca-1049.jpg', 'reference-tayassu-pecari-8.jpg'}

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".bin": "application/octet-stream",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".txt": "text/plain; charset=utf-8",
}


def default_assets_path() -> Path:
    """Return packaged assets when present, otherwise the prepared asset path."""

    configured = os.environ.get("PYROCENE_STAGE4_ASSETS")
    if configured:
        return Path(configured).expanduser()
    packaged = MODULE_DIR / "assets"
    if packaged.is_dir():
        return packaged
    return EXTERNAL_ASSETS


def _inside(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def _resolved_file(root: Path, relative: str) -> Path | None:
    """Resolve a requested relative name and reject escapes/special files."""

    try:
        candidate = (root / relative).resolve(strict=False)
        root_resolved = root.resolve(strict=True)
    except (OSError, RuntimeError):
        return None
    if not _inside(candidate, root_resolved):
        return None
    try:
        if not candidate.is_file():
            return None
    except OSError:
        return None
    return candidate


def asset_status(assets: Path) -> tuple[bool, list[str]]:
    """Check that the complete prepared asset contract is available."""

    missing: list[str] = []
    try:
        root = assets.resolve(strict=True)
    except (OSError, RuntimeError):
        return False, sorted(REQUIRED_ASSETS)
    if not root.is_dir():
        return False, sorted(REQUIRED_ASSETS)
    for name in sorted(REQUIRED_ASSETS):
        if _resolved_file(root, name) is None:
            missing.append(name)
    return not missing, missing


def app_status(app_root: Path) -> tuple[bool, list[str]]:
    """Check the browser shell and its explicitly supported vendor files."""

    missing = [name for name in sorted(APP_FILES) if _resolved_file(app_root, name) is None]
    vendor_root = _vendor_dir(app_root)
    missing.extend(
        f"vendor/{name}"
        for name in sorted(VENDOR_FILES)
        if _resolved_file(vendor_root, name) is None
    )
    return not missing, missing


def open_local_browser(host: str, port: int) -> bool:
    """Open the game only when the bind target is local to this machine."""

    stripped = host.strip("[]")
    try:
        address = ipaddress.ip_address(stripped)
        local = address.is_loopback or address.is_unspecified
    except ValueError:
        local = stripped.lower() in {"localhost", "ip6-localhost"}
    if not local:
        LOG.warning("--open only opens local hosts; not opening for --host %s", host)
        return False
    if stripped in {"0.0.0.0", "::"}:
        browser_host = "127.0.0.1"
    elif ":" in stripped:
        browser_host = f"[{stripped}]"
    else:
        browser_host = stripped
    url = f"http://{browser_host}:{port}/"
    if not webbrowser.open(url):
        LOG.warning("could not open browser at %s", url)
        return False
    return True


def _vendor_dir(app_root: Path) -> Path:
    packaged = app_root / "vendor"
    if packaged.is_dir():
        return packaged
    # In a source checkout the browser dependency lives with Stage 2.
    return app_root.parent / "stage2" / "simulation" / "codex" / "vendor"


class Stage4Handler(BaseHTTPRequestHandler):
    server_version = "PyroceneStage4/1"

    @property
    def stage_server(self) -> "Stage4Server":
        return self.server  # type: ignore[return-value]

    def _send_bytes(self, status: int, body: bytes, content_type: str, filename: str | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _error(self, status: int, message: str) -> None:
        body = (message + "\n").encode("utf-8")
        self._send_bytes(status, body, "text/plain; charset=utf-8")

    def _json(self, status: int, payload: dict) -> None:
        body = (json.dumps(payload, separators=(",", ":")) + "\n").encode("utf-8")
        self._send_bytes(status, body, "application/json; charset=utf-8")

    def _api_error(self, status: int, message: str) -> None:
        self._json(status, {"error": message})

    def _api_body(self) -> dict | None:
        content_type = self.headers.get("Content-Type", "")
        if not content_type.lower().startswith("application/json"):
            self._api_error(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "application/json content type is required")
            return None
        try:
            length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._api_error(HTTPStatus.BAD_REQUEST, "invalid content length")
            return None
        if length < 0 or length > 16 * 1024:
            self._api_error(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "request body is too large")
            return None
        try:
            value = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._api_error(HTTPStatus.BAD_REQUEST, "invalid JSON")
            return None
        if not isinstance(value, dict):
            self._api_error(HTTPStatus.BAD_REQUEST, "JSON body must be an object")
            return None
        return value

    def _same_origin(self) -> bool:
        origin = self.headers.get("Origin")
        if not origin:
            return True
        host = self.headers.get("Host", "")
        return bool(host) and origin == f"http://{host}"

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if urlsplit(self.path).path.startswith('/api/round/'):
            if not self._same_origin():
                self._api_error(HTTPStatus.FORBIDDEN, 'origin does not match this server')
                return
            body = self._api_body()
            if body is None:
                return
            try:
                result = self.stage_server.rounds.request(urlsplit(self.path).path[len('/api/round/'):], body)
                self._json(HTTPStatus.OK, result)
            except RoundError as exc:
                self._api_error(exc.status, str(exc))
            return
        if urlsplit(self.path).path.startswith("/api/ash/"):
            self._dispatch_ash()
            return
        self._error(HTTPStatus.NOT_FOUND, "not found")

    def _dispatch_ash(self) -> None:
        if not self._same_origin():
            self._api_error(HTTPStatus.FORBIDDEN, "origin does not match this server")
            return
        body = self._api_body()
        if body is None:
            return
        path = urlsplit(self.path).path
        try:
            if path == "/api/ash/new":
                seed = body.get("seed")
                if seed is not None and not isinstance(seed, (str, int, float, bool)):
                    raise ValueError("seed must be a simple value")
                token, view = self.stage_server.ash_new(seed)
                self._json(HTTPStatus.OK, {"session": token, **view})
                return
            if path == "/api/ash/command":
                token, command, expected = body.get("session"), body.get("command"), body.get("expectedTurn")
                if not isinstance(token, str) or not isinstance(command, str) or not command.strip() or len(command) > 80:
                    raise ValueError("session and one command of at most 80 characters are required")
                if not isinstance(expected, int):
                    raise ValueError("expectedTurn must be an integer")
                status, view = self.stage_server.ash_command(token, command, expected)
                if status == HTTPStatus.CONFLICT:
                    self._api_error(status, "stale expectedTurn")
                elif status == HTTPStatus.NOT_FOUND:
                    self._api_error(status, "unknown session")
                else:
                    self._json(status, {"session": token, **view})
                return
            if path == "/api/ash/resume":
                seed, commands = body.get("seed"), body.get("commands")
                if not isinstance(commands, list) or len(commands) > 50 or any(not isinstance(item, str) or not item.strip() or len(item) > 80 for item in commands):
                    raise ValueError("commands must be a list of at most 50 non-empty commands of at most 80 characters")
                token, view = self.stage_server.ash_resume(seed, commands)
                self._json(HTTPStatus.OK, {"session": token, **view})
                return
            self._api_error(HTTPStatus.NOT_FOUND, "not found")
        except (ValueError, TypeError) as exc:
            self._api_error(HTTPStatus.BAD_REQUEST, str(exc) or "invalid Ash request")
        except Exception:
            LOG.exception("Ash API failure")
            self._api_error(HTTPStatus.BAD_REQUEST, "Ash command could not be applied")

    def _path_parts(self) -> tuple[str, list[str]] | None:
        # urlsplit leaves the query out of path, and unquote handles encoded
        # separators/dot segments before the containment check below.
        raw_path = urlsplit(self.path).path
        decoded = unquote(raw_path)
        if "\x00" in decoded or "\\" in decoded:
            return None
        if not decoded.startswith("/"):
            return None
        pieces = decoded.split("/")
        return decoded, pieces

    def do_HEAD(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        self._dispatch()

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        self._dispatch()

    def _dispatch(self) -> None:
        parsed = self._path_parts()
        if parsed is None:
            self._error(HTTPStatus.NOT_FOUND, "not found")
            return
        decoded, pieces = parsed
        if decoded == "/download":
            # One explicit build artifact, never arbitrary files beside assets.
            name = "pyrocene-stage4-v0.zip"
            archive = self.stage_server.assets_root.parent / name
            target = _resolved_file(self.stage_server.assets_root.parent, name)
            if archive.is_symlink() or target is None:
                self._error(HTTPStatus.NOT_FOUND, "portable build is not installed on this server")
                return
            try:
                self._send_bytes(HTTPStatus.OK, target.read_bytes(), "application/zip", name)
            except OSError:
                self._error(HTTPStatus.INTERNAL_SERVER_ERROR, "unable to read portable build")
            return
        if decoded == "/health":
            assets_ready, missing_assets = asset_status(self.stage_server.assets_root)
            app_ready, missing_app = app_status(self.stage_server.app_root)
            ready = assets_ready and app_ready
            payload = {"ok": ready, "assets": assets_ready, "app": app_ready}
            if missing_assets:
                payload["missingAssets"] = missing_assets
            if missing_app:
                payload["missingApp"] = missing_app
            body = (json.dumps(payload, separators=(",", ":")) + "\n").encode()
            self._send_bytes(HTTPStatus.OK if ready else HTTPStatus.SERVICE_UNAVAILABLE, body, "application/json; charset=utf-8")
            return

        # Dot segments are never valid app names. For assets, the resolved
        # path check additionally protects against symlink escapes.
        if any(piece in {".", ".."} for piece in pieces):
            self._error(HTTPStatus.NOT_FOUND, "not found")
            return
        if decoded == "/":
            relative = "index.html"
            target = _resolved_file(self.stage_server.app_root, relative)
        elif decoded == "/prelude/":
            target = _resolved_file(self.stage_server.app_root, "prelude/index.html")
        elif decoded.startswith("/assets/"):
            relative = decoded[len("/assets/") :]
            if relative not in SERVED_ASSETS:
                target = None
            else:
                target = _resolved_file(self.stage_server.assets_root, relative)
        elif decoded.startswith("/vendor/") and "/" not in decoded[len("/vendor/") :]:
            name = decoded[len("/vendor/") :]
            target = _resolved_file(_vendor_dir(self.stage_server.app_root), name) if name in VENDOR_FILES else None
        else:
            name = decoded[1:]
            target = _resolved_file(self.stage_server.app_root, name) if name in APP_FILES else None
        if target is None:
            self._error(HTTPStatus.NOT_FOUND, "not found")
            return
        try:
            body = target.read_bytes()
        except OSError:
            LOG.exception("Unable to read %s", target)
            self._error(HTTPStatus.INTERNAL_SERVER_ERROR, "unable to read resource")
            return
        content_type = MIME_TYPES.get(target.suffix.lower(), mimetypes.guess_type(target.name)[0] or "application/octet-stream")
        self._send_bytes(HTTPStatus.OK, body, content_type)

    def log_message(self, fmt: str, *args: object) -> None:
        LOG.info("%s - %s", self.address_string(), fmt % args)


class Stage4Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, address: tuple[str, int], app_root: Path, assets_root: Path):
        self.app_root = app_root.resolve()
        self.assets_root = assets_root.expanduser()
        self._ash_lock = threading.RLock()
        self._ash_sessions: OrderedDict[str, AshGame] = OrderedDict()
        self.rounds = RoundStore()
        super().__init__(address, Stage4Handler)

    @staticmethod
    def _ash_view(game: AshGame) -> dict:
        view = game.view()
        if not isinstance(view, dict):
            raise ValueError("Ash game returned an invalid view")
        return view

    def _ash_store(self, game: AshGame) -> tuple[str, dict]:
        token = secrets.token_urlsafe(24)
        self._ash_sessions[token] = game
        self._ash_sessions.move_to_end(token)
        while len(self._ash_sessions) > 256:
            self._ash_sessions.popitem(last=False)
        return token, self._ash_view(game)

    def ash_new(self, seed: object = None) -> tuple[str, dict]:
        with self._ash_lock:
            return self._ash_store(AshGame(seed=seed))

    def ash_command(self, token: str, command: str, expected_turn: int) -> tuple[HTTPStatus, dict]:
        with self._ash_lock:
            game = self._ash_sessions.get(token)
            if game is None:
                return HTTPStatus.NOT_FOUND, {}
            current = self._ash_view(game)
            if current.get("night") != expected_turn:
                return HTTPStatus.CONFLICT, {}
            result = game.command(command)
            if not isinstance(result, dict):
                raise ValueError("Ash game returned an invalid command result")
            self._ash_sessions.move_to_end(token)
            return HTTPStatus.OK, result

    def ash_resume(self, seed: object, commands: list[str]) -> tuple[str, dict]:
        with self._ash_lock:
            game = AshGame(seed=seed)
            for command in commands:
                before = len(game.commands)
                result = game.command(command)
                if not isinstance(result, dict) or result.get("action") == "invalid" or len(game.commands) != before + 1:
                    raise ValueError("resume contains an invalid or non-advancing command")
            return self._ash_store(game)


def create_server(host: str = "127.0.0.1", port: int = 8024, *, app_root: Path | None = None, assets: Path | None = None) -> Stage4Server:
    return Stage4Server((host, port), app_root or MODULE_DIR, assets or default_assets_path())


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Serve the offline Pyrocene Stage 4 browser game")
    parser.add_argument("--host", default="127.0.0.1", help="bind address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8024, help="bind port (default: 8024)")
    parser.add_argument("--assets", type=Path, default=None, help=f"prepared assets directory (default: {EXTERNAL_ASSETS})")
    parser.add_argument("--open", action="store_true", help="open the local game URL in the default browser after binding")
    parser.add_argument("--check", "--check-only", action="store_true", dest="check", help="check app and assets, then exit")
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    args = _parser().parse_args(argv)
    app_root = MODULE_DIR
    assets = (args.assets or default_assets_path()).expanduser()
    app_ready, missing_app = app_status(app_root)
    ready, missing_assets = asset_status(assets)
    if args.check:
        if missing_app:
            LOG.error("missing app files: %s", ", ".join(missing_app))
        if missing_assets:
            LOG.error("missing assets: %s", ", ".join(missing_assets))
        if app_ready and ready:
            LOG.info("Stage 4 is ready")
            return 0
        return 1
    if missing_app:
        LOG.error("cannot start: missing app files: %s", ", ".join(missing_app))
        return 1
    try:
        server = create_server(args.host, args.port, app_root=app_root, assets=assets)
    except OSError as exc:
        LOG.error("cannot bind %s:%s: %s", args.host, args.port, exc)
        return 1
    LOG.info("Stage 4 at http://%s:%d/ (assets: %s)", args.host, args.port, assets)
    if args.open:
        open_local_browser(args.host, args.port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        LOG.info("stopping")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
