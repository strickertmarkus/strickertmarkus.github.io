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
const DECODER_URL = 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/';
const target = document.getElementById('atlas-webgl');
const visual = document.querySelector('.atlas-visual');
const guide = document.getElementById('guide-page');
const status = document.getElementById('atlas-3d-status');

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
    statusText('Laddar anatomisk 3D-modell…');

    let renderer;
    let controls;
    let observer;
    let draco;
    try {
      renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      target.append(renderer.domElement);
      renderer.domElement.setAttribute('aria-label', 'Roterbar anatomisk 3D-modell. Dra för att rotera, tryck på en muskel för att välja.');
      renderer.domElement.style.touchAction = 'none';

      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xf2d9e6, 1.15));
      const hemi = new THREE.HemisphereLight(0xd9e4f2, 0x241523, 2.0);
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffd6d0, 3.15); key.position.set(3.5, 4, 5); scene.add(key);
      const fill = new THREE.DirectionalLight(0xa7d5e5, 1.45); fill.position.set(-4, 1.8, 2); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xeaa0c1, 2.4); rim.position.set(-2.5, 1, -4); scene.add(rim);

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
      const gltf = await loader.loadAsync(MODEL_URL);
      const body = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(body);
      if (bounds.isEmpty()) throw new Error('3D-modellen saknar geometri');
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      body.position.sub(center);
      scene.add(body);
      const height = Math.max(0.5, size.y);
      camera.position.set(0, height * 0.03, height * 2.16);
      controls.target.set(0, 0, 0);
      controls.minDistance = height * 1.05;
      controls.maxDistance = height * 3.35;
      camera.near = Math.max(0.001, height / 500);
      camera.far = height * 15;
      camera.updateProjectionMatrix();

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xb77a86, roughness: 0.69, metalness: 0, side: THREE.DoubleSide
      });
      const tendonMat = new THREE.MeshStandardMaterial({
        color: 0x998d92, roughness: 0.79, metalness: 0, side: THREE.DoubleSide
      });
      const activeMat = new THREE.MeshStandardMaterial({
        color: 0xffb7a3, emissive: 0xd35e70, emissiveIntensity: 0.37,
        roughness: 0.42, metalness: 0, side: THREE.DoubleSide
      });
      const meshes = [];
      const groups = new Map();
      body.traverse(object => {
        if (!object.isMesh) return;
        const ud = Object.keys(object.userData || {}).length ? object.userData : object.parent?.userData || {};
        const marker = String(ud.zmat || object.name || '').toLowerCase();
        const base = /tendon|aponeurosis|fascia|ligament/.test(marker) ? tendonMat : bodyMat;
        object.material = base;
        object.userData.pulseBaseMaterial = base;
        const name = muscleGroup(object);
        object.userData.pulseMuscleGroup = name;
        if (name) {
          if (!groups.has(name)) groups.set(name, []);
          groups.get(name).push(object);
        }
        meshes.push(object);
      });
      if (!meshes.length) throw new Error('Inga muskler hittades');
      let currentGroup = null;
      function highlight(muscle) {
        if (currentGroup === muscle) return;
        if (currentGroup) (groups.get(currentGroup) || []).forEach(m => m.material = m.userData.pulseBaseMaterial);
        currentGroup = muscle && groups.has(muscle) ? muscle : null;
        if (currentGroup) groups.get(currentGroup).forEach(m => m.material = activeMat);
        target.dataset.muscle = currentGroup || '';
      }

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
        const hits = raycaster.intersectObjects(meshes, false);
        const muscle = hits.find(hit => hit.object.userData.pulseMuscleGroup)?.object.userData.pulseMuscleGroup;
        if (!muscle) {
          statusText('Välj en markerbar muskel eller använd listan nedan.');
          return;
        }
        highlight(muscle);
        document.dispatchEvent(new CustomEvent('pulse:atlas-select', {detail: {muscle, source: '3d'}}));
      });

      let azimuthTarget = null;
      function setView(view) {
        azimuthTarget = view === 'back' ? Math.PI : 0;
      }
      controls.addEventListener('start', () => {azimuthTarget = null;});
      document.addEventListener('pulse:atlas-sync', event => {
        const details = event.detail || {};
        if (details.view) setView(details.view);
        if (details.group && details.group !== 'Alla') highlight(details.group);
      });
      document.querySelectorAll('[data-atlas-muscle]').forEach(() => {});
      document.getElementById('atlas-list')?.addEventListener('pointerover', event => {
        const button = event.target.closest('[data-atlas-muscle]');
        if (button) highlight(button.dataset.atlasMuscle);
      });
      const frontButton = document.getElementById('atlas-front');
      const backButton = document.getElementById('atlas-back');
      frontButton?.addEventListener('click', () => setView('front'));
      backButton?.addEventListener('click', () => setView('back'));
      if (backButton?.getAttribute('aria-pressed') === 'true') setView('back');

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