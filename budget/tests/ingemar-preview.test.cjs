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

test('training and Zen use dedicated immersive screens rather than timer popups',()=>{
 assert.match(html,/<section id="session" class="mode-screen workout-screen"/);
 assert.match(html,/<section id="zen-session" class="mode-screen zen-workout"/);
 assert.doesNotMatch(html,/<dialog id="session"|<dialog id="zen-session"/);
 assert.match(source[1],/function advanceSession\(\)/);
 assert.match(source[1],/function toggleSessionRest\(\)/);
 assert.match(source[1],/function updateSessionClock\(\)/);
 assert.match(source[1],/function nextZen\(\)/);
 assert.match(source[1],/function selectZenStep\(index\)/);
 assert.match(html,/data-action="advance-session"/);
 assert.match(html,/data-action="rest-session"/);
 assert.match(html,/data-action="next-zen"/);
 assert.match(source[1],/var TYPES=\['Push','Pull','Kondition'\]/);
});
test('dedicated style sheet scopes responsive surfaces and reduced motion',()=>{
 const css=fs.readFileSync(path.join(root,'ingemar-preview-modes.css'),'utf8');
 assert.match(html,/ingemar-preview-modes\.css\?v=20260920-immersive-1/);
 assert.match(css,/\.mode-screen\{[\s\S]*overflow-x:hidden/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(html,/firebase-app-compat|firebase-sync\.js/);
});
