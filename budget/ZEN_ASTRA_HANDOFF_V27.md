# Zen handoff v27 — Stretch restore + Meditation rock polish

## Stretch

The broad light bridge introduced in v23/v25/v26 was visually wrong on mobile. v27 restores the clean Stretch appearance shown in the preferred reference screenshot.

- `#home-view::before` broad Stretch light is disabled.
- `.ritual-section::before` and `::after` broad bridge effects are disabled.
- The only continuation is local to the first `Helkropp` `.ritual-choice`.
- That local beam sits above the translucent card fill but below all card text/icons and fades before the bottom of the card.
- Do not reintroduce a page-wide or section-wide Stretch light wash unless explicitly requested.

## Meditation

The active renderer remains `zen-waterfall-v26c.js`, but its implementation is now v27 and the cache key in `zen.html` is `20260910-meditation-polish-v27`.

Changes:
- more asymmetric rock silhouettes
- slightly smaller rock mass shifted right for more negative space around `Anpassa`
- waterfall source moved left within the formation, preserving visual focus
- source lowered into the front rock
- filled stone overhang with dark underside physically occludes the water source
- rear water strands are thinner/darker; three front strands are brighter for depth
- impact point lifted upward so splash/ripples are visible above the start button
- two stronger inner ripples plus softer outer ripples
- per-rock reflection/streamline curves are clipped to each rock and use warm/cool variation
- subtle cyan water reflection added to nearby submerged bamboo stems

## Checkpoint

Before v27:
`checkpoint/zen-before-stretch-restore-meditation-v27-20260910`
starting at `b40f874d826d1e91417aeeca7f1c26edf4ffe02f`.
