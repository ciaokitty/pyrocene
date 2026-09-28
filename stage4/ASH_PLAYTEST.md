# Ash play and iteration, 17 September 2026

## Later visual correction

The first Ash interface copied too much of the terminal board. The corrected
default opens on the existing cinematic forest plate, fades to the original
untiled airborne scan with Sat, and selects square patches on the forest by
mouse. Drone directly opens TLS. The board and command input start hidden.

A complete mouse-only route selected D4, I4 and B8 on the rendered landscape
and scanned, cleared and restored each patch. It won on night 10 at 87 percent
native cover and 79 percent wildlife. No command was typed and no minimap was
opened. The first removal saved native cover in six seedling patches and left
one bare patch to restore. This route is now a browser regression test.

Opening, airborne, selection and TLS screenshots were inspected. The old
repeated canopy tiles and grid were removed. The full original airborne swath
is preserved. The TLS colour was softened toward the film's mint palette.
Playing with optional typing open found a footer intercepting the Plants
button; the legend was moved and the footer's click area narrowed.
An immediate click after Back also exposed a stale camera transform. Camera
snaps now update picking immediately. A final visual pass brought the TLS
camera closer so stems and low vegetation occupy the screen, rather than
presenting a distant narrow column. Scroll still allows a wider structural view.

This is a visual correction, not a new balance pass. The rules below remain.
See `ASH_VISUALS.md` for the distinction between cinematic imagery and measured
geometry. Agent play does not establish human enjoyment.

## What was played

The original terminal Stage 3 was played before rebuilding the interface.
Seed 42's apparently healthy start deteriorated when left alone. On seed 7,
level 2, the sequence included satellite, drone C4, removal, a clean scan at
O4, a scan and treatment around H5, and more clearance. It lost after nine
nights. The useful tension was deciding whether another look was worth the
night. A clean scan could waste time. Partial clearance left adjacent sources.

The new browser game was then driven through its actual command box with
Playwright. Decisions and feedback were read from visible map labels. The
installed browser integration had no connected browser, so the browser skill's
documented standalone fallback was used. The play bench is `play_ash.py`.

## Changes made because of play

1. The first browser scan advanced time but never opened the ground scene.
   The server had discarded command events. Returning the command result fixed
   both the scan transition and invalid-command handling.
2. The initial close scene showed isolated columns at a distance. Measured
   crops now form a contiguous broad patch. Camera changes between scales snap
   into place. Point size was reduced after the first view obscured stems.
3. Seedlings no longer remove the native canopy from their plot. The invented
   invasive classification colours low returns pink beneath green vegetation.
4. Clicking a return selects a patch. It no longer forces open the plant guide.
5. The first winning balance relied partly on fire and finished with wildlife
   at 7 percent. That was the wrong reward. The seedling window was lengthened
   and the recovery hold increased to four nights. Fire was not disabled.
6. A repeat run immediately showed the desired difference: the first clearance
   saved native cover in six patches and left only one patch to restore.
7. A naive comparison against repeatedly clearing one location was rejected.
   The current reactive benchmark chooses the best dense footprint it can see.
8. Wildlife is visible because it can cause a loss. The ending now explains
   whether wildlife, native cover or the season deadline ended the attempt.
9. The map preview and Help read the real action footprint from the server.
   Scans and treatment both cover four by four cells in this baseline.

## Results and limitations

The final informed example wins at night 10 with 87 percent native cover and
79 percent wildlife. It does not need a fire. Several alternate early-scan
routes also win. Eight timing variants of the largest-visible-dense policy
lose on seed 7. See `ASH_BALANCE.md` for exact parameters and commands.

Browser regressions play complete win and loss routes, including fire, and
check direct TLS opening, optional reading, Back, invalid input, reload after
a terminal result, phone layout and no-WebGL fallback. Screenshots are under
the external `stage4/qa-expedition/ash-*.png` artifact directory.

The UI remains deliberately small: one map, one command, one outcome line.
The few character names label feedback, not a permanent assistant. Optional
plant records do not change the score. The earlier missions and paper lab are
preserved separately rather than mixed into this version.

In a 1440 by 900 headless Chromium run using software rendering, median frame
time was 33.3 ms overhead and 16.7 ms in the close scan. This is not a benchmark
of the event hardware. Detail can be reduced manually and drops automatically
after sustained slow frames. The point sampling remains spatially distributed
when detail is reduced; it does not remove half the map.

These are agent playthroughs and repeatable policy checks. They establish a
working decision loop and remove specific frustrations. They do not establish
human enjoyment, classroom learning outcomes or finished difficulty tuning.
The next useful test is one group discussing its choices aloud while playing.
