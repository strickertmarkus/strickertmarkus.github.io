# Illustrated muscle explorer — 2026-10-24

The Markus/Maja guide uses ten independently composed illustrations in
`budget/assets/atlas-art-v1/`. These replace the baked snapshots of the old 3D model.
The Living Anatomy layout, exercise studio and bottom navigation are preserved.
All ten groups have a thumbnail; swiping the main image selects the next group.

`manifest.json` owns the image, zoom and focal point for each group. The still viewer
crossfades decoded images and zooms 6–8% over 1.3 seconds, respects reduced motion,
cancels stale loads, and provides an unzoomed composition through “Hela bilden”.
There is no looping camera animation. The SVG is an image-load failure fallback.

## Artwork provenance

Generated with built-in image_gen; optimized to 1024px WebP quality 86.
Style reference: approved silver translucent chest concept, revised with a neutral
hairless sculptural head. This is illustration, not a medical reference asset.

Prompt set: premium fitness anatomy illustration; translucent silver-white anatomy,
fine silky muscle fibers, glowing white contours, coral-red selected muscles,
almost-black charcoal background. Athletic adult sculpture, neutral hairless face
when visible; no text, UI, labels, skeleton, organs or polygon artifacts. Square
close-up with room for a modest zoom. Subject per file:

- chest: three-quarter upper torso; pectorals highlighted
- shoulders: upper body; deltoids highlighted
- back: rear upper torso; back muscles highlighted
- biceps: flexed arm close-up; biceps highlighted
- triceps: rear arm close-up; triceps highlighted
- abs: lower chest to pelvis; abdominal muscles highlighted
- quads: anterior thighs; quadriceps highlighted
- glutes: rear three-quarter pelvis; gluteal muscles highlighted
- hamstrings: rear thighs to knees; hamstrings highlighted
- calves: rear three-quarter lower legs; calf muscles highlighted

## Preserved model

`pulse-exercise-guide-3d.html` and `pulse-muscle-atlas-3d.js` are unchanged.
See `pulse-atlas-3d-checkpoint.md` for the reusable 3D checkpoint and licenses.
Exercise animations are a separate renderer and are unchanged by this update.

## Verification

`scripts/verify-atlas-stills.cjs`: WebKit 390px, 320px, desktop, actual zoom phases,
all ten images, rapid selection, reduced motion, camera controls, image replacement,
no old atlas requests, exercise studio entry. Screenshots uploaded by the atlas workflow.
