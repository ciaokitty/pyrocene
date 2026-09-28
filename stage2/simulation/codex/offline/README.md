# Offline film prototypes

This renderer turns a completed Pyrocene event log into a deterministic MP4.
It focuses on the largest recorded fire and offers three visual treatments with
identical timing and captions: `point-cloud`, `documentary`, and `hybrid`.

The log remains authoritative. The renderer animates only recorded fire waves,
burned cells, health and board states. Decorative particles and procedural
audio are seeded from the game seed.

Example:

```bash
python render_prototypes.py \
  --log ../../../sample-game.json \
  --variant point-cloud \
  --output /mnt/seagate/videos/pyrocene/point-cloud.mp4
```

The hybrid additionally accepts `--base-plate` and `--fire-plate`. A JSON
manifest is saved next to every MP4.

See [INDEX.md](INDEX.md) for the reviewed files, checksums, plate provenance and
scientific-model references. See [../VNEXT.md](../VNEXT.md) for the proposed
combined production architecture and [../RESEARCH_BRIEF.md](../RESEARCH_BRIEF.md)
for the real-fire and forward-simulation research prompt.
