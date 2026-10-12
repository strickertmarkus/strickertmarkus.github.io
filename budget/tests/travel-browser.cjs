'use strict';
const {webkit,chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base='http://127.0.0.1:4173/budget/travel.html';
function install(){
 const auth={onAuthStateChanged(fn){queueMicrotask(()=>fn({uid:'test'}));},currentUser:{uid:'test'}};
 let state=JSON.parse(localStorage.getItem('__travelRemote')||'{"items":{},"files":{}}'),listener;
 const persist=()=>localStorage.setItem('__travelRemote',JSON.stringify(state));
 const ref=path=>({child:s=>ref(path+'/'+s),on(_,cb){listener=cb;queueMicrotask(()=>cb({val:()=>state.items}));},off(){},async update(patch){const id=path.split('/').at(-1);state.items[id]={...state.items[id],...patch};persist();listener?.({val:()=>state.items});},async set(value){state.files[path.split('/').at(-1)]=value;persist();},async once(){return {val:()=>state.files[path.split('/').at(-1)]};}});
 window.firebase={apps:[{}],auth:()=>auth,database:()=>({ref}),initializeApp(){}};
}
async function setup(browser,width){const context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600});await context.addInitScript(install);await context.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({body:'// test double',contentType:'application/javascript'}));await context.route('**/auth-gate.js',r=>r.fulfill({body:'// authorized isolated fixture',contentType:'application/javascript'}));await context.route('https://maps.google.com/**',r=>r.fulfill({body:'<p>Map fixture</p>',contentType:'text/html'}));return context;}
(async()=>{
 fs.mkdirSync('test-results/travel',{recursive:true});const browser=await webkit.launch(),ctx=await setup(browser,390),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>window.TravelStore);await page.evaluate(()=>TravelStore.ready);
 assert.equal(await page.locator('#empty').isVisible(),true);assert.equal(await page.locator('#trips button').count(),0);
 await page.locator('#empty [data-new="trip"]').click();
 await page.locator('[name=title]').fill('Familjens höstresa');await page.locator('[name=destination]').fill('Köpenhamn');await page.locator('[name=departure]').fill('2026-11-01T08:30');await page.locator('[name=endDate]').fill('2026-11-06');await page.locator('[name=travelers]').fill('Markus, Maja');await page.locator('[name=budget]').fill('15000');await page.locator('[name=notes]').fill('En lugn vecka med familjen.');await page.locator('[type=submit]').click();
 await page.waitForSelector('#workspace:not([hidden])');const id=await page.evaluate(()=>TravelStore.list().find(x=>x.type==='trip').id);
 await page.evaluate(async id=>{
 await TravelStore.add('activity',id,{title:'Tåg till Köpenhamn',date:'2026-11-01',time:'08:30',endTime:'12:00',location:'København H',category:'Transport'});
 await TravelStore.add('activity',id,{title:'Lunch och promenad',date:'2026-11-01',time:'13:00',location:'Nyhavn',category:'Mat'});
 await TravelStore.add('place',id,{title:'Botaniska trädgården',location:'Botanisk Have København',category:'Sevärdhet'});
 await TravelStore.add('expense',id,{title:'Tågbiljetter',currency:'SEK',rate:1,planned:2400,actual:2200,payer:'Markus'});
 await TravelStore.add('booking',id,{title:'Hotell',date:'2026-11-01',endDate:'2026-11-06',reference:'TEST-123',status:'Bokat'});
 await TravelStore.add('task',id,{title:'Packa regnkläder',category:'Packlista',owner:'Maja',done:false});
 },id);
 await page.screenshot({path:'test-results/travel/overview-390.png',fullPage:true});
 await page.locator('[data-tab=activity]').click();assert.equal(await page.locator('.agenda').count(),2);
 await page.locator('[aria-label="Flytta upp"]').last().click();await page.waitForFunction(()=>document.querySelector('.agenda h3').textContent==='Lunch och promenad');
 await page.locator('#add').click();await page.locator('[name=title]').fill('Ett sparat utkast');await page.locator('#close').click();await page.locator('#add').click();assert.equal(await page.locator('[name=title]').inputValue(),'Ett sparat utkast');await page.locator('[name=date]').fill('2026-11-02');await page.locator('[type=submit]').click();await page.waitForFunction(()=>TravelStore.list().filter(x=>x.type==='activity').length===3);
 await page.screenshot({path:'test-results/travel/schedule-390.png',fullPage:true});
 await page.locator('[data-tab=task]').click();await page.locator('[data-check]').check();await page.waitForFunction(()=>TravelStore.list().find(x=>x.type==='task').done);
 await page.locator('[data-tab=expense]').click();assert.match(await page.locator('#content').textContent(),/2.200/);
 await page.locator('[data-tab=place]').click();assert.match(await page.locator('#map').getAttribute('src'),/Botanisk/);
 await page.locator('[data-tab=photo]').click();await page.locator('#add').click();await page.locator('[name=title]').fill('Omslagsbild');
 // Real upload/resize/storage, using a test-only generated canvas (no production demo assets).
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=180;const x=c.getContext('2d');x.fillStyle='#43777b';x.fillRect(0,0,300,180);return c.toDataURL().split(',')[1];});
 await page.locator('[name=upload]').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.locator('[type=submit]').click();await page.waitForSelector('.photo');await page.locator('[data-cover]').click();
 const backup=await page.evaluate(()=>TravelStore.exportBackup());assert.equal(Object.keys(backup.files).length,1);
 await page.reload();await page.waitForFunction(()=>TravelStore.list().some(x=>x.type==='trip'));await page.locator('[data-tab=task]').click();assert.equal(await page.locator('[data-check]').isChecked(),true);
 await page.locator('#content [data-edit]').click();page.once('dialog',d=>d.accept());await page.locator('#delete').click();await page.waitForFunction(()=>TravelStore.list().find(x=>x.type==='task').deleted);
 await page.locator('.tools summary').click();await page.locator('#trash').click();await page.locator('[data-restore]').click();await page.locator('#close-trash').click();await page.waitForFunction(()=>!TravelStore.list().find(x=>x.type==='task').deleted);
 await page.evaluate(data=>TravelStore.importBackup(data),backup);assert.equal(await page.evaluate(()=>TravelStore.list().filter(x=>x.type==='trip').length),2);
 await page.locator('[data-tab=overview]').click();
 for(const width of [320,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:'test-results/travel/overview-'+width+'.png',fullPage:true});}
 await page.setViewportSize({width:320,height:740});await page.locator('.hero [data-edit]').click();assert.equal(await page.locator('#editor').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);assert.equal(await page.locator('#editor input').evaluateAll(els=>els.every(el=>parseFloat(getComputedStyle(el).fontSize)>=16)),true);await page.screenshot({path:'test-results/travel/editor-320.png'});
 assert.deepEqual(errors,[]);await ctx.close();await browser.close();
 const android=await chromium.launch(),ac=await setup(android,412),ap=await ac.newPage();await ap.goto(base);await ap.locator('#empty [data-new=trip]').click();assert.equal(await ap.locator('#editor').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);await ap.screenshot({path:'test-results/travel/android-editor.png'});await android.close();console.log('Travel creation, draft, reorder, upload, backup, restore, reload and mobile geometry passed');
})().catch(e=>{console.error(e);process.exit(1);});
