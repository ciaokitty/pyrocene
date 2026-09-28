# Putting the terminal game in a browser without changing it

The single-player game is a Python terminal program: an engine with no I/O, and
a renderer that emits ANSI escapes. We wanted it on a URL for the event, without
forking the code into a web version that would then drift.

It works, and the thing that made it work is that the game is boring in the
right ways. No dependencies outside the standard library. The main loop is
`print()` and `input()`. The only exotic code, raw-mode keyboard handling with
`termios`, sits in a dormant branch nothing reaches.

So: Pyodide runs the unmodified Python in a web worker, xterm.js renders the
ANSI, and a `SharedArrayBuffer` lets `input()` genuinely block. Nothing under
`engine/` or `terminal/` changed. All the browser-specific code lives in
`web/boot.py`, about forty lines that stub `termios`, force colour on (the game
gates colour on `isatty`), and hand control to `main()`.

## Two things that cost an afternoon

**`pyodide.setStdin({stdin: fn})` silently kills stdout.** The obvious API
routes through Pyodide's `LegacyReader`, and after the first read every
subsequent write vanishes. The menu appeared, you typed, and then the game ran
on invisibly with a blank screen. The lower-level `read(buffer)` interface has
no such problem. This took a while precisely because nothing errored.

**A CSS rule beat the `hidden` attribute.** Our loading overlay set
`display:flex`, which outranks the user agent's `[hidden]` rule, so a "Cannot
start" panel sat on top of a perfectly working game. Worth remembering as a
class of bug: a page that looks broken while being fine.

`SharedArrayBuffer` needs cross-origin isolation, so the deploy carries
COOP/COEP headers. That makes the page uncooperative with third-party embeds,
which is fine for a standalone game and would not be for a widget.

## Evidence

- [browser bootstrap](web/boot.py)
- [the worker, including the stdin note](web/worker.js)
- [build script and headers](web/build.sh)
