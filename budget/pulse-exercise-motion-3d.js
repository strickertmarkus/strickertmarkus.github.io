/**
 * Markus/Maja: automated 3D exercise figure using the SAME Z-Anatomy body
 * and muscle mesh as the retained atlas. The existing 54 procedural joint
 * tracks drive approximate pose deformation. The original instructional
 * motion drawing is a safe fallback when 3D cannot load.
 * Z-Anatomy CC BY-SA 4.0; BodyParts3D CC BY-SA 2.1 JP.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
const root='https://cdn.jsdelivr.net/gh/SeemaBansal1/3d-human-body-anatomy@28912432581accd7a1c62129d55f0e9758221d48/web/public/models/';
const host=document.getElementById('exercise-3d'),stage=document.getElementById('studio-stage'),svg=document.getElementById('exercise-figure');
const api={ready:false,loading:false,failed:false,update:()=>false};window.PulseExercise3D=api;
const trainingRules=[
 ['Bröst',/pectoralis major/i],['Rygg',/latissimus dorsi|trapezius|rhomboid/i],
 ['Axlar',/deltoid/i],['Biceps',/biceps brachii|brachialis muscle/i],
 ['Triceps',/triceps brachii/i],['Mage',/rectus abdominis|external abdominal oblique/i],
 ['Säte',/gluteus maximus|gluteus medius/i],['Framsida lår',/rectus femoris|vastus/i],
 ['Baksida lår',/biceps femoris|semitendinosus|semimembranosus/i],
 ['Vader',/gastrocnemius|soleus/i]
];
const rest=[
 [[0,.94,0],[0,1.46,0]],[[0,1.46,0],[0,1.74,0]],
 [[-.19,1.46,0],[-.29,1.13,.01]],[[-.29,1.13,.01],[-.35,.76,.03]],
 [[.19,1.46,0],[.29,1.13,.01]],[[.29,1.13,.01],[.35,.76,.03]],
 [[-.12,.94,0],[-.15,.51,.01]],[[-.15,.51,.01],[-.16,.08,.02]],
 [[.12,.94,0],[.15,.51,.01]],[[.15,.51,.01],[.16,.08,.02]],
 [[0,.82,0],[0,1.0,0]]
];
const boneMatrices=rest.map(()=>new THREE.Matrix4()),v3=p=>new THREE.Vector3(...p);
const lim=(x,a,b)=>THREE.MathUtils.clamp((x-a)/(b-a),0,1);
function segmentDistance(x,y,z,a,b){
 const ap=new THREE.Vector3(x-a[0],y-a[1],z-a[2]),dir=v3(b).sub(v3(a));
 const f=THREE.MathUtils.clamp(ap.dot(dir)/Math.max(.000001,dir.lengthSq()),0,1);
 return ap.addScaledVector(dir,-f).length();
}
function nearestWeights(x,y,z){
 const left=x<0,arm=left?2:4,leg=left?6:8;
 if(y>1.57&&Math.abs(x)<.18)return [1,1,0,0];
 const armDistance=Math.min(segmentDistance(x,y,z,...rest[arm]),segmentDistance(x,y,z,...rest[arm+1]));
 if(y>.68&&Math.abs(x)>.19&&armDistance<Math.max(0,Math.abs(x)-.12)+.085){
   const lower=lim(1.13-y,-.055,.055);return [arm,1-lower,arm+1,lower];
 }
 if(y<.91&&Math.abs(x)>.067){
   const lower=lim(.53-y,-.075,.075);return [leg,1-lower,leg+1,lower];
 }
 if(y<1.0){const torso=lim(y,.82,1.04);return [10,1-torso,0,torso]}
 return [0,1,0,0];
}
function decorate(geo){
 const p=geo.getAttribute('position'),ids=new Float32Array(p.count*4),weights=new Float32Array(p.count*4);
 for(let i=0;i<p.count;i++){
   const [a,wa,b,wb]=nearestWeights(p.getX(i),p.getY(i),p.getZ(i)),k=i*4;
   ids[k]=a;ids[k+1]=b;weights[k]=wa;weights[k+1]=wb;
 }
 geo.setAttribute('aPoseBones',new THREE.BufferAttribute(ids,4));
 geo.setAttribute('aPoseWeights',new THREE.BufferAttribute(weights,4));
}
const vert=[
 'precision highp float;','in vec4 aPoseBones;','in vec4 aPoseWeights;',
 'uniform mat4 uPose[11];','out vec3 nView;','out vec3 pView;',
 'void main(){','int a=int(aPoseBones.x+0.5);','int b=int(aPoseBones.y+0.5);',
 'vec4 pos=(uPose[a]*vec4(position,1.0))*aPoseWeights.x+(uPose[b]*vec4(position,1.0))*aPoseWeights.y;',
 'vec3 norm=mat3(uPose[a])*normal*aPoseWeights.x+mat3(uPose[b])*normal*aPoseWeights.y;',
 'vec4 eye=modelViewMatrix*pos;','nView=normalize(mat3(modelViewMatrix)*norm);',
 'pView=normalize(-eye.xyz);','gl_Position=projectionMatrix*eye;','}'
].join('\n');
const shaderBody=[
 'precision highp float;','in vec3 nView;','in vec3 pView;','out vec4 pc;',
 'void main(){','vec3 n=normalize(nView),v=normalize(pView);',
 'float light=0.5+0.5*dot(n,normalize(vec3(-.34,.73,.6)));',
 'float rim=pow(1.0-clamp(abs(dot(n,v)),0.0,1.0),1.5);',
 'float form=smoothstep(.08,.94,light);',
 'vec3 col=mix(vec3(.43,.56,.71),vec3(.96,.98,1.),.23+.73*form);',
 'col=mix(col,vec3(1.),rim*.78);',
 'pc=vec4(col,min(.87,.43+.37*rim));','}'
].join('\n');
const shaderRed=[
 'precision highp float;','in vec3 nView;','in vec3 pView;','out vec4 pc;',
 'void main(){','vec3 n=normalize(nView),v=normalize(pView);',
 'float light=.5+.5*dot(n,normalize(vec3(-.28,.71,.62)));',
 'float rim=pow(1.-clamp(abs(dot(n,v)),0.,1.),1.8);',
 'vec3 red=mix(vec3(.52,.07,.12),vec3(1.,.40,.32),.26+.72*light);',
 'red+=vec3(.15,.025,.02)*rim;','pc=vec4(red,.96);','}'
].join('\n');
const poseUniform={value:boneMatrices};
const material=(fragment,highlight)=>new THREE.ShaderMaterial({
 vertexShader:vert,fragmentShader:fragment,glslVersion:THREE.GLSL3,
 uniforms:{uPose:poseUniform},transparent:true,depthWrite:!highlight,
 depthTest:!highlight,side:THREE.FrontSide,toneMapped:false
});
const skinMat=material(shaderBody,false),redMat=material(shaderRed,true);
function updateBones(j){
 const hip=v3(j.hip),shoulder=v3(j.shoulders[0]).add(v3(j.shoulders[1])).multiplyScalar(.5);
 const hips=v3(j.hips[0]).add(v3(j.hips[1])).multiplyScalar(.5);
 const up=shoulder.clone().sub(hip).normalize(),head=shoulder.clone().addScaledVector(up,.28);
 const endHip=hips.clone().lerp(shoulder,.16);
 const positions=[
  [hip,shoulder],[shoulder,head],
  [v3(j.shoulders[0]),v3(j.elbows[0])],[v3(j.elbows[0]),v3(j.hands[0])],
  [v3(j.shoulders[1]),v3(j.elbows[1])],[v3(j.elbows[1]),v3(j.hands[1])],
  [v3(j.hips[0]),v3(j.knees[0])],[v3(j.knees[0]),v3(j.feet[0])],
  [v3(j.hips[1]),v3(j.knees[1])],[v3(j.knees[1]),v3(j.feet[1])],
  [hips,endHip]
 ];
 for(let i=0;i<rest.length;i++){
   const a=v3(rest[i][0]),b=v3(rest[i][1]),[toA,toB]=positions[i];
   const from=b.sub(a).normalize(),to=toB.clone().sub(toA).normalize();
   const rotation=new THREE.Quaternion().setFromUnitVectors(from,to.lengthSq()>.01?to:from);
   boneMatrices[i].compose(toA,rotation,new THREE.Vector3(1,1,1))
     .multiply(new THREE.Matrix4().makeTranslation(-a.x,-a.y,-a.z));
 }
}
function setCamera(cam,view,frame){
 const yaw=view.yaw*Math.PI/180,pitch=view.pitch*Math.PI/180;
 const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 cam.position.set(s*cp*7,sp*7,c*cp*7);
 cam.up.set(-s*sp,cp,-c*sp);
 cam.lookAt(0,0,0);
 cam.left=-frame.x/frame.scale;cam.right=(420-frame.x)/frame.scale;
 cam.top=frame.y/frame.scale;cam.bottom=(frame.y-340)/frame.scale;
 cam.updateProjectionMatrix();
}
function supports(){try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}}
if(host&&stage&&svg&&supports()){
 let renderer,world,camera,meshes=[],loaded=false,started=false,lastIndex=-1,lastWidth=0,lastHeight=0,lastFrame;
 async function initialize(){
   if(started)return;started=true;api.loading=true;
   try{
     renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
     renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
     const draco=new DRACOLoader();draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/');
     const loader=new GLTFLoader();loader.setDRACOLoader(draco);
     const [skin,muscle]=await Promise.all([
       loader.loadAsync(root+'skin.glb'),loader.loadAsync(root+'muscles.glb')
     ]);
     const bounds=new THREE.Box3().setFromObject(skin.scene);
     if(bounds.isEmpty())throw new Error('Empty anatomy model');
     const center=bounds.getCenter(new THREE.Vector3()),scale=1.77/bounds.getSize(new THREE.Vector3()).y;
     if(!Number.isFinite(scale))throw new Error('Invalid anatomy scale');
     world=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,40);
     function add(src,mat,highlight){
       src.updateMatrixWorld(true);
       src.traverse(obj=>{
         if(!obj.isMesh)return;
         const ud=Object.keys(obj.userData||{}).length?obj.userData:obj.parent?.userData||{};
         const name=String(ud.zname||obj.name||''),group=highlight?trainingRules.find(([k,re])=>re.test(name))?.[0]:null;
         if(highlight&&!group)return;
         if(!highlight&&/hairs? of|eyebrow|eyelash|cornea|iris|sclera|nail plate|teeth|tooth|auricular|labial/i.test(name))return;
         const geometry=obj.geometry.clone();
         geometry.applyMatrix4(obj.matrixWorld);
         geometry.translate(-center.x,-center.y,-center.z);
         geometry.scale(scale,scale,scale);geometry.translate(0,.885,0);
         decorate(geometry);
         const mesh=new THREE.Mesh(geometry,mat);
         mesh.frustumCulled=false;mesh.renderOrder=highlight?3:1;
         mesh.userData.trainingGroup=group;
         if(highlight)mesh.visible=false;
         world.add(mesh);meshes.push(mesh);
       });
     }
     add(skin.scene,skinMat,false);add(muscle.scene,redMat,true);
     if(meshes.length<5)throw new Error('Missing anatomy geometry');
     host.appendChild(renderer.domElement);
     renderer.domElement.setAttribute('aria-hidden','true');
     renderer.domElement.style.cssText='width:100%;height:100%;display:block';
     loaded=true;api.ready=true;api.loading=false;
     if(lastFrame)api.update(lastFrame);
   }catch(err){
     console.warn('Animated 3D model unavailable; using existing motion SVG',err);
     api.ready=false;api.loading=false;api.failed=true;
     stage.classList.remove('exercise-3d-ready');
     if(renderer){renderer.dispose();renderer.domElement?.remove();}
     svg.removeAttribute('aria-hidden');
   }
 }
 api.update=frame=>{
   lastFrame=frame;
   if(!loaded){if(!api.loading&&!api.failed)initialize();return false;}
   const box=svg.getBoundingClientRect(),w=Math.round(box.width),h=Math.round(box.height);
   if(w<20||h<20)return false;
   if(w!==lastWidth||h!==lastHeight){
     lastWidth=w;lastHeight=h;renderer.setSize(w,h,false);
     host.style.width=w+'px';host.style.height=h+'px';
   }
   updateBones(frame.motion.joints);
   setCamera(camera,frame.view,frame.bounds);
   if(frame.index!==lastIndex){
     const trained=new Set(frame.muscles);
     for(const mesh of meshes)if(mesh.userData.trainingGroup)mesh.visible=trained.has(mesh.userData.trainingGroup);
     lastIndex=frame.index;
   }
   renderer.render(world,camera);
   stage.classList.add('exercise-3d-ready');
   svg.setAttribute('aria-hidden','true');
   return true;
 };
}
