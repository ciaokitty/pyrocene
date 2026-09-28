# Field teams, recollection and a changing landscape

The user's direction moved Stage 4 from a protection dashboard to a quieter
field journey. The assistant should arrive as a radio call and leave. Plant
names, monochrome records and measured ground scans replace generic icons and
live-colour imagery. The newest addition is a changing human landscape with
complementary sensor grants and collaborative inference.

The new expedition implements four freely selectable missions. A collection
prototype requiring ten natives and three invasives delayed later questions,
so six plants across three places is the default first report. The larger
collection is optional. Wander, collection and case-led variants were played
through visible controls. These are agent design judgements, not evidence of
participant enjoyment. `stage4/PLAYTEST_NOTES.md` records the changes.

The taxon catalogue has eighteen real plants. Eleven measured TLS crops come
from three source plots, including subcrops of existing samples and three
Nouragues PCD tiles. The crops are explicitly reused at authored practice
positions. No forest geometry is generated. Field records, human accounts,
sensor signals and four-day actor goals are simulated and disclosed.

Two or three official teams are the intended event scale. A team of ten can
use two groups of four or five to alternate exploration and checking, then
submit one map and one explanation. Two teams can use acoustic and camera
networks. Both retain field air/litter observations, so no third team is needed.
The optional third network is environmental. Device count is not yet confirmed.

A shared field day prevents fast reading from changing the task conditions.
Teams can export sensor JSON and import complementary observations. The
prototype was revised from unrelated counters to station signals connected to
scenario changes. Effort and non-detection limits stay visible. Two sensor
types are an invitation to compare, not proof of a human cause.

The paper lab uses the same closing Day 3 world for all teams. Marks and reasons
are entered manually, with an optional local photo as reference. Commitment
locks the map. The educational Rothermel arrival solver compares against the
same scenario ignition and weather on a finer grid. Scores do not reward an
all-wet shortcut. The 2023 mapped scar is separate and does not supply an
observed path. Old native ForeFire stress-tests remain in `/mission.html`.

Important bugs found during iteration: TLS coordinate-scale transition,
asynchronous scan-control timing, missing drawn map marks, a missing printable
legend, unknown cells acting too much like damp barriers, and fire calculations
being repeated per animation frame. All have targeted fixes and replay checks.

At this checkpoint, the new default is installed in source and release
verification is in progress. Delivery/model/isolation checks and separate
mission/sensor browser runs have passed. Final aggregate browser replay and
extracted portable release verification are the next steps. QA lives outside
the repo under `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`.

Resume from `stage4/EXPEDITION.md`, `MEMORY_LAB.md`, `LIVING_LANDSCAPE.md`, and
the tests. Do not treat this checkpoint as a completed event rehearsal.

## Release verification, 22:17

The seven-test expedition browser suite now passes together, including free
world picking, all missions, mobile, no-WebGL fallback, sensor exchange and
paper recall. A further memory replay verifies importing two other committed
teams into the three-team local comparison list. Thirty-five JavaScript model
checks, twelve delivery/native-bank/isolation checks and seven earlier-browser
regressions also pass. The extracted release has passed its standalone browser
flow without external requests. The release archive is about 28 MB.

The final fire comparison has its own large dialog with two north-up views,
time in minutes, outside-footprint shading and a return to the paper map.
The blank map with all marks and its legend is one A4 page. The preview user
service is active on 8024 and /download supplies the offline ZIP.

A short software-rendered 1440 by 900 run reported median frame intervals of
16.7 ms in Forest and 33.3 ms in Overhead at 420,000 points before automatic
detail reduction. This is a local diagnostic, not an event-laptop guarantee.
The renderer retains its adaptive 100,000-point mode. No engine install is
needed. Raw film masters and the older native-bank model remain unchanged.

Remaining limitations: no participant rehearsal, no live language-model radio,
no actual acoustic recordings, no automatic photo-to-map interpretation and no
live shared server state. These are disclosed local simulation/file workflows.
