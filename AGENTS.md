# Mandatory Repository Work Rules

**Scope:** Entire repository.

**Instruction:** Read this file before every prompt/task that involves this repository. Follow it before making any change.

## Core rules

1. **Never generate an image unless the user explicitly asks for a generated image.**
   - Do not invoke image generation for code, UI, GitHub, HTML/CSS/JS, screenshots, references, mockups, or visual debugging unless the user explicitly requests generated artwork.
   - Browser screenshots used to verify the real rendered site are **verification artifacts**, not generated images, and are allowed/required under the visual-verification rules below.
   - User-provided screenshots are implementation references, not requests to generate a new image.

2. **Fix the underlying code; never stack patches on broken logic.**
   - Inspect the active render/code path first.
   - Replace or remove obsolete logic instead of adding another override on top.
   - Keep one clear source of truth for each behavior/layout rule.
   - Remove dead, superseded, duplicate, debug, or temporary code created during the task.
   - Keep unrelated pages/features unchanged unless the task requires otherwise.

3. **Ask only when ambiguity materially changes the implementation.**
   - Ask one concise question if the target, intended result, or technical behavior is genuinely ambiguous.
   - Do not ask for confirmation when the request and desired result are already clear.

## Fast execution strategy

4. **Plan first, then make one coherent change.**
   Before editing:
   - Read this file.
   - Read the latest relevant files from the current branch.
   - Check the latest commits/state.
   - Write a short internal checklist covering every requested item.
   - Identify obsolete/duplicate code that should be removed as part of the fix.

5. **Batch related file changes into one final commit whenever practical.**
   - Do **not** normally commit HTML, CSS, tests, cache keys, and workflow changes one file at a time.
   - When a task touches multiple files, prepare the complete change first and prefer an atomic Git tree/commit so all related files land together.
   - Include tests, cache/version bumps, and workflow updates in that same final commit.
   - Avoid intermediate commits on the deployment branch unless:
     - the user explicitly asks for checkpoints,
     - a risky migration genuinely needs a rollback point, or
     - a failed final verification requires a corrective retry.
   - Do not wait for Pages/CI on intermediate work that is known not to be the final intended state.
   - If a verification run fails, inspect the failure, fix the underlying cause, and make one corrective commit rather than layering test workarounds.

6. **Use cheap checks before expensive checks.**
   Before the final push when tooling permits:
   - Re-read all modified sections.
   - Run syntax/static/unit checks first.
   - Verify selectors, IDs, cache references, and data flow.
   - Check the diff against the state before the task.
   - Only after those pass should the final commit trigger the slower browser/deployment verification.

## Mandatory visual verification

7. **Every change that can affect rendered UI must receive a real visual check.**
   This includes changes to HTML, CSS, responsive layout, visible JS behavior, dialogs, controls, charts, animations, spacing, typography, or anything the user can see.

   For UI-affecting work:
   - Render the **final implementation** in a real browser after the complete change is applied.
   - Capture at least one screenshot of the affected state and **inspect the screenshot visually** before declaring the task complete.
   - A DOM assertion, CSS selector check, syntax test, or “element exists” test is **not a substitute** for the screenshot review.
   - The screenshot must show the actual state relevant to the request: open the dialog/menu/session, enter realistic content, scroll to the affected area, etc.
   - Compare against any screenshot/reference supplied by the user when one exists.
   - Check specifically for clipping, overlap, wrong stacking, overflow, unexpected whitespace, broken alignment, stale elements, and mobile safe-area issues.

   Viewport requirements:
   - For mobile/iPhone-related work: verify in **WebKit** at the target mobile width; default to **390×844** when no more specific size is known.
   - For narrow/responsive layout fixes: also check a smaller width such as **320 px** when the change could break there.
   - For responsive changes affecting both mobile and desktop: inspect at least one mobile screenshot and one desktop screenshot.
   - For desktop-only changes: inspect an appropriate desktop viewport.
   - When animation/state transitions matter, capture/check the relevant state rather than only the initial frame.

   If browser screenshot verification is genuinely unavailable:
   - State that limitation explicitly.
   - Do not claim the visual result was verified.

8. **Automated browser tests should verify geometry, not just existence.**
   When relevant, add targeted WebKit/Playwright assertions for:
   - no unintended horizontal overflow,
   - no overlapping controls/cards,
   - elements staying inside their intended container/viewport,
   - mobile inputs at least 16 px when iOS focus zoom is a risk,
   - expected viewport scale after focusing/editing,
   - visibility and usable placement of interactive controls.
   Keep regression tests focused on the bug/request; do not expand the full suite unnecessarily.

## Publishing and final verification

9. **The final intended commit is the one that must pass full verification.**
   After implementation:
   - Confirm all requested checklist items individually.
   - Confirm obsolete/replaced code is gone.
   - Confirm temporary/debug files are gone.
   - Confirm cache/version references point to the intended files.
   - Run/confirm relevant syntax, unit, and browser checks.
   - For UI work, inspect the final screenshot artifact(s).
   - Confirm the expected final commit is on the intended branch.
   - Wait for the relevant GitHub Pages/deployment workflow for that **final commit** to finish successfully.
   - Do not describe a change as live/published while deployment is queued or in progress.
   - If deployment or final browser verification fails, investigate and fix it before claiming completion.

10. **Do not repeat expensive verification without a reason.**
    - One complete WebKit/browser run on the final intended commit is the normal path.
    - Do not trigger/re-run the full visual suite for every individual file edit.
    - Re-run only when code affecting the result changed or a previous verification failed.
    - Prefer focused regression checks plus the existing broader suite rather than duplicating equivalent tests.

## Final-response gate

Before replying that a repository task is complete, confirm:

- [ ] This file was read before making changes.
- [ ] Latest relevant files and repository state were inspected.
- [ ] The request was handled as one coherent checklist.
- [ ] No unnecessary patch-on-patch or obsolete logic remains.
- [ ] Related edits were batched into as few commits as practical.
- [ ] Relevant syntax/static/unit checks passed.
- [ ] Final diff was reviewed.
- [ ] If UI was affected: a real final browser screenshot was captured **and visually inspected**.
- [ ] If UI was affected: target viewport/browser geometry checks passed where relevant.
- [ ] The final intended commit is on the intended branch.
- [ ] GitHub Pages/deployment for that final commit completed successfully.
- [ ] Only then is the final completion answer sent.
