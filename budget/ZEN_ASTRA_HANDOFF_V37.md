# Meditation v37 — matching wave-distorted reflection and sunrise accents

Base: `9f0277144c9e8cdb625c2d45900eb31e1f90dd1d`.
Checkpoint: `checkpoint/zen-before-water-reflection-v37`.

The prior reflection redrew only three stones with fixed bands, so it did not match the full formation. Now the complete formation is drawn to a bounded 1200x640 offscreen canvas. The visible formation and its reflection use that exact source. The formation is clipped at WATER=575; reflected source strips sample upward from that line and appear downward below it, with 0.58 vertical compression. Two wave frequencies displace individual strips horizontally; displacement increases with distance from the shore and opacity fades with depth. Reduced motion uses a static distorted reflection. Actual splash and ripples render afterward at the waterline, keeping them crisp. Contact shading is slightly stronger.

Sun disk, local halo and beams now use warmer sunrise yellows. The start label and ring have broader local glow; the hero subtitle matches the morning-sun family. No global sun variable change, so graph colors remain intact. Styles remain meditation-scoped.

Checks: JS syntax, diff whitespace, native Canvas renders at 320/390/1200, reduced-motion renders, mobile scene visually inspected. Existing source/impact and single visible canvas assertions pass; the additional reflection source is offscreen and bounded at 768,000 pixels. This validates scenery, not the complete Safari DOM layout. Active v34 JS/v36 CSS filenames retain their roles with v37 cache keys.
