const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=(name)=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const scene=read('pulse-gym-scene.js');
const guide=read('pulse-exercise-guide.html');
const sceneCSS=read('pulse-gym-scene.css');
const flowCSS=read('pulse-flow-layout.css');
const catalogue=read('pulse-explore.js');
function explorerFor(profile){
 const win={PULSE_EXPLORE_PROFILE:profile,location:{search:''}};
 vm.runInNewContext(catalogue,{window:win,URLSearchParams});
 return win.PulseExplore;
}
const mm=explorerFor('markus'),maja=explorerFor('maja'),ingemar=explorerFor('ingemar');
function parseScenePreview(explorer){
 const a=scene.indexOf('function mmProgram(){');
 const b=scene.indexOf('/* A programme before it plays:',a);
 assert(a>=0&&b>a,'pure scene overview helper present');
 const stub={
   explore:explorer,
   all:explorer.exercises,
   ICON:{back:'‹',fwd:'›',play:'▶'},
   pose:(id)=>'assets/exercise-poses-v2/'+String(id).padStart(2,'0')+'-start.webp',
   splitDose:(label)=>({big:label,unit:''})
 };
 vm.runInNewContext(scene.slice(a,b)+'\nthis.compactProgram=compactProgram;this.mmProgram=mmProgram;',stub);
 return stub;
}
function parseMainPreview(explorer){
 const a=guide.indexOf('function mmProgramme(){');
 const b=guide.indexOf('function mmShowDetail(index){',a);
 assert(a>=0&&b>a,'pure main overview/details helper present');
 const stub={
   explorer:explorer,
   exercises:explorer.exercises,
   safe:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
 };
 vm.runInNewContext(guide.slice(a,b)+'\nthis.mmOverviewHtml=mmOverviewHtml;this.mmDetailHtml=mmDetailHtml;this.mmProgramme=mmProgramme;',stub);
 return stub;
}
test('fullscreen programme overview shows one compact, static pose per exercise and short transitions',()=>{
 const sceneAPI=parseScenePreview(mm),program=mm.programs.find(p=>p.id==='mm-calisthenics-strength'),html=sceneAPI.compactProgram(program);
 assert.equal(sceneAPI.mmProgram(),true);
 assert.equal((html.match(/class="st-mm-row"/g)||[]).length,program.ids.length);
 assert.equal((html.match(/<img /g)||[]).length,program.ids.length);
 assert.equal((html.match(/<div class="st-mm-interval/g)||[]).length,program.ids.length-1);
 assert.match(html,/Översikt/);
 assert.match(html,/data-detail-step="0">Detalj/);
 assert.match(html,/Hopprep 45 s/);assert.match(html,/Vila 90 s/);
 assert.match(html,/2 hopprep · 2 vilor/);
 assert.match(html,/st-mm-summary/);
 assert.match(html,/st-mm-start/);
 assert.doesNotMatch(html,/st-stop-pad|st-road|st-path/);
});
test('both profiles have matching compact hierarchy; Ingemar retains animated path',()=>{
 assert.equal(parseScenePreview(maja).mmProgram(),true);
 assert.equal(parseScenePreview(ingemar).mmProgram(),false);
 assert.match(scene,/if\(mmProgram\(\)\)\{/);
 assert.match(scene,/drawRoad\(sheet\.querySelector\('\.st-path'\)\)/);
 assert.match(scene,/function openZoom\(p, i, from\)/);
 assert.match(scene,/st-mm-detail-tech/);
 assert.match(scene,/data-detail-prev/);
 assert.match(scene,/data-detail-next/);
 assert.match(scene,/ui\.select\(id\); ui\.setPaused\(false\)/);
});
test('standalone Programme tab also has compact overview and drilldown with next activity',()=>{
 const api=parseMainPreview(mm),p=mm.programs.find(x=>x.id==='mm-calisthenics-strength');
 assert.equal(api.mmProgramme(),true);
 const summary=api.mmOverviewHtml(p);
 assert.equal((summary.match(/class="mm-program-row"/g)||[]).length,p.ids.length);
 assert.equal((summary.match(/<img /g)||[]).length,p.ids.length);
 assert.match(summary,/Hopprep 45 s/);assert.match(summary,/Vila 90 s/);
 const detail=api.mmDetailHtml(p,1);
 assert.match(detail,/Dips/);assert.match(detail,/TEKNIK/);
 assert.match(detail,/mm-program-large-poses/);
 assert.match(detail,/data-mm-step="0"/);assert.match(detail,/data-mm-step="2"/);
 assert.match(detail,/data-technique="/);
 assert.match(detail,/Hopprep 45 s/);
 assert.equal(parseMainPreview(ingemar).mmProgramme(),false);
});
test('style scopes and asset versions protect Ingemar from layout regression',()=>{
 assert.match(sceneCSS,/\.st-sheet\.is-mm-program/);
 assert.match(sceneCSS,/\.st-zoom\.is-mm-detail/);
 assert.match(sceneCSS,/\.st-mm-sticky/);
 assert.match(sceneCSS,/\.st-mm-start/);
 assert.match(flowCSS,/\.mm-program-simplified/);
 assert.match(flowCSS,/\.mm-program-controls/);
 assert.match(guide,/pulse-gym-scene\.js\?v=20261103-history-back-3/);
 assert.match(guide,/pulse-gym-scene\.css\?v=20261103-small-play-3/);
 assert.match(guide,/pulse-flow-layout\.css\?v=20261103-overview-detail-2/);
 assert.match(scene,/sheet\.classList\.toggle\('is-mm-program',mmProgram\(\)\)/);
 assert.match(scene,/sheet\.classList\.remove\('is-program','is-mm-program'\)/);
});


test('Markus/Maja choose overview; Ingemar continues to draw the original path',()=>{
 const a=scene.indexOf('function showProgram(p) {');
 const b=scene.indexOf('/* The glowing road through the stops',a);
 assert.ok(a>=0&&b>a);
 for(const profile of ['markus','maja','ingemar']){
   const explore=explorerFor(profile),steps=[],classes=new Set();
   const sheet={
     innerHTML:'',scrollTop:0,
     setAttribute(){},focus(){},
     classList:{
       add:s=>classes.add(s),
       toggle:(s,v)=>v?classes.add(s):classes.delete(s)
     },
     querySelector:selector=>({selector})
   };
   const context={
     sheet,ui:{setPaused:v=>steps.push(['paused',v])},
     explore,viewing:null,
     mmProgram:()=>profile!=='ingemar',
     compactProgram:()=>'<section class="st-mm-summary">Compact</section>',
     all:explore.exercises,pose:()=>'',ICON:{back:'‹',play:'▶',fwd:'›'},
     splitDose:label=>({big:label,unit:'reps'}),
     requestAnimationFrame:fn=>fn(),
     drawRoad:el=>steps.push(['road',el.selector])
   };
   vm.runInNewContext(scene.slice(a,b)+'\nthis.preview=showProgram;',context);
   context.preview(explore.programs[0]);
   if(profile==='ingemar'){
     assert.match(sheet.innerHTML,/st-path/);
     assert.ok(steps.some(x=>x[0]==='road'));
     assert.ok(!classes.has('is-mm-program'));
   }else{
     assert.match(sheet.innerHTML,/st-mm-summary/);
     assert.ok(!steps.some(x=>x[0]==='road'));
     assert.ok(classes.has('is-mm-program'));
   }
   assert.ok(steps.some(x=>x[0]==='paused'&&x[1]));
 }
});
