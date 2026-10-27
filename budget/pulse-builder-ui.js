/* Pass builder preview (?ui=mittpass), option A: calm full-screen list.
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
 cardio:[{n:1,label:'Distans',step:.5,min:0,unit:'km'},{n:2,label:'Tid',step:1,min:0,unit:'min'}]
};

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
function summaryText(row){
 var a=num(field(row,1).value),b=num(field(row,2).value);
 if(rowKind(row)==='cardio'){
  var parts=[];if(a)parts.push(fmt(a)+' km');if(b)parts.push(fmt(b)+' min');
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
}
function enhanceRow(row){
 if(!row||row.dataset.pbu==='1'||!row.querySelector('.ex-row'))return;
 row.dataset.pbu='1';row.classList.add('pbu-row');
 var thumb=document.createElement('span');thumb.className='pbu-thumb';thumb.setAttribute('aria-hidden','true');
 var head=document.createElement('button');head.type='button';head.className='pbu-head';head.setAttribute('aria-expanded','false');
 head.innerHTML='<span class="pbu-title"></span><span class="pbu-sum"></span>';
 var panel=document.createElement('div');panel.className='pbu-panel';
 panel.innerHTML='<div class="pbu-pick" hidden></div>'
  +'<div class="pbu-seg" role="group" aria-label="Typ av övning"><button type="button" data-pbu-kind="strength">Styrka</button><button type="button" data-pbu-kind="cardio">Kondition</button></div>'
  +'<div class="pbu-steps"></div>';
 var actions=document.createElement('div');actions.className='pbu-actions';
 actions.innerHTML='<button type="button" class="pbu-link" data-pbu-change>Byt övning</button>'
  +'<button type="button" class="pbu-link is-danger" data-pbu-delete>Ta bort</button>';
 row.insertBefore(head,row.firstChild);
 row.insertBefore(thumb,row.firstChild);
 row.appendChild(panel);row.appendChild(actions);
 paintRow(row);
}
function enhanceAll(){document.querySelectorAll('#day-workout-ex-list .ex-row-item').forEach(enhanceRow);}

/* ---------- Row: expanded panel ---------- */
function openRow(row,opts){
 opts=opts||{};
 document.querySelectorAll('#day-workout-ex-list .pbu-row.pbu-open').forEach(function(r){if(r!==row)closeRow(r);});
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
 wrap.dataset.count=SPECS[kind].length;
 wrap.innerHTML=SPECS[kind].map(function(s){
  var v=field(row,s.n).value;
  return '<div class="pbu-step"><span class="pbu-step-label">'+s.label+(s.unit?' <small>'+s.unit+'</small>':'')+'</span>'
   +'<div class="pbu-step-ctrl"><button type="button" data-pbu-step="-1" data-pbu-n="'+s.n+'" aria-label="Minska '+s.label.toLowerCase()+'"><i class="pbu-minus"></i></button>'
   +'<input class="pbu-step-value" data-pbu-value="'+s.n+'" type="text" inputmode="'+(s.step%1?'decimal':'numeric')+'" value="'+esc(v)+'" placeholder="0" aria-label="'+s.label+'" autocomplete="off">'
   +'<button type="button" data-pbu-step="1" data-pbu-n="'+s.n+'" aria-label="Öka '+s.label.toLowerCase()+'"><i class="pbu-plus"></i></button></div></div>';
 }).join('');
}

/* ---------- Inline exercise choice (no popup) ---------- */
function passContext(row){
 var name=(byId('day-workout-name')||{}).value||'',type=(byId('day-workout-type')||{}).value||'';
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
function usedNames(except){
 var used={};
 document.querySelectorAll('#day-workout-ex-list .pbu-row').forEach(function(r){if(r===except)return;var v=(nameInput(r)||{}).value;if(v)used[key(v)]=1;});
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
function renderOptions(row,query){
 var box=row.querySelector('.pbu-options');if(!box)return;
 var ctx=passContext(row),q=key(query),used=usedNames(row),current=key((nameInput(row)||{}).value);
 var match=function(n){return !q||key(n).indexOf(q)>=0;};
 var guide=guideSuggestions(ctx).filter(function(e){return match(e.name);});
 var gk={};guide.forEach(function(e){gk[key(e.name)]=1;});
 var own=ownExercises(ctx,row).filter(function(e){return !gk[key(e.name)]&&match(e.name);});
 // Searching reaches the whole guide, not only the pass's muscle groups.
 if(q&&api())api().exercises.forEach(function(e){if(!gk[key(e.name)]&&match(e.name)&&!own.some(function(o){return key(o.name)===key(e.name);})){guide.push(e);gk[key(e.name)]=1;}});
 var html='';
 if(guide.length){
  html+='<div class="pbu-group">'+(q?'Övningsguiden':'Förslag · '+esc(ctx.label))+'</div>';
  html+=guide.slice(0,q?12:10).map(function(e){
   var img=MUSCLE_IMAGE[e.muscles[0]],isUsed=used[key(e.name)];
   return '<div class="pbu-opt'+(isUsed?' is-used':'')+(key(e.name)===current?' is-current':'')+'">'
    +'<button type="button" class="pbu-opt-main" data-pbu-pick="'+esc(e.name)+'" data-pbu-kind-pick="'+(e.group==='Kondition'?'cardio':'strength')+'" data-pbu-guide-id="'+e.id+'">'
    +'<span class="pbu-thumb is-small">'+(img?'<img alt="" src="assets/atlas-art-v1/'+img+'.webp" loading="lazy" decoding="async">':'')+'</span>'
    +'<span class="pbu-opt-copy"><span class="pbu-opt-name">'+esc(e.name)+'</span><small>'+esc(e.muscles.slice(0,3).join(' · '))+(isUsed?' · redan i passet':'')+'</small></span></button>'
    +'<button type="button" class="pbu-link" data-pbu-guide="'+e.id+'" aria-label="Visa '+esc(e.name)+' i övningsguiden">Visa</button></div>';
  }).join('');
 }
 if(own.length){
  var limit=q?own.length:Math.min(own.length,6);
  html+='<div class="pbu-group">Dina övningar</div>';
  html+=own.slice(0,limit).map(function(e){
   return '<div class="pbu-opt is-own'+(key(e.name)===current?' is-current':'')+'"><button type="button" class="pbu-opt-main" data-pbu-pick="'+esc(e.name)+'" data-pbu-kind-pick="'+e.kind+'"><span class="pbu-opt-copy"><span class="pbu-opt-name">'+esc(e.name)+'</span></span></button></div>';
  }).join('');
 }
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
 hidePicker(row);renderSteps(row);syncActions(row);paintRow(row);
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
function init(){
 var modal=byId('day-workout-modal'),list=byId('day-workout-ex-list');
 if(!modal||!list||typeof window.parseExerciseRow!=='function')return setTimeout(init,120);
 modal.classList.add('pbu-builder');
 if(typeof window.closeExerciseNamePicker==='function')window.closeExerciseNamePicker();
 buildTop(modal);
 var nameEl=byId('day-workout-name');if(nameEl)nameEl.placeholder='Namnge passet';
 var addBtn=modal.querySelector('[onclick="addDayWorkoutExRow()"]');
 if(addBtn){
  addBtn.classList.add('pbu-add');addBtn.innerHTML='<i class="pbu-plus" aria-hidden="true"></i><span>Lägg till övning</span>';
  addBtn.addEventListener('click',function(){
   setTimeout(function(){var rows=list.querySelectorAll('.pbu-row'),row=rows[rows.length-1];if(row&&!(nameInput(row)||{}).value)openRow(row,{pick:true});},0);
  });
 }
 enhanceAll();
 new MutationObserver(function(records){
  records.forEach(function(r){r.addedNodes.forEach(function(n){if(n.nodeType===1&&n.classList.contains('ex-row-item')){
   enhanceRow(n);
   // A freshly copied row should not inherit the open state.
   if(n.classList.contains('pbu-open'))closeRow(n);
  }});});
 }).observe(list,{childList:true});
 var h=byId('day-workout-title');
 if(h)new MutationObserver(function(){paintTop(modal);}).observe(h,{childList:true,characterData:true,subtree:true});
 ['day-workout-type','day-workout-template-select','day-workout-name'].forEach(function(id){var el=byId(id);if(el){el.addEventListener('change',function(){paintTop(modal);});el.addEventListener('input',function(){paintTop(modal);});}});
 /* Opening another day or template rebuilds the rows; start collapsed. */
 new MutationObserver(function(){if(!modal.classList.contains('show')){modal.classList.remove('pbu-settings-open');}else paintTop(modal);}).observe(modal,{attributes:true,attributeFilter:['class']});

 list.addEventListener('click',function(e){
  var t=e.target,row=t.closest('.pbu-row');if(!row)return;
  if(t.closest('.pbu-head')||t.closest('.pbu-thumb')){
   if(row.classList.contains('pbu-open')&&(nameInput(row)||{}).value)closeRow(row);else openRow(row);
   return;
  }
  var step=t.closest('[data-pbu-step]');
  if(step){
   var spec=SPECS[rowKind(row)].filter(function(s){return s.n===Number(step.dataset.pbuN);})[0];
   var input=field(row,spec.n),value=num(input.value)+Number(step.dataset.pbuStep)*spec.step;
   write(input,Math.max(spec.min,Math.round(value*100)/100));
   var shown=row.querySelector('[data-pbu-value="'+spec.n+'"]');if(shown)shown.value=input.value;
   paintRow(row);return;
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
  if(t.matches('[data-pbu-value]')){write(field(row,Number(t.dataset.pbuValue)),t.value===''?'':num(t.value));paintRow(row);return;}
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.PulseBuilderUI={openRow:openRow,closeRow:closeRow,musclesFromText:musclesFromText};
})();
