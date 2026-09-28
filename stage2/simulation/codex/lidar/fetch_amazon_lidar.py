#!/usr/bin/env python3
"""Selectively extract the four Central Amazon repeat-survey LAZ files.

The source deposit contains two ZIPs totalling about 70 GB.  Zenodo supports
HTTP byte ranges, so RemoteZip reads each central directory and transfers only
the four compressed members used by Pontes-Lopes et al. (2026).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import urllib.request
from pathlib import Path, PurePosixPath

from remotezip import RemoteZip


ARCHIVES = (
    {
        "url": "https://zenodo.org/records/7636454/files/transectos%20amazonas%20p1.zip?download=1",
        "bytes": 35_703_767_461,
        "md5": "fa579e92d01272a3cd669fae8f5dd7db",
    },
    {
        "url": "https://zenodo.org/records/7636454/files/transectos%20amazonas%20p2.zip?download=1",
        "bytes": 34_669_357_323,
        "md5": "175a5e6343abd374c84c84e472c54f57",
    },
)
WANTED_NUMBERS = {"0638", "0639", "1080", "1081"}


def line_number(filename: str) -> str | None:
    match = re.search(r"(?:^|[/_])(?:NP_)?T[-_](0638|0639|1080|1081)(?:\D|$)",
                      filename, flags=re.IGNORECASE)
    return match.group(1) if match else None


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def assert_suffix_range(url: str) -> None:
    request = urllib.request.Request(url, headers={"Range": "bytes=-1048576"})
    with urllib.request.urlopen(request, timeout=120) as response:
        if response.status != 206 or not response.headers.get("Content-Range"):
            raise RuntimeError(
                f"Archive did not honor a suffix range (HTTP {response.status}); "
                "aborting before a possible 35 GB transfer"
            )
        response.read(4)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("/mnt/seagate/videos/pyrocene/data/central-amazon-fire/raw"),
    )
    parser.add_argument("--skip-range-smoke-test", action="store_true")
    parser.add_argument(
        "--allow-missing", action="store_true",
        help="write a partial manifest instead of failing if the public ZIP lacks a requested line",
    )
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    found: dict[str, dict] = {}
    for archive in ARCHIVES:
        url = archive["url"]
        if not args.skip_range_smoke_test:
            print(f"Checking byte-range support: {url}", flush=True)
            assert_suffix_range(url)
        print(f"Reading remote ZIP index: {url}", flush=True)
        with RemoteZip(url, initial_buffer_size=1024 * 1024,
                       support_suffix_range=True) as remote:
            for info in remote.infolist():
                number = line_number(info.filename)
                if number is None or number in found:
                    continue
                final_path = args.output / PurePosixPath(info.filename).name
                partial_path = final_path.with_suffix(final_path.suffix + ".part")
                print(
                    f"Extracting {info.filename}: {info.file_size:,} bytes "
                    f"({info.compress_size:,} compressed)", flush=True,
                )
                with remote.open(info) as source, partial_path.open("wb") as destination:
                    shutil.copyfileobj(source, destination, 8 * 1024 * 1024)
                partial_path.replace(final_path)
                found[number] = {
                    "path": str(final_path.resolve()),
                    "bytes": final_path.stat().st_size,
                    "sha256": sha256(final_path),
                    "archive_url": url,
                    "archive_member": info.filename,
                }

    missing = WANTED_NUMBERS - set(found)
    if missing and not args.allow_missing:
        raise FileNotFoundError(f"The source ZIPs did not contain: {sorted(missing)}")
    manifest = {
        "schema": "pyrocene-eba-selective-extract/1",
        "dataset": "EBA L1A Brazilian Amazon airborne LiDAR",
        "doi": "10.5281/zenodo.7636454",
        "license": "CC BY 4.0",
        "method": "HTTP range extraction; parent ZIPs were not downloaded in full",
        "source_archives": ARCHIVES,
        "files": found,
        "missing_lines": sorted(missing),
    }
    manifest_path = args.output / "selected-lines.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(manifest_path)


if __name__ == "__main__":
    main()
