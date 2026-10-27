/** Shared approved pearl / fibre tissue material. Primary=2, secondary=1, inactive=0. */
export const muscleNames=['Bröst','Rygg','Axlar','Biceps','Triceps','Mage','Säte','Framsida lår','Baksida lår','Vader'];
/* activationUniform (optional, default 1) scales the muscle glow, so a preview can let it follow the lift. */
export function createTissueMaterial(skin,{pressContraction,tissueLight,muscleUniform,pilotUniform,activationUniform={value:1}}){
  const mat=skin.clone();mat.vertexColors=true;
  // A translucent centre and a denser silhouette keep the moving body readable.
  // Rest-space fibres stay attached to the pectorals throughout the animation.
  mat.transparent=true;mat.opacity=.64;mat.roughness=.38;mat.metalness=.16;
  mat.onBeforeCompile=shader=>{
   shader.uniforms.uPressContraction=pressContraction;
   shader.uniforms.uMuscles=muscleUniform;
   shader.uniforms.uPilot=pilotUniform;
   shader.uniforms.uActivation=activationUniform;
   shader.uniforms.uTissueLight=tissueLight;
   shader.vertexShader=shader.vertexShader.replace('#include <common>',
    '#include <common>\nvarying vec3 vAnatomyPosition;');
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nvAnatomyPosition = position;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
    '#include <common>\nvarying vec3 vAnatomyPosition;\nuniform float uPressContraction;\nuniform vec3 uTissueLight;\nuniform float uMuscles[10];\nuniform float uPilot;\nuniform float uActivation;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', `
    #include <color_fragment>
    float clothingMask = 1.0 - smoothstep(0.18, 0.65, max(vColor.r, max(vColor.g, vColor.b)));
    float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    float rim = pow(1.0 - facing, 1.8);
    vec3 p = vec3(abs(vAnatomyPosition.x), vAnatomyPosition.yz);
    float shortsExtension=smoothstep(0.755,0.765,p.y)*(1.0-smoothstep(1.005,1.015,p.y))
      *(1.0-smoothstep(0.23,0.26,p.x));
    clothingMask=max(clothingMask,shortsExtension);
    // Broad pectoral fan: sternum to upper-arm insertion, with a rising lower edge.
    float u = clamp(p.x / 0.245, 0.0, 1.0);
    float lowerChest = 1.252 + 0.060 * u * u;
    float upperChest = 1.505 - 0.025 * u;
    float chest = smoothstep(0.001, 0.013, p.x)
      * (1.0 - smoothstep(0.235, 0.285, p.x))
      * smoothstep(lowerChest - 0.016, lowerChest + 0.025, p.y)
      * (1.0 - smoothstep(upperChest - 0.025, upperChest + 0.012, p.y))
      * smoothstep(0.005, 0.055, p.z);
    // Front deltoid and back of the upper arm, defined in the unposed mesh.
    float shoulderShape = length((p.xy - vec2(0.255, 1.425)) / vec2(0.12, 0.14));
    float shoulder = (1.0 - smoothstep(0.72, 1.15, shoulderShape)) * smoothstep(-0.055, 0.025, p.z);
    vec3 armStart = vec3(0.225, 1.43, 0.0);
    vec3 armAxis = vec3(0.155, -0.29, 0.0);
    float armT = clamp(dot(p - armStart, armAxis) / dot(armAxis, armAxis), 0.0, 1.0);
    float armDistance = length(p - armStart - armT * armAxis);
    // End the deltoid at its cap; do not carry its front highlight down the biceps.
    shoulder *= 1.0 - smoothstep(0.20, 0.37, armT);
    // Posterior half only. The former outer-arm union also painted the front.
    float posteriorArm = 1.0 - smoothstep(-0.045, 0.0, p.z);
    float triceps = (1.0 - smoothstep(0.105, 0.145, armDistance))
      * smoothstep(0.22, 0.36, armT) * (1.0 - smoothstep(0.78, 0.96, armT))
      * posteriorArm;
    float secondary = max(shoulder, triceps) * 0.85;
    float muscleMask = max(chest * 0.99, secondary) * (1.0 - clothingMask);
    float fan = atan(p.y - 1.43, 0.265 - p.x);
    // Fixed rest-space fibres stretch with the mesh, never slide over the skin.
    float armPhase = armT * 52.0 + p.z * 55.0;
    float chestPhase = fan * 60.0 + 0.55 * sin(fan * 7.0 + u * 3.0);
    // Filter each field before mixing: mask gradients must not erase the fibres.
    float armFibres = sin(armPhase) * (1.0 - smoothstep(1.5, 3.1, fwidth(armPhase)));
    float chestFibres = sin(chestPhase) * (1.0 - smoothstep(1.5, 3.1, fwidth(chestPhase)));
    float fibres = mix(armFibres, chestFibres, chest);
    float filament = pow(max(0.0, chestFibres), 4.0);
    // One red tissue palette for primary and secondary muscles. Shape and light,
    // rather than an even white wash, provide the sense of volume.
    vec3 tissueShadow = vec3(0.16, 0.002, 0.006);
    vec3 tissueRed = vec3(0.70, 0.012, 0.018);
    vec3 tissueFibre = vec3(1.0, 0.24, 0.13);
    float armFilament = pow(max(0.0, armFibres), 4.0);
    float secondaryVolume = max(shoulder * exp(-2.0 * shoulderShape * shoulderShape),
      triceps * pow(sin(armT * 3.14159), 2.0));
    float armVolume = 0.22 + 0.48 * secondaryVolume + 0.08 * armFibres;
    vec3 muscleColor = mix(tissueShadow, tissueRed, armVolume);
    muscleColor = mix(muscleColor, tissueFibre, armFilament * 0.20);
    float chestVolume = exp(-pow((p.x - 0.115) / 0.115, 2.0)
      - pow((p.y - 1.385) / 0.090, 2.0));
    float chestLight = clamp(0.15 + 0.65 * chestVolume
      + 0.10 * fibres + 0.04 * uPressContraction, 0.0, 1.0);
    vec3 chestColor = mix(tissueShadow, tissueRed, chestLight);
    chestColor = mix(chestColor, tissueFibre, filament * 0.24);
    // A localized reflection follows the skinned normals, view and key light.
    vec3 halfLight = normalize(uTissueLight + normalize(vViewPosition));
    float reflection = pow(max(0.0, dot(normalize(vNormal), halfLight)), 18.0);
    float lightFocus = exp(-pow((p.x - 0.10) / 0.065, 2.0)
      - pow((p.y - 1.405) / 0.050, 2.0));
    float chestSpot = lightFocus * (0.20 + 0.80 * reflection);
    float glassEdge = 4.0 * chest * (1.0 - chest);
    chestColor = mix(chestColor, vec3(0.90, 0.92, 0.98),
      clamp(0.025 * glassEdge + 0.08 * rim, 0.0, 0.12));
    muscleColor = mix(muscleColor, chestColor, smoothstep(0.0, 0.55, chest));
    // Ignore the old small baked pectoral patches; retain only the shorts colour.
    vec3 pearl = mix(vec3(0.86, 0.90, 0.95), mix(diffuseColor.rgb,vec3(0.055,0.085,0.13),shortsExtension), clothingMask);
    diffuseColor.rgb = mix(pearl, muscleColor, muscleMask);
    // A middle density keeps secondary tissue present but quieter than the chest.
    float tissueAlpha = clamp(0.66 + 0.08 * secondaryVolume
      + 0.03 * armFilament + 0.05 * rim, 0.0, 0.81);
    diffuseColor.a = mix(0.68 + 0.23 * rim, tissueAlpha, muscleMask);
    // Density varies across bundles and gently increases as the muscle contracts.
    float chestAlpha = clamp(0.74 + 0.10 * chestVolume + 0.04 * filament
      + 0.03 * uPressContraction + 0.04 * rim, 0.0, 0.90);
    diffuseColor.a = mix(diffuseColor.a, chestAlpha, chest);
    diffuseColor.a = mix(diffuseColor.a, 1.0, clothingMask);

    vec3 generalGlow=vec3(0.0);
    if(uPilot < 0.5){
     // Rest-space anatomical regions; all follow the same skinning as the body.
     float frontFace=smoothstep(0.005,0.055,p.z);
     float backFace=1.0-smoothstep(-0.055,-0.005,p.z);
     float deltoid=(1.0-smoothstep(0.72,1.15,shoulderShape))*(1.0-smoothstep(0.20,0.37,armT));
     float biceps=(1.0-smoothstep(0.085,0.12,armDistance))*frontFace
       *smoothstep(0.25,0.40,armT)*(1.0-smoothstep(0.79,0.94,armT));
     float back=(1.0-smoothstep(0.80,1.15,length((p.xy-vec2(0.095,1.30))/vec2(0.145,0.23))))*backFace;
     float absMask=(1.0-smoothstep(0.07,0.14,p.x))*smoothstep(1.015,1.065,p.y)
       *(1.0-smoothstep(1.24,1.29,p.y))*frontFace;
     float glutes=(1.0-smoothstep(0.72,1.15,length((p.xy-vec2(0.105,0.93))/vec2(0.12,0.135))))*backFace;
     float thighT=clamp((0.94-p.y)/0.43,0.0,1.0);
     float thigh=(1.0-smoothstep(0.075,0.12,abs(p.x-mix(0.12,0.13,thighT))))
       *smoothstep(0.53,0.60,p.y)*(1.0-smoothstep(0.88,0.94,p.y));
     float calf=(1.0-smoothstep(0.05,0.095,abs(p.x-0.14)))
       *smoothstep(0.15,0.22,p.y)*(1.0-smoothstep(0.44,0.51,p.y))*backFace;
     float masks[10];
     masks[0]=chest;masks[1]=back;masks[2]=deltoid;masks[3]=biceps;masks[4]=triceps;
     masks[5]=absMask;masks[6]=glutes;masks[7]=thigh*frontFace*(1.0-clothingMask);masks[8]=thigh*backFace*(1.0-clothingMask);masks[9]=calf;
     float region=0.0,primary=0.0,phaseValue=0.0,volume=0.0;
     for(int i=0;i<10;i++){
      float strength=masks[i]*min(uMuscles[i],1.0);
      if(strength>region){
       region=strength;primary=step(1.5,uMuscles[i]);
       phaseValue=i==0?chestPhase:i==2||i==3||i==4?armPhase:
         i==1?atan(p.y-1.46,0.23-p.x)*52.0:i==5?p.y*190.0:
         i==6?atan(p.y-0.98,p.x+0.02)*40.0:p.x*310.0+p.y*13.0;
       volume=i==0?chestVolume:i==1?exp(-pow((p.y-1.35)/0.17,2.0)):
         i==2?exp(-2.0*shoulderShape*shoulderShape):i==3||i==4?max(0.25,secondaryVolume):i==5?0.65:
         i==6?exp(-pow((p.y-0.94)/0.10,2.0)):
         i==9?exp(-pow((p.y-0.36)/0.12,2.0)):sin(thighT*3.14159);
      }
     }
     float strand=sin(phaseValue)*(1.0-smoothstep(1.5,3.1,fwidth(phaseValue)));
     float silk=pow(max(0.0,strand),4.0);
     vec3 red=mix(tissueShadow,tissueRed,clamp(0.20+0.56*volume+0.08*strand,0.0,1.0));
     red=mix(red,tissueFibre,silk*mix(0.18,0.24,primary));
     red=mix(red,vec3(0.90,0.92,0.98),rim*0.07);
     muscleMask=region*mix(0.85,0.99,primary);
     diffuseColor.rgb=mix(pearl,red,muscleMask);
     float alpha=mix(0.66,0.74,primary)+volume*0.08+silk*0.03+rim*0.04;
     diffuseColor.a=mix(mix(0.68+0.23*rim,1.0,clothingMask),clamp(alpha,0.0,0.90),muscleMask);
     generalGlow=region*(tissueRed*volume*mix(0.075,0.18,primary)
       +vec3(1.0,0.42,0.20)*volume*reflection*mix(0.13,0.70,primary)
       +tissueFibre*silk*mix(0.05,0.12,primary));
     generalGlow*=uActivation;
    }


   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', `
    #include <emissivemap_fragment>
    if(uPilot > 0.5){
    // Keep the valleys dark. Concentrate glow on the upper muscle belly.
    totalEmissiveRadiance += uActivation * chest * (
      vec3(0.65, 0.008, 0.012) * chestVolume * 0.18
      + vec3(1.0, 0.42, 0.20) * chestSpot * 0.95
      + tissueFibre * filament * 0.12);
    totalEmissiveRadiance += uActivation * secondary * (1.0 - chest)
      * (tissueRed * secondaryVolume * 0.075
      + vec3(1.0, 0.42, 0.20) * secondaryVolume * reflection * 0.13
      + tissueFibre * armFilament * 0.05);
    }else{totalEmissiveRadiance += generalGlow;}
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
    '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.30, muscleMask);');
   shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>',
    '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.04, muscleMask);');
  };
  mat.customProgramCacheKey=()=> 'silver-all-muscles-v18';
 return mat;
}
