const {webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
const dir='test-results/flow-layout';fs.mkdirSync(dir,{recursive:true});
const browser=await webkit.launch(),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
await page.goto('http://127.0.0.1:4173/budget/pulse-exercise-guide.html');
await page.waitForFunction(()=>window.PulseSilverPress?.ready,null,{timeout:35000});
assert.ok(await page.locator('#studio-shell').isVisible());assert.ok(await page.locator('#living-dock').isVisible());assert.equal(await page.locator('#discover-home').isVisible(),false);
await page.screenshot({path:dir+'/exercise-390.png'});
await page.locator('[data-studio-muscle="Rygg"]').click();
await page.locator('#exercise-picker').click();assert.ok(await page.locator('.catalog').isVisible());
const selected=await page.locator('#exercise-list [data-id]').nth(1).getAttribute('data-id');
await page.locator('#exercise-list [data-id]').nth(1).click();assert.equal(await page.locator('.catalog').isVisible(),false);
await page.locator('#studio-back').click();await page.waitForFunction(()=>document.body.classList.contains('exercise-list-open'));
assert.ok(await page.locator('.catalog').isVisible());
await page.locator('#living-dock [data-page="programs"]').click();
await page.locator('[data-program]').first().click();
const title=await page.locator('#program-title').innerText();
await page.screenshot({path:dir+'/program-390.png',fullPage:true});
await page.locator('#program-detail [data-technique]').nth(1).click();assert.ok(await page.locator('#studio-shell').isVisible());
await page.locator('#studio-back').click();await page.waitForFunction(()=>!document.querySelector('#programs-page').hidden);
assert.equal(await page.locator('#program-title').innerText(),title);assert.ok(await page.locator('#program-detail').isVisible());
await page.locator('#close-program').click();await page.waitForFunction(()=>document.querySelector('#program-detail').hidden);
await page.locator('#living-dock [data-page="guide"]').click();
await page.locator('#studio-filter-toggle').click();assert.ok(await page.locator('#studio-filters').isVisible());
await page.goBack();await page.waitForFunction(()=>document.querySelector('#studio-filters').hidden);
for(const width of [320,1280]){await page.setViewportSize({width,height:900});await page.screenshot({path:dir+'/exercise-'+width+'.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
assert.deepEqual(errors,[]);
// Isolate the local entry layout from the production sign-in redirect.
await page.route('**/auth-gate.js*',route=>route.fulfill({contentType:'application/javascript',body:''}));
await page.goto('http://127.0.0.1:4173/budget/exercise.html');await page.setViewportSize({width:390,height:844});await page.locator('#pulse-explore-link').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/entry-390.png'});
await browser.close();console.log('Unified navigation, program return, filters and responsive layout passed');
})().catch(e=>{console.error(e);process.exit(1)});
