'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
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
