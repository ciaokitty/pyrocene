#!/usr/bin/env python3
"""Assemble the frozen LiDAR film and seamless spectral continuation."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


JOIN_OFFSET = 55.6
JOIN_DURATION = 0.4


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def assemble(args: argparse.Namespace) -> Path:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    filter_graph = (
        "[0:v]setpts=PTS-STARTPTS[first];"
        "[1:v]scale=1920:1080:flags=lanczos,setpts=PTS-STARTPTS[second];"
        f"[first][second]xfade=transition=dissolve:duration={JOIN_DURATION}:"
        f"offset={JOIN_OFFSET},format=yuv420p[out]"
    )
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(args.lidar), "-i", str(args.spectral),
        "-filter_complex", filter_graph, "-map", "[out]", "-an",
        "-c:v", args.encoder,
    ]
    command += (["-preset", "p5", "-cq", "18", "-b:v", "0"]
                if args.encoder == "h264_nvenc"
                else ["-preset", "slow", "-crf", "17"])
    command += ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(args.output)]
    subprocess.run(command, check=True)

    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_name,width,height,avg_frame_rate,pix_fmt:format=duration,size",
        "-of", "json", str(args.output),
    ], check=True, capture_output=True, text=True)
    metadata = json.loads(probe.stdout)
    manifest = {
        "schema": "pyrocene-lidar-spectral-final/1",
        "output": str(args.output),
        "output_sha256": sha256(args.output),
        "probe": metadata,
        "audio": False,
        "join": {
            "offset_seconds": JOIN_OFFSET,
            "duration_seconds": JOIN_DURATION,
            "transition": "matched map dissolve",
            "camera_correction": "none required because both shots share the same bearing",
            "caption_handoff": (
                "the spectral sentence begins after the structure sentence has dissolved"
            ),
        },
        "inputs": {
            "frozen_lidar": {
                "path": str(args.lidar),
                "sha256": sha256(args.lidar),
            },
            "spectral_continuation": {
                "path": str(args.spectral),
                "sha256": sha256(args.spectral),
            },
            "assembler": {
                "path": str(Path(__file__).resolve()),
                "sha256": sha256(Path(__file__).resolve()),
            },
        },
    }
    args.output.with_suffix(".manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--lidar", type=Path, required=True)
    result.add_argument("--spectral", type=Path, required=True)
    result.add_argument("--output", type=Path, required=True)
    result.add_argument("--encoder", choices=("h264_nvenc", "libx264"),
                        default="h264_nvenc")
    return result


if __name__ == "__main__":
    print(assemble(parser().parse_args()))
