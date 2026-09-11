# Meditation v35 — final water/stone details

Base and rollback point: `29ebda7bcee2497afec1977619eea742ea8a576e`.

Only the active waterfall renderer and its cache key change, plus this handoff.
- Replace the dark elliptical outlet with a shallow irregular crevice.
- Reduce repeated rock highlight lines and vary their lengths.
- Replace the evenly spaced curtain of bright strands with a translucent water sheet and fewer uneven strands.
- Add a soft local contact shadow at the stone feet and small impact flecks at WATER=575.
- Retain the single scene canvas, real foreground bamboo, ring, graph, interaction behavior and all existing scene lifecycle controls.

Validation: syntax and whitespace checks; actual native Canvas scene render at 320, 390 and 1200px, plus reduced-motion renders. Shared waterline/source and single-canvas assertions pass. Scene images inspected; no full Safari DOM test claimed. No model/store/interaction changes.
