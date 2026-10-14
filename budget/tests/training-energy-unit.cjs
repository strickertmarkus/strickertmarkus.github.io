const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('interval classification finds the timer caller on WebKit and V8, not its own wrapper',()=>{
 const source=read('exercise-points-8-9.js');
 const fn=source.slice(source.indexOf('    function perfSourceFromStack()'),source.indexOf('    function perfIsBackgroundSource'));
 for(const format of ['webkit','v8'])for(const caller of ['exercise-between-sets.js','exercise-session-ux-v20.js','exercise-heart-rate-range.js']){
  const frames=[['perfSourceFromStack','exercise-points-8-9.js'],['window.setInterval','exercise-points-8-9.js'],['startOverlay',caller]].map(([name,file])=>format==='webkit'?`${name}@https://example.test/${file}:40:5`:`    at ${name} (https://example.test/${file}:40:5)`);
  const stack=(format==='v8'?'Error\n':'')+frames.join('\n');
  const ctx={Error:function(){return {stack};},perfBackgroundSources:['exercise-points-8-9.js','exercise-heart-rate-range.js']};
  vm.runInNewContext(fn+';result=perfSourceFromStack()',ctx);assert.equal(ctx.result,caller);
 }
});
test('single timer owner uses timestamps, pauses overtime, and clears it for the next exercise',()=>{
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{dataset:{},textContent:'',querySelector(){return null;},classList:{values:new Set(),toggle(k,on){if(on)this.values.add(k);else this.values.delete(k);}}});return nodes.get(id);};
 const state={exercises:[{kind:'cardio',time:1}],exerciseIndex:0,setRunning:true,setStartedAt:1000};
 const ctx={window:{location:{pathname:'/budget/archive/exercise.html'}},document:{readyState:'loading',addEventListener(){},getElementById:node,querySelectorAll(){return [];}},sessionState:state};
 let source=read('exercise-hype-timer-layout-v1.js').replace(/\}\)\(\);\s*$/,'window.testPaint=paintCardioTimer;})();');
 vm.runInNewContext(source,ctx);
 ctx.window.testPaint(2000);assert.equal(node('session-countdown-value').textContent,'00:59');
 ctx.window.testPaint(61000);assert.equal(node('session-countdown-value').textContent,'+ 0');
 ctx.window.testPaint(63500);assert.equal(node('session-countdown-value').textContent,'+ 2');
 state.__hypePaused=true;state.__hypePausedAt=63500;
 ctx.window.testPaint(99000);assert.equal(node('session-countdown-value').textContent,'+ 2');
 state.__hypePaused=false;state.setStartedAt=99000;ctx.window.testPaint(100000);
 assert.equal(node('session-countdown-value').textContent,'00:59');assert.equal(node('session-countdown-ring').classList.values.has('is-overtime'),false);
});
