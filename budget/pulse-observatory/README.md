# Pulse Observatory — canonical composition

`budget/exercise.html` is the only production training route and opens Pulse Observatory as its default overview presentation. Compact is an alternate presentation of the same dashboard/data/session runtime in that document.

## Production presentation asset

- `observatory.css` — Observatory composition, semantic visual states and identity styling used directly by the canonical `budget/exercise.html` route.

Shared overview material remains in `../pulse-environment/environment.css`, and the orbit presentation remains in `../training-week-orbit.css` until the final Release V1 CSS consolidation.

## Checkpoint 10 JavaScript ownership

The canonical JavaScript owner for the Observatory dashboard is now `../exercise-dashboard.js`. It owns:

- Compact ↔ Observatory presentation switching;
- Observatory dashboard/context adaptation and semantic presentation state;
- Next Workout presentation/delegation;
- the linear ↔ Observatory weekly-orbit interaction over the canonical seven day nodes.

The historical `../training-overview-mode.js`, `../pulse-environment/environment.js` and `../training-week-orbit.js` paths are now temporary compatibility loaders only. They must not regain feature behavior and are scheduled for removal from the production loader during the Release V1 cutover.

The dashboard owner does not implement a second live training/session runtime. Starting from either Compact or Observatory delegates to the same canonical `exercise.html` session implementation.

## Retired standalone preview

`exercise.html` in this directory is only a legacy redirect to `../exercise.html`, preserving query parameters such as `?user=maja` and hashes for old bookmarks.

The standalone Observatory shell and the separate Observatory/Reactor live-session comparison skin were retired in Training Observatory migration Checkpoint 9. Git history/checkpoint refs remain the archive of those designs.

Do not rebuild an independent Observatory page or session runtime in this directory. Further loader/CSS consolidation belongs to the Release V1 cleanup plan.