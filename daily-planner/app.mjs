import {TYPES,localDate,parseDate,shiftDate,minutes,timeString,duration,uid,emptyState,validDate,validTask,validateState,dayTasks,focusTasks,overlapKeys,plannedMinutes,mergeStates} from './model.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const paths={
  orbit:'<circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-35 12 12)"/><circle cx="18" cy="5" r="1.3" fill="currentColor"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
  focus:'<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/><circle cx="12" cy="12" r="4"/>',
  settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="#151a23"/><circle cx="16" cy="12" r="2" fill="#151a23"/><circle cx="8" cy="18" r="2" fill="#151a23"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',
  'chevron-left':'<path d="m14 6-6 6 6 6"/>','chevron-right':'<path d="m10 6 6 6-6 6"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',
  'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',check:'<path d="m5 12 4 4L19 6"/>',
  edit:'<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z"/>',
  briefcase:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V4h8v3M3 12a24 24 0 0 0 18 0m-9 0v4"/>',
  heart:'<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 2 11 8 15 6-4 13-10 8-15Z"/>',
  home:'<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
  coffee:'<path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm13 1h2a3 3 0 0 1 0 6h-2M7 3v2m5-2v2M2 22h18"/>',
  sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  repeat:'<path d="m17 2 4 4-4 4M3 10V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14 0v2a2 2 0 0 1-2 2H3"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',upload:'<path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5"/>'
};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[n]||paths.sun}</svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hydrate(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);el.removeAttribute('data-icon');});}
hydrate();
const STORAGE='dayline.planner.v1';
let state=emptyState(),sync=null,storageHealthy=true,unreadableRaw=null;
try{const saved=localStorage.getItem(localStorage.getItem('dayline.legacy-owner')?'dayline.guest.v1':STORAGE);unreadableRaw=saved;if(saved)state=validateState(JSON.parse(saved));unreadableRaw=null;}catch(e){storageHealthy=false;$('#saveState').textContent='Lagringen kunde inte läsas';}
let selected=localDate(),mode='all',filter='all',query='',editing=null,editType='work',timeMode='range',monthDate=selected,pendingImport=null,undoAction=null,toastTimer=null;
let lastMinute='',lastToday=localDate();
const currentState=()=>state;
const allTasks=()=>dayTasks(currentState(),selected);
const nowMinutes=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()+d.getSeconds()/60;};
const isToday=()=>selected===localDate();
function save(){
  if(unreadableRaw!==null){toast('Originaldata är skyddad. Exportera den via Inställningar och återställ en giltig säkerhetskopia.',null,10000);return false;}
  try{if(sync)sync.save(state);else localStorage.setItem(STORAGE,JSON.stringify(state));storageHealthy=true;return true;}
  catch(e){storageHealthy=false;$('#saveState').textContent='Kunde inte spara';toast('Kunde inte spara på enheten. Exportera en säkerhetskopia via Inställningar.',null,10000);return false;}
}
function toast(message,undo=null,ms=5000){clearTimeout(toastTimer);undoAction=undo;$('#toastText').textContent=message;$('#undoButton').hidden=!undo;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;undoAction=null;},ms);}
$('#undoButton').onclick=()=>{if(undoAction){const undo=undoAction;undoAction=null;undo();}$('#toast').hidden=true;};
function mutate(fn,message){const snapshot=structuredClone(currentState());fn(currentState());save();render();if(message)toast(message,()=>{state=snapshot;save();render();});}
function chooseDate(date){if(!validDate(date))return;selected=date;query='';$('#searchInput').value='';render();}
function setMode(next){mode=next;render();window.dispatchEvent(new CustomEvent('dayline:view',{detail:{mode}}));}
function render(){
  const tasks=allTasks(); const done=tasks.filter(t=>t.done).length;
  $('#dateLabel').textContent=parseDate(selected).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'});
  $('#greeting').innerHTML=isToday()?'Din dag, <br><em>i din takt.</em>':`${esc(parseDate(selected).toLocaleDateString('sv-SE',{weekday:'long'}).replace(/^./,c=>c.toUpperCase()))}, <br><em>på ditt sätt.</em>`;
  $('#dayCaption').textContent=tasks.length ? (done===tasks.length?'Allt är avklarat. Njut av resten av dagen.':`${tasks.length} aktiviteter. Utrymme för både fokus och pauser.`) : 'Gör plats för det som betyder något.';
  $('#allView').setAttribute('aria-pressed',mode==='all');$('#focusView').setAttribute('aria-pressed',mode==='focus');$('#dockDay').setAttribute('aria-pressed',mode==='all');$('#dockFocus').setAttribute('aria-pressed',mode==='focus');
  $$('.rail nav .rail-link').forEach(el=>el.classList.toggle('active',el.dataset.action===(mode==='focus'?'focus':'today')));
  $('#hideDone').setAttribute('aria-pressed',currentState().settings.hideDone);$('#hideDone').setAttribute('aria-label',currentState().settings.hideDone?'Visa avklarade':'Dölj avklarade');
  $('#dayNote').value=currentState().notes[selected]||'';$('#noteSaved').textContent='';
  renderWeek();renderFilters();renderTasks();renderSummary(tasks);renderNext(tasks);
}
function renderWeek(){const day=(parseDate(selected).getDay()+6)%7;const monday=shiftDate(selected,-day);$('#weekDays').innerHTML=Array.from({length:7},(_,i)=>{const d=shiftDate(monday,i),t=dayTasks(currentState(),d),colors=[...new Set(t.map(x=>TYPES[x.type].color))].slice(0,3);return `<button class="week-day ${d===selected?'selected':''} ${d===localDate()?'today':''}" data-date="${d}" aria-label="${esc(parseDate(d).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}))}" aria-pressed="${d===selected}"><span class="weekday">${parseDate(d).toLocaleDateString('sv-SE',{weekday:'short'}).replace('.','')}</span><span class="day-number">${parseDate(d).getDate()}</span><span class="day-markers">${colors.map(c=>`<i style="--c:${c}"></i>`).join('')}</span></button>`;}).join('');}
function renderFilters(){$('#filters').innerHTML=`<button class="filter" data-filter="all" aria-pressed="${filter==='all'}">Alla</button>`+Object.entries(TYPES).map(([id,t])=>`<button class="filter" data-filter="${id}" aria-pressed="${filter===id}" style="--c:${t.color}"><i></i>${t.label}</button>`).join('');}
function visibleTasks(tasks){return tasks.filter(t=>(filter==='all'||t.type===filter) && (!currentState().settings.hideDone||!t.done) && (!query || `${t.title} ${t.note} ${TYPES[t.type].label}`.toLocaleLowerCase('sv').includes(query)));}
function emptyMarkup(title,text,action='add',button='Ny aktivitet'){return `<div class="empty-state">${icon('orbit')}<h3>${esc(title)}</h3><p>${esc(text)}</p><button class="subtle-btn" data-action="${action}">${esc(button)}</button></div>`;}
function renderTasks(){
  const tasks=allTasks(),visible=visibleTasks(tasks),f=isToday()?focusTasks(tasks,nowMinutes()):{active:[],next:[]},active=new Set(f.active.map(t=>t.key)),overlaps=overlapKeys(tasks);
  $('#taskList').classList.toggle('focus-list',mode==='focus');$('#agendaTitle').textContent=mode==='focus'?'Ett ögonblick i taget':'Dagens tidslinje';$('#taskCount').textContent=`${visible.length} ${visible.length===1?'aktivitet':'aktiviteter'}`;
  $('#untimedSection').hidden=true;
  if(mode==='focus'){
    if(!isToday()){$('#taskList').innerHTML=emptyMarkup('Fokus finns i nuet','Nu & nästa följer dagens klocka. Välj idag eller se hela den valda dagen.','today','Gå till idag');return;}
    const live=visible.filter(t=>active.has(t.key));const future=visible.filter(t=>!t.done&&t.start&&minutes(t.start)>nowMinutes());const next=future.filter(t=>t.start===future[0]?.start);
    $('#taskCount').textContent='Uppdateras automatiskt';
    let html=live.length?`<div class="focus-section-label">Just nu${live.length>1?' · samtidigt':''}</div>${live.map(t=>taskMarkup(t,active,overlaps,true)).join('')}`:emptyMarkup(f.active.length?'Inget pågår i den här vyn':'Lite luft i dagen',next.length?'Din nästa aktivitet väntar längre ner.':'Inget mer är tidsatt i den här vyn idag.','add','Lägg till något');
    if(next.length)html+=`<div class="focus-section-label">Härnäst</div>${next.map(t=>taskMarkup(t,active,overlaps,true)).join('')}`;
    if((filter!=='all'||query)&&!live.length&&!next.length)html=emptyMarkup('Inget matchar just nu','Filtren döljer nuvarande och nästa aktivitet.','clear-filters','Visa alla typer');
    $('#taskList').innerHTML=html;return;
  }
  if(!visible.length){$('#taskList').innerHTML=tasks.length?emptyMarkup('En lugnare vy','Inga aktiviteter matchar dina filter.','clear-filters','Återställ filter'):emptyMarkup('Dagen är din','Lägg till det du vill få gjort, och lämna lite plats för det oväntade.');return;}
  const timed=visible.filter(t=>t.start),untimed=visible.filter(t=>!t.start);let html='',marker=false;
  for(const t of timed){if(isToday()&&!marker&&minutes(t.start)>nowMinutes()){html+=`<div class="now-marker"><span>NU ${timeString(Math.floor(nowMinutes()))}</span></div>`;marker=true;}html+=taskMarkup(t,active,overlaps);}
  if(isToday()&&timed.length&&!marker)html+=`<div class="now-marker"><span>NU ${timeString(Math.floor(nowMinutes()))}</span></div>`;
  $('#taskList').innerHTML=html||'<p class="focus-caption">Dagens aktiviteter har ingen bestämd tid ännu.</p>';
  if(untimed.length){$('#untimedSection').hidden=false;$('#untimedCount').textContent=String(untimed.length);$('#untimedList').innerHTML=untimed.map(t=>taskMarkup(t,active,overlaps)).join('');}
}
function taskMarkup(t,active,overlaps,focus=false){
  const type=TYPES[t.type],live=active.has(t.key),hasRange=t.start&&t.end,n=nowMinutes(),remaining=hasRange?Math.max(0,Math.ceil(minutes(t.end)-n)):null;
  const progress=hasRange&&live?Math.max(0,Math.min(100,(n-minutes(t.start))/(minutes(t.end)-minutes(t.start))*100)):0;
  const status=t.done?'Klart':live?(hasRange?`${duration(remaining)} kvar`:'Pågår'):isToday()&&t.end&&minutes(t.end)<=n?'Ej avklarad':'';
  return `<article class="task-row ${t.done?'is-done':''} ${live?'is-current':''}" style="--c:${type.color}">${t.start?`<div class="time-label">${t.start}${t.end?`<small>${t.end}</small>`:''}</div><div class="timeline-node"></div>`:''}<div class="task"><button class="task-main" data-edit="${esc(t.key)}" aria-label="Redigera ${esc(t.title)}"><span class="task-meta"><span class="tag">${icon(type.icon)}${type.label}</span>${t.priority==='high'?'<span class="priority">Viktig</span>':''}${t.repeat!=='none'?`<span title="Återkommande">${icon('repeat')}</span>`:''}${live?'<span class="live-tag">NU</span>':''}${hasRange&&!live&&!t.done?`<span class="task-status">${duration(minutes(t.end)-minutes(t.start))}</span>`:''}${status&&!focus?`<span class="task-status">${status}</span>`:''}</span><span class="task-title">${esc(t.title)}</span>${t.note?`<span class="task-note">${esc(t.note)}</span>`:''}${overlaps.has(t.key)?'<span class="task-note overlap-tag">Överlappar en annan aktivitet</span>':''}${focus?`<span class="focus-time"><span>${t.start}${t.end?' – '+t.end:''}</span><strong>${status||'Nästa aktivitet'}</strong></span>`:''}</button><button class="task-check" data-done="${esc(t.key)}" aria-label="${t.done?'Markera som ej klar':'Klarmarkera'}: ${esc(t.title)}" aria-pressed="${t.done}">${icon('check')}</button>${live&&hasRange?`<span class="task-progress" style="--progress:${progress}%"></span>`:''}</div></article>`;
}
function polar(angle,r){return [140+r*Math.sin(angle),140-r*Math.cos(angle)];}
function arc(start,end,r=103){const a=polar(start,r),b=polar(end,r);return `M${a[0]},${a[1]} A${r},${r} 0 ${end-start>Math.PI?1:0} 1 ${b[0]},${b[1]}`;}
function renderSummary(tasks){
  const done=tasks.filter(t=>t.done).length;$('#doneNumber').textContent=done;$('#totalNumber').textContent=` / ${tasks.length}`;$('#progressLabel').textContent=tasks.length&&done===tasks.length?'Dagen är i mål':'aktiviteter klara';$('#plannedTime').textContent=duration(plannedMinutes(tasks));$('#remainingCount').textContent=tasks.length-done;$('#clock').textContent=new Date().toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'});
  const start=-Math.PI*.77,extent=Math.PI*1.54;let svg='<defs><radialGradient id="orbitGlow"><stop offset="0%" stop-color="#f5bc7c" stop-opacity=".05"/><stop offset="100%" stop-color="#f5bc7c" stop-opacity="0"/></radialGradient></defs><circle cx="140" cy="140" r="134" fill="url(#orbitGlow)" stroke="none"/><circle cx="140" cy="140" r="121" stroke="#ffffff07" stroke-width="1"/>';
  for(let i=0;i<60;i++){const a=start+extent*i/59,p=polar(a,113),q=polar(a,i%5===0?118:115.5);svg+=`<path d="M${p}L${q}" stroke="#ffffff${i%5===0?'2a':'13'}" stroke-width="1"/>`;}
  svg+=`<path d="${arc(start,start+extent)}" stroke="#ffffff09" stroke-width="7"/>`;
  if(tasks.length){const gap=Math.min(.045,extent/tasks.length*.25),unit=extent/tasks.length;tasks.forEach((t,i)=>{svg+=`<path d="${arc(start+i*unit+gap/2,start+(i+1)*unit-gap/2)}" stroke="${TYPES[t.type].color}" stroke-opacity="${t.done?1:.3}" stroke-width="${t.done?7:5}"/>`;});}else svg+=`<path d="${arc(start,start+.55)}" stroke="#f5bc7c" stroke-width="5" stroke-opacity=".55"/>`;
  svg+='<g class="orbit-spark"><circle cx="140" cy="19" r="2" fill="#f5bc7c" stroke="none"/></g>';
  $('#dayOrbit').innerHTML=svg;$('#dayOrbit').setAttribute('aria-label',`${done} av ${tasks.length} aktiviteter klara`);
  $('#typeBalance').innerHTML=Object.entries(TYPES).map(([id,t])=>{const count=tasks.filter(x=>x.type===id).length;return count?`<i style="--c:${t.color};flex:${count}" title="${t.label}: ${count}"></i>`:'';}).join('');
}
function renderNext(tasks){
  const f=isToday()?focusTasks(tasks,nowMinutes()):{active:[],next:tasks.filter(t=>t.start&&!t.done).slice(0,1)};const t=f.next[0];
  $('#nextUp').innerHTML=t?`<div class="next-label">${icon('clock')}${isToday()?'På horisonten':'Först på schemat'}</div><button data-edit="${esc(t.key)}" style="--c:${TYPES[t.type].color}"><h3>${esc(t.title)}</h3><p>${TYPES[t.type].label}${f.next.length>1?` · +${f.next.length-1} samtidigt`:''}</p><span class="next-time">${t.start}${isToday()?` · om ${duration(Math.max(1,Math.ceil(minutes(t.start)-nowMinutes())))}`:''}</span></button>`:`<div class="next-label">${icon('sparkles')}Utrymme att andas</div><h3>${f.active.length?'Var här en stund.':'Resten får ta sin tid.'}</h3><p>${tasks.some(t=>!t.done&&!t.start)?'Dina otidsatta aktiviteter finns under När det passar.':'Ingen ny aktivitet väntar på klockan.'}</p>`;
}
function openDialog(id){const el=$(id);el.showModal();document.body.classList.add('modal-open');}
function closeDialog(el){el.close();if(!$$('dialog[open]').length)document.body.classList.remove('modal-open');}
$$('dialog').forEach(el=>{el.addEventListener('close',()=>{if(!$$('dialog[open]').length)document.body.classList.remove('modal-open');});el.addEventListener('click',e=>{if(e.target!==el)return;const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(el);});});
function setTimeMode(value){timeMode=value;$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===value));$('#timeFields').hidden=value==='none';$('#endField').hidden=value!=='range';$('#durationPresets').hidden=value!=='range';$('#timeHint').hidden=value!=='start';$('#taskStart').required=value!=='none';$('#taskEnd').required=value==='range';updateOverlap();}
function renderTypePicker(){$('#typePicker').innerHTML=Object.entries(TYPES).map(([id,t])=>`<button type="button" class="type-choice" data-type="${id}" aria-pressed="${editType===id}" style="--c:${t.color}">${icon(t.icon)}${t.label}</button>`).join('');}
function openEditor(key=null){
  editing=key?allTasks().find(t=>t.key===key):null;
  const start=Math.min(1380,Math.ceil(nowMinutes()/15)*15);
  $('#taskForm').reset();$('#formError').textContent='';$('#editorTitle').textContent=editing?'Din aktivitet':'Ny aktivitet';
  $('#taskTitle').value=editing?.title||'';$('#taskDate').value=selected;$('#taskPriority').value=editing?.priority||'normal';$('#taskRepeat').value=editing?.repeat||'none';$('#taskNote').value=editing?.note||'';
  $('#taskStart').value=editing?.start||timeString(start);$('#taskEnd').value=editing?.end||timeString(Math.min(1439,start+60));editType=editing?.type||(filter==='all'?'work':filter);
  $('#deleteTask').hidden=!editing;$('#duplicateTask').hidden=!editing;$('#scopeField').hidden=!(editing&&editing.repeat!=='none');$('#editScope').value='one';syncEditScope();renderTypePicker();setTimeMode(editing?(editing.start?(editing.end?'range':'start'):'none'):'range');openDialog('#editor');
  if(matchMedia('(min-width:761px)').matches)$('#taskTitle').focus();
}
function syncEditScope(){const recurring=editing&&editing.repeat!=='none',series=recurring&&$('#editScope').value==='all';$('#repeatField').hidden=recurring&&!series;$('#taskDate').disabled=!!series;if(series)$('#taskDate').value=editing.seriesDate;else if(recurring)$('#taskDate').value=selected;}
function taskFromForm(){return {id:editing?.id||uid(),title:$('#taskTitle').value.trim(),date:$('#taskDate').value,type:editType,start:timeMode==='none'?'':$('#taskStart').value,end:timeMode==='range'?$('#taskEnd').value:'',note:$('#taskNote').value.trim(),priority:$('#taskPriority').value,repeat:$('#taskRepeat').value,done:editing?.done||false};}
function updateOverlap(){if(!$('#taskStart').value)return;const candidate=taskFromForm();const overlaps=dayTasks(currentState(),candidate.date).filter(t=>t.key!==editing?.key&&!t.done&&t.start&&t.end&&candidate.start&&candidate.end&&minutes(t.start)<minutes(candidate.end)&&minutes(candidate.start)<minutes(t.end));$('#overlapHint').hidden=!overlaps.length;$('#overlapHint').textContent=overlaps.length?`Överlappar: ${overlaps.map(t=>t.title).join(', ')}. Du kan spara ändå.`:'';}
$('#taskStart').addEventListener('input',updateOverlap);$('#taskEnd').addEventListener('input',updateOverlap);$('#taskDate').addEventListener('input',updateOverlap);$('#editScope').addEventListener('change',syncEditScope);
function patchOccurrence(s,t,patch){if(t.repeat==='none'){const base=s.tasks.find(x=>x.id===t.id);Object.assign(base,patch);}else s.exceptions[t.key]={...s.exceptions[t.key],...patch};}
$('#taskForm').addEventListener('submit',event=>{
  event.preventDefault();const task=taskFromForm();
  if(!validTask(task)){$('#formError').textContent=task.end&&minutes(task.end)<=minutes(task.start)?'Sluttiden måste vara efter starttiden, samma dag.':'Fyll i aktivitetens namn, ett giltigt datum och valda tider.';return;}
  if(task.repeat==='weekdays'&&[0,6].includes(parseDate(task.date).getDay())&&(!editing||editing.repeat==='none'||$('#editScope').value==='all')){$('#formError').textContent='Välj en vardag som första datum för en vardagsaktivitet.';return;}
  mutate(s=>{
    if(!editing)s.tasks.push(task);
    else if(editing.repeat==='none'){s.tasks[s.tasks.findIndex(t=>t.id===editing.id)]={...task,done:task.repeat==='none'?task.done:false};if(task.repeat!=='none'&&task.done)s.exceptions[`${task.id}@${task.date}`]={done:true};}
    else if($('#editScope').value==='all'){
      const base=s.tasks.find(t=>t.id===editing.id);Object.assign(base,{...task,done:task.repeat==='none'?editing.done:false});
      // Per-day exceptions remain intentional exceptions to the series.
      if(task.repeat==='none')for(const key of Object.keys(s.exceptions))if(key.startsWith(`${editing.id}@`))delete s.exceptions[key];
    }else if(task.date!==selected){s.exceptions[editing.key]={...s.exceptions[editing.key],deleted:true};s.tasks.push({...task,id:uid(),repeat:'none'});}
    else {const {title,type,start,end,note,priority}=task;patchOccurrence(s,editing,{title,type,start,end,note,priority});}
  },'Aktiviteten är sparad');
  closeDialog($('#editor'));selected=task.date;render();
});
function toggleDone(key){const task=allTasks().find(t=>t.key===key);if(!task)return;mutate(s=>patchOccurrence(s,task,{done:!task.done}),task.done?'Aktiviteten är öppen igen':'En sak mindre att tänka på');}
function deleteTask(){if(!editing)return;const target=editing,all=$('#editScope').value==='all';mutate(s=>{if(target.repeat==='none'||all){s.tasks=s.tasks.filter(t=>t.id!==target.id);for(const key of Object.keys(s.exceptions))if(key.startsWith(`${target.id}@`))delete s.exceptions[key];}else s.exceptions[target.key]={...s.exceptions[target.key],deleted:true};},all&&target.repeat!=='none'?'Serien är borttagen':'Aktiviteten är borttagen');closeDialog($('#editor'));}
function duplicateTask(){if(!editing)return;$('#taskDate').disabled=false;$('#taskDate').value=shiftDate(selected,1);$('#taskRepeat').value='none';$('#editorTitle').textContent='Kopiera aktivitet';editing=null;$('#scopeField').hidden=true;$('#repeatField').hidden=false;$('#deleteTask').hidden=true;$('#duplicateTask').hidden=true;$('#formError').textContent='';updateOverlap();}
function renderCalendar(){const first=monthDate.slice(0,7)+'-01',start=shiftDate(first,-((parseDate(first).getDay()+6)%7));$('#calendarMonth').textContent=parseDate(first).toLocaleDateString('sv-SE',{month:'long',year:'numeric'});$('#calendarGrid').innerHTML=['M','T','O','T','F','L','S'].map(d=>`<span class="calendar-weekday">${d}</span>`).join('')+Array.from({length:42},(_,i)=>{const date=shiftDate(start,i);return `<button class="calendar-day ${date.slice(0,7)!==first.slice(0,7)?'outside':''} ${date===localDate()?'today':''} ${date===selected?'selected':''} ${dayTasks(currentState(),date).length?'has-tasks':''}" data-calendar-date="${date}" aria-label="${esc(parseDate(date).toLocaleDateString('sv-SE',{day:'numeric',month:'long',year:'numeric'}))}" aria-pressed="${date===selected}">${parseDate(date).getDate()}</button>`;}).join('');}
function openCalendar(){monthDate=selected;renderCalendar();openDialog('#calendarDialog');}
function stepMonth(n){const date=parseDate(monthDate.slice(0,7)+'-01');date.setMonth(date.getMonth()+n);monthDate=localDate(date);renderCalendar();}
function exportData(data=state,prefix='dayline'){const blob=new Blob([(data===state&&unreadableRaw!==null?unreadableRaw:JSON.stringify(data,null,2))],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${prefix}-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('#importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5_000_000)throw Error('Filen är för stor (max 5 MB).');pendingImport=validateState(JSON.parse(await file.text()));$('#importSummary').textContent=`Säkerhetskopian innehåller ${pendingImport.tasks.length} aktiviteter och ${Object.keys(pendingImport.notes).length} dagsanteckningar.`;closeDialog($('#settingsDialog'));openDialog('#importDialog');}catch(err){toast(err.message||'Kunde inte läsa säkerhetskopian.',null,8000);}e.target.value='';});
$('#dayNote').addEventListener('input',()=>{currentState().notes[selected]=$('#dayNote').value;const saved=save();$('#noteSaved').textContent=saved?'Sparat på enheten':'Kunde inte spara';});
$('#searchInput').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('sv');renderTasks();});
function openSearch(){$('#searchRow').hidden=false;$('#searchInput').focus();$('#searchRow').scrollIntoView({block:'nearest',behavior:'smooth'});}
const actions={
  today:()=>{chooseDate(localDate());},all:()=>setMode('all'),focus:()=>setMode('focus'),add:()=>openEditor(),calendar:openCalendar,settings:()=>openDialog('#settingsDialog'),search:openSearch,
  'close-search':()=>{$('#searchRow').hidden=true;query='';$('#searchInput').value='';renderTasks();},
  'prev-week':()=>chooseDate(shiftDate(selected,-7)),'next-week':()=>chooseDate(shiftDate(selected,7)),
  'toggle-done':()=>{currentState().settings.hideDone=!currentState().settings.hideDone;save();render();},
  'clear-filters':()=>{filter='all';query='';$('#searchInput').value='';currentState().settings.hideDone=false;save();render();},
  'prev-month':()=>stepMonth(-1),'next-month':()=>stepMonth(1),'calendar-today':()=>{chooseDate(localDate());closeDialog($('#calendarDialog'));},
  delete:deleteTask,duplicate:duplicateTask,export:()=>{exportData();toast('Säkerhetskopian laddas ner.');},
  'confirm-import':()=>{if(!pendingImport)return;exportData(state,'dayline-innan-import');state=pendingImport;pendingImport=null;unreadableRaw=null;save();closeDialog($('#importDialog'));render();toast('Säkerhetskopian är återställd.');},
};
document.addEventListener('click',e=>{
  const button=e.target.closest('button,[data-close]');if(!button)return;
  if(button.hasAttribute('data-close')){closeDialog(button.closest('dialog'));return;}
  if(button.dataset.action){actions[button.dataset.action]?.();return;}
  if(button.dataset.date){chooseDate(button.dataset.date);return;}
  if(button.dataset.calendarDate){chooseDate(button.dataset.calendarDate);closeDialog($('#calendarDialog'));return;}
  if(button.dataset.filter){filter=button.dataset.filter;renderFilters();renderTasks();return;}
  if(button.dataset.edit){openEditor(button.dataset.edit);return;}
  if(button.dataset.done){toggleDone(button.dataset.done);return;}
  if(button.dataset.mode){setTimeMode(button.dataset.mode);return;}
  if(button.dataset.type){editType=button.dataset.type;renderTypePicker();return;}
  if(button.dataset.duration){const end=minutes($('#taskStart').value)+Number(button.dataset.duration);if(end>1439){$('#formError').textContent='Intervallet behöver sluta före midnatt.';return;}$('#taskEnd').value=timeString(end);$('#formError').textContent='';updateOverlap();}
});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select,[contenteditable]')||$$('dialog[open]').length)return;if(e.key.toLowerCase()==='n'){e.preventDefault();openEditor();}if(e.key==='/'){e.preventDefault();openSearch();}});
// Cloud/account changes invalidate undo snapshots and open task editors.
function receiveState(next){
  const changed=JSON.stringify(state)!==JSON.stringify(next);
  state=next;unreadableRaw=null;
  if(!changed)return;
  undoAction=null;$('#toast').hidden=true;
  if($('#editor').open){closeDialog($('#editor'));toast('Planeringen har uppdaterats. Öppna aktiviteten igen.');}
  render();
}
function syncStatus(status){
  $('#saveState').textContent=status.label;
  $('#saveState').dataset.status=status.kind;
  $('#syncDetail').textContent=status.detail;
  $('#loginLink').hidden=!!status.user;
  $('#retrySync').hidden=!status.user;
}
function startSync(){
  if(!window.createDailyPlannerSync){syncStatus({kind:'error',label:'Sparat lokalt',detail:'Synkningen kunde inte starta. Anslut till internet och ladda om sidan.'});return;}
  sync=window.createDailyPlannerSync({emptyState,validateState,mergeStates,onChange:receiveState,onStatus:syncStatus});
  $('#retrySync').onclick=()=>sync.retry();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startSync,{once:true});else startSync();

function tick(){if(document.hidden)return;const today=localDate(),minute=`${today}-${Math.floor(nowMinutes())}`;if(lastMinute===minute)return;lastMinute=minute;if(lastToday!==today){if(selected===lastToday)selected=today;lastToday=today;render();return;}if($$('dialog[open]').length)return;renderTasks();renderSummary(allTasks());renderNext(allTasks());}
setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastMinute='';tick();}});
render();if(!storageHealthy)toast('Sparad data kunde inte läsas. Originalet är kvar. Exportera innan du gör ändringar.',null,12000);
if('serviceWorker'in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});});
