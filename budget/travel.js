(function(){
'use strict';
const S=window.TravelStore,M=window.TravelModel,$=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch(_){return d;}};
const remember=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(_){toast('Inställningen kunde inte sparas på enheten.');}};
const query=new URLSearchParams(location.search);
let tripId=query.get('trip')||read('travel-selected-v2','')||localStorage.getItem('travel-selected')||'',tab=query.get('tab')||'overview',tripFilter='Alla';
let lastRenderKey='';
let addingPackingHeading=false;
let packingActiveEdit=null;
let showNight=false,selectedPlace='',savingEditor=false,mapMarkers=new Map();
let day='',daysWide=false,editing=null,drag=null,map=null,mapRows=[],viewerIndex=0,toastTimer,undoAction=null,renderPending=false;
const filters={packingStatus:'all',packingOwner:'',packingGroup:'owner',taskOwner:'',taskStatus:'all',budget:'plan',placeCategory:'',placeStatus:'',placeDay:'',photoDay:''};
// Navigation groups share the existing record types; old deep links remain valid.
const tabs=[['overview','Översikt','RESAN I KORTHET'],['activity','Resplan','DAGAR ATT FYLLA'],['booking','Bokningar & biljetter','DIN RESEPLÅNBOK'],['task','Förberedelser','REDO FÖR AVRESA'],['expense','Reskassa','PLANERA · UPPLEVA · GÖRA UPP'],['note','Resedagbok','MINNEN LÄNGS VÄGEN']];
const sectionFor=key=>({place:'activity',packing:'task',document:'booking',photo:'note'})[key]||key;
let planView=read('travel-plan-view','journey');
if(!['journey','day','week','map'].includes(planView))planView='journey';
if(query.get('view')&&['journey','day','week','map'].includes(query.get('view')))planView=query.get('view');
if(tab==='place')planView='map';
if(tab==='activity'&&planView==='map')tab='place';
const names={trip:'resa',activity:'aktivitet',packing:'packsak',task:'uppgift',expense:'kostnad',booking:'bokning',place:'plats',photo:'bild',document:'dokument',note:'anteckning',categoryBudget:'kategoribudget',packTemplate:'packmall'};
if(!tabs.some(x=>x[0]===sectionFor(tab)))tab='overview';
const trip=()=>S.get(tripId),list=(type)=>S.list().filter(x=>!x.deleted&&x.type===type&&(type==='trip'||type==='packTemplate'||x.tripId===tripId));
const allForTrip=()=>S.list().filter(x=>x.tripId===tripId&&!x.deleted);
const currentDay=()=>M.today(trip()?.timezone);
const members=()=>[...new Set([...(trip()?.travelers||'').split(',').map(x=>x.trim()).filter(Boolean),...(trip()?.packingPeople?trip().packingPeople.split(',').map(x=>x.trim()).filter(Boolean):M.people),...list('packing').map(x=>x.owner).filter(Boolean)])];
const money=(n,currency=trip()?.currency||'SEK')=>new Intl.NumberFormat('sv-SE',{style:'currency',currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)||0);
const btn=(attr,label,cls='')=>'<button type="button" '+attr+' class="'+cls+'">'+label+'</button>';
const link=(url,label='Öppna länk')=>S.safeURL(url)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(S.safeURL(url))+'">'+esc(label)+'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;width:13px;height:13px;vertical-align:-2px;margin-left:4px"><path d="M7 17 17 7M9 7h8v8"/></svg></a>':'';
const maps=x=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x||'');
const opts=(values,value,empty)=> (empty!==undefined?'<option value="">'+esc(empty)+'</option>':'')+values.map(v=>{const [key,label]=Array.isArray(v)?v:[v,v];return '<option value="'+esc(key)+'" '+(String(value)===String(key)?'selected':'')+'>'+esc(label)+'</option>';}).join('');
const selectFilter=(key,label,values,empty)=>'<label>'+esc(label)+'<select data-filter="'+key+'">'+opts(values,filters[key],empty)+'</select></label>';
const bar=(n,d)=>'<div class="metric-bar"><span style="width:'+Math.max(0,Math.min(100,d?100*n/d:0))+'%"></span></div>';
const empty=text=>'<div class="empty-section">'+esc(text)+'</div>';
const actions=x=>btn('data-edit="'+esc(x.id)+'"','Redigera')+link(x.url)+(x.location?link(maps(x.location),'Navigera'):'');
const linked=(x,key)=>{const r=S.get(x[key]);return r&&!r.deleted?btn('data-edit="'+esc(r.id)+'"',esc(r.title),'text-button'):'';};
function toast(text,undo){clearTimeout(toastTimer);undoAction=undo||null;$('toast').innerHTML='<span>'+esc(text)+'</span>'+(undo?btn('data-action="undo"','Ångra'):'');$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,undo?12000:5000);}
function utility(title,body){$('utility-title').textContent=title;$('utility-body').innerHTML=body;MenuMotion.show($('utility'),true);$('utility-title').focus({preventScroll:true});}
function setTab(next){if(editing)closeEditor(false);tab=next;if(next==='place')planView='map';if(next==='activity'&&planView==='map')tab='place';addingPackingHeading=false;render(true);}
function setPlanView(view){if(editing)closeEditor(false);planView=view;remember('travel-plan-view',view);tab=view==='map'?'place':'activity';daysWide=view==='week';render(true);}
function renderFingerprint(){return JSON.stringify([tripId,tab,tripFilter,day,planView,filters,S.list()]);}

function tick(){const t=trip();if(!t||!$('countdown'))return;const c=S.countdown(t.departureISO||t.departure,t.endDate,Date.now(),t.timezone);$('countdown').innerHTML='<p>'+esc(c.label)+'</p><div class="digits">'+c.parts.map((n,i)=>'<div><strong>'+String(n).padStart(2,'0')+'</strong><small>'+['dagar','timmar','minuter','sekunder'][i]+'</small></div>').join('')+'</div>';}
function render(force=false){
 $('sync').textContent=S.status();$('sync').classList.toggle('error',/saknas|blockerad|Kunde/.test(S.status()));
 const renderKey=renderFingerprint();if(!force&&lastRenderKey===renderKey)return;
 if(uploadBusy||(editing&&$('editor').classList.contains('inline-editor'))||drag||(!force&&document.activeElement?.closest('#content input,#content textarea,#content select,#content [contenteditable="true"]'))){renderPending=true;return;}renderPending=false;lastRenderKey=renderKey;
 const trips=list('trip');if(!trips.some(x=>x.id===tripId))tripId=trips[0]?.id||'';
 $('trip-filters').innerHTML=['Alla','Kommande','Pågående','Tidigare','Arkiverade'].map(x=>btn('data-trip-filter="'+x+'" aria-pressed="'+(tripFilter===x)+'"',x,tripFilter===x?'active':'')).join('');
 $('trips').innerHTML=trips.filter(x=>tripFilter==='Alla'?!x.archived:M.tripState(x)===tripFilter).map(x=>btn('data-trip="'+esc(x.id)+'" aria-pressed="'+(x.id===tripId)+'"',esc(x.title),x.id===tripId?'active':'')).join('')||'<span class="muted">Inga resor i den här gruppen.</span>';
 $('empty').hidden=!!tripId;$('workspace').hidden=!tripId;if(!tripId)return;
 const currentURL=new URL(location.href);currentURL.searchParams.set('trip',tripId);currentURL.searchParams.set('tab',tab);if(sectionFor(tab)==='activity')currentURL.searchParams.set('view',planView);else currentURL.searchParams.delete('view');history.replaceState(null,'',currentURL);
 const t=trip();$('hero').innerHTML='<div class="hero">'+(t.coverId?'<img class="hero-cover" data-file="'+esc(t.coverId)+'" alt="">':t.coverURL?'<img class="hero-cover" src="'+esc(S.safeURL(t.coverURL))+'" alt="">':'')+'<div><span class="eyebrow">'+esc(t.destination||'ER RESA')+' · '+M.tripState(t)+'</span><h2>'+esc(t.title)+'</h2><p class="meta">'+esc((t.departure||'').slice(0,10))+' — '+esc(t.endDate||'')+'</p><p class="meta">'+esc(t.travelers||'')+'</p><div class="hero-actions">'+btn('data-edit="'+esc(t.id)+'"','Redigera resa')+btn('data-action="trip-tools"','Hantera resa')+'</div></div><div class="countdown" id="countdown"></div></div>';tick();
 $('tabs').innerHTML=tabs.map(([key,label])=>btn('data-tab="'+key+'" aria-current="'+(sectionFor(tab)===key?'page':'false')+'"',label,sectionFor(tab)===key?'active':'')).join('');
 const desc=tabs.find(x=>x[0]===sectionFor(tab));$('section-title').textContent=desc[1];$('section-kicker').textContent=desc[2];$('add').hidden=tab==='overview'||tab==='packing';$('add').textContent='+ '+({photo:'Skriv ett minne',note:'Skriv ett minne',document:'Bokning',booking:'Bokning',packing:'Lägg till sak',task:'Ny uppgift',expense:filters.budget==='plan'?'Planera kostnad':'Ny utgift'}[tab]||'Lägg till '+names[tab]);
 // A filter change re-renders the list. Preserve its open state so users can
 // adjust multiple criteria without repeatedly reopening the same control.
 const content=$('content');
 const keepTab=content.dataset.renderedTab===tab;
 const retain=keepTab?[...content.querySelectorAll('details[open]')].map(d=>d.className)
  .filter(name=>['packing-filter','travel-task-filters','travel-task-quick-more','travel-quiet-filter'].includes(name)):[];
 restoreEditor();map?.remove();map=null;mapMarkers.clear();const views={overview:overview,activity:resplan,packing:preparations,task:preparations,expense:expenses,booking:wallet,place:resplan,photo:journal,document:wallet,note:journal};
 content.innerHTML=views[tab]();
 content.dataset.renderedTab=tab;
 for(const className of retain)content.querySelector('details.'+className)?.setAttribute('open','');
 hydrateImages();if(tab==='place')loadMap();if(sectionFor(tab)==='booking'||tab==='overview')checkFiles();
}
function metric(label,value,detail,to,filter=''){return '<button class="card metric metric-link" data-go="'+to+'" '+filter+'><small>'+label+'</small><strong>'+value+'</strong><p>'+detail+'</p></button>';}
function overview(){const t=trip(),p=list('packing'),todos=list('task'),cost=M.budget(list('expense'),list('categoryBudget')),during=M.tripState(t)==='Pågående';if(M.tripState(t)==='Tidigare')return afterTrip();const next=list('activity').filter(x=>x.date>currentDay()||(x.date===currentDay()&&(!x.endTime||x.endTime>=M.timeIn(t.timezone)))).sort(M.activitySort);
 const stay=list('booking').filter(x=>x.category==='Boende'&&x.status!=='Avbokat'&&x.date<=currentDay()&&(!x.endDate||x.endDate>=currentDay()));
 return '<div class="journey-phase"><span class="eyebrow">'+(during?'JUST NU PÅ RESAN':'SNART BÄR DET AV')+'</span><h3>'+(during?'Dagens planer, nära till hands':'Allt redo för avresan?')+'</h3><p>'+ (during?'Schema, boende och biljetter samlade här.':'Packa, bocka av förberedelserna och håll koll på reskassan.')+'</p></div><div class="grid overview-metrics">'+metric('PACKNING',p.filter(x=>x.done).length+' / '+p.length,p.filter(x=>!x.done).length+' saker kvar','packing','data-status="todo"')+metric('ATT GÖRA',todos.filter(x=>!x.done).length,'förberedelser återstår','task','data-status="todo"')+metric('RESKASSA',money(cost.actual),money((t.budget||0)-cost.actual)+' kvar','expense')+'</div>'+
 '<div class="overview-columns"><section><div class="day-heading">'+(during?'Nästa på programmet':'Kommande upplevelser')+'</div>'+((during?next.filter(x=>x.date===currentDay()):next).slice(0,4).map(agenda).join('')||empty('Dagen är öppen. Lägg till något i schemat.'))+'</section><section><div class="day-heading">'+(during?'Ditt boende & viktiga dokument':'Inför avresan')+'</div>'+(during?stay.map(bookingCard).join('')+list('document').filter(x=>x.important&&!stay.some(b=>b.id===x.bookingId)).map(documentRow).join(''):todos.filter(x=>!x.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).slice(0,4).map(taskRow).join('')+list('booking').filter(x=>!x.status||x.status==='Att boka').slice(0,3).map(bookingCard).join(''))+'</section></div>'+(t.notes?'<article class="card overview-notes"><span class="eyebrow">OM RESAN</span><p>'+esc(t.notes)+'</p></article>':'');}
function afterTrip(){const balance=M.settlement(list('expense')),pictures=photoRows().slice(0,3);return '<div class="journey-phase"><span class="eyebrow">VÄLKOMNA HEM</span><h3>Resan lever vidare.</h3></div><div class="grid overview-metrics">'+metric('MINNEN',list('photo').length+' bilder',list('note').length+' anteckningar','note')+metric('RESANS KOSTNAD',money(M.budget(list('expense'),[]).actual),'registrerat i reskassan','expense')+'</div><div class="after-trip"><section><div class="day-heading">Att minnas</div><div class="gallery">'+pictures.map(photoFigure).join('')+'</div>'+btn('data-go="note"','Öppna resedagboken →','text-button')+'</section><section><div class="day-heading">Göra upp</div>'+settlementView(list('expense'),balance)+btn('data-cash-split="true"','Öppna reskassan →','text-button')+'</section></div>';}
function availableDays(){const t=trip(),set=new Set([...list('activity'),...list('booking')].flatMap(x=>[x.date,x.endDate]).filter(M.validDate));let d=(t.departure||'').slice(0,10),end=t.endDate||d;for(let i=0;d&&d<=end&&i<366;i++,d=M.addDays(d,1))set.add(d);if(!set.size)set.add(currentDay());return [...set].sort();}
function dateLabel(date,options={weekday:'long',day:'numeric',month:'short'}){return M.validDate(date)?new Date(date+'T12:00:00').toLocaleDateString('sv-SE',options):'Utan datum';}
function dayActivities(date){return list('activity').filter(x=>x.date===date||(x.date<date&&(x.endDate||x.date)>=date)).sort(M.activitySort);}
function dayBookings(date){return list('booking').filter(x=>x.status!=='Avbokat'&&x.date<=date&&(x.endDate||x.date)>=date);}
function resplan(){
 if(!day)day=availableDays().includes(currentDay())?currentDay():availableDays()[0];
 const picker='<div class="view-switch" role="group" aria-label="Visa resplan som">'+[['journey','Hela resan'],['day','Dag'],['week','Vecka'],['map','Karta']].map(([key,label])=>btn('data-plan-view="'+key+'" aria-pressed="'+(planView===key)+'"',label,planView===key?'active':'')).join('')+'</div>';
 return picker+(planView==='journey'?journey():planView==='map'?places():schedule());
}
function journey(){
 const dates=availableDays(),start=(trip().departure||'').slice(0,10);
 return '<div class="journey-summary"><strong>'+dates.length+' dagar</strong><span>'+list('activity').length+' planer</span><span>'+list('place').length+' sparade platser</span></div><div class="journey-days">'+dates.map(d=>{
 const rows=dayActivities(d),booked=dayBookings(d),stay=booked.filter(x=>x.category==='Boende'),travel=booked.filter(x=>x.category!=='Boende'&&x.date===d),cities=[...new Set([...rows.map(locationOf),...booked.map(x=>x.location)].filter(Boolean))];
 return '<article class="journey-day '+(d===currentDay()?'is-today':'')+'" data-journey-day="'+d+'"><div class="journey-date"><small>'+esc(dateLabel(d,{weekday:'short'}))+'</small><strong>'+Number(d.slice(8))+'</strong><span>'+esc(dateLabel(d,{month:'short'}))+'</span></div><div class="journey-day-body"><div class="journey-day-heading"><div><small>'+(d>=start&&d<=trip().endDate?'DAG '+(M.dayDiff(start,d)+1):'UTANFÖR RESDATUM')+'</small><h3>'+esc(cities[0]||'En öppen dag')+'</h3></div>'+btn('data-open-day="'+d+'"','Öppna dag →','text-button')+'</div>'+
 stay.map(x=>'<button class="journey-stay" data-edit="'+esc(x.id)+'"><small>BOENDE</small> '+esc(x.title)+'</button>').join('')+
 '<div class="journey-stops">'+travel.filter(x=>!rows.some(a=>a.bookingId===x.id)).map(x=>'<button data-edit="'+esc(x.id)+'"><time>'+esc(x.time||'—')+'</time><span>'+esc(x.title)+'</span><small>'+esc(x.category)+'</small></button>').join('')+rows.map(x=>'<button data-edit="'+esc(x.id)+'"><time>'+esc(x.date<d?'↳':x.time||'Valfri tid')+'</time><span>'+esc(x.title)+'</span><small>'+esc(x.category||'')+'</small></button>').join('')+'</div>'+(!rows.length&&!travel.length?'<p class="open-day">Plats för något spontant.</p>':'')+btn('data-slot="'+d+'|"','+ Planera något','text-button')+'</div></article>';
 }).join('')+'</div>';
}
function compactWeek(week){return '<div class="compact-week">'+week.map(d=>'<section class="week-agenda-day" data-keep-time="true" data-drop-date="'+d+'" data-drop-time=""><div class="week-agenda-heading">'+btn('data-open-day="'+d+'"',esc(dateLabel(d)),'text-button')+'<small>'+dayActivities(d).length+' planer</small></div>'+dayActivities(d).map(x=>'<article class="week-agenda-event" data-item="'+esc(x.id)+'">'+btn('data-edit="'+esc(x.id)+'"','<time>'+esc(x.date<d?'Fortsätter':x.time||'Valfri tid')+'</time><strong>'+esc(x.title)+'</strong>')+btn('data-drag="'+esc(x.id)+'" aria-label="Flytta '+esc(x.title)+'"','⠿','handle')+'</article>').join('')+btn('data-slot="'+d+'|"','+ Lägg till','add-slot')+'</section>').join('')+'</div>';}
function agenda(x){const clash=M.overlaps(x,list('activity'));return '<article class="agenda" data-item="'+esc(x.id)+'"><div class="time">'+esc(x.timing==='allDay'?'Heldag':x.time||'Flexibelt')+'<small>'+esc(x.endTime||'')+(x.endDate&&x.endDate!==x.date?'<br>→ '+esc(x.endDate.slice(5)):'')+'</small></div><div class="info"><small>'+esc(x.category||'Aktivitet')+'</small><h3 class="travel-inline-title" data-travel-title="'+esc(x.id)+'" tabindex="0" role="button" aria-label="Redigera '+esc(x.title)+'">'+esc(x.title)+'</h3><p>'+esc(locationOf(x))+'</p>'+(clash.length?'<span class="warning" title="'+esc(clash.map(y=>y.title).join(', '))+'">Överlappar '+clash.length+' aktivitet'+(clash.length>1?'er':'')+'</span>':'')+'<p>'+esc(x.notes||'')+'</p><div class="inline-actions">'+linked(x,'placeId')+linked(x,'bookingId')+link(x.url)+'</div></div><div class="row-actions">'+btn('data-edit="'+esc(x.id)+'"','Ändra')+btn('data-drag="'+esc(x.id)+'" aria-label="Dra '+esc(x.title)+'"','⠿','handle')+'</div></article>';}
function locationOf(x){return S.get(x.placeId)?.location||S.get(x.bookingId)?.location||x.location||'';}
function schedule(){
 const days=availableDays();if(!day)day=days.includes(currentDay())?currentDay():days[0];
 const weekStart=M.addDays(day,-((new Date(day+'T12:00:00').getDay()+6)%7));
 const week=Array.from({length:7},(_,i)=>M.addDays(weekStart,i));
 daysWide=planView==='week';const shown=daysWide?week:[day],rows=list('activity');
 const segments=shown.map(d=>TravelLayout.segments(rows,d));
 const start=showNight?0:Math.min(7,...segments.flat().map(x=>Math.floor(x.start/60)));
 const end=showNight?24:Math.max(22,...segments.flat().map(x=>Math.ceil(x.end/60)));
 return '<div class="schedule-tools">'+btn('data-week="-1" aria-label="Föregående vecka"','←')+'<label>Resans kalender<input type="date" id="schedule-date" value="'+day+'"></label>'+btn('data-week="1" aria-label="Nästa vecka"','→')+btn('data-action="schedule-today"','Idag')+'</div>'+
 '<div class="week-strip">'+week.map(d=>btn('data-day="'+d+'" aria-pressed="'+(d===day)+'"','<small>'+esc(new Date(d+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'short'}))+'</small><strong>'+Number(d.slice(8))+'</strong><i>'+rows.filter(x=>x.date===d).length+' planer</i>',d===day?'active':'')).join('')+'</div>'+
 (daysWide?compactWeek(week):'')+'<div class="calendar-caption '+(daysWide?'desktop-calendar':'')+'"><span>'+esc(trip().timezone||'Europe/Stockholm')+' · tryck på en ledig tid</span>'+btn('data-night aria-pressed="'+showNight+'"',showNight?'Dölj tomma nattimmar':'Visa natt','text-button')+'</div>'+
 '<div class="calendar-days '+(daysWide?'week-view desktop-calendar':'day-view')+'">'+shown.map((d,i)=>{
 const floating=rows.filter(x=>x.date===d&&x.timing!=='timed');
 return '<section class="calendar-day '+(d===day?'selected-day':'')+'" data-calendar-day="'+d+'" data-drop-day="'+d+'"><h3>'+esc(new Date(d+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'short'}))+'</h3><div class="flexible-zone" data-drop-date="'+d+'" data-drop-time=""><small>HELDAG & FLEXIBELT</small>'+floating.map(x=>btn('data-edit="'+esc(x.id)+'"',esc(x.title),'flex-event')).join('')+btn('data-slot="'+d+'|" aria-label="Lägg till utan bestämd tid"','+','add-slot')+'</div><div class="calendar-track" style="height:'+((end-start)*60)+'px">'+
 Array.from({length:end-start},(_,h)=>{const time=M.clock((start+h)*60);return '<div class="calendar-hour" style="top:'+(h*60)+'px" data-drop-date="'+d+'" data-drop-time="'+time+'">'+btn('data-slot="'+d+'|'+time+'" aria-label="Lägg till '+d+' '+time+'"','<span>'+time+'</span><i>+</i>','calendar-slot')+'</div>';}).join('')+
 segments[i].map(x=>'<article class="calendar-event category-'+esc(x.row.category||'Aktivitet')+'" data-item="'+esc(x.row.id)+'" style="top:'+(x.start-start*60)+'px;height:'+(x.visualEnd-x.start-2)+'px;--lane:'+x.lane+';--lanes:'+x.lanes+'">'+btn('data-edit="'+esc(x.row.id)+'" aria-label="'+esc(x.row.title)+' '+esc(x.row.time)+'" title="'+esc(x.row.title)+' · '+esc(x.row.time)+'–'+esc(x.row.endTime)+'"','<strong>'+esc(x.row.title)+'</strong><small>'+(x.continuesBefore?'← ':esc(x.row.time)+'–')+(x.continuesAfter?' →':esc(x.row.endTime||M.clock(x.end)))+'</small>'+(x.end-x.start>=60?'<span>'+esc(locationOf(x.row)||x.row.category||'Aktivitet')+'</span>':''),'calendar-event-open')+btn('data-drag="'+esc(x.row.id)+'" aria-label="Flytta '+esc(x.row.title)+'"','⠿','handle')+'</article>').join('')+'</div></section>';
 }).join('')+'</div>'+(daysWide?'<p class="caption muted">Dra i handtaget för att flytta en aktivitet till en annan dag.</p>':dayGaps(rows,day));
}
function dayGaps(rows,date){if(rows.some(x=>x.timing==='allDay'&&x.date<=date&&(x.endDate||x.date)>=date))return '';const blocks=TravelLayout.segments(rows,date).sort((a,b)=>a.start-b.start);let end=8*60;const gaps=[];for(const x of blocks){if(x.start>end&&x.start-end>=45)gaps.push([end,x.start]);end=Math.max(end,x.end);}if(end<20*60)gaps.push([end,20*60]);return '<div class="day-gaps"><small>LEDIG TID · 08–20</small>'+gaps.filter(([a,b])=>a<20*60&&b>8*60).map(([a,b])=>btn('data-slot="'+date+'|'+M.clock(a)+'"',M.clock(a)+'–'+M.clock(Math.min(b,1200)),'text-button')).join('')+'</div>';}
function quickForm(type){const draft=read('travel-quick-'+tripId+'-'+type,{});return '<form id="quick-add" class="quick-add travel-task-quick" data-type="task"><input name="title" value="'+esc(draft.title||'')+'" required maxlength="500" autocomplete="off" placeholder="Lägg till uppgift…" aria-label="Ny uppgift">'+btn('data-quick-submit','+','primary')+'<details class="travel-task-quick-more"><summary>Ansvarig</summary><select name="owner" aria-label="Ansvarig">'+opts(members(),draft.owner||filters.taskOwner,'Familjen')+'</select></details></form>';}
function packingRow(x){
 const more=Number(x.quantity||1)!==1||x.unit&&x.unit!=='st' ? '<small class="packing-qty" data-pack-quantity="'+esc(x.id)+'" tabindex="0" title="Ändra antal">'+esc(x.quantity||1)+' '+esc(x.unit||'st')+'</small>' : '';
 return '<div class="check-row '+(x.done?'done':'')+'" data-item="'+esc(x.id)+'"><input type="checkbox" data-check="'+esc(x.id)+'" '+(x.done?'checked':'')+' aria-label="Packat '+esc(x.title)+'"><div class="info">'+(filters.packingGroup==='owner'?travelOwnerMark(x.owner||'Övrigt'):'')+'<span class="title pack-item-text" data-pack-title="'+esc(x.id)+'" tabindex="0" aria-label="Redigera '+esc(x.title)+'">'+esc(x.title)+'</span>'+more+'</div>'+btn('data-pack-delete="'+esc(x.id)+'" aria-label="Radera '+esc(x.title)+'"','✕','pack-delete')+btn('data-drag="'+esc(x.id)+'" aria-label="Dra '+esc(x.title)+'"','⠿','handle')+'</div>';
}
function packingHeadings(key){
 const defaults=key==='owner'?M.people:['Kläder','Hygien','Teknik','Friluftsliv','Övrigt'];
 const stored=key==='owner'?trip()?.packingPeople:trip()?.packingCategories;
 const fixed=stored?stored.split(',').map(x=>x.trim()).filter(Boolean):defaults;
 return [...new Set([...fixed,...list('packing').map(x=>x[key]||'Övrigt')])];
}
function inlinePackingForm(group,key){
 const draftKey='travel-pack-inline-'+tripId+'-'+key+'-'+group;
 return '<form class="packing-inline-add" data-pack-key="'+esc(key)+'" data-pack-group="'+esc(group)+'"><input name="title" type="text" value="'+esc(read(draftKey,''))+'" maxlength="500" autocomplete="off" placeholder="Lägg till sak…" aria-label="Lägg till packsak för '+esc(group)+'"><button type="submit" aria-label="Lägg till packsak för '+esc(group)+'">+</button></form>';
}
/* Keep the filter menu inside the visible viewport even on narrow iPhones.
   Details provides native toggle; pointerdown/Escape below supply outside dismissal. */
function positionPackingFilter(){
 const details=document.querySelector('.packing-filter[open]');
 if(!details)return;
 const panel=details.querySelector('.packing-filter-panel'),trigger=details.querySelector('summary');
 if(!panel||!trigger)return;
 const viewport=window.visualViewport;
 const viewportX=viewport?.offsetLeft||0,viewportY=viewport?.offsetTop||0;
 const viewportWidth=viewport?.width||window.innerWidth,viewportHeight=viewport?.height||window.innerHeight;
 const edge=12,gap=6;
 const width=Math.max(0,Math.min(310,viewportWidth-2*edge));
 const rect=trigger.getBoundingClientRect();
 const left=Math.max(viewportX+edge,Math.min(rect.right-width,viewportX+viewportWidth-edge-width));
 const below=Math.max(0,viewportY+viewportHeight-edge-rect.bottom-gap);
 const above=Math.max(0,rect.top-gap-viewportY-edge);
 const upwards=below<240&&above>below;
 const available=Math.min(480,upwards?above:below);
 panel.style.position='fixed';
 panel.style.left=left+'px';
 panel.style.right='auto';
 panel.style.width=width+'px';
 panel.style.maxHeight=available+'px';
 const panelHeight=Math.min(panel.scrollHeight,available);
 panel.style.top=(upwards?rect.top-gap-panelHeight:rect.bottom+gap)+'px';
 panel.style.bottom='auto';
}
function closePackingFilter(){
 const filter=document.querySelector('.packing-filter[open]');
 if(filter)filter.open=false;
}
function packingSummary(all){
 const done=all.filter(x=>x.done).length;
 return '<strong>'+done+' av '+all.length+' packade</strong>'+bar(done,all.length);
}
function packingCount(group,key=filters.packingGroup){const rows=list('packing').filter(x=>(x[key]||'Övrigt')===group);return rows.filter(x=>x.done).length+' / '+rows.length;}
function refreshPackingSummary(){
 for(const group of document.querySelectorAll('.packing-group')){const count=group.querySelector('.day-heading small');if(count)count.textContent=packingCount(group.dataset.dropGroup);}
 const summary=document.querySelector('.packing-summary');
 if(summary)summary.innerHTML=packingSummary(list('packing'));
}
function packing(){
 const all=list('packing'),rows=all.filter(x=>(!filters.packingOwner||(x.owner||'Övrigt')===filters.packingOwner)&&(filters.packingStatus==='all'||!!x.done===(filters.packingStatus==='done'))).sort((a,b)=>Number(a.order||0)-Number(b.order||0));
 const key=filters.packingGroup,groups=packingHeadings(key).filter(g=>!filters.packingOwner||key!=='owner'||g===filters.packingOwner);
 return '<div class="packing-summary">'+packingSummary(all)+'</div>'+
 '<div class="packing-tools">'+
 '<details class="packing-filter"><summary><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;width:17px;height:17px;vertical-align:-3px"><path d="M4 7h16M7 12h10M10 17h4"/></svg> Filter'+(filters.packingStatus!=='all'||filters.packingGroup!=='owner'?' · Aktivt':'')+'</summary><div class="packing-filter-panel">'+
 '<label>Gruppera<select data-filter="packingGroup">'+opts([['owner','Person'],['category','Kategori']],filters.packingGroup)+'</select></label>'+
 '<label>Visa<select data-filter="packingStatus">'+opts([['all','Alla'],['todo','Kvar att packa'],['done','Packat']],filters.packingStatus)+'</select></label>'+
 '<span class="packing-filter-caption">Hoppa till rubrik</span><div class="packing-jumps">'+groups.map(g=>btn('data-pack-jump="'+esc(g)+'"',esc(g))).join('')+'</div>'+
 '<div class="packing-filter-footer">'+btn('data-action="templates"','Packmallar')+'</div></div></details>'+
 btn('data-action="pack-new-heading" aria-expanded="'+addingPackingHeading+'"','+ Rubrik','pack-heading-button')+
 '</div>'+
 (addingPackingHeading?'<form id="packing-new-heading" class="packing-new-heading"><input name="title" maxlength="60" required autocomplete="off" placeholder="Rubrikens namn…" aria-label="Ny rubrik"><button class="primary" type="submit" aria-label="Spara rubrik">✓</button>'+btn('data-action="pack-cancel-heading"','Avbryt','pack-cancel-heading')+'</form>':'')+
 '<div class="packing-groups">'+groups.map(g=>{const items=rows.filter(x=>(x[key]||'Övrigt')===g);return '<section class="packing-group" data-drop-group="'+esc(g)+'"><div class="day-heading"><span class="pack-group-name" data-pack-heading="'+esc(g)+'" tabindex="0" aria-label="Redigera rubrik '+esc(g)+'">'+esc(g)+'</span> <small>'+packingCount(g,key)+'</small></div>'+items.map(packingRow).join('')+inlinePackingForm(g,key)+'</section>';}).join('')+'</div>';
}

/* Match the shopping list's in-place editor: tap text, Enter advances, blur saves, Escape cancels. */
function packingFocusEnd(el){
 try{el.focus({preventScroll:true});}catch(_){el.focus();}
 if(el.isContentEditable){const sel=window.getSelection(),range=document.createRange();range.selectNodeContents(el);range.collapse(false);sel.removeAllRanges();sel.addRange(range);}
}
function packingRenderFingerprint(){
 lastRenderKey=renderFingerprint();
 renderPending=false;
}
function startPackingEdit(el,type){
 if(!el||tab!=='packing'||el.isContentEditable)return;
 if(packingActiveEdit)finishPackingEdit(packingActiveEdit.el,false);
 const id=type==='item'?el.dataset.packTitle:el.dataset.packHeading;
 if(type==='item'&&!S.get(id))return;
 packingActiveEdit={el,type,id,original:el.textContent||'',tripId};
 el.contentEditable='true';el.spellcheck=true;el.classList.add('pack-editing');el.removeAttribute('tabindex');
 packingFocusEnd(el);
}
function packingFocusNext(edit){
 if(edit.type==='heading'){
  edit.el.closest('.packing-group')?.querySelector('.packing-inline-add input')?.focus({preventScroll:true});
 }else{
  const row=edit.el.closest('.check-row'),form=row?.closest('.packing-group')?.querySelector('.packing-inline-add');
  if(row&&form){row.after(form);form.elements.title.focus({preventScroll:true});}
 }
}
async function finishPackingEdit(el,openNext=false,cancel=false){
 const edit=packingActiveEdit;
 if(!edit||edit.el!==el)return;
 packingActiveEdit=null;
 const value=cancel?edit.original:String(el.textContent||'').replace(/\u00a0/g,' ').trim();
 el.removeAttribute('contenteditable');el.classList.remove('pack-editing');el.setAttribute('tabindex','0');
 if(cancel||value===edit.original){el.textContent=edit.original;if(openNext)packingFocusNext(edit);return;}
 if(!value){
  el.textContent=edit.original;
  if(edit.type==='item')await removePackingItem(edit.id);
  else toast('Rubriken får inte vara tom.');
  return;
 }
 if(edit.type==='heading'){
  if(value.length>60||value.includes(',')){el.textContent=edit.original;toast('Rubriken får vara högst 60 tecken och inte innehålla kommatecken.');return;}
  if(packingHeadings(filters.packingGroup).some(x=>x!==edit.original&&x.toLocaleLowerCase('sv-SE')===value.toLocaleLowerCase('sv-SE'))){el.textContent=edit.original;toast('Rubriken finns redan.');return;}
 }
 el.textContent=value;
 const task=edit.type==='item'?S.patch(edit.id,{title:value}):renamePackingHeading(edit.original,value,filters.packingGroup);
 if(openNext)packingFocusNext(edit);
 try{
  await task;
  packingRenderFingerprint();
 }catch(error){el.textContent=edit.original;toast(error.message||'Kunde inte spara ändringen.');render(true);}
}
async function renamePackingHeading(before,after,key){
 const field=key==='owner'?'packingPeople':'packingCategories';
 const headings=packingHeadings(key).map(n=>n===before?after:n);
 const changes=[{id:tripId,changes:{[field]:headings.join(', ')}}];
 for(const x of list('packing'))if((x[key]||'Övrigt')===before)changes.push({id:x.id,changes:{[key]:after}});
 await S.batch(changes);
 const section=[...document.querySelectorAll('.packing-group')].find(x=>x.dataset.dropGroup===before);
 if(section){
  section.dataset.dropGroup=after;
  const heading=section.querySelector('.pack-group-name');
  if(heading){heading.dataset.packHeading=after;heading.setAttribute('aria-label','Redigera rubrik '+after);}
  const jump=[...document.querySelectorAll('.packing-jumps [data-pack-jump]')].find(button=>button.dataset.packJump===before);
  if(jump){jump.dataset.packJump=after;jump.textContent=after;}
  const form=section.querySelector('.packing-inline-add');
  if(form){
   const prev='travel-pack-inline-'+tripId+'-'+key+'-'+before,next='travel-pack-inline-'+tripId+'-'+key+'-'+after;
   const draft=read(prev,'');if(draft)remember(next,draft);localStorage.removeItem(prev);
   form.dataset.packGroup=after;form.elements.title.setAttribute('aria-label','Lägg till packsak för '+after);
  }
 }
 packingRenderFingerprint();
}
async function removePackingItem(id){
 const item=S.get(id);if(!item||item.type!=='packing'||item.deleted)return;
 if(packingActiveEdit)finishPackingEdit(packingActiveEdit.el,false);
 try{
  await S.remove(id);
  document.querySelectorAll('.packing-group [data-item]').forEach(row=>{if(row.dataset.item!==id)return;
   const group=row.closest('.packing-group');row.remove();

  });
  refreshPackingSummary();packingRenderFingerprint();
  toast('Borttagen.',async()=>{await S.restore(id);render(true);});
 }catch(error){toast(error.message||'Kunde inte ta bort saken.');}
}

/* Owner colors align with Home and shopping task glow dots. */
const travelMemberColor=name=>({markus:'#38BDF8',maja:'#F9A8B8',mila:'#F472B6',melker:'#86EFAC',familjen:'#FBBF24',family:'#FBBF24'})[String(name||'').trim().toLocaleLowerCase('sv-SE')]||'#FDBA74';
const travelOwnerMark=name=>'<span class="travel-owner-dot" style="--travel-owner-color:'+travelMemberColor(name)+'" aria-hidden="true"></span>';
const taskOwnerChoices=()=>[...new Set(['Familjen',...members(),...list('task').map(x=>x.owner).filter(Boolean)])];
function taskRow(x){
 const id=esc(x.id),title=esc(x.title),owner=esc(x.owner||'Familjen');
 return '<div class="check-row travel-task-row '+(x.done?'done':'')+'" data-item="'+id+'">'+
 '<input type="checkbox" data-check="'+id+'" '+(x.done?'checked':'')+' aria-label="Klarmarkera '+title+'">'+
 '<div class="info"><span class="title travel-inline-title" data-travel-title="'+id+'" tabindex="0" role="button" aria-label="Redigera '+title+'">'+title+'</span>'+
 '<div class="travel-task-meta"><button type="button" class="travel-task-owner" data-task-owner="'+id+'" aria-label="Ändra ansvarig för '+title+'">'+travelOwnerMark(x.owner||'Familjen')+'<span>'+owner+'</span></button>'+
 '<button type="button" class="travel-task-date" data-task-date="'+id+'" aria-label="Ändra förfallodatum">'+esc(x.date?x.date.slice(8,10)+'/'+x.date.slice(5,7):'Datum')+'</button>'+
 (!x.done&&x.date&&x.date<currentDay()?'<small class="warning">Försenad</small>':'')+(x.priority&&x.priority!=='normal'?'<small class="travel-task-priority">'+(x.priority==='urgent'?'Brådskande':'Viktig')+'</small>':'')+
 '</div>'+linked(x,'bookingId')+'</div>'+
 '<button type="button" data-edit="'+id+'" class="travel-task-more" aria-label="Fler inställningar för '+title+'">···</button></div>';
}
function preparations(){const packs=list('packing'),todos=list('task'),people=[...new Set(packs.map(x=>x.owner||'Övrigt'))];return '<div class="preparation-summary"><strong>'+todos.filter(x=>!x.done).length+' förberedelser kvar</strong><span>'+packs.filter(x=>!x.done).length+' saker att packa</span></div><div class="view-switch" role="group" aria-label="Förberedelser">'+btn('data-tab="task" aria-pressed="'+(tab==='task')+'"','Förbereda',tab==='task'?'active':'')+btn('data-tab="packing" aria-pressed="'+(tab==='packing')+'"','Packa',tab==='packing'?'active':'')+'</div>'+(tab==='packing'?'<div class="packing-person-strip">'+btn('data-pack-person="" aria-pressed="'+!filters.packingOwner+'"','Alla',!filters.packingOwner?'active':'')+people.map(name=>{const items=packs.filter(x=>(x.owner||'Övrigt')===name),done=items.filter(x=>x.done).length;return btn('data-pack-person="'+esc(name)+'" aria-pressed="'+(filters.packingOwner===name)+'"',travelOwnerMark(name)+esc(name)+' <small>'+done+'/'+items.length+'</small>',filters.packingOwner===name?'active':'');}).join('')+'</div>'+btn('data-missing aria-pressed="'+(filters.packingStatus==='todo')+'"','Visa bara det som saknas',filters.packingStatus==='todo'?'missing-toggle active':'missing-toggle')+packing():tasks());}
function tasks(){
 const rows=list('task').filter(x=>(!filters.taskOwner||(x.owner||'Familjen')===filters.taskOwner)&&(filters.taskStatus==='all'||!!x.done===(filters.taskStatus==='done'))),departure=(trip().departure||'').slice(0,10);
 const group=x=>TravelLayout.taskGroup(x,departure,currentDay(),trip().endDate);
 return quickForm('task')+'<details class="travel-task-filters"><summary>Filter'+(filters.taskOwner||filters.taskStatus!=='all'?' · Aktivt':'')+'</summary><div class="filters">'+selectFilter('taskOwner','Ansvarig',taskOwnerChoices(),'Alla')+selectFilter('taskStatus','Visa',[['all','Alla'],['todo','Kvar'],['done','Klart']])+'</div></details>'+['Behöver sorteras','Försenat','Den här veckan','Före avresan','Dagen före','Avresedagen','Under resan','Efter resan','Klart'].map(g=>{const items=rows.filter(x=>group(x)===g).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));if(!items.length)return '';return '<section class="preparation-stage"><div class="day-heading">'+g+' <small>'+items.length+'</small></div>'+items.map(x=>taskRow(x)+(g==='Behöver sorteras'?'<div class="inline-actions">'+btn('data-classify="'+x.id+'|packing"','Till packlistan')+btn('data-classify="'+x.id+'|task"','Behåll som uppgift')+'</div>':'')).join('')+'</section>';}).join('')+(!rows.length?empty('Inga uppgifter här ännu. Lägg till den första ovan.'):'');
}
function expenses(){const rows=list('expense'),plans=list('categoryBudget'),sum=M.budget(rows,plans),balance=M.settlement(rows);const cats=[...new Set([...M.categories,...Object.keys(sum.groups)])];return '<div class="segmented">'+[['plan','Planera'],['actual','Under resan'],['split','Göra upp']].map(([key,label])=>btn('data-budget="'+key+'"',label,filters.budget===key?'active':'')).join('')+'</div><div class="grid budget-summary"><article class="card metric"><small>TOTAL BUDGET</small><strong>'+money(trip().budget)+'</strong>'+btn('data-inline-trip-budget','Ändra belopp','text-button')+'</article><article class="card metric"><small>BETALAT</small><strong>'+money(sum.actual)+'</strong></article><article class="card metric"><small>KVAR</small><strong class="'+(sum.actual>Number(trip().budget)?'warning':'')+'">'+money(Number(trip().budget||0)-sum.actual)+'</strong></article></div>'+(filters.budget==='plan'?'<div class="section-subhead"><p>Fördelat: '+money(sum.planned)+'</p>'+btn('data-new="categoryBudget"','+ Egen kategori')+'</div><div class="budget-categories">'+cats.map(c=>{const p=plans.find(x=>x.title===c),s=sum.groups[c]||{planned:0,actual:0};return '<article class="budget-category"><div><h3>'+esc(c)+'</h3><div class="budget-category-figures"><span><small>Betalat</small>'+money(s.actual)+'</span><span class="'+(s.actual>s.planned?'warning':'')+'"><small>Kvar</small>'+money(s.planned-s.actual)+'</span></div>'+bar(s.actual,s.planned)+'</div><div class="travel-budget-target"><small>Budgeterat</small>'+btn('data-inline-budget-category="'+esc(c)+'" aria-label="Ändra budgeterat belopp för '+esc(c)+'"'+(p?' data-category-id="'+p.id+'"':''),money(s.planned)+' <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;width:14px;height:14px;vertical-align:-2px;margin-left:3px"><path d="m4 20 4-.8 11-11a2 2 0 0 0-3-3l-11 11L4 20ZM14 7l3 3"/></svg>')+'</div></article>';}).join('')+'</div><div class="day-heading">Planerade kostnader</div>'+rows.filter(x=>x.planned!=null&&Number(x.planned)>0).map(expenseRow).join('')+bookedCosts():filters.budget==='actual'?cashToday(rows)+expenseQuick()+'<p class="muted caption">Negativt belopp registrerar en återbetalning. Valutakursen sparas med varje betalning.</p><div class="expense-list">'+(rows.filter(x=>x.actual!=null).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(expenseRow).join('')||empty('Inga betalningar registrerade ännu.'))+'</div>':settlementView(rows,balance));}

function bookedCosts(){const rows=list('booking').filter(x=>x.status!=='Avbokat'&&Number(x.total)>0);return rows.length?'<section class="booked-costs"><div class="day-heading">Bokade kostnader</div>'+rows.map(x=>'<article class="expense-row"><div><h3>'+esc(x.title)+'</h3><small>'+esc(bookingPayment(x))+'</small></div>'+btn('data-edit="'+esc(x.id)+'"',money(x.total))+'</article>').join('')+'<p class="caption muted">Bokningsbelopp visas som referens. Reskassan räknar de registrerade kostnaderna.</p></section>':'';}
function cashToday(rows){const today=rows.filter(x=>x.date===currentDay()&&x.actual!=null),spent=today.reduce((n,x)=>n+M.amount(x),0);return '<div class="cash-today"><div><small>IDAG · '+esc(dateLabel(currentDay(),{day:'numeric',month:'short'}))+'</small><strong>'+money(spent)+'</strong></div><span>'+today.length+' betalningar</span></div>';}
function settlementView(rows,balance=M.settlement(rows)){
 const transfers=TravelLayout.transfers(balance.balances),missing=rows.filter(x=>x.actual!=null&&(!x.payer||!x.splits?.length));
 return '<div class="settlement-intro"><span class="eyebrow">SÅ FÖRDELAS UTGIFTERNA</span><h3>'+(transfers.length?'Vem betalar vem?':'Jämnt fördelat')+'</h3><p class="caption muted">Beräknat från registrerade betalningar och andelar.</p></div><div class="settlement-transfers">'+transfers.map(x=>'<article class="settlement-transfer"><div>'+travelOwnerMark(x.from)+'<strong>'+esc(x.from)+'</strong><span>→</span>'+travelOwnerMark(x.to)+'<strong>'+esc(x.to)+'</strong></div><b>'+money(x.amount)+'</b></article>').join('')+'</div><details class="settlement-details"><summary>Se vad var och en lagt ut</summary><div class="split-list">'+Object.entries(balance.balances).map(([n,b])=>'<article class="budget-category"><div><h3>'+travelOwnerMark(n)+' '+esc(n)+'</h3><small>Betalat '+money(balance.paid[n]||0)+'</small></div><strong>'+money(b)+'</strong></article>').join('')+'</div></details>'+(missing.length?'<section class="unallocated-expenses"><div class="day-heading">Behöver fördelas · '+missing.length+'</div>'+missing.map(expenseRow).join('')+'</section>':'');
}
function expenseRow(x){return '<article class="expense-row" data-item="'+esc(x.id)+'"><div><h3 class="travel-inline-title" data-travel-title="'+esc(x.id)+'" tabindex="0" role="button" aria-label="Redigera '+esc(x.title)+'">'+esc(x.title)+'</h3><small>'+esc([x.category,x.date,x.payer].filter(Boolean).join(' · '))+'</small><p>'+ (x.actual==null?'Ännu inte betalt':btn('data-inline-actual="'+esc(x.id)+'" aria-label="Ändra betalat belopp"',money(x.actual,x.currency),'inline-amount'))+(x.currency!==trip().currency&&x.actual!=null?' → '+money(M.amount(x))+' · kurs '+esc(x.rate):'')+'</p>'+linked(x,'bookingId')+linked(x,'receiptId')+'</div><div class="row-actions">'+(x.planned!=null?btn('data-inline-planned="'+esc(x.id)+'"',money(x.planned,x.currency),'inline-amount'):'')+btn('data-edit="'+x.id+'"','Mer','subtle-action')+(x.actual==null?btn('data-pay="'+x.id+'"','Registrera betalning'):'')+'</div></article>';}
function bookingPayment(x){const rows=list('expense').filter(e=>e.bookingId===x.id),actual=rows.reduce((s,e)=>s+M.amount(e),0);return rows.some(e=>e.actual!=null)?(Number(x.total)>0&&actual>=Number(x.total)?'Betalt':actual>0?'Delbetalt':'Obetalt'):x.paymentStatus||'Obetalt';}
function bookingCard(x){
 const docs=list('document').filter(d=>d.bookingId===x.id),cost=list('expense').filter(e=>e.bookingId===x.id).reduce((n,e)=>n+M.amount(e),0);
 const id=esc(x.id),name=esc(x.title),lodging=x.category==='Boende',car=x.category==='Hyrbil',transport=['Flyg','Tåg','Färja'].includes(x.category);
 const nights=lodging&&x.date&&x.endDate?M.dayDiff(x.date,x.endDate):0;
 const dateEntry=(label,dateKey,timeKey,date,time)=>'<div class="booking-inline-slot"><small>'+label+'</small><div class="booking-inline-datetime">'+
  '<button type="button" data-inline-booking="'+id+'" data-inline-key="'+dateKey+'" aria-label="Ändra '+label.toLowerCase()+' datum">'+(date?esc(date.slice(8,10)+'/'+date.slice(5,7)):'Datum')+'</button>'+
  '<button type="button" data-inline-booking="'+id+'" data-inline-key="'+timeKey+'" aria-label="Ändra '+label.toLowerCase()+' tid">'+esc(time||'Tid')+'</button></div></div>';
 return '<article class="booking-card card travel-booking-compact '+(lodging?'booking-stay':transport?'booking-ticket':car?'booking-car':'booking-experience')+'" data-item="'+id+'"><div class="booking-top"><span class="eyebrow">'+esc(x.category||'Bokning')+(nights>0?' · '+nights+' nätter':'')+'</span>'+
 '<button type="button" class="booking-status-chip" data-inline-booking="'+id+'" data-inline-key="status" aria-label="Ändra bokningsstatus">'+esc(x.status||'Att boka')+'</button></div>'+
 '<h3 class="travel-inline-title" data-travel-title="'+id+'" tabindex="0" role="button" aria-label="Redigera '+name+'">'+name+'</h3>'+
 '<div class="booking-inline-dates">'+dateEntry(lodging?'Incheckning':car?'Hämtning':transport?'Avgång':'Start','date','time',x.date,x.time)+
 '<span class="booking-date-arrow" aria-hidden="true">→</span>'+
 dateEntry(lodging?'Utcheckning':car?'Återlämning':transport?'Ankomst':'Slut','endDate','endTime',x.endDate,x.endTime)+'</div>'+
 '<p class="booking-route">'+esc(x.location||'')+(x.arrivalLocation?' <span>→</span> '+esc(x.arrivalLocation):'')+'</p>'+(x.contact?'<p class="booking-contact">'+esc(x.contact)+'</p>':'')+
 '<p class="muted booking-inline-payment">'+esc(bookingPayment(x))+' · '+money(cost)+' registrerat</p>'+
 (x.reference?btn('data-copy="'+esc(x.reference)+'"','Bokningsnr '+esc(x.reference),'reference'):'')+
 '<div class="inline-actions booking-inline-actions">'+link(x.url)+(x.location?link(maps(x.location),'Navigera'):'')+
 btn('data-edit="'+id+'"','Mer','subtle-action')+
 '<details class="travel-more-actions"><summary>Fler åtgärder</summary><div class="inline-actions">'+
 btn('data-schedule="'+id+'"','Lägg i schemat')+btn('data-booking-expense="'+id+'"','Betalning')+btn('data-booking-doc="'+id+'"','Bifoga dokument')+
 '</div></details></div>'+(docs.length?'<div class="booking-documents">'+docs.map(documentRow).join(''):'')+'</article>';
}
function wallet(){
 const rows=list('booking').sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'').localeCompare(b.time||'')),backlog=rows.filter(x=>!x.status||x.status==='Att boka'),booked=rows.filter(x=>x.status&&x.status!=='Att boka'&&x.status!=='Avbokat'),cancelled=rows.filter(x=>x.status==='Avbokat');
 const during=M.tripState(trip())==='Pågående',now=currentDay(),clock=M.timeIn(trip().timezone),next=during?booked.find(x=>(x.endDate||x.date)>now||((x.endDate||x.date)===now&&(x.endTime||'23:59')>=clock)):null;
 const unlinked=list('document').filter(x=>!rows.some(b=>b.id===x.bookingId)).sort((a,b)=>Number(!!b.important)-Number(!!a.important));
 const section=(title,items,cls='')=>items.length?'<section class="wallet-section '+cls+'"><div class="day-heading">'+title+' <small>'+items.length+'</small></div><div class="booking-grid">'+items.map(bookingCard).join('')+'</div></section>':'';
 return '<div class="wallet-toolbar">'+btn('data-new="document"','+ Dokumentlänk','text-button')+'</div>'+uploadControl('document')+
 (next?'<section class="wallet-next"><span class="eyebrow">NÄRA TILL HANDS</span>'+bookingCard(next)+'</section>':'')+section('Bokat längs vägen',booked.filter(x=>x!==next),'wallet-route')+section('Återstår att boka',backlog,'wallet-backlog')+section('Avbokade',cancelled,'wallet-cancelled')+
 '<section class="wallet-loose"><div class="day-heading">Fristående dokument <small>'+unlinked.length+'</small></div>'+unlinked.map(documentRow).join('')+(!unlinked.length?'<p class="caption muted">Biljetter och bekräftelser visas direkt vid sin bokning.</p>':'')+'</section>'+(!rows.length?empty('Lägg till boende och transporter för att bygga reseplånboken.'):'');
}
function places(){const rows=list('place').filter(x=>(!filters.placeCategory||x.category===filters.placeCategory)&&(!filters.placeStatus||!!x.visited===(filters.placeStatus==='visited'))&&(!filters.placeDay||list('activity').some(a=>a.placeId===x.id&&a.date===filters.placeDay)));mapRows=rows;const stops=list('activity').filter(x=>x.date===(filters.placeDay||currentDay())&&locationOf(x)).sort(M.activitySort);return '<details class="travel-quiet-filter"><summary>Filter'+(filters.placeCategory||filters.placeStatus||filters.placeDay?' · Aktivt':'')+'</summary><div class="filters">'+selectFilter('placeCategory','Kategori',['Sevärdhet','Restaurang','Boende','Vandring','Parkering','Annat'],'Alla')+selectFilter('placeStatus','Status',[['wanted','Vill besöka'],['visited','Besökt']],'Alla')+selectFilter('placeDay','Dag',availableDays(),'Alla dagar')+'</div></details><div class="places-layout"><section class="map-panel"><div id="map" class="map-frame"><p class="muted">Laddar kartan…</p></div><p id="map-status" class="caption muted">Platser med koordinater visas som markörer. Öppna en plats och välj position på kartan om den saknas.</p></section><section class="places-list">'+(stops.length?'<div class="day-heading">Stopp i ordning · '+esc(filters.placeDay||currentDay())+'</div><ol class="route-list">'+stops.map(x=>'<li>'+esc(x.time||'')+' '+esc(x.title)+' '+link(maps(locationOf(x)),'Vägbeskrivning')+'</li>').join('')+'</ol>':'')+'<div class="grid">'+rows.map(x=>'<article class="card place-card" data-item="'+x.id+'" id="place-'+x.id+'"><small>'+esc(x.category||'')+'</small><h3 class="travel-inline-title" data-travel-title="'+esc(x.id)+'" tabindex="0" role="button" aria-label="Redigera '+esc(x.title)+'">'+esc(x.title)+'</h3><p>'+esc(x.location||'')+'</p><p>'+esc(x.notes||'')+'</p><div class="inline-actions">'+actions(x)+btn('data-visited="'+x.id+'"',x.visited?'✓ Besökt':'Markera besökt')+btn('data-schedule="'+x.id+'"','Lägg i schemat')+btn('data-map-focus="'+x.id+'"','Visa på karta')+'</div></article>').join('')+'</div>'+(rows.length?'':empty('Spara en plats ni vill besöka.'))+'</section></div>';}
let leafletReady;
async function leaflet(){if(window.L)return window.L;if(!leafletReady)leafletReady=new Promise((resolve,reject)=>{const css=document.createElement('link');css.rel='stylesheet';css.href='vendor/leaflet/leaflet.css';document.head.append(css);const script=document.createElement('script');script.src='vendor/leaflet/leaflet.js';script.onload=()=>resolve(window.L);script.onerror=()=>{leafletReady=null;reject(Error('Kartan kunde inte laddas. Dina sparade platser finns kvar.'));};document.head.append(script);});return leafletReady;}
async function loadMap(){const host=$('map');try{const L=await leaflet();if(!host?.isConnected)return;host.innerHTML='';map=L.map(host,{scrollWheelZoom:false}).setView([58.5,15.3],5);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);const points=[];mapRows.forEach(x=>{if(x.lat==null||x.lat===''||x.lng==null||x.lng==='')return;const pt=[Number(x.lat),Number(x.lng)];points.push(pt);const marker=L.circleMarker(pt,{radius:9,color:x.visited?'#86efac':'#fdba74',fillOpacity:.85}).addTo(map);marker.on('click',()=>selectPlace(x.id,true));mapMarkers.set(x.id,marker);});if(points.length)map.fitBounds(points,{padding:[35,35],maxZoom:14});if(selectedPlace)selectPlace(selectedPlace);}catch(e){if(host?.isConnected)host.innerHTML='<p>'+esc(e.message)+'</p>';}}
function photoRows(){return list('photo').filter(x=>!filters.photoDay||x.date===filters.photoDay).sort((a,b)=>Number(a.order??a.createdAt??0)-Number(b.order??b.createdAt??0));}
function uploadControl(type){return '<label class="direct-upload"><span>＋ '+(type==='photo'?'Ladda upp bilder':'Lägg till PDF eller bilder')+'</span><input type="file" data-direct-upload="'+type+'" accept="'+(type==='photo'?'image/*':'application/pdf,image/*')+'" multiple><small>Välj filer direkt från din enhet</small></label><p id="upload-status" role="status"></p>';}
function photoFigure(x){return '<figure data-item="'+x.id+'"><button class="gallery-open" data-photo="'+x.id+'" aria-label="Visa '+esc(x.title)+'"><img '+(x.fileId?'data-file="'+x.fileId+'"':'src="'+esc(S.safeURL(x.url))+'"')+' alt="'+esc(x.title)+'" loading="lazy"></button><figcaption><span class="travel-inline-title" data-travel-title="'+esc(x.id)+'" tabindex="0" role="button" aria-label="Redigera bildtext">'+esc(x.title)+'</span>'+btn('data-drag="'+x.id+'" aria-label="Dra bild"','⠿','handle')+'<details class="photo-tools"><summary aria-label="Bildalternativ">···</summary><div>'+btn('data-edit="'+x.id+'"','Bilddetaljer')+btn('data-cover="'+x.id+'"','Använd som omslag')+btn('data-remove="'+x.id+'"','Ta bort')+'</div></details></figcaption></figure>';}
function documentRow(x){return '<article class="document-row" data-item="'+esc(x.id)+'"><span class="file-icon">'+(x.fileName?.toLowerCase().endsWith('.pdf')?'PDF':'FIL')+'</span><div><h3 class="travel-inline-title" data-travel-title="'+esc(x.id)+'" tabindex="0" role="button" aria-label="Redigera '+esc(x.title)+'">'+(x.important?'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;width:14px;height:14px;vertical-align:-2px;margin-right:4px"><path d="m12 2.5 2.9 6.2 6.8 1-4.9 4.8 1.1 6.8-5.9-3.2-6 3.2 1.2-6.8L2.3 9.7l6.8-1z"/></svg>':'')+esc(x.title)+'</h3><small>'+esc(x.category||'Övrigt')+'</small><label class="document-booking">Bokning<select data-document-booking="'+esc(x.id)+'">'+opts(references('booking'),x.bookingId,'Ingen koppling')+'</select></label><small data-file-status="'+x.id+'">'+(x.fileId?'Kontrollerar lokal kopia…':'Extern länk · kräver anslutning')+'</small></div><div class="row-actions">'+btn('data-preview="'+x.id+'"','Visa')+'<details class="travel-more-actions"><summary>Mer</summary><div class="inline-actions">'+(x.fileId?btn('data-download="'+x.id+'"','Ladda ned'):'')+btn('data-edit="'+x.id+'"','Redigera detaljer')+'</div></details>'+'</div></article>';}
function noteText(text,id=''){return String(text||'').split('\n').map((line,index)=>id&&/^- \[[ xX]\] /.test(line)?'<label class="note-check"><input type="checkbox" data-note-check="'+esc(id)+'" data-line="'+index+'" '+(/^\- \[[xX]\]/.test(line)?'checked':'')+'><span>'+esc(line.slice(6))+'</span></label>':line.startsWith('# ')?'<h3>'+esc(line.slice(2))+'</h3>':line.startsWith('- ')?'<p class="note-bullet">• '+esc(line.slice(2))+'</p>':'<p>'+esc(line)+'</p>').join('');}
function noteCard(x){return '<article class="card note-card" data-item="'+esc(x.id)+'"><div class="booking-top"><small>'+esc(x.date||'')+'</small>'+btn('data-pin="'+x.id+'"',x.pinned?'Lossa':'Fäst')+'</div><h3 class="travel-inline-title" data-travel-title="'+esc(x.id)+'" tabindex="0" role="button" aria-label="Redigera '+esc(x.title)+'">'+esc(x.title)+'</h3><div class="note-content travel-note-inline" data-travel-notes="'+esc(x.id)+'" role="button" tabindex="0" aria-label="Redigera anteckningstext">'+noteText(x.notes,x.id)+'</div>'+linked(x,'placeId')+'<div class="inline-actions">'+actions(x)+btn('data-note-activity="'+x.id+'"','Skapa aktivitet')+btn('data-note-task="'+x.id+'"','Skapa uppgift')+'</div></article>';}
function journal(){
 const photos=photoRows(),notes=list('note').sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||Number(b.updatedAt)-Number(a.updatedAt)),ideas=notes.filter(x=>!x.date),dates=[...new Set([...photos,...notes].map(x=>x.date).filter(Boolean))].sort();
 const placesFor=d=>[...new Map([...dayActivities(d).map(x=>S.get(x.placeId)),...photos.filter(x=>x.date===d).map(x=>S.get(x.placeId)),...notes.filter(x=>x.date===d).map(x=>S.get(x.placeId))].filter(x=>x&&!x.deleted).map(x=>[x.id,x])).values()];
 return '<div class="journal-toolbar">'+btn('data-new="photo"','+ Bildlänk','text-button')+btn('data-idea','+ Spara en idé','text-button')+'</div>'+uploadControl('photo')+
 (ideas.length?'<details class="journal-ideas"><summary>Idéer att ta med · '+ideas.length+'</summary><div class="notes-grid">'+ideas.map(noteCard).join('')+'</div></details>':'')+
 '<div class="journal-days">'+dates.map(d=>{const pics=photos.filter(x=>x.date===d),entries=notes.filter(x=>x.date===d);return '<section class="journal-day" data-journal-date="'+esc(d)+'"><header><div><small>'+esc(dateLabel(d,{weekday:'long'}))+'</small><h3>'+esc(dateLabel(d,{day:'numeric',month:'long'}))+'</h3></div>'+btn('data-journal-day="'+esc(d)+'"','+ Minne','text-button')+'</header><div class="journal-places">'+placesFor(d).map(x=>btn('data-journal-place="'+esc(x.id)+'"','⌖ '+esc(x.title),'text-button')).join('')+'</div>'+(pics.length?'<div class="gallery journal-collage count-'+pics.length+'">'+pics.map(photoFigure).join('')+'</div>':'')+'<div class="journal-writing">'+entries.map(noteCard).join('')+'</div></section>';}).join('')+'</div>'+
 (photos.some(x=>!x.date)?'<section class="album-section"><div class="day-heading">Bilder utan datum</div><div class="gallery">'+photos.filter(x=>!x.date).map(photoFigure).join('')+'</div></section>':'')+(!photos.length&&!notes.length?empty('Spara första minnet. Bilder och anteckningar samlas per dag.'):'');
}
async function hydrateImages(){for(const img of document.querySelectorAll('img[data-file]'))try{const data=await S.file(img.dataset.file);if(img.isConnected)img.src=data;}catch(_){img.alt='Bilden behöver hämtas när du är ansluten';}}
async function checkFiles(){for(const el of document.querySelectorAll('[data-file-status]')){const x=S.get(el.dataset.fileStatus);if(!x?.fileId)continue;const cached=await S.cachedFile(x.fileId);if(el.isConnected)el.innerHTML=cached?'✓ Tillgänglig offline':'Kräver hämtning '+btn('data-offline="'+x.id+'"','Spara offline');}}
const currencies=['SEK','EUR','NOK','DKK','USD','GBP'];
const field=(key,label,kind='text',extra={})=>({key,label,kind,...extra});
const references=(type)=>list(type).map(x=>[x.id,x.title]);
function fieldsFor(type,v={}){const title=field('title',type==='packing'?'Vad ska packas?':'Namn','text',{required:true,wide:true});const date=field('date','Datum','date'),notesField=field('notes',type==='note'?'Text · # rubrik och - lista stöds':'Anteckningar','textarea',{wide:true});const url=field('url','Länk','url',{wide:true});const place=field('placeId','Sparad plats','select',{options:references('place'),empty:'Ingen koppling'}),booking=field('bookingId','Bokning','select',{options:references('booking'),empty:'Ingen koppling'});const owner=field('owner','Ansvarig / person','text',{suggest:members()});
 if(type==='trip')return [title,field('destination','Resmål'),field('departure','Avresa · lokal tid i vald tidszon','datetime-local',{required:true}),field('endDate','Hemresa','date'),field('timezone','Tidszon','text',{required:true,suggest:['Europe/Stockholm','Europe/Oslo','Europe/Copenhagen','Europe/London','Europe/Lisbon','America/New_York','Asia/Tokyo']}),field('travelers','Resenärer · separera med kommatecken','text',{wide:true}),field('packingPeople','Personer / grupper i packlistan · kommaseparerade','text',{wide:true}),field('currency','Basvaluta','select',{options:currencies}),field('budget','Totalbudget','number',{min:0}),field('upload','Omslagsbild','file',{accept:'image/*',wide:true}),notesField];
 if(type==='activity')return [title,date,field('timing','Tidssättning','select',{options:[['timed','Bestämd tid'],['allDay','Heldag'],['flex','Utan bestämd tid']]}),...(v.timing==='timed'?[field('time','Starttid','time',{required:true}),field('endTime','Sluttid','time'),field('endDate','Slutdatum · om annat än start','date')]:[]),field('category','Typ','select',{options:['Aktivitet','Transport','Mat','Boende','Vila']}),place,booking,field('location','Plats / adress'),url,notesField];
 if(type==='packing')return [title,field('quantity','Antal','number',{min:0.1,required:true}),field('unit','Enhet','text',{suggest:['st','par','set','förpackningar']}),owner,field('category','Kategori','text',{suggest:['Kläder','Hygien','Teknik','Friluftsliv','Övrigt']}),notesField];
 if(type==='task')return [title,owner,field('date','Klart senast','date'),field('priority','Prioritet','select',{options:[['normal','Normal'],['important','Viktig'],['urgent','Brådskande']]}),booking,field('showHome','Visa även i familjens att-göra-lista','checkbox',{wide:true}),notesField];
 if(type==='categoryBudget')return [title,field('amount','Planerad budget i '+trip().currency,'number',{min:0,required:true})];
 if(type==='expense')return [title,field('entryKind','Typ av post','select',{options:[['plan','Planerad kostnad'],['payment','Betalning / återbetalning'],['legacy','Befintlig plan och utgift']]}),field('category','Kategori','text',{suggest:[...new Set([...M.categories,...list('categoryBudget').map(x=>x.title)])]}),field('currency','Valuta','select',{options:currencies}),field('rate','1 valutaenhet i '+trip().currency,'number',{min:0.000001,required:true}),...(v.entryKind!=='payment'?[field('planned','Planerat belopp','number',{min:0})]:[]),...(v.entryKind!=='plan'?[field('actual','Betalat belopp · minus för återbetalning','number',{required:true}),field('payer','Betalat av','text',{suggest:members()}),field('splitText','Fördelning · namn eller namn:andel','textarea',{wide:true,placeholder:'Markus:1, Maja:1'})]:[]),date,booking,field('receiptId','Kvitto','select',{options:references('document'),empty:'Inget kvitto'}),field('upload','Ladda upp kvitto','file',{accept:'application/pdf,image/*',wide:true}),notesField];
 if(type==='booking'){const category=v.category||'Boende',lodging=category==='Boende',car=category==='Hyrbil',transport=['Flyg','Tåg','Färja'].includes(category);return [field('category','Vad bokar du?','select',{options:['Boende','Flyg','Tåg','Färja','Hyrbil','Aktivitet','Annat']}),title,field('date',lodging?'Incheckningsdatum':car?'Hämtningsdatum':'Datum','date'),field('time',lodging?'Incheckning':car?'Hämtning':'Start / avgång','time'),field('endDate',lodging?'Utcheckningsdatum':car?'Återlämningsdatum':'Slut / ankomstdatum','date'),field('endTime',lodging?'Utcheckning':car?'Återlämning':'Slut / ankomst','time'),field('timezone','Tidszon vid start','text',{suggest:['Europe/Stockholm','Europe/Oslo','Europe/London']}),...(transport?[field('arrivalTimezone','Tidszon vid ankomst'),field('arrivalLocation','Ankomstplats')]:car?[field('arrivalLocation','Återlämningskontor')]:[]),field('location',lodging?'Boendets adress':car?'Uthyrningskontor':'Adress / mötesplats'),field('participants',lodging?'Gäster':'Resenärer / deltagare','text',{wide:true}),field('status','Bokningsstatus','select',{options:['Att boka','Bokat','Avbokat']}),field('paymentStatus','Betalningsstatus','select',{options:['Obetalt','Delbetalt','Betalt']}),field('total','Total kostnad i '+trip().currency,'number',{min:0}),field('reference','Bokningsnummer'),field('contact','Kontaktuppgifter'),url,notesField];}
 if(type==='place')return [title,field('location','Adress'),field('category','Typ','select',{options:['Sevärdhet','Restaurang','Boende','Vandring','Parkering','Annat']}),field('lat','Latitud','number',{min:-90,max:90}),field('lng','Longitud','number',{min:-180,max:180}),field('mapPicker','Välj position på karta','map'),url,notesField];
 if(type==='photo')return [title,date,place,field('url','Bildlänk · eller ladda upp nedan','url',{wide:true}),field('upload','Välj en eller flera bilder','file',{multiple:!editing?.id,accept:'image/*',wide:true}),notesField];
 if(type==='document')return [title,field('category','Kategori','select',{options:['Biljetter','Bokningsbekräftelser','Kvitton','Övrigt']}),booking,field('important','Viktigt dokument','checkbox',{wide:true}),url,field('upload','PDF eller bild · PDF högst 1 MB','file',{accept:'application/pdf,image/*',wide:true}),notesField];
 return [title,date,place,field('pinned','Fäst överst','checkbox',{wide:true}),notesField,url];
}
function travelPickerText(kind,value){
 if(!value)return kind==='time'?'Välj tid':'Välj datum';
 if(kind==='time')return String(value).slice(0,5);
 try{
   const date=String(value).slice(0,10),parsed=new Date(date+'T12:00:00');
   if(Number.isNaN(parsed.getTime()))return date;
   const formatted=new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short',year:'numeric'}).format(parsed);
   return kind==='datetime-local'?formatted+' · '+String(value).slice(11,16):formatted;
 }catch(_){return String(value);}
}
function fieldHTML(f,v){
 const val=v[f.key]??'',dateTime=['date','time','datetime-local'].includes(f.kind);
 let input,attrs=' name="'+f.key+'" '+(f.required?'required ':'')+(f.min!==undefined?'min="'+f.min+'" ':'')+(f.max!==undefined?'max="'+f.max+'" ':'');
 if(f.kind==='select')input='<select'+attrs+'>'+opts(f.options,val,f.empty)+'</select>';
 else if(f.kind==='textarea')input='<textarea'+attrs+' rows="'+(editing?.type==='note'?10:3)+'" placeholder="'+esc(f.placeholder||'')+'">'+esc(val)+'</textarea>';
 else if(f.kind==='checkbox')input='<input'+attrs+' type="checkbox" '+(val?'checked':'')+'>';
 else if(f.kind==='file')input='<input'+attrs+' type="file" accept="'+f.accept+'" '+(f.multiple?'multiple':'')+'>';
 else if(f.kind==='map')input=btn('data-action="pick-coordinate"','Placera en markör')+'<div id="coordinate-map" hidden></div>';
 else {
   const native='<input'+attrs+' type="'+f.kind+'" '+(f.kind==='number'?'step="any" inputmode="decimal"':'')+' '+(f.kind==='text'?'maxlength="500"':'')+' value="'+esc(val)+'" '+(f.suggest?'list="suggest-'+f.key+'"':'')+'>';
   // iOS Safari's date/time shadow controls have an intrinsic width larger than
   // their CSS box. Render a compact readable face while the native picker remains
   // the real, focusable form input spanning the entire face.
   input=dateTime?'<span class="travel-picker-face" data-picker-kind="'+f.kind+'"><span class="travel-picker-value" aria-hidden="true">'+esc(travelPickerText(f.kind,val))+'</span>'+
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>'+
    native+'</span>':native;
   if(f.suggest)input+='<datalist id="suggest-'+f.key+'">'+f.suggest.map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist>';
 }
 return '<label class="'+(f.wide||['map','checkbox'].includes(f.kind)?'wide':'')+' '+(f.kind==='checkbox'?'check-label':'')+' travel-field-'+f.key+'">'+esc(f.label)+input+'</label>';
}
function defaults(type){return {packingPeople:M.people.join(', '),currency:trip()?.currency||'SEK',rate:1,date:day||currentDay(),timezone:trip()?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Stockholm',arrivalTimezone:trip()?.timezone||'Europe/Stockholm',timing:'timed',category:type==='booking'?'Boende':type==='packing'?'Övrigt':'',quantity:1,unit:'st',owner:'Övrigt',status:'Att boka',entryKind:filters.budget==='plan'?'plan':'payment',showHome:true,taskKind:'todo'};}
function openEditor(type,id,prefill={}){
 if(editing)closeEditor(false);if($('utility').open)$('utility').close();const key='travel-draft-'+type+'-'+(id||(type==='trip'?'new':tripId));let base=id?{...defaults(type),...S.get(id)}:defaults(type);if(base.splits)base.splitText=base.splits.map(x=>x.name+':'+x.weight).join(', ');const draft=read(key,null);let value={...base,...draft,...prefill};editing={type,id,key,base,extra:prefill.scheduleFromBooking?{scheduleFromBooking:true}:{},fields:[],uploads:[],savedUploads:{}};
 $('edit-title').textContent=(id?'Redigera ':'Ny ')+names[type];$('form-error').textContent=draft?'Ett tidigare utkast har återställts.':'';$('delete').hidden=!id;drawEditor(value);showEditor(type,id,prefill);$('edit-title').focus({preventScroll:true});
}
function drawEditor(value){
 editing.fields=fieldsFor(editing.type,value);
 // Show only common fields at first; advanced fields still belong to the SAME form.
 const bookingBasics=new Set(['category','title','date','time','endDate','endTime','status','location']);
 const expenseBasics=new Set(['title','entryKind','category','planned','actual','currency','payer','date']);
 const typeBasics={activity:['title','date','timing','time','endTime','category'],place:['title','location','category'],note:['title','date','notes'],task:['title','owner','date']};
 const essentials=editing.type==='booking'?bookingBasics:editing.type==='expense'?expenseBasics:typeBasics[editing.type]?new Set(typeBasics[editing.type]):null;
 const basic=essentials?editing.fields.filter(f=>essentials.has(f.key)):editing.fields;
 const advanced=essentials?editing.fields.filter(f=>!essentials.has(f.key)):[];
 $('editor').dataset.editorType=editing.type;
 $('fields').innerHTML=basic.map(f=>fieldHTML(f,value)).join('')+
  (advanced.length?'<details class="travel-editor-advanced"><summary>Fler '+(editing.type==='booking'?'bokningsuppgifter':editing.type==='expense'?'budgetuppgifter':'detaljer')+'</summary><div class="travel-editor-advanced-grid">'+advanced.map(f=>fieldHTML(f,value)).join('')+'</div></details>':'')+
  '<div class="travel-editor-draft-link">'+btn('data-action="discard-draft"','Kasta textutkast','text-button')+'</div>';
}
function syncTravelPickerFace(input){
 if(!input||!input.matches?.('input[type=date],input[type=time],input[type=datetime-local]'))return;
 const face=input.closest('.travel-picker-face');
 if(!face)return;
 const text=face.querySelector('.travel-picker-value');
 if(text)text.textContent=travelPickerText(input.type,input.value);
}
function formData(){const out={};for(const f of editing.fields){const el=$('edit-form').elements[f.key];if(!el||['file','map'].includes(f.kind))continue;out[f.key]=f.kind==='checkbox'?el.checked:f.kind==='number'?(el.value===''?null:Number(el.value)):el.value.trim();}return out;}
function keepDraft(){if(!editing)return;try{localStorage.setItem(editing.key,JSON.stringify(formData()));}catch(_){$('form-error').textContent='Utkastet kunde inte sparas på enheten. Spara innan du lämnar.';}}
function restoreEditor(){const editor=$('editor');if(editor?.classList.contains('inline-editor')){editor.close();editor.classList.remove('inline-editor');document.body.append(editor);}}
function closeEditor(redraw=true){if(savingEditor)return;keepDraft();const finish=()=>{$('editor').close();editing=null;restoreEditor();if(redraw)render(true);};if(redraw)MenuMotion.close($('editor'),finish);else finish();}
function showEditor(type,id,prefill){
 const editor=$('editor');
 if(type==='trip'){editor.classList.add('inline-editor');document.querySelector('.page-heading').after(editor);MenuMotion.show(editor);editor.scrollIntoView({block:'start',behavior:'smooth'});return;}
 editor.classList.add('inline-editor');
 const source=id||prefill.bookingId||prefill.placeId;
 let anchor=source?[...$('content').querySelectorAll('[data-item]')].find(x=>x.dataset.item===source):null;
 if(anchor?.classList.contains('calendar-event'))anchor=anchor.closest('.calendar-days');if(anchor?.classList.contains('week-agenda-event'))anchor=anchor.closest('.compact-week');
 if(anchor?.matches('.calendar-days,.compact-week'))anchor.before(editor);else if(anchor)anchor.after(editor);else $('content').prepend(editor);
 MenuMotion.show(editor);editor.scrollIntoView({block:'start',behavior:'smooth'});
}
function readData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Filen kunde inte läsas.'));r.readAsDataURL(file);});}
async function prepareFile(file){if(file.type==='application/pdf'){if(file.size>1024*1024)throw Error('PDF-filen får vara högst 1 MB. Lägg till större dokument som länk.');return readData(file);}if(!file.type.startsWith('image/'))throw Error('Välj en bild eller PDF.');const img=new Image();img.src=await readData(file);await img.decode();const scale=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);let data=c.toDataURL('image/jpeg',.78);if(data.length>1400000)data=c.toDataURL('image/jpeg',.5);if(data.length>1400000)throw Error('Bilden är för stor. Välj en mindre bild.');return data;}
async function saveEditor(event){event.preventDefault();if(!editing||savingEditor)return;savingEditor=true;$('fields').inert=true;const submit=$('edit-form').querySelector('[type=submit]');submit.disabled=true;
 try{let value={...formData(),...editing.extra},type=editing.type;const old=editing.id?S.get(editing.id):null;if(old?.deleted)throw Error('Posten har tagits bort på en annan enhet. Ditt utkast är kvar.');
 if(value.url&&!S.safeURL(value.url))throw Error('Använd en fullständig http- eller https-länk.');
 if(type==='expense'){if(value.currency===trip().currency)value.rate=1;value.splits=M.parseSplits(value.splitText||'');delete value.splitText;if(value.entryKind==='plan'){value.actual=null;value.payer='';value.splits=[];}if(value.entryKind==='payment')value.planned=null;}
 if(type==='activity'&&value.timing!=='timed'){value.time='';value.endTime='';value.endDate='';}
 if(type==='task')value.taskKind='todo';
 if(type==='trip'){if(old&&value.currency!==old.currency&&list('expense').length)throw Error('Basvalutan kan inte ändras när resan har registrerade kostnader. Beloppen skulle då få fel värde.');value.departureISO=M.zonedISO(value.departure,value.timezone);}
 if(type==='booking'){if(value.date&&value.time){const start=M.zonedISO(value.date+'T'+value.time,value.timezone);if(value.endDate&&value.endTime&&M.zonedISO(value.endDate+'T'+value.endTime,value.arrivalTimezone||value.timezone)<=start)throw Error('Ankomst / slut måste vara efter starten. Kontrollera datum och tidszon.');}else if(value.endDate&&value.date&&value.endDate<value.date)throw Error('Slutdatum kan inte vara före starten.');}
 if(type==='categoryBudget'&&list('categoryBudget').some(x=>x.id!==editing.id&&x.title.toLocaleLowerCase('sv-SE')===value.title.toLocaleLowerCase('sv-SE')))throw Error('Den budgetkategorin finns redan. Redigera den befintliga kategorin.');
 M.validate({...value,type});
 const files=[...($('edit-form').elements.upload?.files||[])];if(files.length)editing.uploads=files;
 const changes=[];if(type==='categoryBudget'&&old&&value.title!==old.title)for(const x of list('expense').filter(x=>x.category===old.title))changes.push({id:x.id,changes:{category:value.title}});if(type==='booking'&&old){for(const a of list('activity').filter(x=>x.bookingId===old.id&&x.scheduleFromBooking)){const patch={},before=M.bookingSchedule(old,trip().timezone),after=M.bookingSchedule(value,trip().timezone);for(const k of ['title','date','time','endDate','endTime','location','url'])if(after[k]!==before[k]&&a[k]===before[k])patch[k]=after[k];if(Object.keys(patch).length)changes.push({id:a.id,changes:patch});}}let ids=[],finalTrip=tripId,finalDay=type==='trip'&&!old?'':day;
 if(type==='trip'&&old?.departure&&value.departure.slice(0,10)!==old.departure.slice(0,10)){
  const delta=M.dayDiff(old.departure,value.departure),moves=M.shifted(allForTrip(),delta);if(moves.length){const shift=await chooseShift(moves,delta);if(shift===null)return;if(shift){changes.push(...moves);if(day)finalDay=M.addDays(day,delta);}}
 }
 const uploads=editing.uploads.length?editing.uploads:[null];
 for(let i=0;i<uploads.length;i++){
  const file=uploads[i];let row={...value};if(file){$('form-error').textContent='Förbereder fil '+(i+1)+' av '+uploads.length+'…';const key=file.name+'|'+file.size+'|'+file.lastModified;let fileId=editing.savedUploads[key];if(!fileId){fileId=await S.putFile(await prepareFile(file));editing.savedUploads[key]=fileId;}
   if(type==='trip')row.coverId=fileId;
   else if(type==='expense'){const docId=S.uid();changes.push({id:docId,changes:{id:docId,type:'document',tripId,title:'Kvitto · '+value.title,fileId,fileName:file.name,category:'Kvitton',bookingId:value.bookingId||'',createdAt:Date.now(),deleted:false}});row.receiptId=docId;}
   else{row.fileId=fileId;row.fileName=file.name;if(type==='photo'&&uploads.length>1)row.title=i===0?value.title:file.name.replace(/\.[^.]+$/,'');}
  }
  if(['photo','document'].includes(type)&&!row.url&&!row.fileId&&!old?.fileId)throw Error('Välj en fil eller lägg till en länk.');
  const id=editing.id||S.uid();if(old){const patch={};for(const [k,v] of Object.entries(row))if(JSON.stringify(v)!==JSON.stringify(editing.base[k]??(['checkbox'].includes(editing.fields.find(f=>f.key===k)?.kind)?false:'')))patch[k]=v;changes.push({id,changes:patch});}else changes.push({id,changes:{...row,type,tripId:type==='trip'?'':tripId,createdAt:Date.now(),deleted:false}});ids.push(id);if(type==='trip')finalTrip=id;
 }
 await S.batch(changes);localStorage.removeItem(editing.key);editing=null;$('editor').close();tripId=finalTrip;day=finalDay;remember('travel-selected-v2',tripId);render(true);toast(ids.length>1?ids.length+' bilder sparade.':'Sparat.');
 }catch(e){$('form-error').textContent=(e.message||'Kunde inte spara.')+' Ditt utkast finns kvar; försök igen.';keepDraft();}finally{savingEditor=false;$('fields').inert=false;submit.disabled=false;}
}
function chooseShift(moves,delta){return new Promise(resolve=>{utility('Flytta schemat med resan?','<p>Avresan flyttas '+delta+' dagar. Välj om '+moves.length+' aktiviteter ska följa med.</p><ul class="shift-preview">'+moves.map(m=>'<li>'+esc(S.get(m.id)?.title)+'<br><small>'+esc(S.get(m.id)?.date)+' → '+m.changes.date+'</small></li>').join('')+'</ul><div class="dialog-actions">'+btn('data-shift="yes"','Flytta aktiviteter','primary')+btn('data-shift="no"','Behåll datumen')+btn('data-shift="cancel"','Avbryt')+'</div>');const dlg=$('utility');const finish=v=>{dlg.removeEventListener('click',click);dlg.removeEventListener('close',cancel);dlg.close();resolve(v);};const click=e=>{const b=e.target.closest('[data-shift]');if(b)finish(b.dataset.shift==='cancel'?null:b.dataset.shift==='yes');};const cancel=()=>finish(null);dlg.addEventListener('click',click);dlg.addEventListener('close',cancel);});}
function templatePanel(){utility('Packmallar','<form id="save-template" class="quick-add"><input name="title" required placeholder="Namn på ny mall" aria-label="Mallnamn">'+btn('data-template-save','Spara nuvarande lista','primary')+'</form><p class="muted">Mallar innehåller saker, antal, personer och kategorier. Packmarkeringar följer aldrig med.</p>'+list('packTemplate').map(x=>'<article class="expense-row"><div><h3>'+esc(x.title)+'</h3><small>'+(x.items||[]).length+' saker</small></div><div class="row-actions">'+btn('data-template-apply="'+x.id+'"','Lägg till i resan')+btn('data-remove="'+x.id+'"','Ta bort')+'</div></article>').join(''));}
function tripTools(){const t=trip();utility('Hantera '+t.title,'<div class="tool-grid">'+btn('data-action="duplicate"','Duplicera resa')+btn('data-action="archive"',t.archived?'Återställ från arkiv':'Arkivera resa')+btn('data-action="print"','Skriv ut reseplan')+btn('data-remove="'+t.id+'"','Flytta resa till papperskorg','danger')+'</div>');}
function duplicatePanel(){utility('Duplicera resa','<form id="duplicate-form"><label>Namn<input name="title" value="'+esc(trip().title+' · kopia')+'" required></label><label class="check-label"><input type="checkbox" name="schedule" checked>Schema, platser, bokningar och bilagor</label><label class="check-label"><input type="checkbox" name="packing" checked>Packlista · återställ markeringar</label><label class="check-label"><input type="checkbox" name="budget" checked>Budgetplan · utan betalningar</label><p class="muted">Den ursprungliga resan behålls. Bokningsnummer och betalningsstatus följer inte med.</p><button class="primary" type="submit">Skapa kopia</button><p role="alert" class="utility-error"></p></form>');}
async function removeItem(id){const x=S.get(id);if(!x)return;if(!confirm('Flytta '+x.title+' till papperskorgen? Innehållet kan återställas.'))return;await S.remove(id);if($('editor').open&&editing?.id===id){localStorage.removeItem(editing.key);editing=null;$('editor').close();}if($('utility').open)$('utility').close();render(true);toast('Flyttad till papperskorgen.',async()=>{await S.restore(id);render();});}
function trash(){const rows=S.list().filter(x=>x.deleted);$('trash-list').innerHTML=rows.map(x=>'<article class="card"><small>'+esc(names[x.type]||'Post')+' · '+esc(S.get(x.tripId)?.title||'')+'</small><h3>'+esc(x.title)+'</h3>'+btn('data-restore="'+x.id+'"','Återställ')+'</article>').join('')||empty('Papperskorgen är tom.');MenuMotion.show($('trash-dialog'),true);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function fileBlob(x){return (await fetch(await S.file(x.fileId))).blob();}
let viewerURL;
async function preview(id){const x=S.get(id);if(!x)return;if(viewerURL){URL.revokeObjectURL(viewerURL);viewerURL=null;}$('viewer-body').innerHTML='<p>Laddar '+esc(x.title)+'…</p>';MenuMotion.show($('viewer'),true);try{if(!x.fileId){$('viewer-body').innerHTML='<h2>'+esc(x.title)+'</h2>'+link(x.url,'Öppna dokument');return;}const blob=await fileBlob(x);viewerURL=URL.createObjectURL(blob);$('viewer-body').innerHTML='<h2>'+esc(x.title)+'</h2>'+(blob.type==='application/pdf'?'<iframe class="pdf-preview" title="'+esc(x.title)+'" src="'+viewerURL+'"></iframe>':'<img class="viewer-image" alt="'+esc(x.title)+'" src="'+viewerURL+'">')+'<div class="inline-actions">'+btn('data-download="'+id+'"','Ladda ned')+'</div>';}catch(e){$('viewer-body').innerHTML='<p>'+esc(e.message)+'</p>'+btn('data-preview-retry="'+id+'"','Försök igen');}}
async function showPhoto(index){const rows=photoRows();if(!rows.length)return;viewerIndex=(index+rows.length)%rows.length;const x=rows[viewerIndex];$('viewer-body').innerHTML='<figure class="lightbox"><img class="viewer-image" '+(x.fileId?'data-file="'+x.fileId+'"':'src="'+esc(S.safeURL(x.url))+'"')+' alt="'+esc(x.title)+'"><figcaption>'+esc(x.title)+' · '+(viewerIndex+1)+' / '+rows.length+'</figcaption></figure><div class="viewer-controls">'+btn('data-photo-step="-1" aria-label="Föregående bild"','←')+btn('data-photo-menu="'+x.id+'"','Alternativ')+btn('data-photo-step="1" aria-label="Nästa bild"','→')+'</div>';MenuMotion.show($('viewer'),true);hydrateImages();}
function photoMenu(id){if($('viewer').open)$('viewer').close();openEditor('photo',id);}
async function pickCoordinate(){const host=$('coordinate-map');host.hidden=false;const L=await leaflet();if(!host.isConnected)return;host.innerHTML='';const lat=$('edit-form').elements.lat,lng=$('edit-form').elements.lng;const center=lat.value&&lng.value?[Number(lat.value),Number(lng.value)]:[58.5,15.3];const m=L.map(host,{scrollWheelZoom:false}).setView(center,lat.value?13:5);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(m);let marker;if(lat.value&&lng.value)marker=L.circleMarker(center,{color:'#fdba74'}).addTo(m);m.on('click',e=>{lat.value=e.latlng.lat.toFixed(6);lng.value=e.latlng.lng.toFixed(6);if(marker)marker.setLatLng(e.latlng);else marker=L.circleMarker(e.latlng,{color:'#fdba74'}).addTo(m);keepDraft();});}
function printTrip(){const t=trip(),w=window.open('','_blank');if(!w){toast('Tillåt popup för utskrift.');return;}w.document.write('<!doctype html><html lang="sv"><meta charset="utf-8"><title>'+esc(t.title)+'</title><style>body{font:14px system-ui;max-width:900px;margin:35px}article{break-inside:avoid;border-bottom:1px solid #ddd;padding:12px 0}p{white-space:pre-wrap}small{color:#666}</style><h1>'+esc(t.title)+'</h1><p>'+esc(t.destination)+' · '+esc(t.departure)+' — '+esc(t.endDate)+'</p>'+[['activity','Resplan'],['packing','Packlista'],['task','Förberedelser'],['expense','Reskassa'],['booking','Bokningar'],['place','Platser'],['document','Dokument'],['note','Anteckningar']].map(([type,label])=>'<h2>'+label+'</h2>'+list(type).sort(type==='activity'?M.activitySort:(a,b)=>Number(a.createdAt)-Number(b.createdAt)).map(x=>'<article><strong>'+(['packing','task'].includes(type)?(x.done?'Klart: ':'Ej klart: '):'')+esc(x.title)+'</strong><p>'+esc([x.date,x.time,x.endTime,locationOf(x),x.owner,x.quantity?x.quantity+' '+(x.unit||'st'):'',x.reference,x.status].filter(Boolean).join(' · '))+'</p>'+(type==='expense'?'<p>Planerat '+money(x.planned,x.currency)+' · Betalat '+(x.actual==null?'Ej registrerat':money(x.actual,x.currency))+'</p>':'')+'<p>'+esc(x.notes)+'</p>'+link(x.url)+'</article>').join('')).join('')+'</html>');w.document.close();w.focus();w.print();}
async function scheduleSource(id){const x=S.get(id);const existing=list('activity').find(a=>(x.type==='booking'?a.bookingId:a.placeId)===id);if(existing)return openEditor('activity',existing.id);const pre={title:x.title,date:x.type==='place'?(filters.placeDay||day||currentDay()):(x.date||day||currentDay()),time:x.time||'',endTime:x.endTime||'',endDate:x.endDate||'',timing:x.time?'timed':'flex',notes:x.notes||'',location:x.location||'',url:x.url||'',category:x.type==='booking'?(['Flyg','Tåg','Färja','Hyrbil'].includes(x.category)?'Transport':x.category==='Boende'?'Boende':'Aktivitet'):'Aktivitet'};if(x.type==='booking'){Object.assign(pre,M.bookingSchedule(x,trip().timezone));pre.bookingId=id;pre.scheduleFromBooking=true;}else pre.placeId=id;openEditor('activity',null,pre);}
async function click(event){const b=event.target.closest('button');if(!b)return;try{
 if(b.dataset.close){MenuMotion.close($(b.dataset.close));return;}
 if(b.dataset.week){if(editing)closeEditor(false);day=M.addDays(day,Number(b.dataset.week)*7);return render(true);}
 if(b.hasAttribute('data-night')){showNight=!showNight;return render(true);}
 if(b.dataset.planView)return setPlanView(b.dataset.planView);
 if(b.dataset.openDay){day=b.dataset.openDay;return setPlanView('day');}
 if(b.hasAttribute('data-pack-person')){filters.packingOwner=b.dataset.packPerson;return render(true);}
 if(b.hasAttribute('data-missing')){filters.packingStatus=filters.packingStatus==='todo'?'all':'todo';return render(true);}
 if(b.dataset.cashSplit){filters.budget='split';return setTab('expense');}
 if(b.hasAttribute('data-idea'))return openEditor('note',null,{date:''});
 if(b.dataset.journalPlace){selectedPlace=b.dataset.journalPlace;filters.placeCategory='';filters.placeStatus='';filters.placeDay='';return setPlanView('map');}
 if(b.dataset.journalDay)return openEditor('note',null,{date:b.dataset.journalDay});

 if(b.dataset.new)return openEditor(b.dataset.new);
 if(b.dataset.trip){if(editing)closeEditor(false);tripId=b.dataset.trip;day='';addingPackingHeading=false;remember('travel-selected-v2',tripId);return render(true);}
 if(b.dataset.tripFilter){tripFilter=b.dataset.tripFilter;return render(true);}
 if(b.dataset.tab)return setTab(b.dataset.tab);
 if(b.dataset.go){if(b.dataset.status){if(b.dataset.go==='packing')filters.packingStatus=b.dataset.status;if(b.dataset.go==='task')filters.taskStatus=b.dataset.status;}return setTab(b.dataset.go);}
 if(b.dataset.edit)return openEditor(S.get(b.dataset.edit).type,b.dataset.edit);
 if(b.dataset.packDelete){await removePackingItem(b.dataset.packDelete);return;}
 if(b.dataset.day){if(editing)closeEditor(false);day=b.dataset.day;return render(true);}
 if(b.dataset.slot!==undefined){const [date,time]=b.dataset.slot.split('|');return openEditor('activity',null,{date,time,timing:time?'timed':'flex'});}
 if(b.dataset.packJump!==undefined){document.querySelector('.packing-filter')?.removeAttribute('open');const section=[...document.querySelectorAll('.packing-group')].find(x=>x.dataset.dropGroup===b.dataset.packJump);section?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(b.dataset.owner){filters.packingOwner=b.dataset.owner;return render(true);}
 if(b.dataset.budget){if(editing)closeEditor(false);filters.budget=b.dataset.budget;return render(true);}
 if(b.dataset.category)return openEditor('categoryBudget',b.dataset.categoryId,{title:b.dataset.category});
 if(b.dataset.classify){const [id,type]=b.dataset.classify.split('|');await S.patch(id,{type,taskKind:'todo',quantity:1,category:type==='packing'?'Övrigt':S.get(id).category});return;}
 if(b.dataset.pay){const x=S.get(b.dataset.pay);return openEditor('expense',null,{title:x.title,category:x.category,currency:x.currency,rate:x.rate,actual:x.planned,bookingId:x.bookingId||'',entryKind:'payment'});}
 if(b.dataset.bookingExpense){const x=S.get(b.dataset.bookingExpense);return openEditor('expense',null,{title:x.title,bookingId:x.id,category:x.category==='Boende'?'Boende':'Transport',entryKind:'payment'});}
 if(b.dataset.bookingDoc)return openEditor('document',null,{bookingId:b.dataset.bookingDoc,category:'Bokningsbekräftelser'});
 if(b.dataset.schedule)return scheduleSource(b.dataset.schedule);
 if(b.dataset.copy){try{await navigator.clipboard.writeText(b.dataset.copy);toast('Bokningsnumret kopierat.');}catch(_){utility('Kopiera bokningsnummer','<input readonly value="'+esc(b.dataset.copy)+'" aria-label="Bokningsnummer"><p>Markera och kopiera numret.</p>');}return;}
 if(b.dataset.visited){const x=S.get(b.dataset.visited);await S.patch(x.id,{visited:!x.visited});return;}
 if(b.dataset.mapFocus){const x=S.get(b.dataset.mapFocus);if(map&&x.lat!=null&&x.lat!==''&&x.lng!=null&&x.lng!==''){selectPlace(x.id);map.setView([Number(x.lat),Number(x.lng)],14);$('map').scrollIntoView({behavior:'smooth',block:'center'});}else openEditor('place',x.id);return;}
 if(b.dataset.photo)return showPhoto(photoRows().findIndex(x=>x.id===b.dataset.photo));
 if(b.dataset.photoStep)return showPhoto(viewerIndex+Number(b.dataset.photoStep));
 if(b.dataset.photoMenu)return photoMenu(b.dataset.photoMenu);
 if(b.dataset.cover){const x=S.get(b.dataset.cover);await S.patch(tripId,{coverId:x.fileId||'',coverURL:x.fileId?'':x.url});$('utility').close();return;}
 if(b.dataset.preview||b.dataset.previewRetry){if(editing)closeEditor(false);if($('viewer').open)$('viewer').close();return preview(b.dataset.preview||b.dataset.previewRetry);}
 if(b.dataset.download){const x=S.get(b.dataset.download);return download(await fileBlob(x),x.fileName||x.title);}
 if(b.dataset.offline){await S.file(S.get(b.dataset.offline).fileId);await checkFiles();toast('Dokumentet är sparat för offlinevisning.');return;}
 if(b.dataset.pin){const x=S.get(b.dataset.pin);await S.patch(x.id,{pinned:!x.pinned});return;}
 if(b.dataset.noteActivity||b.dataset.noteTask){const x=S.get(b.dataset.noteActivity||b.dataset.noteTask);return openEditor(b.dataset.noteActivity?'activity':'task',null,{title:x.title,notes:x.notes||'',url:x.url||'',date:x.date||day||currentDay(),placeId:x.placeId||'',timing:'flex'});}
 if(b.dataset.templateApply){const x=S.get(b.dataset.templateApply);await S.batch((x.items||[]).map(item=>({id:S.uid(),changes:{...item,type:'packing',tripId,done:false,deleted:false,createdAt:Date.now()}})));$('utility').close();toast('Packmallen har lagts till.');return;}
 if(b.dataset.remove)return removeItem(b.dataset.remove);
 if(b.dataset.restore){const x=S.get(b.dataset.restore);const parent=S.get(x.tripId);if(parent?.deleted){if(!confirm('Resan ligger också i papperskorgen. Återställ resan tillsammans med posten?'))return;await S.batch([{id:parent.id,changes:{deleted:false}},{id:x.id,changes:{deleted:false}}]);}else await S.restore(x.id);trash();return;}
 if(b.hasAttribute('data-quick-submit'))return b.closest('form').requestSubmit();
 if(b.hasAttribute('data-template-save'))return b.closest('form').requestSubmit();
 if(b.id==='add')return openEditor(({photo:'note',document:'booking'})[tab]||tab);
 if(b.id==='close')return closeEditor();
 if(b.id==='delete')return removeItem(editing.id);
 if(b.id==='trash')return trash();if(b.id==='close-trash')return MenuMotion.close($('trash-dialog'));
 if(b.id==='export'){toast('Förbereder backup med filer…');download(new Blob([JSON.stringify(await S.exportBackup(),null,2)],{type:'application/json'}),'familjens-resor.json');return;}
 const act=b.dataset.action;
 if(act==='undo'&&undoAction){const undo=undoAction;undoAction=null;await undo();$('toast').hidden=true;}
 if(act==='trip-tools')tripTools();if(act==='duplicate')duplicatePanel();
 if(act==='archive'){await S.patch(tripId,{archived:!trip().archived});$('utility').close();render(true);}
 if(act==='print')printTrip();if(act==='templates'){document.querySelector('.packing-filter')?.removeAttribute('open');templatePanel();}
 if(act==='pack-new-heading'){addingPackingHeading=true;render(true);$('packing-new-heading')?.elements.title.focus({preventScroll:true});return;}
 if(act==='pack-cancel-heading'){addingPackingHeading=false;render(true);return;}
 if(act==='schedule-today'){day=currentDay();render(true);}

 if(act==='discard-draft'){localStorage.removeItem(editing.key);drawEditor({...editing.base});$('form-error').textContent='Utkastet är återställt.';}
 if(act==='pick-coordinate')await pickCoordinate();
 }catch(e){toast(e.message||'Kunde inte utföra ändringen.');}}

/* Click text rather than an edit button; keep iOS editing inside the row. */
document.addEventListener('click',event=>{
 const target=event.target;
 if(!(target instanceof Element)||tab!=='packing')return;
 const title=target.closest('.pack-item-text[data-pack-title]');
 if(title){if(!title.isContentEditable)startPackingEdit(title,'item');return;}
 const heading=target.closest('.pack-group-name[data-pack-heading]');
 if(heading){if(!heading.isContentEditable)startPackingEdit(heading,'heading');return;}
 const qty=target.closest('.packing-qty[data-pack-quantity]');
 if(qty&&!qty.querySelector('input'))startPackingQuantity(qty);
});
document.addEventListener('keydown',event=>{
 const target=event.target;
 if(!(target instanceof Element)||tab!=='packing')return;
 const editable=target.closest('.pack-editing');
 if(editable){
  if(event.isComposing)return;
  if(event.key==='Enter'){event.preventDefault();event.stopPropagation();finishPackingEdit(editable,true);return;}
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();finishPackingEdit(editable,false,true);editable.blur();return;}
 }
 const text=target.closest('.pack-item-text[data-pack-title],.pack-group-name[data-pack-heading]');
 if(text&&(event.key==='Enter'||event.key===' ')){
  event.preventDefault();startPackingEdit(text,text.hasAttribute('data-pack-title')?'item':'heading');return;
 }
 const qty=target.closest('.packing-qty[data-pack-quantity]');
 if(qty&&!qty.querySelector('input')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();startPackingQuantity(qty);}
});
document.addEventListener('focusout',event=>{
 const el=event.target;
 if(el instanceof Element&&el.classList.contains('pack-editing'))finishPackingEdit(el,false);
});
function startPackingQuantity(el){
 const item=S.get(el.dataset.packQuantity);if(!item)return;
 const original=el.textContent,value=Number(item.quantity||1);
 const input=document.createElement('input');
 input.type='number';input.min='0.1';input.step='any';input.inputMode='decimal';input.value=String(value);input.className='pack-quantity-input';input.setAttribute('aria-label','Antal '+item.title);
 el.textContent='';el.append(input);input.focus({preventScroll:true});input.select();
 let resolved=false;
 async function complete(cancel){
  if(resolved)return;resolved=true;
  const newQuantity=cancel?value:Number(input.value);
  el.textContent=original;
  if(!cancel){
   if(!Number.isFinite(newQuantity)||newQuantity<=0){toast('Antal måste vara större än noll.');return;}
   if(newQuantity!==value){
    el.textContent=newQuantity+' '+(item.unit||'st');
    try{await S.patch(item.id,{quantity:newQuantity});packingRenderFingerprint();}
    catch(error){el.textContent=original;toast(error.message||'Kunde inte spara antal.');}
   }
  }
 }
 input.addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();complete(false);}
  if(event.key==='Escape'){event.preventDefault();complete(true);}
 });
 input.addEventListener('blur',()=>complete(false));
}

document.addEventListener('toggle',event=>{
 if(event.target.matches?.('.packing-filter')&&event.target.open)positionPackingFilter();
},true);
document.addEventListener('pointerdown',event=>{
 const open=document.querySelector('.packing-filter[open]');
 if(open&&!open.contains(event.target))closePackingFilter();
},true);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&document.querySelector('.packing-filter[open]')){
  closePackingFilter();
  event.preventDefault();
 }
},true);
window.addEventListener('resize',positionPackingFilter,{passive:true});
window.addEventListener('scroll',positionPackingFilter,{passive:true});
window.visualViewport?.addEventListener('resize',positionPackingFilter,{passive:true});
window.visualViewport?.addEventListener('scroll',positionPackingFilter,{passive:true});


/* Inline editing follows the same tap → edit → Enter/blur save flow as the packlist. */
let travelTitleEdit=null;
function startTravelTitleEdit(el){
 if(!el||!el.dataset.travelTitle||el.isContentEditable)return;
 if(travelTitleEdit&&travelTitleEdit.el!==el)finishTravelTitleEdit(travelTitleEdit.el);
 const record=S.get(el.dataset.travelTitle);
 if(!record || record.deleted)return;
 travelTitleEdit={el,id:record.id,original:record.title||'',tripId};
 el.contentEditable='true';
 el.spellcheck=true;
 el.classList.add('travel-title-editing');
 el.removeAttribute('role');
 try{
   el.focus({preventScroll:true});
   const selection=window.getSelection(),range=document.createRange();
   range.selectNodeContents(el);range.collapse(false);selection.removeAllRanges();selection.addRange(range);
 }catch(_){el.focus();}
}
async function finishTravelTitleEdit(el,cancel=false){
 const entry=travelTitleEdit;
 if(!entry||entry.el!==el)return;
 travelTitleEdit=null;
 const next=cancel?entry.original:String(el.textContent||'').replace(/\u00a0/g,' ').trim();
 el.contentEditable='false';
 el.classList.remove('travel-title-editing');
 el.setAttribute('role','button');
 if(cancel||next===entry.original){el.textContent=entry.original;return;}
 if(!next||next.length>500){el.textContent=entry.original;toast('Ange en rubrik på högst 500 tecken.');return;}
 el.textContent=next;
 try{await S.patch(entry.id,{title:next});}
 catch(err){el.textContent=entry.original;toast(err.message||'Kunde inte spara ändringen.');}
}
function editTaskField(trigger,type){
 const task=S.get(type==='owner'?trigger.dataset.taskOwner:trigger.dataset.taskDate);
 if(!task||task.deleted)return;
 const input=document.createElement('select');
 input.className='travel-task-inline-control';
 input.setAttribute('aria-label',type==='owner'?'Välj ansvarig':'Välj förfallodatum');
 let node=input;
 if(type==='owner'){
   input.innerHTML=opts(taskOwnerChoices(),task.owner||'Familjen');
 }else{
   node=document.createElement('input');
   node.type='date';node.value=task.date||'';
   node.className='travel-task-inline-control travel-task-date-input';
   node.setAttribute('aria-label','Välj förfallodatum');
 }
 const original=trigger;
 const abort=()=>{
   if(node.isConnected)node.replaceWith(original);
 };
 let saved=false;
 node.addEventListener('change',async()=>{
   if(saved)return;
   saved=true;
   const value=node.value;
   try{
     await S.patch(task.id,type==='owner'?{owner:value}:{date:value});
     if(node.isConnected)abort();
     render(true);
   }catch(err){abort();toast(err.message||'Kunde inte spara ändringen.');}
 });
 node.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.stopPropagation();event.preventDefault();saved=true;abort();original.focus({preventScroll:true});}
 });
 node.addEventListener('blur',()=>{setTimeout(()=>{if(!saved)abort();},100);});
 original.replaceWith(node);
 node.focus({preventScroll:true});
 if(type==='date' && node.showPicker)try{node.showPicker();}catch(_){}
}
/* In-note textarea preserves Markdown source and auto-saves without a dialog. */
function editTravelNote(el){
 if(!el||el.querySelector('textarea'))return;
 const row=S.get(el.dataset.travelNotes);
 if(!row||row.deleted)return;
 const original=row.notes||'';
 const input=document.createElement('textarea');
 input.className='travel-note-input';input.value=original;
 input.setAttribute('aria-label','Redigera text för '+row.title);
 input.rows=5;
 let finished=false;
 const done=async(cancel=false)=>{
   if(finished)return;
   finished=true;
   const next=cancel?original:input.value;
   let shown=next;
   if(!cancel&&next!==original){
     try{await S.patch(row.id,{notes:next});}
     catch(e){shown=original;toast(e.message||'Kunde inte spara anteckningen.');}
   }
   if(el.isConnected){el.innerHTML=noteText(shown);render(true);}
 };
 input.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.stopPropagation();event.preventDefault();done(true);}
   else if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();done();}
 });
 input.addEventListener('blur',()=>done(),{once:true});
 el.replaceChildren(input);
 input.focus({preventScroll:true});
}
/* Edit recurring simple values exactly where they appear; retain the full editor
   for currencies, participants, linked documents and payment distributions. */
function inlineTravelControl(button,kind){
 const id=button.dataset.inlineBooking||button.dataset.inlinePlanned||button.dataset.inlineActual||button.dataset.categoryId;
 const record=id?S.get(id):null;
 const category=button.dataset.inlineBudgetCategory||'';
 const key=button.dataset.inlineKey||'';
 if(kind==='booking'&&(!record||record.type!=='booking'))return;
 if(['planned','actual'].includes(kind)&&(!record||record.type!=='expense'))return;
 const original=button;
 const input=document.createElement(kind==='booking'&&key==='status'?'select':'input');
 const prev=kind==='tripBudget'?(trip()?.budget??0):kind==='category'?(record?.amount??M.budget(list('expense'),list('categoryBudget')).groups[category]?.planned??0):kind==='planned'?(record.planned??0):kind==='actual'?(record.actual??0):(record[key]||'');
 if(kind==='booking'){
   if(key==='status')input.innerHTML=opts(['Att boka','Bokat','Avbokat'],prev);
   else input.type=key.toLowerCase().includes('date')?'date':'time';
 }else{input.type='number';input.step='any';if(kind!=='actual')input.min='0';input.inputMode='decimal';}
 if(input.tagName==='INPUT')input.value=String(prev);
 input.className='travel-inline-control';
 input.setAttribute('aria-label',kind==='tripBudget'?'Totalbudget':kind==='category'?'Planerad budget '+category:kind==='planned'?'Planerat belopp':kind==='actual'?'Betalat belopp':key);
 let done=false;
 const cancel=()=>{if(input.isConnected)input.replaceWith(original);};
 const commit=async()=>{
   if(done)return;
   done=true;
   const value=input.value;
   if(String(value)===String(prev)){cancel();return;}
   if(kind!=='booking'&&(!value||!Number.isFinite(Number(value))||(kind!=='actual'&&Number(value)<0))){cancel();toast('Ange ett giltigt belopp.');return;}
   try{
     if(kind==='tripBudget'){
       await S.patch(tripId,{budget:Number(value)});
     }else if(kind==='category'){
       const amount=Number(value);
       if(record)await S.patch(record.id,{amount});
       else await S.add('categoryBudget',tripId,{title:category,amount});
     }else if(kind==='planned'||kind==='actual'){
       await S.patch(record.id,{[kind]:Number(value)});
     }else{
       const updated={...record,[key]:value};
       if(updated.endDate&&updated.date&&updated.endDate<updated.date)throw Error('Slutdatum måste vara samma dag eller senare.');
       if(updated.date&&updated.time&&updated.endDate&&updated.endTime){
         const before=M.zonedISO(updated.date+'T'+updated.time,updated.timezone||trip().timezone);
         const after=M.zonedISO(updated.endDate+'T'+updated.endTime,updated.arrivalTimezone||updated.timezone||trip().timezone);
         if(after<=before)throw Error('Sluttiden måste vara efter starttiden.');
       }
       const changes=[{id:record.id,changes:{[key]:value}}];
       // Keep generated schedule records synchronized with the booking.
       for(const activity of list('activity').filter(x=>x.bookingId===record.id&&x.scheduleFromBooking)){
         const oldSchedule=M.bookingSchedule(record,trip().timezone);
         const newSchedule=M.bookingSchedule(updated,trip().timezone);
         const patch={};
         for(const field of ['title','date','time','endDate','endTime','location','url']){
           if(newSchedule[field]!==oldSchedule[field]&&activity[field]===oldSchedule[field])patch[field]=newSchedule[field];
         }
         if(Object.keys(patch).length)changes.push({id:activity.id,changes:patch});
       }
       await S.batch(changes);
     }
     if(input.isConnected)cancel();
     render(true);
   }catch(error){
     cancel();toast(error.message||'Kunde inte spara ändringen.');
   }
 };
 input.addEventListener('change',commit);
 input.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.stopPropagation();event.preventDefault();done=true;cancel();original.focus({preventScroll:true});}
   if(event.key==='Enter'&&input.tagName==='INPUT'){event.preventDefault();commit();}
 });
 input.addEventListener('blur',()=>{if(!done)setTimeout(()=>{if(!done)cancel();},120);});
 original.replaceWith(input);
 input.focus({preventScroll:true});
 if(kind==='booking'&&key!=='status'&&input.showPicker)try{input.showPicker();}catch(_){}
}
document.addEventListener('click',event=>{
 const target=event.target;
 if(!(target instanceof Element))return;
 const tripBudget=target.closest('button[data-inline-trip-budget]');
 if(tripBudget){inlineTravelControl(tripBudget,'tripBudget');return;}
 const book=target.closest('button[data-inline-booking]');
 if(book){inlineTravelControl(book,'booking');return;}
 const category=target.closest('button[data-inline-budget-category]');
 if(category){inlineTravelControl(category,'category');return;}
 const actual=target.closest('button[data-inline-actual]');
 if(actual){inlineTravelControl(actual,'actual');return;}
 const planned=target.closest('button[data-inline-planned]');
 if(planned){inlineTravelControl(planned,'planned');return;}
 const note=target.closest('[data-travel-notes]');
 if(note && !target.closest('textarea,.note-check')){editTravelNote(note);return;}
 const title=target.closest('[data-travel-title]');
 if(title){if(!title.isContentEditable)startTravelTitleEdit(title);return;}
 const owner=target.closest('button[data-task-owner]');
 if(owner){editTaskField(owner,'owner');return;}
 const date=target.closest('button[data-task-date]');
 if(date){editTaskField(date,'date');return;}
});
document.addEventListener('keydown',event=>{
 const target=event.target;
 if(!(target instanceof Element))return;
 if(target.matches('[data-travel-notes]')&&(event.key==='Enter'||event.key===' ')){
   event.preventDefault();editTravelNote(target);return;
 }
 if(target.matches('[data-travel-title]')){
   if(target.isContentEditable){
     if(event.isComposing)return;
     if(event.key==='Enter'){event.preventDefault();event.stopPropagation();finishTravelTitleEdit(target);target.blur();}
     if(event.key==='Escape'){event.preventDefault();event.stopPropagation();finishTravelTitleEdit(target,true);target.blur();}
   }else if(event.key==='Enter'||event.key===' '){event.preventDefault();startTravelTitleEdit(target);}
 }
});
document.addEventListener('focusout',event=>{
 if(event.target===travelTitleEdit?.el)finishTravelTitleEdit(event.target);
});

document.addEventListener('click',event=>{if(savingEditor&&!event.target.closest('#utility')){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
document.addEventListener('click',click);
$('edit-form').addEventListener('submit',saveEditor);
$('edit-form').addEventListener('input',event=>{syncTravelPickerFace(event.target);keepDraft();});
$('edit-form').addEventListener('change',event=>syncTravelPickerFace(event.target));
document.addEventListener('input',e=>{const f=e.target.closest('#quick-add');if(f)remember('travel-quick-'+tripId+'-'+f.dataset.type,Object.fromEntries(new FormData(f)));const inline=e.target.closest('.packing-inline-add');if(inline)remember('travel-pack-inline-'+tripId+'-'+inline.dataset.packKey+'-'+inline.dataset.packGroup,e.target.value);});
$('editor').addEventListener('cancel',()=>{keepDraft();editing=null;});
document.addEventListener('change',async e=>{const el=e.target;try{
 if(el.dataset.check){
  const done=el.checked,id=el.dataset.check;
  await S.patch(id,{done});
  if(tab==='packing'&&filters.packingStatus==='all'&&el.isConnected){
   el.closest('.check-row')?.classList.toggle('done',done);
   refreshPackingSummary();
   lastRenderKey=renderFingerprint();
   renderPending=false;
  }else render(true);
 }
 if(el.dataset.filter){filters[el.dataset.filter]=el.value;render(true);}
 if(el.id==='schedule-date'&&el.value){day=el.value;render(true);}
 if(el.closest('#edit-form')&&editing){if(el.name==='upload')editing.uploads=[...el.files];if(['timing','entryKind'].includes(el.name)||(editing.type==='booking'&&el.name==='category')){const data=formData();editing.uploads=[...($('edit-form').elements.upload?.files||editing.uploads)];drawEditor(data);keepDraft();}if(el.name==='currency'&&editing.type==='expense'&&el.value===trip().currency){$('edit-form').elements.rate.value=1;keepDraft();}}
 if(el.id==='import'){const file=el.files[0];if(!file)return;if(file.size>30*1024*1024)throw Error('Backupen får vara högst 30 MB.');const data=JSON.parse(await file.text());S.validateBackup(data);if(confirm('Importera som nya kopior? Befintliga resor behålls.')){await S.importBackup(data);render(true);toast('Backup importerad.');}el.value='';}
 }catch(err){toast(err.message);}});


document.addEventListener('submit',async e=>{
 const form=e.target;
 if(form.id!=='packing-new-heading')return;
 e.preventDefault();
 const value=form.elements.title.value.trim().replace(/,/g,' ');
 if(!value)return;
 const key=filters.packingGroup,field=key==='owner'?'packingPeople':'packingCategories',selectedTrip=tripId;
 const current=packingHeadings(key);
 if(current.some(x=>x.toLocaleLowerCase('sv-SE')===value.toLocaleLowerCase('sv-SE'))){toast('Rubriken finns redan.');return;}
 const next=[...current,value];
 try{
  await S.patch(selectedTrip,{[field]:next.join(', ')});
  if(key==='owner')filters.packingOwner='';
  addingPackingHeading=false;
  render(true);
  const section=[...document.querySelectorAll('.packing-group')].find(x=>x.dataset.dropGroup===value);
  section?.scrollIntoView({block:'center',behavior:'smooth'});
  section?.querySelector('.packing-inline-add input')?.focus({preventScroll:true});
 }catch(err){toast(err.message||'Kunde inte spara rubriken.');}
});

document.addEventListener('submit',async e=>{
 const form=e.target;
 if(!form.matches('.packing-inline-add'))return;
 e.preventDefault();
 const input=form.elements.namedItem('title'),title=input.value.trim();
 if(!title)return;
 const group=form.dataset.packGroup,key=form.dataset.packKey,selectedTrip=tripId;
 const draftKey='travel-pack-inline-'+selectedTrip+'-'+key+'-'+group;
 const row={title,owner:key==='owner'?group:(filters.packingOwner||'Övrigt'),category:key==='category'?group:'Övrigt',quantity:1,unit:'st',done:false,order:Date.now()};
 try{
  M.validate({...row,type:'packing'});
  input.value='';
  localStorage.removeItem(draftKey);
  const id=await S.add('packing',selectedTrip,row);
  // Keep the actual input node in place: iOS must not lose keyboard focus after Enter.
  if(form.isConnected&&selectedTrip===tripId&&tab==='packing'){
   if(filters.packingStatus!=='done'){
    form.insertAdjacentHTML('beforebegin',packingRow(S.get(id)));

   }
   refreshPackingSummary();
   // The saved list is already reflected in the DOM; do not tear down the active iOS input.
   lastRenderKey=renderFingerprint();
   renderPending=false;
  }
 }catch(err){
  if(form.isConnected&&!input.value)input.value=title;
  remember(draftKey,input.value||title);
  toast(err.message||'Kunde inte spara saken.');
 }
});
document.addEventListener('submit',async e=>{const form=e.target;if(!['quick-add','save-template','duplicate-form'].includes(form.id))return;e.preventDefault();const data=new FormData(form),submit=form.querySelector('button');submit.disabled=true;try{
 if(form.id==='quick-add'){const title=String(data.get('title')||'').trim();if(!title)return;const row={title,owner:data.get('owner')||'Familjen',taskKind:'todo',showHome:true,order:Date.now()};M.validate({...row,type:'task'});await S.add('task',tripId,row);localStorage.removeItem('travel-quick-'+tripId+'-task');form.reset();render(true);}
 if(form.id==='save-template'){const title=String(data.get('title')||'').trim();if(!title)return;const items=list('packing').map(({title,quantity,unit,owner,category,notes,order})=>({title,quantity:quantity||1,unit:unit||'st',owner:owner||'Övrigt',category:category||'Övrigt',notes:notes||'',order:order||0}));await S.add('packTemplate','',{title,items});templatePanel();toast('Packmallen sparad.');}
 if(form.id==='duplicate-form'){const rows=M.cloneTrip(trip(),S.list(),{title:data.get('title'),schedule:data.has('schedule'),packing:data.has('packing'),budget:data.has('budget')},S.uid);await S.batch(rows.map(x=>({id:x.id,changes:{...x,createdAt:Date.now()}})));tripId=rows[0].id;day='';$('utility').close();remember('travel-selected-v2',tripId);render(true);toast('Resan har kopierats.');}
 }catch(err){const target=form.querySelector('.utility-error');if(target)target.textContent=err.message;else toast(err.message);}finally{submit.disabled=false;}});
document.addEventListener('focusout',()=>{if(renderPending)setTimeout(()=>{if(!document.activeElement?.closest('#content input,#content textarea,#content select,#content [contenteditable="true"]'))render();},150);});
// The drag ghost follows every pointer move. Drop changes domain data, never just visual order.
document.addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-drag]');if(!handle||e.button>0)return;const source=handle.closest('[data-item]');if(!source)return;e.preventDefault();const rect=source.getBoundingClientRect(),ghost=source.cloneNode(true);ghost.classList.add('drag-ghost');ghost.style.cssText='left:'+rect.left+'px;top:'+rect.top+'px;width:'+rect.width+'px;margin:0';ghost.setAttribute('aria-hidden','true');const hint=document.createElement('div');hint.className='drag-hint';hint.textContent='Dra till önskad plats';ghost.append(hint);document.body.append(ghost);source.classList.add('drag-source');drag={id:handle.dataset.drag,pointer:e.pointerId,ghost,source,hint,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,target:null};handle.setPointerCapture?.(e.pointerId);});
function dragTarget(x,y){const el=document.elementFromPoint(x,y);const item=S.get(drag.id);if(item.type==='activity'){const dayButton=el?.closest('[data-day]');if(dayButton){return {date:dayButton.dataset.day,time:item.time||''};}const zone=el?.closest('[data-drop-date]');if(zone){let time=zone.hasAttribute('data-keep-time')?(item.time||''):zone.dataset.dropTime;if(time&&!zone.hasAttribute('data-keep-time')){const rect=zone.getBoundingClientRect();time=M.clock(Math.min(1439,M.minutes(time)+Math.floor(Math.max(0,Math.min(.999,(y-rect.top)/rect.height))*4)*15));}return {date:zone.dataset.dropDate,time};}}
 if(item.type==='packing'){const group=el?.closest('[data-drop-group]');if(group)return {group:group.dataset.dropGroup,before:el.closest('[data-item]')?.dataset.item||''};}
 if(item.type==='photo'){const target=el?.closest('.gallery [data-item]');if(target)return {before:target.dataset.item};}return null;}
document.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();drag.x=e.clientX;drag.y=e.clientY;drag.ghost.style.transform='translate('+(e.clientX-drag.startX)+'px,'+(e.clientY-drag.startY)+'px)';drag.target=dragTarget(e.clientX,e.clientY);drag.hint.textContent=drag.target?.date?drag.target.date+' · '+(drag.target.time||'Flexibelt'):drag.target?.group?'Till '+drag.target.group:drag.target?'Flytta hit':'Dra till en dag, tid eller grupp';if(e.clientY<90)window.scrollBy(0,-14);if(e.clientY>innerHeight-90)window.scrollBy(0,14);},{passive:false});
async function endDrag(e){if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;d.ghost.remove();d.source.classList.remove('drag-source');if(e.type!=='pointerup'||!d.target)return render(true);try{const x=S.get(d.id),target=d.target;if(x.type==='activity')await S.patch(x.id,M.moveActivity(x,target.date,target.time));else {const rows=(x.type==='photo'?photoRows():list('packing').filter(y=>(y[filters.packingGroup]||'Övrigt')===target.group)).filter(y=>y.id!==x.id).sort((a,b)=>Number(a.order??a.createdAt??0)-Number(b.order??b.createdAt??0));const at=rows.findIndex(y=>y.id===target.before);rows.splice(at<0?rows.length:at,0,x);await S.batch(rows.map((y,i)=>({id:y.id,changes:{order:i,...(y.id===x.id&&x.type==='packing'?{[filters.packingGroup]:target.group}:{})}})));}render(true);toast('Flyttad.');}catch(err){toast(err.message);render(true);}}
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);
let swipeX=0;$('viewer').addEventListener('touchstart',e=>swipeX=e.changedTouches[0].clientX,{passive:true});$('viewer').addEventListener('touchend',e=>{if(!$('viewer').querySelector('.lightbox'))return;const delta=e.changedTouches[0].clientX-swipeX;if(Math.abs(delta)>45)showPhoto(viewerIndex+(delta<0?1:-1));},{passive:true});
document.addEventListener('keydown',e=>{if($('viewer').open&&$('viewer').querySelector('.lightbox')){if(e.key==='ArrowRight')showPhoto(viewerIndex+1);if(e.key==='ArrowLeft')showPhoto(viewerIndex-1);}});
$('viewer').addEventListener('close',()=>{if(viewerURL){URL.revokeObjectURL(viewerURL);viewerURL=null;}$('viewer-body').innerHTML='';});
if('serviceWorker' in navigator)navigator.serviceWorker.register('travel-sw.js',{scope:'./travel.html'}).catch(()=>{});
// The Home overview's upcoming-trip control can select a trip without leaving the tab.
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.type!=='home:open-trip')return;
 const id=event.data.tripId;
 if(!id||!list('trip').some(t=>t.id===id)||$('editor').open)return;
 tripId=id;tab='overview';day='';
 render(true);
});
function expenseQuick(){const draft=read('travel-expense-quick-'+tripId,{});return '<form id="expense-quick" class="expense-quick"><label>Vad betalade du?<input name="title" required maxlength="500" placeholder="Lunch, taxi, biljetter…" value="'+esc(draft.title||'')+'"></label><label>Belopp · '+esc(trip().currency)+'<input name="actual" type="number" inputmode="decimal" step="any" required value="'+esc(draft.actual||'')+'"></label><label>Betalat av<select name="payer">'+opts(members(),draft.payer,'Välj person')+'</select></label><button class="primary" type="submit">Registrera</button><details><summary>Kategori, valuta & fördelning</summary><div class="expense-extra"><label>Kategori<select name="category">'+opts(M.categories,draft.category,'Övrigt')+'</select></label><label>Valuta<select name="currency">'+opts(currencies,draft.currency||trip().currency)+'</select></label><label>Valutakurs<input name="rate" type="number" min="0.000001" step="any" value="'+esc(draft.rate||1)+'"></label><label>Fördela mellan<input name="splitText" placeholder="Markus:1, Maja:1" value="'+esc(draft.splitText||'')+'"></label><label>Kvitto<input name="receipt" type="file" accept="image/*,application/pdf"></label></div></details><p class="quick-error" role="alert"></p></form>';}
function selectPlace(id,scroll=false){selectedPlace=id;for(const card of document.querySelectorAll('.place-card'))card.classList.toggle('selected',card.dataset.item===id);for(const [key,marker] of mapMarkers)marker.setStyle({radius:key===id?13:9,weight:key===id?4:2,color:key===id?'#fff1df':S.get(key)?.visited?'#86efac':'#fdba74'});if(scroll)$('place-'+id)?.scrollIntoView({behavior:'smooth',block:'center'});}
let uploadBusy=false;
async function directUpload(input){
 const type=input.dataset.directUpload,files=[...input.files],selectedTrip=tripId,selectedDate=day||currentDay(),status=$('upload-status');if(!files.length||uploadBusy)return;
 uploadBusy=true;input.disabled=true;const failed=[];
 for(let i=0;i<files.length;i++){
  const file=files[i];if(status?.isConnected)status.textContent='Sparar '+(i+1)+' av '+files.length+'…';
  try{const fileId=await S.putFile(await prepareFile(file));await S.add(type,selectedTrip,{title:file.name.replace(/\.[^.]+$/,''),fileId,fileName:file.name,date:selectedDate,category:type==='document'?'Övrigt':'',order:Date.now()});}
  catch(error){failed.push(file.name+': '+error.message);}
 }
 uploadBusy=false;input.disabled=false;input.value='';render(true);
 const target=$('upload-status');if(target)target.textContent=failed.length?'Kunde inte spara: '+failed.join(' · ')+'. Välj de filerna igen.':files.length+' filer sparade.';
}
document.addEventListener('input',event=>{const form=event.target.closest('#expense-quick');if(form){const data=Object.fromEntries(new FormData(form));delete data.receipt;remember('travel-expense-quick-'+tripId,data);}});
document.addEventListener('submit',async event=>{
 const form=event.target;if(form.id!=='expense-quick')return;event.preventDefault();
 const button=form.querySelector('[type=submit]'),selectedTrip=tripId,data=Object.fromEntries(new FormData(form));button.disabled=true;
 try{
  const row={title:data.title.trim(),actual:Number(data.actual),planned:null,entryKind:'payment',payer:data.payer,category:data.category||'Övrigt',currency:data.currency,rate:data.currency===trip().currency?1:Number(data.rate),splits:M.parseSplits(data.splitText),date:currentDay()};M.validate({...row,type:'expense'});
  const changes=[];if(data.receipt?.size){const fileId=await S.putFile(await prepareFile(data.receipt)),id=S.uid();row.receiptId=id;changes.push({id,changes:{type:'document',tripId:selectedTrip,title:'Kvitto · '+row.title,fileId,fileName:data.receipt.name,category:'Kvitton',createdAt:Date.now(),deleted:false}});}
  changes.push({id:S.uid(),changes:{...row,type:'expense',tripId:selectedTrip,createdAt:Date.now(),deleted:false}});await S.batch(changes);localStorage.removeItem('travel-expense-quick-'+selectedTrip);form.reset();render(true);toast('Utgiften är registrerad.');
 }catch(error){form.querySelector('.quick-error').textContent=error.message;}finally{button.disabled=false;}
});
document.addEventListener('change',async event=>{
 const el=event.target;try{
  if(el.dataset.directUpload)return await directUpload(el);
  if(el.dataset.documentBooking)await S.patch(el.dataset.documentBooking,{bookingId:el.value});
  if(el.dataset.noteCheck){const note=S.get(el.dataset.noteCheck),lines=String(note.notes||'').split('\n'),index=Number(el.dataset.line);if(!/^- \[[ xX]\] /.test(lines[index]||''))return;lines[index]=lines[index].replace(/^- \[[ xX]\]/,el.checked?'- [x]':'- [ ]');await S.patch(note.id,{notes:lines.join('\n')});}
 }catch(error){toast(error.message);}
});
let calendarTouch=null;
$('content').addEventListener('touchstart',event=>{if(tab!=='activity'||planView!=='day'||event.target.closest('button,input,select,textarea,a,dialog')){calendarTouch=null;return;}calendarTouch={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};},{passive:true});
$('content').addEventListener('touchend',event=>{if(!calendarTouch||editing)return;const dx=event.changedTouches[0].clientX-calendarTouch.x,dy=event.changedTouches[0].clientY-calendarTouch.y;calendarTouch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5){day=M.addDays(day,dx<0?1:-1);render(true);}},{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&editing&&$('editor').classList.contains('inline-editor')){event.preventDefault();closeEditor();}});

S.subscribe(()=>render());S.ready.then(()=>render());setInterval(tick,1000);
})();
