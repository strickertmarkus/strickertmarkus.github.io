/** Pulse mannequin as stretch instructor: the same sculpted figure as the exercise
    explorer, standing, with the stretched muscles in stretch green instead of red.
    One movement for now: Sidosträck (side-left / side-right). */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createTissueMaterial,muscleNames} from './pulse-silver-material.js?v=22';
const v=p=>new THREE.Vector3(...p);
const POSES={'side-left':{dir:1,muscles:['Rygg','Mage']},'side-right':{dir:-1,muscles:['Rygg','Mage']}};
const api={ready:false,failed:false,loading:false,supports:id=>!!POSES[id]};
window.PulseSilverStretch=api;
const pressContraction={value:0},muscleUniform={value:new Float32Array(10)},pilotUniform={value:0},activationUniform={value:1},tissueLight={value:new THREE.Vector3()};
const tissueLightWorld=new THREE.Vector3(-2,4,3).normalize();
// Stretch-only finish. The exercise explorer owns its own materials and is
// intentionally untouched: soft ivory hands, satin body and a brighter green rim.
const skin=new THREE.MeshStandardMaterial({color:0xf1efe7,metalness:.035,roughness:.76}),soleMat=new THREE.MeshStandardMaterial({color:0xb1bdb4,roughness:.83}),shoeMat=new THREE.MeshStandardMaterial({color:0x354c46,roughness:.76});
let scene,camera,renderer,body,bones,rest,hands=[],shoes=[],host=null,lastSize='',lastMuscles='';
let poseReady=false,lastPoseTime=0;
const easedOrientation=new THREE.Quaternion();
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
}
const rotZ=(vec,a)=>vec.clone().applyAxisAngle(new THREE.Vector3(0,0,1),a);
function pose(id,elapsed,now){
 // Each skinned bone is driven toward its target, rather than snapped into it.
 // This keeps the reaching arm continuous when changing sides.
 const dt=lastPoseTime?Math.min(.08,Math.max(0,(now-lastPoseTime)/1000)):0;
 const follow=poseReady?1-Math.exp(-dt/.16):1;
 lastPoseTime=now;
 const cfg=POSES[id],dir=cfg.dir,ease=x=>x*x*(3-2*x);
 // Ease into the lean, then breathe in it.
 const lean=THREE.MathUtils.degToRad(4+22*ease(Math.min(1,elapsed/2.4))+2.2*Math.sin(elapsed*1.25));
 const a=-dir*lean,hip=v([0,.96,0]),up=rotZ(v([0,1,0]),a);
 const shoulder=hip.clone().addScaledVector(up,.52),head=shoulder.clone().addScaledVector(rotZ(v([0,1,0]),a*1.15),.30);
 const segments=[[hip,shoulder],[shoulder,head]],sh=[];
 for(const s of [-1,1])sh.push(hip.clone().add(rotZ(v([s*.225,.47,0]),a)));
 const wrists=[];
 for(let i=0;i<2;i++){
  const s=i===0?-1:1,S=sh[i];
  let el,wr;
  if(s===-dir){
   // The reaching arm goes up and over the head toward the lean.
   const u=rotZ(v([0,1,0]),a-dir*THREE.MathUtils.degToRad(10)),f=rotZ(v([0,1,0]),a-dir*THREE.MathUtils.degToRad(34));
   el=S.clone().addScaledVector(u,.329).add(v([0,0,.06]));wr=el.clone().addScaledVector(f,.265);
  }else{
   // The other hand rests on the outside of the thigh.
   const u=rotZ(v([s*.18,-1,0]).normalize(),a*.5);el=S.clone().addScaledVector(u,.329).add(v([0,0,.02]));
   wr=el.clone().addScaledVector(rotZ(v([s*.05,-1,.08]).normalize(),a*.2),.265);
  }
  segments.push([S,el],[el,wr]);wrists.push([el,wr]);
 }
 for(let i=0;i<2;i++){const s=i===0?-1:1,h=v([s*.12,.94,0]),k=v([s*.13,.51,.015]),f=v([s*.13,.10,.01]);segments.push([h,k],[k,f]);shoes[i].position.copy(f).add(v([0,-.073,0]));shoes[i].quaternion.identity();}
 segments.push([v([0,.86,0]),v([0,1.02,0])]);
 for(let i=0;i<bones.length;i++){
  const [p,q]=segments[i],from=v(rest[i][1]).sub(v(rest[i][0])).normalize(),to=q.clone().sub(p).normalize();
  easedOrientation.setFromUnitVectors(from,to);
  if(!poseReady){bones[i].position.copy(p);bones[i].quaternion.copy(easedOrientation);}
  else{bones[i].position.lerp(p,follow);bones[i].quaternion.slerp(easedOrientation,follow);}
  bones[i].scale.setScalar(1);
 }
 for(let i=0;i<2;i++){
  const [el,wr]=wrists[i],d=wr.clone().sub(el).normalize();
  easedOrientation.setFromUnitVectors(v([0,-1,0]),d);
  if(!poseReady){hands[i].position.copy(wr);hands[i].quaternion.copy(easedOrientation);}
  else{hands[i].position.lerp(wr,follow);hands[i].quaternion.slerp(easedOrientation,follow);}
 }
 poseReady=true;
 body.morphTargetInfluences&&(body.morphTargetInfluences.fill?body.morphTargetInfluences.fill(0):0);
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
    float muscleShape = max(muscleTex, 0.70) * (1.0 - clothingMask);
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
    ['diffuseColor.rgb = mix(pearl, muscleColor, muscleMask);','muscleMask *= muscleShape;\n    diffuseColor.rgb = mix(pearl, vec3(0.34,0.86,0.22) * (0.53 + 0.52 * modelShade), muscleMask);'],
    ['float secondary = max(shoulder, triceps) * 0.85;','float secondary = max(shoulder, triceps) * 0.45;'],
    ['muscleMask=region*mix(0.85,0.99,primary);','// Worked glutes show through the shorts as a glow on the fabric.\n     float seen=max(muscleShape, glutes*min(uMuscles[6],1.0)*clothingMask*0.8);\n     muscleMask=max(region*muscleShape, glutes*min(uMuscles[6],1.0)*clothingMask*0.8)*mix(0.78,1.0,primary);'],
    ['diffuseColor.rgb=mix(pearl,red,muscleMask);',`vec3 flesh = mix(vec3(0.045,0.16,0.04), vec3(0.34,0.87,0.21), clamp(modelShade * 1.05 + silk * 0.20, 0.0, 1.0));
     diffuseColor.rgb=mix(pearl,flesh,muscleMask);`],
    ['+vec3(1.0,0.42,0.20)*volume*reflection','+vec3(0.55,0.95,0.40)*volume*reflection'],
    // The main worked muscle glows from within, strongest along its shading highlights.
    ['generalGlow*=uActivation;','generalGlow+=vec3(0.41,0.93,0.21)*primary*region*seen*(0.62+0.75*modelShade+0.19*silk);\n     generalGlow*=uActivation;'],
    ['#include <emissivemap_fragment>','#include <emissivemap_fragment>\n    totalEmissiveRadiance += vec3(0.36,1.0,0.19) * muscleMask * (0.27 + 0.44 * modelShade) * uActivation;'],
    ['generalGlow=region*(','generalGlow=region*seen*mix(0.45,1.0,primary)*('],
    ['#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n    roughnessFactor = mix(roughnessFactor, 0.66, max(muscleMask, clothingMask));'],
    ['#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n    metalnessFactor = mix(metalnessFactor, 0.02, max(muscleMask, clothingMask));']
   ];
   textured.push(['+vec3(1.0, 0.42, 0.20) * secondaryVolume','+vec3(0.55, 0.95, 0.40) * secondaryVolume']);
   mat.onBeforeCompile=(shader,r)=>{compile(shader,r);for(const [x,y] of textured){if(shader.fragmentShader.includes(x))shader.fragmentShader=shader.fragmentShader.replace(x,y);}};
   mat.customProgramCacheKey=()=>'pulse-tissue-stretch-ivory-visible-muscle-v3';
  }
  body=new THREE.SkinnedMesh(geo,mat);body.frustumCulled=false;
  bones=rest.map(([a])=>{const b=new THREE.Bone();b.position.copy(v(a));body.add(b);return b;});
  body.bind(new THREE.Skeleton(bones));scene.add(body);buildHandsAndShoes();
  renderer.domElement.className='silver-stretch-canvas';renderer.domElement.setAttribute('aria-hidden','true');
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();api.ready=false;api.failed=true;});
  api.ready=true;api.loading=false;
 }catch(error){console.warn('Stretch mannequin unavailable; keeping the drawn figure',error);api.failed=true;api.loading=false;api.ready=false;renderer?.dispose();}
}
/** Draw one frame into `target` (an element the canvas fills). Returns false until ready. */
api.render=({target,stepId,elapsed,width,height})=>{
 if(!POSES[stepId])return false;
 if(!api.ready){if(!api.failed)initialize();return false;}
 if(host!==target){host=target;target.replaceChildren(renderer.domElement);}
 const w=Math.max(20,Math.round(width)),h=Math.max(20,Math.round(height)),size=w+':'+h;
 if(size!==lastSize){lastSize=size;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const cfg=POSES[stepId],key=cfg.muscles.join('|');
 if(key!==lastMuscles){lastMuscles=key;muscleUniform.value.fill(0);cfg.muscles.forEach((n,i)=>{const k=muscleNames.indexOf(n);if(k>=0)muscleUniform.value[k]=i===0?2:1;});}
 pose(stepId,elapsed,performance.now());
 camera.position.set(.35,1.05,4.3);camera.lookAt(0,.98,0);camera.updateMatrixWorld();
 tissueLight.value.copy(tissueLightWorld).transformDirection(camera.matrixWorldInverse);
 renderer.render(scene,camera);return true;
};
api.preload=()=>{if(!api.ready&&!api.failed)initialize();};
