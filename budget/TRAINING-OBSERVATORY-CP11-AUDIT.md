# Training / Pulse Observatory — Checkpoint 11 release-candidate audit

Baseline entering CP11: `9139dac8ca7468bd42e1f6813e06e13c012c2ee8`.

## Scope

Checkpoint 11 is the final automated regression gate for the Observatory migration before the remaining V1 owner consolidation work. It validates the one-page Training architecture, shared live session, wellness shell, mobile layouts and measured loader baseline.

## Structural fixes found by the gate

The gate found real overflow and idle-work issues that were fixed at their owners rather than masked globally:

- Observatory atmosphere / scene decoration was contained so it cannot widen the page at mobile or tablet widths, including while a live session is mounted.
- Zen's imported scene canvas and retired Stretch decorative/profile surfaces were bounded/removed so the shared Training shell has no horizontal overflow.
- mobile Stretch title/subtitle composition was bounded inside the viewport.
- `exercise-timer-focus.js` no longer owns a permanent requestAnimationFrame loop while idle. Cardio/rest presentation wakes from relevant DOM/session changes; only interactive gesture settling retains a short-lived RAF.

## Automated release-candidate gate

Reference implementation run: GitHub Actions `Training CP11 release candidate gate`, run `35340636407`, head `ce470b56a2f455c213875113f7d8c588e1cb825f`.

Static suite:

- **93 passed**
- **0 failed**

The iPhone-like WebKit pass exercised:

- cold and warm Observatory first paint with no Compact flash;
- repeated Compact ↔ Observatory switching without reload or scroll drift;
- one canonical weekly plan in collapsed/orbit geometry, repeated expand/collapse and week navigation;
- day selection plus builder open/edit/save;
- planned-session persistence through a fresh page load and the `firebase-sync` repair-event path;
- Strength session from Observatory and Compact using equivalent canonical session state;
- Cardio session from Observatory;
- 5-second pre-timer;
- timer pause/resume;
- repeated compact ↔ expanded timer morph cycles through the public timer controller in an iPhone-like WebKit context;
- configured ordinary rest auto-start;
- active-session guard when attempting to leave Training;
- exactly one workout added by the save probe;
- Training ↔ Stretch ↔ Meditation, history back/forward and Markus/Maja profile query preservation;
- 320, 375/390, 768 and 1440 px layouts plus mobile landscape;
- Stretch and Meditation at 390 px;
- reduced-motion switching;
- no browser page errors / console errors.

Custom between-exercise manual behavior is additionally protected by the transition/runtime contract tests; it is intentionally not auto-started like ordinary rest.

## Loader-v2 measurement

Passing CI/WebKit measurement:

- manifest entries: **27**
- unique local JavaScript requests after exercising Training + Zen: **64**
- preload-start → bundle-ready in the reference implementation run: **307 ms**

This is the pre-V1 consolidation baseline. It includes compatibility shims and Zen assets loaded by the regression route. It must not be presented as the final 12-owner request count.

## Remaining manual gate

Physical iPhone Safari/PWA validation remains unchecked. This includes the real finger-swipe compact ↔ expanded cardio-timer gesture: CI WebKit can exercise the timer morph and statically protects the `touchstart` / `touchmove` / `touchend` drag path, but its synthetic events are not trusted physical touches. Automated WebKit therefore gives Safari-engine coverage without pretending to be a real iPhone/PWA lifecycle test.

The working migration checklist is therefore retained until that manual item is completed. Git history/checkpoint branches remain the rollback mechanism.


## Step 3 closeout note

The automated CP11 implementation state is **93/93 static tests** plus a successful iPhone-like WebKit release gate. After the documentation was synchronized, the same gate was rerun on `1a1731c8f8e15be5d8baa1dfc0ea9ae80612d088` as run `35367177011`: **93 passed / 0 failed**, WebKit success, **27** manifest entries, **64** unique local JavaScript requests and a **266 ms** preload-start → bundle-ready sample. CI timing is treated as a sample rather than a fixed performance guarantee.

The production timer-focus owner is idle-reactive rather than permanently frame-driven, and the current request/load measurement remains a **pre-V1 consolidation baseline**, not the 12-owner target. Step 3 removes the temporary CP11 GitHub Actions workflow after this successful re-verification; Git history and the checkpoint branches retain the harness if it is needed again.
