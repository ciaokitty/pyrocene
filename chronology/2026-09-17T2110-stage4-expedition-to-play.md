# Expedition to Play, with recovery-dependent fire

17 September 2026, 21:10 IST.

The user accepted the shared-plan trial and asked for one game flow, a concise
role briefing, fewer proposal controls, and two coupled outcome sliders.
Preserved the previous implementation at `42492bd`, tagged
`stage4-before-play-briefing`.

## Flow and briefing

Expedition and Play now share a top-left mode selector, role selector and Teams.
The default entry remains Expedition. Team links start there too. Choosing Play
opens the current shared round with the selected role. Solo proposals advance
through the two roles and then Room. Returning to Expedition from the facilitator
screen resets the shared proposals, visits and that browser's discoveries. Team
links can revisit Expedition without erasing everyone else's decisions.

Hazel appears only in the entry briefing for a role, not as a persistent helper.
The supplied `/tmp/hazel.png` was copied without pixel edits. Source and asset
have the same SHA-256: `c4cbcdc92628b06c6f542aa0d20424014edb7406301659d29baf4c88cdc91477`.
The green tint and screen lines are CSS. Editable role text lives in
`stage4/play-briefing.mjs`. Text types in, Begin can dismiss it immediately, and
reduced-motion mode shows it in full. An accessible full-text copy avoids
announcing each typed character.

## Less interface, separate measures

Removed survey ticks, letter repetition on Propose, the Original structure
buttons in shared panels, the extra shared-clearing explanation, and the bottom
playback strip. The patch note ends with yellow cost/return/health text, then
Propose and Structure. Shared removal's discount is not advertised in the
individual restoration price. Propose ends that team's turn until room review.

Removal costs 4, 3 or 2 credits and returns 16, 11 or 8 at A, B or C. These make
the same net earnings as before. The room still starts with 2 credits. Costs and
returns settle together; upfront financing is not another game mechanic.
Restoration costs and all nine plan balances remain unchanged. The shared view
lists starting funds, cost, return and balance instead of an unlabeled equation.

Forest health is explicitly a teaching score separate from money and hectares.
It starts at 60/100. Native damage from removal costs 5, 1 or 1 health points;
restoration adds 8, 12 or 6 by ten years. This authored recovery score is not a
measured ecological index and does not estimate damage from the practice fire.
The larger health gain at B and stronger fire interruption at C remain different
outcomes, rather than one hidden overall winner.

## Coupled sliders in the shared panel

Project recovery controls 0 to 10 years. Fire scrubs 0 to 20 minutes. No separate
Run fire or See recovery buttons. At year zero, clearing and native damage have
already happened; points then grow within the restored patch. Successful care
raises modelled moisture and reduces exposure over time. Each recovery year
recomputes the fire arrival field, cached per plan. Scrubbing fire reuses that
field and changes actual burned area at the current time. Camera orbit does not
rerun the solver.

For a C/C plan, the illustrative 20-minute scar changes from about 9.5 ha at year
zero to 8.0 ha at year five and 0.8 ha at year ten. Returning the year slider to
zero reproduces its former scar. Both runs keep the same spark and weather.
The no-plan reference stays unchanged.

Answer to the user's provenance question: this fire is simulated using the
educational Rothermel arrival model. It is not fitted to a 2023 or earlier NBR
burn scar. The scene remains measured/relocated point geometry with authored
fuel, moisture, recovery and species assignments. No empirical forecasting
claim is made.

## Verification and delivery

Used the browser skill. No in-app browser was connected, so used local
Playwright. Inspected the role portrait, proposal, review, young/recovered fire,
close view and phone screenshots in `qa-expedition/play-*.png`. Verified the
portrait asset is byte-for-byte identical to the supplied image.

Browser checks cover Expedition to Play, both briefings, dismissing typing
early, role switching, cost text, button order, two isolated team contexts,
private proposals, unaffordable revision, commitment, both sliders, year
reversal, rotation, reset and the no-WebGL phone fallback. One test initially
read the old page immediately after navigation; it now waits for the new URL
before checking the shared state. This was a test synchronization issue.

Existing structure/inline regressions remain unchanged. The offline archive
includes the exact portrait, new navigation and briefing modules. Unrelated root
README and Stage 2 Codex README changes and the user's `v1_participation.md`
remain outside this checkpoint.

Verification passed: 52 Node checks, 14 shared-round/server/delivery checks,
15 existing structure/inline browser checks and the extracted offline archive
playthrough with external requests blocked.

The old all-stage preview launcher failed on restart because Stage 2 already
occupied 8020. Started only Stage 4 on 8024 under the user service
`pyrocene-stage4-preview`, leaving the existing Stage 2 server alone.
