# Pulse environment — canonical shared training presentation

`budget/exercise.html` is the only production training route.

This directory no longer contains a standalone Pulse Reactor application. The former Reactor page was used as a visual and interaction reference during the Observatory migration; its useful weekly-orbit interaction has been migrated to the canonical training page.

## Production-owned files

- `environment.css` — shared Observatory overview, records, log and editor presentation used by `budget/exercise.html`.
- `environment.js` — presentation-only Observatory adapter for the canonical dashboard. It reads the existing workout/week/goal DOM and delegates workout start to the canonical `exercise.html` session runtime.

Neither file owns workout storage, planned-session storage, timers or session persistence.

## Retired preview

`exercise.html` is now only a legacy redirect to `../exercise.html`, preserving query parameters such as `?user=maja` and hashes for old bookmarks.

The copied preview shell/runtime, local auth loader, dashboard copies and Reactor/Observatory session-comparison assets were retired in Training Observatory migration Checkpoint 9. Git history and the migration checkpoint commits are the archive for the old standalone Reactor design.

Do not add a second training runtime or standalone Reactor dashboard here. Further consolidation of `environment.css/js` belongs to the Release V1 owner cleanup.
