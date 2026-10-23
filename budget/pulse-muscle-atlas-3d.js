/**
 * Pulse Field · muscle atlas 3D (Markus/Maja only).
 * Model: Z-Anatomy / BodyParts3D; compressed for the web by SeemaBansal1.
 * Model assets remain under CC BY-SA 4.0 / CC BY-SA 2.1 JP respectively.
 * This viewer keeps the SVG atlas as a functional no-WebGL/network fallback.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/SeemaBansal1/3d-human-body-anatomy@28912432581accd7a1c62129d55f0e9758221d48/web/public/models/muscles.glb';
const SKIN_URL = 'https://cdn.jsdelivr.net/gh/SeemaBansal1/3d-human-body-anatomy@28912432581accd7a1c62129d55f0e9758221d48/web/public/models/skin.glb';
const DECODER_URL = 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/';
const target = document.getElementById('atlas-webgl');
const visual = document.querySelector('.atlas-visual');
const guide = document.getElementById('guide-page');
const status = document.getElementById('atlas-3d-status');

// Only large, superficial, trainable regions receive vivid accents.
const SURFACE_RULES = {
  'Bröst': /pectoralis major/i,
  'Rygg': /latissimus dorsi|trapezius|rhomboid/i,
  'Axlar': /deltoid/i,
  'Biceps': /biceps brachii|brachialis muscle/i,
  'Triceps': /triceps brachii/i,
  'Mage': /rectus abdominis|external abdominal oblique/i,
  'Säte': /gluteus maximus|gluteus medius/i,
  'Framsida lår': /rectus femoris|vastus/i,
  'Baksida lår': /biceps femoris|semitendinosus|semimembranosus/i,
  'Vader': /gastrocnemius|soleus/i
};
const BACK_GROUPS = new Set(['Rygg','Triceps','Säte','Baksida lår','Vader']);
const LOWER_GROUPS = new Set(['Säte','Framsida lår','Baksida lår','Vader']);
const GROUP_RULES = [
  ['Baksida lår', /biceps femoris|semitendinosus|semimembranosus/i],
  ['Biceps', /biceps brachii|brachialis muscle|brachioradialis/i],
  ['Triceps', /triceps brachii|anconeus/i],
  ['Bröst', /pectoralis|subclavius muscle/i],
  ['Axlar', /deltoid|supraspinatus|infraspinatus|teres minor|subscapularis/i],
  ['Rygg', /latissimus|trapezius|rhomboid|erector spinae|longissimus|iliocostalis|multifidus|teres major|levator scapulae/i],
  ['Mage', /rectus abdominis|oblique muscle|transversus abdominis|pyramidalis|quadratus lumborum/i],
  ['Säte', /gluteus|piriformis|gemellus|obturator internus|quadratus femoris|tensor fasciae latae/i],
  ['Framsida lår', /rectus femoris|vastus|sartorius|adductor (?:longus|magnus|brevis)|gracilis muscle|pectineus|iliacus|psoas major/i],
  ['Vader', /gastrocnemius|soleus|tibialis|fibularis|peroneus/i]
];

function muscleGroup(mesh) {
  const meta = mesh.userData && Object.keys(mesh.userData).length ? mesh.userData : mesh.parent?.userData || {};
  const name = (meta.zname || mesh.name || '').replace(/_/g, ' ');
  return GROUP_RULES.find(([, re]) => re.test(name))?.[0] || null;
}
function statusText(value) {
  if (status) status.textContent = value;
}
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

if (target && visual && guide && supportsWebGL()) {
  let started = false;
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) start();
      }, {rootMargin: '230px'})
    : null;
  if (io) io.observe(visual);
  else start();

  async function start() {
    if (started) return;
    started = true;
    io?.disconnect();
    statusText('Förbereder 3D-modellen…');

    let renderer;
    let controls;
    let observer;
    let draco;
    try {
      renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.88;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      target.append(renderer.domElement);
      renderer.domElement.setAttribute('aria-label', 'Roterbar anatomisk 3D-modell. Dra för att rotera, tryck på en muskel för att välja.');
      renderer.domElement.style.touchAction = 'none';

      const scene = new THREE.Scene();
      // Studio-style lighting: cool sculpted shell, warm rim, no clinical white wash.
      scene.add(new THREE.AmbientLight(0xdceaf5, 0.58));
      scene.add(new THREE.HemisphereLight(0xf3f6ff, 0x283342, 1.42));
      const key = new THREE.DirectionalLight(0xd8e5f1, 1.85);
      key.position.set(3, 5, 4); scene.add(key);
      const fill = new THREE.DirectionalLight(0x7794c0, 0.55);
      fill.position.set(-4, 1, 3); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xd55e78, 1.1);
      rim.position.set(-3, 2, -4); scene.add(rim);

      const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 50);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.rotateSpeed = 0.72;
      controls.zoomSpeed = 0.65;
      controls.minPolarAngle = 0.42;
      controls.maxPolarAngle = Math.PI - 0.38;

      draco = new DRACOLoader();
      draco.setDecoderPath(DECODER_URL);
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);
      const [gltf, skinGltf] = await Promise.all([
        loader.loadAsync(MODEL_URL),
        loader.loadAsync(SKIN_URL)
      ]);
      const body = gltf.scene;
      const skin = skinGltf.scene;
      const bounds = new THREE.Box3().setFromObject(skin);
      if (bounds.isEmpty()) throw new Error('3D-modellen saknar kroppsyta');
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      if (!(size.y > 0)) throw new Error('Ogiltiga mått för kropp');
      const height = size.y;
      // Both layers are exported in the same coordinate system: apply the same offset.
      body.position.sub(center);
      skin.position.sub(center);
      scene.add(body);
      scene.add(skin);
      camera.position.set(0, height * 0.08, height * 1.52);
      controls.target.set(0, height * 0.13, 0);
      controls.minDistance = height * 0.8;
      controls.maxDistance = height * 3.1;
      camera.near = Math.max(0.001, height / 700);
      camera.far = height * 12;
      camera.updateProjectionMatrix();

      // Silk-pearl body material. Lighting is calculated from the surface
      // normal so every limb gets gentle form-shading without dark blotches.
      // Depth-writing hides overlapping internal skin surfaces that previously
      // appeared as a network of medical wireframe lines.
      const skinMaterial = new THREE.ShaderMaterial({
        transparent: true, depthWrite: true, depthTest: true,
        side: THREE.FrontSide, toneMapped: false,
        uniforms: {
          uBodyAlpha: {value: 0.64},
          uHeadStart: {value: height * 0.32},
          uHeadEnd: {value: height * 0.405},
          uHeadRadius: {value: height * 0.104},
          uHeadSoftness: {value: 0.0}
        },
        vertexShader: [
          'varying vec3 vPulseNormal;',
          'varying vec3 vPulseView;',
          'varying vec3 vPulseWorld;',
          'void main(){',
          '  vec4 vpos = modelViewMatrix * vec4(position,1.0);',
          '  vPulseNormal = normalize(normalMatrix * normal);',
          '  vPulseView = normalize(-vpos.xyz);',
          '  vPulseWorld = (modelMatrix * vec4(position,1.0)).xyz;',
          '  gl_Position = projectionMatrix * vpos;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'precision highp float;',
          'uniform float uBodyAlpha;',
          'uniform float uHeadSoftness;',
          'uniform float uHeadStart;',
          'uniform float uHeadEnd;',
          'uniform float uHeadRadius;',
          'varying vec3 vPulseNormal;',
          'varying vec3 vPulseView;',
          'varying vec3 vPulseWorld;',
          'void main(){',
          '  vec3 n = normalize(vPulseNormal);',
          '  float facing = clamp(abs(dot(n,normalize(vPulseView))),0.0,1.0);',
          '  float rim = pow(1.0-facing,2.0);',
          '  float form = 0.5 + 0.5 * dot(n,normalize(vec3(-0.37,0.72,0.62)));',
          '  float soft = smoothstep(0.0,1.0,form);',
          '  vec3 pearl = mix(vec3(0.51,0.63,0.75), vec3(0.94,0.97,1.0), 0.22+0.71*soft);',
          '  pearl = mix(pearl,vec3(0.985,0.99,1.0),0.75*rim);',
          '  float alpha = min(0.93,uBodyAlpha + 0.22*rim);',
          '  float headZone = smoothstep(uHeadStart,uHeadEnd,vPulseWorld.y);',
          '  float centerZone = 1.0-smoothstep(uHeadRadius*0.60,uHeadRadius*1.15,abs(vPulseWorld.x));',
          '  alpha *= (1.0 - 0.95*headZone*centerZone);',
          '  alpha *= (1.0-uHeadSoftness);',
          '  if(alpha<0.015) discard;',
          '  gl_FragColor = vec4(pearl,alpha);',
          '}'
        ].join('\n')
      });
      // The anatomical face is softened, not rendered as a detailed specimen.
      const faceMaterial = skinMaterial.clone();
      faceMaterial.uniforms.uHeadSoftness.value = 0.91;
      let skinMeshes = 0;
      skin.traverse(mesh => {
        if (!mesh.isMesh) return;
        const meta = Object.keys(mesh.userData || {}).length ? mesh.userData : mesh.parent?.userData || {};
        const name = String(meta.zname || mesh.name || '').toLowerCase();
        // Tiny details are specifically what made the earlier model creepy.
        if (/hairs? of|scalp hair|eyelash|eyebrow|eyeball|eye lens|eyelid|nail plate|teeth|tooth|tongue|auricular|labial|mandibular|malar|nasal region|frontal region/.test(name)) {
          mesh.visible = false;
          return;
        }
        skinMeshes++;
        mesh.material = /\b(?:head|face|nose|ear|mouth|lip|scalp|neck)\b/.test(name) ? faceMaterial : skinMaterial;
        mesh.renderOrder = 1;
        mesh.frustumCulled = false;
        // One coherent outer surface, no overlapping transparent back faces.
        mesh.material.depthWrite = true;
      });
      if (!skinMeshes) throw new Error('3D-kroppens yta saknas');

      // A simplified faceless head and neck replace the anatomical head.
      const portraitMaterial = skinMaterial.clone();
      portraitMaterial.uniforms.uHeadStart.value = height * 10;
      portraitMaterial.uniforms.uHeadEnd.value = height * 11;
      portraitMaterial.uniforms.uHeadSoftness.value = 0;
      const head = new THREE.Mesh(new THREE.SphereGeometry(1,36,28),portraitMaterial);
      head.scale.set(height*0.054,height*0.071,height*0.053);
      head.position.set(0,height*0.422,height*0.006);
      head.renderOrder = 2;
      scene.add(head);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(height*0.026,height*0.033,height*0.075,28), portraitMaterial);
      neck.position.set(0,height*0.335,height*0.003);
      neck.renderOrder = 2;
      scene.add(neck);

      // All unselected muscles are hidden — only the selected major group is red.
      const quietMaterial = new THREE.MeshBasicMaterial({
        color: 0x36465a, transparent: true, opacity: 0.0,
        side: THREE.FrontSide, depthWrite: false
      });
      const previewMaterial = new THREE.MeshBasicMaterial({
        color: 0x465365, transparent: true, opacity: 0.0,
        side: THREE.FrontSide, depthWrite: false
      });
      // The active group is intentionally painted over the pale shell.
      // A soft red material gives anatomical volume without harsh cut-out edges.
      const activeMaterial = new THREE.MeshStandardMaterial({
        color: 0xec655b, emissive: 0xc44d48, emissiveIntensity: 0.54,
        transparent: true, opacity: 0.92, roughness: 0.70,
        metalness: 0, side: THREE.FrontSide,
        depthTest: false, depthWrite: false
      });
      const meshes = [];
      const groups = new Map();
      body.traverse(mesh => {
        if (!mesh.isMesh) return;
        const meta = Object.keys(mesh.userData || {}).length ? mesh.userData : mesh.parent?.userData || {};
        const name = String(meta.zname || mesh.name || '').replace(/_/g, ' ');
        const group = muscleGroup(mesh);
        const primary = !!(group && SURFACE_RULES[group]?.test(name));
        mesh.userData.pulseMuscleGroup = group;
        mesh.userData.pulseSurface = primary;
        mesh.userData.pulseBaseMaterial = primary ? previewMaterial : quietMaterial;
        mesh.material = mesh.userData.pulseBaseMaterial;
        mesh.renderOrder = primary ? 3 : 0;
        mesh.frustumCulled = false;
        mesh.visible = primary;
        meshes.push(mesh);
        if (primary) {
          if (!groups.has(group)) groups.set(group, []);
          groups.get(group).push(mesh);
        }
      });
      if (!meshes.length || !groups.size) throw new Error('Inga muskelgrupper kunde identifieras');
      let currentGroup = null;
      function highlight(muscle) {
        const next = muscle && groups.has(muscle) ? muscle : null;
        if (currentGroup === next) return;
        if (currentGroup) groups.get(currentGroup).forEach(m => m.material = previewMaterial);
        currentGroup = next;
        if (next) groups.get(next).forEach(m => m.material = activeMaterial);
        target.dataset.muscle = currentGroup || '';
      }
      highlight('Bröst');
      // White shell remains visible on torso, arms and legs; red marks only the selected major muscle group.

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerStart = null;
      renderer.domElement.addEventListener('pointerdown', e => {
        if (e.isPrimary) pointerStart = {x: e.clientX, y: e.clientY};
      });
      renderer.domElement.addEventListener('pointercancel', () => pointerStart = null);
      renderer.domElement.addEventListener('pointerup', e => {
        if (!pointerStart || !e.isPrimary) return;
        const moved = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
        pointerStart = null;
        if (moved > 9) return; // intentional rotation, not a muscle selection
        const rect = renderer.domElement.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((e.clientY - rect.top) / rect.height) * 2);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(meshes.filter(m => m.userData.pulseSurface), false);
        const muscle = hits.find(hit => hit.object.userData.pulseMuscleGroup)?.object.userData.pulseMuscleGroup;
        if (!muscle) return;
        highlight(muscle);
        document.dispatchEvent(new CustomEvent('pulse:atlas-select', {detail: {muscle, source: '3d'}}));
      });

      let azimuthTarget = null;
      let desiredDistance = height * 1.52;
      let desiredTargetY = height * 0.13;
      let framingActive = false;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function focusOnMuscle(muscle, view = null) {
        if (view === 'front' || view === 'back') {
          azimuthTarget = view === 'back' ? Math.PI : 0;
        } else if (muscle === 'Axlar') {
          azimuthTarget = 0.28;
        } else if (muscle) {
          azimuthTarget = BACK_GROUPS.has(muscle) ? Math.PI : 0;
        }
        if (muscle && LOWER_GROUPS.has(muscle)) {
          desiredDistance = height * 1.52;
          desiredTargetY = -height * 0.17;
        } else {
          desiredDistance = height * 1.52;
          desiredTargetY = height * 0.13;
        }
        framingActive = true;
        if (reducedMotion) {
          controls.target.y = desiredTargetY;
          const direction = camera.position.clone().sub(controls.target).normalize();
          camera.position.copy(controls.target).addScaledVector(direction, desiredDistance);
          framingActive = false;
        }
      }
      controls.addEventListener('start', () => {
        azimuthTarget = null;
        framingActive = false;
      });
      document.addEventListener('pulse:atlas-sync', event => {
        const details = event.detail || {};
        if (details.group !== undefined) highlight(details.group);
        if (details.focus) focusOnMuscle(details.group, details.view);
        else if (details.view) azimuthTarget = details.view === 'back' ? Math.PI : 0;
      });
      document.getElementById('atlas-front')?.addEventListener('click', () => focusOnMuscle(null, 'front'));
      document.getElementById('atlas-back')?.addEventListener('click', () => focusOnMuscle(null, 'back'));
      if (document.getElementById('atlas-back')?.getAttribute('aria-pressed') === 'true') focusOnMuscle('Bröst','back');

      let visible = true;
      if (typeof IntersectionObserver !== 'undefined') {
        const watcher = new IntersectionObserver(entries => {
          visible = entries.some(e => e.isIntersecting);
        }, {threshold: 0});
        watcher.observe(visual);
      }
      function resize() {
        const rect = target.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height, false);
      }
      observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
      observer?.observe(target);
      window.addEventListener('resize', resize);
      visual.classList.add('atlas-3d-ready');
      target.hidden = false;
      resize();
      statusText('');
      document.dispatchEvent(new CustomEvent('pulse:atlas-ready'));
      let lastFrame = 0;
      const tick = time => {
        requestAnimationFrame(tick);
        if (document.hidden || guide.hidden || !visible) return;
        if (time - lastFrame < 28) return; // cap around 30fps on mobile
        lastFrame = time;
        if (azimuthTarget !== null) {
          const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
          const delta = Math.atan2(Math.sin(azimuthTarget - spherical.theta), Math.cos(azimuthTarget - spherical.theta));
          if (Math.abs(delta) < 0.005) azimuthTarget = null;
          else {
            spherical.theta += delta * 0.105;
            camera.position.setFromSpherical(spherical).add(controls.target);
          }
        }
        if (framingActive) {
          const blend = reducedMotion ? 1 : 0.14;
          const priorTarget = controls.target.clone();
          controls.target.y += (desiredTargetY - controls.target.y) * blend;
          const rel = camera.position.clone().sub(priorTarget);
          const r = rel.length();
          rel.multiplyScalar((r + (desiredDistance - r) * blend) / Math.max(r, 0.001));
          camera.position.copy(controls.target).add(rel);
          if (Math.abs(controls.target.y - desiredTargetY) < 0.003 * height && Math.abs(r - desiredDistance) < 0.003 * height) framingActive = false;
        }
        controls.update();
        renderer.render(scene, camera);
      };
      requestAnimationFrame(tick);
    } catch (error) {
      console.warn('Pulse 3D atlas unavailable; using SVG fallback', error);
      observer?.disconnect();
      controls?.dispose();
      renderer?.dispose();
      draco?.dispose();
      if (renderer?.domElement?.parentElement === target) renderer.domElement.remove();
      visual.classList.remove('atlas-3d-ready');
      statusText('3D kunde inte visas här. Den interaktiva 2D-atlasen fungerar fortfarande.');
    }
  }
}