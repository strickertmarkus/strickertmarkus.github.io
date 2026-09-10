# Zen / Meditation visual handoff — v13

## Base
- Repo: `strickertmarkus/strickertmarkus.github.io`
- Production page: `budget/zen.html`
- v12 checkpoint/base before this polish: `1befa7014e00b01cc11022bd415cf49b72efbe6a`

## v13 intent
This revision fixes three visual issues seen on iPhone:
1. The Meditation subtitle sat directly on top of bamboo leaves and lost readability.
2. The waterfall/rock bank looked like small stones stacked on one oversized rock and was partly hidden by controls.
3. The lower page inherited too little of the hero's contrast and directional morning-light language.

## Files
- `budget/zen-waterfall-v13.js`
  - active waterfall/rock renderer for Meditation
  - two coherent rock masses only; no pebble stack
  - waterfall starts from a visible dark cleft between slabs
  - mobile position is higher and farther right to keep it clear of selected routine / start button
  - lower rock edge is submerged by a water veil
- `budget/zen-layout-polish-v13.css`
  - makes `andning & närvaro.` readable using compact sunlight glow + a nearly invisible blurred clear lane
  - strengthens lower-page directional sunlight and section contrast
  - keeps the effect atmospheric, not card-like
  - explicitly hides cached `.zen-waterfall-v12`
- `budget/zen.html`
  - should load v13 CSS after v12 and v13 waterfall instead of v12 waterfall

## Visual rules to keep
- Stretch remains the reference for glow placement/intensity.
- Meditation uses the same glow hierarchy but warm sunlight yellow (`#f5dfa0` family).
- Never add detached flying light arcs/rings.
- Do not make whole cards glow.
- Subtitle needs readable separation from procedural leaves without looking like a pill/button.
- Rock/waterfall area must read as geology first: coherent slabs, a real cleft, water emerging from that cleft, then mist/ripples at the pond.
- Bamboo may sit behind rock masses, but it must not visibly pass through them.
- Lower-page sunlight should be visible on mobile, but remain broad/low-opacity and directional rather than decorative objects.

## Lower-page v12/v13 effects
The lower page is intentionally built from subtle CSS layers rather than an image/background scene:
- broad diagonal sunlight gradients in `#home-view::before`
- slightly cooler side depth
- faint glass-like luminance across `.page-section`
- short warm catches on section top borders
- small broad sunlight pools in Ritual / Statistics / Milestones / History
- slightly darker text and dividers for contrast

v12 was intentionally very low opacity and was almost invisible on some iPhones. v13 raises these values modestly while preserving the same design language.

## Do not re-enable
- `zen-waterfall-v9.js`
- `zen-waterfall-v12.js`
- old meditation garden/v4 bamboo overlays

The active Meditation background should remain the clean v8 scenery plus the single v13 waterfall canvas.
