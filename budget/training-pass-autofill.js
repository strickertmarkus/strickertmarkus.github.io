/* Pass metadata follows cardio exercises until the user names the pass. */
(function(root){
'use strict';
function cardioName(value){
 var key=String(value||'').trim().toLocaleLowerCase('sv-SE');
 return ({'löpning':'Löpning','cykling':'Cykling','cykel':'Cykling','crosstrainer':'Crosstrainer','cross trainer':'Crosstrainer'})[key]||'';
}
function suggest(exercises,name,automatic){
 var named=exercises.filter(function(ex){return String(ex.name||'').trim();});
 if(!named.length||!named.every(function(ex){return cardioName(ex.name)||ex.kind==='cardio';}))return null;
 var title=named.length===1?(cardioName(named[0].name)||named[0].name.trim()):'Konditionspass';
 return {type:'Kondition',name:!String(name||'').trim()||/^vila$/i.test(name.trim())||name===automatic?title:name};
}
if(typeof module==='object'&&module.exports){module.exports={cardioName:cardioName,suggest:suggest};return;}
var box=document.getElementById('day-workout-modal'),list=document.getElementById('day-workout-ex-list');
if(!box||!list)return;
var name=document.getElementById('day-workout-name'),type=document.getElementById('day-workout-type');
var automatic='',writing=false,queued=false,signature='';
function snapshot(){return Array.from(list.querySelectorAll('.ex-row-item')).map(function(row){return {name:(row.querySelector('.dw-name')||{}).value||'',kind:(row.querySelector('.dw-kind')||{}).value||'strength'};});}
function reset(record){automatic=record&&record.autoPassName===name.value?record.autoPassName:'';signature=JSON.stringify(snapshot());}
function stamp(record){if(automatic&&record.name===automatic&&!record.zenRoutine)record.autoPassName=automatic;else delete record.autoPassName;return record;}
function update(){
 queued=false;
 var exercises=snapshot(),next=JSON.stringify(exercises);
 if(next===signature)return;
 signature=next;
 if(root.PulseZen&&root.PulseZen.builderKind())return;
 // Exact known names also work when typed instead of selected from the guide.
 Array.from(list.querySelectorAll('.ex-row-item')).forEach(function(row,i){if(cardioName(exercises[i].name)&&exercises[i].kind!=='cardio'){root.ensureExerciseRowKind(row,'cardio');exercises[i].kind='cardio';}});
 signature=JSON.stringify(snapshot());
 var result=suggest(exercises,name.value,automatic);if(!result)return;
 writing=true;
 if(result.name!==name.value){name.value=result.name;automatic=result.name;name.dispatchEvent(new Event('input',{bubbles:true}));}
 if(type.value!==result.type){type.value=result.type;type.dispatchEvent(new Event('input',{bubbles:true}));}
 writing=false;
}
function schedule(){if(!queued){queued=true;queueMicrotask(update);}}
name.addEventListener('input',function(){if(!writing)automatic='';});
list.addEventListener('input',function(e){if(e.target.matches('.dw-name,.dw-kind'))schedule();});
list.addEventListener('change',schedule);
new MutationObserver(schedule).observe(list,{childList:true,subtree:true});
root.PulsePassAutofill={reset:reset,stamp:stamp};
reset(null);
})(typeof window==='undefined'?globalThis:window);
