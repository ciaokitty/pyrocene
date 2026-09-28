# Expanded measured TLS bank

`tls-expanded.json` is an optional close-up bank prepared from existing public
terrestrial-lidar artifacts. It contains 11 disjoint spatial crops from three
source plot identities: four from Paracou FG6c2, four from Paracou FG5c1, and
three supplied Nouragues NOU-11 PCD tiles. Every sibling `.bin` file contains
little-endian float32 triples in the order `(x, height, z)`, with one crop's
horizontal median subtracted as its local origin. Heights are retained from
the source normalization; the Nouragues PCD crops use the documented 0.15th
percentile scanner-Z baseline.

The Paracou artifacts are already approximately 10 m × 10 m preprocessed
samples, so the four Paracou records per plot are disjoint subsets of those
samples rather than additional independent surveys. The Nouragues files are
three real 5 m tiles from a public one-hectare TLS record; they are not a
complete hectare export. No geometry is simulated, warped, rotated, jittered,
or procedurally filled. The script records source artifact hashes, crop bounds,
point indices for anchors, and measured-return metadata.

The source datasets are French Guiana practice plots and are not co-located
with the Stage 4 Amazon scenario. Returns are structural observations, not
individual plant identities, species, fuel, invasive, or fire-risk labels.
Point counts across these source artifacts must not be interpreted as a
quantitative cover or density comparison. The optional bank is therefore a
variety and provenance aid for close-up exploration, not a botanical or
ecological survey result.

## Rebuild

With the existing render build environment:

```text
/home/beeps/.cache/pyrocene-render-venv/bin/python \
  stage4/prepare_tls_expanded.py
```

The default output is `/mnt/seagate/models/pyrocene/stage4/assets`. The
command fails if any source artifact, PCD header, crop, or generated record is
missing or malformed. `--output` and `--max-points` are available for a local
build; the committed/default bank uses at most 120,000 points per crop.

Sources:

- ForestScan Paracou FG6c2, DOI `10.5285/931973DB09AF41568853702EFE135F29`.
- ForestScan Paracou FG5c1, DOI `10.5285/656AC8EE1D42443F9ADDCBCE28C1B137`.
- Nouragues NOU-11 terrestrial lidar, DOI `10.5281/zenodo.4661301`.
