# One field record through the game, and an overlapping Close transition

The user supplied three screenshots. Marandu grass opened a plain modal in the
rounds while Expedition had the green photographic field record they wanted.
The lag screenshot was Expedition, not the new RoundForest fire renderer.

Checkpoint before edits: `stage4-before-unified-field-record` (`549e581`).
Kept unrelated root and Stage 2 README changes and participation notes untouched.

## Timing investigation

Instrumented the real Close view with local Playwright. The in-app browser
skill could not connect to a browser. In software-rendered Chromium:

- Scan load/decode: about 40 ms locally, with roughly 4 MB of first-use requests.
- Zoom: about 930 ms.
- Plot construction: about 53 ms.
- Subsequent point growth: about 1019 ms.

This shows an application-imposed two-part sequence. It does not establish the
exact network, GPU or CPU delay on the user's laptop. Expedition did not load
the new fire scar, so attributing that screenshot to the scar would be wrong.

Shared scan requests now start after the main forest loads; selecting a square
starts fetching its crop. Requests are deduplicated. Independent crop and shared
fragment downloads run concurrently. Ground detail begins rising while the zoom
is still running, instead of after it. The same measured fragments and point
budget remain. Local normal-motion verification measured about 0.93 s total,
with detail ready around 26 ms. The camera and blend overlap is asserted in the
test, not inferred from a screenshot.

Forest and Overhead remain usable during Close entry. Cancelling invalidates
the earlier transition so delayed work cannot put the user back into Close view.
The greyed-out Close button still prevents duplicate entry requests.

## One shared species component

Expedition and the two round missions now use `species-record.mjs`. Its sidebar
keeps the landscape visible and uses the existing phosphor image treatment.
Native/Invasive is highlighted. About, Dispersal and Germination are inside that
record. Clicking the actual plant name is the entry point for either role.
Removed the Seeds button and the seed-species selector. Structure remains linked
to the actual selected plant. Photos are not generated or changed on disk.

Added literature-backed germination text for Marandu, Guinea and molasses grass
alongside the signal grass and Cecropia records. Local source maps use that
species' authored occurrence. Unknown seed traits are stated as unknown, with
no guessed wind/animal assignment or map inferred from a plant's height.

The ecologist briefing now asks why invasives are returning at the restored
site. They can discuss invasive seedlings, neighbouring sources or another cause.
The description on the planted patch asks the same question. Wider arguments
are for the room; v0 still accepts one available crew patch. No new actions,
budgets or dispersal-driven survival rules were introduced.

The phone test found a real obstruction: the proposal panel covered a plant
label. Phone panels now have a bounded height and the three study labels sit
below them. The field record remains scrollable and fits the viewport.

## Verification

Browser coverage checks the shared record in Expedition and both missions,
green reference loading, seed maps, native/invasive badges, unknown records,
keyboard tabs, structure links, selected-patch changes, phone/no-WebGL access,
normal-motion overlap and cancelling entry. Existing round, independent-team,
structure and offline checks remain. Screenshots use `record-*` in the external
`qa-expedition` folder. Model checks confirm no changes to fire or budgets.

This is an application-side improvement and local browser measurement. It still
needs the user's laptop check before calling the reported pause resolved there.

Follow-up wording pass: the five seed records now use short field observations
and questions with a restrained sense of uncertainty. Removed the repeated
"alone" caveats. Kept the documented ability to germinate in darkness rather
than introducing an unsupported shade response for Marandu. Source limitations,
maps and game mechanics are unchanged. All 61 model tests passed.
