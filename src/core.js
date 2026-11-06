import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };

export const TAU = Math.PI * 2;
export const JP_FONT =
  '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", "PingFang SC", sans-serif';
export const DISPLAY_FONT =
  '"Avenir Next", "Futura", "Century Gothic", "Helvetica Neue", "Hiragino Sans", sans-serif';
export const MONO_FONT = '"SFMono-Regular", "Menlo", "Courier New", monospace';

export const C = {
  night: 0x070d18,
  ink: 0x0a101a,
  outline: 0x0a0e17,
  asphalt: 0x252b36,
  asphaltDeep: 0x1b2029,
  sidewalk: 0x7b838b,
  sidewalkLight: 0x9ba1a4,
  curb: 0x90979b,
  paint: 0xe9ece5,
  paintDim: 0xbcc7c3,
  stone: 0x4a4d53,
  baseSide: 0x161c26,
  baseTrim: 0xa88d5d,
  cream: 0xf3e6cf,
  creamDeep: 0xe3d2b6,
  warmWhite: 0xfff0cf,
  mint: 0x86dcca,
  mintDeep: 0x1f8d83,
  teal: 0x155c5b,
  tealDark: 0x0d3b40,
  coral: 0xf37a6d,
  salmon: 0xf2a08f,
  rose: 0xee8aa4,
  pinkNeon: 0xff7fa8,
  amber: 0xffbe66,
  amberDeep: 0xd48134,
  coolWhite: 0xdff3ff,
  blue: 0x83b9ff,
  violet: 0x9a8adf,
  plum: 0x3b2b3d,
  brown: 0x5d493e,
  wood: 0x8c6e52,
  woodLight: 0xc19e78,
  green: 0x4b7868,
  leaf: 0x3d6f5a,
};

// ---------------------------------------------------------------------------
// Seedable randomness
// ---------------------------------------------------------------------------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  outBack: (t) => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

// ---------------------------------------------------------------------------
// Toon material system
// ---------------------------------------------------------------------------
const gradientData = new Uint8Array([38, 88, 146, 205, 255]);
export const toonGradient = new THREE.DataTexture(
  gradientData,
  gradientData.length,
  1,
  THREE.RedFormat
);
toonGradient.minFilter = THREE.NearestFilter;
toonGradient.magFilter = THREE.NearestFilter;
toonGradient.generateMipmaps = false;
toonGradient.needsUpdate = true;

const toonCache = new Map();
function toonKey(color, opts) {
  return [
    color,
    opts.emissive ?? '',
    opts.emissiveIntensity ?? '',
    opts.map?.uuid ?? '',
    opts.side ?? '',
    opts.opacity ?? '',
    opts.transparent ?? '',
    opts.flatShading ?? '',
    opts.vertexColors ?? '',
  ].join('~');
}
export function toonMat(color, opts = {}) {
  const key = toonKey(color, opts);
  if (toonCache.has(key)) return toonCache.get(key);
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    map: opts.map ?? null,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    vertexColors: opts.vertexColors ?? false,
  });
  if (opts.depthWrite === false) mat.depthWrite = false;
  if (opts.polygonOffset) {
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = opts.polygonOffsetFactor ?? -1;
    mat.polygonOffsetUnits = opts.polygonOffsetUnits ?? -1;
  }
  toonCache.set(key, mat);
  return mat;
}

const basicCache = new Map();
export function basicMat(color, opts = {}) {
  const key = [
    color,
    opts.map?.uuid ?? '',
    opts.transparent ?? '',
    opts.opacity ?? '',
    opts.blending ?? '',
    opts.depthWrite ?? '',
    opts.side ?? '',
    opts.toneMapped ?? '',
  ].join('~');
  if (basicCache.has(key)) return basicCache.get(key);
  const mat = new THREE.MeshBasicMaterial({
    color,
    map: opts.map ?? null,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    blending: opts.blending ?? THREE.NormalBlending,
    depthWrite: opts.depthWrite ?? true,
    side: opts.side ?? THREE.FrontSide,
    toneMapped: opts.toneMapped ?? true,
  });
  if (opts.alphaTest) mat.alphaTest = opts.alphaTest;
  if (opts.fog === false) mat.fog = false;
  basicCache.set(key, mat);
  return mat;
}

export function glowMat(color, opacity = 1, opts = {}) {
  const c = new THREE.Color(color).multiplyScalar(opts.boost ?? 1.25);
  return new THREE.MeshBasicMaterial({
    color: c,
    transparent: opacity < 1 || (opts.transparent ?? false),
    opacity,
    blending: opts.blending ?? THREE.AdditiveBlending,
    depthWrite: false,
    side: opts.side ?? THREE.DoubleSide,
    toneMapped: opts.toneMapped ?? true,
    fog: opts.fog ?? false,
  });
}

export function glassMat(opacity = 0.1) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc9ecec,
    roughness: 0.06,
    metalness: 0.0,
    transparent: true,
    opacity,
    transmission: 0,
    ior: 1.45,
    reflectivity: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------------------
// Inverted-hull toon outlines
// ---------------------------------------------------------------------------
const outlineMaterials = new Map();
const OUTLINE_VERT = /* glsl */ `
  uniform float uThickness;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    mv.xyz += n * uThickness;
    gl_Position = projectionMatrix * mv;
  }
`;
const OUTLINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;
export function outlineMat(thickness = 0.018, color = C.outline) {
  const key = `${thickness}-${color}`;
  if (outlineMaterials.has(key)) return outlineMaterials.get(key);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    side: THREE.BackSide,
  });
  outlineMaterials.set(key, mat);
  return mat;
}

export function addOutline(mesh, thickness = 0.018, color = C.outline) {
  if (!mesh.geometry?.attributes?.normal) return null;
  const shell = new THREE.Mesh(mesh.geometry, outlineMat(thickness * 1.8, color));
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.raycast = () => {};
  shell.frustumCulled = mesh.frustumCulled;
  shell.userData.isOutline = true;
  mesh.add(shell);
  return shell;
}

// ---------------------------------------------------------------------------
// Object helpers
// ---------------------------------------------------------------------------
export function addBox(parent, w, h, d, mat, opts = {}) {
  const rounded = opts.r
    ? new RoundedBoxGeometry(w, h, d, opts.roundSegments ?? 2, Math.min(opts.r, w / 2, h / 2, d / 2))
    : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(rounded, mat);
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  if (opts.rx || opts.ry || opts.rz) {
    mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  }
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.name) mesh.name = opts.name;
  if (opts.renderOrder !== undefined) mesh.renderOrder = opts.renderOrder;
  if (opts.outline) addOutline(mesh, opts.thickness ?? 0.018, opts.outlineColor ?? C.outline);
  if (opts.noShadow) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  }
  parent.add(mesh);
  return mesh;
}

export function addPlane(parent, w, h, mat, opts = {}) {
  const geo = new THREE.PlaneGeometry(w, h, opts.segX ?? 1, opts.segY ?? 1);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  mesh.castShadow = false;
  mesh.receiveShadow = opts.receive ?? false;
  if (opts.renderOrder !== undefined) mesh.renderOrder = opts.renderOrder;
  if (opts.name) mesh.name = opts.name;
  parent.add(mesh);
  return mesh;
}

export function addCylinder(parent, rt, rb, h, mat, opts = {}) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, opts.segments ?? 12, opts.heightSegments ?? 1, opts.openEnded ?? false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.outline) addOutline(mesh, opts.thickness ?? 0.014, opts.outlineColor ?? C.outline);
  parent.add(mesh);
  return mesh;
}

export function addSphere(parent, radius, mat, opts = {}) {
  const geo = new THREE.SphereGeometry(radius, opts.widthSeg ?? 12, opts.heightSeg ?? 8);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  mesh.scale.set(opts.sx ?? 1, opts.sy ?? 1, opts.sz ?? 1);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.outline) addOutline(mesh, opts.thickness ?? 0.012);
  parent.add(mesh);
  return mesh;
}

export function addTorus(parent, radius, tube, mat, opts = {}) {
  const geo = new THREE.TorusGeometry(radius, tube, opts.radialSegments ?? 8, opts.tubularSegments ?? 24, opts.arc ?? TAU);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.outline) addOutline(mesh, opts.thickness ?? 0.012);
  parent.add(mesh);
  return mesh;
}

export function addCylinderBetween(parent, a, b, radius, mat, opts = {}) {
  const start = new THREE.Vector3(a[0], a[1], a[2]);
  const end = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, length, opts.segments ?? 8, 1, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.outline) addOutline(mesh, opts.thickness ?? 0.012);
  parent.add(mesh);
  return mesh;
}

export function addTube(parent, points, radius, mat, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, opts.curveType ?? 'catmullrom', 0.45);
  const geo = new THREE.TubeGeometry(curve, opts.segments ?? 24, radius, opts.radialSegments ?? 5, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = opts.cast ?? false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export function makeStarGeometry(outer = 0.5, inner = 0.22, depth = 0.12) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: depth * 0.22,
    bevelThickness: depth * 0.2,
    curveSegments: 2,
  });
  geo.center();
  return geo;
}

// ---------------------------------------------------------------------------
// Canvas textures
// ---------------------------------------------------------------------------
export function canvasTexture(width, height, draw, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(opts.anisotropy ?? 8, 16);
  if (opts.repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  } else {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}


export function makeNightEnvironment() {
  const tex = canvasTexture(1024, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#02050b');
    grad.addColorStop(0.28, '#0b1728');
    grad.addColorStop(0.46, '#243d58');
    grad.addColorStop(0.53, '#2b4054');
    grad.addColorStop(0.64, '#080f16');
    grad.addColorStop(1, '#020408');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const glows = [
      [0.23, 0.5, 0.17, 'rgba(255,190,116,.62)'],
      [0.31, 0.47, 0.1, 'rgba(255,107,127,.27)'],
      [0.55, 0.49, 0.135, 'rgba(120,238,212,.55)'],
      [0.72, 0.5, 0.09, 'rgba(255,224,176,.22)'],
      [0.86, 0.48, 0.12, 'rgba(67,117,170,.3)'],
      [0.45, 0.44, 0.24, 'rgba(42,79,118,.26)'],
    ];
    for (const [cx, cy, r, color] of glows) {
      const g = ctx.createRadialGradient(cx * w, cy * h, 0, cx * w, cy * h, r * w);
      g.addColorStop(0, color);
      g.addColorStop(0.45, color.replace(/[\d.]+\)$/, '0.18)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    // faint cloud bands to break up the reflection
    for (let i = 0; i < 24; i++) {
      const y = h * (0.12 + i * 0.014);
      ctx.fillStyle = `rgba(130,163,192,${0.01 + (i % 4) * 0.008})`;
      ctx.fillRect(0, y, w, 1 + (i % 3));
    }
    // a few pinprick city lights near the horizon
    for (let i = 0; i < 80; i++) {
      const x = (i * 71.7) % w;
      const y = h * (0.46 + ((i * 13) % 9) * 0.006);
      ctx.fillStyle = `rgba(255,${190 + (i % 4) * 14},${150 + (i % 3) * 20},${0.1 + (i % 5) * 0.04})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function drawStar2D(ctx, cx, cy, outer, inner, points = 5, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function hexToCss(hex) {
  return '#' + new THREE.Color(hex).getHexString();
}

export function shadowedMesh(obj, cast = true, receive = true) {
  obj.traverse((c) => {
    if (c.isMesh && !c.userData.isOutline) {
      c.castShadow = cast;
      c.receiveShadow = receive;
    }
  });
  return obj;
}
