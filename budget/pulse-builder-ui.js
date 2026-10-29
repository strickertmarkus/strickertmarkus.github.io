/* Pass builder ("Mitt pass"): calm full-screen list over the classic builder.
 * Presentation layer only. The classic builder's inputs stay the source of
 * truth: rows are parsed by parseExerciseRow and saved by the existing code,
 * and the original row DOM is kept intact so drag-to-reorder still works.
 * No popups: rows expand in place with numbers, exercise choice and the
 * between-sets switch. */
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
 [/rygg|back|\blats?\b/,['Rygg']],
 [/bicep/,['Biceps']],
 [/tricep/,['Triceps']],
 [/\barm/,['Biceps','Triceps']],
 [/mage|bål|core|\babs?\b/,['Mage']],
 [/baksida|hamstring/,['Baksida lår']],
 [/framsida|quad/,['Framsida lår']],
 [/säte|rump|glute|höft/,['Säte']],
 [/\bvad|calf|calves/,['Vader']],
 [/\bben\b|\bben[a-zåäö]|\blår|underkropp|\blegs?\b/,LEGS],
 [/push|tryck/,['Bröst','Axlar','Triceps']],
 [/pull|drag/,['Rygg','Biceps']],
 [/överkropp|upper/,UPPER],
 [/helkropp|full ?body/,UPPER.concat(LEGS,['Mage'])]
];
var CARDIO=/kondition|cardio|löp|jogg|cykel|cykl|spinning|intervall|promenad/;
var SPECS={
 strength:[{n:1,label:'Sets',step:1,min:1,unit:''},{n:2,label:'Reps',step:1,min:0,unit:''},{n:3,label:'Vikt',step:2.5,min:0,unit:'kg'}],
 // Time is shown as min:sek; pace (min/km) is not stored on its own: it is
 // time ÷ distance, and changing it changes the time for the same distance.
 cardio:[{n:1,label:'Distans',step:.5,min:0,unit:'km'},{n:2,label:'Tid',step:1,min:0,unit:'min:s',clock:true},{n:'pace',label:'Snittakt',step:1/12,min:0,unit:'min/km',clock:true,meter:true}]
};
function clock(minutes){var sec=Math.round(minutes*60);return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');}
/* "21:07", "21.07" and "21,07" are minutes and seconds; "21,5" is 21.5 minutes. */
function parseClock(text){
 var t=String(text==null?'':text).trim(),m=t.match(/^(\d{1,3})[:.,](\d{2})$/);
 if(m)return Number(m[2])<60?Number(m[1])+Number(m[2])/60:NaN;
 return t===''?0:num(t);
}
function specValue(row,spec){
 if(spec.n==='pace'){var d=num(field(row,1).value),t=num(field(row,2).value);return d>0&&t>0?t/d:0;}
 return num(field(row,spec.n).value);
}
function setSpecValue(row,spec,v){
 v=Math.max(spec.min,v);
 if(spec.n==='pace'){var d=num(field(row,1).value);if(d>0)write(field(row,2),v?Math.round(v*d*100)/100:'');return;}
 write(field(row,spec.n),spec.clock&&!v?'':Math.round(v*100)/100);
}
function shownValue(row,spec){
 var v=specValue(row,spec);
 if(spec.clock)return v>0?clock(v):'';
 return spec.n==='pace'?'':(field(row,spec.n).value===''?'':fmt(v));
}
/* Refresh the shown numbers, except the one being typed in. */
function syncSteps(row,except){
 SPECS[rowKind(row)].forEach(function(spec){
  var el=row.querySelector('[data-pbu-value="'+spec.n+'"]');if(!el||el===except)return;
  var v=shownValue(row,spec);if(el.value!==v)el.value=v;
  if(spec.n==='pace'){
   el.placeholder=num(field(row,1).value)>0?'0:00':'ange km';
   var pace=specValue(row,spec),meter=el.closest('.pbu-meter');
   if(meter){meter.classList.toggle('is-empty',!pace);var pt=meter.querySelector('.pbu-meter-point');if(pt)pt.style.left=(pace?Math.max(0,Math.min(1,(7-pace)/4))*100:50).toFixed(1)+'%';}
  }
 });
}

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
function nameInput(row){return row.querySelector('.ex-row input[class*="-name"]');}
function write(input,value){
 if(!input)return;
 input.value=value===''?'':String(value);
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.dispatchEvent(new Event('change',{bubbles:true}));
}
function setKind(row,kind){
 if(rowKind(row)===kind)return;
 if(typeof window.ensureExerciseRowKind==='function'){window.ensureExerciseRowKind(row,kind);return;}
 var btn=Array.prototype.find.call(row.querySelectorAll('.ex-kind-btn'),function(b){return kind==='cardio'?/kondition/i.test(b.textContent):/styrka/i.test(b.textContent);});
 if(btn&&typeof window.setExerciseKind==='function')window.setExerciseKind(btn,kind);
}

/* ---------- Row: collapsed summary ---------- */
function specFor(row,n){return SPECS[rowKind(row)].filter(function(s){return String(s.n)===String(n);})[0];}
function summaryText(row){
 var a=num(field(row,1).value),b=num(field(row,2).value);
 if(rowKind(row)==='cardio'){
  var parts=[];if(a)parts.push(fmt(a)+' km');if(b)parts.push(clock(b)+' min');if(a&&b)parts.push(clock(b/a)+' /km');
  return parts.length?parts.join(' · '):'Kondition · ange distans eller tid';
 }
 var w=num(field(row,3).value);
 if(!a&&!b&&!w)return 'Ange sets och reps';
 return (a||'–')+' × '+(b||'–')+(w?' · '+fmt(w)+' kg':'');
}
function paintRow(row){
 if(!row||!row.querySelector('.pbu-head'))return;
 var name=(nameInput(row)||{}).value||'';
 var title=row.querySelector('.pbu-title');
 var text=name||'Välj övning';
 if(title.textContent!==text)title.textContent=text;
 row.classList.toggle('pbu-empty',!name);
 var sum=row.querySelector('.pbu-sum');
 var s=name?summaryText(row):'Tryck för att välja';
 if(sum.textContent!==s)sum.textContent=s;
 var thumb=row.querySelector('.pbu-thumb'),src=name?imageFor(name):'';
 if(thumb.dataset.src!==src){
  thumb.dataset.src=src;
  thumb.innerHTML=src?'<img alt="" src="'+src+'" loading="lazy" decoding="async">':'<i class="pbu-plus" aria-hidden="true"></i>';
 }
 syncBetween(row);
}
function enhanceRow(row){
 if(!row||row.dataset.pbu==='1'||!row.querySelector('.ex-row'))return;
 row.dataset.pbu='1';row.classList.add('pbu-row');
 var thumb=document.createElement('span');thumb.className='pbu-thumb';thumb.setAttribute('aria-hidden','true');
 var head=document.createElement('button');head.type='button';head.className='pbu-head';head.setAttribute('aria-expanded','false');
 head.innerHTML='<span class="pbu-title"></span><span class="pbu-sum"></span><span class="pbu-between-note" hidden></span>';
 var panel=document.createElement('div');panel.className='pbu-panel';
 panel.innerHTML='<div class="pbu-pick" hidden></div>'
  +'<div class="pbu-seg" role="group" aria-label="Typ av övning"><button type="button" data-pbu-kind="strength">Styrka</button><button type="button" data-pbu-kind="cardio">Kondition</button></div>'
  +'<div class="pbu-steps"></div>';
 var actions=document.createElement('div');actions.className='pbu-actions';
 actions.innerHTML='<button type="button" class="pbu-link" data-pbu-change>Byt övning</button>'
  +'<button type="button" class="pbu-link is-danger" data-pbu-delete>Ta bort</button>';
 row.insertBefore(head,row.firstChild);
 row.insertBefore(thumb,row.firstChild);
 // Clock: shows/hides this row's between-sets settings; lit when they are on.
 var clock=document.createElement('button');clock.type='button';clock.className='pbu-between-btn';
 clock.setAttribute('aria-label','Mellan set');clock.setAttribute('aria-pressed','false');
 clock.innerHTML='<i class="pbu-clock" aria-hidden="true"></i>';
 row.appendChild(clock);
 // Quick remove beside a chosen exercise; asks first.
 var quick=document.createElement('button');quick.type='button';quick.className='pbu-quick-del';quick.setAttribute('aria-label','Ta bort övningen');
 quick.innerHTML='<i class="pbu-cross" aria-hidden="true"></i>';
 row.appendChild(quick);
 row.appendChild(panel);row.appendChild(actions);
 // The log form's "Tid för övningen" belongs with the numbers.
 var timing=row.querySelector(':scope>.ex-duration-editor-v7');if(timing){timing.classList.add('pbu-timing');panel.appendChild(timing);}
 new MutationObserver(function(){syncBetween(row);}).observe(row,{attributes:true,attributeFilter:['data-between-sets-v7']});
 paintRow(row);
}
/* "Vill du verkligen ta bort …?" in the builder's own look. */
function confirmRemove(row){
 var modal=row.closest('.modal-overlay');if(!modal)return;
 var name=((nameInput(row)||{}).value||'').trim()||'övningen';
 var old=modal.querySelector('.pbu-confirm');if(old)old.remove();
 var box=document.createElement('div');box.className='pbu-confirm';box.setAttribute('role','alertdialog');box.setAttribute('aria-modal','true');
 box.innerHTML='<div class="pbu-confirm-card"><p class="pbu-confirm-title">Vill du verkligen ta bort <b></b>?</p><p class="pbu-confirm-text">Övningen tas bort från passet. Dina tidigare loggade pass påverkas inte.</p><div class="pbu-confirm-actions"><button type="button" class="pbu-confirm-cancel">Avbryt</button><button type="button" class="pbu-confirm-ok">Ta bort</button></div></div>';
 box.querySelector('b').textContent=name;
 var done=function(){box.classList.remove('show');setTimeout(function(){box.remove();},180);};
 box.addEventListener('click',function(e){
  if(e.target.closest('.pbu-confirm-ok')){done();var del=row.querySelector('.ex-del');if(del)del.click();return;}
  if(e.target.closest('.pbu-confirm-cancel')||e.target===box)done();
 });
 modal.appendChild(box);
 requestAnimationFrame(function(){box.classList.add('show');var c=box.querySelector('.pbu-confirm-cancel');if(c)c.focus({preventScroll:true});});
}
function betweenConfig(row){
 try{var c=JSON.parse(row.dataset.betweenSetsV7||'{}');}catch(_){c={};}
 return {enabled:!!c.enabled,type:c.type==='custom'?'custom':'rest',seconds:Number(c.seconds)||(c.type==='custom'?30:60),name:String(c.name||'').trim()};
}
/* Between sets in the builder's own look: Vila/Övning as a segmented choice,
   the time as a stepper like sets and reps. The original select and inputs
   stay the source of truth (exercise-builder-between-preview-v7.js). */
function enhanceBetween(row){
 var panel=row.querySelector('.per-set-v7');if(!panel||panel.dataset.pbu==='1')return;
 var fields=panel.querySelector('.per-set-fields-v7'),select=panel.querySelector('[data-per-set-type-v7]'),seconds=panel.querySelector('[data-per-set-seconds-v7]');
 if(!fields||!select||!seconds)return;
 panel.dataset.pbu='1';
 var seg=document.createElement('div');seg.className='pbu-seg pbu-between-seg';seg.setAttribute('role','group');seg.setAttribute('aria-label','Mellan set');
 seg.innerHTML='<button type="button" data-pbu-between-type="rest">Vila</button><button type="button" data-pbu-between-type="custom">Övning</button>';
 var step=document.createElement('div');step.className='pbu-step pbu-between-time';
 step.innerHTML='<span class="pbu-step-label">Tid <small>s</small></span><div class="pbu-step-ctrl"><button type="button" data-pbu-between-step="-1" aria-label="Kortare"><i class="pbu-minus"></i></button><button type="button" data-pbu-between-step="1" aria-label="Längre"><i class="pbu-plus"></i></button></div>';
 var ctrl=step.querySelector('.pbu-step-ctrl');ctrl.insertBefore(seconds,ctrl.lastChild);seconds.classList.add('pbu-step-value');
 fields.insertBefore(seg,fields.firstChild);fields.insertBefore(step,select.nextSibling);
 var name=panel.querySelector('[data-per-set-name-v7]');
 if(name){var wrap=document.createElement('div');wrap.className='pbu-step pbu-between-name';wrap.innerHTML='<span class="pbu-step-label">Övning</span>';fields.insertBefore(wrap,name);wrap.appendChild(name);}
 // The wrapper follows the field's visibility, which the between-sets script sets.
 if(name)new MutationObserver(function(){name.parentNode.hidden=name.hidden;}).observe(name,{attributes:true,attributeFilter:['hidden']});
 if(name)name.parentNode.hidden=name.hidden;
}
function syncBetween(row){
 var btn=row.querySelector('.pbu-between-btn');if(!btn)return;
 enhanceBetween(row);
 var cfg=betweenConfig(row),on=cfg.enabled&&rowKind(row)!=='cardio';
 // Red for an exercise between sets, cyan for rest.
 btn.classList.toggle('is-on',on&&cfg.type==='custom');
 btn.classList.toggle('is-rest',on&&cfg.type==='rest');
 btn.setAttribute('aria-pressed',row.classList.contains('pbu-between-open')?'true':'false');
 var note=row.querySelector('.pbu-between-note');
 if(note){
  var text=on?(cfg.type==='rest'?'Vila ':(cfg.name||'Övning')+' · ')+cfg.seconds+' s mellan set':'';
  note.hidden=!on;note.classList.toggle('is-rest',cfg.type==='rest');
  if(note.textContent!==text)note.textContent=text;
 }
 row.querySelectorAll('[data-pbu-between-type]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.pbuBetweenType===cfg.type));});
}
/* The day builder's list and the log form's list ("Logga träning"). */
var LISTS='#day-workout-ex-list,#wk-modal #ex-list';
function enhanceAll(){document.querySelectorAll(LISTS.split(',').map(function(s){return s+' .ex-row-item';}).join(',')).forEach(enhanceRow);}

/* ---------- Row: expanded panel ---------- */
function openRow(row,opts){
 opts=opts||{};
 row.parentNode.querySelectorAll('.pbu-row.pbu-open').forEach(function(r){if(r!==row)closeRow(r);});
 row.classList.add('pbu-open');
 row.querySelector('.pbu-head').setAttribute('aria-expanded','true');
 var empty=!(nameInput(row)||{}).value;
 if(empty||opts.pick)showPicker(row);else hidePicker(row);
 renderSteps(row);syncActions(row);
 if(opts.scroll!==false)setTimeout(function(){try{row.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(_e){}},30);
}
function closeRow(row){
 row.classList.remove('pbu-open');
 var h=row.querySelector('.pbu-head');if(h)h.setAttribute('aria-expanded','false');
 hidePicker(row);paintRow(row);
}
function syncActions(row){
 var kind=rowKind(row);
 row.querySelectorAll('[data-pbu-kind]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.pbuKind===kind?'true':'false');});
}
function renderSteps(row){
 var wrap=row.querySelector('.pbu-steps'),kind=rowKind(row);
 wrap.dataset.count=SPECS[kind].length;wrap.dataset.kind=kind;
 row.classList.toggle('pbu-is-cardio',kind==='cardio');
 wrap.innerHTML=SPECS[kind].map(function(s){
  var v=shownValue(row,s);
  // Pace as the training log's interval meter (7:00 slow → 3:00 fast), with its number and steps.
  if(s.meter)return '<div class="pbu-step pbu-meter"><div class="pbu-meter-read"><span class="pbu-step-label">'+s.label+' <small>'+s.unit+'</small></span>'
   +'<input class="pbu-step-value" data-pbu-value="'+s.n+'" type="text" inputmode="decimal" value="'+esc(v)+'" placeholder="0:00" aria-label="'+s.label+'" autocomplete="off"></div>'
   +'<div class="pbu-meter-signal" aria-hidden="true"><div class="pbu-meter-track"><i class="pbu-meter-point"></i></div><div class="pbu-meter-scale"><span>7:00</span><span>3:00</span></div></div>'
   +'<div class="pbu-meter-ctrl"><button type="button" data-pbu-step="-1" data-pbu-n="'+s.n+'" aria-label="Snabbare"><i class="pbu-minus"></i></button><button type="button" data-pbu-step="1" data-pbu-n="'+s.n+'" aria-label="Långsammare"><i class="pbu-plus"></i></button></div></div>';
  return '<div class="pbu-step"><span class="pbu-step-label">'+s.label+(s.unit?' <small>'+s.unit+'</small>':'')+'</span>'
   +'<div class="pbu-step-ctrl"><button type="button" data-pbu-step="-1" data-pbu-n="'+s.n+'" aria-label="Minska '+s.label.toLowerCase()+'"><i class="pbu-minus"></i></button>'
   +'<input class="pbu-step-value" data-pbu-value="'+s.n+'" type="text" inputmode="'+(s.step%1||s.clock?'decimal':'numeric')+'" value="'+esc(v)+'" placeholder="'+(s.clock?'0:00':'0')+'" aria-label="'+s.label+'" autocomplete="off">'
   +'<button type="button" data-pbu-step="1" data-pbu-n="'+s.n+'" aria-label="Öka '+s.label.toLowerCase()+'"><i class="pbu-plus"></i></button></div></div>';
 }).join('');
 syncSteps(row);
}

/* ---------- Inline exercise choice (no popup) ---------- */
function passContext(row){
 // The log form has no pass name; its type ("Bröst + Triceps") carries the muscles.
 var log=!!row.closest('#wk-modal');
 var name=log?'':(byId('day-workout-name')||{}).value||'',type=(byId(log?'wk-type':'day-workout-type')||{}).value||'';
 var muscles=musclesFromText(name),source=name;
 if(!muscles.length){muscles=musclesFromText(type);source=type;}
 var cardio=rowKind(row)==='cardio'||(!muscles.length&&(CARDIO.test(key(name))||CARDIO.test(key(type))));
 return {cardio:cardio,muscles:muscles,type:type,label:cardio?'Kondition':muscles.length>4?String(source).trim():muscles.join(' + ')};
}
function guideSuggestions(ctx){
 var p=api();if(!p)return [];
 if(ctx.cardio)return p.exercises.filter(function(e){return e.group==='Kondition';});
 var list=[];
 ctx.muscles.forEach(function(m){p.exercises.forEach(function(e){if(e.group!=='Kondition'&&e.muscles[0]===m&&list.indexOf(e)<0)list.push(e);});});
 return list;
}
function ownExercises(ctx,row){
 if(typeof window.getExerciseNameCatalog!=='function')return [];
 try{return window.getExerciseNameCatalog(ctx.type||'Övrigt',ctx.cardio?'cardio':rowKind(row))||[];}catch(_e){return [];}
}
function allOwnExercises(ctx,row){
 if(typeof window.getAllExerciseNames!=='function')return ownExercises(ctx,row);
 try{return window.getAllExerciseNames()||[];}catch(_e){return ownExercises(ctx,row);}
}
function usedNames(except){
 var used={};
 except.parentNode.querySelectorAll('.pbu-row').forEach(function(r){if(r===except)return;var v=(nameInput(r)||{}).value;if(v)used[key(v)]=1;});
 return used;
}
function showPicker(row){
 var pick=row.querySelector('.pbu-pick');
 pick.hidden=false;row.classList.add('pbu-picking');
 pick.innerHTML='<label class="pbu-search"><span class="pbu-search-icon" aria-hidden="true"></span><input type="text" data-pbu-search placeholder="Sök eller skriv eget namn" autocomplete="off" enterkeyhint="done" aria-label="Sök övning"></label><div class="pbu-options" role="listbox"></div>';
 renderOptions(row,'');
}
function hidePicker(row){
 var pick=row.querySelector('.pbu-pick');if(!pick)return;
 pick.hidden=true;pick.innerHTML='';row.classList.remove('pbu-picking');
}
function searchQuery(query){
 var q=key(query),muscles=musclesFromText(query);
 // Also match muscle names directly, e.g. "lår" or "mage".
 Object.keys(MUSCLE_IMAGE).forEach(function(m){if(q.length>=3&&key(m).indexOf(q)>=0&&muscles.indexOf(m)<0)muscles.push(m);});
 return {q:q,muscles:muscles};
}
/* Lower is better: name 0, primary muscle 1, other muscle 2, category or
   equipment 3; -1 means no match. */
function guideScore(e,sq){
 if(key(e.name).indexOf(sq.q)>=0)return 0;
 if(sq.muscles.indexOf(e.muscles[0])>=0)return 1;
 if(e.muscles.some(function(m){return sq.muscles.indexOf(m)>=0;}))return 2;
 // Compare on a short stem so "hantel" also finds "Hantlar" and "kabel" "Kabel & maskin".
 var stem=sq.q.length>=4?sq.q.slice(0,4):sq.q;
 if(sq.q.length>=3&&(key(e.group).indexOf(stem)>=0||key(e.equipment).indexOf(stem)>=0))return 3;
 return -1;
}
function ownMatches(name,sq){
 if(key(name).indexOf(sq.q)>=0)return true;
 var g=guideByName(name),muscles=g?g.muscles:musclesFromText(name);
 return muscles.some(function(m){return sq.muscles.indexOf(m)>=0;});
}
function renderOptions(row,query){
 var box=row.querySelector('.pbu-options');if(!box)return;
 var ctx=passContext(row),q=key(query),used=usedNames(row),current=key((nameInput(row)||{}).value);
 var guide,own,gk={};
 if(q){
  // Search covers the whole guide: names, muscle groups (also stems such as
  // "axl" or "ben"), category (Push/Pull/Ben/Kondition) and equipment.
  var sq=searchQuery(query);
  guide=(api()?api().exercises:[]).map(function(e,i){return {e:e,score:guideScore(e,sq),i:i};})
   .filter(function(x){return x.score>=0;})
   .sort(function(a,b){return a.score-b.score||a.i-b.i;})
   .map(function(x){return x.e;});
  guide.forEach(function(e){gk[key(e.name)]=1;});
  // A search reaches all of your own exercises, not only this pass type's.
  own=allOwnExercises(ctx,row).filter(function(e){return !gk[key(e.name)]&&ownMatches(e.name,sq);});
 }else{
  guide=guideSuggestions(ctx);
  guide.forEach(function(e){gk[key(e.name)]=1;});
  own=ownExercises(ctx,row).filter(function(e){return !gk[key(e.name)];});
 }
 var html='',ownHtml='',guideHtml='';
 if(own.length){
  var limit=q?own.length:Math.min(own.length,6);
  ownHtml+='<div class="pbu-group">Dina övningar</div>';
  ownHtml+=own.slice(0,limit).map(function(e){
   return '<div class="pbu-opt is-own'+(key(e.name)===current?' is-current':'')+'"><button type="button" class="pbu-opt-main" data-pbu-pick="'+esc(e.name)+'" data-pbu-kind-pick="'+e.kind+'"><span class="pbu-opt-copy"><span class="pbu-opt-name">'+esc(e.name)+'</span></span></button></div>';
  }).join('');
 }
 if(guide.length){
  guideHtml+='<div class="pbu-group">'+(q?'Övningsguiden'+(sq.muscles.length&&sq.muscles.length<=4?' · '+esc(sq.muscles.join(' + ')):''):'Förslag · '+esc(ctx.label))+'</div>';
  guideHtml+=guide.slice(0,q?16:10).map(function(e){
   var img=MUSCLE_IMAGE[e.muscles[0]],isUsed=used[key(e.name)];
   return '<div class="pbu-opt'+(isUsed?' is-used':'')+(key(e.name)===current?' is-current':'')+'">'
    +'<button type="button" class="pbu-opt-main" data-pbu-pick="'+esc(e.name)+'" data-pbu-kind-pick="'+(e.group==='Kondition'?'cardio':'strength')+'" data-pbu-guide-id="'+e.id+'">'
    +'<span class="pbu-thumb is-small">'+(img?'<img alt="" src="assets/atlas-art-v1/'+img+'.webp" loading="lazy" decoding="async">':'')+'</span>'
    +'<span class="pbu-opt-copy"><span class="pbu-opt-name">'+esc(e.name)+'</span><small>'+esc(e.muscles.slice(0,3).join(' · '))+(isUsed?' · redan i passet':'')+'</small></span></button>'
    +'<button type="button" class="pbu-link" data-pbu-guide="'+e.id+'" aria-label="Visa '+esc(e.name)+' i övningsguiden">Visa</button></div>';
  }).join('');
 }
 // While searching, your own exercises come first; otherwise the suggestions do.
 html=q?ownHtml+guideHtml:guideHtml+ownHtml;
 var typed=String(query||'').trim();
 var exact=typed&&(guide.concat(own)).some(function(e){return key(e.name)===key(typed);});
 if(typed&&!exact)html+='<button type="button" class="pbu-new" data-pbu-pick="'+esc(typed.slice(0,70))+'" data-pbu-kind-pick="'+(ctx.cardio?'cardio':rowKind(row))+'">Lägg till <b>'+esc(typed.slice(0,70))+'</b> som ny övning</button>';
 if(!html)html='<p class="pbu-hint">Döp passet till t.ex. <b>Bröst + Triceps</b> så får du förslag ur övningsguiden, eller skriv ett eget namn ovan.</p>';
 else if(!guide.length&&!q&&!ctx.cardio)html='<p class="pbu-hint">Döp passet till t.ex. <b>Bröst + Triceps</b> så får du förslag ur övningsguiden.</p>'+html;
 box.innerHTML=html;
}
function choose(row,name,kind,guideId){
 if(!name)return;
 setKind(row,kind||rowKind(row));
 write(nameInput(row),name);
 if(guideId!=null&&guideId!=='')fillFromGuide(row,Number(guideId));
 hidePicker(row);renderSteps(row);syncActions(row);
 paintRow(row);
}
/* A guide choice fills empty fields with the guide's standard prescription. */
function fillFromGuide(row,id){
 var p=api();if(!p)return;
 var rx=p.prescription(id);if(!rx)return;
 if(rowKind(row)==='cardio'){if(!field(row,2).value&&rx.minutes)write(field(row,2),rx.minutes);}
 else if(rx.mode==='kg'){
  if(!field(row,1).value)write(field(row,1),rx.sets);
  if(!field(row,2).value&&rx.reps)write(field(row,2),rx.reps);
 }
}

/* ---------- Guide page (full screen, keeps the builder underneath) ---------- */
var guide=null,guideRow=null,guidePrevious=null;
function openGuide(id,row){
 guideRow=row;
 try{guidePrevious=localStorage.getItem('pulse-last-exercise');localStorage.setItem('pulse-last-exercise',String(id));}catch(_e){}
 if(!guide){
  guide=document.createElement('div');guide.className='pbu-guide';guide.setAttribute('role','dialog');guide.setAttribute('aria-label','Övningsguide');
  guide.innerHTML='<div class="pbu-guide-bar"><button type="button" class="pbu-guide-back" data-pbu-guide-close><i class="pbu-chev-left" aria-hidden="true"></i>Tillbaka till passet</button><button type="button" class="pbu-guide-pick" data-pbu-guide-pick>Välj övningen</button></div><iframe class="pbu-guide-frame" title="Övningsguide"></iframe>';
  document.body.appendChild(guide);
  guide.querySelector('iframe').addEventListener('load',function(){
   // The guide's own "Till träningen" link would load the app inside here.
   try{var path=this.contentWindow.location.pathname;if(guide.classList.contains('show')&&path!=='blank'&&!/pulse-exercise-guide\.html$/.test(path))closeGuide();}catch(_e){}
  });
  guide.addEventListener('click',function(e){
   if(e.target.closest('[data-pbu-guide-close]'))closeGuide();
   else if(e.target.closest('[data-pbu-guide-pick]'))pickFromGuide();
  });
 }
 guide.dataset.id=String(id);
 var user='';try{user=new URLSearchParams(parent.location.search).get('user')||new URLSearchParams(location.search).get('user')||'';}catch(_e){}
 guide.querySelector('iframe').src='pulse-exercise-guide.html?embedded=builder'+(user==='maja'?'&user=maja':'');
 guide.classList.add('show');
}
function closeGuide(){
 if(!guide)return;
 guide.classList.remove('show');
 guide.querySelector('iframe').src='about:blank';
 try{if(guidePrevious==null)localStorage.removeItem('pulse-last-exercise');else localStorage.setItem('pulse-last-exercise',guidePrevious);}catch(_e){}
}
function pickFromGuide(){
 var p=api(),row=guideRow,id=Number(guide.dataset.id);
 // Follow the exercise the person swiped to inside the guide.
 try{var seen=Number(localStorage.getItem('pulse-last-exercise'));if(p&&p.exercises[seen])id=seen;}catch(_e){}
 var e=p&&p.exercises[id];
 closeGuide();
 if(e&&row&&document.body.contains(row))choose(row,e.name,e.group==='Kondition'?'cardio':'strength',id);
}

/* ---------- Pass header: title, meta and folded settings ---------- */
function buildTop(modal){
 var modalBox=modal.querySelector('.modal');
 var kicker=document.createElement('div');kicker.className='pbu-kicker';
 var bar=document.createElement('button');bar.type='button';bar.className='pbu-settings-toggle';bar.setAttribute('aria-expanded','false');
 bar.innerHTML='<span class="pbu-settings-meta"></span><span class="pbu-settings-label">Inställningar</span><i class="pbu-chev" aria-hidden="true"></i>';
 modalBox.insertBefore(kicker,modalBox.firstChild);
 modalBox.appendChild(bar);
 bar.addEventListener('click',function(){
  var open=!modal.classList.contains('pbu-settings-open');
  modal.classList.toggle('pbu-settings-open',open);
  this.setAttribute('aria-expanded',String(open));
 });
 paintTop(modal);
}
function paintTop(modal){
 var h=byId('day-workout-title'),text=h?h.textContent.trim():'';
 var kicker=modal.querySelector('.pbu-kicker');if(!kicker)return;
 var k=/^passupplägg/i.test(text)?text.replace(/^passupplägg\s*·\s*/i,''):text;
 if(kicker.textContent!==k)kicker.textContent=k;
 var sel=byId('day-workout-template-select'),tpl=sel&&sel.value&&sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].textContent:'';
 var type=(byId('day-workout-type')||{}).value||'';
 var meta=[type,tpl?'Mall: '+tpl:''].filter(Boolean).join(' · ');
 var m=modal.querySelector('.pbu-settings-meta');if(m.textContent!==meta)m.textContent=meta;
}

/* ---------- Wiring ---------- */
/* Rows, add button and editing for one exercise list. */
function bindList(modal,list,addSelector){
 var addBtn=modal.querySelector(addSelector);
 if(addBtn){
  addBtn.classList.remove('pt-add','btn-sm');addBtn.style.removeProperty('margin-top');
  addBtn.classList.add('pbu-add');addBtn.innerHTML='<i class="pbu-plus" aria-hidden="true"></i><span>Lägg till övning</span>';
  addBtn.addEventListener('click',function(){
   setTimeout(function(){var rows=list.querySelectorAll('.pbu-row'),row=rows[rows.length-1];if(row&&!(nameInput(row)||{}).value)openRow(row,{pick:true});},0);
  });
 }
 new MutationObserver(function(records){
  records.forEach(function(r){r.addedNodes.forEach(function(n){if(n.nodeType===1&&n.classList.contains('ex-row-item')){
   enhanceRow(n);
   // A freshly copied row should not inherit the open state.
   if(n.classList.contains('pbu-open'))closeRow(n);
  }});});
 }).observe(list,{childList:true});
 list.addEventListener('click',function(e){
  var t=e.target,row=t.closest('.pbu-row');if(!row)return;
  if(t.closest('.pbu-head')||t.closest('.pbu-thumb')){
   if(row.classList.contains('pbu-open'))closeRow(row);else openRow(row);
   return;
  }
  if(t.closest('.pbu-between-btn')){row.classList.toggle('pbu-between-open');syncBetween(row);return;}
  if(t.closest('.pbu-quick-del')){confirmRemove(row);return;}
  if(t.closest('[data-per-set-toggle-v7]')){setTimeout(function(){syncBetween(row);},0);}
  var betweenType=t.closest('[data-pbu-between-type]');
  if(betweenType){
   var select=row.querySelector('[data-per-set-type-v7]');
   if(select&&select.value!==betweenType.dataset.pbuBetweenType){select.value=betweenType.dataset.pbuBetweenType;select.dispatchEvent(new Event('change',{bubbles:true}));}
   syncBetween(row);return;
  }
  var betweenStep=t.closest('[data-pbu-between-step]');
  if(betweenStep){
   var secs=row.querySelector('[data-per-set-seconds-v7]');
   if(secs){secs.value=Math.max(5,(Number(secs.value)||60)+Number(betweenStep.dataset.pbuBetweenStep)*15);secs.dispatchEvent(new Event('input',{bubbles:true}));}
   syncBetween(row);return;
  }
  var step=t.closest('[data-pbu-step]');
  if(step){
   var spec=specFor(row,step.dataset.pbuN);
   setSpecValue(row,spec,specValue(row,spec)+Number(step.dataset.pbuStep)*spec.step);
   syncSteps(row);paintRow(row);return;
  }
  var kind=t.closest('[data-pbu-kind]');
  if(kind){setKind(row,kind.dataset.pbuKind);renderSteps(row);syncActions(row);paintRow(row);if(!row.querySelector('.pbu-pick').hidden)renderOptions(row,(row.querySelector('[data-pbu-search]')||{}).value||'');return;}
  if(t.closest('[data-pbu-change]')){if(row.classList.contains('pbu-picking'))hidePicker(row);else{showPicker(row);}return;}
  if(t.closest('[data-pbu-delete]')){var del=row.querySelector('.ex-del');if(del)del.click();return;}
  var info=t.closest('[data-pbu-guide]');
  if(info){openGuide(Number(info.dataset.pbuGuide),row);return;}
  var pick=t.closest('[data-pbu-pick]');
  if(pick){choose(row,pick.dataset.pbuPick,pick.dataset.pbuKindPick,pick.dataset.pbuGuideId);return;}
 });
 list.addEventListener('input',function(e){
  var t=e.target,row=t.closest('.pbu-row');if(!row)return;
  if(t.matches('[data-pbu-search]')){renderOptions(row,t.value);return;}
  // Plain numbers apply while typing; min:sek values when the field is left.
  if(t.matches('[data-pbu-value]')){var spec=specFor(row,t.dataset.pbuValue);if(spec.clock)return;write(field(row,spec.n),t.value===''?'':num(t.value));syncSteps(row,t);paintRow(row);return;}
 });
 list.addEventListener('change',function(e){
  var t=e.target,row=t.closest('.pbu-row');if(!row||!t.matches('[data-pbu-value]'))return;
  var spec=specFor(row,t.dataset.pbuValue);if(!spec.clock)return;
  var v=parseClock(t.value);if(isFinite(v))setSpecValue(row,spec,v);
  syncSteps(row);paintRow(row);
 });
 list.addEventListener('keydown',function(e){
  if(e.key!=='Enter')return;
  var t=e.target,row=t.closest('.pbu-row');if(!row)return;
  if(t.matches('[data-pbu-search]')){
   e.preventDefault();
   var first=row.querySelector('.pbu-options [data-pbu-pick]');
   if(first)choose(row,first.dataset.pbuPick,first.dataset.pbuKindPick,first.dataset.pbuGuideId);
  }else if(t.matches('[data-pbu-value]')){e.preventDefault();t.blur();}
 });
 list.addEventListener('focusin',function(e){var t=e.target;if(t.matches&&t.matches('[data-pbu-value]'))setTimeout(function(){try{t.select();}catch(_e){}},0);});
 list.addEventListener('change',function(e){var row=e.target.closest('.pbu-row');if(row&&!e.target.closest('.pbu-panel'))paintRow(row);});
}
function init(){
 var modal=byId('day-workout-modal'),list=byId('day-workout-ex-list');
 if(!modal||!list||typeof window.parseExerciseRow!=='function')return setTimeout(init,120);
 modal.classList.add('pbu-builder');
 if(typeof window.closeExerciseNamePicker==='function')window.closeExerciseNamePicker();
 buildTop(modal);
 var nameEl=byId('day-workout-name');if(nameEl)nameEl.placeholder='Namnge passet';
 bindList(modal,list,'[onclick="addDayWorkoutExRow()"]');
 initLog();
 enhanceAll();
 var h=byId('day-workout-title');
 if(h)new MutationObserver(function(){paintTop(modal);}).observe(h,{childList:true,characterData:true,subtree:true});
 // Suggestions follow the pass name and type, also while a picker is open.
 var refreshPickers=function(){list.querySelectorAll('.pbu-row.pbu-picking').forEach(function(r){renderOptions(r,(r.querySelector('[data-pbu-search]')||{}).value||'');});};
 ['day-workout-type','day-workout-template-select','day-workout-name'].forEach(function(id){var el=byId(id);if(el){
  // Not on change: that fires on blur, i.e. mid-tap on a suggestion, and a
  // re-render would remove the tapped button before its click lands.
  el.addEventListener('change',function(){paintTop(modal);});
  el.addEventListener('input',function(){paintTop(modal);refreshPickers();});
 }});
 /* Opening another day or template rebuilds the rows; start collapsed. */
 // Only write the class when it actually changes: classList.remove() on an
 // absent token still rewrites the attribute and would re-trigger this observer.
 new MutationObserver(function(){
  if(modal.classList.contains('show')){paintTop(modal);return;}
  if(modal.classList.contains('pbu-settings-open')){
   modal.classList.remove('pbu-settings-open');
   var bar=modal.querySelector('.pbu-settings-toggle');if(bar)bar.setAttribute('aria-expanded','false');
  }
 }).observe(modal,{attributes:true,attributeFilter:['class']});
}
/* "Logga träning": the same rows and choice, in the log form. */
function initLog(){
 var modal=byId('wk-modal'),list=byId('ex-list');if(!modal||!list)return;
 modal.classList.add('pbu-log');
 bindList(modal,list,'[onclick="addExRow()"]');
 var type=byId('wk-type');
 if(type)type.addEventListener('input',function(){list.querySelectorAll('.pbu-row.pbu-picking').forEach(function(r){renderOptions(r,(r.querySelector('[data-pbu-search]')||{}).value||'');});});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.PulseBuilderUI={openRow:openRow,closeRow:closeRow,musclesFromText:musclesFromText};
})();
