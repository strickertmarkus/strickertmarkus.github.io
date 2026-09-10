# Zen handoff v15 — meditation polish

Current direction: keep the v13/v14 visual language and refine it, do not add detached glow objects.

## v15 goals

- Add a subtle broken warm sunlight reflection on the meditation water surface.
- Let the lower-page sun shafts drift only a few pixels with scroll where supported; no bamboo parallax.
- Smooth the visual handoff between the sanctuary hero and `Välj pass` with a short reflection/light seam, not a new card.
- Keep unlocked meditation milestones warm/yellow and make upcoming milestones cooler/quieter.
- Preserve the stronger optical compensation for the thin `◌` glyph from v14.

## Guardrails

- Stretch remains the reference for glow placement and restraint.
- Do not introduce moving rings/arcs around milestones.
- Do not increase all glow globally just to compensate for thin glyphs.
- The water reflection belongs to the scenery layer and should never overlap interactive UI.
- Respect `prefers-reduced-motion`.
- Keep Safari/iPhone as primary visual target.
