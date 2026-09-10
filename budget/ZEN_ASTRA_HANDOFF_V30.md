# Meditation v30 — eight refinements (2026-09-10)

Starting commit: `98e5b289b406e65db4f68886b1367809f52b680f` (Stretch polish v29).
Remote checkpoint branch: `checkpoint/zen-before-meditation-eight-refinements-20260910`.

## Scope and order

Eight individually implemented and checked improvements, each committed before the next:

1. Asymmetric beveled rocks with clipped facets, fractures and chipped highlights.
2. Raised waterfall source; continuous rock face connects the elevated source to the pond. All streams, splash and ripple centers share impactY=590. The background waterline is y=575. The obsolete background cascade draw call is removed so there is one active waterfall.
3. Move Anpassa above the selected-program label without changing CTA flow. Clamp the bank to leave a visible right margin on narrow phones. A follow-up commit corrected the 320px margin before continuing.
4. Remove dark section-edge gradients and the lower-page edge tint. Preserve the original full-width sunlight layers and hero/pond transition.
5. Darken small information labels and graph bases, retaining translucent cards and warm graph tops.
6. Vary bamboo node spacing, branch occurrence, length and angle. Skip complete leaf groups where their bounds overlap the actual hero-description rectangle; refresh on resize, kind change and font readiness.
7. Warm bamboo highlights face the shared light source. Cool water reflections and moving highlights are clipped to stone surfaces. Subtle caustics remain within the upper pond.
8. Selected meditation cards show a decorative check and short warm border reflection. Existing aria-pressed remains the accessible selection state. Stretch card markup receives no extra marker.

## Active files

- `zen-meditation-scene-v30.js` replaces the active v8-clean meditation background reference.
- `zen-waterfall-v30.js` replaces the active v28 waterfall reference.
- `zen-meditation-refine-v30.css` loads last.
- `zen.js` only adds the meditation-only decorative card marker; its cache key is updated in zen.html.
- Legacy source files remain for reference. Stretch v29, its canonical tree, training, timer/model/store and record logic are unchanged.

## Scene invariants

Native coordinate space is 1200x900; cover-scale and crop must match between scene and waterfall. Mobile waterfall x is clamped against the actual cropped right boundary. Pond begins at world y=575 and landing center is y=590 on mobile and desktop.

Keep the drawing order: rear rock bank/cavity, falling streams, foreground lip stones/overhang, landing spray and ripples. Rock detail must remain clipped to its irregular contour. Reduced-motion and inactive/offscreen lifecycle behavior is retained.

## Validation and limits

- Per-step source checks; actual Canvas modules rendered using native Canvas at widths 320, 390 and 1200, with scene images visually inspected for geometry, detail and framing.
- Narrow-phone geometry checked additionally at 360 and 430. The 320px margin issue was corrected before step 4.
- Landing assertions confirm impactY >= waterline; canvas allocation remains within existing bounds.
- Text #294e44 against sampled design background colors gives contrast 4.93:1 to 5.52:1. This is a color calculation, not a full-page screenshot measurement.
- Actual card markup expression evaluated for both kinds and both selected states; one aria-pressed=true per kind, decorative markers only for meditation.
- JavaScript syntax checks and all 12 existing tests in budget/tests/zen.test.cjs pass. HTML references and diff whitespace checked.
- Full browser preview was unavailable for this static project. CSS layout, text exclusion zone and animation feel still warrant checking in the live mobile browser; native scene renders do not verify the full DOM layout.
