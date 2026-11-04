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
  assert.match(stretch,/float muscleShape = max\(muscleTex, 0\.70\)/);
  assert.match(stretch,/mix\(0\.78,1\.0,primary\)/);
  assert.match(stretch,/totalEmissiveRadiance \+= vec3\(0\.36,1\.0,0\.19\)/);
  assert.match(stretch,/pulse-tissue-stretch-ivory-visible-muscle-v3/);
  assert.match(stretch,/createTissueMaterial\(skin,/);
  assert.doesNotMatch(material,/milk-white|ivoryShade|stretch-ivory|vec3\(0\.36,1\.0,0\.19\)/);
  assert.match(stretch,/mat\.onBeforeCompile=\(shader,r\)=>\{compile\(shader,r\);/);
  // Shader splice points still exist in the shared, unmodified explorer material.
  assert.match(material,/float clothingMask =/);
  assert.match(material,/float region=0\.0/);
  assert.match(material,/generalGlow\*=uActivation;/);
});

test('reaching arm and hand animate with frame-delta quaternion/position interpolation',()=>{
  assert.match(stretch,/let poseReady=false,lastPoseTime=0;/);
  assert.match(stretch,/const dt=lastPoseTime\?Math\.min\(\.08,Math\.max\(0,\(now-lastPoseTime\)\/1000\)\):0;/);
  assert.match(stretch,/1-Math\.exp\(-dt\/\.16\)/);
  assert.match(stretch,/bones\[i\]\.position\.lerp\(p,follow\)/);
  assert.match(stretch,/bones\[i\]\.quaternion\.slerp\(easedOrientation,follow\)/);
  assert.match(stretch,/hands\[i\]\.position\.lerp\(wr,follow\)/);
  assert.match(stretch,/hands\[i\]\.quaternion\.slerp\(easedOrientation,follow\)/);
  assert.match(stretch,/pose\(stepId,elapsed,performance\.now\(\)\)/);
  assert.match(stretch,/setPixelRatio\(Math\.min\(devicePixelRatio\|\|1,1\.35\)\)/);
  assert.match(scene,/const size=Math\.round\(2\*155\*s\)/);
});

test('both timers use identical SVG orbit geometry and no animated CSS conic gradient',()=>{
  assert.match(html,/<span class="stretch-clock-kicker" aria-hidden="true">ÅTERSTÅR<\/span>/);
  for(const id of ['stretch-clock-progress','stretch-clock-tip','stretch-prep-progress','stretch-prep-tip'])
    assert.match(html,new RegExp('id="'+id+'"'));
  const paths=[...html.matchAll(/class="stretch-orbit-progress"[^>]+d="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(paths.length,2);
  assert.equal(paths[0],paths[1]);
  assert.match(html,/pathLength="100" stroke-dasharray="100 100"/);
  assert.match(sessionCss,/\.stretch-orbit-progress\{/);
  assert.doesNotMatch(sessionCss,/--zen-clock-progress/);
  assert.doesNotMatch(zenJs,/--prep-progress|--zen-clock-progress/);
  assert.doesNotMatch(sessionCss,/stretch-orbit-progress\{[^}]*filter:/);
  assert.doesNotMatch(sessionCss,/stretch-orbit-bloom\{[^}]*filter:/);
  assert.match(sessionCss,/body\[data-kind=meditation\] \.stretch-clock-kicker,/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-preparation\{[\s\S]*?background:transparent/);
  assert.match(sessionCss,/\.session-view\.is-stretch-preparing \.session-stage/);
  assert.match(zenJs,/classList\.toggle\('is-stretch-preparing',prepVisible\)/);
});

test('both orbit progress values interpolate between 200ms session model snapshots',()=>{
  const begin=scene.indexOf(' const stretchOrbits=');
  const end=scene.indexOf(' function paint(now){',begin);
  assert.ok(begin>=0&&end>begin);
  const dom={};
  for(const id of ['stretch-clock-progress','stretch-clock-bloom','stretch-clock-tip',
                  'stretch-prep-progress','stretch-prep-bloom','stretch-prep-tip']){
    dom[id]={attributes:{},style:{},setAttribute(name,val){this.attributes[name]=String(val);}};
  }
  const ctx={
    $:id=>dom[id],snapshot:{kind:'stretch',step:{seconds:60},stepProgress:.25,paused:false,preparing:false,done:false},
    sampledAt:1000,reduced:{matches:false}
  };
  vm.runInNewContext(scene.slice(begin,end)+'\nthis.paintOrbit=paintStretchOrbits;',ctx);
  ctx.paintOrbit(1000);
  const start=Number(dom['stretch-clock-progress'].attributes['stroke-dashoffset']);
  const tipStart=dom['stretch-clock-tip'].attributes.transform;
  ctx.paintOrbit(1080);
  const mid=Number(dom['stretch-clock-progress'].attributes['stroke-dashoffset']);
  const tipMid=dom['stretch-clock-tip'].attributes.transform;
  assert.ok(mid<start,'80ms after snapshot should produce visible progress');
  assert.notEqual(tipStart,tipMid,'glowing tip must also move between snapshots');
  ctx.snapshot={kind:'stretch',step:{seconds:60},stepProgress:.25,paused:true,preparing:false,done:false};
  ctx.paintOrbit(1250);
  assert.equal(Number(dom['stretch-clock-progress'].attributes['stroke-dashoffset']),start,
    'paused timer must remain stationary at the authoritative snapshot');

  ctx.snapshot={kind:'stretch',step:{seconds:60},stepProgress:0,paused:false,preparing:true,prepRemainingMs:4000};
  ctx.sampledAt=2000;
  ctx.paintOrbit(2000);
  const prepStart=Number(dom['stretch-prep-progress'].attributes['stroke-dashoffset']);
  ctx.paintOrbit(2100);
  const prepNext=Number(dom['stretch-prep-progress'].attributes['stroke-dashoffset']);
  assert.ok(prepNext<prepStart,'five-second lead-in must advance smoothly within its snapshots');
  assert.doesNotMatch(scene.slice(begin,end),/setInterval|requestAnimationFrame/);
  assert.match(scene,/paintSessionProgress\(now\);paintStretchOrbits\(now\);/);
});

test('stretch preparation is part of the forest, not a large dark modal',()=>{
  assert.match(html,/id="session-preparation"/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-preparation\{[\s\S]*?background:transparent/);
  assert.match(sessionCss,/backdrop-filter:none;-webkit-backdrop-filter:none/);
  assert.match(sessionCss,/border:0;border-radius:0;box-shadow:none/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-prep-ring::before,[\s\S]*?content:none!important/);
  assert.match(zenJs,/prepRemainingMs:preparing\?Math\.max\(0,session\.anchor-now\):0/);
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
  assert.match(html,/zen-session\.css\?v=20261104-unified-orbit-3/);
  assert.match(html,/pulse-silver-stretch\.js\?v=20261104-smooth-green-3/);
  assert.match(html,/zen-session-scene\.js\?v=20261104-smooth-orbit-3/);
  assert.match(html,/zen\.js\?v=20261104-smooth-orbit-3/);
  assert.match(trainingHtml,/training-pulse-field\.css\?v=20261104-desktop-gutters-3/);
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
    paint(){heavy++;},paintStretchOrbits(){light++;},
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
