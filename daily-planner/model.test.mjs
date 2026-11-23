import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,dayTasks,focusTasks,overlapKeys,plannedMinutes,validTask,validateState,shiftDate,occurs} from './model.mjs';
const make=(patch={})=>({id:'t1',title:'Fokus',date:'2026-11-23',type:'work',start:'08:00',end:'09:00',priority:'normal',repeat:'none',note:'',done:false,...patch});
test('Start-only stays active until the next start; intervals use an exclusive end',()=>{
 const tasks=[make({end:'',key:'a'}),make({id:'t2',key:'b',start:'10:00',end:'11:00'})];
 assert.deepEqual(focusTasks(tasks,7*60).next.map(t=>t.key),['a']);
 assert.deepEqual(focusTasks(tasks,9*60).active.map(t=>t.key),['a']);
 assert.deepEqual(focusTasks(tasks,10*60).active.map(t=>t.key),['b']);
 assert.deepEqual(focusTasks(tasks,11*60).active,[]);
 assert.equal(focusTasks([make({end:''})],1439).active.length,1);
 assert.equal(focusTasks([make({end:'',done:true})],500).active.length,0);
});
test('Focus includes simultaneous activities and simultaneous next starts',()=>{
 const tasks=[make({key:'a',end:'11:00'}),make({id:'t2',key:'b',start:'09:00',end:'10:00'}),make({id:'t3',key:'c',start:'12:00',end:''}),make({id:'t4',key:'d',start:'12:00',end:'13:00'})];
 assert.deepEqual(focusTasks(tasks,570).active.map(t=>t.key),['a','b']);
 assert.deepEqual(focusTasks(tasks,570).next.map(t=>t.key),['c','d']);
});
test('Recurrence, per-day completion, deletion and edits stay isolated',()=>{
 const state=emptyState();state.tasks=[make({repeat:'weekdays'})];
 assert.equal(dayTasks(state,'2026-11-22').length,0);
 assert.equal(dayTasks(state,'2026-11-28').length,0);
 state.exceptions['t1@2026-11-24']={done:true,title:'Annan rubrik'};
 state.exceptions['t1@2026-11-25']={deleted:true};
 assert.equal(dayTasks(state,'2026-11-23')[0].done,false);
 assert.equal(dayTasks(state,'2026-11-24')[0].done,true);
 assert.equal(dayTasks(state,'2026-11-24')[0].title,'Annan rubrik');
 assert.equal(dayTasks(state,'2026-11-25').length,0);
 assert.equal(dayTasks(state,'2026-11-26')[0].title,'Fokus');
 assert.equal(occurs(make({repeat:'weekly'}),'2026-11-30'),true);
 assert.equal(occurs(make({repeat:'weekly'}),'2026-12-01'),false);
 assert.doesNotThrow(()=>validateState(state));
});
test('Overlaps are signalled; planned time does not count an overlap twice',()=>{
 const tasks=[make({key:'a',end:'10:00'}),make({id:'b',key:'b',start:'09:00',end:'11:00'}),make({id:'c',key:'c',start:'11:00',end:'12:00'})];
 assert.deepEqual([...overlapKeys(tasks)],['a','b']);assert.equal(plannedMinutes(tasks),240);
 assert.equal(plannedMinutes([make({end:''})]),0);
});
test('Dates and imports reject invalid or incomplete data',()=>{
 assert.equal(validTask(make({date:'2026-02-30'})),false);
 assert.equal(validTask(make({end:'07:00'})),false);
 assert.equal(validTask(make({start:'',end:'09:00'})),false);
 assert.equal(validTask(make({start:'25:00',end:''})),false);
 assert.equal(validTask(make({title:'   '})),false);
 assert.equal(validTask(make({start:'',end:''})),true);
 assert.throws(()=>validateState({...emptyState(),tasks:[make(),make()]}));
 assert.throws(()=>validateState({...emptyState(),notes:{'2026-11-23':3}}));
 assert.doesNotThrow(()=>validateState(emptyState()));
 assert.equal(shiftDate('2026-12-31',1),'2027-01-01');
 assert.equal(shiftDate('2026-03-29',1),'2026-03-30');
});
