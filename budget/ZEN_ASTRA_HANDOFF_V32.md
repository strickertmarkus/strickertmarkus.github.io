# Zen v32 — layered waterfall depth + repaired Meditation start ring

Checkpoint before this iteration:
`checkpoint/zen-before-water-depth-ring-v32-20260910` -> `607a4c894383a568358b135c827b06f4c3ba0ae8`

## Why v32 exists

The v30 rock/waterfall renderer drew one continuous backing rock beneath the smaller asymmetric rocks and the entire waterfall canvas sat on top of the Meditation bamboo canvas. On mobile this produced an apparently pasted-on stone formation and inconsistent depth against bamboo. The v31 circular Start CTA also used overlapping absolute text positions and broke badly for names such as `Kort meditation`.

## Waterfall / rocks

Active renderer: `zen-waterfall-depth-v32.js`.

- `zen-waterfall-v30.js` is no longer loaded by `zen.html`.
- v32 creates two canvases around the existing `.landscape-meditation-v8` canvas:
  - `.zen-waterfall-rear-v32` is inserted BEFORE the Meditation scene, so its rear rock shelf and main falling water remain behind all foreground bamboo.
  - `.zen-waterfall-front-v32` is inserted AFTER the Meditation scene, so the small lip rocks, physical overhang, splash and nearest ripples sit in front.
- This gives each rock a consistent depth instead of a single rock edge appearing both behind and in front of bamboo.
- The large vertical backing monolith from v30 was removed. The formation is now a rear asymmetric shelf plus three smaller front/lip stones.
- Water first travels as a thin film over the rear rock surface, bends over the lip, then falls toward the pond. The front overhang masks the source so the flow visually comes from inside/over the stone rather than through it.
- Pond waterline is canonically `WATER=575` (same as the Meditation scene). v32 adds a soft horizontal shimmer exactly there plus moving small highlights; landing mist/ripples are centered on the same line.
- Colors retain the current warm-morning-light + pale jade/cyan water treatment.

## Meditation Start ring

Active override: `zen-meditation-depth-ring-v32.css`, loaded last.

- The ring is reduced to ~154 px on mobile.
- Internal content is laid out with flex, not overlapping absolute text layers.
- Order is: `STARTA PASS` -> selected routine name -> duration/guidance metadata.
- Routine name is one line with overflow protection so `Kort meditation` / `Guidad andning` cannot collide with metadata.
- Arrow remains small in the lower-right of the circle.
- Existing v31 builder/card interactions remain unchanged.

## Load order

`zen.html` now loads:
- `zen-meditation-scene-v30.js`
- `zen-waterfall-depth-v32.js`
- canonical `zen.js`
- `zen-effects-v4.js`
- `zen-interactions-v31.js`
- v30 CSS
- v31 CSS
- `zen-meditation-depth-ring-v32.css` LAST

Stretch files and Stretch layout were not changed in v32.
