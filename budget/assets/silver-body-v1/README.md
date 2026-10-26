# Body-menu turntable stills

The exercise mannequin (`assets/silver-mannequin-v1`, `pulse-silver-material.js`) rendered standing in its rest pose with the same lights, tone mapping and tissue material as the exercise previews. No equipment, transparent background, 720×900.

- `view-0.webp` … `view-11.webp`: 30° turntable steps; 0 is the front, 6 the back.
- One still per muscle group at its stance, with that group lit as a primary muscle: front (0) for chest, shoulders, biceps, abs, quads; back (6) for back, triceps, glutes, hamstrings, calves.
- `manifest.json`: file list and the centre of each lit area in % of the frame, used for the tap points in `pulse-body-ui.js`.

Re-render the set when the mannequin, its material or the lighting changes.
