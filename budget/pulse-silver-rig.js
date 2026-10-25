/** Adapt the shared joint tracks to the mannequin's rest-space skeleton. */
import * as THREE from 'three';
const v=p=>new THREE.Vector3(...p),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
export function applyMotion({motion,rest,bones,body,hands,shoes,t,chestActive}){
 const j=motion.joints,up=v(motion.axis),front=v(motion.frontNormal),right=new THREE.Vector3().crossVectors(up,front).normalize();
 const basis=new THREE.Matrix4().makeBasis(right,up,front),torso=new THREE.Quaternion().setFromRotationMatrix(basis);
 const order=right.x<0?[1,0]:[0,1],hip=v(j.hip),shoulder=v(j.shoulders[0]).add(v(j.shoulders[1])).multiplyScalar(.5);
 const headUp=motion.cfg.kind==='gluteBridge'?v([0,0,-1]):up;
 const segments=[[hip,shoulder],[shoulder,shoulder.clone().addScaledVector(headUp,.30)]];
 for(const i of order)segments.push([v(j.shoulders[i]),v(j.elbows[i])],[v(j.elbows[i]),v(j.hands[i])]);
 for(const i of order)segments.push([v(j.hips[i]),v(j.knees[i])],[v(j.knees[i]),v(j.feet[i])]);
 segments.push([hip.clone().addScaledVector(up,-.08),hip.clone().addScaledVector(up,.08)]);
 for(let i=0;i<bones.length;i++){
  const from=v(rest[i][1]).sub(v(rest[i][0])),[a,b]=segments[i],to=b.clone().sub(a),length=from.length();
  // The elbow bends relative to its upper arm. Independent world-space swings
  // become ambiguous near 180 degrees and can flip the forearm inside out.
  const base=i===3||i===5?bones[i-1].quaternion:
   i===1?new THREE.Quaternion().setFromUnitVectors(Y,headUp):torso;
  const rotated=from.clone().applyQuaternion(base).normalize();
  bones[i].position.copy(a);bones[i].quaternion.setFromUnitVectors(rotated,to.clone().normalize()).multiply(base);
  // Uniform scaling keeps each weighted joint endpoint aligned with its equipment target.
  bones[i].scale.setScalar(i===10?1:to.length()/length);
 }
 body.morphTargetInfluences[0]=chestActive?1-t:0;body.morphTargetInfluences[1]=chestActive?t:0;
 for(let k=0;k<2;k++){
  const i=order[k],hand=hands[k],shoe=shoes[k];
  const forearmBone=3+k*2,restAxis=v(rest[forearmBone][1]).sub(v(rest[forearmBone][0])).normalize();
  hand.quaternion.copy(bones[forearmBone].quaternion)
   .multiply(new THREE.Quaternion().setFromUnitVectors(Y,restAxis))
   .multiply(new THREE.Quaternion().setFromAxisAngle(Y,Math.PI/2));
  hand.position.fromArray(j.hands[i]);
  const soles=v(motion.soles).normalize();shoe.quaternion.setFromUnitVectors(Z,soles);
  shoe.position.fromArray(j.feet[i]).add(v([0,-.073,0]).applyQuaternion(shoe.quaternion));
 }
 return {t,rotations:[...bones.slice(2,6),...hands].map(b=>b.quaternion.toArray()),wrists:order.map(i=>j.hands[i]),elbows:order.map(i=>j.elbows[i]),shoulders:order.map(i=>j.shoulders[i]),grips:hands.map(h=>h.position.toArray()),kind:motion.cfg.kind};
}
export function frameCamera(camera,view,bounds,aspect){
 const yaw=view.yaw*Math.PI/180,pitch=view.pitch*Math.PI/180,c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 camera.position.set(s*cp*7,sp*7,c*cp*7);camera.up.set(-s*sp,cp,-c*sp);camera.lookAt(0,0,0);
 const cx=(210-bounds.x)/bounds.scale,cy=(bounds.y-170)/bounds.scale;
 let width=420/bounds.scale,height=340/bounds.scale;
 if(aspect>420/340)width=height*aspect;else height=width/aspect;
 camera.left=cx-width/2;camera.right=cx+width/2;camera.top=cy+height/2;camera.bottom=cy-height/2;camera.updateProjectionMatrix();
}
