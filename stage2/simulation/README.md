# Post-game simulation and films

## Canonical event films

The Codex Linux event handoff is
[`codex/README.md`](codex/README.md). It selects two fixed films for reliable
laptop playback:

1. [Cinematic hybrid on port 8021](http://100.82.28.38:8021/) for the emotional
   bridge from the room's fire into a forest-scale reconstruction.
2. [Finding fuel corridors on port 8022](http://100.82.28.38:8022/) for
   the real-data explanation of how forest structure and composition can be
   observed.

The exact selected files, hashes, evidence boundaries, local paths and offline
playback advice are in the Codex README. The 8022 page opens with the canonical
88.125 second end-to-end evidence film. The 8021 page identifies the selected
22 second cinematic hybrid and retains the other visual studies for comparison.

The audience sequence is game replay, fire-model lab, cinematic hybrid, then
Finding fuel corridors. The lab tests the game board with a model. The
two films then move from emotional consequence to measured forest evidence.

## Browser replay implementations

A replay of the game that just finished, built from its event log. Two are being
written independently, one per folder, and the room server picks up whichever
folders exist.

```
stage2/simulation/
  claude/index.html     one replay
  codex/index.html      the other
  sample-game.json      a finished game to develop against, no server needed
  SPEC.md               the event log format, and the rules both must follow
```

Each folder is a self-contained static page. The server serves it at
`/simulation/<folder>/` and hands it the log at `/api/log`. Nothing in a folder
is imported by the game, and the game imports nothing from one.

After a game ends, the game master console shows a **Show animation** button for
each installed folder. It opens the page in a new tab with the log name in the
query string, which is what you put on the projector.

Open one directly while developing:

```
python3 -m stage2.server
# then http://localhost:8020/simulation/claude/?log=sample-game.json
```

Read `SPEC.md` before changing an event-log-driven browser replay. These browser
implementations are development and fallback tools. They are not the two
canonical event MP4s listed above.
