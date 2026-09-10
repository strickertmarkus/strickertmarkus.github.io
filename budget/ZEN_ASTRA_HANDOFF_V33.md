# Zen v33 — pond-integrated Meditation rocks + glowing meditation ring symbol

Starting state: `97a210c4457c658c8d97464d4c80c01909bb9ddc` (v32).
Checkpoint: `checkpoint/zen-before-pond-rocks-v33-20260910`.

## User direction

- v32 moved/shrank the rocks too much and made them look pasted onto the bamboo scene.
- Keep the asymmetric upper-rock language from v30 that looked good.
- Remove the large backing/monolith block entirely.
- Keep the lighter right-side background rocks that already look naturally integrated.
- Restore a visible waterfall that physically runs across/over the stones and lands in the pond.
- Rocks must not visually paint over bamboo; they should read as rocks emerging from water/ground.
- Add a Meditation symbol inside the circular Start CTA and give at least the symbol a warm morning-sun glow.

## Implementation

### `zen-waterfall-v33.js`

- Replaces the active v32 waterfall renderer.
- Reuses the v30 upper-rock shape language (`rear`, `flat`, `small`, `ledge`) but does **not** draw v30's continuous backing monolith.
- Formation is returned close to the v30 placement/scale instead of the tiny floating v32 cluster.
- Upper rear rock plus side stones form the source shelf.
- A shallow cavity sits between the upper stones.
- Seven animated surface-water streamlines visibly travel across the rock toward the cavity.
- The falling sheet is drawn before the two front lip stones, so the water source is physically masked by stone and cannot appear to cut through the front rock.
- Two small stone feet meet `WATER=575`; a translucent pond wash covers their lower edge so they read as emerging from the water.
- Splash/mist/ripples land on the same `WATER=575` line used by `zen-meditation-scene-v30.js`.
- The overlay punches narrow transparent channels at the known Meditation bamboo-stalk x positions (`destination-out`), revealing the already-rendered bamboo underneath. This keeps bamboo consistently in front where the formation crosses a stalk, instead of alternating depth.
- Existing pale background rocks rendered inside `zen-meditation-scene-v30.js` remain untouched.
- Safari-risk compact ternaries were expanded before activation.

### `zen-meditation-rockfall-v33.css`

- Hides the old v32 rear/front waterfall canvases.
- Styles the new single v33 waterfall canvas.
- Adds `.start-ring-symbol` using the existing Meditation `≈` glyph.
- Symbol uses warm morning-sun yellow with controlled multi-stage glow.
- Ring name/meta orders are shifted to make room for the symbol without overlapping.
- Ring diameter/position remain from repaired v32 unless later mobile screenshots suggest spacing polish.

### `zen.html`

- Stops loading `zen-waterfall-depth-v32.js`.
- Loads `zen-waterfall-v33.js` **after** `zen-interactions-v31.js`; this ordering is important so v31 creates the ring name/meta and identifies the arrow before v33 inserts the meditation symbol.
- Loads v33 CSS last with cache key `20260910-pond-rocks-v33b`.

## Do not regress

- Do not reintroduce the v30 continuous backing rock/monolith.
- Do not return to the v32 two-canvas rear/front approach: the rear layer sat behind the opaque Meditation scene canvas and disappeared.
- Do not place the v33 symbol script before `zen-interactions-v31.js`, because v31 determines its arrow using `lastElementChild`.
- Stretch is intentionally untouched by v33.
