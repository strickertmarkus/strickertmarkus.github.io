/* Highest completed strength-set weight per exercise. Demo/planned/skipped sets never count. */
(function(root){
 'use strict';
 function key(name){return String(name||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}
 function collect(history,previous){
  var records=Object.create(null);
  Object.values(previous||{}).forEach(function(record){
   if(record&&key(record.name)&&Number.isFinite(Number(record.weight))&&Number(record.weight)>0){
    var id=key(record.name);
    if(!records[id]||Number(record.weight)>records[id].weight)records[id]={name:String(record.name).trim(),weight:Number(record.weight),date:record.date||''};
   }
  });
  (history||[]).forEach(function(workout){
   if(!workout||workout.demo)return;
   (workout.exercises||[]).forEach(function(ex){
    if(ex.mode!=='kg'||!key(ex.name))return;
    (ex.sets||[]).forEach(function(set){
     var weight=Number(set.weight),id=key(ex.name);
     if(!set.done||set.skipped||!Number.isFinite(weight)||weight<=0||!(Number(set.reps)>0))return;
     if(!records[id]||weight>records[id].weight)records[id]={name:String(ex.name).trim(),weight:weight,date:workout.date||''};
    });
   });
  });
  return records;
 }
 root.IngemarRecords={key:key,collect:collect};
})(typeof window==='undefined'?globalThis:window);
