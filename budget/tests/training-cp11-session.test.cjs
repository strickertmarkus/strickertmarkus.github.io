const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

const timer=read('exercise-timer-focus.js');
const html=read('exercise.html');
const runtime=read('exercise-session-runtime-core-v21.js');
const transitions=read('exercise-session-transition-stability-v142.js');
const persistence=read('exercise-session-persistence-v143.js');
const hype=read('exercise-hype-timer-layout-v1.js');
const firebaseSync=read('firebase-sync.js');

test('CP11 timer focus is reactive when idle instead of owning a permanent RAF',()=>{
  assert.doesNotMatch(timer,/function frame\(now\)/);
  assert.doesNotMatch(timer,/requestAnimationFrame\(frame\)/);
  assert.match(timer,/function scheduleReactiveSync\(\)/);
  assert.match(timer,/requestAnimationFrame\(flushReactiveSync\)/);
  assert.match(timer,/new MutationObserver/);
  assert.match(timer,/session-countdown-value/);
  assert.match(timer,/bs-overlay-value/);
  assert.match(timer,/requestAnimationFrame\(step\)/,'gesture settle RAF remains temporary and interaction-scoped');
});

test('CP11 timed cardio retains pause/resume and touch morph ownership',()=>{
  assert.match(runtime,/function toggleCardioPause\(\)/);
  assert.match(runtime,/ring\.addEventListener\('click',toggleCardioPause\)/);
  assert.match(timer,/addEventListener\('touchstart'/);
  assert.match(timer,/addEventListener\('touchmove'/);
  assert.match(timer,/addEventListener\('touchend'/);
  assert.match(timer,/function beginInteractiveDrag/);
  assert.match(timer,/function finishInteractiveDrag/);
});

test('CP11 pretimer and sound path remain wired',()=>{
  assert.match(hype,/duration:\s*5000/);
  assert.match(hype,/session-pre-timer-value/);
  assert.match(timer,/function beepOnce\(key,second\)/);
  assert.match(timer,/second >= 1 && second <= 5/);
  assert.match(timer,/AudioContext|webkitAudioContext/);
});

test('CP11 transition contract keeps ordinary rest automatic and custom between manual',()=>{
  assert.match(transitions,/type === 'rest' \|\| raw\.type === 'custom'/);
  assert.match(transitions,/Custom between exercises start only from the user's transition button\./);
  assert.match(runtime,/custom between exercise is a real exercise step/i);
  assert.match(runtime,/Only a rest transition may start\s+the following set automatically/i);
});

test('CP11 planned-session persistence wraps start and save without a second session runtime',()=>{
  assert.match(persistence,/function installPlannedSessionGuard\(\)/);
  assert.match(persistence,/function installStartWrapper\(\)/);
  assert.match(persistence,/function installSaveWrapper\(\)/);
  assert.match(persistence,/__plannedSessionSnapshotV143/);
  assert.match(persistence,/window\.startWorkoutSessionForDate = wrapped/);
  assert.match(persistence,/window\.saveSessionWorkout = wrapped/);
});

test('CP11 production cache-busts the reactive timer owner',()=>{
  assert.match(html,/exercise-timer-focus\.js\?v=20260918-cp11-reactive-timer-1/);
});


test('CP11 Firebase sync contract includes planned sessions and persistence listens for its sync event',()=>{
  assert.match(firebaseSync,/['"]ex_plannedSessions['"]/);
  assert.match(persistence,/addEventListener\('firebase-sync'/);
  assert.match(persistence,/key === 'ex_wk' \|\| key === 'ex_plannedSessions'/);
});
