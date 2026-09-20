'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(__dirname,'../ingemar-preview.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/);
test('standalone preview has valid inline JavaScript and does not load Firebase',()=>{
 assert.ok(source,'Preview script missing');
 new vm.Script(source[1],{filename:'ingemar-preview.html'});
 assert.doesNotMatch(html,/firebase-app-compat|firebase-sync\.js|auth-gate\.js|firebase\.database/);
 assert.match(html,/<title>Ingemars träning · Förhandsvisning<\/title>/);
 assert.match(html,/ingemar-pulse-demo-v1/);
});
test('workout builder provides independently editable set weights, reps and minutes',()=>{
 assert.match(source[1],/e\.sets\.map\(function\(s,j\)/);
 assert.match(source[1],/data-set=/);
 assert.match(source[1],/data-actual=/);
 assert.match(source[1],/data-mode=/);
 assert.match(source[1],/data-add-set=/);
 assert.match(source[1],/data-remove-set=/);
 assert.match(source[1],/weight:weight\|\|0,reps:reps\|\|0,minutes:minutes\|\|0/);
 assert.match(source[1],/exercises:selectedExercises/);
 assert.match(source[1],/set\.done/);
});
test('preview includes an isolated training log and interactive Zen modes',()=>{
 for(const route of ['training','stretch','meditation'])assert.match(html,new RegExp('data-view="'+route+'"'));
 for(const type of ['Push','Pull','Kondition'])assert.match(html,new RegExp('data-choice="'+type+'"'));
 assert.match(source[1],/zenHistory/);
 assert.match(source[1],/activeZen/);
 assert.match(source[1],/state\.history\.push\(workout\)/);
 assert.match(html,/id="history-detail"/);
 assert.match(source[1],/function openHistory\(id\)/);
 assert.match(source[1],/localStorage\.setItem\(KEY/);
 assert.match(source[1],/Återställa all demodata/);
});

test('training mode embeds the original Pulse Flow CSS and ordered set decisions',()=>{
 const original=fs.readFileSync(path.join(root,'exercise-pulse-flow-v58.js'),'utf8');
 const quote=String.fromCharCode(96);
 const body=original.split('style.textContent = '+quote)[1].split(quote+';\n    document.head.appendChild(style)')[0];
 const css=fs.readFileSync(path.join(root,'ingemar-pulse-original.css'),'utf8');
 assert.ok(body.length>25000,'Original stylesheet extraction should be available');
 assert.ok(css.includes(body),'Demo must contain the exact original family Pulse Flow CSS');
 for(const phrase of ['id="session-modal" class="pulse-flow-v58 pulse-flow-strength-v58 show"',
  'class="session-shell"','class="session-timers"','class="hype-workout-progress"',
  'id="session-stable-details"','id="pulse-flow-live-v58"',
  'class="pulse-flow-trace-v58"','id="session-exercises" tabindex="0"'])assert.ok(html.includes(phrase),phrase);
 for(const fn of ['startCurrentSet','completeCurrentSet','startNextSet','addExtraSet',
  'finishCurrentExercise','skipSessionRest'])assert.ok(source[1].includes('function '+fn+'()'),fn);
 assert.match(source[1],/set\.skipped/);
 assert.match(source[1],/dataset\.state=phase/);
 assert.doesNotMatch(html,/<dialog id="session"/);
});
test('independent editable set rail and Zen remain mobile friendly',()=>{
 const css=fs.readFileSync(path.join(root,'ingemar-preview-modes.css'),'utf8');
 const pulse=fs.readFileSync(path.join(root,'ingemar-pulse-original.css'),'utf8');
 assert.match(html,/ingemar-preview-modes\.css\?v=20260920-canonical-1/);
 assert.match(html,/ingemar-pulse-original\.css\?v=20260920-canonical-1/);
 assert.match(css,/\.mode-screen\{[\s\S]*overflow-x:hidden/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(pulse,/#session-modal \.session-set-rail\{/);
 assert.match(pulse,/@media\(max-width:740px\)/);
 assert.match(pulse,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/<section id="zen-session" class="mode-screen zen-workout"/);
 assert.match(source[1],/function nextZen\(\)/);
 assert.match(source[1],/function selectZenStep\(index\)/);
 assert.doesNotMatch(html,/firebase-app-compat|firebase-sync\.js|auth-gate\.js/);
});
