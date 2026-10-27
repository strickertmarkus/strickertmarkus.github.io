/* Pass builder preview (?ui=mittpass) — presentation layer for the classic
 * Maja/Markus builder. The original inputs stay the single source of truth:
 * rows are still parsed by parseExerciseRow and saved by the existing code.
 * This file only adds: a card-less row summary, a number sheet that writes
 * into the original inputs, and guide suggestions in the exercise picker. */
(function(){
'use strict';
var root=document.documentElement;
if(!root.classList.contains('pbu-v1'))return;

var MUSCLE_IMAGE={'Bröst':'chest','Axlar':'shoulders','Rygg':'back','Biceps':'biceps','Triceps':'triceps','Mage':'abs','Framsida lår':'quads','Säte':'glutes','Baksida lår':'hamstrings','Vader':'calves'};
var LEGS=['Framsida lår','Baksida lår','Säte','Vader'];
var UPPER=['Bröst','Axlar','Rygg','Biceps','Triceps'];
/* Word stems in a pass name → primary muscle groups in the guide. */
var TOKENS=[
 [/bröst|chest|pec/,['Bröst']],
 [/axl|axel|shoulder|delt/,['Axlar']],
 [/rygg|back|lats?\b/,['Rygg']],
 [/bicep/,['Biceps']],
 [/tricep/,['Triceps']],
 [/\barm/,['Biceps','Triceps']],
 [/mage|bål|core|\babs?\b/,['Mage']],
 [/baksida|hamstring/,['Baksida lår']],
 [/framsida|quad/,['Framsida lår']],
 [/säte|rump|glute|höft/,['Säte']],
 [/vad|calf|calves/,['Vader']],
 [/\bben\b|\bben[a-zåäö]|\blår|underkropp|\blegs?\b/,LEGS],
 [/push|tryck/,['Bröst','Axlar','Triceps']],
 [/pull|drag/,['Rygg','Biceps']],
 [/överkropp|upper/,UPPER],
 [/helkropp|full ?body/,UPPER.concat(LEGS,['Mage'])]
];
var CARDIO=/kondition|cardio|löp|jogg|cykel|cykl|spinning|intervall|promenad|gång/;

var api=function(){return window.PulseExplore||null;};
var byId=function(id){return document.getElementById(id);};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
var key=function(s){return String(s||'').trim().toLocaleLowerCase('sv-SE').replace(/\s+/g,' ');};
var num=function(v){var n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?n:0;};
var fmt=function(n){return String(Math.round(n*100)/100).replace('.',',');};
function guideByName(name){
 var p=api(),k=key(name);if(!p||!k)return null;
 for(var i=0;i<p.exercises.length;i++)if(key(p.exercises[i].name)===k)return p.exercises[i];
 return null;
}
function musclesFromText(text){
 var t=key(text),out=[];
 TOKENS.forEach(function(entry){if(entry[0].test(t))entry[1].forEach(function(m){if(out.indexOf(m)<0)out.push(m);});});
 return out;
}
function imageFor(name){
 var g=guideByName(name),m=g?g.muscles[0]:musclesFromText(name)[0];
 return m&&MUSCLE_IMAGE[m]?'assets/atlas-art-v1/'+MUSCLE_IMAGE[m]+'.webp':'';
}
function rowKind(row){var k=row.querySelector('[class$="-kind"]');return k&&k.value==='cardio'?'cardio':'strength';}
function field(row,n){return row.querySelector('[class*="-metric'+n+'"]');}

/* ---------- Row summary (no cards, no visible number boxes) ---------- */
function summaryText(row){
 var a=num(field(row,1).value),b=num(field(row,2).value);
 if(rowKind(row)==='cardio'){
  var parts=[];if(a)parts.push(fmt(a)+' km');if(b)parts.push(fmt(b)+' min');
  return parts.length?parts.join(' · '):'Lägg till distans och tid';
 }
 var w=num(field(row,3).value);
 if(!a&&!b&&!w)return 'Lägg till sets, reps och vikt';
 return (a||'–')+' × '+(b||'–')+(w?' · '+fmt(w)+' kg':'');
}
function paintRow(row){
 var line=row.querySelector('.pbu-summary');if(!line)return;
 var text=summaryText(row);
 var val=line.querySelector('.pbu-summary-value');
 if(val.textContent!==text)val.textContent=text;
 line.classList.toggle('is-empty',/^Lägg till/.test(text));
 var nameInput=row.querySelector('.exercise-name-picker-input-v1');
 var thumb=row.querySelector('.pbu-thumb');
 var src=imageFor(nameInput&&nameInput.value);
 if(thumb.dataset.src!==src){
  thumb.dataset.src=src;
  thumb.innerHTML=src?'<img alt="" src="'+src+'" loading="lazy" decoding="async">':'<span aria-hidden="true">'+esc((nameInput&&nameInput.value||'+').trim().charAt(0).toUpperCase()||'+')+'</span>';
 }
}
function enhanceRow(row){
 if(!row||row.dataset.pbu==='1'||!row.querySelector('.ex-row'))return;
 row.dataset.pbu='1';
 var thumb=document.createElement('span');thumb.className='pbu-thumb';thumb.setAttribute('aria-hidden','true');
 row.insertBefore(thumb,row.firstChild);
 var line=document.createElement('button');
 line.type='button';line.className='pbu-summary';
 line.setAttribute('aria-label','Ändra sets, reps och vikt');
 line.innerHTML='<span class="pbu-summary-value"></span><span class="pbu-summary-edit" aria-hidden="true">Ändra</span>';
 row.querySelector('.ex-row').insertAdjacentElement('afterend',line);
 paintRow(row);
}
function enhanceAll(){document.querySelectorAll('#day-workout-ex-list .ex-row-item').forEach(enhanceRow);}

/* ---------- Number sheet ---------- */
var sheet=null,sheetRow=null;
var SPECS={
 strength:[{n:1,label:'Sets',step:1,min:1,unit:''},{n:2,label:'Reps',step:1,min:0,unit:''},{n:3,label:'Vikt',step:2.5,min:0,unit:'kg'}],
 cardio:[{n:1,label:'Distans',step:.5,min:0,unit:'km'},{n:2,label:'Tid',step:1,min:0,unit:'min'}]
};
function ensureSheet(){
 if(sheet)return sheet;
 sheet=document.createElement('div');
 sheet.className='pbu-sheet';sheet.id='pbu-number-sheet';
 sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','pbu-sheet-title');
 sheet.innerHTML='<div class="pbu-sheet-scrim" data-pbu-close></div>'
  +'<section class="pbu-sheet-panel">'
  +'<div class="pbu-sheet-grip" aria-hidden="true"></div>'
  +'<div class="pbu-sheet-kicker" id="pbu-sheet-kind-label">Styrka</div>'
  +'<h3 id="pbu-sheet-title" class="pbu-sheet-title"></h3>'
  +'<div class="pbu-seg" role="group" aria-label="Typ av övning"><button type="button" data-pbu-kind="strength">Styrka</button><button type="button" data-pbu-kind="cardio">Kondition</button></div>'
  +'<div class="pbu-steppers"></div>'
  +'<div class="pbu-sheet-actions"><button type="button" class="pbu-text-btn" data-pbu-copy>Duplicera</button><button type="button" class="pbu-text-btn is-danger" data-pbu-delete>Ta bort</button></div>'
  +'<button type="button" class="pbu-primary" data-pbu-close>Klar</button>'
  +'</section>';
 document.body.appendChild(sheet);
 sheet.addEventListener('click',function(e){
  var t=e.target;
  if(t.closest('[data-pbu-close]')){closeSheet();return;}
  var kind=t.closest('[data-pbu-kind]');
  if(kind&&sheetRow){
   var btn=Array.prototype.find.call(sheetRow.querySelectorAll('.ex-kind-btn'),function(b){return kind.dataset.pbuKind==='cardio'?/kondition/i.test(b.textContent):/styrka/i.test(b.textContent);});
   if(btn&&typeof window.setExerciseKind==='function')window.setExerciseKind(btn,kind.dataset.pbuKind);
   renderSheet();paintRow(sheetRow);return;
  }
  var step=t.closest('[data-pbu-step]');
  if(step&&sheetRow){
   var spec=specFor(Number(step.dataset.pbuN));
   var input=field(sheetRow,spec.n),value=num(input.value)+Number(step.dataset.pbuStep)*spec.step;
   write(input,Math.max(spec.min,Math.round(value*100)/100));
   var shown=sheet.querySelector('[data-pbu-value="'+spec.n+'"]');if(shown)shown.value=input.value;
   paintRow(sheetRow);return;
  }
  if(t.closest('[data-pbu-copy]')&&sheetRow){
   var plus=sheetRow.querySelector('.builder-row-plus-v3');var row=sheetRow;closeSheet();if(plus)plus.click();
   setTimeout(function(){var next=row.nextElementSibling;if(next&&next.classList.contains('ex-row-item'))next.scrollIntoView({block:'nearest',behavior:'smooth'});},60);
   return;
  }
  if(t.closest('[data-pbu-delete]')&&sheetRow){
   var del=sheetRow.querySelector('.ex-del');closeSheet();if(del)del.click();
  }
 });
 sheet.addEventListener('input',function(e){
  var el=e.target.closest('[data-pbu-value]');if(!el||!sheetRow)return;
  write(field(sheetRow,Number(el.dataset.pbuValue)),el.value===''?'':num(el.value));
  paintRow(sheetRow);
 });
 sheet.addEventListener('focusin',function(e){var el=e.target.closest('[data-pbu-value]');if(el&&el.select)setTimeout(function(){try{el.select();}catch(_e){}},0);});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('show')){e.preventDefault();e.stopPropagation();closeSheet();}},true);
 return sheet;
}
function specFor(n){return SPECS[rowKind(sheetRow)].filter(function(s){return s.n===n;})[0];}
function write(input,value){
 if(!input)return;
 input.value=value===''?'':String(value);
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.dispatchEvent(new Event('change',{bubbles:true}));
}
function renderSheet(){
 var kind=rowKind(sheetRow);
 var name=(sheetRow.querySelector('.exercise-name-picker-input-v1')||{}).value||'Övning';
 sheet.querySelector('.pbu-sheet-title').textContent=name;
 sheet.querySelector('#pbu-sheet-kind-label').textContent=kind==='cardio'?'Kondition':'Styrka';
 sheet.querySelectorAll('[data-pbu-kind]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.pbuKind===kind?'true':'false');});
 var wrap=sheet.querySelector('.pbu-steppers');
 wrap.dataset.count=SPECS[kind].length;
 wrap.innerHTML=SPECS[kind].map(function(s){
  var v=field(sheetRow,s.n).value;
  return '<div class="pbu-stepper"><span class="pbu-stepper-label">'+s.label+(s.unit?' <small>'+s.unit+'</small>':'')+'</span>'
   +'<input class="pbu-stepper-value" data-pbu-value="'+s.n+'" type="text" inputmode="'+(s.step%1?'decimal':'numeric')+'" value="'+esc(v)+'" placeholder="0" aria-label="'+s.label+'" autocomplete="off">'
   +'<div class="pbu-stepper-btns"><button type="button" data-pbu-step="-1" data-pbu-n="'+s.n+'" aria-label="Minska '+s.label.toLowerCase()+'">−</button><button type="button" data-pbu-step="1" data-pbu-n="'+s.n+'" aria-label="Öka '+s.label.toLowerCase()+'">+</button></div></div>';
 }).join('');
}
function openSheet(row){
 ensureSheet();sheetRow=row;renderSheet();
 if(typeof window.closeExerciseNamePicker==='function')window.closeExerciseNamePicker();
 sheet.classList.add('show');
 var first=sheet.querySelector('.pbu-primary');try{first.focus({preventScroll:true});}catch(_e){}
}
function closeSheet(){
 if(!sheet||!sheet.classList.contains('show'))return;
 sheet.classList.remove('show');
 var row=sheetRow;sheetRow=null;
 if(row&&document.body.contains(row)){paintRow(row);var b=row.querySelector('.pbu-summary');try{b.focus({preventScroll:true});}catch(_e){}}
}

/* ---------- Guide suggestions in the existing picker ---------- */
function suggestionContext(input){
 var name=(byId('day-workout-name')||{}).value||'',type=(byId('day-workout-type')||{}).value||'';
 var row=input&&input.closest('.ex-row-item');
 var cardio=(row&&rowKind(row)==='cardio')||(CARDIO.test(key(name))&&!musclesFromText(name).length)||(CARDIO.test(key(type))&&!musclesFromText(name).length);
 var muscles=musclesFromText(name);
 var source=name;
 if(!muscles.length){muscles=musclesFromText(type);source=type;}
 return {cardio:cardio,muscles:muscles,label:cardio?'Kondition':muscles.length>4?String(source||'').trim():muscles.join(' + ')};
}
function suggestionsFor(input){
 var p=api();if(!p)return {ctx:null,list:[]};
 var ctx=suggestionContext(input);
 var list=[];
 if(ctx.cardio)list=p.exercises.filter(function(e){return e.group==='Kondition';});
 else if(ctx.muscles.length){
  ctx.muscles.forEach(function(m){p.exercises.forEach(function(e){if(e.group!=='Kondition'&&e.muscles[0]===m&&list.indexOf(e)<0)list.push(e);});});
 }
 return {ctx:ctx,list:list};
}
function inPass(){
 var names={};
 document.querySelectorAll('#day-workout-ex-list .exercise-name-picker-input-v1').forEach(function(i){if(i.value)names[key(i.value)]=1;});
 return names;
}
function decoratePicker(input){
 var picker=byId('exercise-name-picker-v1');
 if(!picker||!input||!input.closest('#day-workout-modal'))return;
 picker.classList.add('pbu-picker');
 var options=picker.querySelector('.exercise-name-picker-options-v1');
 var old=options.querySelector('.pbu-suggest');if(old)old.remove();
 var s=suggestionsFor(input),used=inPass(),current=key(input.value);
 var html='';
 if(s.list.length){
  // Don't list the same name twice: guide matches win over the registered list.
  var guideNames={};s.list.forEach(function(e){guideNames[key(e.name)]=1;});
  options.querySelectorAll('.exercise-name-picker-row-v1').forEach(function(r){var b=r.querySelector('.exercise-name-picker-option-v1');if(b&&guideNames[key(b.dataset.exerciseName)])r.remove();});
  html+='<div class="pbu-suggest-head"><span>Förslag</span><strong>'+esc(s.ctx.label)+'</strong></div>';
  html+=s.list.map(function(e){
   var img=MUSCLE_IMAGE[e.muscles[0]];
   var isUsed=used[key(e.name)]&&key(e.name)!==current;
   return '<div class="exercise-name-picker-row-v1 pbu-suggest-row'+(isUsed?' is-used':'')+'">'
    +'<button type="button" class="exercise-name-picker-option-v1'+(key(e.name)===current?' is-current':'')+'" role="option" data-exercise-name="'+esc(e.name)+'" data-exercise-kind="'+(e.group==='Kondition'?'cardio':'strength')+'" data-pbu-guide-id="'+e.id+'">'
    +'<span class="pbu-thumb">'+(img?'<img alt="" src="assets/atlas-art-v1/'+img+'.webp" loading="lazy" decoding="async">':'<span>'+esc(e.name.charAt(0))+'</span>')+'</span>'
    +'<span class="pbu-suggest-copy"><span class="pbu-suggest-name">'+esc(e.name)+'</span><small>'+esc(e.muscles.slice(0,3).join(' · '))+(isUsed?' · redan i passet':'')+'</small></span></button>'
    +'<button type="button" class="pbu-info" data-pbu-guide="'+e.id+'" aria-label="Visa '+esc(e.name)+' i övningsguiden">i</button></div>';
  }).join('');
 }else if(s.ctx&&!s.ctx.cardio){
  html+='<div class="pbu-suggest-hint">Tips: döp passet till t.ex. <b>Bröst + Triceps</b> så föreslås övningar ur guiden.</div>';
 }
 var registered=options.querySelectorAll('.exercise-name-picker-row-v1:not(.pbu-suggest-row)').length;
 if(html){
  html+='<div class="pbu-suggest-head is-own"><span>Dina övningar</span><strong>'+registered+'</strong></div>';
  var wrap=document.createElement('div');wrap.className='pbu-suggest';wrap.innerHTML=html;
  options.insertBefore(wrap,options.firstChild);
  var empty=options.querySelector('.exercise-name-picker-empty-v1');
  if(empty&&s.list.length)empty.textContent='Inga egna övningar i den här kategorin ännu.';
 }
 options.scrollTop=0;
}
/* Selecting a guide suggestion also fills empty sets/reps from the guide's
   standard prescription, so the row is ready to save. */
function fillFromGuide(row,id){
 var p=api();if(!p||!row)return;
 var rx=p.prescription(Number(id));if(!rx)return;
 setTimeout(function(){
  if(rowKind(row)==='cardio'){
   if(!field(row,2).value&&rx.minutes)write(field(row,2),rx.minutes);
  }else if(rx.mode==='kg'){
   if(!field(row,1).value)write(field(row,1),rx.sets);
   if(!field(row,2).value&&rx.reps)write(field(row,2),rx.reps);
  }
  paintRow(row);
 },0);
}

/* ---------- Guide overlay (keeps the builder state underneath) ---------- */
var guide=null,guideInput=null,guidePrevious=null;
function openGuide(id,input){
 guideInput=input;
 try{guidePrevious=localStorage.getItem('pulse-last-exercise');localStorage.setItem('pulse-last-exercise',String(id));}catch(_e){}
 if(typeof window.closeExerciseNamePicker==='function')window.closeExerciseNamePicker();
 if(!guide){
  guide=document.createElement('div');guide.className='pbu-guide';guide.setAttribute('role','dialog');guide.setAttribute('aria-label','Övningsguide');
  guide.innerHTML='<div class="pbu-guide-bar"><button type="button" class="pbu-guide-back" data-pbu-guide-close>← Tillbaka till passet</button><button type="button" class="pbu-guide-pick" data-pbu-guide-pick>Välj övningen</button></div><iframe class="pbu-guide-frame" title="Övningsguide"></iframe>';
  document.body.appendChild(guide);
  // The guide's own "Till träningen" link would load the whole app inside the
  // overlay; treat leaving the guide page as going back to the pass.
  guide.querySelector('iframe').addEventListener('load',function(){
   try{var path=this.contentWindow.location.pathname;if(guide.classList.contains('show')&&path&&!/pulse-exercise-guide\.html$/.test(path)&&path!=='blank')closeGuide(true);}catch(_e){}
  });
  guide.addEventListener('click',function(e){
   if(e.target.closest('[data-pbu-guide-close]'))closeGuide(true);
   else if(e.target.closest('[data-pbu-guide-pick]'))pickFromGuide();
  });
 }
 guide.dataset.id=String(id);
 var user='';try{user=new URLSearchParams(parent.location.search).get('user')||new URLSearchParams(location.search).get('user')||'';}catch(_e){}
 guide.querySelector('iframe').src='pulse-exercise-guide.html?embedded=builder'+(user==='maja'?'&user=maja':'');
 guide.classList.add('show');
}
function closeGuide(reopen){
 if(!guide)return;
 guide.classList.remove('show');
 guide.querySelector('iframe').src='about:blank';
 try{if(guidePrevious==null)localStorage.removeItem('pulse-last-exercise');else localStorage.setItem('pulse-last-exercise',guidePrevious);}catch(_e){}
 var input=guideInput;guideInput=null;
 if(reopen&&input&&document.body.contains(input)&&typeof window.renderExerciseNamePicker==='function')window.renderExerciseNamePicker(input);
}
function pickFromGuide(){
 var p=api(),input=guideInput,id=Number(guide.dataset.id);
 // Follow the exercise the person swiped to inside the guide, if they moved on.
 try{var seen=Number(localStorage.getItem('pulse-last-exercise'));if(p&&p.exercises[seen])id=seen;}catch(_e){}
 var e=p&&p.exercises[id];
 closeGuide(false);
 if(!e||!input||!document.body.contains(input))return;
 var row=input.closest('.ex-row-item');
 var kind=e.group==='Kondition'?'cardio':'strength';
 if(row&&rowKind(row)!==kind){var b=Array.prototype.find.call(row.querySelectorAll('.ex-kind-btn'),function(x){return kind==='cardio'?/kondition/i.test(x.textContent):/styrka/i.test(x.textContent);});if(b)window.setExerciseKind(b,kind);}
 write(input,e.name);
 fillFromGuide(row,id);
}

/* ---------- Wiring ---------- */
function init(){
 var list=byId('day-workout-ex-list');
 if(!list||typeof window.renderExerciseNamePicker!=='function'){return setTimeout(init,120);}
 var modal=byId('day-workout-modal');modal.classList.add('pbu-builder');
 enhanceAll();
 new MutationObserver(function(records){
  records.forEach(function(r){r.addedNodes.forEach(function(n){if(n.nodeType===1&&n.classList.contains('ex-row-item'))enhanceRow(n);});});
 }).observe(list,{childList:true});
 list.addEventListener('input',function(e){var row=e.target.closest('.ex-row-item');if(row&&!e.target.closest('.per-set-v7'))paintRow(row);});
 list.addEventListener('change',function(e){var row=e.target.closest('.ex-row-item');if(row)paintRow(row);});
 list.addEventListener('click',function(e){
  var s=e.target.closest('.pbu-summary');if(s){e.preventDefault();openSheet(s.closest('.ex-row-item'));}
 });

 var render=window.renderExerciseNamePicker;
 window.renderExerciseNamePicker=function(input){
  lastPickerInput=input;
  var out=render.apply(this,arguments);
  try{decoratePicker(input);}catch(err){if(window.console)console.warn('pbu picker',err);}
  return out;
 };
 var picker=byId('exercise-name-picker-v1');
 if(picker){
  picker.addEventListener('click',function(e){
   var info=e.target.closest('[data-pbu-guide]');
   var input=window.exerciseNamePickerState?window.exerciseNamePickerState.input:null;
   if(info){e.stopPropagation();e.preventDefault();openGuide(Number(info.dataset.pbuGuide),input||lastPickerInput);return;}
   var opt=e.target.closest('[data-pbu-guide-id]');
   if(opt&&lastPickerInput)fillFromGuide(lastPickerInput.closest('.ex-row-item'),opt.dataset.pbuGuideId);
  },true);
 }
 /* + Lägg till övning opens the picker for the new row straight away. */
 var addBtn=modal.querySelector('[onclick="addDayWorkoutExRow()"]');
 if(addBtn){
  addBtn.classList.add('pbu-add');addBtn.textContent='＋ Lägg till övning';
  addBtn.addEventListener('click',function(){
   setTimeout(function(){
    var rows=list.querySelectorAll('.ex-row-item'),row=rows[rows.length-1];
    var input=row&&row.querySelector('.exercise-name-picker-input-v1');
    if(input&&!input.value){row.scrollIntoView({block:'nearest',behavior:'smooth'});window.renderExerciseNamePicker(input);}
   },40);
  });
 }
}
var lastPickerInput=null;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.PulseBuilderUI={openSheet:openSheet,closeSheet:closeSheet,suggestionsFor:suggestionsFor,musclesFromText:musclesFromText};
})();
