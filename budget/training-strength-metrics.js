/* Shared strength metrics: historical body mass is volume, never a weight PR. */
(function(root){
'use strict';
function positive(v){var n=Number(v);return Number.isFinite(n)&&n>0?n:0;}
function strength(ex){return ex&&(ex.kind||((ex.distance||ex.time)?'cardio':'strength'))==='strength';}
function exercise(ex,w,profile){
 if(!strength(ex))return {volume:0,reps:0,weight:0,completed:false};
 var sets=ex.sets==null?1:positive(ex.sets),reps=positive(ex.reps),bw=ex.weightMode==='bodyweight';
 var weight=bw?(profile==='markus'?positive(w.bodyweightKg):0):positive(ex.weight),volume=sets*reps*weight;
 if(Array.isArray(ex.logs)&&ex.logs.length){
  reps=0;volume=0;var maxWeight=0;
  ex.logs.forEach(function(log){var r=positive(log.actualReps),kg=bw?weight:positive(log.actualWeight);reps=Math.max(reps,r);maxWeight=Math.max(maxWeight,kg);volume+=r*kg;});
  if(!bw)weight=maxWeight;sets=ex.logs.length;
 }
 var completed=!!(String(ex.name||'').trim()&&sets&&reps);
 return {volume:completed?volume:0,reps:reps,weight:bw?0:weight,completed:completed};
}
function workout(w,profile){var volume=0,count=0;(w.exercises||[]).forEach(function(ex){var m=exercise(ex,w,profile);volume+=m.volume;if(m.completed)count++;});return {volume:volume,count:count,perExercise:count?volume/count:0};}
function snapshot(w,previous,profile,mass){
 if(previous)(w.exercises||[]).forEach(function(ex,i){var old=(previous.exercises||[])[i];if(old&&old.logs&&!ex.logs&&['name','kind','sets','reps','weight','weightMode'].every(function(k){return ex[k]===old[k];}))ex.logs=old.logs;});
 if(profile!=='markus')return w;
 if(previous){if(Object.prototype.hasOwnProperty.call(previous,'bodyweightKg'))w.bodyweightKg=previous.bodyweightKg;else delete w.bodyweightKg;}
 else if((w.exercises||[]).some(function(ex){return strength(ex)&&ex.weightMode==='bodyweight';}))w.bodyweightKg=positive(mass)||null;
 return w;
}
function records(workouts,prs,profile){
 var map={};
 (workouts||[]).slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date))||Number(a.id)-Number(b.id);}).forEach(function(w){
  var session={};
  (w.exercises||[]).forEach(function(ex){
   var m=exercise(ex,w,profile);if(!m.completed)return;
   var bw=ex.weightMode==='bodyweight',key=String(ex.name).trim().toLocaleLowerCase('sv-SE')+(bw?'|bodyweight':'|kg');
   if(!map[key])map[key]={key:key,name:String(ex.name).trim(),bodyweight:bw,value:0,first:null,history:[],entries:[]};
   var r=map[key],value=bw?m.reps:m.weight;r.value=Math.max(r.value,value);if(r.first===null)r.first=value;
   if(!session[key])session[key]={date:w.date,id:w.id,weight:0,reps:0,volume:0};
   var e=session[key];e.weight=Math.max(e.weight,m.weight);e.reps=Math.max(e.reps,m.reps);e.volume+=m.volume;
  });
  Object.keys(session).forEach(function(key){var r=map[key],e=session[key];r.entries.push(e);r.history.push(r.bodyweight?e.reps:e.weight);});
 });
 Object.keys(prs||{}).forEach(function(name){var v=Number(prs[name]);if(!Number.isFinite(v)||v<0)return;var key=name.trim().toLocaleLowerCase('sv-SE')+'|kg';
  if(!map[key]&&map[name.trim().toLocaleLowerCase('sv-SE')+'|bodyweight'])return;
  if(!map[key])map[key]={key:key,name:name,bodyweight:false,first:v,history:[],entries:[]};map[key].value=v;
 });
 return Object.keys(map).map(function(key){var r=map[key];r.gain=Math.max(0,r.value-r.first);return r;}).sort(function(a,b){return b.value-a.value;});
}
var api={exercise:exercise,workout:workout,snapshot:snapshot,records:records};
if(typeof module==='object'&&module.exports)module.exports=api;else root.PulseStrength=api;
})(typeof window==='undefined'?globalThis:window);
