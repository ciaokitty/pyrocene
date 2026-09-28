# Name the mission Removal and clarify the player's role

17 September 2026, 22:00 IST.

The user accepted the game and requested small briefing changes before
discussing a next mission. Removed the final explanation about financing
restoration and committing/replaying outcomes from both team introductions.
They now end when the room agrees where to remove and restore.

Removed the Hazel / Facilitator portrait caption. The text column explicitly
says Role: ecologist or Role: removal, so it describes the player rather than
the person in the picture. The exact portrait and green styling are unchanged.

Renamed the visible Play mode to Removal in the shared dropdown, page title and
team-link instructions. Both roles still take part in this mission. Internal
`play` values and the `/round.html` address remain compatible. No changes to
budgets, health, forest geometry, fire, recovery or reset behaviour.

Browser checks cover both shorter briefings, role labels, absent portrait
caption, mission label and the existing solo/two-team playthroughs. The in-app
browser remained unavailable; used the browser skill's local Playwright fallback
and checked screenshots. Updated the offline archive as well.
All four browser playthroughs passed, including two-team and no-WebGL tests.

## Next mission: discussion only

A small candidate is Return visit. Revisit the team's own intervention after a
few years, find early invasive regrowth, and choose one patch for follow-up.
Reuse survey, proposal, room decision and simulation. Contrast an obvious large
patch with a small new patch that is beginning to reconnect dry ground. This
would bring back Stage 3's early-intervention lesson without introducing sensors,
new equipment or another scoring system. This is an idea, not implemented work.
