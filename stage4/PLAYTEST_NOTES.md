# Exploration playtests and rule changes

These are agent-operated browser playthroughs and design judgements, not a
participant study. No claim of measured enjoyment or learning is made.

## In-place detail update, 17 September

The user supplied `/tmp/drone.png` as the camera-framing reference. Close view
now moves to that same camera, replaces only the selected square with rising
ground returns and directly labels plants. Forest sinks the detail before
pulling back. The extra scan, field-team, meet-plants and field-notes buttons
were removed. Plant notes are short paragraphs without pictures or gated uses.

Actual browser visits found two issues: the old frame-dependent camera was
still moving when the detail grew, and portrait screens hid off-screen plant
anchors. A timed camera move now completes first. Narrow-screen close framing
backs up enough to include the square, and labels avoid the notes panel.

WebGL and deliberately disabled-WebGL visits both exercised drag, close detail,
species reading and return. The expedition's previous static fallback is now
a lower-density Canvas projection of the measured points with the same camera.
Screenshots are `qa-expedition/inline-*.png`. This verifies interaction, not a
performance guarantee for every team laptop. See `INLINE_DETAIL.md` for the
display scaling and evidence boundaries. Earlier notes below are historical.

## Models tried

The same three-place route was played through the visible controls in three
rule variants. They remain reproducible at /expedition.html?mode=NAME.

| Variant | Observed consequence | Decision |
| --- | --- | --- |
| wander | Few demands, but no specific reason to compare and later recall places | Keep free movement and optional mission order, not this as the default brief |
| collection | Ten natives plus three invasives keeps the first mission incomplete after nine useful plant discoveries | Retain as an optional collection, not a gate to disturbance or people |
| cases | Six plants in three places permits a useful first report and gives later observations a reason | Default, with all four missions freely selectable |

The differences are not a controlled comparative study. The prototypes isolate
briefing and progression rules on the same renderer, not three finished games.
Raw captures and the exact radio text are in the external QA directory.

Design references inspected:

- [Journey](https://thatgamecompany.com/journey/): restrained presentation and
  room to move. This game keeps its measured cloud, not Journey's art assets.
- [Firewatch](https://www.firewatchgame.com/): a radio exchange can give a reason
  to inspect something without a permanently visible helper.
- [Outer Wilds developer discussion of wandering](https://www.mobiusdigitalgames.com/news/the-intentionality-of-wandering):
  curiosity and connected questions informed the field clues.
- [Subnautica design talk](https://www.gdcvault.com/play/1025745/The-Design-of-Subnautica):
  discovery informed the optional collection. Survival pressure was not adopted.

## Changes made after playing

1. The original 13-species first gate delayed the later questions. Lowered the
   main target to six plants across three places, retained the larger collection.
2. A TLS transition initially flew from airborne scale into a different survey
   coordinate system, briefly reducing the ground scan to a tiny speck. Snap
   camera scale when swapping surveys. No measured point is changed.
3. A test initially clicked past an asynchronous scan transition. Fixed the
   test to wait for the visible action to become enabled, then replayed the
   real scan and field-visit controls. No direct state injection for missions.
4. Plant cards opened under a CSS entrance animation. Screenshots now wait for
   it to finish rather than judging a half-transparent intermediate frame.
5. The first sensor draft had unrelated counters and nonoverlapping stations.
   Revised to shared stations and scenario-dependent signals. Camera effort is
   fixed and visible. Camera charts now compare field days, not detections
   against hours on one common scale.
6. Pooling was played using two separate browser contexts. One camera team and
   one sound team exported and imported their own reached field days. A malformed
   packet was rejected without replacing existing observations. No third team
   is needed for this loop.
7. The first memory-map draft treated unknown cells too much like wet barriers.
   Unknowns now use a declared neutral assumption. Invasive does not imply dry.
   Exposure changes the declared wind reduction, not hidden reference values.
8. A coarse fire display was replaced with a 60 by 60 arrival grid and shared
   20-minute teaching horizon. A perfect numerical reconstruction beats an
   all-wet map. Zero fuel blocks spread. The educational surface-rate equation
   is labelled and the old native bank remains separate.
9. Reviewed paper marks, print legend and animation cost. The final recall map
   must carry each mark visibly and print on one A4 sheet. Animated display must
   reuse cached arrival calculations, not rerun the solver for each frame.
10. The first comparison squeezed two fires beside the disabled paper editor.
    Moved them into a dedicated north-up comparison view with a Back button.
    Teams can import two other committed maps and keep the three results on
    the event laptop. The input map remains locked during comparison.

## Playthrough coverage

- All four missions through field controls, named plants, human uses, source
  links, limited discussion calls, unlimited hints and persisted discoveries.
- Three pacing variants, mobile width and varied TLS crops.
- Grant choice, station comparison, dated interpretation notes, two-team file
  exchange, invalid import, closing day, canopy annotation and reload.
- A four-place recalled map with reasons, commitment, animation, historical
  evidence and JSON export. Separate model checks compare contrasting maps.
- Portable release is tested after extraction with external requests blocked.

QA is written to /mnt/seagate/models/pyrocene/stage4/qa-expedition/. Existing
v2 and protection-mission regression captures remain in qa-explore/ and qa/.
The final seven-test expedition browser run passes as a suite. Thirty-five
JavaScript checks, twelve delivery/native-bank/isolation checks and seven
earlier-browser regressions pass separately. The extracted offline release
also passes its browser flow. The printed blank map is one A4 page.

## Still needs a room rehearsal

The main uncertainty is ten people sharing a team screen. Use two working
groups within each of the two or three teams, rotate the driver and ask one
group to challenge the other's explanation. Watch whether people can describe
a remembered place without reading the UI. If recall reduces to coordinates,
adjust the prompts and visit count before adding more content. Test readability
and frame rate on the event device. A workstation browser run does not settle
these questions.
