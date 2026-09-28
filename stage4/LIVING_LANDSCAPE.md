# Living landscape sensor exercise

This module is a deterministic four day collaboration exercise. It is not a
historical observation system. It does not create real audio, photographs,
weather readings, or species detections. Every sensor record is authored for
the exercise and carries `validatedNotTruth: true`.

## Model boundary

`WORLD` remains the declared measured-footprint metadata from `world.mjs`.
`worldAtDay(day)` clones that world and adds scenario fields. These fields are
`canopyGap`, `scenarioDisturbance`, `scenarioActors`, `scenarioDays`, and
scenario-adjusted `fuel`, `moisture`, and `exposure`. The base values remain
available as `baseFuel`, `baseMoisture`, `baseExposure`, and
`baseDisturbance`. `geometryPreserved: true` is included on every returned
cell. No measured geometry or LiDAR value is changed.

Three fictional actors choose valid active cells by a fixed priority score.
The timber operator pursues a quota. The field grower prepares an opening. The
community group harvests and plans prevention. Each actor moves to a new site
on each of four field days. Day values are only 0, 1, 2, and 3. There is no
clock, network request, or unseeded random choice. All teams compare the same
day 3 scenario snapshot.

## Sensor API

```js
SENSOR_TYPES // ['acoustic', 'camera', 'environment']
createNetwork(type, teamName)
advanceNetwork(state) // returns a new state, capped at day 3
getReports(state) // current chosen network and chosenDay only
worldAtDay(day)
exportPacket(state)
importPacket(packetOrJson)
poolPackets(packetList)
```

Each network has three shared core station cells, including cell 26 as a damp
reference and cell 29 as a sheltered habitat reference. This permits
independent channels to be compared at one cell and day. A state keeps reports for all
days reached so a UI can select an earlier `chosenDay`. `getReports` never
returns another network's records.

Reports have `id`, `cellId`, `day`, `kind`, `title`, `summary`, `series`, and
`source`. Acoustic reports expose the patterns `motor-like pulses`,
`insect band`, and `rain`. A motor-like pattern is not a confirmed chainsaw
and does not identify a person or actor. Camera reports include detections and
a constant 12 effort hours. Counts can decline near a new scenario gap and
rise at the sheltered reference. Those changes are authored scenario signals,
not causal wildlife evidence. A non-detection cannot prove absence.
Environment reports carry humidity and temperature series plus a registered
context. The context is a scenario aid, not a station record from the film
crop.

`exportPacket` returns a JSON-safe object for the current day. Its FNV-1a-32
value is a reproducibility check, not a cryptographic signature. Import checks
the schema, topic, day range, active cell, report values, source URL length,
and validated-not-truth provenance. `poolPackets` removes exact duplicate
accounts. It keeps different records for the same station, day, and type and
marks them as conflicts. The returned `attribution` and `humanAttribution`
tables are eligible only when
two independent sensor types cover the same cell and day. Even then it is an
evidence gate for discussion, not proof of a human cause.

## Evidence basis and limits

The sources below are primary research or official data documentation. They
support survey design and interpretation limits. They do not validate the
fictional observations or actor paths in this module.

* Metcalf et al. (2022), eastern Brazilian Amazon passive acoustic monitoring:
  [Optimizing tropical forest bird surveys using passive acoustic monitoring and high temporal resolution sampling](https://doi.org/10.1002/rse2.227).
  The study compares sampling effort and shows why short or sparse acoustic
  samples can miss calls. This supports repeated effort and the pattern-only
  language here.
* Lahoz-Monfort et al. (2021), an empirical camera-trap detection study:
  [Empirical evaluation of the spatial scale and detection process of camera trap surveys](https://doi.org/10.1186/s40462-021-00277-3).
  Detection depends on camera placement, animal movement, and scale. This is
  why a count is paired with effort and a non-detection is not absence.
* Abrahams et al. (2023), a large Amazonian camera-trap analysis:
  [Effects of human-induced habitat changes on site-use patterns in large Amazonian Forest mammals](https://doi.org/10.1016/j.biocon.2023.109904).
  The study uses repeated occasions, trap effort, and detection probability
  across Amazonian sites. It is regional evidence about survey design, not a
  source for this crop's animal records.
* ForestScan (Chavana-Bryant et al., 2026), official Earth System Science Data
  release: [ForestScan multiscale tropical forest structure dataset](https://essd.copernicus.org/articles/18/1243/2026/index.html).
  LiDAR-derived canopy structure can describe height and vertical structure.
  It does not turn the scripted gaps here into measured logging events or
  identify fuel, moisture, or a responsible person.
* Oliveira et al. (2005), Amazon forest microclimate context:
  [Rainfall and microclimate effects in Amazonian forest structure](https://doi.org/10.1890/05-0404).
  The module uses this only as context for treating canopy openness and
  sheltered conditions as different observation settings. Its small series
  are authored values, not downloaded weather data.

The scenario may help players ask what additional field checks are needed. It
cannot establish that a fire occurred, that a gap was cut, that a sound was a
machine, or that a person caused any event at the measured film location.
