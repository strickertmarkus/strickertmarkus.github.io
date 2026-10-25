/** Reusable GPU buffers for the guide's rod/ball/polygon equipment primitives. */
import * as THREE from 'three';
export function createEquipment(scene){
 const group=new THREE.Group();scene.add(group);
 const material=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.48,roughness:.38});
 const rods=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,12),material,1024);
 const balls=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),material,128);
 for(const mesh of [rods,balls]){mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);mesh.count=0;}
 const geometry=new THREE.BufferGeometry(),capacity=16384;
 for(const name of ['position','normal','color'])geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(capacity*3),3).setUsage(THREE.DynamicDrawUsage));
 const surfaces=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,metalness:.22,roughness:.52}));
 surfaces.frustumCulled=false;surfaces.castShadow=true;surfaces.receiveShadow=true;group.add(surfaces);
 const dummy=new THREE.Object3D(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),y=new THREE.Vector3(0,1,0);
 const colors=new Map(),color=value=>{if(!colors.has(value))colors.set(value,new THREE.Color(value));return colors.get(value);};
 return {group,update(shapes){
  let nr=0,nb=0,nv=0;
  for(const shape of shapes){
   if(shape.person||shape.ground)continue;
   const col=color(shape.color),points=shape.points;
   if(shape.type==='rod'){
    if(nr>=1024)throw new Error('Equipment rod capacity exceeded');
    a.fromArray(points[0]);b.fromArray(points[1]).sub(a);const length=b.length();
    dummy.position.copy(a).addScaledVector(b,.5);dummy.quaternion.setFromUnitVectors(y,b.normalize());dummy.scale.set(shape.r,length,shape.r);dummy.updateMatrix();
    rods.setMatrixAt(nr,dummy.matrix);rods.setColorAt(nr++,col);
   }else if(shape.type==='ball'){
    if(nb>=128)throw new Error('Equipment ball capacity exceeded');
    dummy.position.fromArray(points[0]);dummy.quaternion.identity();dummy.scale.setScalar(shape.r);dummy.updateMatrix();balls.setMatrixAt(nb,dummy.matrix);balls.setColorAt(nb++,col);
   }else if(shape.type==='poly'){
    a.fromArray(points[0]);b.fromArray(points[1]).sub(a);c.fromArray(points[2]).sub(a);normal.crossVectors(b,c).normalize();
    for(let i=1;i<points.length-1;i++)for(const point of [points[0],points[i],points[i+1]]){
     if(nv>=capacity)throw new Error('Equipment surface capacity exceeded');
     geometry.attributes.position.setXYZ(nv,...point);geometry.attributes.normal.setXYZ(nv,normal.x,normal.y,normal.z);geometry.attributes.color.setXYZ(nv,col.r,col.g,col.b);nv++;
    }
   }
  }
  rods.count=nr;balls.count=nb;
  for(const mesh of [rods,balls]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  geometry.setDrawRange(0,nv);for(const attribute of Object.values(geometry.attributes))attribute.needsUpdate=true;
  return {rods:nr,balls:nb,triangles:nv/3};
 }};
}
