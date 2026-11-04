const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const material=read('pulse-silver-material.js');
const stretch=read('pulse-silver-stretch.js');
const scene=read('zen-session-scene.js');
const sessionCss=read('zen-session.css');
const zenJs=read('zen.js');
const html=read('zen.html');
const trainingCss=read('training-pulse-field.css');
const trainingHtml=read('exercise.html');

test('milky-white mannequin and active-muscle green emission are exclusively stretch-owned',()=>{
  assert.match(stretch,/const skin=new THREE\.MeshStandardMaterial\(\{color:0xf1efe7,metalness:\.035,roughness:\.76\}/);
  assert.match(stretch,/vec3 chrome = mix\(vec3\(0\.48,0\.50,0\.47\), vec3\(0\.96,0\.96,0\.92\), ivoryShade\)/);
  assert.match(stretch,/roughness:\.70,metalness:\.04/);
  assert.match(stretch,/float muscleShape = max\(muscleTex, 0\.88\)/);
  assert.match(stretch,/mix\(0\.78,1\.0,primary\)/);
  assert.match(stretch,/totalEmissiveRadiance \+= vec3\(0\.30,0\.95,0\.14\)/);
  assert.match(stretch,/pulse-tissue-stretch-ivory-visible-muscle-v4/);
  assert.match(stretch,/createTissueMaterial\(skin,/);
  assert.doesNotMatch(material,/milk-white|ivoryShade|stretch-ivory|vec3\(0\.36,1\.0,0\.19\)/);
  assert.match(stretch,/mat\.onBeforeCompile=\(shader,r\)=>\{compile\(shader,r\);/);
  // Shader splice points still exist in the shared, unmodified explorer material.
  assert.match(material,/float clothingMask =/);
  assert.match(material,/float region=0\.0/);
  assert.match(material,/generalGlow\*=uActivation;/);
});

test('reaching arm moves as one joint chain: joints are smoothed, bones solved from them without twist',()=>{
  assert.match(stretch,/let poseReady=false,lastPoseTime=0,smoothJoints=null;/);
  assert.match(stretch,/const dt=lastPoseTime\?Math\.min\(\.08,Math\.max\(0,\(now-lastPoseTime\)\/1000\)\):0;/);
  assert.match(stretch,/1-Math\.exp\(-dt\/\.16\)/);
  assert.match(stretch,/smoothJoints\.forEach\(\(x,i\)=>x\.lerp\(flat\[i\],follow\)\)/);
  assert.match(stretch,/smoothJoints\[2\*child\]\.copy\(smoothJoints\[2\*parent\+1\]\)/);
  assert.match(stretch,/const base=i===3\|\|i===5\?solved\[i-1\]:i<=5\?torsoQ:new THREE\.Quaternion\(\)/);
  assert.doesNotMatch(stretch,/bones\[i\]\.position\.lerp\(p,follow\)/);
  assert.match(stretch,/muscles:\['Mage','Rygg'\]/);
  assert.match(stretch,/float flank=/);
  assert.match(stretch,/pose\(stepId,elapsed,performance\.now\(\)\)/);
  assert.match(stretch,/setPixelRatio\(Math\.min\(devicePixelRatio\|\|1,1\.35\)\)/);
  assert.match(scene,/const size=Math\.round\(2\*155\*s\)/);
});

test('stretch uses precisely the training-mode v67 straight-line markup, not its own circular timer',()=>{
  const v67=read('exercise-pulse-flow-motion-v67.js');
  assert.match(v67,/\.pf-pre-line-v80\{/);
  assert.match(v67,/\.pf-pre-line-fill-v80\{/);
  assert.match(v67,/\.pf-pre-line-dot-v80\{/);
  assert.match(v67,/function easeStep\(t\)/);
  for(const cls of ['pf-pre-line-v80','pf-pre-line-fill-v80','pf-pre-line-dot-v80','pf-pre-exercise-v80','pf-pre-heartbeat-v80']){
    assert.match(sessionCss,new RegExp(cls));
  }
  assert.match(html,/class="pf-pre-line-v80"/);
  assert.match(html,/class="pf-pre-line-fill-v80"/);
  assert.match(html,/class="pf-pre-line-dot-v80"/);
  assert.match(html,/id="session-prep-exercise" class="pf-pre-exercise-v80"/);
  assert.doesNotMatch(html,/stretch-orbit-visual stretch-prep-training-ring|stretch-prep-progress|stretch-clock-progress/);
  assert.doesNotMatch(scene,/renderStretchOrbit|paintStretchOrbits|stretchOrbits=/);
  assert.match(sessionCss,/background:linear-gradient\(90deg,rgba\(var\(--concept-timer-rgb\),\.22\),var\(--concept-timer-accent\)\)/);
  assert.match(sessionCss,/width:calc\(var\(--pf-pre-progress,0\) \* 100%\)/);
  assert.match(sessionCss,/background:radial-gradient\(410px 270px at 50% 48%/);
  assert.match(sessionCss,/--concept-timer-accent:#baff84/);
  assert.match(sessionCss,/@keyframes pfPreHeartbeatV80/);
  assert.match(sessionCss,/@keyframes pfPretimerHaloPulseV124/);
  assert.doesNotMatch(zenJs,/--zen-clock-progress|--prep-progress/);
});

test('same five-step ease curve as training mode advances each second, with pauses and no second clock',()=>{
  const begin=scene.indexOf(' let preWasVisible=false');
  const end=scene.indexOf(' function paint(now){',begin);
  assert.ok(begin>=0&&end>begin);
  const applied=[];
  const root={style:{setProperty(name,value){applied.push([name,Number(value)])}}};
  const classes=new Set();
  const numeral={
    textContent:'5',offsetWidth:52,
    classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)}
  };
  const ctx={
    $:id=>id==='session-prep-ring'?root:numeral,
    snapshot:{kind:'stretch',preparing:true,prepRemainingMs:5000,paused:false},
    sampledAt:1000,reduced:{matches:false}
  };
  vm.runInNewContext(scene.slice(begin,end)+'\nthis.paintPretimer=paintTrainingPretimer;',ctx);
  ctx.paintPretimer(1000);
  assert.equal(applied.at(-1)[0],'--pf-pre-progress');
  assert.equal(applied.at(-1)[1],0);
  assert.ok(classes.has('pf-pre-heartbeat-v80'));
  // First second of the training-mode clock: advance towards the first fifth.
  ctx.snapshot.prepRemainingMs=4000;
  ctx.sampledAt=2000;
  numeral.textContent='4';
  ctx.paintPretimer(2000);
  ctx.paintPretimer(2180);
  const halfway=applied.at(-1)[1];
  assert.ok(halfway>0&&halfway<.2,'step interpolation must be eased, not snapped');
  ctx.paintPretimer(2400);
  assert.equal(applied.at(-1)[1],.2);
  numeral.textContent='3';
  ctx.snapshot.prepRemainingMs=3000;ctx.sampledAt=3000;
  ctx.paintPretimer(3000);ctx.paintPretimer(3400);
  assert.equal(applied.at(-1)[1],.4);
  ctx.snapshot.paused=true;
  ctx.paintPretimer(3999);
  assert.equal(applied.at(-1)[1],.4);
  ctx.snapshot.preparing=false;
  ctx.paintPretimer(4100);
  assert.equal(applied.at(-1)[1],.4,'inactive pre-timer is no longer painted');
  assert.match(scene.slice(begin,end),/1-Math\.pow\(1-t,3\)/);
  assert.match(scene.slice(begin,end),/now-preStepStartedAt\)\/360/);
  assert.doesNotMatch(scene.slice(begin,end),/setInterval|requestAnimationFrame/);
  assert.match(scene,/paintSessionProgress\(now\);paintTrainingPretimer\(now\);/);
  assert.match(zenJs,/prepRemainingMs:preparing\?Math\.max\(0,session\.anchor-now\):0/);
});

test('preparation uses v67 dark full-screen radial gradient, not the old large inset card',()=>{
  assert.match(html,/id="session-preparation"/);
  assert.match(sessionCss,/body\[data-kind=stretch\] #session-preparation\.session-preparation\{[\s\S]*?position:fixed;inset:0/);
  assert.match(sessionCss,/background:radial-gradient\(410px 270px at 50% 48%/);
  assert.match(sessionCss,/rgba\(var\(--concept-timer-rgb\),\.065\),transparent 70%\),#080D14/);
  assert.match(sessionCss,/border:0;border-radius:0;box-shadow:none/);
  assert.match(sessionCss,/body\[data-kind=stretch\] #session-preparation \.session-prep-card h2\{display:none\}/);
  assert.match(zenJs,/session-prep-exercise/);
  assert.match(zenJs,/session\.anchor-now/);
});

test('desktop margins and stretching sizes do not affect mobile or meditation',()=>{
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-pose-3d/);
  assert.match(sessionCss,/--pose-size:clamp\(300px,min\(48vw,calc\(100dvh - 305px\)\),680px\)/);
  assert.match(sessionCss,/@media\(min-width:1050px\) and \(min-height:600px\)/);
  assert.match(trainingCss,/:root\{--field-max:1600px;--field-gutter:clamp\(52px,5vw,96px\)\}/);
  assert.match(trainingCss,/@media\(min-width:1000px\)/);
  assert.match(trainingCss,/\.field-header,\.kind-switch,main,\.field-footer\{width:min\(calc\(100% - 2 \* var\(--field-gutter\)\),var\(--field-max\)\)/);
});

test('page versions load the new scene, shader, styles and single source of time',()=>{
  assert.match(html,/zen-session\.css\?v=20261104-training-preline-5/);
  assert.match(html,/pulse-silver-stretch\.js\?v=20261104-joint-chain-1/);
  assert.match(html,/zen-session-scene\.js\?v=20261104-training-preline-5/);
  assert.match(html,/zen\.js\?v=20261104-training-preline-5/);
  assert.match(trainingHtml,/training-pulse-field\.css\?v=20261104-desktop-orbit-1/);
});


test('on mobile the SVG timer keeps updating while heavy forest/WebGL frames are throttled',()=>{
  const begin=scene.indexOf(' let lastHeavyPaint=0;');
  const end=scene.indexOf(' function showControls(){',begin);
  assert.ok(begin>0&&end>begin);
  let heavy=0,light=0,frames=0;
  const ctx={
    frame:0,active:true,document:{hidden:false},last:0,motionTime:0,
    snapshot:{kind:'stretch',preparing:false,paused:false},
    reduced:{matches:false},width:390,
    paint(){heavy++;},paintTrainingPretimer(){light++;},
    requestAnimationFrame(){frames++;return frames;},cancelAnimationFrame(){},
    performance:{now:()=>1000}
  };
  vm.runInNewContext(scene.slice(begin,end)+'\nthis.loop=loop;this.wake=wake;',ctx);
  ctx.loop(1000);assert.equal(heavy,1);
  ctx.loop(1016);assert.equal(heavy,1);assert.equal(light,1);
  ctx.loop(1032);assert.equal(heavy,2);
  ctx.loop(1048);assert.equal(light,2);
  assert.equal(frames,4,'single RAF scheduling path');
  ctx.width=1280;ctx.loop(1064);
  assert.equal(heavy,3,'desktop continues to render each frame');
});


test('iPhone viewport uses natural heading height, constrained mannequin and a single text time',()=>{
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-layout\{[\s\S]*?display:flex;flex-direction:column/);
  assert.match(sessionCss,/--pose-size:clamp\(156px,min\(calc\(100vw - 44px\),calc\(100dvh - 460px\)\),325px\)/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-copy\{[\s\S]*?max-height:none/);
  assert.match(sessionCss,/overflow:visible;overscroll-behavior:auto/);
  assert.match(sessionCss,/\.session-copy\.is-long h1\{[\s\S]*?overflow-wrap:anywhere/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-stage\{[\s\S]*?flex:0 0 var\(--pose-size\)/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-guidance\{[\s\S]*?transform:none!important/);
  assert.match(sessionCss,/@media\(max-width:760px\) and \(max-height:700px\)/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-clock\{[\s\S]*?flex-wrap:nowrap/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-clock small\{[\s\S]*?display:none/);
});
