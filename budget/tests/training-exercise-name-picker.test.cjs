const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.resolve(__dirname,'..','exercise.html'),'utf8');

test('exercise picker is shared by builder, workout log and single-exercise editor',()=>{
  assert.match(html,/exercise-name-picker-input-v1/);
  assert.match(html,/target\.closest\('#day-workout-ex-list,#ex-list,#single-exercise-editor-v9'\)/);
  assert.match(html,/function exercisePickerContext\(input\)/);
  assert.match(html,/singleExerciseEditState\.workoutId/);
});

test('exercise catalog is derived live from saved exercise occurrences, not an append-only registry',()=>{
  assert.match(html,/function getExerciseCatalogSources\(\)/);
  assert.match(html,/getWorkouts\(\)\.slice\(\)\.sort/);
  assert.match(html,/var planned=getPlannedSessions\(\)/);
  assert.match(html,/getTemplates\(\)\.slice\(\)\.reverse\(\)/);
  assert.doesNotMatch(html,/exerciseNames|exerciseCatalog.*DB\.set|DB\.set\(['"]exercise/i);
});

test('catalog filters category strength exercises and treats cardio as a global cardio list',()=>{
  assert.match(html,/function exerciseCategoryMatches\(sourceType,targetType\)/);
  assert.match(html,/target\.some\(function\(token\)\{return source\.indexOf\(token\)>=0;\}\)/);
  assert.match(html,/var targetCardio=kind==='cardio'\|\|exerciseCategoryIsCardio\(type\)/);
  assert.match(html,/if\(targetCardio\)[\s\S]*entryKind='cardio'/);
});

test('exercise names are exact-key deduplicated and alphabetically sorted in Swedish',()=>{
  assert.match(html,/function exerciseNameKey\(name\)/);
  assert.match(html,/toLocaleLowerCase\('sv-SE'\)/);
  assert.match(html,/if\(!key\|\|catalog\[key\]\)return/);
  assert.match(html,/localeCompare\(b\.name,'sv-SE',\{sensitivity:'base'\}\)/);
});

test('picker always ends with Ny övning and only free entry unlocks typing',()=>{
  assert.match(html,/>\+ Ny övning<\/button>/);
  assert.match(html,/input\.readOnly=false/);
  assert.match(html,/input\.dataset\.exerciseNameFreeV1='1'/);
  assert.match(html,/input\.readOnly=true/);
  assert.match(html,/readonly autocomplete="off" aria-haspopup="listbox"/);
});

test('new names are normalized only when a real exercise row is parsed for save',()=>{
  assert.match(html,/var name=cleanExerciseName\(nameEl\.value\)/);
  assert.match(html,/nameEl\.value=name/);
  assert.match(html,/if\(!name\)return null/);
});

test('picker is viewport-contained for mobile Safari and free text avoids iOS zoom',()=>{
  assert.match(html,/position:fixed;z-index:2147483600/);
  assert.match(html,/max-height:calc\(100dvh - 16px\)/);
  assert.match(html,/window\.visualViewport/);
  assert.match(html,/data-exercise-name-free-v1="1"\]\{font-size:16px!important/);
});


test('Pulse Flow theme owns the portalled exercise picker with pink/red editor tokens',()=>{
  const env=fs.readFileSync(path.resolve(__dirname,'..','pulse-environment','environment.css'),'utf8');
  assert.match(env,/#pulse-page:not\(:has\(#session-modal\.show\)\) \.exercise-name-picker-v1/);
  assert.match(env,/border-color:#ff9fbb4a/);
  assert.match(env,/radial-gradient\(ellipse at 10% -12%,#ff597c20/);
  assert.match(env,/\.exercise-name-picker-kicker-v1\{color:#ffafc4/);
});

test('picker is positioned before becoming visible and readonly taps do not focus-scroll the editor',()=>{
  assert.match(html,/picker\.classList\.remove\('show'\);\s*positionExerciseNamePicker\(\);\s*requestAnimationFrame/);
  assert.match(html,/exercisePickerInput\(tappedInput\)[\s\S]*event\.preventDefault\(\)/);
  assert.doesNotMatch(html,/closeExerciseNamePicker\(\);\s*input\.blur\(\)/);
});

test('picker kind selection bypasses the whole-builder morph wrapper',()=>{
  assert.match(html,/function applyExerciseKindToRow\(wrap,kind\)/);
  assert.match(html,/function ensureExerciseRowKind\(row,kind\)[\s\S]*applyExerciseKindToRow\(row,kind\)/);
  assert.match(html,/function setExerciseKind\(el,kind\)[\s\S]*applyExerciseKindToRow\(wrap,kind\)/);
});

test('Pulse picker stylesheet is cache-busted on the canonical route',()=>{
  assert.match(html,/pulse-environment\/environment\.css\?v=20260918-exercise-picker-pulse-1/);
});
