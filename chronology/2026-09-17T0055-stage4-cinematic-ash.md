# Stage 3 rules, film-derived interface

The user's correction was specific: replicate Stage 3 gameplay, not its board.
The first Ash implementation lost the cinematic point-cloud interface while
copying the rules. This pass corrects that presentation without changing the
engine or tuning the game again.

The default now opens on the existing Codex blue-hour forest plate. Sat reveals
the original airborne scan once, without repeated tiles or a rectangular grid.
The player clicks a square on the landscape and Drone opens a full-viewport
TLS patch. Remove and Restore act there. The minimap and typing are optional.

A mouse-only full run through Sat and three patches won without opening either
optional control. Browser regressions also cover losing, fire, resume and
fallback rendering. The release contains the cinematic assets for offline use.

The atmospheric image is not registered to the measured point clouds. Ground
crops are composed and game vegetation is simulated. The Sources dialog and
`stage4/ASH_VISUALS.md` retain that boundary. Original film masters and Stage 3
engine files are unchanged.
