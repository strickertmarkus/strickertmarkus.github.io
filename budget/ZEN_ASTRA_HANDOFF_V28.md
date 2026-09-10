# Zen handoff v28 — Meditation physical waterfall polish

## Scope
Meditation-only visual refinement. Stretch remains on the clean v27 lighting state.

## Active files
- `zen-meditation-polish-v28.css`
- `zen-waterfall-v28.js`
- `zen.html` now loads those assets with cache key `20260910-meditation-depth-v28`.

## Meditation changes
- Waterfall is drawn before the two foreground lip stones; this fixes the previous illusion that water cut through the front rock.
- Two foreground ledge stones frame a real open channel around the waterfall.
- Overhang/lip is drawn after the water source to occlude the top edge and make the source read as a recess.
- Rock silhouettes are more asymmetric and less bubble-like.
- Water source shifts slightly left inside the rock composition.
- Front streams are wider/brighter; rear streams stay thinner/dimmer for depth.
- Impact point moves upward and has stronger inner ripples, soft outer rings, droplets and mist.
- Bamboo nearest the pond receives a very subtle cyan water reflection.
- `Anpassa` gets cleaner negative space by keeping foreground rock mass away from the left side of the composition.
- Meditation `Starta pass` is denser/less transparent; disabled state remains visibly disabled but no longer looks washed out.
- The long hero sentence gets only a feathered local veil to reduce leaf interference; no pill/card background.

## Layer order to preserve
`bamboo reflection -> rear stones -> cavity/internal water -> waterfall -> foreground lip stones/overhang -> splash/ripples`

This layer order is intentional. Do not move the waterfall after the foreground lip stones, because that recreates the 'water falling through the front rock' problem.
