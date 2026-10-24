const {webkit}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await webkit.launch();
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:4173/budget/pulse-exercise-guide.html');
 const atlas=page.locator('#atlas-stills');
 const settled=async group=>page.waitForFunction(group=>{
  const atlas=document.querySelector('#atlas-stills');
  return atlas.dataset.muscle===group&&atlas.getAttribute('aria-busy')==='false';
 },group);
 const choose=group=>page.locator('.living-muscle-chip[data-atlas-muscle="'+group+'"]').click();
 const dir='test-results/atlas-stills-ui'; fs.mkdirSync(dir,{recursive:true});
 const geometry=async()=>{
  const g=await page.evaluate(()=>{
   const scene=document.querySelector('.atlas-visual').getBoundingClientRect();
   const controls=document.querySelector('.atlas-view-controls').getBoundingClientRect();
   const img=document.querySelector('#atlas-stills img:last-child');
   return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,scene:{x:scene.x,width:scene.width,height:scene.height},controlsInside:controls.x>=scene.x&&controls.right<=scene.right&&controls.top>=scene.top&&controls.bottom<=scene.bottom,image:img.naturalWidth,legacy:getComputedStyle(document.querySelector('#atlas-figure')).display};
  });
  assert.ok(g.scrollWidth<=g.width,'horizontal page overflow');
  assert.ok(g.scene.height>250&&g.scene.height<650,'stage height');
  assert.ok(Math.abs(g.scene.width-g.scene.height)<2,'square composition');
  assert.ok(g.controlsInside,'camera controls stay inside stage');
  assert.ok(g.image>0);assert.equal(g.legacy,'none');
  return g;
 };
 await settled('Bröst'); await page.waitForTimeout(1400);
 await geometry();
 await page.screenshot({path:dir+'/page-mobile.png',fullPage:true});
 await choose('Rygg'); await settled('Rygg');
 const early=await atlas.locator('img').last().evaluate(img=>getComputedStyle(img).transform);
 await page.screenshot({path:dir+'/zoom-start.png'});
 await page.waitForTimeout(1400);
 const late=await atlas.locator('img').last().evaluate(img=>getComputedStyle(img).transform);
 assert.notEqual(early,late,'camera should move');
 await page.screenshot({path:dir+'/zoom-end.png'});
 await page.locator('#atlas-overview').click(); await page.waitForTimeout(700);
 assert.equal(await atlas.getAttribute('data-camera'),'overview');
 assert.equal(await atlas.locator('img').last().evaluate(img=>getComputedStyle(img).transform),'matrix(1, 0, 0, 1, 0, 0)');
 await page.locator('#atlas-closeup').click();
 await choose('Axlar'); await choose('Bröst'); await settled('Bröst');
 await page.waitForTimeout(1400); assert.equal(await atlas.getAttribute('data-muscle'),'Bröst');
 assert.equal(await atlas.locator('img').count(),1);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const group of ['Axlar','Rygg','Biceps','Triceps','Mage','Framsida lår','Säte','Baksida lår','Vader','Bröst']){
  await choose(group);await settled(group);
  assert.equal(await atlas.locator('img').last().evaluate(img=>img.getAnimations().length),0);
 }
 await page.setViewportSize({width:320,height:844});await geometry();
 await page.screenshot({path:dir+'/page-320.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await geometry();
 await page.screenshot({path:dir+'/page-desktop.png',fullPage:true});
 await page.locator('#atlas-show-exercises').click();
 assert.equal(await page.locator('#studio-shell').isVisible(),true);
 assert.deepEqual(errors,[]);
 assert.ok(!requests.some(url=>/atlas-stills-v1|pulse-muscle-atlas-3d\.js/.test(url)),'old atlas must not load');
 fs.writeFileSync(dir+'/verification.json',JSON.stringify({browser:'WebKit',errors,checks:['10 images','zoom phases','overview','rapid cancellation','reduced motion','320/390/1280 geometry','studio opens','no old atlas requests']},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
