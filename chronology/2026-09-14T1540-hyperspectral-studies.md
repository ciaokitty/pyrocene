# From forest structure to forest content

The frozen LiDAR film ends at a deliberate limit: structure alone does not identify fuel. The next experiments ask whether imaging spectroscopy can fill part of that gap without turning a colored raster into a claim it cannot support.

The strongest available fire comparison came from an official NEON and NASA workflow at Soaproot Saddle in California. Two adjacent 1 km airborne hyperspectral tiles were acquired at 1 m resolution in June 2024. One lies inside the 2020 Creek Fire footprint and one outside it. They contain 426 measured reflectance bands. The same workflow supplies a documented route from reflectance to estimated canopy water content.

The strongest invasive-species evidence came from Mudumalai Tiger Reserve in India. Kishore et al. used AVIRIS NG plus field spectra to publish separate presence maps for Lantana camara and Chromolaena odorata. Rather than recreate those labels from an unavailable training set, the invasive candidate uses cropped published maps and identifies them as model outputs.

Three 36-second silent treatments now test the narrative:

- move directly from LiDAR structure to canopy water content;
- compare real fire-footprint and adjacent unburned spectra; and
- show how field-validated hyperspectral analysis can identify invasive material that LiDAR cannot.

All three begin by re-rendering the final Amazon point cloud as a clean bridge. They do not decode, alter or overwrite the frozen 56-second LiDAR master. Their common interface uses the LiDAR film's small header, compact legend, typed location and one sentence at a time.

The first review set was rendered as three 36-second 1080p masters. Every word added by the renderer, including legend and panel copy, is editable in one JSON file. Each film passed a complete frame decode and a direct contact-sheet review. The gallery on port 8022 exposes the frozen LiDAR final first and the three candidates below it.

The evidence boundary remains strict. The tile comparison does not isolate fire as the only cause. Canopy water is not direct fuel moisture. Species identity is not fire behavior. A later final cut must combine the useful pieces without erasing those distinctions.

## Evidence

- [`stage2/simulation/codex/hyperspectral/README.md`](../stage2/simulation/codex/hyperspectral/README.md)
- [`stage2/simulation/codex/hyperspectral/INDEX.md`](../stage2/simulation/codex/hyperspectral/INDEX.md)
- [`stage2/simulation/codex/hyperspectral/captions.json`](../stage2/simulation/codex/hyperspectral/captions.json)
- [`stage2/simulation/codex/hyperspectral/releases/candidates-v1.json`](../stage2/simulation/codex/hyperspectral/releases/candidates-v1.json)
