# Preserved Markus/Maja silver anatomy model

Accepted visual checkpoint: 2026-10-23, commit `20e8da153f2929ba7d6e2fa96ae0d9a0aaa50e2a` (v14).

- Open `budget/pulse-exercise-guide-3d.html` to use the preserved interactive version.
- `budget/pulse-muscle-atlas-3d.js` is retained unchanged, including the silver Fresnel shell, anatomical muscle groups, warm active muscle material, and depth prepasses.
- The image atlas on `budget/pulse-exercise-guide.html` uses WebP renders of this model, with 12 neutral angles and front/back highlighted views for each group.
- Original assets: pinned Z-Anatomy/BodyParts3D muscle and skin GLBs; their URLs and license attribution remain in the original source/page. Rendered derivatives retain the attribution and applicable ShareAlike terms.

Future exercise animation: reuse these materials, geometry and muscle classification. This checkpoint is a static anatomical mesh viewer, not a rigged or exercise-animated character; articulation/rigging and movement validation remain separate work.

The experiment's reproducible rendering script is on branch `codex/atlas-stills`, in `scripts/bake-atlas-stills.cjs`. The still-image viewer needs only local WebP assets, not WebGL.
