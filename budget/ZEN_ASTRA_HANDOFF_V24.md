# Zen handoff v24 — Meditation rock/waterfall integration

Current intent:

- Keep v23 Stretch sunlight fade unchanged.
- Meditation rock/waterfall is now being consolidated into a single renderer rather than layered v13 + v16 canvases.
- `zen-meditation-rock-v24.css` explicitly hides old `.zen-waterfall-v13` and `.zen-waterfall-mouth-v16` canvases.
- `zen-waterfall-v24b.js` is the active Safari-safe renderer.

Meditation visual rules:

- Rock should be visibly smaller than v22/v23 and must fit fully inside narrow iPhone viewports; do not clip the right edge.
- Mobile rock center is pulled left from the old x=875 placement to about x=818 in world coordinates.
- Opening should be smaller and deep green/grey, not near-black.
- Water is visible inside the recessed opening first, then curves over the lower stone lip and only then becomes a vertical waterfall.
- Use a small number of distinct streams at the top (7 mobile), widening modestly toward the water instead of a white curtain.
- Stone rim is drawn after the stream start to create occlusion so water appears to come from inside the rock.
- Keep warm morning-light highlight on the upper rock surface and cooler shadow below.
- Splash mist/ripples remain subtle.
- Do not change the restored Meditation v17 button placement in `zen-classic-tree-v22.css`.

The earlier `zen-waterfall-v24.js` draft contains a Safari syntax mistake and must not be loaded. Use `zen-waterfall-v24b.js` only.
