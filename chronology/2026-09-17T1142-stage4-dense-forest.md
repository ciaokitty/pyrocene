# A dense forest, not three specimen trees

17 September 2026, 11:42 IST.

The user parked built-up areas, audio and camera traps. Preserve their research
and experiments, but stop adding them to the active forest game. `c7641fc` is
the complete reference-layer checkpoint. The code and assets remain available
at `/expedition.html?references=1` for development. The main route has no Explore
layer selector, sensor grant or Sensor network menu entry. Old saved sensor
state no longer changes its forest records. Those assets are no longer required
for main-game server readiness.

The user liked the older point cloud's density and continuity with the surrounding
forest. The newer view had removed the selected airborne square and inserted
three enlarged tree specimens. Even though those specimens came from scans,
the arrangement looked fabricated and empty. That is a visual failure, not a
reason to insist on the source data's credentials.

The user explicitly allowed extrapolation, modelling and even a fictional
Island of Ash. This iteration keeps the current Amazon map and interface but
uses a clearly documented fictional ground-level neighbourhood. It does not
rename the game or change its missions.

## Iteration

1. Removed the three-tree bank from Close view. Repeated measured TLS fragments
   across the whole selected square with seeded rotations, translations and
   modest uniform scale variation. Kept some airborne canopy in that square.
   The first screenshot was dense but looked like an evenly bright cloud.
2. Prepared a classified FG6c2 fragment retaining the source's wood returns.
   Added brighter stems, darker foliage and depth attenuation. Lowered the camera
   from distance 210 / elevation 0.22 to 170 / 0.10 so it looks through the forest.
3. Checked two squares, zoomed further in and dragged to a second bearing.
   Vegetation now fills the square, with many stems and layered crowns. No
   isolated giant tree specimens remain. The original surrounding cloud remains.
4. Increased the Canvas fallback's detail budget from 16,000 to up to 60,000
   sampled returns. Kept redraw-on-change and bounded GPU point counts. Manual
   low-detail mode halves the modelled detail and samples the airborne cloud.

The model uses 225 fragment placements and at most 360,000 detail points. Neither
number is a tree inventory. The placement, repetition, overlap and density are
authored. Return density is not used to infer girth, tree abundance or fuel.
Fragments retain local proportions; no horizontal-only stretch is used.
Species names remain authored teaching examples, not scan classifications.
The Sources panel explains the modelling. The Codex films are not modified.

## Verification and remaining work

Screenshots and interaction checks use local Playwright because the in-app
browser connection was unavailable. Inspected captures live under
`/mnt/seagate/models/pyrocene/stage4/qa-expedition/`: `inline-ready.png`,
`inline-b4-final.png`, `dense-zoom-trial.png`, `dense-orbit-trial.png` and
`inline-cpu-final.png`. The film comparison used `lidar/qa/single-contact-full.jpg`.

Tests cover deterministic revisits, varied sectors, source immutability, full
square coverage, bounded heights, reverse animation, retries, phone labels,
low-detail mode and WebGL-disabled drag/zoom. Browser runs are not proof of
performance on the participants' laptops. Headless software WebGL can be slow.

Verification completed: 27 Python tests passed across inline rendering, delivery,
archived reference layers, the expedition and the extracted portable copy.
Twenty-two Node tests passed for the neighbourhood, expedition state, landscape
and memory model. The live port 8024 check reported no page errors or failed
responses. Inspected both `dense-close-live.png` and `dense-low-detail-live.png`.
The latter submitted 105,000 airborne and 176,798 detail points. No real-device
frame-rate claim is made. The portable archive was rebuilt with the new fragment
asset and renderer module; external requests were blocked in the portable test.

Fire paths through the dense forest are a possible next step, not implemented
in this pass. The existing paper recall and simulator remain unchanged. Their
future linkage to a simplified forest-only experience still needs a gameplay
pass. No new mission or sensor mechanics have been added.
