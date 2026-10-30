const {webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
fs.mkdirSync('test-results/zen-plans',{recursive:true});
(async()=>{for(const width of [390,320,1280]){
 const browser=await webkit.launch(),context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});
 await context.route('https://**/*',r=>r.fulfill({body:''}));await context.route('**/auth-gate.js*',r=>r.fulfill({body:''}));await context.route('**/firebase-sync.js*',r=>r.fulfill({body:''}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/budget/exercise.html');await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__embeddedBuilderReadyV1);
 let frame=page.frames().find(f=>f.url().includes('archive/exercise.html'));await frame.evaluate(()=>window.__embeddedBuilderReadyV1);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool:'createTemplate'}})));
 await frame.waitForSelector('#day-workout-modal.show.classic-template-edit-mode');
 const b=frame.locator('[onclick="pulseClassicNewTemplate()"]');const rect=await b.evaluate(el=>({r:el.getBoundingClientRect().toJSON(),scroll:el.scrollWidth,width:el.clientWidth}));assert.ok(rect.scroll<=rect.width+1,JSON.stringify(rect));assert.ok(rect.r.right<=width);
 await page.screenshot({path:`test-results/zen-plans/${width}-template.jpg`});
 await frame.evaluate(()=>closeModal('day-workout-modal'));await page.waitForFunction(()=>!document.getElementById('field-workspace').open);
 await frame.evaluate(()=>{DB.set('wk',[{id:1,date:todayISO(),type:'Styrka',exercises:[{name:'Bänkpress',kind:'strength',sets:3,reps:10,weight:100}]}]);DB.set('prs',{});});
 await page.waitForSelector('.record-weight-edit');await page.locator('.record-weight-edit').first().click();await frame.waitForSelector('#pr-modal.show');await frame.locator('#pr-val').fill('75');await frame.locator('#pr-modal .btn-primary').click();
 await page.waitForFunction(()=>!document.getElementById('field-workspace').open);await page.waitForFunction(()=>document.querySelector('.record-weight-edit')?.textContent.includes('75'));
 for(const [routine,k,offset] of [['forest','stretch',1],['water','meditation',2]]){
 const date=await frame.evaluate(n=>shiftISODate(todayISO(),n),offset);
 await page.evaluate(date=>window.dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool:'editDay',date}})),date);
 await frame.waitForSelector('#day-workout-modal.show');await frame.locator('.pulse-zen-picker summary').click();
 await page.screenshot({path:`test-results/zen-plans/${width}-${k}-picker.jpg`});
 await frame.locator(`[data-zen-routine="${routine}"]`).click();await page.waitForFunction(()=>!document.getElementById('field-workspace').open);
 assert.equal(await frame.evaluate(date=>getPlannedSessions()[date].zenRoutine.kind,date),k);
 }
 await page.reload();await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__embeddedBuilderReadyV1);frame=page.frames().find(f=>f.url().includes('archive/exercise.html'));await page.locator('#edit-week-link').click();await frame.waitForSelector('#plan-modal.show');await frame.locator('[data-plan-view="month"]').click();
 await page.screenshot({path:`test-results/zen-plans/${width}-month.jpg`});assert.ok(await frame.locator('.planner-month-grid .pulse-zen-icon').count()>=2);
 const geo=await frame.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(geo.s<=geo.w+1);assert.deepEqual(errors,[]);
 await context.close();await browser.close();
}console.log('ZEN_PLANS_PASS');})().catch(e=>{console.error(e);process.exit(1)});
