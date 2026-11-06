import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildBase } from './base.js';
import { buildStore } from './store.js';
import { buildStreet } from './street.js';
import { buildWeather } from './weather.js';
import { Intro } from './intro.js';
import { clamp, ease, makeNightEnvironment } from './core.js';

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance',
  alpha: false,
  stencil: false,
});
renderer.setClearColor(0x04070e, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const environment = makeNightEnvironment();
scene.environment = environment;
scene.environmentIntensity = 0.85;
const camera = new THREE.PerspectiveCamera(31, window.innerWidth / window.innerHeight, 0.1, 500);
const target = new THREE.Vector3(-1.0, 1.18, -0.3);
const viewDirection = new THREE.Vector3(0.559, 0.258, 0.786).normalize();

const BASE_FIT_POINTS = [];
for (const x of [-14, 14]) {
  for (const z of [-14, 14]) {
    for (const y of [-1.24, 0]) BASE_FIT_POINTS.push(new THREE.Vector3(x, y, z));
  }
}
function fitDistanceForAspect(aspect) {
  const probe = new THREE.PerspectiveCamera(31, aspect, 0.1, 200);
  const margin = 0.925;
  for (let d = 38; d <= 130; d += 0.25) {
    probe.position.copy(target).addScaledVector(viewDirection, d);
    probe.lookAt(target);
    probe.updateMatrixWorld();
    probe.updateProjectionMatrix();
    let fits = true;
    for (const p of BASE_FIT_POINTS) {
      const q = p.clone().project(probe);
      if (Math.abs(q.x) > margin || Math.abs(q.y) > margin) {
        fits = false;
        break;
      }
    }
    if (fits) return d;
  }
  return 96;
}

let cameraFinal = target.clone().addScaledVector(
  viewDirection,
  fitDistanceForAspect(window.innerWidth / window.innerHeight) * 0.93
);
const cameraIntro = target.clone().addScaledVector(
  viewDirection,
  69 + (window.innerWidth / window.innerHeight < 1.2 ? 9 : 0)
);
cameraIntro.y += 5.2;
camera.position.copy(cameraIntro);
camera.lookAt(target);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(target);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.7;
controls.panSpeed = 0.5;
controls.enablePan = false;
controls.minDistance = 6.5;
controls.maxDistance = 98;
controls.minPolarAngle = 0.14;
controls.maxPolarAngle = 1.495;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.28;
controls.update();

// ---------------------------------------------------------------------------
// lighting
// ---------------------------------------------------------------------------
scene.add(new THREE.HemisphereLight(0x718db8, 0x0b1017, 0.48));
const keyLight = new THREE.DirectionalLight(0xaec7f5, 1.02);
keyLight.position.set(16, 25, 18);
keyLight.target.position.set(-1.5, 0, -2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -24;
keyLight.shadow.camera.right = 24;
keyLight.shadow.camera.top = 25;
keyLight.shadow.camera.bottom = -22;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 75;
keyLight.shadow.bias = -0.00055;
keyLight.shadow.normalBias = 0.026;
scene.add(keyLight);
scene.add(keyLight.target);
const rimLight = new THREE.DirectionalLight(0x607fca, 0.22);
rimLight.position.set(-17, 12, -18);
scene.add(rimLight);
const warmFill = new THREE.DirectionalLight(0xffb37a, 0.08);
warmFill.position.set(-9, 5, 20);
scene.add(warmFill);

// ---------------------------------------------------------------------------
// build diorama
// ---------------------------------------------------------------------------
const intro = new Intro();
const baseData = buildBase(scene, intro);
const storeData = buildStore(scene, intro);
const streetData = buildStreet(scene, intro);
const weatherData = buildWeather(scene, intro);

// ---------------------------------------------------------------------------
// post processing
// ---------------------------------------------------------------------------
const renderTarget = new THREE.WebGLRenderTarget(
  Math.floor(window.innerWidth * renderer.getPixelRatio()),
  Math.floor(window.innerHeight * renderer.getPixelRatio()),
  {
    type: THREE.HalfFloatType,
    samples: 2,
    colorSpace: THREE.LinearSRGBColorSpace,
  }
);
const composer = new EffectComposer(renderer, renderTarget);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.26,
  0.42,
  0.86
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uFade: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uFade;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 p = vUv - 0.5;
      p.x *= uResolution.x / max(uResolution.y, 1.0);
      float d = length(p);
      float vignette = smoothstep(0.95, 0.26, d);
      vec3 c = color.rgb * mix(0.68, 1.04, vignette);
      // very gentle teal shadows / warm highlights
      float luma = dot(c, vec3(0.299, 0.587, 0.114));
      c += vec3(-0.008, 0.002, 0.012) * smoothstep(0.36, 0.0, luma);
      c += vec3(0.011, 0.004, -0.006) * smoothstep(0.48, 1.0, luma);
      float gLuma = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(gLuma), c, 1.09);
      c = (c - 0.5) * 1.04 + 0.5;
      float grain = hash(vUv * uResolution * 0.77 + uTime * 7.3) - 0.5;
      c += grain * 0.013;
      gl_FragColor = vec4(max(c, 0.0) * uFade, color.a);
    }
  `,
};
const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
vignettePass.renderToScreen = true;
composer.addPass(vignettePass);

// ---------------------------------------------------------------------------
// cinematic + interaction
// ---------------------------------------------------------------------------
const cameraStartTime = 0.28;
const cameraDuration = 8.55;
let cinematic = true;
let cameraInterrupted = false;
let introDone = false;
let lastInteraction = -100;
let isDragging = false;

const dom = renderer.domElement;
dom.style.cursor = 'grab';

function beginManualView() {
  if (!cinematic) return;
  cinematic = false;
  cameraInterrupted = true;
  controls.enabled = true;
  lastInteraction = clock.getElapsedTime();
}

dom.addEventListener(
  'pointerdown',
  (e) => {
    if (!cinematic) {
      dom.style.cursor = 'grabbing';
      isDragging = true;
    }
    beginManualView();
  },
  true
);
window.addEventListener('pointerup', () => {
  isDragging = false;
  if (!cinematic) dom.style.cursor = 'grab';
});
dom.addEventListener(
  'wheel',
  () => {
    beginManualView();
  },
  { passive: true, capture: true }
);
dom.addEventListener(
  'touchstart',
  () => {
    beginManualView();
  },
  { passive: true, capture: true }
);

controls.addEventListener('start', () => {
  controls.autoRotate = false;
  lastInteraction = clock.getElapsedTime();
  dom.style.cursor = 'grabbing';
});
controls.addEventListener('end', () => {
  controls.autoRotate = false;
  lastInteraction = clock.getElapsedTime();
  dom.style.cursor = 'grab';
});

function finishCinematic(time) {
  if (!cinematic) return;
  camera.position.copy(cameraFinal);
  camera.lookAt(target);
  controls.target.copy(target);
  controls.enabled = true;
  controls.update();
  cinematic = false;
  introDone = true;
  lastInteraction = time;
}

function applyView(azimuth, polar, distance) {
  cinematic = false;
  introDone = true;
  controls.enabled = true;
  controls.autoRotate = false;
  const spherical = new THREE.Spherical(distance, polar, azimuth);
  const v = new THREE.Vector3().setFromSpherical(spherical);
  camera.position.copy(target).add(v);
  camera.lookAt(target);
  controls.target.copy(target);
  controls.update();
}

function finishAll(options = {}) {
  intro.finish();
  camera.position.copy(cameraFinal);
  camera.lookAt(target);
  controls.target.copy(target);
  controls.enabled = !options.lock;
  controls.autoRotate = false;
  cinematic = false;
  introDone = true;
  lastInteraction = 0;
  vignettePass.uniforms.uFade.value = 1;
  controls.update();
  weatherData.uniforms.uOpacity.value = 0.9;
  weatherData.rain.visible = true;
}

// Warm up shaders while the first frame is still dark; this prevents a large
// stall halfway through the assembly animation.
{
  const hidden = [];
  for (const entry of intro.entries) {
    if (entry.object) {
      hidden.push([entry.object, entry.object.visible]);
      entry.object.visible = true;
    }
  }
  try {
    renderer.compile(scene, camera);
  } catch (e) {
    console.warn('shader precompile skipped', e);
  }
  for (const [obj, vis] of hidden) obj.visible = vis;
}

// ---------------------------------------------------------------------------
// resize
// ---------------------------------------------------------------------------
function computeFinalCamera(keepCurrent = false) {
  const aspect = window.innerWidth / window.innerHeight;
  const distance = fitDistanceForAspect(aspect);
  const dir = keepCurrent
    ? new THREE.Vector3().subVectors(camera.position, target).normalize()
    : viewDirection.clone();
  cameraFinal = target.clone().addScaledVector(dir, distance * 0.93);
  return cameraFinal;
}
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  vignettePass.uniforms.uResolution.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  computeFinalCamera();
  if (cinematic) {
    cameraIntro.copy(target).addScaledVector(viewDirection, fitDistanceForAspect(camera.aspect) + 15);
    cameraIntro.y += 5.2;
  }
  if (!cinematic && introDone) {
    // retain the viewer's current framing on resize
    const dist = camera.position.distanceTo(target);
    const clamped = clamp(dist, controls.minDistance, controls.maxDistance);
    camera.position.copy(target).add(new THREE.Vector3().subVectors(camera.position, target).normalize().multiplyScalar(clamped));
  }
}
window.addEventListener('resize', resize);

// ---------------------------------------------------------------------------
// animation
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let frameCount = 0;
let paused = new URLSearchParams(window.location.search).has('qa');
let shadowsFrozen = false;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (paused) {
    requestAnimationFrame(animate);
    return;
  }
  const time = clock.getElapsedTime();
  const introTime = Math.max(0, time - 0.18);

  if (intro.finished) intro.updateAt(intro.duration + 0.2);
  else intro.updateAt(introTime);
  weatherData.update(time, dt);

  if (intro.finished && !shadowsFrozen) {
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    shadowsFrozen = true;
  }

  if (cinematic) {
    const raw = clamp((time - cameraStartTime) / cameraDuration, 0, 1);
    const p = ease.inOutCubic(raw);
    camera.position.lerpVectors(cameraIntro, cameraFinal, p);
    camera.lookAt(target);
    if (raw >= 1) finishCinematic(time);
  } else {
    controls.update();
  }

  vignettePass.uniforms.uTime.value = time;
  composer.render();
  frameCount++;

  if (isDragging) dom.style.cursor = 'grabbing';
  requestAnimationFrame(animate);
}

// initial framing / first paint
resize();
composer.render();
requestAnimationFrame(animate);

// A tiny debug surface, useful for reproducing stills and for QA. It is not
// rendered anywhere in the scene and introduces no UI.
function poseAt(t) {
  paused = true;
  intro.updateAt(t);
  weatherData.update(t, 1 / 60);
  const end = cameraStartTime + cameraDuration;
  if (t >= end) {
    camera.position.copy(cameraFinal);
  } else if (t <= cameraStartTime) {
    camera.position.copy(cameraIntro);
  } else {
    const p = ease.inOutCubic(clamp((t - cameraStartTime) / cameraDuration, 0, 1));
    camera.position.lerpVectors(cameraIntro, cameraFinal, p);
  }
  camera.lookAt(target);
  camera.updateMatrixWorld();
  vignettePass.uniforms.uTime.value = t;
  composer.render();
}

window.__diorama = {
  THREE,
  scene,
  camera,
  renderer,
  controls,
  composer,
  intro,
  base: baseData,
  store: storeData,
  street: streetData,
  weather: weatherData,
  finish: finishAll,
  view: applyView,
  pose: poseAt,
  pause(v = true) { paused = v; },
  advance(seconds) {
    const t = clock.getElapsedTime() + seconds;
    intro.updateAt(t);
    weatherData.update(t, 0.016 * seconds);
    camera.position.copy(cameraFinal);
    camera.lookAt(target);
    controls.target.copy(target);
    controls.update();
    vignettePass.uniforms.uTime.value = t;
    composer.render();
  },
  info() {
    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines,
    };
  },
};
