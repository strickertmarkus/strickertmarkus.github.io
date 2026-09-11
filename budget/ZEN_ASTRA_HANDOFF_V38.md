# Meditation v38 — replace floating stone stack with a connected cliff

Base: `58f80422477af3be9a63a7e675e04249409912d3`.
Checkpoint: `checkpoint/zen-before-cliff-v38`.

User approved a higher cliff with texture, stones on top/sides, and foreground stones partially occluding the waterfall, based on their line-drawing reference.

- Replaced the entire drawFormation body: a single irregular cliff silhouette runs from world y=430 through WATER=575, with broad facets, uneven strata, thin fractures and a wet central channel.
- Water spills over the open crest, rather than through a hole. Broader sheet reaches WATER=575.
- Top/side pebbles and foreground feet are deliberately ordered: cliff and cap stones, water, then near stones. Near stones mask the lower edges of the falling sheet.
- Removed ALL five legacy background rock draw statements in zen-meditation-scene-v34.js, including its 14-rock loop. These were a separate formation baked into the background. The active cliff renderer now owns all visible rocks.
- Retained v37 exact-source wave-distorted reflection, with depth derived from the taller cliff. Front bamboo still renders after the cliff. One visible scene canvas plus one bounded offscreen source.
- Retained sunlight, subtitle, ring, graph, storage and interaction behavior. Existing filenames have v38 cache keys.

Validation: syntax and whitespace; native scene renders at 320/390/1200 and reduced-motion variants; mobile images visually inspected. Single scene canvas, shared waterline and source-above-water assertions pass. No full Safari DOM test claimed.
