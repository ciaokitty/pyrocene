#!/usr/bin/env python3
"""Build a self-contained ZIP for the offline Stage 4 installation.

The resulting archive has a small, predictable layout::

    stage4/{serve.py,index.html,app.mjs,render.mjs,model.mjs,style.css}
    stage4/assets/*
    stage4/vendor/{three.min.js,THREE-LICENSE.txt}
    README.md, run.sh, run.command, run.bat

Only Python 3's standard library is needed on the event machine.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import stat
import tempfile
import zipfile
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Iterable


APP_FILES = ("index.html", "mission.html", "app.mjs", "render.mjs", "model.mjs", "style.css", "explore.html", "explore.mjs", "explore-render.mjs", "explore-state.mjs", "explore.css", "species.json", "plant-images.json", "dialogue.json", "lia-v2.png")
VENDOR_FILES = ("three.min.js", "THREE-LICENSE.txt")
APP_FILES += ("field-network.mjs", "living-landscape.mjs")
APP_FILES += ('field-media.mjs',)
APP_FILES += ('observation-layers.mjs',)
APP_FILES += ('forest-neighbourhood.mjs',)
APP_FILES += ('forest-flora.mjs', 'inventory-trees.mjs', 'forest-structure.mjs')
APP_FILES += ('structure-model.mjs', 'structure-lab.mjs', 'structure-lab.css')
APP_FILES += ('round.html', 'round.css', 'round.mjs', 'round-render.mjs', 'round-model.mjs', 'round-config.json')
APP_FILES += ('policy.html', 'policy.css', 'policy.mjs', 'policy-render.mjs', 'policy-model.mjs', 'policy-copy.mjs', 'policy-config.json', 'policy-bots.mjs')
APP_FILES += ('ledger.html', 'ledger.css', 'ledger.mjs', 'ledger-render.mjs', 'ledger-model.mjs')
APP_FILES += ('prelude/index.html', 'prelude/prelude.css', 'prelude/prelude.mjs', 'prelude/board.mjs')
APP_FILES += ('play-flow.mjs', 'play-flow.css', 'play-briefing.mjs', 'hazel.png')
APP_FILES += ('neglect-model.mjs',)
APP_FILES += ('seed-study.mjs', 'seed-model.mjs', 'fire-landscape.mjs', 'canopy-grid.json')
APP_FILES += ('species-record.mjs', 'species-record.css')
APP_FILES += ('strategy.html', 'strategy.css', 'strategy.mjs', 'strategy-model.mjs', 'strategy-render.mjs')
APP_FILES += ("expedition.html", "expedition.mjs", "expedition.css", "expedition-state.mjs", "expedition-render.mjs", "world.mjs", "field-catalogue.json", "field-photos.json", "memory.html", "memory.css", "memory.mjs", "memory-model.mjs")
APP_FILES += ("ash.html", "ash.mjs", "ash.css", "ash-render.mjs", "lia-v1.png")
ENGINE_FILES = ("__init__.py", "model.py", "content.py", "rules.py", "engine.py")
DOC_NAMES = (
    "STRATEGY.md",
    "SEEDS_AND_SCAR.md",
    "WORKING_LOOP.md",
    "REINFESTATION_DISCUSSION.md",
    "NEGLIGENCE.md",
    "SHARED_ROUND.md",
    "REFERENCE_LAYERS.md",
    "INLINE_DETAIL.md",
    "FOREST_FLORA.md",
    "STRUCTURE_LAB.md",
    "ASH.md",
    "ASH_BALANCE.md",
    "ASH_PLAYTEST.md",
    "ASH_VISUALS.md",
    "LIVING_LANDSCAPE.md",
    "EXPEDITION.md",
    "PLAYTEST_NOTES.md",
    "MEMORY_LAB.md",
    "HUMAN_SOURCES.md",
    "TLS_EXPANSION.md",
    "EXPLORATION.md",
    "ART_NOTES.md",
    "DESIGN_BRIEF.md",
    "HISTORICAL_EVIDENCE.md",
    "README.md",
    "MODEL_ASSUMPTIONS.md",
    "FACILITATOR.md",
    "LEDGER.md",
    "prelude/README.md",
    "model_assumptions.md",
    "v0_data.md",
)
REQUIRED_ASSETS = (
    "ash-cinematic-forest.png",
    "ash-cinematic-fire.png",
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
)
DEFAULT_ASSETS = Path("/mnt/seagate/models/pyrocene/stage4/assets")
REQUIRED_ASSETS += ('forest-fragments.json', 'forest-fragment-wood.bin')
REQUIRED_ASSETS += ("tls-expanded.json",) + tuple(
    f"tls-expanded-{crop}.bin" for crop in ["fg6c2-a", "fg6c2-b", "fg6c2-c", "fg6c2-d", "fg5c1-a", "fg5c1-b", "fg5c1-c", "fg5c1-d", "nou11-435", "nou11-437", "nou11-449"]
) + tuple(f"field-{taxon}.jpg" for taxon in ["urochloa_decumbens", "bertholletia_excelsa", "euterpe_oleracea", "mauritia_flexuosa", "hevea_brasiliensis", "theobroma_grandiflorum", "manihot_esculenta", "carapa_guianensis", "copaifera_reticulata", "paullinia_cupana", "bactris_gasipaes", "astrocaryum_vulgare"])


class PackageError(RuntimeError):
    """An input is incomplete or does not satisfy the asset contract."""


def _file(path: Path, label: str) -> Path:
    try:
        resolved = path.resolve(strict=True)
    except (OSError, RuntimeError) as exc:
        raise PackageError(f"missing {label}: {path}") from exc
    if not resolved.is_file():
        raise PackageError(f"{label} is not a regular file: {path}")
    return resolved


def _safe_asset_name(name: str) -> str:
    path = PurePosixPath(name)
    if not name or path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise PackageError(f"unsafe asset path in manifest: {name!r}")
    return path.as_posix()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_assets(assets: Path) -> tuple[Path, dict]:
    """Validate the prepared asset directory and return its manifest."""

    root = _file(assets / "manifest.json", "asset manifest").parent
    try:
        manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise PackageError(f"invalid asset manifest: {root / 'manifest.json'}") from exc
    if not isinstance(manifest, dict) or not isinstance(manifest.get("outputs"), dict):
        raise PackageError("asset manifest must contain an outputs object")

    for name in REQUIRED_ASSETS:
        _file(root / name, f"required asset {name}")
    outputs = manifest["outputs"]
    for raw_name, metadata in outputs.items():
        name = _safe_asset_name(str(raw_name))
        actual = _file(root / name, f"manifest asset {name}")
        if not isinstance(metadata, dict):
            raise PackageError(f"manifest metadata for {name} is not an object")
        expected_bytes = metadata.get("bytes")
        if expected_bytes is not None and expected_bytes != actual.stat().st_size:
            raise PackageError(f"size mismatch for asset {name}: manifest says {expected_bytes}, found {actual.stat().st_size}")
        expected_hash = metadata.get("sha256")
        if expected_hash is not None and expected_hash != _sha256(actual):
            raise PackageError(f"sha256 mismatch for asset {name}")
    # Every prepared regular file is copied. This catches a future asset being
    # added without silently leaving it out of the portable archive.
    for path in root.rglob("*"):
        if path.is_symlink():
            raise PackageError(f"symlink in assets is not portable: {path.relative_to(root)}")
        if path.is_file():
            _safe_asset_name(path.relative_to(root).as_posix())
    return root, manifest


def _portable_manifest(manifest: dict) -> dict:
    result = copy.deepcopy(manifest)
    for source in result.get("sources", []):
        if isinstance(source, dict) and isinstance(source.get("file"), str):
            # Source preparation happened on a workstation. A package should
            # retain provenance without leaking that machine's private path.
            raw = source["file"]
            source["file"] = PureWindowsPath(raw).name if "\\" in raw else Path(raw).name
    return result


def _scrub_paths(value):
    """Replace workstation-only absolute paths in optional JSON evidence."""

    if isinstance(value, dict):
        return {key: _scrub_paths(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_scrub_paths(item) for item in value]
    if isinstance(value, str) and value.startswith("/mnt/"):
        return "external-source/" + Path(value).name
    return value


def _portable_asset_bytes(path: Path, relative: str) -> bytes:
    raw = path.read_bytes()
    if path.suffix.lower() != ".json":
        return raw
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return raw
    return (json.dumps(_scrub_paths(value), indent=2) + "\n").encode("utf-8")


README = """# Pyrocene Stage 4 / The Amazon (offline build)

The default restores the Amazon-learning expedition with Lia, the central
point-cloud map and Forest / Overhead / Close views. One laptop per team,
then one physical recollection map per team and the fire comparison.
No new turn rules have been added to this view.
Discovery is /explore.html, expedition is /expedition.html, and the paper lab
is /memory.html. Native ForeFire remains at /mission.html. The Ash experiment
is preserved separately at /ash.html.

This ZIP is a portable event build. It contains the prepared measured forest
returns, image layers, the local browser game, and a vendored Three.js runtime.
It does not contact a service or install Python packages.

## Run

Python 3 is required. From this extracted directory, run one of:

    ./run.sh                 # Linux / macOS (or: python3 -m stage4.serve)
    ./run.command            # macOS Finder/Terminal
    run.bat                  # Windows (uses the `py -3` launcher)

Then open http://127.0.0.1:8024/ on the same laptop. To share it on a trusted
private LAN, use `./run.sh --host 0.0.0.0`; the server still exposes only the
allow-listed game files, assets, and vendor files.

The readiness endpoint is http://127.0.0.1:8024/health. A successful response
has `{"ok":true,"assets":true,"app":true}`. The game is an educational training scenario:
fuel states, field reports, drought, ignition, crew actions and fire results
are simulated scenario data. The asset manifest contains acquisition dates,
source notes and the measured-data limitations.

No raw LAZ/HDF5 data is included. Keep the extracted directory together when
copying the build; do not open `index.html` directly because browsers block
the local module and binary requests without the server.

The `docs/` directory preserves the available design, evidence and model
assumption notes shipped with this build. They are documentation only and are
not HTTP routes.
"""

RUN_SH = """#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"
exec python3 -m stage4.serve "$@"
"""
RUN_COMMAND = RUN_SH
RUN_BAT = """@echo off
setlocal
cd /d "%~dp0"
py -3 -m stage4.serve %*
"""


def _vendor_root(source_root: Path) -> Path:
    bundled = source_root / "vendor"
    if bundled.is_dir():
        return bundled
    return source_root.parent / "stage2" / "simulation" / "codex" / "vendor"


def _documentation(source_root: Path) -> list[tuple[str, Path]]:
    """Find optional source notes without making a build depend on them."""

    found: list[tuple[str, Path]] = []
    for name in DOC_NAMES:
        path = source_root / name
        if path.is_file():
            found.append((name, path.resolve()))
    # The project README is useful context when stage4 has no own README.
    project_readme = source_root.parent / "README.md"
    if not (source_root / "README.md").is_file() and project_readme.is_file():
        found.append(("project-README.md", project_readme.resolve()))
    # Avoid duplicate names if a future source layout has aliases.
    return list(dict(found).items())


def _portable_doc(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    # Design notes may mention the workstation's generated-artifact location;
    # the portable build has its copy at stage4/assets instead.
    return text.replace("/mnt/seagate/models/pyrocene/stage4/", "stage4/assets/")


def _zip_text(zf: zipfile.ZipFile, name: str, content: str, executable: bool = False) -> None:
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    mode = 0o755 if executable else 0o644
    info.external_attr = (stat.S_IFREG | mode) << 16
    zf.writestr(info, content.encode("utf-8"))


def _zip_file(zf: zipfile.ZipFile, source: Path, name: str, executable: bool = False) -> None:
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    mode = 0o755 if executable else 0o644
    info.external_attr = (stat.S_IFREG | mode) << 16
    with source.open("rb") as stream:
        zf.writestr(info, stream.read())


def _zip_bytes(zf: zipfile.ZipFile, content: bytes, name: str, executable: bool = False) -> None:
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    mode = 0o755 if executable else 0o644
    info.external_attr = (stat.S_IFREG | mode) << 16
    zf.writestr(info, content)


def build_package(output: Path, assets: Path = DEFAULT_ASSETS, *, source_root: Path | None = None) -> Path:
    """Build *output*, raising PackageError instead of producing a partial ZIP."""

    source = (source_root or Path(__file__).resolve().parent).resolve()
    app_paths = {name: _file(source / name, f"app file {name}") for name in APP_FILES}
    serve = _file(source / "serve.py", "server")
    ash_game = _file(source / "ash_game.py", "Ash server game")
    shared_round = _file(source / "shared_round.py", "shared round server")
    engine_root = source.parent / "engine"
    engine_paths = {name: _file(engine_root / name, f"Ash engine file {name}") for name in ENGINE_FILES}
    vendor = _vendor_root(source)
    vendor_paths = {name: _file(vendor / name, f"vendor file {name}") for name in VENDOR_FILES}
    asset_root, manifest = validate_assets(assets.expanduser())
    portable_manifest = _portable_manifest(manifest)
    output = output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    # Write atomically so a failed build never leaves an apparently complete
    # but truncated archive at the requested destination.
    fd, temporary = tempfile.mkstemp(prefix=output.name + ".", suffix=".tmp", dir=output.parent)
    os.close(fd)
    temporary_path = Path(temporary)
    try:
        with zipfile.ZipFile(temporary_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            _zip_file(zf, serve, "stage4/serve.py")
            _zip_file(zf, ash_game, "stage4/ash_game.py")
            _zip_file(zf, shared_round, "stage4/shared_round.py")
            for name, path in app_paths.items():
                _zip_file(zf, path, f"stage4/{name}")
            for name, path in engine_paths.items():
                _zip_file(zf, path, f"engine/{name}")
            for name, path in vendor_paths.items():
                _zip_file(zf, path, f"stage4/vendor/{name}")
            for path in sorted(asset_root.rglob("*")):
                if path.is_file():
                    relative = path.relative_to(asset_root).as_posix()
                    if relative == "manifest.json":
                        _zip_text(zf, "stage4/assets/manifest.json", json.dumps(portable_manifest, indent=2) + "\n")
                    else:
                        content = _portable_asset_bytes(path, relative)
                        if relative in portable_manifest.get("outputs", {}):
                            portable_manifest["outputs"][relative]["bytes"] = len(content)
                            portable_manifest["outputs"][relative]["sha256"] = hashlib.sha256(content).hexdigest()
                        _zip_bytes(zf, content, f"stage4/assets/{relative}")
            for name, path in _documentation(source):
                _zip_text(zf, f"docs/{name}", _portable_doc(path))
            _zip_text(zf, "README.md", README)
            _zip_text(zf, "run.sh", RUN_SH, executable=True)
            _zip_text(zf, "run.command", RUN_COMMAND, executable=True)
            _zip_text(zf, "run.bat", RUN_BAT)
        os.replace(temporary_path, output)
    except Exception:
        try:
            temporary_path.unlink()
        except FileNotFoundError:
            pass
        raise
    return output


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the portable Pyrocene Stage 4 ZIP")
    parser.add_argument("--output", type=Path, default=Path("/mnt/seagate/models/pyrocene/stage4/pyrocene-stage4-v0.zip"))
    parser.add_argument("--assets", type=Path, default=DEFAULT_ASSETS)
    parser.add_argument("--source-root", type=Path, default=Path(__file__).resolve().parent, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    try:
        result = build_package(args.output, args.assets, source_root=args.source_root)
    except PackageError as exc:
        parser.error(str(exc))
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
