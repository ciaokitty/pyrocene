# The second point cloud was missing, so we did not make one up

The next LiDAR film needed to show structural change after a real rainforest fire. Pontes-Lopes and colleagues provided the right case: a September 2015 understory fire in the Central Amazon, followed by airborne surveys in May 2017 and May 2018. The paper identifies the repeated flight-line pairs as `T_0638`→`T_1081` and `T_0639`→`T_1080`.

The useful part of the archive was found without downloading all 160 GB. The selective fetcher reads each remote ZIP directory and extracts individual LAZ members by byte range. It found and downloaded the 2017 `NP_T-0638.laz` strip. The public EBA deposits do not contain either cited 2018 strip—not in the two Amazonas bundles, and not in any of the other state archives we indexed.

That changed the film rather than lowering its evidence standard. The finished cut combines three things that really exist:

- 700,000 measured returns sampled from a 900 m crop of the May 2017 flight;
- the authors' official Landsat fire-scar raster and 22 repeated-LiDAR analysis tiles; and
- their published 2017→2018 burned-forest estimates: mean canopy height −6.2%, aboveground carbon density −21.2%, and gap cover 8.7%→10.4%.

The last card names the missing-data boundary on screen. It does not morph the 2017 points, synthesize a 2018 forest, or pretend that the post-fire survey records ignition. A prepared pair renderer is waiting for the real `T_1080/T_1081` files if they are later released.

All visible copy—including source labels, legend terms, metric names and the missing-data statement—now lives in one editable JSON file. One shell command rebuilds all three films with a new filename tag, leaving reviewed masters untouched.

## Evidence

- Editable copy: [`stage2/simulation/codex/lidar/captions.json`](../stage2/simulation/codex/lidar/captions.json)
- Reproduction and method: [`stage2/simulation/codex/lidar/README.md`](../stage2/simulation/codex/lidar/README.md)
- Source audit and evidence boundaries: [`stage2/simulation/codex/lidar/RESEARCH.md`](../stage2/simulation/codex/lidar/RESEARCH.md)
- Resource index: [`stage2/simulation/codex/lidar/INDEX.md`](../stage2/simulation/codex/lidar/INDEX.md)
- Public raw data: Ometto et al., EBA airborne LiDAR, DOI `10.5281/zenodo.7636454`
- Study and published estimates: Pontes-Lopes et al., DOI `10.1016/j.foreco.2025.123332`
- Authors' analysis package: DOI `10.5281/zenodo.17625420`

## What remains

The strongest future version is a real matched 2017/2018 point-cloud wipe. That must wait for the cited 2018 strips or another documented paired dataset; absence in the current public archive is not permission to manufacture them.
