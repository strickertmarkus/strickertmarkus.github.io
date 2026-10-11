/* Records are rebuilt from completed workouts and explicit manual entries. */
(function(root){
 'use strict';
 function key(name){return String(name||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}
 function group(name,hint){
  if(['Push','Pull','Kondition'].indexOf(hint)>=0)return hint;
  var nameKey=key(name);
  if(/löp|gång|cykl|cykel|roddmaskin|cardio|crosstrainer|simning|intervall/.test(nameKey))return 'Kondition';
  if(/rodd|marklyft|deadlift|curl|biceps|lats|chins|pull|rygg|face.?pull|hamstring|lårcurl/.test(nameKey))return 'Pull';
  return 'Push';
 }
 function positive(value){return Number.isFinite(Number(value))&&Number(value)>0;}
 function build(history,manual,timed){
  var candidates=[],records=Object.create(null),overrides=Object.create(null);
  (history||[]).forEach(function(workout){
   if(!workout||workout.demo)return;
   var perWorkout=Object.create(null);
   (workout.exercises||[]).forEach(function(ex){
    var id=key(ex.name);if(!id||ex.mode!==(timed?'min':'kg'))return;
    (ex.sets||[]).forEach(function(set){
     var value=Number(timed?set.minutes:set.weight);
     if(!set.done||set.skipped||!positive(value)||(!timed&&!positive(set.reps)))return;
     var record=perWorkout[id];
     if(!record)record=perWorkout[id]={name:String(ex.name).trim(),value:0,date:workout.date||'',group:timed?'Kondition':group(ex.name,workout.type),workoutId:workout.id||''};
     record.value=timed?record.value+value:Math.max(record.value,value);
    });
   });
   Object.values(perWorkout).forEach(function(record){candidates.push(record);});
  });
  if(!timed)Object.values(manual||{}).forEach(function(record){
   if(!record||!key(record.name)||!positive(record.weight))return;
   var id=key(record.name),recordGroup=group(record.name,record.group);
   if(record.group)overrides[id]=recordGroup;
   if(positive(record.previousWeight)&&Number(record.previousWeight)<Number(record.weight))candidates.push({name:record.name,value:Number(record.previousWeight),date:record.previousDate||record.date||'',group:recordGroup});
   candidates.push({name:record.name,value:Number(record.weight),date:record.date||'',group:recordGroup});
  });
  candidates.sort(function(a,b){return String(a.date).localeCompare(String(b.date));});
  candidates.forEach(function(candidate){
   var id=key(candidate.name),old=records[id];
   if(old&&candidate.value<=old.value)return;
   records[id]={name:candidate.name,value:candidate.value,date:candidate.date,group:candidate.group,workoutId:candidate.workoutId||'',gain:old?+(candidate.value-old.value).toFixed(3):0};
   var record=records[id];
   record[timed?'minutes':'weight']=candidate.value;
   if(old){record[timed?'previousMinutes':'previousWeight']=old.value;record.previousDate=old.date;}
  });
  Object.keys(overrides).forEach(function(id){if(records[id])records[id].group=overrides[id];});
  return records;
 }
 function collect(history,manual){return build(history,manual,false);}
 function cardio(history){return build(history,{},true);}
 function manualRecord(previous,name,weight,date,recordGroup){
  var record={name:name,weight:weight,date:date,group:group(name,recordGroup)};
  if(previous){
   var increased=weight>previous.weight,baseline=increased?previous.weight:previous.previousWeight;
   if(positive(baseline)&&baseline<weight){record.previousWeight=baseline;record.previousDate=(increased?previous.date:previous.previousDate)||'';}
  }
  return record;
 }
 root.IngemarRecords={key:key,collect:collect,cardio:cardio,group:group,manualRecord:manualRecord};
})(typeof window==='undefined'?globalThis:window);
