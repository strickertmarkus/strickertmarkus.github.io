'use strict';
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.TRAVEL_TEST_URL||'http://127.0.0.1:4173';
const output=process.env.TRAVEL_SCREENSHOTS||'test-results/travel';
function install(){
 const listeners=[];let last='';const auth={onAuthStateChanged(fn){queueMicrotask(()=>fn({uid:'fixture-user'}));},currentUser:{uid:'fixture-user'}};
 async function request(op,path,value){const res=await fetch('/__travel_fixture',{method:'POST',body:JSON.stringify({op,path,value})});if(!res.ok)throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});return res.json();}
 const ref=path=>({child:s=>ref(path+'/'+s),on(_,cb){if(path==='.info/connected'){queueMicrotask(()=>cb({val:()=>true}));return;}listeners.push({path,cb});request('get',path).then(v=>cb({val:()=>v,exists:()=>!!v}));},off(){},async update(v){await request('patch',path,v);},async set(v){await request('set',path,v);},async once(){const v=await request('get',path);return {val:()=>v,exists:()=>!!v};},async transaction(fn){const old=await request('get',path),v=fn(old);if(v!==undefined)await request('set',path,v);return {committed:v!==undefined};}});
 window.firebase={apps:[{}],auth:()=>auth,database:()=>({ref}),initializeApp(){}};
 setInterval(async()=>{try{const data=await request('get',''),serialized=JSON.stringify(data);if(last===serialized)return;last=serialized;for(const {path,cb} of listeners){let value=data;for(const k of path.split('/').filter(Boolean))value=value?.[k];cb({val:()=>value||null,exists:()=>!!value});}}catch(_){}},100);
}
const remote={family_travel_v1:{items:{},files:{}},family_todos_v2:{migratedLegacyV1:true,items:{}}};
let deny=false;
async function setup(browser,width){const c=await browser.newContext({serviceWorkers:'block',viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});await c.addInitScript(install);await c.route('**/__travel_fixture',async route=>{const {op,path,value}=JSON.parse(route.request().postData());if(deny&&op!=='get')return route.fulfill({status:403,body:'denied'});const parts=path.split('/').filter(Boolean);let node=remote;for(const k of parts.slice(0,-1))node=node[k]??={};const key=parts.at(-1);let result;if(op==='get'){result=remote;for(const k of parts)result=result?.[k];}else{node[key]=op==='patch'?{...node[key],...value}:value;result=true;}await route.fulfill({contentType:'application/json',body:JSON.stringify(result??null)});});await c.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({body:'// isolated firebase double',contentType:'application/javascript'}));await c.route('**/auth-gate.js',r=>r.fulfill({body:'// authorized fixture',contentType:'application/javascript'}));await c.route('https://tile.openstreetmap.org/**',r=>r.abort());return c;}
async function save(page){await page.locator('#edit-form [type=submit]').click();await page.waitForFunction(()=>!document.getElementById('editor').open);}
async function tab(page,name){await page.locator('[data-tab="'+name+'"]').click();}
async function checkPackingFilter(page){
 const trigger=page.locator('.packing-filter>summary');
 await trigger.click();
 await page.waitForFunction(()=>{const panel=document.querySelector('.packing-filter[open] .packing-filter-panel');return panel&&getComputedStyle(panel).position==='fixed';});
 const bounds=await page.locator('.packing-filter-panel').evaluate(panel=>{
  const r=panel.getBoundingClientRect(),v=window.visualViewport;
  return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,minX:v?.offsetLeft||0,maxX:(v?.offsetLeft||0)+(v?.width||innerWidth),minY:v?.offsetTop||0,maxY:(v?.offsetTop||0)+(v?.height||innerHeight)};
 });
 assert(bounds.left>=bounds.minX-1&&bounds.right<=bounds.maxX+1,'Filter extends beyond horizontal viewport: '+JSON.stringify(bounds));
 assert(bounds.top>=bounds.minY-1&&bounds.bottom<=bounds.maxY+1,'Filter extends beyond vertical viewport: '+JSON.stringify(bounds));
 await page.mouse.click(3,8);
 assert.equal(await page.locator('.packing-filter[open]').count(),0,'Outside tap did not close filter');
 await trigger.click();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.packing-filter[open]').count(),0,'Escape did not close filter');
}
async function geometry(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');if(await page.locator('#editor').isVisible()){assert(await page.locator('#editor').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'dialog overflow');assert(await page.locator('#editor input,#editor select,#editor textarea').evaluateAll(es=>es.every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)),'iOS zoom');}}
if(require.main===module)(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await webkit.launch(process.env.ZEN_WEBKIT?{executablePath:process.env.ZEN_WEBKIT}:{}),ctx=await setup(browser,390),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/budget/travel.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>TravelStore.ready);await page.locator('#empty [data-new]').click();await page.locator('#edit-form [name=title]').fill('Familjens resa');await page.locator('#edit-form [name=destination]').fill('Köpenhamn');await page.locator('#edit-form [name=departure]').fill('2026-11-01T08:30');await page.locator('#edit-form [name=endDate]').fill('2026-11-03');await page.locator('#edit-form [name=timezone]').fill('Europe/Copenhagen');await page.locator('#edit-form [name=travelers]').fill('Markus, Maja');await page.locator('#edit-form [name=budget]').fill('15000');await save(page);
 const tripId=await page.evaluate(()=>TravelStore.list().find(x=>x.type==='trip').id);
 await tab(page,'packing');const melker=page.locator('.packing-group[data-drop-group="Melker"]');await melker.locator('.packing-inline-add [name=title]').fill('Strumpor');await melker.locator('.packing-inline-add [name=title]').press('Enter');await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Strumpor'&&x.owner==='Melker'));await melker.locator('[data-pack-title]').click();assert.equal(await page.locator('#editor[open]').count(),0);await melker.locator('[data-pack-title][contenteditable=true]').fill('Varma strumpor');await melker.locator('[data-pack-title][contenteditable=true]').press('Enter');await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Varma strumpor'&&x.owner==='Melker'));assert(await melker.locator('.packing-inline-add input').evaluate(el=>document.activeElement===el));await melker.locator('.packing-inline-add input').blur();await page.evaluate(()=>TravelStore.patch(TravelStore.list().find(x=>x.title==='Varma strumpor').id,{quantity:5}));await melker.locator('[data-pack-quantity]').click();await melker.locator('.pack-quantity-input').fill('6');await melker.locator('.pack-quantity-input').press('Enter');await page.waitForFunction(()=>TravelStore.list().find(x=>x.title==='Varma strumpor')?.quantity===6);await melker.locator('[data-check]').check();await page.waitForFunction(()=>TravelStore.list().find(x=>x.type==='packing')?.done);await page.locator('.packing-filter>summary').click();await page.locator('[data-action=templates]').click();await page.locator('#save-template [name=title]').fill('Helgresa');await page.locator('[data-template-save]').click();await page.waitForSelector('[data-template-apply]');await page.locator('[data-template-apply]').click();await page.waitForFunction(()=>TravelStore.list().filter(x=>x.type==='packing'&&!x.done).length===1);

 await checkPackingFilter(page);
 // Entry directly beneath a person: Enter saves and leaves focus for the next item.
 const markusInline=page.locator('.packing-group[data-drop-group="Markus"] .packing-inline-add [name=title]');
 await markusInline.fill('Pass');await markusInline.press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Pass'&&x.owner==='Markus'));
 assert(await markusInline.evaluate(el=>document.activeElement===el),'Enter must keep the same packing input focused');
 await markusInline.fill('Laddare');await markusInline.press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Laddare'&&x.owner==='Markus'));
 assert.equal(await page.locator('.packing-group[data-drop-group="Markus"] [data-item]').count(),2);
 await page.locator('.packing-group[data-drop-group="Markus"] [data-pack-title]').first().click();
 const editText=page.locator('.packing-group[data-drop-group="Markus"] [data-pack-title][contenteditable=true]');
 await editText.fill('Ändras inte');await editText.press('Escape');
 assert.equal(await page.locator('.packing-group[data-drop-group="Markus"] [data-pack-title]').first().textContent(),'Pass');
 await page.locator('.packing-group[data-drop-group="Markus"] [data-pack-title]').first().click();
 await page.locator('.packing-group[data-drop-group="Markus"] [data-pack-title][contenteditable=true]').fill('Passuppgifter');
 await page.locator('.packing-group[data-drop-group="Markus"] [data-pack-title][contenteditable=true]').blur();
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Passuppgifter'&&x.owner==='Markus'));
 const passportId=await page.evaluate(()=>TravelStore.list().find(x=>x.title==='Passuppgifter').id);
 await page.locator('.packing-group[data-drop-group="Markus"] [data-pack-delete="'+passportId+'"]').click();
 await page.waitForFunction(id=>TravelStore.get(id)?.deleted,passportId);
 assert.equal(await page.locator('#editor[open]').count(),0);
 await page.locator('#toast [data-action=undo]').click();
 await page.waitForFunction(id=>TravelStore.get(id)?.deleted===false,passportId);

 await page.locator('.packing-filter>summary').click();await page.locator('[data-filter=packingGroup]').selectOption('category');
 await page.locator('[data-action=pack-new-heading]').click();
 await page.locator('#packing-new-heading [name=title]').fill('Leksaker');
 await page.locator('#packing-new-heading [name=title]').press('Enter');
 await page.waitForFunction(()=>document.querySelector('.packing-group[data-drop-group="Leksaker"]'));
 assert((await page.evaluate(()=>TravelStore.list().find(x=>x.type==='trip').packingCategories)).includes('Leksaker'));
 await page.locator('.packing-group[data-drop-group="Leksaker"] .packing-inline-add [name=title]').fill('Gosedjur');
 await page.locator('.packing-group[data-drop-group="Leksaker"] .packing-inline-add [name=title]').press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Gosedjur'&&x.category==='Leksaker'));
 const leksakerHeading=page.locator('.packing-group[data-drop-group="Leksaker"] [data-pack-heading]');
 await leksakerHeading.click();
 await leksakerHeading.fill('Pyssel');
 await leksakerHeading.press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Gosedjur'&&x.category==='Pyssel'));
 assert.equal(await page.locator('.packing-group[data-drop-group="Pyssel"] [data-item]').count(),1);
 assert.equal(await page.locator('#editor[open]').count(),0);
 const clothesInline=page.locator('.packing-group[data-drop-group="Kläder"] .packing-inline-add [name=title]');
 await clothesInline.fill('Regnjacka');await clothesInline.press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Regnjacka'&&x.category==='Kläder'));
 assert(await clothesInline.evaluate(el=>document.activeElement===el),'Category entry should also keep focus');

 // Checked rows stay in their original section; they are not moved to a second list.
 await page.locator('.packing-filter>summary').click();
 await page.locator('[data-filter=packingGroup]').selectOption('owner');
 await page.waitForFunction(()=>document.querySelector('.packing-group[data-drop-group="Melker"] [data-check]')?.checked);
 assert.equal(await page.locator('.packing-group details').count(),0,'Completed items must not move into a details list');
 assert.equal(await page.locator('.packing-group[data-drop-group="Melker"] [data-item]').count(),1);
 // Create a heading inline (not a dialog), then add two things by Enter.
 await page.locator('[data-action=pack-new-heading]').click();
 assert.equal(await page.locator('#editor[open]').count(),0);
 await page.locator('#packing-new-heading [name=title]').fill('Barnvagn');
 await page.locator('#packing-new-heading [name=title]').press('Enter');
 await page.waitForFunction(()=>document.querySelector('.packing-group[data-drop-group="Barnvagn"]'));
 assert(await page.evaluate(()=>TravelStore.list().find(x=>x.type==='trip').packingPeople.includes('Barnvagn')));
 const newGroup=page.locator('.packing-group[data-drop-group="Barnvagn"] .packing-inline-add [name=title]');
 await newGroup.fill('Regnskydd');await newGroup.press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Regnskydd'&&x.owner==='Barnvagn'));
 await newGroup.fill('Filt');await newGroup.press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Filt'&&x.owner==='Barnvagn'));
 assert(await newGroup.evaluate(el=>document.activeElement===el));
 await page.locator('.packing-filter>summary').click();
 await page.locator('[data-pack-jump="Barnvagn"]').click();
 assert(!await page.locator('.packing-filter').evaluate(el=>el.open));
 assert.equal(await page.locator('.packing-group[data-drop-group="Barnvagn"] [data-item]').count(),2);
 const barnHeading=page.locator('.packing-group[data-drop-group="Barnvagn"] [data-pack-heading]');
 await barnHeading.click();await barnHeading.fill('Barnsaker');await barnHeading.press('Enter');
 await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='packing'&&x.title==='Regnskydd'&&x.owner==='Barnsaker'));
 assert.equal(await page.locator('.packing-group[data-drop-group="Barnsaker"] [data-item]').count(),2);
 assert.equal(await page.locator('#editor[open]').count(),0);
 await geometry(page);
 await page.screenshot({path:output+'/packing-390.png',fullPage:true});
 await tab(page,'task');await page.locator('#quick-add [name=title]').fill('Boka färja');await page.locator('[data-quick-submit]').click();await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='task'&&x.showHome));
 // Second device sees actual outbox writes through the shared isolated server.
 const ctx2=await setup(browser,390),p2=await ctx2.newPage();await p2.goto(base+'/budget/travel.html?trip='+tripId+'&tab=task',{waitUntil:'domcontentloaded'});await p2.waitForSelector('[data-check]');await p2.locator('[data-check]').check();await page.waitForFunction(()=>TravelStore.list().find(x=>x.type==='task').done);
 // The Home adapter updates that same record, without duplicating family tasks.
 await page.addScriptTag({url:base+'/budget/family-todos-v1.js'});await page.addScriptTag({url:base+'/budget/travel-home.js'});await page.waitForFunction(()=>FamilyTodos.list().some(x=>x.id.startsWith('travel:')));await page.evaluate(()=>FamilyTodos.toggle(FamilyTodos.list().find(x=>x.id.startsWith('travel:')).id));await p2.waitForFunction(()=>!TravelStore.list().find(x=>x.type==='task').done);
 await tab(page,'activity');await page.locator('[data-slot="2026-11-01|08:00"]').click();await page.locator('#edit-form [name=title]').fill('Frukost');await page.locator('#edit-form [name=endTime]').fill('09:00');await save(page);await page.locator('[data-slot="2026-11-01|10:00"]').click();await page.locator('#edit-form [name=title]').fill('Promenad');await page.locator('#edit-form [name=endTime]').fill('11:00');await save(page);
 // Moving an activity preserves duration and changes its clock time.
 await page.waitForFunction(()=>TravelStore.status()==='Synkat med familjen');const h=page.locator('.selected-day [data-drag]').first(),drop=page.locator('.selected-day [data-drop-time="12:00"]');await h.scrollIntoViewIfNeeded();const a=await h.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await drop.evaluate(el=>el.scrollIntoView({block:'center'}));const b=await drop.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+4,{steps:6});await page.mouse.up();await page.waitForFunction(()=>TravelStore.list().some(x=>x.title==='Frukost'&&x.time==='12:00'),null,{timeout:3000}).catch(async e=>{console.log(await page.evaluate(()=>TravelStore.list().filter(x=>x.type==='activity')));throw e;});
 await page.locator('.hero [data-edit]').click();await page.locator('#edit-form [name=departure]').fill('2026-11-02T08:30');await page.locator('#edit-form [name=endDate]').fill('2026-11-04');await page.locator('#edit-form [type=submit]').click();await page.locator('[data-shift=yes]').click();await page.waitForFunction(()=>!document.getElementById('editor').open);assert(await page.evaluate(()=>TravelStore.list().filter(x=>x.type==='activity').every(x=>x.date==='2026-11-02')));
 await page.locator('[data-day="2026-11-02"]').click();await page.locator('.selected-day [data-drop-time="08:00"]').scrollIntoViewIfNeeded();await page.screenshot({path:output+'/schedule-390.png'});
 await tab(page,'booking');await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Hotel Strand');await page.locator('#edit-form [name=date]').fill('2026-11-02');await page.locator('#edit-form [name=endDate]').fill('2026-11-04');await page.locator('#edit-form .travel-editor-advanced>summary').click();await page.locator('#edit-form [name=reference]').fill('TEST-123');await page.locator('#edit-form [name=total]').fill('2400');await save(page);await page.locator('.booking-card .travel-more-actions>summary').click();await page.locator('[data-schedule]').click();await save(page);await tab(page,'booking');await page.locator('.booking-card .travel-more-actions>summary').click();await page.locator('[data-booking-expense]').click();await page.locator('#edit-form [name=actual]').fill('1200');await page.locator('#edit-form [name=payer]').fill('Markus');await page.locator('#edit-form .travel-editor-advanced>summary').click();await page.locator('#edit-form [name=splitText]').fill('Markus:1, Maja:1');await save(page);assert.match(await page.locator('#content').textContent(),/Delbetalt/);
 await tab(page,'expense');await page.locator('[data-inline-budget-category="Boende"]').click();await page.locator('.travel-inline-control').fill('3000');await page.locator('.travel-inline-control').press('Enter');await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='categoryBudget'&&x.amount===3000));await page.locator('[data-budget=actual]').click();assert.match(await page.locator('#content').textContent(),/1.200/);await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Återbetalning');await page.locator('#edit-form [name=actual]').fill('-200');await save(page);await page.screenshot({path:output+'/budget-390.png',fullPage:true});
 await tab(page,'place');await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Nyhavn');await page.locator('#edit-form [name=location]').fill('Nyhavn, København');await page.locator('#edit-form .travel-editor-advanced>summary').click();await page.locator('#edit-form [name=lat]').fill('55.6797');await page.locator('#edit-form [name=lng]').fill('12.591');await save(page);await page.waitForSelector('.leaflet-interactive');await page.locator('[data-schedule]').click();assert.equal(await page.locator('#edit-form [name=placeId]').inputValue(),await page.evaluate(()=>TravelStore.list().find(x=>x.type==='place').id));await save(page);
 await tab(page,'note');await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Idéer');await page.locator('#edit-form [name=notes]').fill('# Mat\n- Prova smørrebrød');await save(page);await page.locator('[data-note-task]').click();assert.equal(await page.locator('#edit-form [name=title]').inputValue(),'Idéer');await save(page);
 await tab(page,'photo');await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Reseminnen');const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=120;c.height=90;const g=c.getContext('2d');g.fillStyle='#477d82';g.fillRect(0,0,120,90);return c.toDataURL().split(',')[1];});await page.locator('#edit-form [name=upload]').setInputFiles([{name:'bild1.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},{name:'bild2.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}]);await save(page);assert.equal(await page.locator('.gallery figure').count(),2);await page.locator('[data-photo]').first().click();await page.locator('[data-photo-step="1"]').click();assert.match(await page.locator('.lightbox figcaption').textContent(),/2 \/ 2/);await page.locator('[data-close=viewer]').click();await page.locator('.photo-tools>summary').first().click();await page.locator('[data-cover]').click();
 await tab(page,'document');await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Biljett');await page.locator('#edit-form [name=important]').check();await page.locator('#edit-form [name=upload]').setInputFiles({name:'biljett.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await save(page);await page.waitForFunction(()=>document.querySelector('[data-file-status]').textContent.includes('Tillgänglig offline'));await page.locator('[data-preview]').click();await page.waitForSelector('.viewer-image');await page.locator('[data-close=viewer]').click();
 const backup=await page.evaluate(()=>TravelStore.exportBackup());assert(Object.keys(backup.files).length>=3);await page.evaluate(data=>TravelStore.importBackup(data),backup);assert.equal(await page.evaluate(()=>TravelStore.list().filter(x=>x.type==='trip').length),2);const imported=await page.evaluate(id=>TravelStore.list().find(x=>x.type==='trip'&&x.id!==id),tripId);assert(imported.coverId&&!Object.keys(backup.files).includes(imported.coverId));assert(await page.evaluate(tid=>{const rows=TravelStore.list().filter(x=>x.tripId===tid);return rows.filter(x=>x.bookingId).every(x=>rows.some(y=>y.id===x.bookingId));},imported.id));
 await page.locator('[data-action=trip-tools]').click();await page.locator('[data-action=duplicate]').click();await page.locator('#duplicate-form [name=title]').fill('Ny resa');await page.locator('#duplicate-form [type=submit]').click();await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='trip'&&x.title==='Ny resa'));await tab(page,'packing');assert.equal(await page.locator('[data-check]:checked').count(),0);
 // A denied cloud write stays durably queued and survives a reload.
 deny=true;await page.evaluate(()=>TravelStore.add('note',TravelStore.list().find(x=>x.title==='Ny resa').id,{title:'Offline utkast',notes:'Behåll'}));await page.waitForFunction(()=>TravelStore.status().includes('behörighet'));await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>TravelStore.list().some(x=>x.title==='Offline utkast'));deny=false;await page.evaluate(()=>TravelStore.flush());await page.waitForFunction(()=>TravelStore.status()==='Synkat med familjen');
 await tab(page,'note');await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Återställ utkast');await page.locator('#close').click();await page.locator('#add').click();assert.equal(await page.locator('#edit-form [name=title]').inputValue(),'Återställ utkast');await geometry(page);await page.locator('#close').click();
 for(const width of [320,1280]){await page.setViewportSize({width,height:900});await tab(page,'packing');await geometry(page);await checkPackingFilter(page);await page.screenshot({path:output+'/packing-'+width+'.png',fullPage:true});await tab(page,'overview');await geometry(page);await page.screenshot({path:output+'/overview-'+width+'.png',fullPage:true});await tab(page,'booking');await page.locator('#add').click();await page.locator('#edit-form [name=category]').selectOption('Flyg');await geometry(page);assert.equal(await page.locator('#edit-form [name=arrivalTimezone]').count(),1);await page.screenshot({path:output+'/booking-editor-'+width+'.png'});await page.locator('#close').click();}
 const home=await ctx.newPage();await home.goto(base+'/budget/home.html',{waitUntil:'domcontentloaded'});await home.waitForSelector('.ft-trip-link');await home.locator('#family-todo-home').screenshot({path:output+'/home-tasks-390.png'});assert(await home.locator('#family-todo-home').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await home.close();assert.deepEqual(errors,[]);await ctx2.close();await ctx.close();await browser.close();console.log('Travel workflows: packing/templates, tasks/Home/two devices, drag/time shifts, budget/refunds, bookings, map, notes, multi-upload, offline files, backup, duplicate and durable retry passed.');
})().catch(e=>{console.error(e);process.exit(1);});

module.exports={setup,geometry,save,tab};
