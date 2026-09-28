# One shared plan

Start in `/expedition.html`. Choose a role and use the top-left Expedition / Cooperation
selector. Cooperation is the first mission for both teams; `/round.html` remains its
implementation URL and `play` remains the internal navigation value. Before the original
trial: `211c4db`, tagged `stage4-before-shared-round`. Before this unified flow:
`42492bd`, tagged `stage4-before-play-briefing`.

After commitment, the dropdown opens [Negligence](NEGLIGENCE.md), which
inherits the planted patch and asks where one follow-up crew should work.

## Play

On one laptop, choose Removal or Ecologist. Hazel introduces that role. Inspect
a lettered patch in Close view, optionally open Structure, then Propose. The
view switches to the other team, with its own introduction. Submit its proposal
and the view switches to Room. Reveal, discuss, optionally change a proposal
using the team selector, and commit once. The selector is only available to the
facilitator. Hazel appears only for the introduction, not as a persistent helper.
The briefing labels the player's role as Role: ecologist or Role: removal. The
portrait has no name or facilitator caption. Her image is the exact supplied
`/tmp/hazel.png` file, copied as `hazel.png`.
Only CSS tint and scanlines are applied. Editable copy is in `play-briefing.mjs`.
Begin can dismiss typing immediately; reduced-motion mode shows all text at once.

For two teams, the facilitator opens Teams and shares the separate Removal and
Ecologist links. Each team opens its link in Expedition on its own laptop, then
chooses Cooperation when ready. Both laptops must
reach the same running server. Internet access is not required. The Room view
reveals and commits. Until reveal, a team sees only its own proposal and whether
the other team is ready. These are capability links, not named accounts. Anyone
given a team link can act for that team; do not share the facilitator URL.

Propose ends that team's turn until reveal. Teams can revise after reveal but
not after commitment. Independent
surveys and proposals can arrive together. A stale shared commitment is rejected.
Proposals are held in server memory, survive browser reloads and end when the
server restarts. Returning to Expedition from the facilitator screen resets
proposals, survey visits and that browser's expedition discoveries. Returning to
Cooperation starts fresh on the same forest and retains the selected role.
Backward navigation from team links also resets the shared game. Open round
screens follow the reset, including returning to Expedition. Old-round writes
are rejected. At most 128
rooms are retained. Recovery/fire playback is local to each screen; decisions
and committed plans are shared, not each user's camera or playback position.

## Deliberately small rules

Two proposals: remove one patch and restore one patch. One fixed processing
facility is assumed off-map. No route, equipment or kiln-placement choices.
The room begins with 2 game credits. Removal has a gross return and a separate
cost. They are not biochar yield or carbon-credit revenue. The existing net
earnings and all nine affordable/unaffordable combinations are unchanged.

| Patch | Removal cost | Gross return | Native cover lost | Planting/care cost |
|---|---:|---:|---:|---:|
| A, C2 | 4 | 16 | 18% of A | 7 |
| B, D5 | 3 | 11 | 4% of B | 6 |
| C, E4 | 2 | 8 | 2% of C | 6 |

Restoration costs another 3 credits for selective clearing unless removal is
already proposed in the same patch. Overlap never clears twice. The restoration
crew's separately paid selective clearing has no added native-loss penalty in
this toy model. Damage percentages are authored local-area indicators, not
measured mortality.

Forest health is now an explicit teaching score, separate from credits and
burned hectares. It starts at 60/100. Removal's native damage subtracts 5, 1 or 1
points at A, B or C. Successful restoration adds 8, 12 or 6 points at ten years,
linearly with the recovery-year slider. This score describes recovery before
the practice fire; it is not a measured biodiversity index or a burn-damage model.
The higher-health opening at B need not be the strongest fire interruption at C.

For removal/restore pairs AA AB AC BA BB BC CA CB CC, money remaining is
7, 5, 5, 0, 4, 1, -2, -1, 2 respectively. CA and CB cannot be committed.
Changing CA to CC makes the proposal affordable. AA earns more than CC but
damages more native cover and leaves more of the simulated fire route intact.
The fixed native mixes are in `round-config.json` and the optional Structure
comparison's About section. No mix is reconstructed botanically from a scan.

## What changes in the points

The trial reuses the accepted airborne scan and ground-scan neighbourhoods.
Its B opening and C narrow gap are authored visibility masks. They do not edit
the source files or the old expedition renderer. The structure lab uses matching
qualitative profiles: mixed cover at A, larger opening at B, a smaller opening
at C. Neither the scan nor the fictional plot assignment proves fire risk.

Removal fades low vegetation. Its native-damage strip fades some taller points.
Projected recovery copies measured upper-canopy returns from the reference
tile, relocates them into the chosen patch and grows their height/visibility.
There are no generated cone meshes or static forest panels. The 10-year slider
is an illustrative transition, not a species-specific growth forecast. Recovered
close views show the fixed native names, rather than retaining invasive labels.
The proposal controls read Propose and Structure. Shared review/outcome panels
have no Original structure button. Optional species records remain reference
descriptions, and their structure links describe the original survey.

Fire uses the existing educational Rothermel arrival solver on a 60 by 60 grid
of 15 m cells. A fixed ignition in F4, the same wind and a 20-minute horizon
apply to both runs. Fuel, moisture and exposure are authored at 15 m resolution.
Irregular fuel bands cross plot boundaries, so the scar follows a path rather
than filling whole squares. The corridor through C contrasts with wetter
surroundings. The separate memory lab retains its original field by default. The
future restoration scenario assumes successful establishment and damp litter;
it is not a guarantee that planting makes a forest fireproof. Removal without
restoration retains a lower but nonzero future fuel load. No historical fire
is reproduced, no ignition probability is estimated, and this is not ForeFire.
It does not match any 2023 or earlier NBR burn scar.

The shared panel has independent recovery (0 to 10 years) and fire (0 to 20
minutes) sliders. Year zero shows completed clearing, not untreated vegetation.
As recovery advances, modelled moisture rises and exposure falls. Every recovery
year has a recomputed arrival field, cached per plan. Fire scrubbing reuses it.
Changing the year with the fire already advanced changes the actual spread and
scar at that same minute, not merely the colours. No automatic playback or
separate Run fire / See recovery screen is required.

The front colours the existing points and adds a small rising point layer.
Brown points retain the scar. Without plan / With plan switches the arrival
field at the same camera and playback time. The displayed hectares count fine
cells reached within the teaching horizon, not empirically predicted loss.

The no-WebGL path uses the same geometry, masks and arrival arrays in Canvas2D,
with fewer points and a capped redraw rate. It has no rising ember layer.
GPU and CPU views remain rotatable, zoomable and selectable. The model is
computed on decisions and recovery-year changes, not while orbiting the camera.

## Verification

`test_round_model.mjs`: all nine budgets, overlap, deterministic fire, different
outcomes and no mutation of the separate memory lab's world.
`test_shared_round.py`: funds, role permissions, private proposals, stale
commitments, concurrent independent actions, replay and commit-once behaviour.
`test_round.py`: solo play, two isolated team sessions, revising an unaffordable
plan, shared commit, browser reload, point-image changes, structure lab,
mobile/no-WebGL, rotation during outcomes, restored close view and recovery/fire comparison.
`test_portable.py`: runs the trial from the extracted offline archive.

Screenshots are external under `stage4/qa-expedition/play-*.png` (earlier version:
`round-*.png`). They are QA
captures, not game assets. Browser playthroughs test usability and mechanics,
not whether a room of participants will find the negotiation enjoyable.
