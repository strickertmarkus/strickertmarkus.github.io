(function(){
'use strict';
const S=window.TravelStore,$=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let tripId=localStorage.getItem('travel-selected')||'',tab='overview',editing=null,toastTimer,drag=null;
const tabs=[['overview','Översikt','RESAN I KORTHET'],['activity','Schema','DAG FÖR DAG'],['place','Platser & karta','HIT VILL VI'],['expense','Budget','HÅLL KOLL PÅ RESKASSAN'],['booking','Bokningar','ALLT PÅ ETT STÄLLE'],['task','Packning & att göra','REDO FÖR AVRESA'],['photo','Bilder','UTSIKTER & MINNEN'],['document','Dokument','BILJETTER & BILAGOR'],['note','Anteckningar','IDÉER ATT SPARA']];
const names={trip:'resa',activity:'aktivitet',place:'plats',expense:'kostnad',booking:'bokning',task:'uppgift',photo:'bild',document:'dokument',note:'anteckning'};
// Field definitions are shared by create/edit/imported records.
const schema={
 trip:[['title','Resans namn','text','required'],['destination','Resmål','text'],['departure','Avresa (din lokala tid)','datetime-local','required'],['endDate','Hemresedatum','date'],['travelers','Resenärer (kommaseparerade)','text'],['currency','Basvaluta','select:SEK,EUR,NOK,DKK,USD,GBP'],['budget','Total budget i basvalutan','number'],['notes','Om resan','textarea']],
 activity:[['title','Aktivitet','text','required'],['date','Datum','date','required'],['time','Starttid','time'],['endTime','Sluttid','time'],['category','Typ','select:Aktivitet,Transport,Mat,Boende,Vila'],['location','Plats / adress','text'],['url','Länk','url'],['notes','Anteckningar','textarea']],
 place:[['title','Platsens namn','text','required'],['location','Adress eller koordinater (lat, lng)','text','required'],['category','Typ','select:Sevärdhet,Restaurang,Boende,Vandring,Parkering,Annat'],['url','Hemsida / kartlänk','url'],['notes','Anteckningar','textarea']],
 expense:[['title','Kostnad','text','required'],['category','Kategori','select:Transport,Boende,Mat,Aktiviteter,Shopping,Övrigt'],['currency','Valuta','select:SEK,EUR,NOK,DKK,USD,GBP'],['rate','1 valutaenhet i resans basvaluta','number','required'],['planned','Planerat belopp','number'],['actual','Faktiskt belopp','number'],['payer','Betalat av','text'],['date','Datum','date'],['notes','Anteckningar','textarea']],
 booking:[['title','Bokning','text','required'],['category','Typ','select:Boende,Flyg,Tåg,Färja,Hyrbil,Aktivitet,Annat'],['date','Datum','date'],['time','Tid','time'],['endDate','Till datum','date'],['status','Status','select:Att boka,Bokat,Betalt,Avbokat'],['reference','Bokningsnummer','text'],['location','Adress / avgångsplats','text'],['contact','Kontaktuppgifter','text'],['url','Bokningslänk','url'],['notes','Detaljer och avbokningsvillkor','textarea']],
 task:[['title','Vad behöver göras eller packas?','text','required'],['category','Lista / kategori','text'],['owner','Ansvarig','text'],['date','Klart senast','date'],['notes','Anteckningar','textarea']],
 photo:[['title','Bildtext','text','required'],['url','Bildlänk (https) – eller ladda upp nedan','url'],['upload','Välj bild','file:image/*'],['notes','Anteckningar','textarea']],
 document:[['title','Dokumentnamn','text','required'],['url','Dokumentlänk – eller ladda upp PDF/bild','url'],['upload','Välj fil (högst 1 MB för PDF)','file:application/pdf,image/*'],['notes','Anteckningar','textarea']],
 note:[['title','Rubrik','text','required'],['notes','Anteckning','textarea'],['url','Länk','url']]
};
const trip=()=>S.get(tripId),list=(type,deleted=false)=>S.list().filter(x=>x.type===type&&(type==='trip'||x.tripId===tripId)&&!!x.deleted===deleted);
const money=n=>new Intl.NumberFormat('sv-SE',{style:'currency',currency:trip()?.currency||'SEK',maximumFractionDigits:0}).format(n||0);
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function link(url,label){const safe=S.safeURL(url);return safe?'<a target="_blank" rel="noopener noreferrer" href="'+esc(safe)+'">'+esc(label||'Öppna länk ↗')+'</a>':'';}
function maps(location){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(location);}
function rowActions(x){return '<footer><button data-edit="'+esc(x.id)+'">Redigera</button>'+link(x.url)+(x.location?link(maps(x.location),'Navigera ↗'):'')+'</footer>';}
function card(x,body=''){return '<article class="card"><small>'+esc(x.category||x.date||'')+'</small><h3>'+esc(x.title)+'</h3>'+body+'<p>'+esc(x.notes||'')+'</p>'+rowActions(x)+'</article>';}
function tick(){const t=trip();if(!t||!$('countdown'))return;const c=S.countdown(t.departureISO||t.departure,t.endDate);$('countdown').innerHTML='<p>'+esc(c.label)+'</p><div class="digits">'+c.parts.map((n,i)=>'<div><strong>'+String(n).padStart(2,'0')+'</strong><small>'+['dagar','timmar','minuter','sekunder'][i]+'</small></div>').join('')+'</div>';}
function render(){
 const trips=list('trip');if(!trips.some(x=>x.id===tripId))tripId=trips[0]?.id||'';
 $('trips').innerHTML=trips.map(x=>'<button data-trip="'+esc(x.id)+'" class="'+(x.id===tripId?'active':'')+'" aria-pressed="'+(x.id===tripId)+'">'+esc(x.title)+'</button>').join('');
 $('sync').textContent=S.status();$('sync').classList.toggle('error',/saknas|blockerad|Kunde/.test(S.status()));
 $('empty').hidden=!!tripId;$('workspace').hidden=!tripId;if(!tripId)return;
 const t=trip();$('hero').innerHTML='<div class="hero">'+(t.coverId?'<img class="hero-cover" data-file="'+esc(t.coverId)+'" alt="">':'')+'<div><span class="eyebrow">'+esc(t.destination||'ER RESA')+'</span><h2>'+esc(t.title)+'</h2><p class="meta">'+esc((t.departure||'').slice(0,10))+(t.endDate?' — '+esc(t.endDate):'')+'</p><p class="meta">'+esc(t.travelers||'')+'</p><div class="hero-actions"><button data-edit="'+esc(t.id)+'">Redigera resa</button><button id="print">Skriv ut</button></div></div><div class="countdown" id="countdown" aria-label="Nedräkning till avresa"></div></div>';tick();
 $('tabs').innerHTML=tabs.map(([key,label])=>'<button data-tab="'+key+'" class="'+(tab===key?'active':'')+'" aria-current="'+(tab===key?'page':'false')+'">'+label+'</button>').join('');
 const desc=tabs.find(x=>x[0]===tab);$('section-title').textContent=desc[1];$('section-kicker').textContent=desc[2];$('add').hidden=tab==='overview';$('add').textContent='＋ '+(tab==='photo'?'Lägg till bild':tab==='task'?'Ny uppgift':'Lägg till');
 renderContent();hydrateImages();
}
function renderContent(){
 const root=$('content'),t=trip();let rows=list(tab);
 if(tab==='overview'){
  const total=S.totals(list('expense')),tasks=list('task'),done=tasks.filter(x=>x.done).length;
  root.innerHTML='<div class="grid"><article class="card metric"><small>PLANERADE DAGAR</small><strong>'+new Set(list('activity').map(x=>x.date)).size+'</strong><p>'+list('activity').length+' aktiviteter att se fram emot</p></article><article class="card metric"><small>RESKASSA · UTFALL</small><strong>'+money(total.actual)+'</strong><p>'+money(t.budget)+' i total budget</p><div class="metric-bar"><span style="width:'+Math.min(100,t.budget?total.actual/t.budget*100:0)+'%"></span></div></article><article class="card metric"><small>PACKAT & KLART</small><strong>'+done+' / '+tasks.length+'</strong><p>'+Math.max(0,tasks.length-done)+' uppgifter kvar</p><div class="metric-bar"><span style="width:'+(tasks.length?done/tasks.length*100:0)+'%"></span></div></article></div><article class="card overview-notes"><span class="eyebrow">OM RESAN</span><p>'+esc(t.notes||'Lägg till era idéer och vad ni vill uppleva via Redigera resa.')+'</p></article>';
  const upcoming=list('activity').sort(activitySort).slice(0,3);if(upcoming.length)root.innerHTML+='<div class="day-heading">På programmet</div>'+agenda(upcoming);return;
 }
 if(tab==='activity'){
  rows.sort(activitySort);let day='';root.innerHTML=rows.map(x=>{let h='';if(day!==x.date){day=x.date;h='<div class="day-heading">'+esc(day||'Utan datum')+'</div>';}return h+agenda([x]);}).join('');
 }else if(tab==='expense'){
  const total=S.totals(rows),payers={};for(const x of rows)if(x.payer)payers[x.payer]=(payers[x.payer]||0)+(Number(x.actual)||0)*(Number(x.rate)||1);
  root.innerHTML='<div class="grid"><div class="card metric"><small>PLANERAT</small><strong>'+money(total.planned)+'</strong></div><div class="card metric"><small>UTFALL</small><strong>'+money(total.actual)+'</strong></div><div class="card metric"><small>KVAR AV BUDGET</small><strong>'+money(Number(t.budget||0)-total.actual)+'</strong></div></div><p class="budget-payers">'+Object.entries(payers).map(([name,sum])=>esc(name)+': '+money(sum)).join(' · ')+'</p><p class="muted caption">Omräkning använder kursen du anger på varje kostnad.</p><div class="grid">'+rows.map(x=>card(x,'<p>'+esc(x.currency)+' · planerat '+esc(x.planned||0)+' / utfall '+esc(x.actual||0)+'</p><p>'+esc(x.payer||'Ingen betalare angiven')+'</p>')).join('')+'</div>';return;
 }else if(tab==='place'){
  root.innerHTML=(rows.length?'<label class="filters">Visa på karta <select id="map-select" aria-label="Plats på kartan">'+rows.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>').join('')+'</select></label><iframe class="map-frame" id="map" title="Karta över vald plats" loading="lazy" referrerpolicy="no-referrer"></iframe>':'')+'<div class="grid">'+rows.map(x=>card(x,'<p>'+esc(x.location)+'</p>')).join('')+'</div>';if(rows.length)setMap(rows[0]);
 }else if(tab==='task'){
  const groups=[...new Set(rows.map(x=>x.category||'Att göra'))];root.innerHTML=groups.map(g=>'<div class="day-heading">'+esc(g)+'</div>'+rows.filter(x=>(x.category||'Att göra')===g).map(x=>'<div class="check-row '+(x.done?'done':'')+'"><input type="checkbox" data-check="'+esc(x.id)+'" '+(x.done?'checked':'')+' aria-label="Klarmarkera '+esc(x.title)+'"><div class="info"><span class="title">'+esc(x.title)+'</span><small>'+esc([x.owner,x.date].filter(Boolean).join(' · '))+'</small></div><button data-edit="'+esc(x.id)+'">Ändra</button></div>').join('')).join('');
 }else if(tab==='photo'){
  root.innerHTML='<div class="grid">'+rows.map(x=>card(x,(x.fileId?'<img class="photo" data-file="'+esc(x.fileId)+'" alt="'+esc(x.title)+'">':S.safeURL(x.url)?'<img class="photo" src="'+esc(S.safeURL(x.url))+'" loading="lazy" referrerpolicy="no-referrer" alt="'+esc(x.title)+'">':'')+(x.fileId?'<button data-cover="'+esc(x.id)+'">Använd som omslag</button>':''))).join('')+'</div>';
 }else if(tab==='document')root.innerHTML='<div class="grid">'+rows.map(x=>card(x,x.fileId?'<button data-file-open="'+esc(x.id)+'">Öppna fil ↗</button>':'')).join('')+'</div>';
 else if(tab==='booking')root.innerHTML='<div class="grid">'+rows.map(x=>card(x,'<p>'+esc([x.date,x.time,x.endDate].filter(Boolean).join(' · '))+'</p><p>'+esc(x.status||'')+(x.reference?' · '+esc(x.reference):'')+'</p><p>'+esc(x.contact||'')+'</p>')).join('')+'</div>';
 else root.innerHTML='<div class="grid">'+rows.map(x=>card(x)).join('')+'</div>';
 if(!rows.length)root.innerHTML='<div class="empty-section">Inga '+({activity:'aktiviteter',place:'platser',task:'uppgifter',photo:'bilder',document:'dokument',booking:'bokningar',note:'anteckningar'}[tab]||'poster')+' ännu. Lägg till den första ovan.</div>';
}
function activitySort(a,b){return String(a.date||'').localeCompare(b.date||'')||(Number(a.order??(parseInt((a.time||'00:00').replace(':',''))*100)) - Number(b.order??(parseInt((b.time||'00:00').replace(':',''))*100)))||String(a.time||'').localeCompare(b.time||'');}
function agenda(rows){return rows.map(x=>'<article class="agenda" data-activity="'+esc(x.id)+'"><div class="time">'+esc(x.time||'—')+'<small><br>'+esc(x.endTime||'')+'</small></div><div class="info"><small>'+esc(x.category||'')+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.location||'')+'</p><p>'+esc(x.notes||'')+'</p>'+link(x.url)+'</div><div class="row-actions"><button data-edit="'+esc(x.id)+'">Ändra</button><button class="handle" data-drag="'+esc(x.id)+'" aria-label="Dra aktivitet">⠿</button><button data-move="'+esc(x.id)+':-1" aria-label="Flytta upp">↑</button><button data-move="'+esc(x.id)+':1" aria-label="Flytta ner">↓</button></div></article>').join('');}
function setMap(x){if(x&&$('map'))$('map').src='https://maps.google.com/maps?q='+encodeURIComponent(x.location||x.title)+'&output=embed';}
async function hydrateImages(){for(const img of document.querySelectorAll('img[data-file]'))try{img.src=await S.file(img.dataset.file);}catch(_){img.alt='Bilden väntar på anslutning';}}
function draftKey(){return editing.key;}
function openEditor(type,id){
 editing={type,id,key:'travel-draft-'+type+'-'+(id||(type==='trip'?'new':tripId)||'new')};let value=id?{...S.get(id)}:{currency:trip()?.currency||'SEK',rate:1,date:(trip()?.departure||'').slice(0,10),category:type==='task'?'Packlista':'',order:undefined};
 try{const saved=JSON.parse(localStorage.getItem(draftKey())||'null');if(saved)value={...value,...saved};}catch(_){}
 $('edit-title').textContent=(id?'Redigera ':'Ny ')+names[type];$('form-error').textContent='';$('delete').hidden=!id;
 $('fields').innerHTML=schema[type].map(([key,label,kind,required])=>{
  let input;if(kind==='textarea')input='<textarea name="'+key+'" rows="4">'+esc(value[key]||'')+'</textarea>';
  else if(kind.startsWith('select:'))input='<select name="'+key+'">'+kind.slice(7).split(',').map(v=>'<option '+(value[key]===v?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>';
  else if(kind.startsWith('file:'))input='<input type="file" name="'+key+'" accept="'+kind.slice(5)+'">';
  else input='<input name="'+key+'" type="'+kind+'" '+(required||'')+' '+(kind==='number'?'min="0" step="any"':'')+' '+(kind==='text'?'maxlength="500"':'')+' value="'+esc(value[key]??'')+'">';
  return '<label class="'+(['title','notes','url','upload','travelers'].includes(key)?'wide':'')+'">'+label+input+'</label>';
 }).join('');$('editor').showModal();document.activeElement?.blur();
}
function formData(){const out={};for(const [key,,kind] of schema[editing.type])if(!kind.startsWith('file:'))out[key]=kind==='number'?Number($('edit-form').elements[key].value)||0:$('edit-form').elements[key].value.trim();return out;}
function keepDraft(){if(!editing)return;try{localStorage.setItem(draftKey(),JSON.stringify(formData()));}catch(_){$('form-error').textContent='Utkastet kunde inte sparas på enheten. Spara innan du stänger.';}}
async function prepareFile(file){
 if(file.type==='application/pdf'){if(file.size>1024*1024)throw Error('PDF-filen får vara högst 1 MB. Större dokument kan läggas till som länk.');return readData(file);}
 if(!file.type.startsWith('image/'))throw Error('Välj en bild eller PDF.');
 const data=await readData(file),img=new Image();img.src=data;await img.decode();const scale=Math.min(1,1600/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);let result=canvas.toDataURL('image/jpeg',.78);if(result.length>1400000)result=canvas.toDataURL('image/jpeg',.5);if(result.length>1400000)throw Error('Bilden är för stor. Välj en mindre bild.');return result;
}
function readData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
async function saveEditor(event){
 event.preventDefault();const submit=$('edit-form').querySelector('[type=submit]');submit.disabled=true;
 try{
  const value=formData(),type=editing.type;
  if(value.url&&!S.safeURL(value.url))throw Error('Använd en fullständig http- eller https-länk.');
  if(type==='trip'){
   if(value.endDate&&value.endDate<value.departure.slice(0,10))throw Error('Hemresan kan inte vara före avresan.');
   value.departureISO=new Date(value.departure).toISOString();
  }
  if(type==='expense'&&value.rate<=0)throw Error('Ange en växelkurs större än noll.');
  const upload=$('edit-form').elements.upload?.files[0];if(upload){value.fileId=await S.putFile(await prepareFile(upload));value.fileName=upload.name;}
  if(['photo','document'].includes(type)&&!value.url&&!value.fileId&&!S.get(editing.id)?.fileId)throw Error('Lägg till en fil eller länk.');
  if(type==='activity'&&editing.id&&S.get(editing.id).date!==value.date)value.order=null;
  const id=editing.id?await S.patch(editing.id,value):await S.add(type,tripId,value);
  localStorage.removeItem(draftKey());if(type==='trip'){tripId=id;localStorage.setItem('travel-selected',id);}editing=null;$('editor').close();render();toast('Sparat.');
 }catch(e){$('form-error').textContent=e.message||'Kunde inte spara. Försök igen.';}finally{submit.disabled=false;}
}
async function reorder(id,to){const item=S.get(id),rows=list('activity').filter(x=>x.date===item.date).sort(activitySort),from=rows.findIndex(x=>x.id===id);to=Math.max(0,Math.min(rows.length-1,to));rows.splice(to,0,rows.splice(from,1)[0]);for(let i=0;i<rows.length;i++)await S.patch(rows[i].id,{order:i});render();}
function download(data,name){const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function renderTrash(){const rows=S.list().filter(x=>x.deleted);$('trash-list').innerHTML=rows.length?rows.map(x=>'<article class="card"><small>'+esc(names[x.type]||'Post')+'</small><h3>'+esc(x.title)+'</h3><button data-restore="'+esc(x.id)+'">Återställ</button></article>').join(''):'<p class="muted">Papperskorgen är tom.</p>';$('trash-dialog').showModal();document.activeElement?.blur();}
async function click(event){
 const b=event.target.closest('button');if(!b)return;
 try{
 if(b.dataset.new)return openEditor(b.dataset.new);
 if(b.dataset.trip){tripId=b.dataset.trip;localStorage.setItem('travel-selected',tripId);render();return;}
 if(b.dataset.tab){tab=b.dataset.tab;render();return;}
 if(b.dataset.edit)return openEditor(S.get(b.dataset.edit).type,b.dataset.edit);
 if(b.dataset.restore){await S.restore(b.dataset.restore);$('trash-dialog').close();renderTrash();return;}
 if(b.dataset.cover){await S.patch(tripId,{coverId:S.get(b.dataset.cover).fileId});return;}
 if(b.dataset.fileOpen){const item=S.get(b.dataset.fileOpen);const data=await S.file(item.fileId);const blob=await (await fetch(data)).blob();download(blob,item.fileName||item.title);return;}
 if(b.dataset.move){const [id,d]=b.dataset.move.split(':');const item=S.get(id),rows=list('activity').filter(x=>x.date===item.date).sort(activitySort);return await reorder(id,rows.findIndex(x=>x.id===id)+Number(d));}
 if(b.id==='add')openEditor(tab);
 if(b.id==='close'){keepDraft();$('editor').close();editing=null;}
 if(b.id==='delete'&&confirm('Flytta till papperskorgen? Du kan återställa senare.')){await S.remove(editing.id);localStorage.removeItem(draftKey());editing=null;$('editor').close();render();}
 if(b.id==='trash')renderTrash();if(b.id==='close-trash')$('trash-dialog').close();
 if(b.id==='export'){toast('Förbereder backup med filer…');download(new Blob([JSON.stringify(await S.exportBackup(),null,2)],{type:'application/json'}),'familjens-resor.json');}
 if(b.id==='print')printTrip();
 }catch(e){toast(e.message||'Kunde inte utföra ändringen.');}
}
function printTrip(){const t=trip(),w=window.open('','_blank');if(!w){toast('Tillåt popup för att skriva ut.');return;}w.document.write('<!doctype html><html lang="sv"><meta charset="utf-8"><title>'+esc(t.title)+'</title><style>body{font:14px system-ui;max-width:900px;margin:35px}article{break-inside:avoid;border-bottom:1px solid #ddd;padding:12px 0}p{white-space:pre-wrap}h1{font-size:30px}small{color:#666}</style><h1>'+esc(t.title)+'</h1><p>'+esc(t.destination)+' · '+esc(t.departure)+' — '+esc(t.endDate)+'</p><p>'+esc(t.notes)+'</p>'+tabs.filter(x=>x[0]!=='overview'&&x[0]!=='photo').map(([type,label])=>'<h2>'+label+'</h2>'+list(type).sort(type==='activity'?activitySort:(a,b)=>a.createdAt-b.createdAt).map(x=>'<article><strong>'+esc(x.title)+'</strong><p>'+esc([x.date,x.time,x.location,x.owner,x.reference].filter(Boolean).join(' · '))+'</p><p>'+esc(x.notes||'')+'</p>'+link(x.url)+'</article>').join('')).join('')+'</html>');w.document.close();w.focus();w.print();}
document.addEventListener('click',click);
$('edit-form').addEventListener('submit',saveEditor);$('edit-form').addEventListener('input',keepDraft);
$('editor').addEventListener('cancel',()=>{keepDraft();editing=null;});
document.addEventListener('change',async event=>{try{if(event.target.dataset.check)await S.patch(event.target.dataset.check,{done:event.target.checked});if(event.target.id==='map-select')setMap(S.get(event.target.value));if(event.target.id==='import'){const f=event.target.files[0];if(!f)return;if(f.size>30*1024*1024)throw Error('Backupen får vara högst 30 MB.');const data=JSON.parse(await f.text());S.validateBackup(data);if(confirm('Importera som nya kopior? Dina nuvarande resor behålls.')){await S.importBackup(data);render();toast('Backup importerad.');}event.target.value='';}}catch(e){toast(e.message);}});
// Pointer drag works with touch and mouse; accessible arrow buttons use the same reorder function.
document.addEventListener('pointerdown',event=>{const handle=event.target.closest('[data-drag]');if(!handle||event.button>0)return;event.preventDefault();const card=handle.closest('.agenda'),rect=card.getBoundingClientRect(),ghost=card.cloneNode(true);ghost.classList.add('drag-ghost');ghost.style.cssText='left:'+rect.left+'px;top:'+rect.top+'px;width:'+rect.width+'px;margin:0';ghost.setAttribute('aria-hidden','true');document.body.append(ghost);card.classList.add('drag-source');drag={id:handle.dataset.drag,pointer:event.pointerId,ghost,card,x:event.clientX,y:event.clientY,rect};handle.setPointerCapture?.(event.pointerId);});
document.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.pointer)return;event.preventDefault();drag.yNow=event.clientY;drag.ghost.style.transform='translate('+(event.clientX-drag.x)+'px,'+(event.clientY-drag.y)+'px)';if(event.clientY<90)window.scrollBy(0,-12);if(event.clientY>innerHeight-90)window.scrollBy(0,12);},{passive:false});
async function endDrag(event){if(!drag||event.pointerId!==drag.pointer)return;const d=drag;drag=null;d.ghost.remove();d.card.classList.remove('drag-source');if(event.type!=='pointerup')return;const date=S.get(d.id).date,cards=[...document.querySelectorAll('#content .agenda')].filter(el=>S.get(el.dataset.activity)?.date===date&&el!==d.card);const to=cards.filter(el=>{const r=el.getBoundingClientRect();return event.clientY>r.top+r.height/2;}).length;try{await reorder(d.id,to);}catch(e){toast(e.message);}}
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);
S.subscribe(()=>{if(!drag)render();});S.ready.then(render);setInterval(tick,1000);
})();
