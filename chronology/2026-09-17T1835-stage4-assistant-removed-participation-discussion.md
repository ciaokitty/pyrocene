# Assistant removed; participation discussion

17 September 2026, 18:35 IST.

The user accepted stronger Look through at `902ca09`. Preserve that state under
the annotated tag `stage4-accepted-focused-forest`. The older, subtler treatment
also remains tagged `stage4-before-focused-section` at `a8f7a17`.

## Implemented now

Removed the assistant portrait, Radio entry, incoming-call state, startup
briefing, conversational answers and hints from the current expedition page.
Selecting an optional mission now returns directly to the forest. Reporting
existing mission findings is available in the mission list, without a character.
Existing discoveries and mission state remain compatible. The Game master help
now points to Map and Close view instead of the removed radio hints.

The parked sensor experiment still has a plain field-grant form, without a
portrait or assistant. It remains behind `references=1`. Historical prototypes
and portrait assets were not deleted. No point geometry, structure-lab styling,
ecological records or fire rules changed.

The in-app browser was unavailable. Used local Playwright after reporting the
fallback. Inspected `qa-expedition/assistant-removed-start.png`: the fresh game
opens on the forest with no modal or character. Updated browser tests to enter
through More / Map / Explore C2, rather than the old assistant's suggestion.
Checks include fresh start, mission selection, reload, species notes, the four
missions, focused sections, main-map interaction and the portable archive.
Verification passed: 47 Node tests; 15 structure/inline browser checks; two
assistant-removal/mission checks; eight parked-reference/network checks; and
the extracted portable archive test with external requests blocked. The first
mission test run still expected the removed Explore briefing button. Updated
those test routes and reran both affected tests successfully.

## Discussion only

Read the user's `v1_participation.md` at the repository root. The named
`stage4/v1_participation.md` path does not exist. The root document is user-owned
and is not moved, edited or staged as part of this checkpoint.

Its proposals cover complementary removal/restoration teams, shared forest
investigations and recall maps, sensor grants that prompt information exchange,
and kiln placement with transport costs and native-vegetation penalties.
It also suggests simplifying the structure lab: Benchmark label, no Reset view
button and always-visible condition captions. None of those proposals has been
implemented in this checkpoint. The user asked to discuss them first.

Proposed direction for discussion: begin with shared investigation and separate
paper recollections, then a negotiated removal/restoration plan. Two teams with
one laptop each can have different objectives without different scientific
truths. Use explicit rounds rather than continuous hidden changes. Keep map
reconstruction fidelity separate from intervention outcomes. Add sensors only
if the basic exchange proves useful; do not make equipment luck decide success.
Any kiln economy would be an authored game rule, not a carbon-credit claim.

Root launch/docs changes and the Stage 2 Codex README remain outside this commit.
