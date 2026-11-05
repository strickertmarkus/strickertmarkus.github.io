/** Pulse mannequin as stretch instructor: the same sculpted figure as the exercise
    explorer, with the stretched muscles in stretch green instead of red.
    Every movement is a held position: the figure glides from where it was into the
    pose over a few seconds, then stays there and breathes. Poses are written as
    joint directions (forward kinematics with the mannequin's own segment lengths),
    so each new stretch is a small block of data rather than an animation. */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createTissueMaterial,muscleNames} from './pulse-silver-material.js?v=22';
const v=p=>new THREE.Vector3(...p);
const d=(x,y,z)=>new THREE.Vector3(x,y,z).normalize();
const DEG=Math.PI/180;
const LEN={spine:.52,shoulder:.47,shoulderW:.225,neck:.30,upper:.329,fore:.2698,hipW:.12,thigh:.4304,shin:.41};

/* ---------- Positions ----------
   World axes: +y up. A figure facing the camera faces +z. Limb index 0 is the
   figure's right side, index 1 its left (rest layout of the mannequin).
   Each pose lists world-space unit directions: up (pelvis to shoulders), front
   (chest normal), optional pelvis frame, head, and per limb [upper, lower].
   `mirror` names the axis that swaps sides for the opposite-side variant. */
const standFront=()=>({up:d(0,1,0),front:d(0,0,1),arms:[[d(-.2,-1,0),d(-.08,-1,.08)],[d(.2,-1,0),d(.08,-1,.08)]],legs:[[d(-.02,-1,.03),d(0,-1,-.01)],[d(.02,-1,.03),d(0,-1,-.01)]],feet:[flat(0,0,1),flat(0,0,1)]});
const standSide=()=>({up:d(0,1,0),front:d(1,0,0),arms:[[d(0,-1,.2),d(.08,-1,.08)],[d(0,-1,-.2),d(.08,-1,-.08)]],legs:[[d(.03,-1,.02),d(-.01,-1,0)],[d(.03,-1,-.02),d(-.01,-1,0)]],feet:[flat(1,0,0),flat(1,0,0)]});
// Lying on the back along x, head toward -x, so the camera sees the figure in profile.
const supine=()=>({up:d(-1,0,0),front:d(0,1,0),arms:[[d(1,0,.18),d(1,0,.1)],[d(1,0,-.18),d(1,0,-.1)]],legs:[[d(1,0,.04),d(1,0,.02)],[d(1,0,-.04),d(1,0,-.02)]],feet:[null,null]});
const prone=()=>({up:d(-1,0,0),front:d(0,-1,0),arms:[[d(1,0,-.18),d(1,0,-.1)],[d(1,0,.18),d(1,0,.1)]],legs:[[d(1,0,-.04),d(1,0,0)],[d(1,0,.04),d(1,0,0)]],feet:[point(1,0,0),point(1,0,0)]});
const kneelUp=()=>({up:d(0,1,0),front:d(1,0,0),arms:[[d(0,-1,.2),d(.1,-1,.06)],[d(0,-1,-.2),d(.1,-1,-.06)]],legs:[[d(0,-1,.03),d(-1,0,0)],[d(0,-1,-.03),d(-1,0,0)]],feet:[point(-1,0,0),point(-1,0,0)]});
const seatedFront=()=>({up:d(0,1,0),front:d(0,0,1),arms:[[d(-.15,-1,-.15),d(0,-1,-.2)],[d(.15,-1,-.15),d(0,-1,-.2)]],legs:[[d(-.12,.4,1),d(0,-.5,.87)],[d(.12,.4,1),d(0,-.5,.87)]],feet:[flat(0,0,1),flat(0,0,1)]});
function flat(x,y,z){return {toe:d(x,y,z),up:d(0,1,0)};}
function point(x,y,z){return {toe:d(x,y,z),up:d(0,-1,0)};}
const POSE_DEFS={
 side:{mirror:'x',base:standFront,muscles:['Mage','Rygg'],cam:{yaw:4,pitch:3},pose(){
  const a=-26*DEG,rz=(x,y,z,ang)=>d(x,y,z).applyAxisAngle(new THREE.Vector3(0,0,1),ang);
  const reach=rz(0,1,0,a-10*DEG).multiplyScalar(LEN.upper).add(v([0,0,.06])).normalize();
  const rest=rz(.18,-1,0,a*.5).multiplyScalar(LEN.upper).add(v([0,0,.02])).normalize();
  // Leaning toward the figure's left (+x); the right arm (index 0) reaches over.
  return {up:rz(0,1,0,a),front:d(0,0,1),pelvisUp:d(0,1,0),pelvisFront:d(0,0,1),headUp:rz(0,1,0,a*1.15),
   arms:[[reach,rz(0,1,0,a-34*DEG)],[rest,rz(.05,-1,.08,a*.2)]],
   legs:[[d(-.02,-1,.03),d(0,-1,-.01)],[d(.02,-1,.03),d(0,-1,-.01)]],feet:[flat(0,0,1),flat(0,0,1)]};
 }},
 // Liggande baksida lår: the left leg (far side) rises straight, both hands behind the thigh.
 'supine-hamstring':{mirror:'z',base:supine,muscles:['Baksida lår','Vader'],cam:{yaw:-6,pitch:10},pose(){
  const p=supine();p.legs[1]=[d(.12,1,0),d(.03,1,0)];p.feet[1]={toe:d(-1,.15,0),up:d(0,-1,0)};
  p.arms=[[d(.52,.78,-.28),d(.92,.42,-.36)],[d(.52,.78,.1),d(.92,.42,.12)]];p.headUp=d(-1,.12,0);return p;}},
 // Liggande fyran: right thigh drawn in, left ankle across it, hands behind the right thigh.
 'figure-four':{mirror:'z',base:supine,muscles:['Säte','Baksida lår'],cam:{yaw:-8,pitch:12},pose(){
  const p=supine();p.legs[0]=[d(-.3,1,0),d(1,.08,0)];p.feet[0]={toe:d(.08,1,0),up:d(-1,.08,0)};
  p.legs[1]=[d(-.25,.7,-.6),d(.15,.1,1)];p.feet[1]={toe:d(.2,1,.1),up:d(-1,.1,.15)};
  p.arms=[[d(.5,.8,0),d(.9,.5,-.05)],[d(.5,.8,.35),d(.85,.45,.6)]];p.headUp=d(-1,.1,0);return p;}},
 // Knästående höftböjarstretch: left foot forward, right knee down; the right hip opens.
 hip:{mirror:'z',base:kneelUp,muscles:['Framsida lår','Mage'],cam:{yaw:-6,pitch:6},pose(){
  return {up:d(-.06,1,0),front:d(1,0,0),
   arms:[[d(.45,-.85,-.3),d(.8,-.5,-.25)],[d(.45,-.85,.0),d(.8,-.5,.05)]],
   legs:[[d(-.5,-1,.02),d(-1,-.03,0)],[d(1,.12,-.02),d(0,-1,0)]],feet:[point(-1,0,0),flat(1,0,0)]};}},
 // Barnets position: seated back on the heels, chest over the thighs, arms long on the floor.
 child:{base:kneelUp,muscles:['Rygg','Axlar'],cam:{yaw:-12,pitch:12},pose(){
  return {up:d(1,-.28,0),front:d(-.28,-1,0),headUp:d(1,-.35,0),
   arms:[[d(1,-.3,.12),d(1,-.15,.05)],[d(1,-.3,-.12),d(1,-.15,-.05)]],
   legs:[[d(.75,-.62,.06),d(-1,-.02,0)],[d(.75,-.62,-.06),d(-1,-.02,0)]],feet:[point(-1,0,0),point(-1,0,0)]};}},
 // Vadstretch med rakt knä: the left leg back with the heel down, hands to a wall in front.
 calf:{mirror:'z',base:standSide,muscles:['Vader','Baksida lår'],cam:{yaw:-10,pitch:4},pose(){
  return {up:d(.22,1,0),front:d(1,-.22,0),pelvisUp:d(.1,1,0),pelvisFront:d(1,-.1,0),
   arms:[[d(1,.08,.25),d(1,.15,.05)],[d(1,.08,-.25),d(1,.15,-.05)]],
   legs:[[d(.38,-1,.02),d(-.06,-1,0)],[d(-.4,-1,-.02),d(-.42,-1,0)]],feet:[flat(1,0,0),flat(1,0,0)]};}},
 // Sittande ryggradsvridning: chest turns toward the left, right hand on the left knee.
 'seated-twist':{mirror:'x',base:seatedFront,muscles:['Rygg','Mage'],cam:{yaw:30,pitch:12},pose(){
  // Right leg long, left foot planted outside the right knee, right elbow hooked at the left knee.
  const p=seatedFront();p.front=d(.64,0,.77);p.pelvisUp=d(0,1,0);p.pelvisFront=d(0,0,1);p.headFront=d(.85,0,.53);
  p.legs=[[d(.02,.02,1),d(0,-.02,1)],[d(-.15,.65,.7),d(-.1,-.76,.64)]];p.feet=[{toe:d(0,1,.05),up:d(0,.02,-1)},flat(0,0,1)];
  p.arms=[[d(.68,-.5,.45),d(.1,-.3,1)],[d(.05,-.94,-.34),d(.05,-.95,-.3)]];return p;}},
 // Sfinxen: on the belly, chest lifted onto the forearms.
 sphinx:{base:prone,muscles:['Mage','Rygg'],cam:{yaw:-10,pitch:14},pose(){
  const p=prone();p.up=d(-1,.62,0);p.front=d(-.62,-1,0);p.headUp=d(-.75,.66,0);
  p.arms=[[d(-.12,-1,-.12),d(-1,0,-.05)],[d(-.12,-1,.12),d(-1,0,.05)]];p.legs=[[d(1,-.06,-.05),d(1,0,0)],[d(1,-.06,.05),d(1,0,0)]];return p;}},
 // Axelstretch över bröstet: the left arm crosses the chest, the right hand supports it.
 'cross-arm':{mirror:'x',base:standFront,muscles:['Axlar','Rygg'],cam:{yaw:16,pitch:5},pose(){
  const p=standFront();p.arms=[[d(.12,-.8,.6),d(.4,.85,-.3)],[d(-1,-.06,.38),d(-1,.06,.1)]];return p;}},
 // Tricepsstretch över huvudet: the left elbow points up, the hand drops behind the head.
 triceps:{mirror:'x',base:standFront,muscles:['Triceps','Axlar'],cam:{yaw:22,pitch:6},pose(){
  const p=standFront();p.arms=[[d(.2,1,.18),d(1,.1,-.2)],[d(-.15,1,-.1),d(-.3,-1,-.25)]];return p;}}
};
const POSES={};
for(const [family,def] of Object.entries(POSE_DEFS)){
 if(def.mirror){POSES[family+'-left']={def,mirror:null};POSES[family+'-right']={def,mirror:def.mirror};}
 else POSES[family]={def,mirror:null};
}
const api={ready:false,failed:false,loading:false,supports:id=>!!POSES[id]};
window.PulseSilverStretch=api;
const pressContraction={value:0},muscleUniform={value:new Float32Array(10)},pilotUniform={value:0},activationUniform={value:1},tissueLight={value:new THREE.Vector3()};
const tissueLightWorld=new THREE.Vector3(-2,4,3).normalize();
// Stretch-only finish. The exercise explorer owns its own materials and is
// intentionally untouched: soft ivory hands, satin body and a brighter green rim.
const skin=new THREE.MeshStandardMaterial({color:0xf1efe7,metalness:.035,roughness:.76}),soleMat=new THREE.MeshStandardMaterial({color:0xb1bdb4,roughness:.83}),shoeMat=new THREE.MeshStandardMaterial({color:0x354c46,roughness:.76});
let scene,camera,renderer,body,bones,rest,hands=[],shoes=[],shadow,host=null,lastSize='',lastMuscles='';
function mesh(g,m,parent){const o=new THREE.Mesh(g,m);o.castShadow=true;parent.add(o);return o;}
function sphere(pos,scale,m,parent){const o=mesh(new THREE.SphereGeometry(1,20,14),m,parent);o.position.copy(v(pos));o.scale.copy(v(scale));return o;}
function buildHandsAndShoes(){
 for(const s of [-1,1]){
  const hand=new THREE.Group();scene.add(hand);
  // An open, relaxed hand: palm and a soft finger block along the forearm.
  sphere([0,-.045,0],[.032,.055,.018],skin,hand);sphere([0,-.105,0],[.028,.04,.014],skin,hand);sphere([s*.03,-.04,.008],[.012,.026,.012],skin,hand);
  hands.push(hand);
  const shoe=new THREE.Group();scene.add(shoe);
  sphere([0,.026,.055],[.062,.029,.13],soleMat,shoe);sphere([0,.052,.048],[.059,.047,.12],shoeMat,shoe);
  shoes.push(shoe);
 }
 // A soft contact shadow, so a figure lying or kneeling reads as resting on a floor.
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),grad=g.createRadialGradient(64,64,4,64,64,64);
 grad.addColorStop(0,'rgba(0,10,4,.55)');grad.addColorStop(.55,'rgba(0,10,4,.22)');grad.addColorStop(1,'rgba(0,10,4,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
 shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.renderOrder=-1;scene.add(shadow);
}

/* ---------- Pose parameters: mirror, blend ---------- */
const VEC_KEYS=['up','front','pelvisUp','pelvisFront','headUp','headFront'];
function complete(p){
 const q={...p};q.pelvisUp=q.pelvisUp||q.up;q.pelvisFront=q.pelvisFront||q.front;q.headUp=q.headUp||q.up;q.headFront=q.headFront||q.front;
 q.feet=(q.feet||[null,null]).map((f,i)=>f||defaultFoot(q,i));return q;
}
function defaultFoot(p,i){
 // A neutral ankle: the sole at a right angle to the shin, toes toward the chest's front.
 const up=p.legs[i][1].clone().negate(),front=(p.pelvisFront||p.front).clone();
 const toe=front.addScaledVector(up,-front.dot(up));
 return {toe:toe.lengthSq()>1e-4?toe.normalize():d(0,0,1),up};
}
function mirrorParams(p,axis){
 const m=x=>{const c=x.clone();c[axis]*=-1;return c;},q={};
 for(const k of VEC_KEYS)q[k]=m(p[k]);
 q.arms=[p.arms[1],p.arms[0]].map(a=>a.map(m));q.legs=[p.legs[1],p.legs[0]].map(a=>a.map(m));
 q.feet=[p.feet[1],p.feet[0]].map(f=>({toe:m(f.toe),up:m(f.up)}));return q;
}
function clonePose(p){const q={};for(const k of VEC_KEYS)q[k]=p[k].clone();q.arms=p.arms.map(a=>a.map(x=>x.clone()));q.legs=p.legs.map(a=>a.map(x=>x.clone()));q.feet=p.feet.map(f=>({toe:f.toe.clone(),up:f.up.clone()}));return q;}
function mixPose(a,b,t){
 const L=(x,y)=>{const r=x.clone().lerp(y,t);return r.lengthSq()<1e-6?y.clone():r.normalize();},q={};
 for(const k of VEC_KEYS)q[k]=L(a[k],b[k]);
 q.arms=a.arms.map((arm,i)=>arm.map((x,j)=>L(x,b.arms[i][j])));q.legs=a.legs.map((leg,i)=>leg.map((x,j)=>L(x,b.legs[i][j])));
 q.feet=a.feet.map((f,i)=>({toe:L(f.toe,b.feet[i].toe),up:L(f.up,b.feet[i].up)}));return q;
}
function targetFor(id){
 const entry=POSES[id];if(!entry)return null;
 if(!entry.cache){
  let neutral=complete(entry.def.base()),target=complete(entry.def.pose());
  if(entry.mirror){neutral=mirrorParams(neutral,entry.mirror);target=mirrorParams(target,entry.mirror);}
  const cam={...entry.def.cam};if(entry.mirror==='x')cam.yaw=-cam.yaw;
  entry.cache={neutral,target,cam};
 }
 return entry.cache;
}

/* ---------- Forward kinematics with the mannequin's own segment lengths ---------- */
function frameOf(up,front){
 const u=up.clone().normalize(),f=front.clone().addScaledVector(u,-front.dot(u)).normalize(),r=new THREE.Vector3().crossVectors(u,f).normalize();
 return {u,f,r,q:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r,u,f))};
}
function solve(p){
 const torso=frameOf(p.up,p.front),pelvis=frameOf(p.pelvisUp,p.pelvisFront),head=frameOf(p.headUp,p.headFront);
 const hip=new THREE.Vector3(0,0,0),top=hip.clone().addScaledVector(torso.u,LEN.spine),headEnd=top.clone().addScaledVector(head.u,LEN.neck);
 const shoulders=[-1,1].map(s=>hip.clone().addScaledVector(torso.u,LEN.shoulder).addScaledVector(torso.r,s*LEN.shoulderW));
 const elbows=shoulders.map((s,i)=>s.clone().addScaledVector(p.arms[i][0],LEN.upper)),wrists=elbows.map((e,i)=>e.clone().addScaledVector(p.arms[i][1],LEN.fore));
 const hips=[-1,1].map(s=>hip.clone().addScaledVector(pelvis.r,s*LEN.hipW).addScaledVector(pelvis.u,-.02));
 const knees=hips.map((h,i)=>h.clone().addScaledVector(p.legs[i][0],LEN.thigh)),ankles=knees.map((k,i)=>k.clone().addScaledVector(p.legs[i][1],LEN.shin));
 const segments=[[hip,top],[top,headEnd]];
 for(let i=0;i<2;i++)segments.push([shoulders[i],elbows[i]],[elbows[i],wrists[i]]);
 for(let i=0;i<2;i++)segments.push([hips[i],knees[i]],[knees[i],ankles[i]]);
 segments.push([hip.clone().addScaledVector(pelvis.u,-.10),hip.clone().addScaledVector(pelvis.u,.06)]);
 // Contact points with a rough body radius: the lowest one rests on the floor (y=0).
 const contacts=[[hip,.11],[top,.11],[headEnd,.1],[headEnd.clone().addScaledVector(head.u,.08),.06],...shoulders.map(s=>[s,.07]),...elbows.map(e=>[e,.04]),
  ...wrists.map((w,i)=>[w.clone().addScaledVector(p.arms[i][1],.12),.02]),...knees.map(k=>[k,.06]),
  ...ankles.map((a,i)=>[a.clone().addScaledVector(p.feet[i].up,-.073),0]),...ankles.map((a,i)=>[a.clone().addScaledVector(p.feet[i].up,-.06).addScaledVector(p.feet[i].toe,.17),.01])];
 const lift=Math.max(...contacts.map(([x,r])=>r-x.y));
 const all=[...segments.flat(),...contacts.map(c=>c[0])];
 for(const x of new Set(all))x.y+=lift;
 return {segments,torso,pelvis,head,wrists,ankles,contacts:contacts.map(c=>c[0])};
}
function applyPose(p){
 const s=solve(p),solved=[];
 for(let i=0;i<bones.length;i++){
  const [a,b]=s.segments[i],from=v(rest[i][1]).sub(v(rest[i][0])).normalize(),to=b.clone().sub(a).normalize();
  // Twist stays consistent: forearms turn from their upper arm and shins from their
  // thigh, the head from its own frame, the rest from the torso or pelvis frame.
  const base=i===3||i===5||i===7||i===9?solved[i-1]:i===1?s.head.q:i>=6?s.pelvis.q:s.torso.q;
  const rotated=from.clone().applyQuaternion(base).normalize();
  const orientation=new THREE.Quaternion().setFromUnitVectors(rotated,to).multiply(base);
  solved.push(orientation);bones[i].position.copy(a);bones[i].quaternion.copy(orientation);bones[i].scale.setScalar(1);
 }
 for(let i=0;i<2;i++){
  const forearm=p.arms[i][1];hands[i].position.copy(s.wrists[i]);hands[i].quaternion.setFromUnitVectors(v([0,-1,0]),forearm);
  const f=p.feet[i],up=f.up.clone().normalize(),toe=f.toe.clone().addScaledVector(up,-f.toe.dot(up)).normalize(),x=new THREE.Vector3().crossVectors(up,toe);
  shoes[i].quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,up,toe));shoes[i].position.copy(s.ankles[i]).addScaledVector(up,-.073);
 }
 return s;
}
function viewFor(p,cam,also){
 // Frame the held position (and where it starts from): the camera circles its centre at the pose's own angle.
 const pts=[...solve(p).contacts,...(also?solve(also).contacts:[])],box=new THREE.Box3().setFromPoints(pts),center=box.getCenter(new THREE.Vector3());
 const radius=Math.max(.62,...pts.map(x=>x.distanceTo(center)))+.12,dist=radius/Math.sin(15*DEG)*.95;
 const yaw=cam.yaw*DEG,pitch=cam.pitch*DEG,dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
 return {center,position:center.clone().addScaledVector(dir,dist),floor:box};
}
// Where the figure is now, so the next movement glides on from it.
let shown=null,shownView=null,fromPose=null,fromView=null,currentId='';
const ease=x=>x*x*(3-2*x);
function poseAt(id,elapsed){
 const T=targetFor(id);
 if(id!==currentId){
  fromPose=shown?clonePose(shown):clonePose(T.neutral);fromView=shownView?{center:shownView.center.clone(),position:shownView.position.clone()}:null;currentId=id;
  T.view=T.view||viewFor(T.target,T.cam,T.neutral);if(!fromView)fromView=T.view;
 }
 // Settle in over three seconds, then hold with a slow breath (about 5.5 s per cycle).
 const glide=ease(Math.min(1,Math.max(0,elapsed)/3)),breath=.5-.5*Math.cos(Math.max(0,elapsed-3)*2*Math.PI/5.5);
 const held=mixPose(T.neutral,T.target,1-.055*breath);
 shown=mixPose(fromPose,held,glide);
 shownView={center:fromView.center.clone().lerp(T.view.center,glide),position:fromView.position.clone().lerp(T.view.position,glide)};
 return {pose:shown,view:shownView,floor:T.view.floor};
}
async function initialize(){
 if(api.loading||api.ready)return;api.loading=true;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(30,1,.1,20);
  const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(environment,.04);
  scene.environment=env.texture;scene.environmentIntensity=.78;environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfffaee,0x243a2d,1.15));
  const key=new THREE.DirectionalLight(0xfffaf0,1.7);key.position.set(-2,4,3);scene.add(key);
  const rim=new THREE.DirectionalLight(0xc0ff97,2.2);rim.position.set(2,2,-2);scene.add(rim);
  const base=new URL('./assets/pulse-figure/',import.meta.url);
  const [metaResponse,binaryResponse]=await Promise.all([fetch(new URL('body.json',base)),fetch(new URL('body.bin',base))]);
  if(!metaResponse.ok||!binaryResponse.ok)throw new Error('Mannequin asset unavailable');
  const meta=await metaResponse.json(),buffer=await binaryResponse.arrayBuffer(),geo=new THREE.BufferGeometry();rest=meta.rest;
  for(const [name,a] of Object.entries(meta.attributes)){
   const T=name==='skinIndex'?Uint16Array:name==='index'?Uint32Array:Float32Array;
   const attribute=new THREE.BufferAttribute(new T(buffer,a.offset,a.length),a.itemSize);
   if(name==='index')geo.setIndex(attribute);else geo.setAttribute(name,attribute);
  }
  geo.computeVertexNormals();
  const restPositions=geo.getAttribute('position'),restNormals=geo.getAttribute('normal');
  geo.morphAttributes.position=[restPositions.clone(),restPositions.clone()];geo.morphAttributes.normal=[restNormals.clone(),restNormals.clone()];
  const mat=createTissueMaterial(skin,{pressContraction,tissueLight,muscleUniform,pilotUniform,activationUniform});
  if(meta.texture){
   const map=await new THREE.TextureLoader().loadAsync(new URL(meta.texture,base).href);
   map.flipY=false;map.colorSpace=THREE.NoColorSpace;map.anisotropy=4;
   Object.assign(mat,{map,opacity:1,transparent:false,depthWrite:true,roughness:.70,metalness:.04});mat.color.set(0xffffff);
   const compile=mat.onBeforeCompile;
   const textured=[
    ['vec3 pearl = mix(vec3(0.86, 0.90, 0.95), mix(diffuseColor.rgb,vec3(0.055,0.085,0.13),shortsExtension), clothingMask);',
     `vec3 modelTex = diffuseColor.rgb;
    float modelShade = clamp(dot(modelTex, vec3(0.299,0.587,0.114)) * 1.9, 0.0, 1.3);
    float muscleTex = smoothstep(0.015, 0.08, modelTex.r - modelTex.b) * (1.0 - clothingMask);
    float muscleShape = max(muscleTex, 0.92) * (1.0 - clothingMask);
    // Warm milk-white anatomy, retaining the model's sculpted dark-to-light
    // normals and texture rather than washing the skin out to flat white.
    float ivoryShade = smoothstep(0.035, 1.15, modelShade);
    vec3 chrome = mix(vec3(0.48,0.50,0.47), vec3(0.96,0.96,0.92), ivoryShade);
    chrome *= 0.91 + 0.09 * smoothstep(0.0, 1.0, modelShade);
    chrome = mix(chrome, chrome * vec3(1.02,1.01,0.985), muscleTex * 0.16);
    // Shadowed eye sockets under the brow give the mannequin face some depth.
    float eyeShade = exp(-pow((p.x - 0.037) / 0.021, 2.0) - pow((p.y - 1.718) / 0.014, 2.0)) * smoothstep(0.105, 0.13, p.z);
    chrome *= 1.0 - 0.34 * eyeShade;
    vec3 pearl = mix(chrome, vec3(0.11,0.15,0.14), clothingMask);`],
    ['diffuseColor.rgb = mix(pearl, muscleColor, muscleMask);','muscleMask *= muscleShape;\n    diffuseColor.rgb = mix(pearl, vec3(0.05,0.36,0.05) * (0.60 + 0.45 * modelShade), muscleMask);'],
    ['float secondary = max(shoulder, triceps) * 0.85;','float secondary = max(shoulder, triceps) * 0.45;'],
    ['muscleMask=region*mix(0.85,0.99,primary);','// Worked glutes show through the shorts as a glow on the fabric.\n     float seen=max(muscleShape, glutes*min(uMuscles[6],1.0)*clothingMask*0.8);\n     muscleMask=max(region*muscleShape, glutes*min(uMuscles[6],1.0)*clothingMask*0.8)*mix(0.78,1.0,primary);'],
    ['diffuseColor.rgb=mix(pearl,red,muscleMask);',`vec3 flesh = mix(vec3(0.012,0.12,0.02), vec3(0.08,0.46,0.06), clamp(modelShade * 1.05 + silk * 0.20, 0.0, 1.0));
     diffuseColor.rgb=mix(pearl,flesh,muscleMask);`],
    ['+vec3(1.0,0.42,0.20)*volume*reflection','+vec3(0.10,0.48,0.07)*volume*reflection'],
    // The main worked muscle glows from within, strongest along its shading highlights.
    ['generalGlow*=uActivation;','generalGlow+=vec3(0.05,0.30,0.04)*primary*region*seen*(0.40+0.45*modelShade+0.12*silk);\n     generalGlow*=uActivation;'],
    ['#include <emissivemap_fragment>','#include <emissivemap_fragment>\n    totalEmissiveRadiance += vec3(0.05,0.40,0.04) * muscleMask * (0.12 + 0.20 * modelShade) * uActivation;'],
    ['generalGlow=region*(','generalGlow=region*seen*mix(0.45,1.0,primary)*('],
    ['#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n    roughnessFactor = mix(roughnessFactor, 0.66, max(muscleMask, clothingMask));'],
    ['#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n    metalnessFactor = mix(metalnessFactor, 0.02, max(muscleMask, clothingMask));']
   ];
   // Side stretch: the side of the abdomen (obliques) belongs to the core, front and flank.
   textured.push(['float absMask=(1.0-smoothstep(0.07,0.14,p.x))*smoothstep(1.015,1.065,p.y)\n       *(1.0-smoothstep(1.24,1.29,p.y))*frontFace;','float flank=smoothstep(0.075,0.115,p.x)*(1.0-smoothstep(0.175,0.215,p.x))*smoothstep(0.98,1.04,p.y)*(1.0-smoothstep(1.30,1.37,p.y))*(1.0-smoothstep(0.03,0.09,-p.z));\n     float absMask=max((1.0-smoothstep(0.08,0.15,p.x))*smoothstep(1.015,1.065,p.y)*(1.0-smoothstep(1.24,1.29,p.y))*frontFace,flank);']);
   // The shared tissue glow is tuned red/orange; in stretch it becomes a deep green too,
   // otherwise red light on green reads as a pale yellow.
   textured.push(['tissueRed*volume*mix(0.075,0.18,primary)','vec3(0.05,0.32,0.05)*volume*mix(0.075,0.18,primary)']);
   textured.push(['+tissueFibre*silk*mix(0.05,0.12,primary)','+vec3(0.08,0.42,0.06)*silk*mix(0.05,0.12,primary)']);
   textured.push(['+vec3(1.0, 0.42, 0.20) * secondaryVolume','+vec3(0.10, 0.48, 0.07) * secondaryVolume']);
   mat.onBeforeCompile=(shader,r)=>{compile(shader,r);for(const [x,y] of textured){if(shader.fragmentShader.includes(x))shader.fragmentShader=shader.fragmentShader.replace(x,y);}};
   mat.customProgramCacheKey=()=>'pulse-tissue-stretch-ivory-visible-muscle-v6';
  }
  body=new THREE.SkinnedMesh(geo,mat);body.frustumCulled=false;
  bones=rest.map(([a])=>{const b=new THREE.Bone();b.position.copy(v(a));body.add(b);return b;});
  body.bind(new THREE.Skeleton(bones));scene.add(body);buildHandsAndShoes();
  renderer.domElement.className='silver-stretch-canvas';renderer.domElement.setAttribute('aria-hidden','true');
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();api.ready=false;api.failed=true;});
  api.ready=true;api.loading=false;
 }catch(error){console.warn('Stretch mannequin unavailable; keeping the drawn figure',error);api.failed=true;api.loading=false;api.ready=false;renderer?.dispose();}
}
function draw(stepId,elapsed){
 const cfg=POSES[stepId].def,key=cfg.muscles.join('|');
 if(key!==lastMuscles){lastMuscles=key;muscleUniform.value.fill(0);cfg.muscles.forEach((n,i)=>{const k=muscleNames.indexOf(n);if(k>=0)muscleUniform.value[k]=i===0?2:1;});}
 const now=poseAt(stepId,elapsed);applyPose(now.pose);
 const f=now.floor,size=f.getSize(new THREE.Vector3());shadow.position.set((f.min.x+f.max.x)/2,.002,(f.min.z+f.max.z)/2);shadow.scale.set(size.x*1.25+.35,size.z*1.25+.35,1);
 camera.position.copy(now.view.position);camera.lookAt(now.view.center);camera.updateMatrixWorld();
 tissueLight.value.copy(tissueLightWorld).transformDirection(camera.matrixWorldInverse);
 renderer.render(scene,camera);
}
/** Draw one frame into `target` (an element the canvas fills). Returns false until ready. */
api.render=({target,stepId,elapsed,width,height})=>{
 if(!POSES[stepId])return false;
 if(!api.ready){if(!api.failed)initialize();return false;}
 if(host!==target){host=target;target.replaceChildren(renderer.domElement);}
 const w=Math.max(20,Math.round(width)),h=Math.max(20,Math.round(height)),size=w+':'+h;
 if(size!==lastSize){lastSize=size;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 draw(stepId,elapsed);return true;
};
/** A still of the held position, for overview pages. */
api.snapshot=async(stepId,size=360)=>{
 if(!POSES[stepId])return null;
 if(!api.ready){await initialize();if(!api.ready)return null;}
 renderer.setSize(size,size,false);lastSize='';camera.aspect=1;camera.updateProjectionMatrix();
 shown=null;shownView=null;currentId='';draw(stepId,3);
 return renderer.domElement.toDataURL('image/png');
};
api.poses=()=>Object.keys(POSES);
api.preload=()=>{if(!api.ready&&!api.failed)initialize();};
