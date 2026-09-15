# Training loader inventory — Checkpoint 2

Audit baseline: `50292b3ce6d886c018c9c61cacea1933b854a4ee`
First-paint checkpoint: `9a33972e2f17cd9038a9eacd47482f97fe874e26`
Loader-v2 implementation: `4831741babe183974ebed3bd2a1885bfe3310f0a`

## Result

The production `budget/exercise.html` page currently resolves **41 local exercise feature scripts** on a normal full load, plus the generic auth/storage/Firebase support scripts declared directly in the HTML.

Before loader-v2, the 27-script `auth-gate.js` bundle was requested as a sequential waterfall. Only a small subset was preloaded. One preload (`exercise-heart-rate-range.js`) used a different cache key than the executed URL, so it was a wasted extra resource request.

Loader-v2 keeps script **execution in the exact same order**, but starts all 27 network transfers together from one ordered manifest in `auth-config.js`. The mismatched heart-rate preload now resolves to the same URL and deduplicates.

Static request accounting for exercise-feature JS:

- Before: 41 actual feature scripts + 1 mismatched/wasted preload URL = **42 feature resource URLs**.
- After: 41 actual feature scripts, all preload URLs match their execution URL = **41 feature resource URLs**.
- Main improvement: auth-gate network waterfall depth changes from up to **27 sequential fetches** to **27 parallel preloads + ordered execution**.
- Runtime metrics are exposed as `window.__exerciseLoaderMetricsV2` (`manifestCount`, group counts and `bundleMs`) for device-side timing.

No runtime/session behavior was intentionally changed in this checkpoint.

## A. Direct scripts in `exercise.html`

| Asset | Role | Classification |
|---|---|---|
| Firebase app/auth/database compat (3 external files) | Authentication/database runtime | required |
| `indexeddb-fallback.js` | local persistence fallback | required |
| `auth-config.js` | critical boot, first-paint gate, preload manifest | required |
| `auth-gate.js` | auth + ordered exercise bundle execution | required |
| `exercise-timer-focus.js` | approved compact/focus cardio timer gesture/runtime | required; session-only candidate after loader consolidation |
| `firebase-sync.js` | exercise data sync | required |
| Chart.js | dashboard charts | required while current dashboard uses runtime charts |
| Google Inter stylesheet | typography | required presentation asset |

## B. Ordered auth-gate manifest (27)

The list below is the authoritative execution order in `window.__exerciseAssetManifestV2`. `group` is metadata only; loader-v2 does not reorder execution.

| # | Asset | Group | Classification / next action |
|---:|---|---|---|
| 1 | `exercise-points-8-9.js` | dashboard | required now; also installs performance scheduler guard |
| 2 | `exercise-heart-rate-range.js` | dashboard | required now; **duplicate-work candidate** because it polls UI/chart at 300/700 ms |
| 3 | `exercise-session-enhancements.js` | session-presentation | required for current session; load-on-session candidate |
| 4 | `exercise-session-runtime-core-v21.js` | session-core | required session core; load-on-session candidate only with start gate |
| 5 | `exercise-session-theme-stability.js` | session-presentation | required current presentation; consolidation candidate |
| 6 | `exercise-session-stable-details.js` | session-presentation | required current presentation; consolidation candidate |
| 7 | `exercise-reload-recovery.js` | boot-recovery | required at boot for stale-session cleanup; its log child assets can be deferred |
| 8 | `exercise-points-3-6-7.js` | dashboard | required current dashboard; **duplicate-work candidate** due recurring 1500 ms sync |
| 9 | `exercise-between-routing-v7.js` | session-transition | required for current between-exercise routing; session-only |
| 10 | `exercise-between-custom-exercise-v3.js` | session-transition | required for custom between exercises; session-only |
| 11 | `exercise-between-sets.js` | session-transition | required for current rest path; session-only |
| 12 | `exercise-hype-polish.js` | session-presentation | required compatibility layer today; **duplicate responsibility candidate** |
| 13 | `exercise-flow-polish-v2.js` | session-transition | compatibility owner; **duplicate responsibility candidate**, currently partly suppressed by performance guard |
| 14 | `exercise-builder-row-tools-v3.js` | builder | required only when builder/editor is used; load-on-demand candidate |
| 15 | `exercise-builder-style-v5.js` | builder | builder-only; load-on-demand candidate; currently has a 250 ms recurring label sync |
| 16 | `exercise-log-mobile-fix-v5.js` | training-log | below-fold log presentation; idle/on-demand candidate |
| 17 | `exercise-session-set-cards-v6.js` | session-presentation | current session presentation; session-only candidate |
| 18 | `exercise-builder-between-preview-v7.js` | builder | builder-only; load-on-demand candidate |
| 19 | `exercise-session-shell-v19.js` | session-presentation | current session shell; session-only candidate |
| 20 | `exercise-session-ux-v20.js` | session-ux | required session UX/sounds; session-only candidate; contains recurring guards |
| 21 | `exercise-motion-v1.js` | motion | presentation-only; session-only candidate |
| 22 | `exercise-hype-timer-layout-v1.js` | session-presentation | current timer layout; session-only candidate |
| 23 | `exercise-session-stability-v55.js` | session-stability | required compatibility/stability today; consolidation candidate |
| 24 | `exercise-custom-transition-atomic-v56.js` | session-transition | required current custom transition behavior; session-only |
| 25 | `exercise-pulse-flow-v58.js` | pulse-presentation | current final live-session presentation; required session-only |
| 26 | `exercise-pulse-flow-motion-v67.js` | motion | current Pulse motion; session-only |
| 27 | `exercise-session-typography.js` | pulse-presentation | current final typography authority; session-only |

## C. Additional scripts loaded by `auth-config.js` outside the 27-entry manifest

| Asset | Role | Classification |
|---|---|---|
| `exercise-points-8-9.js` | early performance/bootstrap owner | required; same URL/attribute as manifest, therefore no second execution/request |
| `exercise-shell-v13.js` | dashboard DOM arrangement | required until Checkpoint 4 moves final DOM into base markup |
| `exercise-hr-first-paint-v14.js` | old HR-chart first-paint coordination | **first-paint compatibility candidate** for removal after current first-paint gate is proven |
| `exercise-progress-consistency-v10.js` | progress/dashboard consistency | required current dashboard, consolidation candidate |
| `exercise-pulse-flow-progress-marker-v92.js` | session progress marker | session-only candidate |
| `exercise-pulse-flow-completed-marker-v102.js` | completed progress styling | session-only candidate |
| `exercise-pulse-flow-ecg-glow-v104.js` | ECG presentation | session-only candidate |
| `exercise-pulse-flow-canvas-glow-v130.js` | canvas glow renderer | session-only candidate |
| `exercise-pulse-flow-canvas-glow-v131.js` | final canvas layering + nested loaders | required session presentation today; session-only candidate |

## D. Indirect/nested loaders (5)

### From `exercise-reload-recovery.js`

1. `exercise-log-layout-v50.js` — training-log presentation; idle/on-demand candidate.
2. `exercise-log-pr-v52.js` — PR/log presentation/runtime; idle/on-demand candidate.
3. `exercise-log-pr-theme-v53.js` — PR theme; idle/on-demand candidate.

These are loaded after `DOMContentLoaded`; they are not part of auth-gate's ready signal.

### From `exercise-pulse-flow-canvas-glow-v131.js`

4. `exercise-session-transition-stability-v142.js` — required current transition stability.
5. `exercise-session-persistence-v143.js` — required current planned-session persistence/recovery.

These are important current behavior owners and must not be removed simply because they are nested.

## E. Duplicate responsibility / recurring-work findings

These are **candidates**, not removals in Checkpoint 2:

- `exercise-points-8-9.js` runs a dashboard sync every ~1200 ms.
- `exercise-points-3-6-7.js` runs dashboard text/UI maintenance every ~1500 ms.
- `exercise-heart-rate-range.js` runs UI sync every ~300 ms and chart sync every ~700 ms.
- `exercise-builder-style-v5.js` runs builder unit-label maintenance every ~250 ms.
- `exercise-between-routing-v7.js` runs archive-row maintenance every ~220 ms.
- `exercise-hype-polish.js`, `exercise-flow-polish-v2.js`, `exercise-session-ux-v20.js` and the newer session controller/stability layers overlap in session-state/presentation maintenance. The existing performance guard already suppresses some of this work during a live session, which is evidence that ownership should be consolidated in Checkpoint 3/5 rather than left as permanent polling.

## F. Safe loader changes completed in Checkpoint 2

- One authoritative 27-entry asset manifest now lives in `auth-config.js`.
- Every entry has an ownership group.
- All 27 resources are preloaded concurrently using the same cache key.
- `auth-gate.js` consumes the manifest but preserves the previous exact execution order.
- The old mismatched `exercise-heart-rate-range.js` preload URL was eliminated.
- `window.__exerciseLoaderMetricsV2` records manifest count/group counts and bundle duration for real-device comparison.
- No session-only asset has been removed or truly lazy-loaded yet; candidates are documented above. This is deliberate until the regression matrix in later checkpoints proves that a start/builder gate is safe.

## G. Next cleanup targets

1. **Checkpoint 3:** replace recurring dashboard/session polling with event-driven owners where possible.
2. Defer builder-only assets behind the edit/build action once builder initialization dependencies are mapped.
3. Defer lower-page training-log/PR presentation via idle/intersection loading after confirming no initial-layout dependency.
4. Create a session-start gate, then move session-only presentation assets off initial dashboard load without allowing a workout to start before core runtime is ready.
5. Remove `exercise-hr-first-paint-v14.js` if iPhone tests confirm the new first-paint gate fully supersedes it.
