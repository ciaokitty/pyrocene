"""Audit strategy-player transcripts by replaying their permitted commands.

The transcript is untrusted model output.  This script extracts only exact
``node stage4/strategy-play.mjs SEED remove:COORD ...`` calls, selects the last
valid full trace, replays it through the public CLI, and records the engine's
actual JSON/counters.  It never executes a command from the transcript.
"""

from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ENGINE = "stage4/strategy-play.mjs"
OUT = Path("/mnt/seagate/models/pyrocene/stage4/qa-expedition/strategy-players")
TOKEN = re.compile(r"(?:(?:remove|restore|study):[A-Za-z0-9_-]+|wait)$")

# Replay through the model's public replay/observe API and emit a compact JSON
# result. This is independent of the player's prose and of the CLI's display
# text, while preserving the exact same deterministic game implementation.
REPLAY_SCRIPT = r'''
import {newGame, act, studyPlot, metrics, ledger} from './stage4/strategy-model.mjs';
const input = JSON.parse(process.argv[1]);
try {
  const game = newGame(input.seed);
  for (const token of input.tokens) {
    const [verb, id = null] = token.split(':');
    if (verb === 'study') studyPlot(game, id);
    else act(game, verb, id);
  }
  const m = metrics(game);
  console.log(JSON.stringify({metrics:m, ledger:ledger(game), ledgerHistory:game.ledgerHistory,
    moves:game.moves, burnedRecords:game.burnedRecords}));
} catch (error) {
  console.log(JSON.stringify({error:String(error?.message || error)}));
  process.exitCode = 2;
}
'''


def tool_commands(path: Path):
    """Yield shell command strings from Claude and Cursor stream JSONL."""
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return
    for line in lines:
        try:
            record = json.loads(line)
        except (TypeError, ValueError):
            continue
        # Claude tool blocks.
        for block in record.get("message", {}).get("content", []) or []:
            if isinstance(block, dict) and block.get("type") == "tool_use":
                command = block.get("input", {}).get("command")
                if isinstance(command, str):
                    yield command
        # Cursor shellToolCall blocks.
        call = record.get("tool_call", {})
        args = call.get("shellToolCall", {}).get("args", {}) if isinstance(call, dict) else {}
        command = args.get("command") if isinstance(args, dict) else None
        if isinstance(command, str):
            yield command
        # A few CLI versions emit the command in a generic tool-call input.
        if record.get("type") == "tool_call":
            command = record.get("input", {}).get("command")
            if isinstance(command, str):
                yield command


def parse(command: str):
    try:
        parts = shlex.split(command)
    except ValueError:
        return None
    if len(parts) < 2 or parts[:2] != ["node", ENGINE]:
        return None
    if len(parts) < 3 or not parts[2].isdigit():
        return None
    seed = int(parts[2])
    tokens = parts[3:]
    if any(not TOKEN.fullmatch(token) for token in tokens):
        return None
    return {"seed": seed, "tokens": tokens}


def last_valid(path: Path):
    calls = [parse(command) for command in tool_commands(path)]
    valid = [call for call in calls if call is not None]
    return valid[-1] if valid else None, len(calls), len(calls) - len(valid)


def json_objects(text: str):
    """Find JSON objects in noisy CLI output without retaining model prose."""
    decoder = json.JSONDecoder()
    index = 0
    while index < len(text):
        start = text.find("{", index)
        if start < 0:
            return
        try:
            obj, end = decoder.raw_decode(text, start)
        except ValueError:
            index = start + 1
            continue
        index = end
        if isinstance(obj, dict):
            yield obj


def replay(trace: dict):
    command = ["node", "--input-type=module", "-e", REPLAY_SCRIPT,
               json.dumps(trace)]
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True,
                            timeout=90, check=False)
    objects = list(json_objects(result.stdout or ""))
    # The replay API's structured object is authoritative. Keep no engine
    # prose or stderr that could include environment details.
    final = objects[-1] if objects else None
    return {
        "replay_exit": result.returncode,
        "actual": final,
        "replay_json_lines": len(objects),
        "replay_error": "no JSON result" if final is None else None,
    }


def audit(path: Path):
    trace, calls, rejected = last_valid(path)
    item = {"file": path.name, "calls_seen": calls,
            "unrecognised_calls": rejected}
    if trace is None:
        item["error"] = "No permitted strategy game command found."
        return item
    item.update(trace)
    item["engine_moves"] = sum(token == "wait" or ":" in token and not token.startswith("study:")
                               for token in trace["tokens"])
    item["study_moves"] = sum(token.startswith("study:") for token in trace["tokens"])
    item["bound_ok"] = item["engine_moves"] <= 24 and calls <= 80
    try:
        item.update(replay(trace))
    except subprocess.TimeoutExpired:
        item.update({"replay_exit": None, "actual": None,
                     "replay_json_lines": 0, "replay_error": "replay timeout"})
    return item


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", help="JSONL transcripts")
    parser.add_argument("--report", type=Path,
                        help="also write the sanitized JSONL report to this path")
    args = parser.parse_args()
    paths = [Path(path) for path in args.paths] if args.paths else sorted(OUT.glob("*.jsonl"))
    rows = [audit(path) for path in paths]
    output = "".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)
    if args.report:
        args.report.write_text(output, encoding="utf-8")
    print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
