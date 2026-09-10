# Zen handoff v22 — classic Stretch tree + Meditation layout restore

Current direction after visual comparison on mobile:

- Stretch: use the original v3 tree structure from `zen-scene-v3.js` as the canonical tree geometry.
- Do not redraw/replace the trunk with the v20 tree. `zen-stretch-depth-v18.js` remains loaded for history but its canvas is hidden by v22 CSS.
- Keep the newer atmosphere: stronger directional light, edge depth, foreground leaves and larger glowing fireflies via `zen-classic-tree-v22.css` + `zen-classic-tree-v22.js`.
- The original forest/tree is color graded with more saturation, contrast and darker shading, but structure stays unchanged.
- The temporary v21 Original/Ny comparison toggle has been removed now that the original structure was chosen.

Meditation mobile:

- Restore the pre button-height-experiment v17 layout rhythm.
- `body[data-kind=meditation] .sanctuary` is block layout with base 675px min-height.
- `.start-area` is back to `margin-top: 138px` on mobile rather than the later shared flex bottom-anchor.
- Stretch keeps its current v20 start-area anchor.
- Stone + waterfall + recessed mouth remain one composition; v22 scales the two waterfall canvases together to 90% on mobile so the stone is less dominant without breaking alignment between rock, hole and water.

Do not reintroduce a global shared mobile start anchor unless specifically requested; it was the source of the later Meditation composition drift.
