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
let day='',daysWide=false,editing=null,drag=null,map=null,mapRows=[],viewerIndex=0,toastTimer,undoAction=null,renderPending=false;
const filters={packingStatus:'all',packingOwner:'',packingGroup:'owner',taskOwner:'',taskStatus:'all',budget:'plan',placeCategory:'',placeStatus:'',placeDay:'',photoDay:'',documentCategory:''};
const tabs=[['overview','Översikt','RESAN I KORTHET'],['activity','Schema','DAG FÖR DAG'],['packing','Packlista','EN SAK I TAGET'],['task','Att göra','INFÖR RESAN'],['expense','Budget','RESKASSAN'],['booking','Bokningar','FRÅN AVGÅNG TILL INCHECKNING'],['place','Platser & karta','HIT VILL VI'],['photo','Bilder','UTSIKTER & MINNEN'],['document','Dokument','BILJETTER & BILAGOR'],['note','Anteckningar','IDÉER ATT SPARA']];
const names={trip:'resa',activity:'aktivitet',packing:'packsak',task:'uppgift',expense:'kostnad',booking:'bokning',place:'plats',photo:'bild',document:'dokument',note:'anteckning',categoryBudget:'kategoribudget',packTemplate:'packmall'};
if(!tabs.some(x=>x[0]===tab))tab='overview';
const trip=()=>S.get(tripId),list=(type)=>S.list().filter(x=>!x.deleted&&x.type===type&&(type==='trip'||type==='packTemplate'||x.tripId===tripId));
const allForTrip=()=>S.list().filter(x=>x.tripId===tripId&&!x.deleted);
const currentDay=()=>M.today(trip()?.timezone);
const members=()=>[...new Set([...(trip()?.travelers||'').split(',').map(x=>x.trim()).filter(Boolean),...(trip()?.packingPeople?trip().packingPeople.split(',').map(x=>x.trim()).filter(Boolean):M.people),...list('packing').map(x=>x.owner).filter(Boolean)])];
const money=(n,currency=trip()?.currency||'SEK')=>new Intl.NumberFormat('sv-SE',{style:'currency',currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)||0);
const btn=(attr,label,cls='')=>'<button type="button" '+attr+' class="'+cls+'">'+label+'</button>';
const link=(url,label='Öppna länk ↗')=>S.safeURL(url)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(S.safeURL(url))+'">'+esc(label)+'</a>':'';
const maps=x=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x||'');
const opts=(values,value,empty)=> (empty!==undefined?'<option value="">'+esc(empty)+'</option>':'')+values.map(v=>{const [key,label]=Array.isArray(v)?v:[v,v];return '<option value="'+esc(key)+'" '+(String(value)===String(key)?'selected':'')+'>'+esc(label)+'</option>';}).join('');
const selectFilter=(key,label,values,empty)=>'<label>'+esc(label)+'<select data-filter="'+key+'">'+opts(values,filters[key],empty)+'</select></label>';
const bar=(n,d)=>'<div class="metric-bar"><span style="width:'+Math.max(0,Math.min(100,d?100*n/d:0))+'%"></span></div>';
const empty=text=>'<div class="empty-section">'+esc(text)+'</div>';
const actions=x=>btn('data-edit="'+esc(x.id)+'"','Redigera')+link(x.url)+(x.location?link(maps(x.location),'Navigera ↗'):'');
const linked=(x,key)=>{const r=S.get(x[key]);return r&&!r.deleted?btn('data-edit="'+esc(r.id)+'"',esc(r.title),'text-button'):'';};
function toast(text,undo){clearTimeout(toastTimer);undoAction=undo||null;$('toast').innerHTML='<span>'+esc(text)+'</span>'+(undo?btn('data-action="undo"','Ångra'):'');$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,undo?12000:5000);}
function utility(title,body){$('utility-title').textContent=title;$('utility-body').innerHTML=body;if(!$('utility').open)$('utility').showModal();$('utility-title').focus({preventScroll:true});}
function setTab(next){tab=next;addingPackingHeading=false;render();const u=new URL(location.href);u.searchParams.set('trip',tripId);u.searchParams.set('tab',tab);history.replaceState(null,'',u);}
function tick(){const t=trip();if(!t||!$('countdown'))return;const c=S.countdown(t.departureISO||t.departure,t.endDate,Date.now(),t.timezone);$('countdown').innerHTML='<p>'+esc(c.label)+'</p><div class="digits">'+c.parts.map((n,i)=>'<div><strong>'+String(n).padStart(2,'0')+'</strong><small>'+['dagar','timmar','minuter','sekunder'][i]+'</small></div>').join('')+'</div>';}
function render(force=false){
 $('sync').textContent=S.status();$('sync').classList.toggle('error',/saknas|blockerad|Kunde/.test(S.status()));
 const renderKey=JSON.stringify([tripId,tab,tripFilter,day,daysWide,filters,S.list()]);if(!force&&lastRenderKey===renderKey)return;
 if(drag||(!force&&document.activeElement?.closest('#content input,#content textarea,#content select,#content [contenteditable="true"]'))){renderPending=true;return;}renderPending=false;lastRenderKey=renderKey;
 const trips=list('trip');if(!trips.some(x=>x.id===tripId))tripId=trips[0]?.id||'';
 $('trip-filters').innerHTML=['Alla','Kommande','Pågående','Tidigare','Arkiverade'].map(x=>btn('data-trip-filter="'+x+'" aria-pressed="'+(tripFilter===x)+'"',x,tripFilter===x?'active':'')).join('');
 $('trips').innerHTML=trips.filter(x=>tripFilter==='Alla'?!x.archived:M.tripState(x)===tripFilter).map(x=>btn('data-trip="'+esc(x.id)+'" aria-pressed="'+(x.id===tripId)+'"',esc(x.title),x.id===tripId?'active':'')).join('')||'<span class="muted">Inga resor i den här gruppen.</span>';
 $('empty').hidden=!!tripId;$('workspace').hidden=!tripId;if(!tripId)return;
 const currentURL=new URL(location.href);currentURL.searchParams.set('trip',tripId);currentURL.searchParams.set('tab',tab);history.replaceState(null,'',currentURL);
 const t=trip();$('hero').innerHTML='<div class="hero">'+(t.coverId?'<img class="hero-cover" data-file="'+esc(t.coverId)+'" alt="">':t.coverURL?'<img class="hero-cover" src="'+esc(S.safeURL(t.coverURL))+'" alt="">':'')+'<div><span class="eyebrow">'+esc(t.destination||'ER RESA')+' · '+M.tripState(t)+'</span><h2>'+esc(t.title)+'</h2><p class="meta">'+esc((t.departure||'').slice(0,10))+' — '+esc(t.endDate||'')+'</p><p class="meta">'+esc(t.travelers||'')+'</p><div class="hero-actions">'+btn('data-edit="'+esc(t.id)+'"','Redigera resa')+btn('data-action="trip-tools"','Hantera resa')+'</div></div><div class="countdown" id="countdown"></div></div>';tick();
 $('tabs').innerHTML=tabs.map(([key,label])=>btn('data-tab="'+key+'" aria-current="'+(tab===key?'page':'false')+'"',label,tab===key?'active':'')).join('');
 const desc=tabs.find(x=>x[0]===tab);$('section-title').textContent=desc[1];$('section-kicker').textContent=desc[2];$('add').hidden=tab==='overview'||tab==='packing';$('add').textContent='+ '+({photo:'Lägg till bilder',packing:'Lägg till sak',task:'Ny uppgift',expense:filters.budget==='plan'?'Planera kostnad':'Ny utgift'}[tab]||'Lägg till '+names[tab]);
 map?.remove();map=null;const views={overview:overview,activity:schedule,packing:packing,task:tasks,expense:expenses,booking:bookings,place:places,photo:photos,document:documents,note:notes};$('content').innerHTML=views[tab]();hydrateImages();if(tab==='place')loadMap();if(tab==='document')checkFiles();
}
function metric(label,value,detail,to,filter=''){return '<button class="card metric metric-link" data-go="'+to+'" '+filter+'><small>'+label+'</small><strong>'+value+'</strong><p>'+detail+'</p></button>';}
function overview(){const t=trip(),p=list('packing'),todos=list('task'),cost=M.budget(list('expense'),list('categoryBudget')),during=M.tripState(t)==='Pågående';const next=list('activity').filter(x=>x.date>currentDay()||(x.date===currentDay()&&(!x.endTime||x.endTime>=M.timeIn(t.timezone)))).sort(M.activitySort);
 const stay=list('booking').filter(x=>x.category==='Boende'&&x.status!=='Avbokat'&&x.date<=currentDay()&&(!x.endDate||x.endDate>=currentDay()));
 return '<div class="grid overview-metrics">'+metric('PACKNING',p.filter(x=>x.done).length+' / '+p.length,p.filter(x=>!x.done).length+' saker kvar','packing','data-status="todo"')+metric('ATT GÖRA',todos.filter(x=>!x.done).length,'förberedelser återstår','task','data-status="todo"')+metric('RESKASSA',money(cost.actual),money((t.budget||0)-cost.actual)+' kvar','expense')+'</div>'+
 '<div class="overview-columns"><section><div class="day-heading">'+(during?'Nästa på programmet':'Kommande upplevelser')+'</div>'+((during?next.filter(x=>x.date===currentDay()):next).slice(0,4).map(agenda).join('')||empty('Dagen är öppen. Lägg till något i schemat.'))+'</section><section><div class="day-heading">'+(during?'Ditt boende & viktiga dokument':'Inför avresan')+'</div>'+(during?stay.map(bookingCard).join('')+list('document').filter(x=>x.important).map(documentRow).join(''):todos.filter(x=>!x.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).slice(0,4).map(taskRow).join('')+list('booking').filter(x=>!x.status||x.status==='Att boka').slice(0,3).map(bookingCard).join(''))+'</section></div>'+(t.notes?'<article class="card overview-notes"><span class="eyebrow">OM RESAN</span><p>'+esc(t.notes)+'</p></article>':'');}
function availableDays(){const t=trip(),set=new Set(list('activity').map(x=>x.date).filter(Boolean));let d=(t.departure||'').slice(0,10),end=t.endDate||d;for(let i=0;d&&d<=end&&i<366;i++,d=M.addDays(d,1))set.add(d);if(!set.size)set.add(currentDay());return [...set].sort();}
function agenda(x){const clash=M.overlaps(x,list('activity'));return '<article class="agenda" data-item="'+esc(x.id)+'"><div class="time">'+esc(x.timing==='allDay'?'Heldag':x.time||'Flexibelt')+'<small>'+esc(x.endTime||'')+(x.endDate&&x.endDate!==x.date?'<br>→ '+esc(x.endDate.slice(5)):'')+'</small></div><div class="info"><small>'+esc(x.category||'Aktivitet')+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(locationOf(x))+'</p>'+(clash.length?'<span class="warning" title="'+esc(clash.map(y=>y.title).join(', '))+'">Överlappar '+clash.length+' aktivitet'+(clash.length>1?'er':'')+'</span>':'')+'<p>'+esc(x.notes||'')+'</p><div class="inline-actions">'+linked(x,'placeId')+linked(x,'bookingId')+link(x.url)+'</div></div><div class="row-actions">'+btn('data-edit="'+esc(x.id)+'"','Ändra')+btn('data-drag="'+esc(x.id)+'" aria-label="Dra '+esc(x.title)+'"','⠿','handle')+'</div></article>';}
function locationOf(x){return S.get(x.placeId)?.location||S.get(x.bookingId)?.location||x.location||'';}
function scheduleHour(h,d,rows){const time=M.clock(h*60);return '<div class="hour" data-drop-date="'+d+'" data-drop-time="'+time+'">'+btn('data-slot="'+d+'|'+time+'" aria-label="Lägg till '+time+'"','<span>'+time+'</span><span>+</span>','time-slot')+rows.filter(x=>x.timing==='timed'&&Number((x.time||'').slice(0,2))===h).map(agenda).join('')+'</div>';}
function schedule(){const days=availableDays();if(!day||!days.includes(day))day=days.includes(currentDay())?currentDay():days[0];const shown=daysWide?days.slice(days.indexOf(day),days.indexOf(day)+3):[day];
 return '<p class="caption muted">Alla tider visas i '+esc(trip().timezone||'Europe/Stockholm')+'</p><div class="schedule-tools">'+btn('data-action="schedule-today"','Idag')+'<label>Välj dag<input type="date" id="schedule-date" value="'+day+'"></label>'+btn('data-action="schedule-width" aria-pressed="'+daysWide+'"',daysWide?'En dag':'Flera dagar','desktop-only')+'</div><div class="day-picker">'+days.map(d=>btn('data-day="'+d+'"',esc(new Date(d+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'short',day:'numeric',month:'short'})),d===day?'active':'')).join('')+'</div><div class="schedule-days '+(daysWide?'multiple':'')+'">'+shown.map(d=>{const rows=list('activity').filter(x=>x.date===d).sort(M.activitySort);return '<section class="schedule-day" data-drop-day="'+d+'"><h3>'+d+'</h3><div class="flexible-zone" data-drop-date="'+d+'" data-drop-time=""><small>HELDAG & FLEXIBELT</small>'+rows.filter(x=>x.timing!=='timed').map(agenda).join('')+btn('data-slot="'+d+'|"','+ Utan bestämd tid','add-slot')+'</div><div class="timeline">'+'<details class="night-hours" '+(rows.some(x=>x.time&&x.time<'07:00')?'open':'')+'><summary>Natt · 00:00–06:00</summary>'+Array.from({length:7},(_,h)=>scheduleHour(h,d,rows)).join('')+'</details>'+Array.from({length:17},(_,h)=>scheduleHour(h+7,d,rows)).join('')+'</div></section>';}).join('')+'</div>';}
function quickForm(type){const draft=read('travel-quick-'+tripId+'-'+type,{});return '<form id="quick-add" class="quick-add" data-type="'+type+'"><input value="'+esc(draft.title||'')+'" name="title" required maxlength="500" autocomplete="off" placeholder="'+(type==='packing'?'Lägg till något att packa…':'Vad behöver göras?')+'" aria-label="'+(type==='packing'?'Ny packsak':'Ny uppgift')+'">'+(type==='packing'?'<input name="quantity" type="number" min="1" value="'+esc(draft.quantity||1)+'" aria-label="Antal">':'')+'<select name="owner" aria-label="Ansvarig">'+opts(members(),draft.owner||(type==='packing'?filters.packingOwner||'Övrigt':filters.taskOwner),'Ansvarig')+'</select>'+btn('data-quick-submit','+','primary')+'</form>';}
function packingRow(x){
 const more=Number(x.quantity||1)!==1||x.unit&&x.unit!=='st' ? '<small class="packing-qty" data-pack-quantity="'+esc(x.id)+'" tabindex="0" title="Ändra antal">'+esc(x.quantity||1)+' '+esc(x.unit||'st')+'</small>' : '';
 return '<div class="check-row '+(x.done?'done':'')+'" data-item="'+esc(x.id)+'"><input type="checkbox" data-check="'+esc(x.id)+'" '+(x.done?'checked':'')+' aria-label="Packat '+esc(x.title)+'"><div class="info"><span class="title pack-item-text" data-pack-title="'+esc(x.id)+'" tabindex="0" aria-label="Redigera '+esc(x.title)+'">'+esc(x.title)+'</span>'+more+'</div>'+btn('data-pack-delete="'+esc(x.id)+'" aria-label="Radera '+esc(x.title)+'"','✕','pack-delete')+btn('data-drag="'+esc(x.id)+'" aria-label="Dra '+esc(x.title)+'"','⠿','handle')+'</div>';
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
function packingSummary(all){
 const done=all.filter(x=>x.done).length;
 return '<strong>'+done+' av '+all.length+' packade</strong>'+bar(done,all.length);
}
function refreshPackingSummary(){
 const summary=document.querySelector('.packing-summary');
 if(summary)summary.innerHTML=packingSummary(list('packing'));
}
function packing(){
 const all=list('packing'),rows=all.filter(x=>filters.packingStatus==='all'||!!x.done===(filters.packingStatus==='done')).sort((a,b)=>Number(a.order||0)-Number(b.order||0));
 const key=filters.packingGroup,groups=packingHeadings(key);
 return '<div class="packing-summary">'+packingSummary(all)+'</div>'+
 '<div class="packing-tools">'+
 '<details class="packing-filter"><summary>☷ Filter</summary><div class="packing-filter-panel">'+
 '<label>Gruppera<select data-filter="packingGroup">'+opts([['owner','Person'],['category','Kategori']],filters.packingGroup)+'</select></label>'+
 '<label>Visa<select data-filter="packingStatus">'+opts([['all','Alla'],['todo','Kvar att packa'],['done','Packat']],filters.packingStatus)+'</select></label>'+
 '<span class="packing-filter-caption">Hoppa till rubrik</span><div class="packing-jumps">'+groups.map(g=>btn('data-pack-jump="'+esc(g)+'"',esc(g))).join('')+'</div>'+
 '<div class="packing-filter-footer">'+btn('data-action="templates"','Packmallar')+'</div></div></details>'+
 btn('data-action="pack-new-heading" aria-expanded="'+addingPackingHeading+'"','+ Rubrik','pack-heading-button')+
 '</div>'+
 (addingPackingHeading?'<form id="packing-new-heading" class="packing-new-heading"><input name="title" maxlength="60" required autocomplete="off" placeholder="Rubrikens namn…" aria-label="Ny rubrik"><button class="primary" type="submit" aria-label="Spara rubrik">✓</button>'+btn('data-action="pack-cancel-heading"','Avbryt','pack-cancel-heading')+'</form>':'')+
 '<div class="packing-groups">'+groups.map(g=>{const items=rows.filter(x=>(x[key]||'Övrigt')===g);return '<section class="packing-group" data-drop-group="'+esc(g)+'"><div class="day-heading"><span class="pack-group-name" data-pack-heading="'+esc(g)+'" tabindex="0" aria-label="Redigera rubrik '+esc(g)+'">'+esc(g)+'</span> <small>'+items.length+'</small></div>'+items.map(packingRow).join('')+inlinePackingForm(g,key)+'</section>';}).join('')+'</div>';
}

/* Match the shopping list's in-place editor: tap text, Enter advances, blur saves, Escape cancels. */
function packingFocusEnd(el){
 try{el.focus({preventScroll:true});}catch(_){el.focus();}
 if(el.isContentEditable){const sel=window.getSelection(),range=document.createRange();range.selectNodeContents(el);range.collapse(false);sel.removeAllRanges();sel.addRange(range);}
}
function packingRenderFingerprint(){
 lastRenderKey=JSON.stringify([tripId,tab,tripFilter,day,daysWide,filters,S.list()]);
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
 if(!value){el.textContent=edit.original;toast('Texten får inte vara tom.');return;}
 if(edit.type==='heading'){
  if(value.length>60||value.includes(',')){el.textContent=edit.original;toast('Rubriken får vara högst 60 tecken och inte innehålla kommatecken.');return;}
  if(packingHeadings(filters.packingGroup).some(x=>x!==edit.original&&x.toLocaleLowerCase('sv-SE')===value.toLocaleLowerCase('sv-SE'))){el.textContent=edit.original;toast('Rubriken finns redan.');return;}
 }
 el.textContent=value;
 const task=edit.type==='item'?S.patch(edit.id,{title:value}):renamePackingHeading(edit.original,value,filters.packingGroup);
 if(openNext)packingFocusNext(edit);
 try{
  await task;
  if(!openNext&&edit.type==='heading'&&tab==='packing'&&edit.tripId===tripId)render(true);
  else packingRenderFingerprint();
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
   const count=group?.querySelector('.day-heading small');if(count)count.textContent=String(Math.max(0,Number(count.textContent||0)-1));
  });
  refreshPackingSummary();packingRenderFingerprint();
  toast('Borttagen.',async()=>{await S.restore(id);render(true);});
 }catch(error){toast(error.message||'Kunde inte ta bort saken.');}
}

function taskRow(x){return '<div class="check-row '+(x.done?'done':'')+'"><input type="checkbox" data-check="'+esc(x.id)+'" '+(x.done?'checked':'')+' aria-label="Klarmarkera '+esc(x.title)+'"><div class="info"><span class="title">'+esc(x.title)+'</span><small>'+esc([x.owner,x.date].filter(Boolean).join(' · '))+'</small>'+linked(x,'bookingId')+'</div>'+btn('data-edit="'+esc(x.id)+'"','Ändra')+'</div>';}
function tasks(){const rows=list('task').filter(x=>(!filters.taskOwner||x.owner===filters.taskOwner)&&(filters.taskStatus==='all'||!!x.done===(filters.taskStatus==='done')));const group=x=>x.taskKind==='unsorted'?'Behöver sorteras':x.done?'Klart':x.date&&x.date<currentDay()?'Försenat':x.date&&x.date<=M.addDays(currentDay(),7)?'Snart':'Senare';return '<div class="filters">'+selectFilter('taskOwner','Ansvarig',members(),'Alla')+selectFilter('taskStatus','Visa',[['all','Alla'],['todo','Kvar'],['done','Klart']])+'</div>'+quickForm('task')+['Behöver sorteras','Försenat','Snart','Senare','Klart'].map(g=>{const items=rows.filter(x=>group(x)===g).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));if(!items.length)return '';return '<section><div class="day-heading">'+g+' · '+items.length+'</div>'+(g==='Behöver sorteras'?'<p class="muted">Äldre poster är kvar. Välj var varje post hör hemma.</p>':'')+items.map(x=>taskRow(x)+(g==='Behöver sorteras'?'<div class="inline-actions">'+btn('data-classify="'+x.id+'|packing"','Till packlistan')+btn('data-classify="'+x.id+'|task"','Behåll som uppgift')+'</div>':'')).join('')+'</section>';}).join('')+(!rows.length?empty('Inga uppgifter här ännu. Lägg till den första ovan.'):'');}
function expenses(){const rows=list('expense'),plans=list('categoryBudget'),sum=M.budget(rows,plans),balance=M.settlement(rows);const cats=[...new Set([...M.categories,...Object.keys(sum.groups)])];return '<div class="segmented">'+[['plan','Planera'],['actual','Utgifter'],['split','Fördelning']].map(([key,label])=>btn('data-budget="'+key+'"',label,filters.budget===key?'active':'')).join('')+'</div><div class="grid budget-summary"><article class="card metric"><small>TOTAL BUDGET</small><strong>'+money(trip().budget)+'</strong>'+btn('data-edit="'+tripId+'"','Ändra budget','text-button')+'</article><article class="card metric"><small>BETALAT</small><strong>'+money(sum.actual)+'</strong></article><article class="card metric"><small>KVAR</small><strong class="'+(sum.actual>Number(trip().budget)?'warning':'')+'">'+money(Number(trip().budget||0)-sum.actual)+'</strong></article></div>'+(filters.budget==='plan'?'<div class="section-subhead"><p>Fördelat: '+money(sum.planned)+'</p>'+btn('data-new="categoryBudget"','+ Egen kategori')+'</div><div class="budget-categories">'+cats.map(c=>{const p=plans.find(x=>x.title===c),s=sum.groups[c]||{planned:0,actual:0};return '<article class="budget-category"><div><h3>'+esc(c)+'</h3><small>'+money(s.actual)+' förbrukat · '+money(s.planned-s.actual)+' kvar</small>'+bar(s.actual,s.planned)+'</div>'+btn('data-category="'+esc(c)+'"'+(p?' data-category-id="'+p.id+'"':''),money(s.planned)+' ✎')+'</article>';}).join('')+'</div><div class="day-heading">Planerade kostnader</div>'+rows.filter(x=>x.planned!=null&&Number(x.planned)>0).map(expenseRow).join(''):filters.budget==='actual'?'<p class="muted caption">Negativt belopp registrerar en återbetalning. Valutakursen sparas med varje betalning.</p><div class="expense-list">'+(rows.filter(x=>x.actual!=null).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(expenseRow).join('')||empty('Inga betalningar registrerade ännu.'))+'</div>':'<p class="muted">Endast utgifter med betalare och fördelning ingår. Positivt saldo betyder att personen har lagt ut mer än sin andel.</p><div class="split-list">'+Object.entries(balance.balances).map(([n,b])=>'<article class="budget-category"><div><h3>'+esc(n)+'</h3><small>Betalat '+money(balance.paid[n]||0)+'</small></div><strong>'+money(b)+'</strong></article>').join('')+'</div><p class="caption muted">'+rows.filter(x=>x.actual!=null&&(!x.payer||!x.splits?.length)).length+' betalningar saknar fullständig fördelning.</p>');}
function expenseRow(x){return '<article class="expense-row"><div><h3>'+esc(x.title)+'</h3><small>'+esc([x.category,x.date,x.payer].filter(Boolean).join(' · '))+'</small><p>'+ (x.actual==null?'Ännu inte betalt':money(x.actual,x.currency))+(x.currency!==trip().currency&&x.actual!=null?' → '+money(M.amount(x))+' · kurs '+esc(x.rate):'')+'</p>'+linked(x,'bookingId')+linked(x,'receiptId')+'</div><div class="row-actions">'+btn('data-edit="'+x.id+'"','Ändra')+(x.actual==null?btn('data-pay="'+x.id+'"','Registrera betalning'):'')+'</div></article>';}
function bookingPayment(x){const rows=list('expense').filter(e=>e.bookingId===x.id),actual=rows.reduce((s,e)=>s+M.amount(e),0);return rows.some(e=>e.actual!=null)?(Number(x.total)>0&&actual>=Number(x.total)?'Betalt':actual>0?'Delbetalt':'Obetalt'):x.paymentStatus||'Obetalt';}
function bookingCard(x){const docs=list('document').filter(d=>d.bookingId===x.id),cost=list('expense').filter(e=>e.bookingId===x.id).reduce((n,e)=>n+M.amount(e),0);return '<article class="booking-card card"><div class="booking-top"><span class="eyebrow">'+esc(x.category||'Bokning')+'</span><span class="badge">'+esc(x.status||'Att boka')+'</span></div><h3>'+esc(x.title)+'</h3><div class="booking-dates"><div><small>'+(/Boende/.test(x.category)?'INCHECKNING':'START / AVGÅNG')+'</small><p>'+esc([x.date,x.time].filter(Boolean).join(' · '))+'</p></div><span>→</span><div><small>'+(/Boende/.test(x.category)?'UTCHECKNING':'SLUT / ANKOMST')+'</small><p>'+esc([x.endDate,x.endTime].filter(Boolean).join(' · '))+'</p></div></div><p>'+esc(x.location||'')+(x.arrivalLocation?' → '+esc(x.arrivalLocation):'')+'</p><p class="muted">'+esc(bookingPayment(x))+' · '+money(cost)+' registrerat</p>'+(x.reference?btn('data-copy="'+esc(x.reference)+'"','Bokningsnr '+esc(x.reference)+' ⧉','reference'):'')+'<div class="inline-actions">'+actions(x)+btn('data-schedule="'+x.id+'"','Lägg i schemat')+btn('data-booking-expense="'+x.id+'"','Betalning')+btn('data-booking-doc="'+x.id+'"','Bifoga dokument')+docs.map(d=>btn('data-preview="'+d.id+'"','Visa '+esc(d.title))).join('')+'</div></article>';}
function bookings(){return '<div class="booking-grid">'+(list('booking').sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).map(bookingCard).join('')||empty('Lägg till ert första boende, transport eller aktivitet.'))+'</div>';}
function places(){const rows=list('place').filter(x=>(!filters.placeCategory||x.category===filters.placeCategory)&&(!filters.placeStatus||!!x.visited===(filters.placeStatus==='visited'))&&(!filters.placeDay||list('activity').some(a=>a.placeId===x.id&&a.date===filters.placeDay)));mapRows=rows;const stops=list('activity').filter(x=>x.date===(filters.placeDay||currentDay())&&locationOf(x)).sort(M.activitySort);return '<div class="filters">'+selectFilter('placeCategory','Kategori',['Sevärdhet','Restaurang','Boende','Vandring','Parkering','Annat'],'Alla')+selectFilter('placeStatus','Status',[['wanted','Vill besöka'],['visited','Besökt']],'Alla')+selectFilter('placeDay','Dag',availableDays(),'Alla dagar')+'</div><div id="map" class="map-frame"><p class="muted">Laddar kartan…</p></div><p id="map-status" class="caption muted">Platser med koordinater visas som markörer. Öppna en plats och välj position på kartan om den saknas.</p>'+(stops.length?'<div class="day-heading">Stopp i ordning · '+esc(filters.placeDay||currentDay())+'</div><ol class="route-list">'+stops.map(x=>'<li>'+esc(x.time||'')+' '+esc(x.title)+' '+link(maps(locationOf(x)),'Vägbeskrivning ↗')+'</li>').join('')+'</ol>':'')+'<div class="grid">'+rows.map(x=>'<article class="card" id="place-'+x.id+'"><small>'+esc(x.category||'')+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.location||'')+'</p><p>'+esc(x.notes||'')+'</p><div class="inline-actions">'+actions(x)+btn('data-visited="'+x.id+'"',x.visited?'✓ Besökt':'Markera besökt')+btn('data-schedule="'+x.id+'"','Lägg i schemat')+btn('data-map-focus="'+x.id+'"','Visa på karta')+'</div></article>').join('')+'</div>'+(rows.length?'':empty('Spara en plats ni vill besöka.'));}
let leafletReady;
async function leaflet(){if(window.L)return window.L;if(!leafletReady)leafletReady=new Promise((resolve,reject)=>{const css=document.createElement('link');css.rel='stylesheet';css.href='vendor/leaflet/leaflet.css';document.head.append(css);const script=document.createElement('script');script.src='vendor/leaflet/leaflet.js';script.onload=()=>resolve(window.L);script.onerror=()=>{leafletReady=null;reject(Error('Kartan kunde inte laddas. Dina sparade platser finns kvar.'));};document.head.append(script);});return leafletReady;}
async function loadMap(){const host=$('map');try{const L=await leaflet();if(!host?.isConnected)return;host.innerHTML='';map=L.map(host,{scrollWheelZoom:false}).setView([58.5,15.3],5);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);const points=[];mapRows.forEach(x=>{if(x.lat==null||x.lat===''||x.lng==null||x.lng==='')return;const pt=[Number(x.lat),Number(x.lng)];points.push(pt);L.circleMarker(pt,{radius:9,color:x.visited?'#86efac':'#fdba74',fillOpacity:.85}).addTo(map).bindPopup('<strong>'+esc(x.title)+'</strong><p>'+esc(x.location)+'</p>'+btn('data-edit="'+x.id+'"','Öppna plats')+btn('data-schedule="'+x.id+'"','Lägg i schemat'));});if(points.length)map.fitBounds(points,{padding:[35,35],maxZoom:14});}catch(e){if(host?.isConnected)host.innerHTML='<p>'+esc(e.message)+'</p>';}}
function photoRows(){return list('photo').filter(x=>!filters.photoDay||x.date===filters.photoDay).sort((a,b)=>Number(a.order||a.createdAt||0)-Number(b.order||b.createdAt||0));}
function photos(){return '<div class="filters">'+selectFilter('photoDay','Dag',availableDays(),'Alla dagar')+'</div><div class="gallery">'+photoRows().map(x=>'<figure data-item="'+x.id+'"><button class="gallery-open" data-photo="'+x.id+'" aria-label="Visa '+esc(x.title)+'"><img '+(x.fileId?'data-file="'+x.fileId+'"':'src="'+esc(S.safeURL(x.url))+'"')+' alt="'+esc(x.title)+'" loading="lazy"></button><figcaption><span>'+esc(x.title)+'</span>'+btn('data-drag="'+x.id+'" aria-label="Dra bild"','⠿','handle')+btn('data-photo-menu="'+x.id+'" aria-label="Bildalternativ"','⋯')+'</figcaption></figure>').join('')+'</div>'+(photoRows().length?'':empty('Ladda upp flera bilder eller spara en bildlänk.'));}
function documentRow(x){return '<article class="document-row"><span class="file-icon">'+(x.fileName?.toLowerCase().endsWith('.pdf')?'PDF':'FIL')+'</span><div><h3>'+(x.important?'★ ':'')+esc(x.title)+'</h3><small>'+esc(x.category||'Övrigt')+'</small>'+linked(x,'bookingId')+'<small data-file-status="'+x.id+'">'+(x.fileId?'Kontrollerar lokal kopia…':'Extern länk · kräver anslutning')+'</small></div><div class="row-actions">'+btn('data-preview="'+x.id+'"','Visa')+(x.fileId?btn('data-download="'+x.id+'"','Ladda ned'):'')+btn('data-edit="'+x.id+'"','Ändra')+'</div></article>';}
function documents(){const rows=list('document').filter(x=>!filters.documentCategory||x.category===filters.documentCategory).sort((a,b)=>Number(!!b.important)-Number(!!a.important));return '<div class="filters">'+selectFilter('documentCategory','Kategori',['Biljetter','Bokningsbekräftelser','Kvitton','Övrigt'],'Alla')+'</div>'+rows.map(documentRow).join('')+(rows.length?'':empty('Lägg till biljetter, bekräftelser och andra bilagor.'));}
function noteText(text){return String(text||'').split('\n').map(line=>line.startsWith('# ')?'<h3>'+esc(line.slice(2))+'</h3>':line.startsWith('- ')?'<p class="note-bullet">• '+esc(line.slice(2))+'</p>':'<p>'+esc(line)+'</p>').join('');}
function notes(){return '<div class="notes-grid">'+list('note').sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||Number(b.updatedAt)-Number(a.updatedAt)).map(x=>'<article class="card note-card"><div class="booking-top"><small>'+esc(x.date||'')+'</small>'+btn('data-pin="'+x.id+'"',x.pinned?'★ Fäst':'☆ Fäst')+'</div><h3>'+esc(x.title)+'</h3><div class="note-content">'+noteText(x.notes)+'</div>'+linked(x,'placeId')+'<div class="inline-actions">'+actions(x)+btn('data-note-activity="'+x.id+'"','Skapa aktivitet')+btn('data-note-task="'+x.id+'"','Skapa uppgift')+'</div></article>').join('')+'</div>'+(list('note').length?'':empty('Samla idéer, länkar och sådant ni vill komma ihåg.'));}
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
function fieldHTML(f,v){const val=v[f.key]??'';let input,attrs=' name="'+f.key+'" '+(f.required?'required ':'')+(f.min!==undefined?'min="'+f.min+'" ':'')+(f.max!==undefined?'max="'+f.max+'" ':'');
 if(f.kind==='select')input='<select'+attrs+'>'+opts(f.options,val,f.empty)+'</select>';
 else if(f.kind==='textarea')input='<textarea'+attrs+' rows="'+(editing?.type==='note'?10:3)+'" placeholder="'+esc(f.placeholder||'')+'">'+esc(val)+'</textarea>';
 else if(f.kind==='checkbox')input='<input'+attrs+' type="checkbox" '+(val?'checked':'')+'>';
 else if(f.kind==='file')input='<input'+attrs+' type="file" accept="'+f.accept+'" '+(f.multiple?'multiple':'')+'>';
 else if(f.kind==='map')input=btn('data-action="pick-coordinate"','Placera en markör')+'<div id="coordinate-map" hidden></div>';
 else input='<input'+attrs+' type="'+f.kind+'" '+(f.kind==='number'?'step="any" inputmode="decimal"':'')+' '+(f.kind==='text'?'maxlength="500"':'')+' value="'+esc(val)+'" '+(f.suggest?'list="suggest-'+f.key+'"':'')+'>'+(f.suggest?'<datalist id="suggest-'+f.key+'">'+f.suggest.map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist>':'');
 return '<label class="'+(f.wide||['map','checkbox'].includes(f.kind)?'wide':'')+' '+(f.kind==='checkbox'?'check-label':'')+'">'+esc(f.label)+input+'</label>';
}
function defaults(type){return {packingPeople:M.people.join(', '),currency:trip()?.currency||'SEK',rate:1,date:day||currentDay(),timezone:trip()?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Stockholm',arrivalTimezone:trip()?.timezone||'Europe/Stockholm',timing:'timed',category:type==='booking'?'Boende':type==='packing'?'Övrigt':'',quantity:1,unit:'st',owner:'Övrigt',status:'Att boka',entryKind:filters.budget==='plan'?'plan':'payment',showHome:true,taskKind:'todo'};}
function openEditor(type,id,prefill={}){
 if($('utility').open)$('utility').close();const key='travel-draft-'+type+'-'+(id||(type==='trip'?'new':tripId));let base=id?{...defaults(type),...S.get(id)}:defaults(type);if(base.splits)base.splitText=base.splits.map(x=>x.name+':'+x.weight).join(', ');const draft=read(key,null);let value={...base,...draft,...prefill};editing={type,id,key,base,extra:prefill.scheduleFromBooking?{scheduleFromBooking:true}:{},fields:[],uploads:[],savedUploads:{}};
 $('edit-title').textContent=(id?'Redigera ':'Ny ')+names[type];$('form-error').textContent=draft?'Ett tidigare utkast har återställts.':'';$('delete').hidden=!id;drawEditor(value);$('editor').showModal();$('edit-title').focus({preventScroll:true});
}
function drawEditor(value){editing.fields=fieldsFor(editing.type,value);$('fields').innerHTML=editing.fields.map(f=>fieldHTML(f,value)).join('')+'<div class="wide inline-actions">'+btn('data-action="discard-draft"','Kasta textutkast','text-button')+'</div>';}
function formData(){const out={};for(const f of editing.fields){const el=$('edit-form').elements[f.key];if(!el||['file','map'].includes(f.kind))continue;out[f.key]=f.kind==='checkbox'?el.checked:f.kind==='number'?(el.value===''?null:Number(el.value)):el.value.trim();}return out;}
function keepDraft(){if(!editing)return;try{localStorage.setItem(editing.key,JSON.stringify(formData()));}catch(_){$('form-error').textContent='Utkastet kunde inte sparas på enheten. Spara innan du lämnar.';}}
function closeEditor(){keepDraft();$('editor').close();editing=null;render();}
function readData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Filen kunde inte läsas.'));r.readAsDataURL(file);});}
async function prepareFile(file){if(file.type==='application/pdf'){if(file.size>1024*1024)throw Error('PDF-filen får vara högst 1 MB. Lägg till större dokument som länk.');return readData(file);}if(!file.type.startsWith('image/'))throw Error('Välj en bild eller PDF.');const img=new Image();img.src=await readData(file);await img.decode();const scale=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);let data=c.toDataURL('image/jpeg',.78);if(data.length>1400000)data=c.toDataURL('image/jpeg',.5);if(data.length>1400000)throw Error('Bilden är för stor. Välj en mindre bild.');return data;}
async function saveEditor(event){event.preventDefault();if(!editing)return;const submit=$('edit-form').querySelector('[type=submit]');submit.disabled=true;
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
 const changes=[];if(type==='categoryBudget'&&old&&value.title!==old.title)for(const x of list('expense').filter(x=>x.category===old.title))changes.push({id:x.id,changes:{category:value.title}});if(type==='booking'&&old){for(const a of list('activity').filter(x=>x.bookingId===old.id&&x.scheduleFromBooking)){const patch={},before=M.bookingSchedule(old,trip().timezone),after=M.bookingSchedule(value,trip().timezone);for(const k of ['title','date','time','endDate','endTime','location','url'])if(after[k]!==before[k]&&a[k]===before[k])patch[k]=after[k];if(Object.keys(patch).length)changes.push({id:a.id,changes:patch});}}let ids=[],finalTrip=tripId;
 if(type==='trip'&&old?.departure&&value.departure.slice(0,10)!==old.departure.slice(0,10)){
  const delta=M.dayDiff(old.departure,value.departure),moves=M.shifted(allForTrip(),delta);if(moves.length){const shift=await chooseShift(moves,delta);if(shift===null)return;if(shift)changes.push(...moves);}
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
 await S.batch(changes);localStorage.removeItem(editing.key);editing=null;$('editor').close();tripId=finalTrip;remember('travel-selected-v2',tripId);render(true);toast(ids.length>1?ids.length+' bilder sparade.':'Sparat.');
 }catch(e){$('form-error').textContent=(e.message||'Kunde inte spara.')+' Ditt utkast finns kvar; försök igen.';keepDraft();}finally{submit.disabled=false;}
}
function chooseShift(moves,delta){return new Promise(resolve=>{utility('Flytta schemat med resan?','<p>Avresan flyttas '+delta+' dagar. Välj om '+moves.length+' aktiviteter ska följa med.</p><ul class="shift-preview">'+moves.map(m=>'<li>'+esc(S.get(m.id)?.title)+'<br><small>'+esc(S.get(m.id)?.date)+' → '+m.changes.date+'</small></li>').join('')+'</ul><div class="dialog-actions">'+btn('data-shift="yes"','Flytta aktiviteter','primary')+btn('data-shift="no"','Behåll datumen')+btn('data-shift="cancel"','Avbryt')+'</div>');const dlg=$('utility');const finish=v=>{dlg.removeEventListener('click',click);dlg.removeEventListener('close',cancel);dlg.close();resolve(v);};const click=e=>{const b=e.target.closest('[data-shift]');if(b)finish(b.dataset.shift==='cancel'?null:b.dataset.shift==='yes');};const cancel=()=>finish(null);dlg.addEventListener('click',click);dlg.addEventListener('close',cancel);});}
function templatePanel(){utility('Packmallar','<form id="save-template" class="quick-add"><input name="title" required placeholder="Namn på ny mall" aria-label="Mallnamn">'+btn('data-template-save','Spara nuvarande lista','primary')+'</form><p class="muted">Mallar innehåller saker, antal, personer och kategorier. Packmarkeringar följer aldrig med.</p>'+list('packTemplate').map(x=>'<article class="expense-row"><div><h3>'+esc(x.title)+'</h3><small>'+(x.items||[]).length+' saker</small></div><div class="row-actions">'+btn('data-template-apply="'+x.id+'"','Lägg till i resan')+btn('data-remove="'+x.id+'"','Ta bort')+'</div></article>').join(''));}
function tripTools(){const t=trip();utility('Hantera '+t.title,'<div class="tool-grid">'+btn('data-action="duplicate"','Duplicera resa')+btn('data-action="archive"',t.archived?'Återställ från arkiv':'Arkivera resa')+btn('data-action="print"','Skriv ut reseplan')+btn('data-remove="'+t.id+'"','Flytta resa till papperskorg','danger')+'</div>');}
function duplicatePanel(){utility('Duplicera resa','<form id="duplicate-form"><label>Namn<input name="title" value="'+esc(trip().title+' · kopia')+'" required></label><label class="check-label"><input type="checkbox" name="schedule" checked>Schema, platser, bokningar och bilagor</label><label class="check-label"><input type="checkbox" name="packing" checked>Packlista · återställ markeringar</label><label class="check-label"><input type="checkbox" name="budget" checked>Budgetplan · utan betalningar</label><p class="muted">Den ursprungliga resan behålls. Bokningsnummer och betalningsstatus följer inte med.</p><button class="primary" type="submit">Skapa kopia</button><p role="alert" class="utility-error"></p></form>');}
async function removeItem(id){const x=S.get(id);if(!x)return;if(!confirm('Flytta '+x.title+' till papperskorgen? Innehållet kan återställas.'))return;await S.remove(id);if($('editor').open&&editing?.id===id){localStorage.removeItem(editing.key);editing=null;$('editor').close();}if($('utility').open)$('utility').close();render(true);toast('Flyttad till papperskorgen.',async()=>{await S.restore(id);render();});}
function trash(){const rows=S.list().filter(x=>x.deleted);$('trash-list').innerHTML=rows.map(x=>'<article class="card"><small>'+esc(names[x.type]||'Post')+' · '+esc(S.get(x.tripId)?.title||'')+'</small><h3>'+esc(x.title)+'</h3>'+btn('data-restore="'+x.id+'"','Återställ')+'</article>').join('')||empty('Papperskorgen är tom.');if(!$('trash-dialog').open)$('trash-dialog').showModal();}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function fileBlob(x){return (await fetch(await S.file(x.fileId))).blob();}
let viewerURL;
async function preview(id){const x=S.get(id);if(!x)return;if(viewerURL){URL.revokeObjectURL(viewerURL);viewerURL=null;}$('viewer-body').innerHTML='<p>Laddar '+esc(x.title)+'…</p>';$('viewer').showModal();try{if(!x.fileId){$('viewer-body').innerHTML='<h2>'+esc(x.title)+'</h2>'+link(x.url,'Öppna dokument ↗');return;}const blob=await fileBlob(x);viewerURL=URL.createObjectURL(blob);$('viewer-body').innerHTML='<h2>'+esc(x.title)+'</h2>'+(blob.type==='application/pdf'?'<iframe class="pdf-preview" title="'+esc(x.title)+'" src="'+viewerURL+'"></iframe>':'<img class="viewer-image" alt="'+esc(x.title)+'" src="'+viewerURL+'">')+'<div class="inline-actions">'+btn('data-download="'+id+'"','Ladda ned')+'</div>';}catch(e){$('viewer-body').innerHTML='<p>'+esc(e.message)+'</p>'+btn('data-preview-retry="'+id+'"','Försök igen');}}
async function showPhoto(index){const rows=photoRows();if(!rows.length)return;viewerIndex=(index+rows.length)%rows.length;const x=rows[viewerIndex];$('viewer-body').innerHTML='<figure class="lightbox"><img class="viewer-image" '+(x.fileId?'data-file="'+x.fileId+'"':'src="'+esc(S.safeURL(x.url))+'"')+' alt="'+esc(x.title)+'"><figcaption>'+esc(x.title)+' · '+(viewerIndex+1)+' / '+rows.length+'</figcaption></figure><div class="viewer-controls">'+btn('data-photo-step="-1" aria-label="Föregående bild"','←')+btn('data-photo-menu="'+x.id+'"','Alternativ')+btn('data-photo-step="1" aria-label="Nästa bild"','→')+'</div>';if(!$('viewer').open)$('viewer').showModal();hydrateImages();}
function photoMenu(id){const x=S.get(id);if($('viewer').open)$('viewer').close();utility(x.title,'<div class="tool-grid">'+btn('data-edit="'+id+'"','Redigera bildtext och koppling')+btn('data-cover="'+id+'"','Använd som omslag')+btn('data-remove="'+id+'"','Ta bort','danger')+'</div>');}
async function pickCoordinate(){const host=$('coordinate-map');host.hidden=false;const L=await leaflet();if(!host.isConnected)return;host.innerHTML='';const lat=$('edit-form').elements.lat,lng=$('edit-form').elements.lng;const center=lat.value&&lng.value?[Number(lat.value),Number(lng.value)]:[58.5,15.3];const m=L.map(host,{scrollWheelZoom:false}).setView(center,lat.value?13:5);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(m);let marker;if(lat.value&&lng.value)marker=L.circleMarker(center,{color:'#fdba74'}).addTo(m);m.on('click',e=>{lat.value=e.latlng.lat.toFixed(6);lng.value=e.latlng.lng.toFixed(6);if(marker)marker.setLatLng(e.latlng);else marker=L.circleMarker(e.latlng,{color:'#fdba74'}).addTo(m);keepDraft();});}
function printTrip(){const t=trip(),w=window.open('','_blank');if(!w){toast('Tillåt popup för utskrift.');return;}w.document.write('<!doctype html><html lang="sv"><meta charset="utf-8"><title>'+esc(t.title)+'</title><style>body{font:14px system-ui;max-width:900px;margin:35px}article{break-inside:avoid;border-bottom:1px solid #ddd;padding:12px 0}p{white-space:pre-wrap}small{color:#666}</style><h1>'+esc(t.title)+'</h1><p>'+esc(t.destination)+' · '+esc(t.departure)+' — '+esc(t.endDate)+'</p>'+tabs.filter(x=>!['overview','photo'].includes(x[0])).map(([type,label])=>'<h2>'+label+'</h2>'+list(type).sort(type==='activity'?M.activitySort:(a,b)=>Number(a.createdAt)-Number(b.createdAt)).map(x=>'<article><strong>'+(['packing','task'].includes(type)?(x.done?'☑ ':'☐ '):'')+esc(x.title)+'</strong><p>'+esc([x.date,x.time,x.endTime,locationOf(x),x.owner,x.quantity?x.quantity+' '+(x.unit||'st'):'',x.reference,x.status].filter(Boolean).join(' · '))+'</p>'+(type==='expense'?'<p>Planerat '+money(x.planned,x.currency)+' · Betalat '+(x.actual==null?'Ej registrerat':money(x.actual,x.currency))+'</p>':'')+'<p>'+esc(x.notes)+'</p>'+link(x.url)+'</article>').join('')).join('')+'</html>');w.document.close();w.focus();w.print();}
async function scheduleSource(id){const x=S.get(id);const existing=list('activity').find(a=>(x.type==='booking'?a.bookingId:a.sourceId)===id);if(existing)return openEditor('activity',existing.id);const pre={title:x.title,date:x.date||day||currentDay(),time:x.time||'',endTime:x.endTime||'',endDate:x.endDate||'',timing:x.time?'timed':'flex',notes:x.notes||'',location:x.location||'',url:x.url||'',category:x.type==='booking'?(['Flyg','Tåg','Färja','Hyrbil'].includes(x.category)?'Transport':x.category==='Boende'?'Boende':'Aktivitet'):'Aktivitet'};if(x.type==='booking'){Object.assign(pre,M.bookingSchedule(x,trip().timezone));pre.bookingId=id;pre.scheduleFromBooking=true;}else pre.placeId=id;openEditor('activity',null,pre);}
async function click(event){const b=event.target.closest('button');if(!b)return;try{
 if(b.dataset.close){$(b.dataset.close).close();return;}
 if(b.dataset.new)return openEditor(b.dataset.new);
 if(b.dataset.trip){tripId=b.dataset.trip;day='';addingPackingHeading=false;remember('travel-selected-v2',tripId);return render(true);}
 if(b.dataset.tripFilter){tripFilter=b.dataset.tripFilter;return render(true);}
 if(b.dataset.tab)return setTab(b.dataset.tab);
 if(b.dataset.go){if(b.dataset.status){if(b.dataset.go==='packing')filters.packingStatus=b.dataset.status;if(b.dataset.go==='task')filters.taskStatus=b.dataset.status;}return setTab(b.dataset.go);}
 if(b.dataset.edit)return openEditor(S.get(b.dataset.edit).type,b.dataset.edit);
 if(b.dataset.packDelete){await removePackingItem(b.dataset.packDelete);return;}
 if(b.dataset.day){day=b.dataset.day;return render(true);}
 if(b.dataset.slot!==undefined){const [date,time]=b.dataset.slot.split('|');return openEditor('activity',null,{date,time,timing:time?'timed':'flex'});}
 if(b.dataset.packJump!==undefined){document.querySelector('.packing-filter')?.removeAttribute('open');const section=[...document.querySelectorAll('.packing-group')].find(x=>x.dataset.dropGroup===b.dataset.packJump);section?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(b.dataset.owner){filters.packingOwner=b.dataset.owner;return render(true);}
 if(b.dataset.budget){filters.budget=b.dataset.budget;return render(true);}
 if(b.dataset.category)return openEditor('categoryBudget',b.dataset.categoryId,{title:b.dataset.category});
 if(b.dataset.classify){const [id,type]=b.dataset.classify.split('|');await S.patch(id,{type,taskKind:'todo',quantity:1,category:type==='packing'?'Övrigt':S.get(id).category});return;}
 if(b.dataset.pay){const x=S.get(b.dataset.pay);return openEditor('expense',null,{title:x.title,category:x.category,currency:x.currency,rate:x.rate,actual:x.planned,bookingId:x.bookingId||'',entryKind:'payment'});}
 if(b.dataset.bookingExpense){const x=S.get(b.dataset.bookingExpense);return openEditor('expense',null,{title:x.title,bookingId:x.id,category:x.category==='Boende'?'Boende':'Transport',entryKind:'payment'});}
 if(b.dataset.bookingDoc)return openEditor('document',null,{bookingId:b.dataset.bookingDoc,category:'Bokningsbekräftelser'});
 if(b.dataset.schedule)return scheduleSource(b.dataset.schedule);
 if(b.dataset.copy){try{await navigator.clipboard.writeText(b.dataset.copy);toast('Bokningsnumret kopierat.');}catch(_){utility('Kopiera bokningsnummer','<input readonly value="'+esc(b.dataset.copy)+'" aria-label="Bokningsnummer"><p>Markera och kopiera numret.</p>');}return;}
 if(b.dataset.visited){const x=S.get(b.dataset.visited);await S.patch(x.id,{visited:!x.visited});return;}
 if(b.dataset.mapFocus){const x=S.get(b.dataset.mapFocus);if(map&&x.lat!=null&&x.lat!==''&&x.lng!=null&&x.lng!==''){map.setView([Number(x.lat),Number(x.lng)],14);$('map').scrollIntoView({behavior:'smooth',block:'center'});}else openEditor('place',x.id);return;}
 if(b.dataset.photo)return showPhoto(photoRows().findIndex(x=>x.id===b.dataset.photo));
 if(b.dataset.photoStep)return showPhoto(viewerIndex+Number(b.dataset.photoStep));
 if(b.dataset.photoMenu)return photoMenu(b.dataset.photoMenu);
 if(b.dataset.cover){const x=S.get(b.dataset.cover);await S.patch(tripId,{coverId:x.fileId||'',coverURL:x.fileId?'':x.url});$('utility').close();return;}
 if(b.dataset.preview||b.dataset.previewRetry){if($('viewer').open)$('viewer').close();return preview(b.dataset.preview||b.dataset.previewRetry);}
 if(b.dataset.download){const x=S.get(b.dataset.download);return download(await fileBlob(x),x.fileName||x.title);}
 if(b.dataset.offline){await S.file(S.get(b.dataset.offline).fileId);await checkFiles();toast('Dokumentet är sparat för offlinevisning.');return;}
 if(b.dataset.pin){const x=S.get(b.dataset.pin);await S.patch(x.id,{pinned:!x.pinned});return;}
 if(b.dataset.noteActivity||b.dataset.noteTask){const x=S.get(b.dataset.noteActivity||b.dataset.noteTask);return openEditor(b.dataset.noteActivity?'activity':'task',null,{title:x.title,notes:x.notes||'',url:x.url||'',date:x.date||day||currentDay(),placeId:x.placeId||'',timing:'flex'});}
 if(b.dataset.templateApply){const x=S.get(b.dataset.templateApply);await S.batch((x.items||[]).map(item=>({id:S.uid(),changes:{...item,type:'packing',tripId,done:false,deleted:false,createdAt:Date.now()}})));$('utility').close();toast('Packmallen har lagts till.');return;}
 if(b.dataset.remove)return removeItem(b.dataset.remove);
 if(b.dataset.restore){const x=S.get(b.dataset.restore);const parent=S.get(x.tripId);if(parent?.deleted){if(!confirm('Resan ligger också i papperskorgen. Återställ resan tillsammans med posten?'))return;await S.batch([{id:parent.id,changes:{deleted:false}},{id:x.id,changes:{deleted:false}}]);}else await S.restore(x.id);trash();return;}
 if(b.hasAttribute('data-quick-submit'))return b.closest('form').requestSubmit();
 if(b.hasAttribute('data-template-save'))return b.closest('form').requestSubmit();
 if(b.id==='add')return openEditor(tab);
 if(b.id==='close')return closeEditor();
 if(b.id==='delete')return removeItem(editing.id);
 if(b.id==='trash')return trash();if(b.id==='close-trash')return $('trash-dialog').close();
 if(b.id==='export'){toast('Förbereder backup med filer…');download(new Blob([JSON.stringify(await S.exportBackup(),null,2)],{type:'application/json'}),'familjens-resor.json');return;}
 const act=b.dataset.action;
 if(act==='undo'&&undoAction){const undo=undoAction;undoAction=null;await undo();$('toast').hidden=true;}
 if(act==='trip-tools')tripTools();if(act==='duplicate')duplicatePanel();
 if(act==='archive'){await S.patch(tripId,{archived:!trip().archived});$('utility').close();render(true);}
 if(act==='print')printTrip();if(act==='templates'){document.querySelector('.packing-filter')?.removeAttribute('open');templatePanel();}
 if(act==='pack-new-heading'){addingPackingHeading=true;render(true);$('packing-new-heading')?.elements.title.focus({preventScroll:true});return;}
 if(act==='pack-cancel-heading'){addingPackingHeading=false;render(true);return;}
 if(act==='schedule-today'){day=currentDay();if(!availableDays().includes(day))return openEditor('activity',null,{date:day,timing:'flex'});render(true);}
 if(act==='schedule-width'){daysWide=!daysWide;render(true);}
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

document.addEventListener('click',click);
$('edit-form').addEventListener('submit',saveEditor);
$('edit-form').addEventListener('input',keepDraft);
document.addEventListener('input',e=>{const f=e.target.closest('#quick-add');if(f)remember('travel-quick-'+tripId+'-'+f.dataset.type,Object.fromEntries(new FormData(f)));const inline=e.target.closest('.packing-inline-add');if(inline)remember('travel-pack-inline-'+tripId+'-'+inline.dataset.packKey+'-'+inline.dataset.packGroup,e.target.value);});
$('editor').addEventListener('cancel',()=>{keepDraft();editing=null;});
document.addEventListener('change',async e=>{const el=e.target;try{
 if(el.dataset.check){
  const done=el.checked,id=el.dataset.check;
  await S.patch(id,{done});
  if(tab==='packing'&&filters.packingStatus==='all'&&el.isConnected){
   el.closest('.check-row')?.classList.toggle('done',done);
   refreshPackingSummary();
   lastRenderKey=JSON.stringify([tripId,tab,tripFilter,day,daysWide,filters,S.list()]);
   renderPending=false;
  }else render(true);
 }
 if(el.dataset.filter){filters[el.dataset.filter]=el.value;render(true);}
 if(el.id==='schedule-date'){day=el.value;if(!availableDays().includes(day)){openEditor('activity',null,{date:day,timing:'flex'});}else render(true);}
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
 const old=key==='owner'?(trip()?.packingPeople||M.people.join(', ')):(trip()?.packingCategories||'');
 const next=[...old.split(',').map(x=>x.trim()).filter(Boolean),value];
 try{
  await S.patch(selectedTrip,{[field]:next.join(', ')});
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
    const count=form.closest('.packing-group')?.querySelector('.day-heading small');
    if(count)count.textContent=String(Number(count.textContent||0)+1);
   }
   refreshPackingSummary();
   // The saved list is already reflected in the DOM; do not tear down the active iOS input.
   lastRenderKey=JSON.stringify([tripId,tab,tripFilter,day,daysWide,filters,S.list()]);
   renderPending=false;
  }
 }catch(err){
  if(form.isConnected&&!input.value)input.value=title;
  remember(draftKey,input.value||title);
  toast(err.message||'Kunde inte spara saken.');
 }
});
document.addEventListener('submit',async e=>{const form=e.target;if(!['quick-add','save-template','duplicate-form'].includes(form.id))return;e.preventDefault();const data=new FormData(form),submit=form.querySelector('button');submit.disabled=true;try{
 if(form.id==='quick-add'){const title=String(data.get('title')||'').trim();if(!title)return;const type=form.dataset.type,row={title,owner:data.get('owner')||'Övrigt',quantity:Number(data.get('quantity')||1),category:filters.packingGroup==='category'?'Övrigt':'Övrigt',unit:'st',done:false,taskKind:'todo',showHome:true,order:Date.now()};M.validate({...row,type});await S.add(type,tripId,row);localStorage.removeItem('travel-quick-'+tripId+'-'+type);form.reset();render(true);}
 if(form.id==='save-template'){const title=String(data.get('title')||'').trim();if(!title)return;const items=list('packing').map(({title,quantity,unit,owner,category,notes,order})=>({title,quantity:quantity||1,unit:unit||'st',owner:owner||'Övrigt',category:category||'Övrigt',notes:notes||'',order:order||0}));await S.add('packTemplate','',{title,items});templatePanel();toast('Packmallen sparad.');}
 if(form.id==='duplicate-form'){const rows=M.cloneTrip(trip(),S.list(),{title:data.get('title'),schedule:data.has('schedule'),packing:data.has('packing'),budget:data.has('budget')},S.uid);await S.batch(rows.map(x=>({id:x.id,changes:{...x,createdAt:Date.now()}})));tripId=rows[0].id;day='';$('utility').close();remember('travel-selected-v2',tripId);render(true);toast('Resan har kopierats.');}
 }catch(err){const target=form.querySelector('.utility-error');if(target)target.textContent=err.message;else toast(err.message);}finally{submit.disabled=false;}});
document.addEventListener('focusout',()=>{if(renderPending)setTimeout(()=>{if(!document.activeElement?.closest('#content input,#content textarea,#content select,#content [contenteditable="true"]'))render();},150);});
// The drag ghost follows every pointer move. Drop changes domain data, never just visual order.
document.addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-drag]');if(!handle||e.button>0)return;const source=handle.closest('[data-item]');if(!source)return;e.preventDefault();const rect=source.getBoundingClientRect(),ghost=source.cloneNode(true);ghost.classList.add('drag-ghost');ghost.style.cssText='left:'+rect.left+'px;top:'+rect.top+'px;width:'+rect.width+'px;margin:0';ghost.setAttribute('aria-hidden','true');const hint=document.createElement('div');hint.className='drag-hint';hint.textContent='Dra till önskad plats';ghost.append(hint);document.body.append(ghost);source.classList.add('drag-source');drag={id:handle.dataset.drag,pointer:e.pointerId,ghost,source,hint,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,target:null};handle.setPointerCapture?.(e.pointerId);});
function dragTarget(x,y){const el=document.elementFromPoint(x,y);const item=S.get(drag.id);if(item.type==='activity'){const dayButton=el?.closest('[data-day]');if(dayButton){return {date:dayButton.dataset.day,time:item.time||''};}const zone=el?.closest('[data-drop-date]');if(zone){let time=zone.dataset.dropTime;if(time){const rect=zone.getBoundingClientRect();time=M.clock(Math.min(1439,M.minutes(time)+Math.floor(Math.max(0,Math.min(.999,(y-rect.top)/rect.height))*4)*15));}return {date:zone.dataset.dropDate,time};}}
 if(item.type==='packing'){const group=el?.closest('[data-drop-group]');if(group)return {group:group.dataset.dropGroup,before:el.closest('[data-item]')?.dataset.item||''};}
 if(item.type==='photo'){const target=el?.closest('.gallery [data-item]');if(target)return {before:target.dataset.item};}return null;}
document.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();drag.x=e.clientX;drag.y=e.clientY;drag.ghost.style.transform='translate('+(e.clientX-drag.startX)+'px,'+(e.clientY-drag.startY)+'px)';drag.target=dragTarget(e.clientX,e.clientY);drag.hint.textContent=drag.target?.date?drag.target.date+' · '+(drag.target.time||'Flexibelt'):drag.target?.group?'Till '+drag.target.group:drag.target?'Flytta hit':'Dra till en dag, tid eller grupp';if(e.clientY<90)window.scrollBy(0,-14);if(e.clientY>innerHeight-90)window.scrollBy(0,14);},{passive:false});
async function endDrag(e){if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;d.ghost.remove();d.source.classList.remove('drag-source');if(e.type!=='pointerup'||!d.target)return render(true);try{const x=S.get(d.id),target=d.target;if(x.type==='activity')await S.patch(x.id,M.moveActivity(x,target.date,target.time));else {const rows=(x.type==='photo'?photoRows():list('packing').filter(y=>(y[filters.packingGroup]||'Övrigt')===target.group)).filter(y=>y.id!==x.id).sort((a,b)=>Number(a.order||a.createdAt||0)-Number(b.order||b.createdAt||0));const at=rows.findIndex(y=>y.id===target.before);rows.splice(at<0?rows.length:at,0,x);await S.batch(rows.map((y,i)=>({id:y.id,changes:{order:i,...(y.id===x.id&&x.type==='packing'?{[filters.packingGroup]:target.group}:{})}})));}render(true);toast('Flyttad.');}catch(err){toast(err.message);render(true);}}
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);
let swipeX=0;$('viewer').addEventListener('touchstart',e=>swipeX=e.changedTouches[0].clientX,{passive:true});$('viewer').addEventListener('touchend',e=>{if(!$('viewer').querySelector('.lightbox'))return;const delta=e.changedTouches[0].clientX-swipeX;if(Math.abs(delta)>45)showPhoto(viewerIndex+(delta<0?1:-1));},{passive:true});
document.addEventListener('keydown',e=>{if($('viewer').open&&$('viewer').querySelector('.lightbox')){if(e.key==='ArrowRight')showPhoto(viewerIndex+1);if(e.key==='ArrowLeft')showPhoto(viewerIndex-1);}});
$('viewer').addEventListener('close',()=>{if(viewerURL){URL.revokeObjectURL(viewerURL);viewerURL=null;}$('viewer-body').innerHTML='';});
if('serviceWorker' in navigator)navigator.serviceWorker.register('travel-sw.js',{scope:'./travel.html'}).catch(()=>{});
S.subscribe(()=>render());S.ready.then(()=>render());setInterval(tick,1000);
})();
