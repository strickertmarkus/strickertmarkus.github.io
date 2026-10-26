# Own-render muscle map

`body-front-back.webp` is the exercise mannequin (`assets/silver-mannequin-v1`, `pulse-silver-material.js`) rendered standing with every muscle group lit as a secondary muscle, under darker rim lighting, then colour-graded toward polished titanium. 1448 × 1086 sheet: front (0) on the left, back (6) on the right, on #090d13.

`map.json` holds the tappable regions in the 724 × 1086 half coordinates. Each region is traced from a render with only that group lit, so the outlines follow the mannequin's own muscle masks. It is the counterpart of the generated artwork in `assets/muscle-map-v1` and is used by the `?ui=gym&figur=egen` preview.
