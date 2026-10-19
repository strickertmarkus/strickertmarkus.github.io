'use strict';
const {webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const {setup,geometry,save,tab}=require('./travel-browser.cjs');
const base=process.env.TRAVEL_TEST_URL||'http://127.0.0.1:4173',out='test-results/travel';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await webkit.launch(),ctx=await setup(browser,390),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/budget/travel.html?embed=home',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{await TravelStore.ready;await TravelStore.batch([
  {id:'design-trip',changes:{type:'trip',title:'Höstlov i Köpenhamn',destination:'Köpenhamn',departure:'2026-11-02T08:30',endDate:'2026-11-08',timezone:'Europe/Copenhagen',travelers:'Markus, Maja',currency:'SEK',budget:18000}},
  ...[
   ['breakfast','activity',{title:'Frukost vid vattnet',date:'2026-11-02',timing:'timed',time:'08:00',endTime:'09:00',category:'Mat',location:'Nyhavn'}],
   ['train','activity',{title:'Tåget till Köpenhamn',date:'2026-11-02',timing:'timed',time:'09:30',endTime:'11:30',category:'Transport'}],
   ['walk','activity',{title:'Promenad & fika',date:'2026-11-02',timing:'timed',time:'10:30',endTime:'12:00',category:'Aktivitet'}],
   ['free','activity',{title:'Utforska gamla stan',date:'2026-11-02',timing:'flex'}],
   ['hotel','booking',{title:'Hotel Strand',category:'Boende',date:'2026-11-02',time:'15:00',endDate:'2026-11-06',endTime:'11:00',location:'Havnegade 37',contact:'+45 33 48 99 00',status:'Bokat',reference:'STR-2026',total:6400}],
   ['flight','booking',{title:'Hem till Stockholm',category:'Flyg',date:'2026-11-08',time:'14:00',endDate:'2026-11-08',endTime:'15:15',location:'CPH · Köpenhamn',arrivalLocation:'ARN · Stockholm',status:'Bokat',reference:'SK-2026'}],
   ['car','booking',{title:'En dag längs kusten',category:'Hyrbil',date:'2026-11-04',time:'09:00',endDate:'2026-11-04',endTime:'18:00',location:'Centralstationen',arrivalLocation:'Centralstationen',status:'Att boka'}],
   ['place','place',{title:'Nyhavn',category:'Sevärdhet',location:'Nyhavn, København',lat:55.6797,lng:12.591,notes:'Färgglada hus och fika vid vattnet.'}],
   ['pack','packing',{title:'Regnjacka',owner:'Markus',quantity:1,done:true}],
   ['pack2','packing',{title:'Pass',owner:'Markus',quantity:1,done:false}],
   ['task','task',{title:'Boka tågbiljetter',date:'2026-10-30',owner:'Maja',taskKind:'todo'}],
   ['task2','task',{title:'Hämta hyrbilen',date:'2026-11-04',owner:'Markus',taskKind:'todo'}],
   ['plan','categoryBudget',{title:'Boende',amount:7000}],
   ['cost','expense',{title:'Hotell · handpenning',category:'Boende',entryKind:'payment',actual:2400,planned:null,currency:'SEK',rate:1,payer:'Markus',splits:[{name:'Markus',weight:1},{name:'Maja',weight:1}],bookingId:'hotel'}],
   ['note','note',{title:'Små saker att minnas',notes:'# En lugn första dag\n- [ ] Köp något till tåget\n- [x] Ladda ned biljetterna',pinned:true,date:'2026-11-02'}]
  ].map(([id,type,data])=>({id,changes:{type,tripId:'design-trip',...data}}))
 ]);});
 await page.locator('[data-trip="design-trip"]').click();
 async function shot(name){await geometry(page);await page.locator('#section-title').scrollIntoViewIfNeeded();await page.evaluate(()=>document.getElementById('section-title').scrollIntoView({block:'start'}));await page.screenshot({path:out+'/experience-'+name+'.png'});}
 await shot('overview-390');
 assert.equal(await page.locator('#tabs button').count(),6,'Six focused main sections');
 await page.locator('#tabs [data-tab=activity]').click();
 assert.equal(await page.locator('.journey-day').count(),7);
 assert.match(await page.locator('[data-journey-day="2026-11-03"]').textContent(),/Hotel Strand/,'Stay spans all its days');
 await shot('journey-390');
 await page.setViewportSize({width:1280,height:1000});await shot('journey-1280');await page.setViewportSize({width:390,height:844});
 await page.locator('[data-plan-view=week]').click();assert.equal(await page.locator('.week-agenda-day:visible').count(),7);
 await shot('week-390');
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.compact-week');assert.equal(await page.locator('[data-plan-view=week]').getAttribute('aria-pressed'),'true','View remembered after reload');

 await tab(page,'activity');await page.locator('[data-day="2026-11-02"]').click();await shot('calendar-390');
 const events=await page.locator('.selected-day .calendar-event').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.item,x:r.x,y:r.y,w:r.width,h:r.height};}));
 const train=events.find(x=>x.id==='train'),walk=events.find(x=>x.id==='walk');assert(train.x+train.w<=walk.x+1,'Overlapping time blocks must use separate columns');assert(train.h>events.find(x=>x.id==='breakfast').h,'Event height must follow duration');
 await page.locator('.selected-day [data-edit="train"]').click();
 assert(await page.locator('#editor.inline-editor').count());assert.equal(await page.locator('dialog:modal').count(),0,'Activity should edit in the page');
 await page.locator('#edit-form [name=title]').fill('Tåg genom Sverige');await geometry(page);await page.locator('#editor').screenshot({path:out+'/experience-inline-390.png'});await save(page);
 assert.equal(await page.evaluate(()=>TravelStore.get('train').title),'Tåg genom Sverige');
 await page.setViewportSize({width:1280,height:1000});await page.locator('[data-plan-view=week]').click();await page.locator('.calendar-days').screenshot({path:out+'/experience-calendar-1280.png'});await geometry(page);assert.equal(await page.locator('.calendar-day:visible').count(),7);await page.locator('.calendar-days [data-edit="train"]').click();assert((await page.locator('#editor').boundingBox()).width>700,'Week editor must span the calendar, not one narrow day');await page.locator('#close').click();
 await page.setViewportSize({width:390,height:844});
 for(const name of ['packing','task','booking','expense','place']){await tab(page,name);if(name==='place'){await page.waitForSelector('.leaflet-interactive');await page.locator('[data-map-focus="place"]').click();assert(await page.locator('#place-place.selected').count());}await shot(name+'-390');}
 await page.locator('[data-schedule="place"]').click();assert.equal(await page.locator('dialog:modal').count(),0);await page.locator('#edit-form [name=title]').fill('Eftermiddag i Nyhavn');await save(page);assert(await page.evaluate(()=>TravelStore.list().some(x=>x.type==='activity'&&x.placeId==='place')));
 await tab(page,'expense');await page.locator('[data-budget="actual"]').click();await page.locator('#expense-quick [name=title]').fill('Lunch vid vattnet');await page.locator('#expense-quick [name=actual]').fill('480');await page.locator('#expense-quick [name=payer]').selectOption('Maja');await page.locator('#expense-quick [type=submit]').click();await page.waitForFunction(()=>TravelStore.list().some(x=>x.title==='Lunch vid vattnet'&&x.actual===480));const lunchId=await page.evaluate(()=>TravelStore.list().find(x=>x.title==='Lunch vid vattnet').id);await page.locator('[data-inline-actual="'+lunchId+'"]').click();await page.locator('.travel-inline-control').fill('450');await page.locator('.travel-inline-control').press('Enter');await page.waitForFunction(id=>TravelStore.get(id).actual===450,lunchId);await shot('payments-390');
 await tab(page,'expense');await page.locator('[data-budget=split]').click();assert.match(await page.locator('.settlement-transfer').first().textContent(),/Maja.*Markus.*1.200/);await shot('settlement-390');
 await tab(page,'task');assert.equal(await page.locator('[data-task-owner=task] .travel-owner-dot').count(),1);assert.match(await page.locator('[data-task-owner=task] .travel-owner-dot').getAttribute('style'),/#F9A8B8/);
 await tab(page,'packing');await page.locator('[data-pack-person=Markus]').click();await page.locator('[data-missing]').click();assert.equal(await page.locator('.packing-group [data-item]').count(),1);await shot('preparation-390');
 await tab(page,'note');await page.locator('[data-note-check="note"]').first().check();await page.waitForFunction(()=>TravelStore.get('note').notes.includes('- [x] Köp'));
 await page.locator('[data-note-task="note"]').click();assert.equal(await page.locator('#edit-form [name=title]').inputValue(),'Små saker att minnas');assert.equal(await page.locator('dialog:modal').count(),0);await save(page);await shot('notes-390');
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const g=c.getContext('2d');const grad=g.createLinearGradient(0,0,640,480);grad.addColorStop(0,'#6a9c9b');grad.addColorStop(1,'#d9aa74');g.fillStyle=grad;g.fillRect(0,0,640,480);return c.toDataURL().split(',')[1];});
 await tab(page,'photo');await page.locator('[data-direct-upload="photo"]').setInputFiles([{name:'Nyhavn.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},{name:'Morgonljus.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}]);await page.waitForFunction(()=>document.querySelectorAll('.gallery figure').length===2);await shot('album-390');assert.equal(await page.locator('.journal-day .gallery figure').count(),2);assert(await page.locator('.journal-day .note-card').count(),'Images and writing share a journal');
 await tab(page,'document');await page.locator('[data-direct-upload="document"]').setInputFiles({name:'Tågbiljett.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='document'&&x.title==='Tågbiljett'));await page.evaluate(async()=>{const doc=TravelStore.list().find(x=>x.type==='document');await TravelStore.patch(doc.id,{important:true,category:'Biljetter'});});await page.locator('[data-document-booking]').selectOption('hotel');await page.waitForFunction(()=>TravelStore.list().find(x=>x.type==='document').bookingId==='hotel');await page.locator('[data-document-booking]').blur();await page.waitForSelector('[data-item=hotel] .booking-documents [data-document-booking]');await shot('wallet-390');await page.setViewportSize({width:1280,height:1000});await shot('wallet-1280');await page.setViewportSize({width:390,height:844});
 // Switching views must preserve an unfinished inline draft, and reload must retain saved data.
 await tab(page,'note');await page.locator('#add').click();await page.locator('#edit-form [name=title]').fill('Nästa dags idéer');await tab(page,'booking');await tab(page,'note');await page.locator('#add').click();assert.equal(await page.locator('#edit-form [name=title]').inputValue(),'Nästa dags idéer');await page.locator('#close').click();
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>TravelStore.list().some(x=>x.title==='Lunch vid vattnet'));
 await page.setViewportSize({width:320,height:844});await page.locator('#tabs [data-tab=activity]').click();await page.locator('[data-plan-view=journey]').click();await shot('journey-320');await page.locator('[data-plan-view=week]').click();await shot('week-320');
 for(const name of ['activity','expense','booking','place','document','note']){await tab(page,name);await geometry(page);}
 await tab(page,'booking');await page.locator('#add').click();await page.locator('#edit-form [name=category]').selectOption('Flyg');await geometry(page);await page.locator('#editor').screenshot({path:out+'/experience-inline-320.png'});await page.locator('#close').click();
 await page.evaluate(async()=>{await TravelStore.add('trip','',{title:'Avslutad resa',departure:'2025-01-01T08:00',endDate:'2025-01-05',timezone:'Europe/Stockholm',currency:'SEK'});});
 const oldTrip=await page.evaluate(()=>TravelStore.list().find(x=>x.title==='Avslutad resa').id);await page.locator('[data-trip="'+oldTrip+'"]').click();await tab(page,'overview');assert.match(await page.locator('#content').textContent(),/VÄLKOMNA HEM/);
 await page.goto(base+'/budget/travel.html?trip=design-trip&tab=packing',{waitUntil:'domcontentloaded'});await page.waitForSelector('.packing-group');assert.equal(await page.locator('#tabs [aria-current=page]').textContent(),'Förberedelser');
 await page.goto(base+'/budget/travel.html?trip=design-trip&tab=document',{waitUntil:'domcontentloaded'});await page.waitForSelector('.wallet-loose');assert.equal(await page.locator('#tabs [aria-current=page]').textContent(),'Bokningar & biljetter');
 assert.deepEqual(errors,[]);await browser.close();console.log('Travel experience: calendar lanes, mobile and desktop, inline drafts, map links, expense quick entry, checklists, albums, direct uploads and wallet passed.');
})().catch(e=>{console.error(e);process.exit(1);});
