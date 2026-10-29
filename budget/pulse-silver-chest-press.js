/** Original rigged mannequin + chest-press apparatus. One renderer, driven by the guide clock. */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createEquipment} from './pulse-silver-equipment.js?v=22';
import {applyMotion,frameCamera} from './pulse-silver-rig.js?v=22';
import {createTissueMaterial,muscleNames} from './pulse-silver-material.js?v=22';
const host=document.getElementById('exercise-silver-3d'),stage=document.getElementById('studio-stage');
const api={ready:false,loading:false,failed:false,update:()=>false};
window.PulseSilverPress=api;
const v=p=>new THREE.Vector3(...p),Y=new THREE.Vector3(0,1,0);
const pressContraction={value:0},muscleUniform={value:new Float32Array(10)},pilotUniform={value:1},activationUniform={value:1};
let pilotObjects=[],equipment,ortho,lastMuscles='';
const tissueLight={value:new THREE.Vector3()};
const tissueLightWorld=new THREE.Vector3(-2,4,3).normalize();
const materials={
 frame:new THREE.MeshStandardMaterial({color:0x344555,metalness:.72,roughness:.32}),
 trim:new THREE.MeshStandardMaterial({color:0x718393,metalness:.8,roughness:.25}),
 pad:new THREE.MeshStandardMaterial({color:0x15202c,metalness:.08,roughness:.65}),
 rubber:new THREE.MeshStandardMaterial({color:0x111923,roughness:.85}),
 skin:new THREE.MeshStandardMaterial({color:0x9daab8,metalness:.28,roughness:.52}),
 shoe:new THREE.MeshStandardMaterial({color:0x35404e,roughness:.65}),
 sole:new THREE.MeshStandardMaterial({color:0x86939e,roughness:.8})
};
let scene,camera,renderer,body,bones,rest,hands=[],shoes=[],levers=[],stack,frameLatest,started=false,lastSize='';
function mesh(geometry,material,parent=scene){const obj=new THREE.Mesh(geometry,material);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;}
function sphere(pos,scale,mat,parent=scene){const obj=mesh(new THREE.SphereGeometry(1,24,18),mat,parent);obj.position.copy(v(pos));obj.scale.copy(v(scale));return obj;}
function rod(a,b,r,mat,parent=scene){const av=v(a),bv=v(b),delta=bv.clone().sub(av);const obj=mesh(new THREE.CylinderGeometry(r,r,delta.length(),16),mat,parent);obj.position.copy(av.add(bv).multiplyScalar(.5));obj.quaternion.setFromUnitVectors(Y,delta.normalize());return obj;}
function pad(pos,size,mat,parent=scene){
 const shape=new THREE.Shape(),w=size[0]/2,h=size[1]/2,r=Math.min(w,h,.045);
 shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:size[2],bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,steps:1,curveSegments:6});geo.translate(0,0,-size[2]/2);
 const obj=mesh(geo,mat,parent);obj.position.copy(v(pos));return obj;
}
function buildMachine(){
 for(const x of [-.47,.47]){
  rod([x,.045,-.42],[x,.045,.65],.037,materials.frame);
  for(const z of [-.42,.65])pad([x,.025,z],[.12,.035,.13],materials.rubber);
  rod([x,.06,-.22],[x,1.57,-.22],.037,materials.frame);
  rod([x,1.57,-.22],[x,1.52,.22],.032,materials.frame);
  sphere([x,1.52,.22],[.05,.05,.05],materials.trim);
 }
 rod([-.47,.08,-.22],[.47,.08,-.22],.035,materials.frame);
 rod([0,.08,.06],[0,.58,.06],.035,materials.frame);
 const seat=pad([0,.58,.12],[.4,.32,.075],materials.pad);seat.rotation.x=-Math.PI/2;
 pad([0,1.03,-.137],[.39,.64,.08],materials.pad);
 rod([0,.18,-.25],[0,1.34,-.25],.03,materials.frame);
 // Side weight tower: simple silhouette, visible cable and selected plates.
 for(const x of [-.78,-.56])rod([x,.05,-.27],[x,1.50,-.27],.025,materials.frame);
 rod([-.78,1.50,-.27],[-.56,1.50,-.27],.03,materials.frame);
 for(const x of [-.72,-.62])rod([x,.10,-.27],[x,1.44,-.27],.008,materials.trim);
 for(let i=0;i<9;i++)pad([-.67,.12+i*.037,-.27],[.23,.024,.18],materials.rubber);
 stack=new THREE.Group();scene.add(stack);
 for(let i=0;i<4;i++)pad([-.67,.46+i*.037,-.27],[.23,.024,.18],materials.frame,stack);
 rod([-.67,.61,-.27],[-.67,1.43,-.27],.004,materials.trim);
 const pin=sphere([-.67,.51,-.168],[.025,.012,.014],new THREE.MeshStandardMaterial({color:0xe5a06c,roughness:.4}),stack);
 for(const s of [-1,1]){
  const lever=new THREE.Group();lever.position.set(s*.47,1.52,.22);scene.add(lever);
  rod([0,0,0],[0,-.45,0],.027,materials.frame,lever);
  rod([0,-.45,0],[-s*.13,-.45,0],.018,materials.trim,lever);
  // Vertical grips rotate with the press arm. Grip centre and palm share this transform.
  rod([-s*.13,-.51,0],[-s*.13,-.39,0],.018,materials.rubber,lever);
  levers.push(lever);
 }
}
function buildHands(){
 for(const s of [-1,1]){
  const hand=new THREE.Group();scene.add(hand);
  sphere([s*.013,0,-.017],[.029,.052,.024],materials.skin,hand);
  // Four curled fingers and thumb around the handle, rather than a mitten or ball.
  for(let i=0;i<4;i++){
   const yy=.037-i*.022;
   const points=[[s*.027,yy,-.02],[-s*.015,yy,-.025],[-s*.028,yy,.005],[-s*.013,yy,.022]];
   for(let j=0;j<3;j++)rod(points[j],points[j+1],.0095,materials.skin,hand);
   sphere(points[1],[.010,.010,.010],materials.skin,hand);
  }
  rod([s*.031,.036,-.014],[s*.014,.014,.025],.013,materials.skin,hand);
  sphere([s*.014,.014,.025],[.014,.018,.013],materials.skin,hand);
  hands.push(hand);
  const shoe=new THREE.Group();scene.add(shoe);
  sphere([0,.026,.055],[.062,.029,.13],materials.sole,shoe);
  sphere([0,.052,.048],[.059,.047,.12],materials.shoe,shoe);
  for(let i=0;i<3;i++)rod([-.03,.087,.055+i*.022],[.03,.087,.055+i*.022],.003,materials.trim,shoe);
  shoes.push(shoe);
 }
}
function elbow(shoulder,wrist,sign){
 const d=wrist.clone().sub(shoulder),len=d.length(),axis=d.clone().normalize();
 const upper=.329,lower=.27,dist=Math.min(len,upper+lower-.005);
 const along=(upper*upper-lower*lower+dist*dist)/(2*dist);
 let pole=new THREE.Vector3(sign*.7,-.25,-.3);pole.addScaledVector(axis,-pole.dot(axis)).normalize();
 return shoulder.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,upper*upper-along*along)));
}
function pose(t){
 for(const bone of bones)bone.scale.setScalar(1);
 for(const shoe of shoes)shoe.quaternion.identity();
 pressContraction.value=t;
 body.morphTargetInfluences[0]=1-t;body.morphTargetInfluences[1]=t;
 const angle=THREE.MathUtils.degToRad(-10+60*t),hip=v([0,.69,0]),shoulder=v([0,1.21,0]);
 const segments=[[hip,shoulder],[shoulder,v([0,1.51,0])]];
 const wrists=[],elbows=[],shoulders=[];
 for(let i=0;i<2;i++){
  const s=i===0?-1:1;
  levers[i].rotation.x=-angle;levers[i].updateMatrixWorld(true);
  const grip=levers[i].localToWorld(v([-s*.13,-.45,0]));
  hands[i].position.copy(grip);hands[i].quaternion.copy(levers[i].quaternion);
  const wrist=hands[i].localToWorld(v([s*.035,-.015,-.02]));
  const sh=v([s*.225,1.16,0]),el=elbow(sh,wrist,s);
  segments.push([sh,el],[el,wrist]);wrists.push(wrist.toArray());elbows.push(el.toArray());shoulders.push(sh.toArray());
 }
 for(let i=0;i<2;i++){
  const s=i===0?-1:1,a=v([s*.12,.67,.005]),k=v([s*.145,.43,.37]),ankle=v([s*.145,.085,.48]);
  segments.push([a,k],[k,ankle]);shoes[i].position.copy(ankle).add(v([0,-.073,0]));
 }
 segments.push([v([0,.60,0]),v([0,.76,0])]);
 for(let i=0;i<bones.length;i++){
  const [a,b]=segments[i],from=v(rest[i][1]).sub(v(rest[i][0])).normalize(),to=b.clone().sub(a).normalize();
  bones[i].position.copy(a);bones[i].quaternion.setFromUnitVectors(from,to);
 }
 stack.position.y=.08*t;
 api.pose={t,wrists,elbows,shoulders,grips:hands.map(h=>h.position.toArray())};
}
async function initialize(){
 if(started)return;started=true;api.loading=true;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.1,20);
  const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(environment,.04);
  scene.environment=env.texture;scene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe5efff,0x263040,.8));
  const key=new THREE.DirectionalLight(0xfff0e2,2);key.position.set(-2,4,3);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.1,far:10});key.shadow.bias=-.0007;key.shadow.normalBias=.02;scene.add(key);
  const rim=new THREE.DirectionalLight(0xb3d8ff,1.6);rim.position.set(2,2,-2);scene.add(rim);
  const floor=mesh(new THREE.PlaneGeometry(8,8),new THREE.ShadowMaterial({opacity:.20}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.castShadow=false;
  // The figure: Markus's sculpted model fitted to the animation skeleton (scripts/build-pulse-figure.py).
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
  // Two smooth pectoral shapes blend with the existing press clock.
  // Normals are morphed too, so the light follows the changing muscle volume.
  const restPositions=geo.getAttribute('position');
  const shapes=[0,1].map(contraction=>{
   const positions=restPositions.clone();
   const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
   for(let i=0;i<positions.count;i++){
    const x=restPositions.getX(i),y=restPositions.getY(i),z=restPositions.getZ(i);
    const mask=Math.exp(-Math.pow((Math.abs(x)-.115)/.115,4)-Math.pow((y-1.365)/.105,4))
      *smooth(.025,.095,z)*smooth(.004,.025,Math.abs(x));
    positions.setXYZ(i,x+Math.sign(x)*(.009-.019*contraction)*mask,
      y+.004*contraction*mask,z+(-.006+.025*contraction)*mask);
   }
   const shape=new THREE.BufferGeometry();shape.setIndex(geo.index);shape.setAttribute('position',positions);
   shape.computeVertexNormals();const normals=shape.getAttribute('normal').clone();shape.dispose();
   return {positions,normals};
  });
  geo.morphAttributes.position=shapes.map(s=>s.positions);
  geo.morphAttributes.normal=shapes.map(s=>s.normals);
  const mat=createTissueMaterial(materials.skin,{pressContraction,tissueLight,muscleUniform,pilotUniform,activationUniform});
  // Solid, with the model's own painted texture driving shading and muscle shapes.
  if(meta.texture){
   const map=await new THREE.TextureLoader().loadAsync(new URL(meta.texture,base).href);
   map.flipY=false;map.colorSpace=THREE.NoColorSpace;map.anisotropy=4;
   Object.assign(mat,{map,opacity:1,transparent:false,depthWrite:true,roughness:.30,metalness:.78});mat.color.set(0xffffff);
   Object.assign(materials.skin,{roughness:.30,metalness:.78});materials.skin.color.set(0x8a929c);
   const compile=mat.onBeforeCompile;
   // Textured figure, styled like the explorer's body map: dark chrome skin that
   // keeps the model's shading, dark shorts, and red tissue only on the painted
   // muscle shapes of the worked muscles (primary strong, secondary quieter).
   const textured=[
    ['vec3 pearl = mix(vec3(0.86, 0.90, 0.95), mix(diffuseColor.rgb,vec3(0.055,0.085,0.13),shortsExtension), clothingMask);',
     `vec3 modelTex = diffuseColor.rgb;
    float modelShade = clamp(dot(modelTex, vec3(0.299,0.587,0.114)) * 1.9, 0.0, 1.3);
    float muscleTex = smoothstep(0.015, 0.08, modelTex.r - modelTex.b) * (1.0 - clothingMask);
    float muscleShape = max(muscleTex, 0.35) * (1.0 - clothingMask);
    vec3 chrome = vec3(0.34,0.37,0.41) * (0.28 + 0.95 * modelShade);
    chrome = mix(chrome, chrome * vec3(1.04,0.98,0.96), muscleTex * 0.35);
    // Shadowed eye sockets under the brow give the mannequin face some depth.
    float eyeShade = exp(-pow((p.x - 0.037) / 0.021, 2.0) - pow((p.y - 1.718) / 0.014, 2.0)) * smoothstep(0.105, 0.13, p.z);
    chrome *= 1.0 - 0.62 * eyeShade;
    vec3 pearl = mix(chrome, vec3(0.040,0.052,0.075), clothingMask);`],
    ['diffuseColor.rgb = mix(pearl, muscleColor, muscleMask);','muscleMask *= muscleShape;\n    diffuseColor.rgb = mix(pearl, muscleColor * (0.50 + 0.85 * modelShade), muscleMask);'],
    ['float secondary = max(shoulder, triceps) * 0.85;','float secondary = max(shoulder, triceps) * 0.45;'],
    ['muscleMask=region*mix(0.85,0.99,primary);','// Worked glutes show through the shorts as a glow on the fabric.\n     float seen=max(muscleShape, glutes*min(uMuscles[6],1.0)*clothingMask*0.8);\n     muscleMask=max(region*muscleShape, glutes*min(uMuscles[6],1.0)*clothingMask*0.8)*mix(0.45,1.0,primary);'],
    ['diffuseColor.rgb=mix(pearl,red,muscleMask);',`vec3 flesh = mix(vec3(0.17,0.004,0.006), vec3(0.88,0.07,0.04), clamp(modelShade * 1.2 + silk * 0.25, 0.0, 1.0));
     diffuseColor.rgb=mix(pearl,flesh,muscleMask);`],
    ['+vec3(1.0,0.42,0.20)*volume*reflection','+vec3(0.85,0.10,0.05)*volume*reflection'],
    // The main worked muscle glows from within, strongest along its shading highlights.
    ['generalGlow*=uActivation;','generalGlow+=vec3(1.0,0.12,0.05)*primary*region*seen*(0.28+0.42*modelShade+0.12*silk);\n     generalGlow*=uActivation;'],
    ['#include <emissivemap_fragment>','#include <emissivemap_fragment>\n    totalEmissiveRadiance += vec3(0.95,0.09,0.04) * muscleMask * (0.10 + 0.20 * modelShade) * uActivation;'],
    ['generalGlow=region*(','generalGlow=region*seen*mix(0.45,1.0,primary)*('],
    ['#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n    roughnessFactor = mix(roughnessFactor, 0.48, max(muscleMask, clothingMask));'],
    ['#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n    metalnessFactor = mix(metalnessFactor, 0.04, max(muscleMask, clothingMask));']
   ];
   mat.onBeforeCompile=(shader,renderer)=>{compile(shader,renderer);for(const [a,b] of textured){if(!shader.fragmentShader.includes(a))console.warn('pulse figure: shader text not found',a.slice(0,40));shader.fragmentShader=shader.fragmentShader.replace(a,b);}};
   mat.customProgramCacheKey=()=>'pulse-tissue-textured';
  }
  body=new THREE.SkinnedMesh(geo,mat);body.frustumCulled=false;body.castShadow=true;body.receiveShadow=true;
  bones=rest.map(([a])=>{const b=new THREE.Bone();b.position.copy(v(a));body.add(b);return b;});
  body.bind(new THREE.Skeleton(bones));scene.add(body);
  const existing=new Set(scene.children);buildMachine();pilotObjects=scene.children.filter(o=>!existing.has(o));buildHands();
  equipment=createEquipment(scene);ortho=new THREE.OrthographicCamera(-1,1,1,-1,.01,40);
  host.replaceChildren(renderer.domElement);renderer.domElement.style.cssText='display:block;width:100%;height:100%';
  renderer.domElement.setAttribute('aria-hidden','true');
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();api.ready=false;api.failed=true;stage.classList.remove('silver-press-ready','exercise-3d-ready');});
  api.ready=true;api.loading=false;api.model={vertices:meta.vertices,triangles:meta.triangles};
  api.inspect=()=>{
   body.updateMatrixWorld(true);body.skeleton.update();
   const box=new THREE.Box3(),point=new THREE.Vector3();
   for(let i=0;i<geo.attributes.position.count;i+=7){body.getVertexPosition(i,point);box.expandByPoint(point);}
   return {min:box.min.toArray(),max:box.max.toArray(),muscles:Array.from(muscleUniform.value),performance:api.performance};
  };
  if(frameLatest)api.update(frameLatest);
 }catch(error){
  console.warn('Silver press unavailable; keeping original exercise illustration',error);
  api.failed=true;api.loading=false;api.ready=false;renderer?.dispose();
  stage.classList.remove('silver-press-ready','exercise-3d-ready');
 }
}
api.update=frame=>{
 frameLatest=frame;
 if(!api.ready){if(!api.failed&&!api.loading)initialize();return false;}
 if(!host.contains(renderer.domElement))host.replaceChildren(renderer.domElement);
 const w=frame.previewWidth||Math.round(stage.clientWidth),h=frame.previewHeight||Math.round(stage.clientHeight);
 if(w<20||h<20)return false;
 const size=w+':'+h;
 if(size!==lastSize){lastSize=size;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const pilot=!frame.motion;
 pilotUniform.value=pilot?1:0;
 for(const obj of pilotObjects)obj.visible=pilot;
 equipment.group.visible=!pilot;
 activationUniform.value=Number.isFinite(frame.activation)?frame.activation:1;
 const muscles=frame.muscles||['Bröst','Triceps','Axlar'],muscleKey=muscles.join('|');
 if(lastMuscles!==muscleKey){lastMuscles=muscleKey;muscleUniform.value.fill(0);muscles.forEach((name,i)=>{const n=muscleNames.indexOf(name);if(n>=0)muscleUniform.value[n]=i===0?2:1;});}
 let activeCamera=camera;
 if(pilot){
  pose(frame.t);
  const alternate=frame.viewIndex===1;
  // pilotDistance (default 1) moves the camera back along its line of sight.
  const d=frame.pilotDistance||1;camera.position.set(-.08+((alternate?-1.95:1.9)+.08)*d,.83+(1.5-.83)*d,.12+((alternate?2.65:2.75)-.12)*d);camera.lookAt(-.08,.83,.12);
 }else{
  pressContraction.value=frame.t;
  api.pose=applyMotion({motion:frame.motion,rest,bones,body,hands,shoes,t:frame.t,chestActive:muscles.includes('Bröst')});
  api.equipment=equipment.update(frame.motion.shapes);
  frameCamera(ortho,frame.view,frame.bounds,w/h);activeCamera=ortho;
 }
 activeCamera.updateMatrixWorld();
 tissueLight.value.copy(tissueLightWorld).transformDirection(activeCamera.matrixWorldInverse);
 renderer.render(scene,activeCamera);
 api.performance={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,programs:renderer.info.programs.length,canvases:host.querySelectorAll('canvas').length};
 stage.classList.add('exercise-3d-ready','silver-press-ready');
 const status=document.getElementById('model-status');if(status)status.hidden=true;
 return true;
};
