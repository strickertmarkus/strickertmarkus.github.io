# Pulse Observatory — canonical composition

`budget/exercise.html` is the only production training route and opens Pulse Observatory as its default overview presentation. Compact is an alternate presentation of the same dashboard/runtime in that document.

## Production-owned file

- `observatory.css` — the Observatory composition and visual identity used directly by the canonical `budget/exercise.html` route.

The shared overview adapter/material lives in `../pulse-environment/environment.js` and `../pulse-environment/environment.css`. Weekly orbit behavior is owned by the canonical `training-week-orbit.js/css` files on the main training route.

## Retired standalone preview

`exercise.html` is now only a legacy redirect to `../exercise.html`, preserving query parameters such as `?user=maja` and hashes for old bookmarks.

The standalone Observatory shell and the separate Observatory/Reactor live-session comparison skin were retired in Training Observatory migration Checkpoint 9. Git history/checkpoint refs remain the archive of those designs.

Do not rebuild an independent Observatory page or session runtime in this directory. Further asset consolidation belongs to the Release V1 cleanup plan.
