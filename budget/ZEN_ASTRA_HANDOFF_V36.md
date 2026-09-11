# Meditation v36 — depth and composition

Base/checkpoint: `7c208aeeb744ee543aad952160c6d61f3b4c320d`, branch `checkpoint/zen-before-depth-v36`.

Implements the six approved image-review changes:
1. Upper stone height reduced about 15%; wider smaller supports. Rear stone shading is lighter and atmospheric; a local overlap shadow separates the shelf from foreground lips.
2. Foreground stalk previously based at x=825 moves to x=790. Its geometry, leaves, water crossing and ripple position all derive from the same stalk record.
3. Stable irregular node heights plus sparser branch occurrence break the horizontal leaf bands; branches remain attached to nodes.
4. Leaf exclusion zones now include the hero title and category switch, as well as the description. They recalculate from DOM rectangles on resize, kind change and font readiness.
5. Short, faint reflection uses the actual stone shapes, vertically compressed and clipped into wave strips below WATER=575. Movement respects reduced motion.
6. Morning-sun yellow Starta pass label with local glow and soft dark text shadow. Arrow moved inward. New final stylesheet zen-meditation-finish-v36.css.

Active filenames remain zen-waterfall-v34.js / zen-meditation-scene-v34.js; cache keys bumped to v36. The single Canvas depth order remains intact. No changes to graphs, ring dimensions, training, storage, timers or interactions.

Checks: syntax, whitespace, native Canvas renders at 320/390/1200 and reduced-motion variants. Mobile scene renders visually inspected; geometry assertions retain one scene canvas and WATER=575 impact. CSS/DOM exclusions reviewed in source; no full Safari layout verification claimed.
