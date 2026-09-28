"""Run bounded, black-box lower-model strategy players.

The players can invoke only the public strategy-play CLI.  Their transcripts
are deliberately kept outside Git; audit_players.py extracts and replays the
actual game commands later.  This runner does not import the game engine.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = Path("/mnt/seagate/models/pyrocene/stage4/qa-expedition/strategy-players")
# /tmp permits a narrow symlink workspace on this host; the model logs remain
# on the requested external volume under OUT.
WORKSPACES = Path("/tmp/pyrocene-strategy-player-workspaces")
ENGINE = "stage4/strategy-play.mjs"
DEFAULT_CURSOR_MODEL = "gpt-5.4-mini-low"
PROFILES = ("rush", "one-at-a-time", "anchor")
MODEL_KINDS = ("claude", "cursor")


PROFILE_BRIEFS = {
    "rush": (
        "You are the Rush crew: clear and plant a new high-return frontier "
        "quickly, then care it through closure. Open another frontier only "
        "when the current one is clearly safe or finished; accept measured "
        "exposure while preserving enough credits to finish."
    ),
    "one-at-a-time": (
        "You are the One-at-a-time crew: remove and restore one coordinate "
        "through to a stable result before committing to another, unless the "
        "game evidence makes that impossible. Keep a cash reserve."
    ),
    "anchor": (
        "You are the Anchor-and-spread crew: begin at a coordinate beside the "
        "existing forest/anchor and extend from connected safe ground. Compare "
        "the shelter gained with the cost and fire exposure before spreading."
    ),
}


def redact(text: str) -> str:
    """Remove likely credentials or environment dumps from retained logs."""

    patterns = (
        (r"(?i)(authorization\s*[:=]\s*bearer\s+)[^\s,}\]]+", r"\1[REDACTED]"),
        (r"(?i)(\b(?:ANTHROPIC|CURSOR|OPENAI)_API_KEY\s*[=:]\s*)[^\s,}\]]+", r"\1[REDACTED]"),
        (r"(?i)(\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[=:]\s*)[^\s,}\]]+", r"\1[REDACTED]"),
    )
    for pattern, replacement in patterns:
        text = re.sub(pattern, replacement, text)
    return text


def text_or_empty(value) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value if isinstance(value, str) else ""


def prompt_for(profile: str, seed: int, lesson: str = "") -> str:
    extra = f"\nHuman-like hint after an earlier attempt:\n{lesson}\n" if lesson else ""
    return f"""Play a fictional forest restoration game as a lower-model player, NOT a developer.
{PROFILE_BRIEFS[profile]}

Your ONLY permitted shell command is:
  node {ENGINE} SEED [the complete trace]
The literal seed for this run is {seed}. You may use no other shell command, no
source/file reading, no package manager, no web, no edits, and no hidden-state
search. The game command must contain the seed followed by the FULL trace so
far; never omit earlier moves. A move token is remove:COORD, restore:COORD,
study:COORD, or wait. STUDY is a free inspection; WAIT advances six months
without a purchase. Do not invent flags or alternate command syntax. Choose
one next move from the result, then call the same command with that move
appended.

Play one decision at a time. Do not branch, forecast by trying many traces, or
search for a winning sequence. You have up to 80 CLI calls (studies are free)
and exactly 24 time-advancing actions maximum. Continue while status is
`playing` until either the engine reports 3 RESTORED canopies or you have used
24 time-advancing actions; `playing` is not a reason to stop early. A planting
is young canopy, NOT closure. The FINAL line's closed-canopy count includes
standing shelter forest and is NOT the objective counter. Look for an explicit
restored/closure event or restored-canopy counter before claiming success.
Use wait or careful remove on young plots to let growth resolve, and report a
real incomplete campaign honestly at action 24. Preserve the forest while
solvent and account for the cost of each removal/restoration. The objective is
learning and restoration with the least fire loss, not a claimed win.

At the end, reflect briefly on: (1) one confusing result or attention-fatigue
moment, (2) one decision changed by evidence, (3) one wasted or avoided cost,
and (4) the minimum helpful clue a human teammate should have received. Include
the exact final full token trace and printed counters/status. Never edit files.
{extra}
Start now with the permitted command for seed {seed} and no moves."""


def player_workspace(label: str, profile: str, kind: str, seed: int) -> Path:
    """Expose only a symlink to the public CLI in an external workspace."""
    name = re.sub(r"[^A-Za-z0-9_.-]+", "-", f"{label}-{profile}-{kind}-{seed}")
    workspace = WORKSPACES / name
    entry = workspace / ENGINE
    entry.parent.mkdir(parents=True, exist_ok=True)
    if not entry.exists():
        entry.symlink_to(ROOT / ENGINE)
    return workspace


def command_for(kind: str, prompt: str, cursor_model: str,
                workspace: Path) -> list[str]:
    if kind == "claude":
        return [
            "claude", "-p", "--model", "haiku", "--permission-mode", "dontAsk",
            "--permission-prompts", "none", "--no-session-persistence",
            "--allowedTools", f"Bash(node {ENGINE} *)", "--output-format",
            "stream-json", "--verbose", "--", prompt,
        ]
    # Cursor's sandbox cannot start on this host (AppArmor is unavailable).
    # Disable only that unavailable layer. The host rejects shell calls unless
    # force is set; the workspace is still narrow (only a symlink to the
    # public CLI), and the prompt forbids every command except the game call.
    return [
        "agent", "-p", "--model", cursor_model, "--output-format", "stream-json",
        "--sandbox", "disabled", "--workspace", str(workspace), "--trust", "--force", prompt,
    ]


def run_one(kind: str, profile: str, seed: int, label: str, lesson: str,
            cursor_model: str, timeout: int) -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    safe_label = re.sub(r"[^A-Za-z0-9_.-]+", "-", label)
    path = OUT / f"{safe_label}-{profile}-{kind}-{seed}.jsonl"
    env = os.environ.copy()
    # Do not expose unrelated local settings to a player subprocess.  The
    # CLIs use their own authenticated account/session; no agent command may
    # print or inspect this environment.
    env.pop("PYTHONINSPECT", None)
    workspace = player_workspace(label, profile, kind, seed)
    cmd = command_for(kind, prompt_for(profile, seed, lesson), cursor_model, workspace)
    try:
        result = subprocess.run(
            cmd, cwd=workspace, env=env, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, text=True, timeout=timeout,
            check=False,
        )
        output = redact(text_or_empty(result.stdout))
        path.write_text(output, encoding="utf-8")
        return {
            "profile": profile, "player": kind,
            "model": "haiku" if kind == "claude" else cursor_model,
            "seed": seed, "exit": result.returncode,
            "timed_out": False, "transcript": str(path),
        }
    except subprocess.TimeoutExpired as exc:
        output = redact(text_or_empty(exc.stdout))
        path.write_text(output, encoding="utf-8")
        return {
            "profile": profile, "player": kind,
            "model": "haiku" if kind == "claude" else cursor_model,
            "seed": seed, "exit": None,
            "timed_out": True, "transcript": str(path),
        }
    except OSError as exc:
        path.write_text(redact(f"runner error: {exc.__class__.__name__}: {exc}\n"),
                        encoding="utf-8")
        return {
            "profile": profile, "player": kind,
            "model": "haiku" if kind == "claude" else cursor_model,
            "seed": seed, "exit": None,
            "timed_out": False, "error": exc.__class__.__name__,
            "transcript": str(path),
        }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--label", default="baseline")
    parser.add_argument("--seed", type=int, default=314159,
                        help="same reproducible seed for every selected profile")
    parser.add_argument("--profiles", default=",".join(PROFILES),
                        help="comma-separated subset of rush,one-at-a-time,anchor")
    parser.add_argument("--players", default="claude,cursor",
                        help="comma-separated subset of claude,cursor")
    parser.add_argument("--lesson", default="",
                        help="optional single human-like hint for retry trials")
    parser.add_argument("--cursor-model", default=DEFAULT_CURSOR_MODEL)
    parser.add_argument("--timeout", type=int, default=1200,
                        help="per-player wall-clock timeout in seconds")
    args = parser.parse_args()
    profiles = [p.strip() for p in args.profiles.split(",") if p.strip()]
    players = [p.strip() for p in args.players.split(",") if p.strip()]
    bad_profiles = [p for p in profiles if p not in PROFILES]
    bad_players = [p for p in players if p not in MODEL_KINDS]
    if bad_profiles or bad_players or not profiles or not players:
        parser.error(f"unknown profiles={bad_profiles} players={bad_players}")
    # Two concurrent model sessions is intentional: it limits account and
    # machine pressure while keeping the trial reasonably quick.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(run_one, kind, profile, args.seed, args.label,
                                args.lesson, args.cursor_model, args.timeout)
                   for profile, kind in [(p, k) for p in profiles for k in players]]
        for future in futures:
            print(json.dumps(future.result(), sort_keys=True), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
