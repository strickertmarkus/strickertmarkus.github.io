/** Original rigged mannequin + chest-press apparatus. One renderer, driven by the guide clock. */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const host=document.getElementById('exercise-silver-3d'),stage=document.getElementById('studio-stage');
const api={ready:false,loading:false,failed:false,update:()=>false};
window.PulseSilverPress=api;
const v=p=>new THREE.Vector3(...p),Y=new THREE.Vector3(0,1,0);
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
  const base=new URL('./assets/silver-mannequin-v1/',import.meta.url);
  const [metaResponse,binaryResponse]=await Promise.all([fetch(new URL('body.json',base)),fetch(new URL('body.bin',base))]);
  if(!metaResponse.ok||!binaryResponse.ok)throw new Error('Mannequin asset unavailable');
  const meta=await metaResponse.json(),buffer=await binaryResponse.arrayBuffer(),geo=new THREE.BufferGeometry();rest=meta.rest;
  for(const [name,a] of Object.entries(meta.attributes)){
   const T=name==='skinIndex'?Uint16Array:name==='index'?Uint32Array:Float32Array;
   const attribute=new THREE.BufferAttribute(new T(buffer,a.offset,a.length),a.itemSize);
   if(name==='index')geo.setIndex(attribute);else geo.setAttribute(name,attribute);
  }
  geo.computeVertexNormals();
  const mat=materials.skin.clone();mat.vertexColors=true;
  // A translucent centre and a denser silhouette keep the moving body readable.
  // Rest-space fibres stay attached to the pectorals throughout the animation.
  mat.transparent=true;mat.opacity=.64;mat.roughness=.38;mat.metalness=.16;
  mat.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>',
    '#include <common>\nvarying vec3 vAnatomyPosition;');
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nvAnatomyPosition = position;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
    '#include <common>\nvarying vec3 vAnatomyPosition;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', `
    #include <color_fragment>
    float clothingMask = 1.0 - smoothstep(0.18, 0.65, max(vColor.r, max(vColor.g, vColor.b)));
    float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    float rim = pow(1.0 - facing, 1.8);
    vec3 p = vec3(abs(vAnatomyPosition.x), vAnatomyPosition.yz);
    // Broad pectoral fan: sternum to upper-arm insertion, with a rising lower edge.
    float u = clamp(p.x / 0.245, 0.0, 1.0);
    float lowerChest = 1.265 + 0.105 * u * u;
    float upperChest = 1.465 - 0.018 * u;
    float chest = smoothstep(0.006, 0.026, p.x)
      * (1.0 - smoothstep(0.215, 0.265, p.x))
      * smoothstep(lowerChest - 0.008, lowerChest + 0.065, p.y)
      * (1.0 - smoothstep(upperChest - 0.050, upperChest + 0.018, p.y))
      * smoothstep(0.045, 0.105, p.z);
    // Front deltoid and back of the upper arm, defined in the unposed mesh.
    float shoulderShape = length((p.xy - vec2(0.255, 1.425)) / vec2(0.12, 0.14));
    float shoulder = (1.0 - smoothstep(0.72, 1.15, shoulderShape)) * smoothstep(-0.055, 0.025, p.z);
    vec3 armStart = vec3(0.225, 1.43, 0.0);
    vec3 armAxis = vec3(0.155, -0.29, 0.0);
    float armT = clamp(dot(p - armStart, armAxis) / dot(armAxis, armAxis), 0.0, 1.0);
    float armDistance = length(p - armStart - armT * armAxis);
    float lateralArm = p.x - (armStart.x + armT * armAxis.x);
    float backAndOuterArm = max(1.0 - smoothstep(-0.035, 0.025, p.z), smoothstep(-0.015, 0.045, lateralArm));
    float triceps = (1.0 - smoothstep(0.105, 0.145, armDistance))
      * smoothstep(0.10, 0.27, armT) * (1.0 - smoothstep(0.78, 0.96, armT))
      * backAndOuterArm;
    float secondary = max(shoulder * 0.76, triceps * 0.80);
    float muscleMask = max(chest * 0.76, secondary) * (1.0 - clothingMask);
    float fan = atan(p.y - 1.43, 0.265 - p.x);
    float fibrePhase = mix(armT * 52.0 + p.z * 55.0, fan * 48.0, chest);
    float fibreDetail = 1.0 - smoothstep(0.3, 1.6, fwidth(fibrePhase));
    float fibres = sin(fibrePhase) * fibreDetail;
    float warmth = smoothstep(1.27, 1.46, p.y);
    float belly = exp(-pow((p.y - 1.365) / 0.065, 2.0)) * (1.0 - u * 0.45);
    float tissueWarmth = max(warmth * 0.55 + belly * 0.45, secondary * (0.60 + 0.25 * sin(armT * 3.14159)));
    // Give the pectorals the same softly shaded tissue response as the shoulders.
    float chestWarmth = 0.76 * (0.60 + 0.25 * sin(u * 3.14159));
    tissueWarmth = mix(tissueWarmth, chestWarmth, chest);
    vec3 muscleColor = mix(vec3(0.38, 0.025, 0.018), vec3(1.0, 0.22, 0.12), tissueWarmth);
    muscleColor *= 0.80 + 0.26 * fibres;
    float silk = pow(max(0.0, fibres), 8.0) * 0.22;
    muscleColor = mix(muscleColor, vec3(1.0, 0.70, 0.48), silk);
    // Ignore the old small baked pectoral patches; retain only the shorts colour.
    vec3 pearl = mix(vec3(0.86, 0.90, 0.95), diffuseColor.rgb, clothingMask);
    diffuseColor.rgb = mix(pearl, muscleColor, muscleMask);
    float tissueAlpha = 0.56 + 0.16 * belly * (1.0 - chest * 0.65) + 0.12 * rim;
    diffuseColor.a = mix(0.68 + 0.23 * rim, tissueAlpha, muscleMask);
    diffuseColor.a = mix(diffuseColor.a, 1.0, clothingMask);

   `);
  };
  mat.customProgramCacheKey=()=> 'silver-soft-pectoral-v6';
  body=new THREE.SkinnedMesh(geo,mat);body.frustumCulled=false;body.castShadow=true;body.receiveShadow=true;
  bones=rest.map(([a])=>{const b=new THREE.Bone();b.position.copy(v(a));body.add(b);return b;});
  body.bind(new THREE.Skeleton(bones));scene.add(body);
  buildMachine();buildHands();
  host.replaceChildren(renderer.domElement);renderer.domElement.style.cssText='display:block;width:100%;height:100%';
  renderer.domElement.setAttribute('aria-hidden','true');
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();api.ready=false;api.failed=true;stage.classList.remove('silver-press-ready','exercise-3d-ready');});
  api.ready=true;api.loading=false;api.model={vertices:meta.vertices,triangles:meta.triangles};
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
 const w=Math.round(stage.clientWidth),h=Math.round(stage.clientHeight);
 if(w<20||h<20)return false;
 const size=w+':'+h;
 if(size!==lastSize){lastSize=size;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 pose(frame.t);
 // Both views retain the entire apparatus and both hands, without changing zoom during a rep.
 const alternate=frame.viewIndex===1;
 camera.position.set(alternate?-1.95:1.9,1.5,alternate?2.65:2.75);camera.lookAt(-.08,.83,.12);
 renderer.render(scene,camera);
 stage.classList.add('exercise-3d-ready','silver-press-ready');
 return true;
};
