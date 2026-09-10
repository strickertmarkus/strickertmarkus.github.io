# Zen handoff v19 — Stretch tree + aligned mobile start area

Current production direction after v19:

- Mobile Stretch and Meditation start areas are aligned by layout, not by equal `margin-top` values. `.sanctuary` is a flex column on mobile and `.start-area` uses `margin-top:auto`, so different hero/subtitle heights no longer shift the controls.
- Stretch foreground rendering still uses the historical filename `zen-stretch-depth-v18.js`, but its contents are now the active v19 renderer. `zen.html` cache-busts it with `20260910-stretch-depth-v19`.
- The active v19 tree is intentionally more visibly stylized/organic: asymmetric trunk silhouette, broad roots, large branch shoulders, strong cel-shaded bark planes, knots and bark cuts. Do not revert to a smooth cylindrical trunk or only tiny overlay details.
- Stretch depth uses three clear visual planes: base forest, hero tree/mid foliage, and softer/larger near foliage at the edges.
- Foreground fireflies are larger and brighter than the base v3 motes; the smaller v3 fireflies remain useful as a distant depth layer.
- Meditation scenery and its waterfall are unchanged by v19.

Checkpoint before v19: `checkpoint/zen-before-stretch-depth-v19-20260910` at commit `69ee4c590f64bda2f851b5f4349befbd5705554f`.
