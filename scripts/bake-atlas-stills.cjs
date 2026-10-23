const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const out='test-results/atlas-stills';
const groups=['Bröst','Rygg','Axlar','Biceps','Triceps','Mage','Säte','Framsida lår','Baksida lår','Vader'];
const slugs=['chest','back','shoulders','biceps','triceps','abs','glutes','quads','hamstrings','calves'];
const front=[1,0,2,1,1,0,1,1,1,1],back=[7,6,8,7,8,6,7,7,7,7];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const executablePath=execFileSync('sh',['-c','command -v google-chrome || command -v chromium']).toString().trim();
 const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:900,height:1100}});
 const original=fs.readFileSync('budget/pulse-muscle-atlas-3d.js','utf8');
 const source=original.replace('      let lastFrame = 0;',`
      window.captureAtlasStill = (angle, group) => {
        highlight(group);
        renderer.setPixelRatio(1);
        renderer.setSize(720, 900, false);
        camera.aspect = 720/900;
        const yaw=angle*Math.PI/6;
        const distance=height*2.02;
        camera.position.set(Math.sin(yaw)*distance,height*0.025,Math.cos(yaw)*distance);
        camera.lookAt(0,height*0.025,0);
        camera.updateProjectionMatrix();
        renderer.render(scene,camera);
        return renderer.domElement.toDataURL('image/webp',0.94).split(',')[1];
      };
      return;
      let lastFrame = 0;`);
 await page.route('**/pulse-muscle-atlas-3d.js?*',route=>route.fulfill({contentType:'text/javascript',body:source}));
 await page.goto('http://127.0.0.1:4173/budget/pulse-exercise-guide.html');
 await page.waitForFunction(()=>!!window.captureAtlasStill,{},{timeout:120000});
 const manifest={version:1,width:720,height:900,neutral:[],groups:{}};
 const capture=async(name,angle,group)=>{
  const data=await page.evaluate(({angle,group})=>window.captureAtlasStill(angle,group),{angle,group});
  fs.writeFileSync(path.join(out,name),Buffer.from(data,'base64'));
  return name;
 };
 for(let angle=0;angle<12;angle++)manifest.neutral.push(await capture(`view-${angle}.webp`,angle,null));
 for(let i=0;i<groups.length;i++){
  manifest.groups[groups[i]]={};
  for(const side of ['front','back']){
   const angle=(side==='front'?front:back)[i];
   manifest.groups[groups[i]][side]={angle,image:await capture(`${slugs[i]}-${side}.webp`,angle,groups[i])};
  }
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 await browser.close();
 console.log('Rendered 12 neutral angles and 20 muscle views.');
})().catch(e=>{console.error(e);process.exit(1)});
