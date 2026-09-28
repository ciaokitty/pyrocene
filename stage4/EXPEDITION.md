# Stage 4 field expedition

The default game is a quiet measured-forest exploration, followed by a group
memory map and a fire comparison. It runs locally with Python 3 and a browser.
No Blender, Unreal, account, model endpoint or Internet connection is required.

## Field sequence

Four missions are suggestions, not locks. Players can switch at any time.

1. Meet six plants in three places. Ten native plants and three invasive plants
   remain an optional collection. Eighteen real taxa are available in total.
2. Compare two disturbance records. Char, cut stumps and root plates are
   different clues. A canopy gap alone is not an explanation.
3. Compare damp and dry places. A damp opening and a dry native-only patch
   prevent the shortcut that all gaps or invasive plants must be dry.
4. Read two human accounts and two plant uses. Food, harvest, access, field
   preparation and forest carbon proposals have different implications.

Click the forest to choose a place. Forest, Overhead and Close view remain
available. Drag and scroll to explore. WASD moves across the airborne scene.
More > Map provides accessible coordinate selection without filling the forest
with location labels. The coordinates also appear on the paper map.

At a new place, select Close view. Ground points rise within the selected
square while the surrounding forest stays visible. Species names appear
directly. Select a name for a short note about conditions and uses. Plot notes
appear automatically beside the map. Forest sinks the detail and pulls back.
There are no scan, field-team or meet-plants buttons. Field visits are unlimited. The ground
scans are measured returns, not generated trees. Eleven crops come from three
French Guiana source plots, including subcrops of the same original samples.
They are horizontally magnified inside the selected square as a visual detail
lens, not claimed to be surveys of these Amazon map coordinates. See
INLINE_DETAIL.md and TLS_EXPANSION.md.

Lia appears in a dismissible green field-radio call. She is a fictional field
ecologist with a Jane Goodall-inspired portrait, not Jane Goodall or her
endorsement. Free hints always remain available. Three discussion calls per
mission use authored, source-bounded answers about available field records.
There is no live AI connection. Plant photographs use a monochrome display
treatment. Licenses remain linked and the original files remain intact.

## Two or three teams

Use one shared map, explanation and simulation result per team. For ten people
in a team, use two groups of four or five within that team. Rotate the person
at the controls. One group proposes an explanation and the other checks it.
Swap after a field round. These are working groups, not extra competing teams.
Confirmed hardware: one laptop per team. Team members share exploration and
produce one physical map together. This has not yet been evaluated with participants.

A field grant becomes available through Radio after three visits, or during
the human mission. More > Sensor network also opens it without a prerequisite.
With two teams, choose sound recorders and camera traps. Both can still read
air and litter observations during field visits. A third team can choose
environmental sensors. Nothing requires a third team to proceed.

Choose stations and compare Days 0 through 3. A timber operator, grower and
community group follow finite scenario goals. Their actions change declared
practice conditions. The measured point cloud is not altered. Compare canopy
surveys displays a labelled scenario overlay, not newly measured LiDAR.

Finish this field round advances the landscape. It never advances on a hidden
wall clock. Export sensor records and import another team's JSON to compare
complementary evidence. Files are local and require no shared cloud service.
Claims remain hypotheses even when two sensor types agree. Camera effort is
shown. A non-detection is not proof of absence. See LIVING_LANDSCAPE.md.

## Stage 4.5 and the final lab

Finish the closing Day 3 field round before recall. Close the exploration
screens. Give each team a blank printed map. Ask them to reconstruct damp
places, connected dry material, invasive plants, disturbances, exposure,
possible ignition, human uses and habitat. Include why and uncertainty.
Bring back clues from the room game, connectivity lab and data films.

Each team explains its map before running the simulator. Enter the paper marks
at /memory.html. A local photo can be used as a manual reference; there is no
automatic photo interpretation. Commit locks the reconstruction and reveals a
side-by-side animated comparison with the same Day 3 training reference.
Every team uses the same ignition and weather. Export committed maps to compare
teams on the event laptop. Scores reward reconstruction and arrival agreement,
not a blanket claim that less burning means a better reconstruction.

The final map lab uses an educational Rothermel-based arrival solver. It is not
native ForeFire or a calibrated prediction. The actual 2023 MapBiomas scar is a
separate evidence layer. No observed spread path is claimed. The earlier
protection mission and its 253-plan native ForeFire bank remain at /mission.html.

## Editable content

- world.mjs: mission briefs, hints, recall questions, plot assignments and field
  records. These are authored scenario data.
- field-catalogue.json: eighteen species descriptions, uses, fire notes and
  literature sources.
- expedition.mjs: radio framing, local discussion responses and GM copy.
- field-network.mjs: grant, station and collaboration copy.
- living-landscape.mjs: actor goals, sensor records and declared day changes.
- field-photos.json and plant-images.json: attribution and photo mappings.

The older /explore.html prototype still reads dialogue.json and species.json.
It is retained for comparison, not the default expedition content.

## Reproduce checks

```sh
node --test stage4/test_expedition_state.mjs stage4/test_living_landscape.mjs stage4/test_memory_model.mjs
python3 -m unittest stage4.test_expedition -v
python3 -m stage4.package
python3 -m unittest stage4.test_portable -v
```

PLAYTEST_NOTES.md records the actual pacing experiments and remaining room-test
limits. Browser tests cannot establish participant enjoyment or learning.
