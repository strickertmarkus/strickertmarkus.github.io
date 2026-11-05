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
// A hand placed at a point (relative to the pelvis centre, before the figure is set on the
// floor), with the elbow bending toward `pole`: two-bone IK keeps both arm lengths exact.
function reach(to,pole){return {to:v(to),pole:d(...pole)};}
function flat(x,y,z){return {toe:d(x,y,z),up:d(0,1,0)};}
// On hands and knees in profile, head toward +x.
const allFours=()=>({up:d(1,.29,0),front:d(.29,-1,0),headUp:d(1,.05,0),arms:[[d(0,-1,.04),d(0,-1,0)],[d(0,-1,-.04),d(0,-1,0)]],legs:[[d(0,-1,.03),d(-1,-.02,0)],[d(0,-1,-.03),d(-1,-.02,0)]],feet:[point(-1,0,0),point(-1,0,0)]});
// Seated on the floor in profile, legs long toward +x.
const seatedSide=()=>({up:d(.05,1,0),front:d(1,-.05,0),pelvisUp:d(0,1,0),pelvisFront:d(1,0,0),arms:[[d(-.1,-1,.15),d(0,-1,.05)],[d(-.1,-1,-.15),d(0,-1,-.05)]],legs:[[d(1,.02,.03),d(1,-.02,0)],[d(1,.02,-.03),d(1,-.02,0)]],feet:[{toe:d(0,1,0),up:d(-1,0,0)},{toe:d(0,1,0),up:d(-1,0,0)}]});
// On the back with knees bent and feet on the floor.
const supineKnees=()=>{const p=supine();p.legs=[[d(.6,.8,.02),d(.43,-.9,0)],[d(.6,.8,-.02),d(.43,-.9,0)]];p.feet=[flat(1,0,0),flat(1,0,0)];return p;};

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
 'supine-hamstring':{mirror:'z',base:supine,muscles:['Baksida lår','Vader'],cam:{yaw:28,pitch:16},pose(){
  const p=supine();p.legs[1]=[d(.12,1,0),d(.03,1,0)];p.feet[1]={toe:d(-1,.15,0),up:d(0,-1,0)};
  // One hand each side of the raised thigh, elbows opening outward, so the arms never cross.
  p.arms=[reach([.0,.27,-.03],[-.4,.2,1]),reach([.0,.25,-.21],[-.4,.2,-1])];p.headUp=d(-1,.12,0);return p;}},
 // Liggande fyran: right thigh drawn in, left ankle across it, hands behind the right thigh.
 'figure-four':{mirror:'z',base:supine,muscles:['Säte','Baksida lår'],cam:{yaw:30,pitch:22},pose(){
  const p=supine();p.legs[0]=[d(-.3,1,0),d(1,.08,0)];p.feet[0]={toe:d(.08,1,0),up:d(-1,.08,0)};
  p.legs[1]=[d(-.25,.7,-.6),d(.15,.1,1)];p.feet[1]={toe:d(.2,1,.1),up:d(-1,.1,.15)};
  // The right hand around the outside of the right thigh, the left hand through the gap between the legs.
  p.arms=[reach([-.07,.25,.21],[-.3,.1,1]),reach([-.07,.22,.04],[-.3,.1,-1])];p.headUp=d(-1,.14,0);return p;}},
 // Knästående höftböjarstretch: left foot forward, right knee down; the right hip opens.
 hip:{mirror:'z',base:kneelUp,muscles:['Framsida lår','Mage'],cam:{yaw:-6,pitch:6},pose(){
  return {up:d(-.06,1,0),front:d(1,0,0),
   arms:[reach([.36,.08,-.05],[0,-.2,1]),reach([.38,.08,-.2],[0,-.2,-1])],
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
  const p=standFront();p.arms=[reach([.0,.33,.2],[-.3,-1,.2]),reach([-.36,.4,.14],[0,-.2,1])];return p;}},
 // Tricepsstretch över huvudet: the left elbow points up, the hand drops behind the head.
 triceps:{mirror:'x',base:standFront,muscles:['Triceps','Axlar'],cam:{yaw:22,pitch:6},pose(){
  // The right hand reaches behind the head to the raised left elbow, keeping the face clear.
  const p=standFront();p.arms=[reach([.13,.79,-.13],[-1,.5,-.2]),reach([.02,.62,-.12],[.15,1,-.1])];return p;}},
 /* ---------- Movements in the ready-made passes ---------- */
 rest:{base:supine,muscles:[],cam:{yaw:12,pitch:26},pose(){const p=supine();p.arms=[[d(1,0,.4),d(1,0,.32)],[d(1,0,-.4),d(1,0,-.32)]];p.legs=[[d(1,0,.07),d(1,0,.03)],[d(1,0,-.07),d(1,0,-.03)]];return p;}},
 arrive:{base:standFront,muscles:[],cam:{yaw:10,pitch:4},pose:standFront},
 neck:{base:standFront,muscles:['Axlar'],cam:{yaw:12,pitch:4},pose(){const p=standFront();p.arms=[[d(-.25,-1,-.05),d(-.08,-1,.05)],[d(.25,-1,-.05),d(.08,-1,.05)]];p.up=d(0,1,-.04);return p;}},
 'lat-reach':{mirror:'x',base:standFront,muscles:['Mage','Rygg'],cam:{yaw:4,pitch:3},pose(){
  const p=complete(POSE_DEFS.side.pose());p.arms=[reach([.27,.95,.07],[-1,.2,0]),reach([.47,.86,.07],[1,.3,0])];return p;}},
 'standing-quad':{mirror:'z',base:standSide,muscles:['Framsida lår','Mage'],cam:{yaw:-14,pitch:4},pose(){
  const p=standSide();p.legs[1]=[d(-.06,-1,-.02),d(-.31,.95,0)];p.feet[1]={toe:d(-.31,.95,0),up:d(-.95,-.31,0)};
  p.arms=[[d(1,.05,.25),d(1,.1,.05)],reach([-.2,-.08,-.24],[-.3,0,-1])];return p;}},
 fold:{base:seatedSide,muscles:['Baksida lår','Rygg'],cam:{yaw:-12,pitch:10},pose(){
  const p=seatedSide();p.up=d(.8,.6,0);p.front=d(.6,-.8,0);p.pelvisUp=d(.45,.89,0);p.pelvisFront=d(.89,-.45,0);p.headUp=d(.85,.45,0);
  p.arms=[reach([.62,.0,.14],[0,-1,.6]),reach([.62,.0,-.14],[0,-1,-.6])];return p;}},
 cat:{base:allFours,muscles:['Rygg','Mage'],cam:{yaw:-12,pitch:10},pose(){const p=allFours();p.headUp=d(1,-.35,0);return p;}},
 'chest-open':{base:standFront,muscles:['Bröst','Axlar'],cam:{yaw:38,pitch:5},pose(){
  const p=standFront();p.up=d(0,1,-.07);p.arms=[reach([-.05,-.06,-.17],[-1,0,-.3]),reach([.05,-.06,-.17],[1,0,-.3])];p.headUp=d(0,1,-.12);return p;}},
 thread:{mirror:'z',base:allFours,muscles:['Rygg','Axlar'],cam:{yaw:22,pitch:26},pose(){
  const p=allFours();p.up=d(1,.15,0);p.front=d(.08,-.8,.6);p.pelvisUp=d(1,.29,0);p.pelvisFront=d(.29,-1,0);p.headUp=d(1,-.15,.25);p.headFront=d(0,-.6,.8);
  p.arms=[reach([.5,-.36,.24],[0,0,1]),reach([.47,-.40,.32],[0,-1,0])];return p;}},
 goalpost:{base:standFront,muscles:['Bröst','Axlar'],cam:{yaw:12,pitch:4},pose(){const p=standFront();p.arms=[[d(-1,.02,-.15),d(0,1,-.05)],[d(1,.02,-.15),d(0,1,-.05)]];return p;}},
 biceps:{base:standFront,muscles:['Biceps','Bröst'],cam:{yaw:55,pitch:6},pose(){const p=standFront();p.arms=[[d(-.15,-.85,-.5),d(-.12,-.85,-.52)],[d(.15,-.85,-.5),d(.12,-.85,-.52)]];return p;}},
 'open-book':{mirror:'z',base:supine,muscles:['Bröst','Rygg'],cam:{yaw:0,pitch:52},pose(){
  return {up:d(-1,0,0),front:d(0,.85,.5),pelvisUp:d(-1,0,0),pelvisFront:d(0,0,1),headUp:d(-1,.05,0),headFront:d(0,.7,-.7),
   arms:[[d(0,-.1,1),d(0,0,1)],[d(0,-.25,-1),d(0,-.1,-1)]],legs:[[d(.15,0,1),d(1,0,0)],[d(.15,.05,1),d(1,0,0)]],feet:[{toe:d(0,0,1),up:d(-1,0,0)},{toe:d(0,0,1),up:d(-1,0,0)}]};}},
 soleus:{mirror:'z',base:standSide,muscles:['Vader'],cam:{yaw:-10,pitch:4},pose(){
  return {up:d(.12,1,0),front:d(1,-.12,0),arms:[[d(1,.08,.25),d(1,.15,.05)],[d(1,.08,-.25),d(1,.15,-.05)]],
   legs:[[d(.35,-1,.02),d(.1,-1,0)],[d(-.05,-1,-.02),d(-.35,-1,0)]],feet:[flat(1,0,0),flat(1,0,0)]};}},
 puppy:{base:allFours,muscles:['Axlar','Rygg','Bröst'],cam:{yaw:-14,pitch:10},pose(){
  const p=allFours();p.up=d(1,-.55,0);p.front=d(-.55,-1,0);p.headUp=d(1,-.4,0);p.arms=[[d(.92,-.38,.05),d(1,-.05,0)],[d(.92,-.38,-.05),d(1,-.05,0)]];return p;}},
 'self-hug':{base:standFront,muscles:['Rygg','Axlar'],cam:{yaw:14,pitch:4},pose(){const p=standFront();p.up=d(0,1,.04);p.arms=[reach([.2,.42,.13],[0,-1,.6]),reach([-.2,.39,.16],[0,-1,.7])];return p;}},
 butterfly:{base:seatedFront,muscles:['Säte'],cam:{yaw:18,pitch:20},pose(){
  return {up:d(0,1,.15),front:d(0,-.15,1),pelvisUp:d(0,1,0),pelvisFront:d(0,0,1),
   arms:[reach([-.08,-.02,.36],[-1,0,0]),reach([.08,-.02,.36],[1,0,0])],
   legs:[[d(-.85,.1,.55),d(.4,-.1,.13)],[d(.85,.1,.55),d(-.4,-.1,.13)]],feet:[{toe:d(0,0,1),up:d(-1,.3,0)},{toe:d(0,0,1),up:d(1,.3,0)}]};}},
 'knee-sways':{base:supineKnees,muscles:['Rygg','Mage'],cam:{yaw:14,pitch:30},pose(){
  const p=supineKnees();p.legs=[[d(.6,.6,.5),d(.43,-.8,.4)],[d(.6,.65,.45),d(.43,-.8,.4)]];p.feet=[flat(1,0,.3),flat(1,0,.3)];p.arms=[[d(.3,0,1),d(.2,0,1)],[d(.3,0,-1),d(.2,0,-1)]];return p;}},
 /* ---------- Neck, more floor work, standing folds ---------- */
 'neck-tilt':{mirror:'x',base:standFront,muscles:['Axlar'],cam:{yaw:8,pitch:4},pose(){const p=standFront();p.headUp=d(.42,.9,0);return p;}},
 'neck-turn':{base:standFront,muscles:['Axlar'],cam:{yaw:8,pitch:4},pose(){const p=standFront();p.headFront=d(.75,0,.66);return p;}},
 'neck-nod':{base:standFront,muscles:['Axlar','Rygg'],cam:{yaw:40,pitch:4},pose(){const p=standFront();p.headUp=d(0,.82,.57);return p;}},
 levator:{mirror:'x',base:standFront,muscles:['Axlar'],cam:{yaw:12,pitch:4},pose(){const p=standFront();p.headUp=d(.25,.85,.45);p.headFront=d(.4,-.45,.8);return p;}},
 'chin-tuck':{base:standFront,muscles:['Axlar'],cam:{yaw:60,pitch:4},pose(){const p=standFront();p.headUp=d(0,1,-.14);return p;}},
 'knee-chest':{mirror:'z',base:supine,muscles:['Säte','Rygg'],cam:{yaw:20,pitch:18},pose(){
  const p=supine();p.legs[1]=[d(-.5,.85,0),d(.75,-.66,0)];p.feet[1]={toe:d(.66,.75,0),up:d(-.75,.66,0)};
  p.arms=[reach([-.1,.36,-.03],[-.3,.3,1]),reach([-.1,.34,-.21],[-.3,.3,-1])];return p;}},
 'both-knees':{base:supine,muscles:['Rygg','Säte'],cam:{yaw:20,pitch:18},pose(){
  const p=supine();p.legs=[[d(-.5,.85,.03),d(.75,-.66,0)],[d(-.5,.85,-.03),d(.75,-.66,0)]];p.feet=[{toe:d(.66,.75,0),up:d(-.75,.66,0)},{toe:d(.66,.75,0),up:d(-.75,.66,0)}];
  p.arms=[reach([-.08,.34,.2],[-.3,.3,1]),reach([-.08,.34,-.2],[-.3,.3,-1])];return p;}},
 'pelvic-tilt':{base:supine,muscles:['Mage','Rygg'],cam:{yaw:10,pitch:14},pose:supineKnees},
 'supine-twist':{mirror:'z',base:supine,muscles:['Rygg','Säte','Mage'],cam:{yaw:14,pitch:34},pose(){
  const p=supine();p.legs[1]=[d(-.3,.4,.87),d(.65,-.55,.5)];p.feet[1]={toe:d(.2,0,1),up:d(-.6,.2,.5)};p.arms=[[d(.1,0,1),d(.05,0,1)],[d(.1,0,-1),d(.05,0,-1)]];p.headFront=d(0,.55,-.84);return p;}},
 'standing-fold':{base:standSide,muscles:['Baksida lår','Rygg'],cam:{yaw:-14,pitch:4},pose(){
  return {up:d(.45,-.9,0),front:d(-.9,-.45,0),pelvisUp:d(.55,.83,0),pelvisFront:d(.83,-.55,0),headUp:d(.2,-1,0),
   arms:[[d(.08,-1,.12),d(.04,-1,.05)],[d(.08,-1,-.12),d(.04,-1,-.05)]],legs:[[d(-.14,-1,.03),d(.06,-1,0)],[d(-.14,-1,-.03),d(.06,-1,0)]],feet:[flat(1,0,0),flat(1,0,0)]};}},
 cobra:{base:prone,muscles:['Mage','Rygg'],cam:{yaw:-10,pitch:14},pose(){
  const p=prone();p.up=d(-1,.75,0);p.front=d(-.75,-1,0);p.headUp=d(-.8,.6,0);
  p.arms=[reach([-.42,-.09,-.25],[1,.2,-.3]),reach([-.42,-.09,.25],[1,.2,.3])];p.legs=[[d(1,-.06,-.05),d(1,0,0)],[d(1,-.06,.05),d(1,0,0)]];return p;}}
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
function ik(start,target,pole,a,b){
 const D=target.clone().sub(start),n=D.clone().normalize(),dist=Math.min(a+b-1e-3,Math.max(Math.abs(a-b)+1e-3,D.length()));
 const m=pole.clone().addScaledVector(n,-pole.dot(n)).normalize(),cos=(a*a+dist*dist-b*b)/(2*a*dist),sin=Math.sqrt(Math.max(0,1-cos*cos));
 const elbow=start.clone().addScaledVector(n,a*cos).addScaledVector(m,a*sin),end=start.clone().addScaledVector(n,dist);
 return [elbow.clone().sub(start).normalize(),end.sub(elbow).normalize()];
}
function complete(p){
 const q={...p};q.pelvisUp=q.pelvisUp||q.up;q.pelvisFront=q.pelvisFront||q.front;q.headUp=q.headUp||q.up;q.headFront=q.headFront||q.front;
 const torso=frameOf(q.up,q.front);
 q.arms=q.arms.map((arm,i)=>arm.to?ik(v([0,0,0]).addScaledVector(torso.u,LEN.shoulder).addScaledVector(torso.r,(i?1:-1)*LEN.shoulderW),arm.to,arm.pole,LEN.upper,LEN.fore):arm);
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
// Each movement is shown straight in its held position: no in-between animation,
// only a slow, barely visible breath (about 5.5 s per cycle).
let shown=null;
function poseAt(id,elapsed){
 const T=targetFor(id);T.view=T.view||viewFor(T.target,T.cam);
 const breath=.5-.5*Math.cos(Math.max(0,elapsed)*2*Math.PI/5.5);
 shown=mixPose(T.neutral,T.target,1-.03*breath);
 return {pose:shown,view:T.view,floor:T.view.floor};
}
let initializing=null;
function initialize(){if(!initializing&&!api.ready)initializing=initializeOnce();return initializing||Promise.resolve();}
async function initializeOnce(){
 api.loading=true;
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
    ['generalGlow*=uActivation;','generalGlow+=vec3(0.06,0.44,0.05)*primary*region*seen*(0.62+0.55*modelShade+0.16*silk);\n     generalGlow*=uActivation;'],
    ['#include <emissivemap_fragment>','#include <emissivemap_fragment>\n    totalEmissiveRadiance += vec3(0.06,0.56,0.05) * muscleMask * (0.30 + 0.34 * modelShade) * uActivation;'],
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
   mat.customProgramCacheKey=()=>'pulse-tissue-stretch-ivory-visible-muscle-v7';
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
 draw(stepId,0);
 return renderer.domElement.toDataURL('image/png');
};
api.poses=()=>Object.keys(POSES);
api.preload=()=>{if(!api.ready&&!api.failed)initialize();};
