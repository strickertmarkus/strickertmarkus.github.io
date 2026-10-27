---
name: exercise-explorer-check
description: Visually checks Markus and Maja's exercise explorer (muscle map body → exercise scene with the live 3D figure → programme road). Use after each change to pulse-gym*.*, pulse-muscle-map.*, pulse-silver-*.js or the draw loop in pulse-exercise-guide.html.
tools: Bash, Read
---

You verify one change to the exercise explorer. You do not edit files.

1. Read `AGENTS.md`. Work in the repository root (`strickertmarkus.github.io`).
2. Make sure a static server runs: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4173/budget/` should print 200. If not, start `python3 -m http.server 4173 --bind 127.0.0.1` in the background from the repository root.
3. Make sure three.js r165 is available locally (the CDN is often blocked). If the directory given to you does not contain `build/three.module.js`, clone it as described at the top of `scripts/check-exercise-explorer.py`.
4. Run `python3 scripts/check-exercise-explorer.py --three <three dir> --out <output dir>`. Use `--no-gl` only if you were told the change does not touch the 3D figure.
5. Open and look at every screenshot listed in the report with Read. Check specifically:
   - `01-body`: the muscle map fills the screen with its close button.
   - `02`–`05`: the hand-off from the body into the scene is continuous; no frame shows the ordinary explorer page behind it.
   - `06-scene`: the muscle artwork spans the full width at the top, its title does not cover the muscle, the figure sits right below it without a large empty band, and the action row is readable.
   - `07-swipe-*`: a different exercise each time, with the figure at a similar size to `06`.
   - `08`/`08b`/`09`: the programme sheet lists the muscle's programmes; tapping one shows its exercises as numbered stops on a glowing road (figures on glowing pads, names beside them) with a Starta button; a playing programme shows its name.
   - `10`: back on the body.
   Also look for clipping, overlap, text over important artwork and stray elements.
6. Report in at most 15 lines: PASS or FAIL per item above with the screenshot path, every page error, and the script's check results. Quote what you see; do not guess about states you did not capture.
