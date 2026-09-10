# Zen handoff v26 — Meditation rock polish + Stretch light continuity

Current active Meditation rock/waterfall renderer:
- `zen-waterfall-v26c.js`
- rendered canvas class: `.zen-waterfall-v26`
- `zen-polish-v26.css` hides older v24/v25/v13/v16 rock/waterfall canvases.

Meditation v26 visual direction:
- Keep the v25 multi-rock composition, but make it about 10–12% smaller on mobile.
- Shift the whole group slightly right while staying fully inside the iPhone crop.
- Preserve 3–4 coherent stones instead of one monolithic rock.
- Rear rock has warmer top light; front rock has darker/cooler underside for layer separation.
- Stream/reflection lines are short and local to each rock rather than long lines spanning the whole formation.
- Recessed source is lower and smaller; water is visible inside before folding over the lip.
- Cascade starts narrow, then separates lower down.
- Landing should be readable: droplets + mist + two brighter inner ripples + softer outer ripples.
- Preserve negative space around `Anpassa`; avoid moving the whole start-area again.

Stretch v26:
- The previous v25 light field remained visually clipped by the first `Helkropp` card on mobile.
- v26 therefore places a continuation beam on `.ritual-section::before` above translucent card surfaces, while text/icons are explicitly layered above that beam.
- This is intentional: the light should visibly cross the first pass card and then fade, not stop at its border.
- The older first-card pseudo glow is disabled to avoid a doubled or misaligned light patch.

Do not reintroduce a separate opaque first-card light patch; maintain one continuous directional light path from hero into Välj pass.
