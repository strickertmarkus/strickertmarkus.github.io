const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
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

test('the milky ivory material and anatomical green glow belong to stretch, not shared training',()=>{
  assert.match(stretch,/const skin=new THREE\.MeshStandardMaterial\(\{color:0xf1efe7,metalness:\.035,roughness:\.76\}/);
  assert.match(stretch,/vec3 chrome = mix\(vec3\(0\.48,0\.50,0\.47\), vec3\(0\.96,0\.96,0\.92\), ivoryShade\)/);
  assert.match(stretch,/roughness:\.70,metalness:\.04/);
  assert.match(stretch,/totalEmissiveRadiance \+= vec3\(0\.48,1\.0,0\.34\)/);
  assert.match(stretch,/pulse-tissue-stretch-ivory-satin-green-v2/);
  assert.match(stretch,/createTissueMaterial\(skin,/);
  assert.doesNotMatch(material,/milk-white|ivoryShade|stretch-ivory/);
  // Shader material remains shared by the explorer, but tinting is done
  // exclusively in stretch's own onBeforeCompile wrapper.
  assert.match(stretch,/mat\.onBeforeCompile=\(shader,r\)=>\{compile\(shader,r\);/);
  assert.match(material,/float clothingMask =/);
  assert.match(material,/float region=0\.0/);
});

test('large 3D mannequin and brighter fallback remain scoped to the Zen stretch scene',()=>{
  assert.match(scene,/const size=Math\.round\(2\*155\*s\)/);
  assert.match(scene,/p\.scale\(\.80,\.80\)/);
  assert.match(scene,/#fffcf2/);
  assert.match(scene,/#baff76/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-pose-3d/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-stage::before/);
  assert.match(sessionCss,/--pose-size:clamp\(300px,min\(48vw,calc\(100dvh - 305px\)\),680px\)/);
  assert.match(sessionCss,/@media\(min-width:761px\) and \(max-height:720px\)/);
});

test('Zen timer uses existing stretch time model and no extra interval',()=>{
  assert.match(html,/<span class="stretch-clock-kicker" aria-hidden="true">ÅTERSTÅR<\/span>/);
  assert.match(html,/id="session-prep-ring"/);
  assert.match(zenJs,/const seconds=Math\.max\(1,Number\(step\.seconds\)\|\|1\)/);
  assert.match(zenJs,/1-p\.remaining\/seconds/);
  assert.match(zenJs,/dial\.style\.setProperty\('--zen-clock-progress'/);
  assert.match(sessionCss,/conic-gradient\(from -90deg,[\s\S]*?var\(--zen-clock-progress\)/);
  assert.match(sessionCss,/body\[data-kind=stretch\] \.session-prep-ring::after/);
  assert.match(sessionCss,/body\[data-kind=meditation\] \.stretch-clock-kicker\{display:none!important\}/);
  // The original five-second anchor continues to own its own countdown.
  assert.match(zenJs,/session\.anchor-now/);
  assert.match(zenJs,/--prep-progress/);
});

test('moderately larger desktop margins remain page-level and leave mobile unchanged',()=>{
  assert.match(trainingCss,/:root\{--field-max:1600px;--field-gutter:clamp\(52px,5vw,96px\)\}/);
  assert.match(trainingCss,/@media\(min-width:1000px\)/);
  assert.match(trainingCss,/\.field-header,\.kind-switch,main,\.field-footer\{width:min\(calc\(100% - 2 \* var\(--field-gutter\)\),var\(--field-max\)\)/);
});

test('updated CSS, shader, scene and tick scripts are cache-busted together',()=>{
  assert.match(html,/zen-session\.css\?v=20261104-ivory-zen-dial-2/);
  assert.match(html,/pulse-silver-stretch\.js\?v=20261104-ivory-2/);
  assert.match(html,/zen-session-scene\.js\?v=20261104-ivory-2/);
  assert.match(html,/zen\.js\?v=20261104-zen-dial-2/);
  assert.match(trainingHtml,/training-pulse-field\.css\?v=20261104-desktop-gutters-3/);
});
