# Mandatory Repository Work Rules

**Scope:** Entire repository.

**Instruction:** Read this file before every prompt/task that involves this repository, and follow it carefully before making any change.

## Non-negotiable rules

1. **Never generate an image unless the user explicitly asks for an image.**
   - Do not invoke image generation for code, UI, GitHub, HTML/CSS/JS, screenshots, references, mockups, or visual-debugging requests unless the user explicitly asks for a generated image.
   - User-provided screenshots/images are references for implementation and analysis; they are not a request to generate a new image.

2. **Fix the code properly; do not stack patches on top of patches.**
   - Never solve a problem by adding another override/hack on top of old broken logic when the underlying structure can be corrected.
   - Inspect the active render/code path, remove or replace obsolete logic, and keep one clear source of truth.
   - Clean up dead, superseded, duplicate, or temporary code/files created during the task.
   - Use Git commits/checkpoints to return to earlier states when needed instead of preserving bad code through accumulating overrides.

3. **Ask direct questions when something is unclear.**
   - If the requirement, target element, intended visual result, or technical approach is ambiguous, ask a concise direct question before implementing.
   - Do not guess when the ambiguity could materially change the result.

4. **Use a checklist and verify every change.**
   Before editing:
   - Read this file.
   - Read the latest relevant files from the current branch.
   - Check the latest commits/state so work is based on the actual current code.
   - Break the request into explicit checklist items.

   During implementation:
   - Address every checklist item.
   - Prefer structural fixes over overrides.
   - Check for duplicate/obsolete code before adding new code.
   - Keep unrelated pages/features unchanged unless the task requires otherwise.

   After implementation:
   - Re-read every modified file/section.
   - Verify each checklist item individually.
   - Check the final diff against the state before the task.
   - Run all available relevant syntax/tests/checks.
   - Confirm that temporary/debug files and obsolete code are removed.
   - Confirm cache/version references point to the intended files when applicable.
   - Verify that the implementation is internally consistent and likely to work on the target platform, especially mobile Safari when relevant.

5. **Do not send the final answer before the GitHub change is pushed and published.**
   - For repository-changing tasks, push/commit the completed change first.
   - Confirm the expected commit is on the intended branch.
   - Wait for the relevant GitHub Pages/deployment workflow for that commit to finish successfully before sending the final completion message.
   - Do not describe a change as live/published while its deployment is still queued, waiting, or in progress.
   - If deployment fails, investigate/report the failure instead of claiming completion.

## Final-response gate

Before replying that a repository task is complete, confirm all of the following:

- [ ] This file was read first.
- [ ] No image generation was used unless explicitly requested.
- [ ] The underlying code was fixed cleanly; no unnecessary patch-on-patch workaround remains.
- [ ] Ambiguities were clarified with the user when needed.
- [ ] Every requested item was checked off.
- [ ] Relevant tests/syntax checks passed.
- [ ] Final diff was reviewed.
- [ ] Commit is pushed to the intended branch.
- [ ] GitHub Pages/deployment for the final commit completed successfully.
- [ ] Only then is the final answer sent.
