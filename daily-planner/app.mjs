import {TYPES,REMINDERS,remindLabel,localDate,parseDate,shiftDate,minutes,timeString,duration,uid,emptyState,validDate,validTask,validateState,dayTasks,focusTasks,overlapKeys,plannedMinutes,mergeStates} from './model.mjs?v=4';
import {createTimeView} from './time-tracking.mjs?v=5';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const paths={
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  orbit:'<circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-35 12 12)"/><circle cx="18" cy="5" r="1.3" fill="currentColor"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  flag:'<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
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
  refresh:'<path d="M20 12a8 8 0 1 1-2.4-5.7L20 8.6"/><path d="M20 3.5v5.1h-5.1"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'clock-plus':'<path d="M20.5 11A8.5 8.5 0 1 0 12 20.5"/><path d="M12 7v5l3 2M18 15v6m-3-3h6"/>',
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
let pendingClear=null;
let lastMinute='',lastToday=localDate();
const currentState=()=>state;
const allTasks=()=>dayTasks(currentState(),selected);
const nowMinutes=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()+d.getSeconds()/60;};
const isToday=()=>selected===localDate();
function save(){
  if(unreadableRaw!==null){toast('Originaldata är skyddad. Exportera den via Inställningar och återställ en giltig säkerhetskopia.',null,10000);return false;}
  try{if(sync)sync.save(state);else localStorage.setItem(localStorage.getItem('dayline.legacy-owner')?'dayline.guest.v1':STORAGE,JSON.stringify(state));storageHealthy=true;return true;}
  catch(e){storageHealthy=false;$('#saveState').textContent='Kunde inte spara';toast('Kunde inte spara på enheten. Exportera en säkerhetskopia via Inställningar.',null,10000);return false;}
}
function toast(message,undo=null,ms=8000){clearTimeout(toastTimer);undoAction=undo;$('#toastText').textContent=message;$('#undoButton').hidden=!undo;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;undoAction=null;},ms);}
$('#undoButton').onclick=()=>{if(undoAction){const undo=undoAction;undoAction=null;undo();}$('#toast').hidden=true;};
// Saves a change without re-rendering (project time edits keep focus while typing).
function change(fn){const snapshot=structuredClone(currentState());fn(currentState());if(!save()){state=snapshot;return false;}return true;}
function mutate(fn,message){const snapshot=structuredClone(currentState());fn(currentState());if(!save()){state=snapshot;render();return false;}render();if(message)toast(message,()=>{state=snapshot;save();render();});return true;}
const timeView=createTimeView({root:$('#timeView'),getState:()=>state,change,mutate,icon,esc,toast});
function chooseDate(date){if(!validDate(date))return;closeEditor();selected=date;query='';$('#searchInput').value='';render();}
function setMode(next){if(next==='time')closeEditor();mode=next;closePanels();render();if(next==='time')window.scrollTo({top:0,behavior:'instant'});window.dispatchEvent(new CustomEvent('dayline:view',{detail:{mode}}));}
function render(){
  const tasks=allTasks(); const done=tasks.filter(t=>t.done).length;
  $('#dateLabel').textContent=parseDate(selected).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'});
  $('#greeting').innerHTML=isToday()?'Dagens <em>planering.</em>':'Din <em>planering.</em>';
  $('#defaultTimeMode').value=state.settings.defaultTimeMode;$('#defaultRemind').value=String(state.settings.defaultRemind);
  $('#allView').setAttribute('aria-pressed',mode==='all');$('#focusView').setAttribute('aria-pressed',mode==='focus');$('#dockDay').setAttribute('aria-pressed',mode==='all');$('#dockFocus').setAttribute('aria-pressed',mode==='focus');
  $$('.rail nav .rail-link').forEach(el=>el.classList.toggle('active',el.dataset.action===(mode==='focus'?'focus':mode==='time'?'time':'today')));
  document.body.classList.toggle('is-time',mode==='time');$('#timeView').hidden=mode!=='time';if(mode==='time')timeView.render();
  $('#hideDone').setAttribute('aria-pressed',currentState().settings.hideDone);$('#hideDone').setAttribute('aria-label',currentState().settings.hideDone?'Visa avklarade':'Dölj avklarade');
  $('#dayNote').value=currentState().notes[selected]||'';$('#noteSaved').textContent='';
  renderWeek();renderFilters();renderTasks();renderSummary(tasks);renderNext(tasks);
}
function renderWeek(){const day=(parseDate(selected).getDay()+6)%7;const monday=shiftDate(selected,-day);$('#weekDays').innerHTML=Array.from({length:7},(_,i)=>{const d=shiftDate(monday,i),t=dayTasks(currentState(),d),colors=[...new Set(t.map(x=>TYPES[x.type].color))].slice(0,3);return `<button class="week-day ${d===selected?'selected':''} ${d===localDate()?'today':''}" data-date="${d}" aria-label="${esc(parseDate(d).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}))}" aria-pressed="${d===selected}"><span class="weekday">${parseDate(d).toLocaleDateString('sv-SE',{weekday:'short'}).replace('.','')}</span><span class="day-number">${parseDate(d).getDate()}</span><span class="day-markers">${colors.map(c=>`<i style="--c:${c}"></i>`).join('')}</span></button>`;}).join('');}
function renderFilters(){$('#filters').innerHTML=`<button class="filter" data-filter="all" aria-pressed="${filter==='all'}">Alla</button>`+Object.entries(TYPES).map(([id,t])=>`<button class="filter" data-filter="${id}" aria-pressed="${filter===id}" style="--c:${t.color}"><i></i>${t.label}</button>`).join('');}
function visibleTasks(tasks){return tasks.filter(t=>(filter==='all'||t.type===filter) && (!currentState().settings.hideDone||!t.done) && (!query || `${t.title} ${t.note} ${TYPES[t.type].label}`.toLocaleLowerCase('sv').includes(query)));}
function emptyMarkup(title,action='',button=''){return `<div class="empty-state">${icon('orbit')}<h3>${esc(title)}</h3>${action?`<button class="text-btn" data-action="${action}">${esc(button)}</button>`:''}</div>`;}
// The editor sits in the timeline while open (placeEditor); it is parked outside the list while the list re-renders.
function renderTasks(){const open=!$('#editor').hidden;if(open)parkEditor();renderTaskLists();decorateLive();if(open)placeEditor();}
// A comet of light runs along the inside of the current card's edge at constant speed. The tail is faint dashes that
// all end at the head and get shorter, so their overlap fades evenly towards the back; a small bright head leads.
// The phase follows the clock, so re-renders continue it.
const ORBIT_MS=24000,ORBIT_INSET=.75,ORBIT_LAYERS=14,orbitObserver=new ResizeObserver(entries=>entries.forEach(entry=>runOrbit(entry.target)));
function runOrbit(card){
  const svg=card.querySelector('.live-orbit');if(!svg)return;
  const w=Math.max(0,card.clientWidth-2*ORBIT_INSET),h=Math.max(0,card.clientHeight-2*ORBIT_INSET),r=Math.max(0,Math.min(15-ORBIT_INSET,w/2,h/2));
  const x=ORBIT_INSET,y=ORBIT_INSET;
  const d=`M ${x+r} ${y} H ${x+w-r} A ${r} ${r} 0 0 1 ${x+w} ${y+r} V ${y+h-r} A ${r} ${r} 0 0 1 ${x+w-r} ${y+h} H ${x+r} A ${r} ${r} 0 0 1 ${x} ${y+h-r} V ${y+r} A ${r} ${r} 0 0 1 ${x+r} ${y} Z`;
  [...svg.children].forEach(path=>path.setAttribute('d',d));
  const len=svg.firstElementChild.getTotalLength(),tail=len*.18,phase=Date.now()%ORBIT_MS;
  [...svg.children].forEach((rect,i)=>{
    const dash=rect.classList.contains('orbit-head')?.01:tail*(i+1)/ORBIT_LAYERS;
    rect.getAnimations().forEach(a=>a.cancel());
    rect.setAttribute('stroke-dasharray',`${dash} ${len-dash}`);
    rect.animate([{strokeDashoffset:dash},{strokeDashoffset:dash-len}],{duration:ORBIT_MS,iterations:Infinity}).currentTime=phase;
  });
}
function decorateLive(){
  orbitObserver.disconnect();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const rect=cls=>`<path class="${cls}"/>`;
  for(const card of $$('.is-current .task')){
    card.insertAdjacentHTML('beforeend',`<svg class="live-orbit" aria-hidden="true">${Array.from({length:ORBIT_LAYERS},()=>rect('orbit-tail')).join('')}${rect('orbit-head')}</svg>`);
    runOrbit(card);orbitObserver.observe(card);
  }
}
// Today the timeline splits at the now line. A future task that is already done moves up into the part above it,
// right above the current task (or last, if nothing is running).
function timelineOrder(timed,active){
  if(!isToday())return {before:timed,after:[]};
  const now=nowMinutes(),at=t=>minutes(t.start||t.end),early=timed.filter(t=>t.done&&at(t)>now);
  const past=timed.filter(t=>at(t)<=now),after=timed.filter(t=>at(t)>now&&!early.includes(t));
  const live=past.findIndex(t=>active.has(t.key)),cut=live<0?past.length:live;
  return {before:[...past.slice(0,cut),...early,...past.slice(cut)],after};
}
function renderTaskLists(){
  const tasks=allTasks(),visible=visibleTasks(tasks),f=isToday()?focusTasks(tasks,nowMinutes()):{active:[],next:[]},active=new Set(f.active.map(t=>t.key)),overlaps=overlapKeys(tasks);
  $('#filterToggle').classList.toggle('has-filter',filter!=='all'||!!query||mode==='focus'||state.settings.hideDone);
  $('#taskList').classList.toggle('focus-list',mode==='focus');$('#agendaTitle').textContent=mode==='focus'?'Nu & nästa':'Dagens tidslinje';$('#taskCount').textContent=String(visible.length);
  $('#untimedSection').hidden=true;
  if(mode==='focus'){
    if(!isToday()){$('#taskList').innerHTML=emptyMarkup('Fokus visar idag.','today','Gå till idag');return;}
    const live=visible.filter(t=>active.has(t.key)),next=visible.filter(t=>f.next.some(n=>n.key===t.key));
    $('#taskCount').textContent=String(live.length+next.length);
    $('#taskList').innerHTML=(live.length?`<div class="focus-section-label">Nu</div>${live.map(t=>taskMarkup(t,active,overlaps,true)).join('')}`:'')+(next.length?`<div class="focus-section-label">Nästa</div>${next.map(t=>taskMarkup(t,active,overlaps,true)).join('')}`:'')||emptyMarkup('Inga aktuella aktiviteter.');return;
  }
  if(!visible.length){$('#taskList').innerHTML=tasks.length?emptyMarkup('Inga träffar.','clear-filters','Återställ filter'):emptyMarkup('Inga aktiviteter ännu');return;}
  const timed=visible.filter(t=>t.start||t.end),untimed=visible.filter(t=>!t.start&&!t.end);let html='';
  const {before,after}=timelineOrder(timed,active);
  html=before.map(t=>taskMarkup(t,active,overlaps)).join('')+(isToday()&&timed.length?`<div class="now-marker"><span>${timeString(Math.floor(nowMinutes()))}</span></div>`:'')+after.map(t=>taskMarkup(t,active,overlaps)).join('');
  $('#taskList').innerHTML=html;
  if(untimed.length){$('#untimedSection').hidden=false;$('#untimedCount').textContent=String(untimed.length);$('#untimedList').innerHTML=untimed.map(t=>taskMarkup(t,active,overlaps)).join('');}
}
function isOverdue(t,tasks){
  if(t.done||selected>localDate()||(!t.start&&!t.end))return false;
  const minute=selected<localDate()?1440:nowMinutes();
  const next=t.start?tasks.find(x=>x.start&&minutes(x.start)>minutes(t.start)):null;
  return !!((t.end&&minutes(t.end)<=minute)||(next&&minutes(next.start)<=minute));
}
function taskMarkup(t,active,overlaps,focus=false){
  const late=isOverdue(t,allTasks()),type=TYPES[t.type],live=active.has(t.key)&&!late,hasRange=t.start&&t.end,n=nowMinutes(),remaining=hasRange?Math.max(0,Math.ceil(minutes(t.end)-n)):null;
  const progress=hasRange&&live?Math.max(0,Math.min(100,(n-minutes(t.start))/(minutes(t.end)-minutes(t.start))*100)):0;
  const status=t.done?'✓ Utförd':late?'Försenad':live?(hasRange?`${duration(remaining)} kvar`:'Pågår'):isToday()&&t.end&&minutes(t.end)<=n?'Försenad':'';
  const time=t.start?(t.start+(t.end?' – '+t.end:'')):'Senast '+t.end;
  return `<article data-min="${minutes(t.start||t.end||'00:00')}" class="task-row ${t.done?'is-done':''} ${live?'is-current':''} ${late?'is-overdue':''}" data-task-key="${esc(t.key)}" style="--c:${type.color}">${t.start||t.end?`<div class="time-label">${!t.start?'<small>senast</small>':''}${t.start||t.end}${hasRange?`<small>${t.end}</small>`:''}</div><div class="timeline-node"></div>`:''}<div class="task"><button class="task-main" data-edit="${esc(t.key)}" aria-label="Redigera ${esc(t.title)}"><span class="task-meta"><span class="tag"><i class="type-dot"></i>${type.label}</span>${t.priority==='high'?'<span class="priority">Viktig</span>':''}${t.repeat!=='none'?`<span title="Återkommande">${icon('repeat')}</span>`:''}${status?`<span class="task-status">${status}</span>`:''}</span><span class="task-title">${esc(t.title)}</span>${t.note?`<span class="task-note">${esc(t.note)}</span>`:''}${overlaps.has(t.key)?'<span class="task-note overlap-tag">Överlappande tid</span>':''}${focus?`<span class="focus-time">${time}</span>`:''}</button><button class="task-check" data-done="${esc(t.key)}" aria-label="${t.done?'Markera som ej klar':'Klarmarkera'}: ${esc(t.title)}" aria-pressed="${t.done}">${icon('check')}</button>${live&&hasRange?`<span class="task-progress" style="--progress:${progress}%"></span>`:''}</div></article>`;
}
function polar(angle,r){return [140+r*Math.sin(angle),140-r*Math.cos(angle)];}
function arc(start,end,r=103){const a=polar(start,r),b=polar(end,r);return `M${a[0]},${a[1]} A${r},${r} 0 ${end-start>Math.PI?1:0} 1 ${b[0]},${b[1]}`;}
function renderSummary(tasks){
  const done=tasks.filter(t=>t.done).length;$('#doneNumber').textContent=done;$('#totalNumber').textContent=` / ${tasks.length}`;$('#progressLabel').textContent='aktiviteter klara';$('#plannedTime').textContent=duration(plannedMinutes(tasks));$('#remainingCount').textContent=tasks.length-done;$('#clock').textContent=new Date().toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'});
  const start=-Math.PI*.77,extent=Math.PI*1.54;let svg='<defs><radialGradient id="orbitGlow"><stop offset="0%" stop-color="#f5bc7c" stop-opacity=".05"/><stop offset="100%" stop-color="#f5bc7c" stop-opacity="0"/></radialGradient></defs><circle cx="140" cy="140" r="134" fill="url(#orbitGlow)" stroke="none"/><circle cx="140" cy="140" r="121" stroke="#ffffff07" stroke-width="1"/>';
  for(let i=0;i<60;i++){const a=start+extent*i/59,p=polar(a,113),q=polar(a,i%5===0?118:115.5);svg+=`<path d="M${p}L${q}" stroke="#ffffff${i%5===0?'2a':'13'}" stroke-width="1"/>`;}
  svg+=`<path d="${arc(start,start+extent)}" stroke="#ffffff09" stroke-width="7"/>`;
  if(tasks.length){const gap=Math.min(.045,extent/tasks.length*.25),unit=extent/tasks.length;tasks.forEach((t,i)=>{svg+=`<path d="${arc(start+i*unit+gap/2,start+(i+1)*unit-gap/2)}" stroke="${TYPES[t.type].color}" stroke-opacity="${t.done?1:.3}" stroke-width="${t.done?7:5}"/>`;});}else svg+=`<path d="${arc(start,start+.55)}" stroke="#f5bc7c" stroke-width="5" stroke-opacity=".55"/>`;
  svg+='<g class="orbit-spark"><circle cx="140" cy="19" r="2" fill="#f5bc7c" stroke="none"/></g>';
  $('#dayOrbit').innerHTML=svg;$('#dayOrbit').setAttribute('aria-label',`${done} av ${tasks.length} aktiviteter klara`);
  $('#typeBalance').innerHTML=Object.entries(TYPES).map(([id,t])=>{const count=tasks.filter(x=>x.type===id).length;return count?`<i style="--c:${t.color};flex:${count}" title="${t.label}: ${count}"></i>`:'';}).join('');
}
function renderNext(tasks){
  const f=isToday()?focusTasks(tasks,nowMinutes()):{next:tasks.filter(t=>(t.start||t.end)&&!t.done).slice(0,1)},t=f.next[0];
  $('#nextUp').hidden=false;
  $('#nextUp').innerHTML=t?`<div class="next-label">${icon('sparkles')}Nästa aktivitet</div><button data-edit="${esc(t.key)}" style="--c:${TYPES[t.type].color}"><h3>${esc(t.title)}</h3><span class="next-time">${t.start||'Senast '+t.end}</span></button>`:`<div class="next-label">${icon('sparkles')}Nästa aktivitet</div><h3>Inget mer inplanerat</h3>`;
}
function closePanels(){for(const panel of $$('.utility-panels>.inline-panel'))panel.hidden=true;}
function openPanel(id){
  const el=$(id),wasOpen=!el.hidden;closePanels();el.hidden=wasOpen;
  window.dispatchEvent(new CustomEvent('dayline:view',{detail:{mode:wasOpen?mode:id==='#calendarDialog'?'calendar':id==='#settingsDialog'?'settings':mode}}));
  if(!wasOpen)el.scrollIntoView({block:'start',behavior:'smooth'});
}
function closePanel(el){el.hidden=true;window.dispatchEvent(new CustomEvent('dayline:view',{detail:{mode}}));}
function closeEditor(){$('#editor').hidden=true;editing=null;$$('.task-row.is-editing').forEach(r=>r.classList.remove('is-editing'));parkEditor();}
function setTimeMode(value){
  timeMode=value;
  $('#taskStart').required=value==='start'||value==='range';$('#taskEnd').required=value==='end'||value==='range';
  $('#timeDefaultButton').textContent=value===state.settings.defaultTimeMode?'Standard':'Sätt som standard';updateOverlap();syncEditor();
}
// Editor (new or edited activity): name, type as colour dots, and a row of small fields (date, time, reminder,
// priority, repeat, note) that each open one line of choices under the row. Times sit in the timeline column.
function renderTypePicker(){
  $('#typePicker').innerHTML=Object.entries(TYPES).map(([id,t])=>`<button type="button" class="ed-type" data-type="${id}" aria-pressed="${editType===id}" aria-label="${t.label}" style="--c:${t.color}"></button>`).join('')+`<span class="ed-type-name">${TYPES[editType].label}</span>`;
  $('#editor').style.setProperty('--c',TYPES[editType].color);
}
function openMore(name){$$('#editor .ed-more').forEach(el=>{el.hidden=el.dataset.panel!==name||!el.hidden;});$$('#editor [data-ed]').forEach(b=>b.setAttribute('aria-expanded',String(!$(`#editor .ed-more[data-panel="${b.dataset.ed}"]`).hidden)));}
function syncEditor(){
  const d=$('#taskDate').value,start=$('#taskStart').value,end=$('#taskEnd').value,hasStart=['start','range'].includes(timeMode),hasEnd=['end','range'].includes(timeMode);
  $('#dateText').textContent=!d?'Datum':d===localDate()?'Idag':d===shiftDate(localDate(),1)?'I morgon':parseDate(d).toLocaleDateString('sv-SE',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');
  $('#taskStart').hidden=!hasStart;$('#taskEnd').hidden=!hasEnd;
  $('[data-add-time=start]').hidden=hasStart;$('[data-add-time=end]').hidden=hasEnd||!hasStart;
  $('#timeText').textContent=timeMode==='none'?'Ingen tid':timeMode==='start'?'Start':timeMode==='end'?'Sluttid':start&&end&&minutes(end)>minutes(start)?duration(minutes(end)-minutes(start)):'Start + slut';
  $$('#editor [data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===timeMode)));
  $('#durationPresets').hidden=timeMode!=='range';
  const remind=Number($('#taskRemind').value);$('#remindField').hidden=timeMode==='none';$('#remindText').textContent=remind<0?'Ingen':remind===0?'Vid tiden':remind===1440?'1 dag':duration(remind);
  $('#remindField').classList.toggle('is-on',remind>=0);
  $$('#remindChoices [data-remind]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.remind)===remind)));
  const high=$('#taskPriority').value==='high';$('#priorityChip').setAttribute('aria-pressed',String(high));
  const repeat=$('#taskRepeat').value;$('#repeatText').textContent={none:'',daily:'Dagligen',weekdays:'Vardagar',weekly:'Varje vecka'}[repeat];$('#repeatField').classList.toggle('is-on',repeat!=='none');
  $$('#editor [data-repeat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.repeat===repeat)));
  $('#noteChip').classList.toggle('is-on',!!$('#taskNote').value.trim());
}
// Where the editor sits: in place of the edited row, else in the timeline at its time (untimed: before "Ny aktivitet").
function parkEditor(){const ed=$('#editor');if(ed.parentElement!==$('#filterPanel').parentElement)$('#filterPanel').after(ed);}
function placeEditor(){
  const ed=$('#editor'),list=$('#taskList'),row=editing&&$$('.task-row').find(r=>r.dataset.taskKey===editing.key);
  $$('.task-row.is-editing').forEach(r=>r.classList.remove('is-editing'));
  if(row){row.classList.add('is-editing');row.after(ed);return;}
  const time=timeMode==='none'?null:minutes(['start','range'].includes(timeMode)?$('#taskStart').value:$('#taskEnd').value);
  if(mode==='all'&&time!=null&&!Number.isNaN(time)&&$('#taskDate').value===selected){
    const next=[...list.children].find(el=>el!==ed&&(el.classList.contains('task-row')?Number(el.dataset.min)>time:el.classList.contains('now-marker')?nowMinutes()>time:false));
    if(next)next.before(ed);else list.append(ed);return;
  }
  $('.add-inline').before(ed);
}
function openEditor(key=null){
  const scrollY=window.scrollY;
  editing=key?allTasks().find(t=>t.key===key):null;
  const start=Math.min(1380,Math.ceil(nowMinutes()/15)*15);
  $('#taskForm').reset();$('#formError').textContent='';$('#editorTitle').textContent=editing?'Redigera':'Ny aktivitet';
  $('#taskTitle').value=editing?.title||'';$('#taskDate').value=selected;$('#taskPriority').value=editing?.priority||'normal';$('#taskRepeat').value=editing?.repeat||'none';$('#taskNote').value=editing?.note||'';
  $('#taskRemind').value=String(editing?.remind??state.settings.defaultRemind);$('#taskStart').value=editing?.start||timeString(start);$('#taskEnd').value=editing?.end||timeString(Math.min(1439,start+60));editType=editing?.type||(filter==='all'?'work':filter);
  $('#deleteTask').hidden=!editing;$('#duplicateTask').hidden=!editing;$('#scopeField').hidden=!(editing&&editing.repeat!=='none');$('#editScope').value='one';syncEditScope();renderTypePicker();closePanels();
  $$('#editor .ed-more').forEach(el=>el.hidden=true);
  setTimeMode(editing?(editing.start?(editing.end?'range':'start'):(editing.end?'end':'none')):state.settings.defaultTimeMode);
  $('#editor').hidden=false;placeEditor();openMore(null);
  window.scrollTo({top:scrollY,behavior:'instant'});window.dispatchEvent(new CustomEvent('dayline:view',{detail:{mode}}));
  const box=$('#editor').getBoundingClientRect();if(box.top<70||box.bottom>innerHeight-90)$('#editor').scrollIntoView({block:'center',behavior:'smooth'});
  if(matchMedia('(min-width:761px)').matches||!editing)$('#taskTitle').focus({preventScroll:true});
}
function syncEditScope(){const recurring=editing&&editing.repeat!=='none',series=recurring&&$('#editScope').value==='all';$('#repeatField').hidden=recurring&&!series;$('#taskDate').disabled=!!series;if(series)$('#taskDate').value=editing.seriesDate;else if(recurring)$('#taskDate').value=selected;}
function taskFromForm(){return {id:editing?.id||uid(),title:$('#taskTitle').value.trim(),date:$('#taskDate').value,type:editType,start:['start','range'].includes(timeMode)?$('#taskStart').value:'',end:['end','range'].includes(timeMode)?$('#taskEnd').value:'',note:$('#taskNote').value.trim(),priority:$('#taskPriority').value,remind:Number($('#taskRemind').value),repeat:$('#taskRepeat').value,done:editing?.done||false};}
function updateOverlap(){if(!$('#taskStart').value)return;const candidate=taskFromForm();const overlaps=dayTasks(currentState(),candidate.date).filter(t=>t.key!==editing?.key&&!t.done&&t.start&&t.end&&candidate.start&&candidate.end&&minutes(t.start)<minutes(candidate.end)&&minutes(candidate.start)<minutes(t.end));$('#overlapHint').hidden=!overlaps.length;$('#overlapHint').textContent=overlaps.length?`Överlappar: ${overlaps.map(t=>t.title).join(', ')}.`:'';}
$('#taskStart').addEventListener('input',updateOverlap);$('#taskEnd').addEventListener('input',updateOverlap);$('#taskDate').addEventListener('input',()=>{updateOverlap();syncEditor();});
// A changed time moves the editor to its new place in the timeline once the field is left.
for(const id of ['#taskStart','#taskEnd'])$(id).addEventListener('change',()=>{syncEditor();if(!editing)placeEditor();});
$('#taskNote').addEventListener('input',syncEditor);$('#editScope').addEventListener('change',syncEditScope);
function patchOccurrence(s,t,patch){if(t.repeat==='none'){const base=s.tasks.find(x=>x.id===t.id);Object.assign(base,patch);}else s.exceptions[t.key]={...s.exceptions[t.key],...patch};}
$('#taskForm').addEventListener('submit',event=>{
  event.preventDefault();const task=taskFromForm();
  if(!validTask(task)){$('#formError').textContent=task.start&&task.end&&minutes(task.end)<=minutes(task.start)?'Sluttiden måste vara efter starttiden, samma dag.':'Fyll i aktivitetens namn, ett giltigt datum och valda tider.';return;}
  if(task.repeat==='weekdays'&&[0,6].includes(parseDate(task.date).getDay())&&(!editing||editing.repeat==='none'||$('#editScope').value==='all')){$('#formError').textContent='Välj en vardag som första datum för en vardagsaktivitet.';return;}
  const saved=mutate(s=>{
    if(!editing)s.tasks.push(task);
    else if(editing.repeat==='none'){s.tasks[s.tasks.findIndex(t=>t.id===editing.id)]={...task,done:task.repeat==='none'?task.done:false};if(task.repeat!=='none'&&task.done)s.exceptions[`${task.id}@${task.date}`]={done:true};}
    else if($('#editScope').value==='all'){
      const base=s.tasks.find(t=>t.id===editing.id);Object.assign(base,{...task,done:task.repeat==='none'?editing.done:false});
      // Per-day exceptions remain intentional exceptions to the series.
      if(task.repeat==='none')for(const key of Object.keys(s.exceptions))if(key.startsWith(`${editing.id}@`))delete s.exceptions[key];
    }else if(task.date!==selected){s.exceptions[editing.key]={...s.exceptions[editing.key],deleted:true};s.tasks.push({...task,id:uid(),repeat:'none'});}
    else {const {title,type,start,end,note,priority,remind}=task;patchOccurrence(s,editing,{title,type,start,end,note,priority,remind});}
  },'Sparat');
  if(!saved)return;closeEditor();selected=task.date;render();
});
function toggleDone(key){
  const task=allTasks().find(t=>t.key===key);if(!task)return;
  const tops=timelineTops();
  if(!mutate(s=>patchOccurrence(s,task,{done:!task.done}),task.done?'Ej klar':'Klart'))return;
  glideTimeline(tops);if(!task.done)rowFor(key)?.classList.add('just-done');
}
// Rows (and the now line) that change place glide from where they were.
const timelineItems=()=>$$('#taskList .task-row,#taskList .now-marker'),itemKey=el=>el.dataset.taskKey||'now';
const timelineTops=()=>new Map(timelineItems().map(el=>[itemKey(el),el.getBoundingClientRect().top]));
function glideTimeline(tops){
  if(reducedMotion.matches)return;
  for(const el of timelineItems()){const top=tops.get(itemKey(el));if(top==null)continue;const dy=top-el.getBoundingClientRect().top;if(Math.abs(dy)>1)el.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:450,easing:EASE_OUT});}
}
const rowFor=key=>document.querySelector(`.task-row[data-task-key="${CSS.escape(key)}"]`);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function removeTask(target,all=false){
  return mutate(s=>{if(target.repeat==='none'||all){s.tasks=s.tasks.filter(t=>t.id!==target.id);for(const key of Object.keys(s.exceptions))if(key.startsWith(`${target.id}@`))delete s.exceptions[key];}else s.exceptions[target.key]={...s.exceptions[target.key],deleted:true};},all&&target.repeat!=='none'?'Serien är borttagen':'Borttagen');
}
function deleteTask(){if(editing&&removeTask(editing,$('#editScope').value==='all'))closeEditor();}
// Horizontal intent is required so vertical scrolling remains native.
const SWIPE_COMMIT=90,EASE_OUT='cubic-bezier(.22,1,.36,1)';
let swipe=null,suppressClickUntil=0;
document.addEventListener('pointerdown',e=>{
  const row=e.target.closest('.task-row');
  if(!row||e.button!==0||row.classList.contains('is-leaving')||e.target.closest('.task-check'))return;
  swipe={row,card:row.querySelector('.task'),key:row.dataset.taskKey,id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,locked:false,bg:null};
});
document.addEventListener('pointermove',e=>{
  if(!swipe||swipe.id!==e.pointerId)return;
  const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;
  if(!swipe.locked){
    if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){swipe=null;return;}
    if(dx>-12||Math.abs(dx)<Math.abs(dy)*1.5)return;
    swipe.locked=true;swipe.x=e.clientX;swipe.card.setPointerCapture(e.pointerId);swipe.row.classList.add('swiping');
    // The action layer sits behind the card only, not behind the time column.
    const bg=document.createElement('div');bg.className='swipe-bg';bg.innerHTML=`${icon('trash')}<span>Ta bort</span>`;bg.style.left=`${swipe.card.offsetLeft}px`;swipe.row.prepend(bg);swipe.bg=bg;
  }
  const raw=Math.min(0,e.clientX-swipe.x),limit=SWIPE_COMMIT*1.35;
  // Rubber band past the commit point instead of a hard stop.
  swipe.dx=raw<-limit?-limit+(raw+limit)*.3:raw;
  swipe.card.style.transform=`translate3d(${swipe.dx}px,0,0)`;swipe.card.style.clipPath=`inset(0 0 0 ${-swipe.dx}px round 16px)`;
  swipe.bg.style.setProperty('--p',Math.min(1,-swipe.dx/SWIPE_COMMIT).toFixed(3));
  swipe.row.classList.toggle('swipe-ready',swipe.dx<=-SWIPE_COMMIT);
});
function finishSwipe(e){
  if(!swipe||swipe.id!==e.pointerId)return;
  const gesture=swipe;swipe=null;
  if(!gesture.locked)return;
  suppressClickUntil=Date.now()+400;
  const task=e.type==='pointerup'&&gesture.dx<=-SWIPE_COMMIT?allTasks().find(t=>t.key===gesture.key):null;
  if(task)dismissRow(gesture,task);else settleRow(gesture);
}
function settleRow({row,card,bg}){
  row.classList.remove('swiping','swipe-ready');card.style.transform='';card.style.clipPath='inset(0 0 0 0 round 16px)';setTimeout(()=>{if(!row.classList.contains('swiping'))card.style.clipPath='';},360);
  bg.style.transition=`opacity .3s ${EASE_OUT}`;bg.style.opacity='0';setTimeout(()=>bg.remove(),320);
}
// Slide the card out, then fold the row so the rows below glide up before the data changes.
function dismissRow({row,card},task){
  const slide=reducedMotion.matches?0:200,fold=reducedMotion.matches?0:280;
  row.style.height=`${row.offsetHeight}px`;row.classList.remove('swiping');row.classList.add('is-leaving');
  const width=card.offsetWidth;card.style.transition=`transform ${slide}ms cubic-bezier(.5,0,.75,0),clip-path ${slide}ms cubic-bezier(.5,0,.75,0),opacity ${slide}ms ease-in`;
  card.style.transform=`translate3d(${-width}px,0,0)`;card.style.clipPath=`inset(0 0 0 ${width}px round 16px)`;card.style.opacity='0';
  setTimeout(()=>{row.style.height='0px';row.style.marginBottom='0px';row.style.opacity='0';},slide);
  setTimeout(()=>{
    const current=allTasks().find(t=>t.key===task.key);if(!current)return;
    if(editing?.key===current.key)closeEditor();
    if(!removeTask(current))return;
    const undo=undoAction;if(undo)undoAction=()=>{undo();revealRow(current.key);};
  },slide+fold);
}
// Undo grows the restored row back into place.
function revealRow(key){
  const row=rowFor(key);if(!row||reducedMotion.matches)return;
  const height=row.offsetHeight,margin=getComputedStyle(row).marginBottom;
  row.animate([{height:'0px',marginBottom:'0px',opacity:0},{height:`${height}px`,marginBottom:margin,opacity:1}],{duration:300,easing:EASE_OUT});
  row.querySelector('.task')?.animate([{transform:'translate3d(-36px,0,0)',opacity:0},{transform:'none',opacity:1}],{duration:380,delay:60,easing:EASE_OUT,fill:'backwards'});
}
document.addEventListener('pointerup',finishSwipe);document.addEventListener('pointercancel',finishSwipe);
document.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
function duplicateTask(){if(!editing)return;$('#taskDate').disabled=false;$('#taskDate').value=shiftDate(selected,1);$('#taskRepeat').value='none';$('#editorTitle').textContent='Kopiera';editing=null;$('#scopeField').hidden=true;$('#repeatField').hidden=false;$('#deleteTask').hidden=true;$('#duplicateTask').hidden=true;$('#formError').textContent='';updateOverlap();}
function renderCalendar(){const first=monthDate.slice(0,7)+'-01',start=shiftDate(first,-((parseDate(first).getDay()+6)%7));$('#calendarMonth').textContent=parseDate(first).toLocaleDateString('sv-SE',{month:'long',year:'numeric'});$('#calendarGrid').innerHTML=['M','T','O','T','F','L','S'].map(d=>`<span class="calendar-weekday">${d}</span>`).join('')+Array.from({length:42},(_,i)=>{const date=shiftDate(start,i);return `<button class="calendar-day ${date.slice(0,7)!==first.slice(0,7)?'outside':''} ${date===localDate()?'today':''} ${date===selected?'selected':''} ${dayTasks(currentState(),date).length?'has-tasks':''}" data-calendar-date="${date}" aria-label="${esc(parseDate(date).toLocaleDateString('sv-SE',{day:'numeric',month:'long',year:'numeric'}))}" aria-pressed="${date===selected}">${parseDate(date).getDate()}</button>`;}).join('');}
function openCalendar(){monthDate=selected;renderCalendar();openPanel('#calendarDialog');}
function stepMonth(n){const date=parseDate(monthDate.slice(0,7)+'-01');date.setMonth(date.getMonth()+n);monthDate=localDate(date);renderCalendar();}
function exportData(data=state,prefix='dayline'){const blob=new Blob([(data===state&&unreadableRaw!==null?unreadableRaw:JSON.stringify(data,null,2))],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${prefix}-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('#importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5_000_000)throw Error('Filen är för stor (max 5 MB).');pendingImport=validateState(JSON.parse(await file.text()));$('#importSummary').textContent=`Säkerhetskopian innehåller ${pendingImport.tasks.length} aktiviteter och ${Object.keys(pendingImport.notes).length} dagsanteckningar.`;closePanel($('#settingsDialog'));openPanel('#importDialog');}catch(err){toast(err.message||'Kunde inte läsa säkerhetskopian.',null,8000);}e.target.value='';});
$('#dayNote').addEventListener('input',()=>{currentState().notes[selected]=$('#dayNote').value;const saved=save();$('#noteSaved').textContent=saved?'Sparat på enheten':'Kunde inte spara';});
$('#searchInput').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('sv');renderTasks();});
function toggleFilters(){const el=$('#filterPanel');el.hidden=!el.hidden;$('#filterToggle').setAttribute('aria-expanded',!el.hidden);}
function requestClear(scope){
  pendingClear={scope,date:selected};
  const date=parseDate(selected).toLocaleDateString('sv-SE',{day:'numeric',month:'long'});
  $('#clearSummary').textContent=scope==='all'?'Rensa alla aktiviteter och anteckningar?':scope==='done'?`Rensa avklarade aktiviteter den ${date}?`:`Rensa aktiviteter den ${date}?`;
  $('#clearConfirm').hidden=false;
}
function clearPlanning(){
  if(!pendingClear)return;
  const {scope,date}=pendingClear,targets=dayTasks(state,date).filter(t=>scope!=='done'||t.done);
  if(scope==='all')exportData(state,'dayline-innan-rensning');
  mutate(s=>{
    if(scope==='all'){s.tasks=[];s.exceptions={};s.notes={};return;}
    for(const t of targets){
      if(t.repeat!=='none')s.exceptions[t.key]={...s.exceptions[t.key],deleted:true};
      else {s.tasks=s.tasks.filter(x=>x.id!==t.id);for(const key of Object.keys(s.exceptions))if(key.startsWith(t.id+'@'))delete s.exceptions[key];}
    }
  },'Rensat');
  pendingClear=null;$('#clearConfirm').hidden=true;closeEditor();
}
$('#defaultTimeMode').addEventListener('change',e=>{state.settings.defaultTimeMode=e.target.value;save();toast('Standard sparad');});
// Reminder choices for the editor and the default under Mer.
$('#defaultRemind').innerHTML=REMINDERS.map(n=>`<option value="${n}">${remindLabel(n)}</option>`).join('');
$('#remindChoices').innerHTML=REMINDERS.map(n=>`<button type="button" data-remind="${n}">${n<0?'Ingen':n===0?'Vid tiden':n===1440?'1 dag före':duration(n)}</button>`).join('');
$('#defaultRemind').addEventListener('change',e=>{state.settings.defaultRemind=Number(e.target.value);save();toast('Standard sparad');});
const actions={
  today:()=>{chooseDate(localDate());setMode('all');},all:()=>setMode('all'),focus:()=>setMode('focus'),time:()=>setMode('time'),add:()=>openEditor(),calendar:openCalendar,settings:()=>openPanel('#settingsDialog'),filters:toggleFilters,'close-editor':closeEditor,'toggle-priority':()=>{$('#taskPriority').value=$('#taskPriority').value==='high'?'normal':'high';syncEditor();},
  'prev-week':()=>chooseDate(shiftDate(selected,-7)),'next-week':()=>chooseDate(shiftDate(selected,7)),
  'toggle-done':()=>{currentState().settings.hideDone=!currentState().settings.hideDone;save();render();},
  'clear-filters':()=>{filter='all';query='';$('#searchInput').value='';currentState().settings.hideDone=false;save();setMode('all');},
  'prev-month':()=>stepMonth(-1),'next-month':()=>stepMonth(1),'calendar-today':()=>{chooseDate(localDate());closePanel($('#calendarDialog'));},
  'set-time-default':()=>{state.settings.defaultTimeMode=timeMode;save();$('#defaultTimeMode').value=timeMode;setTimeMode(timeMode);toast('Standard sparad');},
  'clear-note':()=>mutate(s=>{delete s.notes[selected];},'Anteckning rensad'),
  'clear-done':()=>requestClear('done'),'clear-day':()=>requestClear('day'),'clear-all':()=>requestClear('all'),
  'cancel-clear':()=>{$('#clearConfirm').hidden=true;pendingClear=null;},'confirm-clear':clearPlanning,
  'reload-app':()=>{if(window.AppRefresh)window.AppRefresh.reload();else location.reload();},
  delete:deleteTask,duplicate:duplicateTask,export:()=>{exportData();toast('Säkerhetskopian laddas ner.');},
  'confirm-import':()=>{if(!pendingImport)return;exportData(state,'dayline-innan-import');state=pendingImport;pendingImport=null;unreadableRaw=null;save();closePanel($('#importDialog'));render();toast('Säkerhetskopian är återställd.');},
};
document.addEventListener('click',e=>{
  const button=e.target.closest('button,[data-close]');if(!button)return;
  if(button.hasAttribute('data-close')){closePanel(button.closest('.inline-panel'));return;}
  if(button.dataset.action){actions[button.dataset.action]?.();return;}
  if(button.dataset.date){chooseDate(button.dataset.date);return;}
  if(button.dataset.calendarDate){chooseDate(button.dataset.calendarDate);closePanel($('#calendarDialog'));return;}
  if(button.dataset.filter){filter=button.dataset.filter;renderFilters();renderTasks();return;}
  if(button.dataset.edit){openEditor(button.dataset.edit);return;}
  if(button.dataset.done){toggleDone(button.dataset.done);return;}
  if(button.dataset.mode){setTimeMode(button.dataset.mode);return;}
  if(button.dataset.type){editType=button.dataset.type;renderTypePicker();return;}
  if(button.dataset.ed){openMore(button.dataset.ed);return;}
  if(button.dataset.remind!==undefined){$('#taskRemind').value=button.dataset.remind;syncEditor();return;}
  if(button.dataset.repeat){$('#taskRepeat').value=button.dataset.repeat;syncEditor();return;}
  if(button.dataset.addTime){setTimeMode(button.dataset.addTime==='end'||timeMode==='end'?'range':'start');const el=$(button.dataset.addTime==='end'?'#taskEnd':'#taskStart');el.focus();el.showPicker?.();return;}
  if(button.dataset.duration){const end=minutes($('#taskStart').value)+Number(button.dataset.duration);if(end>1439){$('#formError').textContent='Intervallet behöver sluta före midnatt.';return;}$('#taskEnd').value=timeString(end);$('#formError').textContent='';updateOverlap();syncEditor();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeEditor();closePanels();return;}if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select,[contenteditable]')||!$('#editor').hidden||mode==='time')return;if(e.key.toLowerCase()==='n'){e.preventDefault();openEditor();}if(e.key==='/'){e.preventDefault();$('#filterPanel').hidden=false;$('#filterToggle').setAttribute('aria-expanded','true');$('#searchInput').focus();}});
// Cloud/account changes invalidate undo snapshots and open task editors.
function receiveState(next){
  const changed=JSON.stringify(state)!==JSON.stringify(next);
  state=next;unreadableRaw=null;
  if(!changed)return;
  undoAction=null;$('#toast').hidden=true;
  if(!$('#editor').hidden){closeEditor();toast('Planeringen har uppdaterats. Öppna aktiviteten igen.');}
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

function tick(){if(document.hidden)return;const today=localDate(),minute=`${today}-${Math.floor(nowMinutes())}`;if(lastMinute===minute)return;lastMinute=minute;if(lastToday!==today){if(selected===lastToday)selected=today;lastToday=today;render();return;}if(!$('#editor').hidden)return;renderTasks();renderSummary(allTasks());renderNext(allTasks());}
setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastMinute='';tick();}});
render();if(!storageHealthy)toast('Sparad data kunde inte läsas. Originalet är kvar. Exportera innan du gör ändringar.',null,12000);
// Pull-to-refresh and the automatic update (budget/app-refresh.js) wait while the editor or import is open.
window.AppRefreshPage={canReload:()=>$('#editor').hidden&&$('#importDialog').hidden&&!$('#clearConfirm').offsetParent&&!timeView.isEditing()};
if('serviceWorker'in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});});
