# Zen handoff v25 — Meditation layered rock streamlines + Stretch continuous sunlight

Current visual direction:

## Meditation
- Active waterfall renderer is `zen-waterfall-v25.js`.
- v24/v13/v16 waterfall canvases are explicitly hidden by `zen-waterfall-v25.css`.
- Composition returns toward the preferred v23 placement, but pulled slightly inward on mobile to avoid clipping.
- Use multiple overlapping coherent rock forms: rear/main rock + smaller foreground/side rocks. Avoid one monolithic stone and avoid a pile of unrelated circles.
- Keep warm morning highlight on upper rock planes and cooler shadow underneath.
- Keep the recessed opening, but do not make it near-black or the main focal point.
- Water must be visible inside the opening, bend over the stone lip, then separate into animated strands.
- Thin animated streamlines/reflection contours belong on the rock surfaces.
- The landing point must be visible: splash mist, droplets and 5 expanding ripples around the water impact.
- Mobile base coordinates in v25: fallX 852, lipY 430, waterY 538. These are intentionally close to v23 but safer from right-edge clipping.

## Stretch
- The old v23 ritual-only light bridge is disabled in v25.
- `#home-view::before` now carries one continuous sunlight field through the hero and into the Välj pass section, fading much later.
- The first `.ritual-card` also gets a faint internal continuation of the same light so the translucent card itself does not visually cut the beam.
- Do not reintroduce a hard section-local beam boundary around the first card.

Checkpoint before v25:
`checkpoint/zen-before-rock-streamlines-v25-20260910` -> `503721df910abdfba6cfed7003c657dcdacfb12d`
