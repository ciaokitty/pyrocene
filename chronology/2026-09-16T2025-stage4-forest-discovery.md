# Stage 4: begin by studying the forest

The user liked the measured forest and its three camera views but found the
first v0 too dense. This entry supersedes that opening, not the underlying
fire-model work in the 18:55 entry.

The default page now opens directly into the forest. No briefing modal, budget,
height filter, sensor selector, notebook or permanent evidence panel. Pick a
plot, look closer, scan from the ground and send a field team. Three clickable
plants lead to short field records. Visits are unlimited. After two visits,
Lia suggests the overhead species map. The player can sort observations by
dryness, select several known species and examine possible matches near the
practice settlement. Exploration can continue without a final score.

The helper is a small green radio portrait. At the user's request, the final
version depicts an older fictional naturalist inspired by Jane Goodall. The
imagegen skill was used with the built-in image tool. `stage4/ART_NOTES.md`
retains the prompt. Every guided line is editable in `stage4/dialogue.json`.
The six plant records use real, credited reference photographs rather than
generated botanical images. Neither Blender nor Unreal was installed.

The same measured Amazon airborne crop remains the world. Two real Paracou
TLS samples provide the close-up structures. They are reused practice plots,
not co-located scans of the map. Exact points and source identifiers are kept
in the prepared assets. Species identities at those points, moisture records,
the match map and settlement are declared scenario data. Different sampling
schemes prevent treating the two TLS point counts as a density comparison.
The guide's dryness measure describes observed material, not a permanent
species trait or remotely measured moisture elsewhere.

Implementation is separated into `explore-state.mjs`, `explore-render.mjs`,
`explore.mjs` and `explore.css`. `index.html` now loads this opening. The first
v0 remains at `mission.html`, including its independent native ForeFire bank.
There is no automatic handoff from the new exploration into that mission yet.

Actual Playwright interaction caught two issues: the no-WebGL scan projection
was behind the helper and two specimen labels overlapped. The projection is
now centered with room for controls. Labels stagger with short leader lines
when their measured anchors project too close together.

Verification passed: 16 Node tests and 20 Python tests, including a complete
two-plot browser tour, mobile layout, no-WebGL play, save/reload, old mission
regressions, source-stage isolation and the extracted portable launcher. The
portable test runs outside the checkout with external requests blocked. It
opens a new plant photograph, then runs the retained native fire comparison.
QA images are in `/mnt/seagate/models/pyrocene/stage4/qa-explore/`.

The preview service was restarted and `/health` reports ready on 8024. The
portable ZIP is about 14 MB. It includes the new TLS samples, photographs and
portrait. Event-laptop frame rates and participant comprehension still need
an in-room rehearsal. These functional tests do not establish either.
