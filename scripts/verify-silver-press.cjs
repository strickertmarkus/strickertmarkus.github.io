const {chromium,webkit}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict'),{execSync}=require('child_process');
const dir='test-results/silver-press';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const chrome=execSync('command -v google-chrome || command -v chromium').toString().trim();
 const browser=await chromium.launch({executablePath:chrome,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/budget/pulse-exercise-guide.html');
 await page.locator('#atlas-show-exercises').click();
 await page.waitForFunction(()=>window.PulseSilverPress?.ready,{timeout:30000});
 await page.locator('#pause').click();
 await page.locator('#studio-stage').scrollIntoViewIfNeeded();
 const poses=[];
 for(const [name,t] of [['start',0],['middle',.5],['extended',1]]){
  const result=await page.evaluate(t=>{window.PulseSilverPress.update({t,viewIndex:0});return {pose:window.PulseSilverPress.pose,model:window.PulseSilverPress.model}},t);
  poses.push(result.pose);assert.ok(result.model.vertices>5000);
  for(let i=0;i<2;i++){
   const p=result.pose,w=p.wrists[i],e=p.elbows[i],s=p.shoulders[i],g=p.grips[i];
   const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
   assert.ok(dist(w,g)<.06,'hand remains attached to handle');
   assert.ok(Math.abs(dist(s,e)-.329)<.01,'constant upper-arm length');
   assert.ok(Math.abs(dist(w,e)-.27)<.02,'constant forearm length');
  }
  await page.locator('#studio-stage').screenshot({path:dir+'/'+name+'-390.png'});
 }
 assert.notDeepEqual(poses[0].wrists,poses[2].wrists,'visible movement');
 await page.locator('#view-toggle').click();
 await page.locator('#studio-stage').screenshot({path:dir+'/alternate-390.png'});
 await page.screenshot({path:dir+'/studio-390.png',fullPage:true});
 await page.locator('#toggle-exercise-3d').click();
 assert.equal(await page.locator('#studio-stage').evaluate(e=>e.classList.contains('silver-press-ready')),false);
 assert.ok(await page.locator('#exercise-figure').isVisible());
 await page.locator('#toggle-exercise-3d').click();
 await page.locator('#studio-next').click();
 assert.equal(await page.locator('#studio-stage').evaluate(e=>e.classList.contains('silver-press-ready')),false);
 await page.locator('#studio-prev').click();
 for(const width of [320,1280]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>window.PulseSilverPress.update({t:.5,viewIndex:0}));
  await page.locator('#studio-stage').screenshot({path:dir+'/stage-'+width+'.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 assert.deepEqual(errors,[]);await browser.close();
 const safari=await webkit.launch();
 const mobile=await safari.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await mobile.goto('http://127.0.0.1:4173/budget/pulse-exercise-guide.html');
 await mobile.locator('#atlas-show-exercises').click();
 await mobile.waitForFunction(()=>window.PulseSilverPress?.ready||window.PulseSilverPress?.failed);
 const webkit3D=await mobile.evaluate(()=>window.PulseSilverPress.ready);
 await mobile.locator('#studio-stage').screenshot({path:dir+'/webkit-390.png'});
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(!webkit3D)assert.ok(await mobile.locator('#exercise-figure').isVisible());
 await safari.close();
 fs.writeFileSync(dir+'/verification.json',JSON.stringify({errors,webkit3D,poses,checks:['default chest preview','three phases','constant arm lengths','grip alignment','view toggle','SVG fallback','other exercises unchanged','320/390/1280']},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
