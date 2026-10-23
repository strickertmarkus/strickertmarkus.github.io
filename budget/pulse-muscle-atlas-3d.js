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
      renderer.toneMappingExposure = 1.02;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      target.append(renderer.domElement);
      renderer.domElement.setAttribute('aria-label', 'Roterbar anatomisk 3D-modell. Dra för att rotera, tryck på en muskel för att välja.');
      renderer.domElement.style.touchAction = 'none';

      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xd8e9f5, 0.85));
      scene.add(new THREE.HemisphereLight(0xdfe8f8, 0x273344, 2.35));
      const key = new THREE.DirectionalLight(0xf6e9ec, 2.9); key.position.set(3, 4, 5); scene.add(key);
      const fill = new THREE.DirectionalLight(0xaec8eb, 1.0); fill.position.set(-4, 1, 3); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xee8eae, 1.8); rim.position.set(-3, 2, -4); scene.add(rim);

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

      // A single smooth, dim translucent skin shell hides medical muscle detail.
      const skinMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x9ba9bc, transparent: true, opacity: 0.28,
        roughness: 0.46, metalness: 0.09, side: THREE.DoubleSide,
        depthWrite: false, clearcoat: 0.18, clearcoatRoughness: 0.58
      });
      const headMaterial = skinMaterial.clone();
      headMaterial.color.setHex(0x64758d);
      headMaterial.opacity = 0.48;
      let skinMeshes = 0;
      skin.traverse(mesh => {
        if (!mesh.isMesh) return;
        skinMeshes++;
        const meta = Object.keys(mesh.userData || {}).length ? mesh.userData : mesh.parent?.userData || {};
        const name = String(meta.zname || mesh.name || '');
        mesh.material = /head|face|eyeball|eye|nose|ear|mouth|neck|skull/i.test(name) ? headMaterial : skinMaterial;
        mesh.renderOrder = 3;
        mesh.frustumCulled = false;
      });
      if (!skinMeshes) throw new Error('3D-kroppens yta saknas');
      // Unselected anatomical structures are almost invisible.
      const quietMaterial = new THREE.MeshStandardMaterial({
        color: 0x556779, transparent: true, opacity: 0.12,
        roughness: 0.77, metalness: 0, side: THREE.DoubleSide, depthWrite: false
      });
      const previewMaterial = new THREE.MeshStandardMaterial({
        color: 0x94646e, emissive: 0x5b2838, emissiveIntensity: 0.18,
        transparent: true, opacity: 0.58, roughness: 0.63,
        metalness: 0, side: THREE.DoubleSide, depthWrite: false
      });
      const activeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffb599, emissive: 0xed6558, emissiveIntensity: 0.83,
        transparent: true, opacity: 0.98, roughness: 0.38,
        metalness: 0, side: THREE.DoubleSide, depthWrite: false
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
        mesh.renderOrder = primary ? 2 : 0;
        mesh.frustumCulled = false;
        meshes.push(mesh);
        if (primary) {
          if (!groups.has(group)) groups.set(group, []);
          groups.get(group).push(mesh);
        }
      });
      if (!meshes.length || !groups.size) throw new Error('Inga muskelgrupper kunde identifieras');
      let currentGroup = null;
      let activeMeshCount = 0;
      function highlight(muscle) {
        const next = muscle && groups.has(muscle) ? muscle : null;
        if (currentGroup === next) return;
        if (currentGroup) groups.get(currentGroup).forEach(m => m.material = previewMaterial);
        currentGroup = next;
        if (next) groups.get(next).forEach(m => m.material = activeMaterial);
        activeMeshCount = next ? groups.get(next).length : 0;
        target.dataset.muscle = currentGroup || '';
      }
      highlight('Bröst');

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