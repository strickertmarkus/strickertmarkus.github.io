// Project time ("Tid"): hours per project and day, shown and edited per day, week or month.
// Data lives in the planner state (timeProjects, timeLog) and syncs with it; see model.mjs.
import {localDate,parseDate,shiftDate,uid,parseDuration,hm,isoWeek,PROJECT_COLORS} from './model.mjs?v=5';

const DAY=['mån','tis','ons','tor','fre','lör','sön'];
const dateText=(d,opts)=>parseDate(d).toLocaleDateString('sv-SE',opts);
const mondayOf=d=>shiftDate(d,-((parseDate(d).getDay()+6)%7));
const isWeekend=d=>[0,6].includes(parseDate(d).getDay());
const sumText=n=>n?hm(n):'0:00';

export function createTimeView({root,getState,change,mutate,icon,esc,toast}){
  let scale='week',anchor=localDate(),cell=null,monthDay=localDate();

  const s=()=>getState();
  const mins=(date,pid)=>s().timeLog[date]?.[pid]||0;
  const dayTotal=date=>Object.values(s().timeLog[date]||{}).reduce((a,b)=>a+b,0);
  const sorted=()=>Object.entries(s().timeProjects).map(([id,p])=>({id,...p})).sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name,'sv'));
  function periodDates(){
    if(scale==='day')return [anchor];
    if(scale==='week'){const m=mondayOf(anchor);return Array.from({length:7},(_,i)=>shiftDate(m,i));}
    const first=anchor.slice(0,8)+'01',out=[];for(let d=first;d.slice(0,7)===first.slice(0,7);d=shiftDate(d,1))out.push(d);return out;
  }
  // Active projects, plus archived ones that have time in the shown period.
  const shown=dates=>sorted().filter(p=>!p.archived||dates.some(d=>mins(d,p.id)));
  function setMins(date,pid,value){
    const v=Math.max(0,Math.min(1440,Math.round(value)));
    return change(st=>{const day={...(st.timeLog[date]||{})};if(v)day[pid]=v;else delete day[pid];if(Object.keys(day).length)st.timeLog[date]=day;else delete st.timeLog[date];});
  }

  // ── Markup ──
  const dot=p=>`<i class="tt-dot" style="--c:${p.color}"></i>`;
  const input=(date,pid)=>`<input class="tt-input" data-input="${date}|${pid}" value="${hm(mins(date,pid))}" inputmode="decimal" enterkeyhint="next" autocomplete="off" placeholder="0:00" aria-label="Tid ${esc(s().timeProjects[pid]?.name||'')} ${dateText(date,{weekday:'long',day:'numeric',month:'long'})}">`;
  const eight=(date,pid)=>`<button type="button" class="tt-8h" data-tt="add" data-target="${date}|${pid}" data-amount="480" aria-label="Lägg till 8 timmar">${icon('clock-plus')}<span>8 h</span></button>`;
  function head(){
    const dates=periodDates(),m=mondayOf(anchor);
    const label=scale==='day'?dateText(anchor,{weekday:'long',day:'numeric',month:'long'}):scale==='week'?`Vecka ${isoWeek(anchor)} · ${parseDate(m).getDate()}–${dateText(shiftDate(m,6),{day:'numeric',month:'short'}).replace('.','')}`:dateText(anchor,{month:'long',year:'numeric'});
    const inPeriod=dates.includes(localDate());
    return `<header class="tt-head"><div><div class="eyebrow">Tidrapport</div><h1 id="timeTitle">Projekt<em>tid.</em></h1></div>
<div class="segmented tt-scale" role="group" aria-label="Visa">${[['day','Dag'],['week','Vecka'],['month','Månad']].map(([k,l])=>`<button type="button" data-tt="scale" data-scale="${k}" aria-pressed="${scale===k}">${l}</button>`).join('')}</div></header>
<div class="tt-nav"><button type="button" class="icon-btn" data-tt="prev" aria-label="Föregående">${icon('chevron-left')}</button><span class="tt-period">${esc(label)}</span><button type="button" class="icon-btn" data-tt="next" aria-label="Nästa">${icon('chevron-right')}</button><button type="button" class="subtle-btn tt-today" data-tt="today"${inPeriod?' hidden':''}>Idag</button></div>
<div class="tt-kpis"><strong data-sum="total"></strong><span class="tt-h">h</span><span class="tt-kmeta"><b data-sum="days"></b> dagar · snitt <b data-sum="avg"></b></span></div>`;
  }
  function editorStrip(date,pid){
    const p=s().timeProjects[pid];
    return `<div class="tt-editor" style="--c:${p.color}"><div class="tt-ed-head"><button type="button" class="icon-btn" data-tt="ed-step" data-step="-1" aria-label="Dagen före">${icon('chevron-left')}</button><span class="tt-ed-title">${esc(p.name)} · ${dateText(date,{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'')}</span><button type="button" class="icon-btn" data-tt="ed-step" data-step="1" aria-label="Dagen efter">${icon('chevron-right')}</button><button type="button" class="icon-btn" data-tt="ed-close" aria-label="Stäng">${icon('close')}</button></div>
<div class="tt-ed-row">${input(date,pid)}${eight(date,pid)}</div>
<div class="tt-chips">${[[15,'+15 min'],[30,'+30 min'],[60,'+1 h'],[-30,'−30 min']].map(([n,l])=>`<button type="button" data-tt="add" data-target="${date}|${pid}" data-amount="${n}">${l}</button>`).join('')}<button type="button" data-tt="clear" data-target="${date}|${pid}">Rensa</button></div></div>`;
  }
  function dayRows(date,list){
    if(!list.length)return '';
    return `<div class="tt-day">${list.map(p=>`<div class="tt-drow">${dot(p)}<span class="tt-pname">${esc(p.name)}</span>${input(date,p.id)}${eight(date,p.id)}</div>`).join('')}<div class="tt-drow tt-dfoot"><span class="tt-pname">Totalt</span><strong data-sum="day|${date}"></strong></div></div>`;
  }
  function weekGrid(dates,list){
    const today=localDate();
    const headRow=`<div class="tt-row tt-row-head"><span class="tt-name"></span>${dates.map((d,i)=>`<span class="tt-dh${d===today?' is-today':''}${isWeekend(d)?' is-weekend':''}"><b>${DAY[i]}</b>${parseDate(d).getDate()}</span>`).join('')}<span class="tt-tot">Σ</span></div>`;
    const rows=list.map(p=>`<div class="tt-row" style="--c:${p.color}"><span class="tt-name">${dot(p)}<span>${esc(p.name)}</span></span>${dates.map(d=>`<button type="button" class="tt-cell${cell&&cell.date===d&&cell.pid===p.id?' is-sel':''}${isWeekend(d)?' is-weekend':''}" data-tt="cell" data-target="${d}|${p.id}" data-sum="cell|${d}|${p.id}" aria-label="${esc(p.name)} ${DAY[(parseDate(d).getDay()+6)%7]} ${parseDate(d).getDate()}"></button>`).join('')}<span class="tt-tot" data-sum="proj|${p.id}"></span></div>${cell&&cell.pid===p.id&&dates.includes(cell.date)?editorStrip(cell.date,p.id):''}`).join('');
    const foot=`<div class="tt-row tt-row-foot"><span class="tt-name">Totalt</span>${dates.map(d=>`<span class="tt-dsum" data-sum="day|${d}"></span>`).join('')}<span class="tt-tot" data-sum="total"></span></div>`;
    return `<div class="tt-week">${headRow}${rows}${foot}</div>`;
  }
  function monthView(dates,list){
    const first=dates[0],lead=(parseDate(first).getDay()+6)%7,today=localDate();
    if(!dates.includes(monthDay))monthDay=dates.includes(today)?today:first;
    const cal=`<div class="tt-cal">${['M','T','O','T','F','L','S'].map(d=>`<span class="tt-cwd">${d}</span>`).join('')}${'<span></span>'.repeat(lead)}${dates.map(d=>`<button type="button" class="tt-cday${d===today?' is-today':''}${d===monthDay?' is-sel':''}${isWeekend(d)?' is-weekend':''}" data-tt="mday" data-date="${d}" data-heat="${d}"><span class="n">${parseDate(d).getDate()}</span><span class="v" data-sum="day|${d}"></span><span class="bars" data-bars="${d}"></span></button>`).join('')}</div>`;
    const mondays=[...new Set(dates.map(mondayOf))],inMonth=m=>Array.from({length:7},(_,i)=>shiftDate(m,i)).filter(d=>dates.includes(d));
    const range=m=>{const w=inMonth(m),a=parseDate(w[0]).getDate(),b=parseDate(w.at(-1)).getDate();return a===b?String(a):`${a}–${b}`;};
    const split=`<div class="tt-split"><h3>Per projekt</h3>${list.map(p=>`<div class="tt-brow">${dot(p)}<span class="tt-bname">${esc(p.name)}</span><span class="tt-bar" data-pbar="${p.id}" style="--c:${p.color}"><i></i></span><strong data-sum="proj|${p.id}"></strong></div>`).join('')}
<h3>Per vecka</h3>${mondays.map(m=>`<div class="tt-brow"><span class="tt-bname"><b>v.${isoWeek(m)}</b> ${range(m)}</span><span class="tt-bar tt-stack" data-wbars="${m}"></span><strong data-sum="weektotal|${m}"></strong></div>`).join('')}</div>`;
    return `${cal}<section class="tt-mday"><h3>${esc(dateText(monthDay,{weekday:'long',day:'numeric',month:'long'}))}</h3>${dayRows(monthDay,sorted().filter(p=>!p.archived||mins(monthDay,p.id)))}</section>${split}`;
  }
  function projectsPanel(){
    const list=sorted(),used=id=>Object.values(s().timeLog).some(day=>day[id]);
    return `<details class="tt-projects"${list.length?'':' open'}><summary>Projekt <span>${list.filter(p=>!p.archived).length}</span></summary><div class="tt-plist">${list.map(p=>`<div class="tt-prow${p.archived?' is-archived':''}"><button type="button" class="tt-pcolor" data-tt="proj-color" data-pid="${p.id}" style="--c:${p.color}" aria-label="Byt färg för ${esc(p.name)}"></button><input class="tt-pinput" data-pname="${p.id}" value="${esc(p.name)}" maxlength="60" aria-label="Projektnamn"><button type="button" class="text-btn" data-tt="proj-archive" data-pid="${p.id}">${p.archived?'Återställ':'Arkivera'}</button>${used(p.id)?'':`<button type="button" class="icon-btn" data-tt="proj-delete" data-pid="${p.id}" aria-label="Ta bort ${esc(p.name)}">${icon('trash')}</button>`}</div>`).join('')}
<form class="tt-padd" data-tt-form="add"><input name="name" maxlength="60" placeholder="Nytt projekt" autocomplete="off" aria-label="Nytt projekt"><button type="submit" class="primary-btn">${icon('plus')}Lägg till</button></form></div></details>`;
  }

  // Outside changes (sync, other edits) only refresh the figures while a field is being typed in.
  function render(){
    if(!root.hidden&&root.contains(document.activeElement)&&document.activeElement.matches('input')){updateSums();return;}
    draw();
  }
  function draw(){
    const dates=periodDates(),list=shown(dates);
    if(cell&&(!dates.includes(cell.date)||!s().timeProjects[cell.pid]))cell=null;
    const body=!sorted().length?`<div class="tt-empty">${icon('clock')}<h3>Lägg till ditt första projekt</h3><p class="muted">Sedan fyller du i timmar dag för dag och ser summan per vecka och månad.</p></div>`
      :!list.length?`<div class="tt-empty"><h3>Inga aktiva projekt</h3><p class="muted">Återställ ett arkiverat projekt eller lägg till ett nytt.</p></div>`
      :scale==='day'?dayRows(anchor,list):scale==='week'?weekGrid(dates,list):monthView(dates,list);
    root.innerHTML=head()+`<div class="tt-body">${body}</div>`+projectsPanel();
    updateSums();
  }
  // Every figure on the page carries data-sum and is recomputed from the state, so typing never re-renders.
  function updateSums(all=false){
    const dates=periodDates(),month=scale==='month'?anchor.slice(0,7):null;
    const inPeriod=d=>!month||d.slice(0,7)===month;
    let total=0,days=0;for(const d of dates){const t=dayTotal(d);total+=t;if(t)days++;}
    for(const el of root.querySelectorAll('[data-sum]')){
      const [kind,a,b]=el.dataset.sum.split('|');let v=0;
      if(kind==='cell')v=mins(a,b);
      else if(kind==='day')v=dayTotal(a);
      else if(kind==='proj')v=dates.reduce((n,d)=>n+mins(d,a),0);
      else if(kind==='week')v=Array.from({length:7},(_,i)=>shiftDate(a,i)).filter(inPeriod).reduce((n,d)=>n+mins(d,b),0);
      else if(kind==='weektotal')v=Array.from({length:7},(_,i)=>shiftDate(a,i)).filter(inPeriod).reduce((n,d)=>n+dayTotal(d),0);
      else if(kind==='total')v=total;
      if(kind==='days'){el.textContent=String(days);continue;}
      if(kind==='avg'){el.textContent=days?hm(Math.round(total/days)):'–';continue;}
      el.textContent=kind==='cell'||kind==='day'&&el.closest('.tt-cal')?hm(v):el.classList.contains('tt-dsum')?(hm(v)||'–'):sumText(v);
      el.classList.toggle('is-zero',!v);
    }
    for(const el of root.querySelectorAll('[data-heat]'))el.style.setProperty('--heat',Math.min(1,dayTotal(el.dataset.heat)/480).toFixed(2));
    for(const el of root.querySelectorAll('[data-bars]')){const d=el.dataset.bars,t=dayTotal(d);el.innerHTML=t?sorted().filter(p=>mins(d,p.id)).map(p=>`<i style="--c:${p.color};flex:${mins(d,p.id)}"></i>`).join(''):'';}
    // Month bars: share of the month per project, and each week split by project (scaled to the busiest week).
    const projTotal=id=>dates.reduce((n,d)=>n+mins(d,id),0),weekDays=m=>Array.from({length:7},(_,i)=>shiftDate(m,i)).filter(d=>dates.includes(d));
    for(const el of root.querySelectorAll('[data-pbar]'))el.firstElementChild.style.width=`${total?projTotal(el.dataset.pbar)/total*100:0}%`;
    const wbars=[...root.querySelectorAll('[data-wbars]')],weekSum=m=>weekDays(m).reduce((n,d)=>n+dayTotal(d),0),top=Math.max(1,...wbars.map(el=>weekSum(el.dataset.wbars)));
    for(const el of wbars){const days=weekDays(el.dataset.wbars);el.innerHTML=sorted().map(p=>{const v=days.reduce((n,d)=>n+mins(d,p.id),0);return v?`<i style="--c:${p.color};width:${v/top*100}%"></i>`:'';}).join('');}
    // A focused field keeps what is being typed, unless a button changed the value (all=true).
    for(const el of root.querySelectorAll('.tt-input'))if(all||el!==document.activeElement){const [d,p]=el.dataset.input.split('|');el.value=hm(mins(d,p));el.classList.remove('is-bad');}
  }

  // ── Editing ──
  function commit(el){
    if(!el?.matches?.('.tt-input'))return true;
    const [date,pid]=el.dataset.input.split('|'),v=parseDuration(el.value);
    if(v===null||v>1440){el.classList.add('is-bad');toast('Skriv tiden som 7:30, 7,5 eller 8.',null,4000);return false;}
    el.classList.remove('is-bad');
    if(v!==mins(date,pid))setMins(date,pid,v);
    el.value=hm(v);updateSums();return true;
  }
  function focusInput(target){const el=root.querySelector(`.tt-input[data-input="${target}"]`);if(el){el.focus({preventScroll:false});el.select();}}
  function step(n){
    if(scale==='day')anchor=shiftDate(anchor,n);
    else if(scale==='week')anchor=shiftDate(anchor,7*n);
    else{const d=parseDate(anchor.slice(0,8)+'01');d.setMonth(d.getMonth()+n);anchor=localDate(d);monthDay=anchor;}
    cell=null;draw();
  }
  root.addEventListener('change',e=>{
    if(e.target.matches('.tt-input'))commit(e.target);
    else if(e.target.matches('[data-pname]')){const name=e.target.value.trim(),id=e.target.dataset.pname;if(!name){e.target.value=s().timeProjects[id].name;return;}mutate(st=>{st.timeProjects[id]={...st.timeProjects[id],name};});}
  });
  root.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||!e.target.matches('.tt-input'))return;
    e.preventDefault();if(!commit(e.target))return;
    if(e.target.closest('.tt-editor')){moveCell(1);return;}
    const all=[...root.querySelectorAll('.tt-input')],next=all[all.indexOf(e.target)+1];
    if(next){next.focus();next.select();}else e.target.blur();
  });
  // While typing, the field (with the week editor's quick steps) is scrolled into the part of the screen the
  // keyboard leaves free; checked again as the keyboard slides up and the visual viewport shrinks.
  function keepVisible(el){
    const box=el.closest('.tt-editor')||el.closest('.tt-drow')||el,vv=window.visualViewport;
    const fit=()=>{
      if(document.activeElement!==el)return;
      const top=(vv?vv.offsetTop:0)+70,bottom=(vv?vv.offsetTop+vv.height:innerHeight)-16,r=box.getBoundingClientRect();
      if(r.bottom>bottom)window.scrollBy({top:Math.min(r.bottom-bottom,r.top-top),behavior:'smooth'});
      else if(r.top<top)window.scrollBy({top:r.top-top,behavior:'smooth'});
    };
    [60,320,620].forEach(ms=>setTimeout(fit,ms));
    if(vv){const once=()=>{vv.removeEventListener('resize',once);setTimeout(fit,40);};vv.addEventListener('resize',once);setTimeout(()=>vv.removeEventListener('resize',once),1500);}
  }
  root.addEventListener('focusin',e=>{if(e.target.matches('.tt-input')){setTimeout(()=>e.target.select(),0);keepVisible(e.target);}});
  root.addEventListener('submit',e=>{
    if(!e.target.matches('[data-tt-form=add]'))return;e.preventDefault();
    const name=e.target.elements.name.value.trim();if(!name)return;
    const list=sorted(),used=new Set(list.map(p=>p.color)),color=PROJECT_COLORS.find(c=>!used.has(c))||PROJECT_COLORS[list.length%PROJECT_COLORS.length];
    mutate(st=>{st.timeProjects[uid()]={name,color,order:list.length?Math.max(...list.map(p=>p.order))+1:0,archived:false};});
    root.querySelector('.tt-projects')?.setAttribute('open','');root.querySelector('[data-tt-form=add] input')?.focus();
  });
  function moveCell(n){
    if(!cell)return;
    const dates=periodDates(),i=dates.indexOf(cell.date)+n;
    if(i<0||i>=dates.length){if(scale==='week'){anchor=shiftDate(anchor,7*n);cell={date:shiftDate(cell.date,n),pid:cell.pid};}else return;}
    else cell={date:dates[i],pid:cell.pid};
    draw();focusInput(`${cell.date}|${cell.pid}`);
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-tt]');if(!b)return;
    // iPhone does not move focus to a tapped button, so a typed value is saved before acting.
    const active=document.activeElement;if(active!==b&&!commit(active))return;
    const act=b.dataset.tt,[date,pid]=(b.dataset.target||'').split('|');
    if(act==='scale'){scale=b.dataset.scale;cell=null;draw();}
    else if(act==='prev')step(-1);else if(act==='next')step(1);
    else if(act==='today'){anchor=localDate();monthDay=anchor;cell=null;draw();}
    else if(act==='cell'){cell=cell&&cell.date===date&&cell.pid===pid?null:{date,pid};draw();if(cell)focusInput(b.dataset.target);}
    else if(act==='ed-step')moveCell(Number(b.dataset.step));
    else if(act==='ed-close'){cell=null;draw();}
    else if(act==='add'){setMins(date,pid,mins(date,pid)+Number(b.dataset.amount));updateSums(true);}
    else if(act==='clear'){setMins(date,pid,0);updateSums(true);}
    else if(act==='mday'){monthDay=b.dataset.date;draw();}
    else if(act==='proj-color'){const p=s().timeProjects[b.dataset.pid],next=PROJECT_COLORS[(PROJECT_COLORS.indexOf(p.color)+1)%PROJECT_COLORS.length];mutate(st=>{st.timeProjects[b.dataset.pid]={...p,color:next};});}
    else if(act==='proj-archive'){const p=s().timeProjects[b.dataset.pid];mutate(st=>{st.timeProjects[b.dataset.pid]={...p,archived:!p.archived};},p.archived?'Projektet är tillbaka':'Projektet är arkiverat');}
    else if(act==='proj-delete'){const id=b.dataset.pid;mutate(st=>{delete st.timeProjects[id];},'Projektet är borttaget');}
  });
  return {render,isEditing:()=>root.contains(document.activeElement)&&document.activeElement.matches('input')};
}
