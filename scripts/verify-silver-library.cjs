const {chromium,webkit}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict'),{execSync}=require('child_process');
const dir='test-results/silver-press/library';fs.mkdirSync(dir,{recursive:true});
const muscleNames=['Bröst','Rygg','Axlar','Biceps','Triceps','Mage','Säte','Framsida lår','Baksida lår','Vader'];
async function render(page,i,t,cycle,viewIndex=0){
 return page.evaluate(({i,t,cycle,viewIndex})=>{
  const cfg=guideScenes[i];
  document.querySelector('.stage-label').textContent=cfg.stance;
  const frame={t,cycle,index:i,kind:cfg.kind,viewIndex,view:cfg.views[viewIndex],bounds:sceneFrame(i,viewIndex),motion:i===0?null:makeScene(i,t,cycle,true),muscles:exercises[i].muscles};
  if(!window.PulseSilverPress.update(frame))throw new Error('Renderer unavailable');
  return {kind:cfg.kind,muscles:exercises[i].muscles,pose:window.PulseSilverPress.pose,...window.PulseSilverPress.inspect()};
 },{i,t,cycle,viewIndex});
}
(async()=>{
 const chrome=execSync('command -v google-chrome || command -v chromium').toString().trim();
 const browser=await chromium.launch({executablePath:chrome,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader|VALIDATE|GL_INVALID/.test(m.text()))errors.push(m.text());});
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:4173/budget/pulse-exercise-guide.html');
 await page.locator('#atlas-show-exercises').click();await page.waitForFunction(()=>window.PulseSilverPress?.ready,null,{timeout:35000});
 await page.evaluate(()=>{paused=true;});
 const catalogue=await page.evaluate(()=>exercises.map((e,i)=>({name:e.name,kind:guideScenes[i].kind,muscles:e.muscles})));
 assert.equal(catalogue.length,54);
 const results=[];
 for(let i=0;i<catalogue.length;i++){
  const phases=[];
  for(const [phase,t,cycle] of [['start',0,0],['end',1,.5]]){
   const result=await render(page,i,t,cycle);phases.push(result);
   assert.ok([...result.min,...result.max].every(Number.isFinite),`${i} finite skinned model`);
   assert.ok(result.max.every((v,k)=>v-result.min[k]<3.5),`${i} no exploded mesh`);
   assert.equal(result.performance.canvases,1);
   assert.ok(result.performance.calls<250,`${i} bounded draw calls`);
   const expected=muscleNames.map(n=>catalogue[i].muscles.includes(n)?catalogue[i].muscles[0]===n?2:1:0);
   assert.deepEqual(result.muscles,expected,`${i} muscle selection`);
   const gripError=Math.max(...result.pose.wrists.map((w,j)=>Math.hypot(...w.map((v,k)=>v-result.pose.grips[j][k]))));
   if(i!==0)assert.ok(gripError<.01,`${i} hand/equipment alignment`);
   await page.locator('#studio-stage').screenshot({path:`${dir}/${String(i).padStart(2,'0')}-${phase}.png`});
  }
  results.push({name:catalogue[i].name,kind:catalogue[i].kind,phases});
 }
 // Repeated exercise switching must reuse geometry and shader programs.
 const memory=await render(page,53,.5,.25);
 for(let round=0;round<2;round++)for(let i=0;i<54;i++)await render(page,i,.5,.25);
 const after=await render(page,53,.5,.25);
 assert.equal(after.performance.geometries,memory.performance.geometries,'stable geometry count');
 assert.equal(after.performance.programs,memory.performance.programs,'stable shader count');
 assert.ok(!requests.some(u=>/skin\.glb|muscles\.glb/.test(u)),'no legacy anatomy downloads');
 assert.equal(requests.filter(u=>u.includes('silver-mannequin-v1/body.bin')).length,1,'one shared body download');
 for(const width of [320,1280]){
  await page.setViewportSize({width,height:900});await render(page,27,.5,.25);
  await page.locator('#studio-stage').screenshot({path:`${dir}/squat-${width}.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 // Both sides of an alternating movement, plus rear view for posterior muscles.
 await page.setViewportSize({width:390,height:844});
 for(const i of [10,23,25,28,50,51]){
  await render(page,i,.5,.75,1);await page.locator('#studio-stage').screenshot({path:`${dir}/${i}-alternate.png`});
 }
 assert.deepEqual(errors,[]);await browser.close();
 const safari=await webkit.launch();const mobile=await safari.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto('http://127.0.0.1:4173/budget/pulse-exercise-guide.html');await mobile.locator('#atlas-show-exercises').click();
 await mobile.waitForFunction(()=>window.PulseSilverPress?.ready||window.PulseSilverPress?.failed);
 assert.ok(await mobile.evaluate(()=>window.PulseSilverPress.ready),'WebKit 3D available');
 for(const i of [0,5,17,23,27,35,50,51]){await render(mobile,i,.5,.25);await mobile.locator('#studio-stage').screenshot({path:`${dir}/webkit-${i}.png`});}
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await safari.close();assert.deepEqual(errors,[]);
 fs.writeFileSync(`${dir}/verification.json`,JSON.stringify({results,memory:after.performance,requests:requests.filter(u=>/body\.(json|bin)|\.glb/.test(u)),errors},null,2));
 console.log('All 54 exercises passed; shared resources:',after.performance);
})().catch(e=>{console.error(e);process.exit(1)});
