# Zen v17 handoff

Current direction after v16:

- Meditation keeps the v16 layered bamboo / recessed waterfall work.
- Stretch now gets a matching sense of depth without copying bamboo: a separate near-canopy canvas (`zen-stretch-depth-v17.js`) adds foreground branches/leaves at the outer edges, with slightly stronger wind motion than the base forest layer. The center remains clear for copy.
- `zen-depth-spacing-v17.css` adds subtle foreground shade/light planes for Stretch and slightly increases forest contrast/saturation.
- Hero spacing is tighter for both Stretch and Meditation. On mobile, the sanctuary is nudged upward, the kind-switch/title spacing is reduced, and the existing large scene gap before the selected routine is preserved (150px base -> 138px) rather than collapsed.

Guardrails:

1. Do not remove the base `zen-scene-v3.js`; Stretch still depends on it.
2. Keep `zen-stretch-depth-v17.js` Stretch-only. It must render transparent/no content in Meditation.
3. Keep foreground leaves near screen edges; do not cover the main title/description lane.
4. Preserve `prefers-reduced-motion` behavior.
5. Do not reduce the mobile start-area gap aggressively; it is used as scenery breathing room.
6. Any later spacing tweaks should be made in `zen-depth-spacing-v17.css`, not by changing session logic or ZenModel/ZenStore.

Checkpoint before v17:

`checkpoint/zen-before-stretch-depth-spacing-v17-20260910` -> `9fcd22020688f11ea3feca84edf6c7d531e194e3`
