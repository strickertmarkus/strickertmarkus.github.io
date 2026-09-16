# Pulse environment — canonical shared training presentation

`budget/exercise.html` is the only production training route.

This directory no longer contains a standalone Pulse Reactor application. The former Reactor page was used as a visual/interaction reference during the Observatory migration; its useful weekly-orbit interaction is now part of the canonical training dashboard.

## Production presentation asset

- `environment.css` — shared Observatory overview, records, log and editor presentation used by `budget/exercise.html`.

## Checkpoint 10 JavaScript ownership

`environment.js` is **no longer an Observatory behavior owner**. Checkpoint 10 moved the surviving Observatory adapter/state/Next Workout behavior into `../exercise-dashboard.js`, together with Compact/Observatory mode switching and weekly-orbit behavior.

The current `environment.js` file is only a temporary compatibility loader because the existing page shell still references the historical path. It loads `../exercise-dashboard.js` once and contains no workout, dashboard, timer or persistence implementation of its own. The compatibility path is scheduled for removal during the final Release V1 loader cutover.

`exercise-dashboard.js` remains presentation-only with respect to live workouts: it reads canonical dashboard/week/goal truth and delegates workout start to the existing `exercise.html` session runtime. It does not own workout storage, planned-session storage, timers or session persistence.

## Retired preview

`exercise.html` in this directory is only a legacy redirect to `../exercise.html`, preserving query parameters such as `?user=maja` and hashes for old bookmarks.

The copied preview shell/runtime, local auth loader, dashboard copies and Reactor/Observatory session-comparison assets were retired in Training Observatory migration Checkpoint 9. Git history and checkpoint branches are the archive for the old standalone Reactor design.

Do not add a second training runtime or standalone Reactor dashboard here. Further CSS/loader consolidation belongs to the Release V1 cleanup plan.