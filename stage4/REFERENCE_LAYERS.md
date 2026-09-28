# Communities, sound and camera records

Parked on 17 September at the user's request. The main game is forest-only.
These experiments remain available to developers at
`/expedition.html?references=1`, including the older sensor grant. Their assets
are optional for server readiness. The pre-descope checkpoint is `c7641fc`.
Do not reintroduce the selector, grants or sensor tasks without discussing scope.

Use **Explore**, at the lower left, to switch between Plants, Communities,
Audio and Camera traps. The chosen layer opens overhead. Select a marked place
to move closer. Forest or Overhead reverses the selected-square reveal. Plants
restores unrestricted exploration. No grant or mission completion is required.

There is one building reference, one listening reference and three camera
references in this first set. They are not a sensor deployment or a new census.
The existing grant/network exercise and its simulated dated records are separate.
Reference-layer visits do not secretly grant species or mission progress.

## Evidence and licenses

- Buildings: 49 machine-detected polygons from a 200 m window near Alter do
  Chao, Para, Brazil. Microsoft GlobalMLBuildingFootprints, 2026-08-13 release,
  quadkey 210110023. [Source](https://github.com/microsoft/GlobalMLBuildingFootprints),
  [CDLA Permissive 2.0](https://cdla.dev/permissive-2-0/).
  Original arrangement is uniformly scaled into the selected square. Five-unit
  walls are illustrative, not measured heights. The footprint data do not
  identify households, ownership, occupation, ignition or illegal activity.
- Sound: Richard Ranft / The British Library Board. Screaming piha,
  *Lipaugus vociferans*, Tambopata Reserve, Peru, 2 October 1985.
  [Recording and CC BY 4.0 notice](https://commons.wikimedia.org/wiki/File:Screaming_Piha_(Lipaugus_vociferans)_(W1CDR0000523_BD5).ogg).
  Playback is user-initiated. The waveform is RMS amplitude calculated from the
  actual decoded recording, not an invented plot or automated species analysis.
- Bird photograph: Hector Bottai, Manaus, Brazil, 2019.
  [Source and CC BY-SA 4.0 notice](https://commons.wikimedia.org/wiki/File:Lipaugus_vociferans_-_Screaming_Piha;_Manaus,_Amazonas,_Brazil.jpg).
  The sound and photograph depict the same species, not the same individual.
- Camera frames: Wildlife Conservation Society, Bolivia. Lowland tapir,
  jaguar and white-lipped peccary. [WCS / LILA dataset](https://lila.science/datasets/wcscameratraps),
  [CDLA Permissive 1.0](https://cdla.io/permissive-1-0/).
  Species labels come from the original class-level annotation archive.
  Image IDs, dates, source paths and hashes are in `assets/observations.json`.
  We do not infer a precise Amazon location from the country tag.

All placements in the game map and the neighbour/harvest story are authored.
The scan is not registered to these recordings, photos or buildings. A camera
visit is not a population count. Missing detections are not proof of absence.
Community notes deliberately do not assign fault or intent to real residents.

SA-FARI was investigated. Its Hugging Face downloads require approved access.
We did not bypass that restriction or include restricted media. WCS provides
an openly downloadable alternative with suitable species and explicit terms.

## Styling and performance

Buildings are point-sampled walls in the same world coordinates and rise/sink
with the selected lens. Wildlife is a source photograph, not an invented animal
mesh. Its floating field-terminal frame stays with the selected map position
while the forest remains navigable. Frames fade with the same detail blend.
The image renderer preserves photo proportions and applies a green scanline
treatment at 480 x 320. Share-alike image treatments retain the original license.

Audio stops when leaving the view, changing layers, hiding the page or opening
a dialog. Waveform analysis happens once per opened record and closes its audio
context. There is no recognition model or remote API at runtime. All media ship
in the portable archive. WebGL-disabled Canvas uses the same building coordinates
and green media frames. Tree and wildlife binaries total about 8.3 MB uncompressed.

## Iteration and verification

Initial jaguar frames had clipped bodies or severe blur. We inspected alternatives
and chose a complete resting-animal frame. The visible camera timestamp is
retained. We rejected the initial partial peccary frame for a clearer view.
The phone selector originally covered notes; it now sits above the media frame.
Switching during a camera transition is disabled after an automated playthrough
exposed that race.

`test_observations.py` checks all three animals, community geometry, return to
plants, no false mission credit, actual audio playback/decoding, waveform pixels,
audio teardown, phone layout and disabled-WebGL screenshots. `test_inline.py`
checks the original plant flow. Screenshots are in the external QA directory.
Neither automated play nor server-side screenshots establish performance on the
participants' actual laptops.
