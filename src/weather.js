import {
  THREE,
  addPlane,
  canvasTexture,
  ease,
  mulberry32,
} from './core.js';
import { makeSteamTexture, makeSoftGlow } from './art.js';

function makeSky(scene) {
  const uniforms = {
    uTime: { value: 0 },
    uTop: { value: new THREE.Color(0x02050c) },
    uHorizon: { value: new THREE.Color(0x142036) },
    uLow: { value: new THREE.Color(0x050810) },
    uGlow: { value: new THREE.Color(0x253a54) },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uLow;
      uniform vec3 uGlow;
      varying vec3 vWorld;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }
      float fbm(vec2 p) {
        float n = 0.0;
        n += noise(p) * 0.52;
        n += noise(p * 2.03 + 11.3) * 0.27;
        n += noise(p * 4.11 - 4.7) * 0.14;
        n += noise(p * 8.13 + 9.2) * 0.07;
        return n;
      }

      void main() {
        vec3 dir = normalize(vWorld);
        float h = dir.y;
        vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.7, h));
        col = mix(uLow, col, smoothstep(-0.32, 0.05, h));
        // soft aurora-ish city glow on the horizon
        float glow = exp(-pow((h + 0.01) / 0.10, 2.0));
        col += uGlow * glow * (0.4 + 0.32 * (dir.x * 0.5 + 0.5));
        float warm = exp(-pow((h + 0.04) / 0.045, 2.0)) * smoothstep(-0.5, 0.9, dir.x);
        col += vec3(0.055, 0.030, 0.030) * warm;
        // cloudy cover layered across the rain
        float cover = fbm(dir.xz * 2.3 + vec2(uTime * 0.0035, uTime * 0.0012));
        float cover2 = fbm(dir.xz * 5.1 - vec2(uTime * 0.007, uTime * 0.0023) + 3.2);
        float clouds = smoothstep(0.38, 0.84, cover) * smoothstep(-0.08, 0.26, h);
        col += vec3(0.032, 0.044, 0.064) * clouds;
        col += vec3(0.014, 0.02, 0.032) * smoothstep(0.55, 0.9, cover2) * smoothstep(0.0, 0.6, h);
        col -= vec3(0.02, 0.023, 0.035) * smoothstep(0.58, 0.96, cover) * smoothstep(0.0, 0.45, h);
        // pale moon glow diffused through rain clouds
        vec3 moonDir = normalize(vec3(-0.38, 0.46, -0.8));
        float moon = pow(max(dot(dir, moonDir), 0.0), 36.0);
        col += vec3(0.28, 0.34, 0.46) * moon;
        float halo = pow(max(dot(dir, moonDir), 0.0), 5.0);
        col += vec3(0.055, 0.07, 0.098) * halo;
        // a soft magenta hint above the low city haze on the left
        float cityPink = exp(-pow((h + 0.02) / 0.08, 2.0)) * smoothstep(-0.4, 0.3, -dir.x);
        col += vec3(0.035, 0.016, 0.026) * cityPink;
        // subtle vignette / bottom darkness
        col *= smoothstep(-0.18, 0.16, h) * 0.55 + 0.45;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(95, 48, 28), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);
  return { sky, uniforms };
}

function makeRain(scene, intro) {
  const rng = mulberry32(924);
  const count = 2300;
  const positions = new Float32Array(count * 2 * 3);
  const baseY = new Float32Array(count * 2);
  const speed = new Float32Array(count * 2);
  const tail = new Float32Array(count * 2);
  const seed = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    // Rain falls over the entire square base, and is clipped at building roofs
    // in the shader so it cannot appear through the shop windows.
    const x = -14.4 + rng() * 28.8;
    const z = -14.4 + rng() * 28.8;
    const y = 1.5 + rng() * 16.5;
    const sp = 7.5 + rng() * 6.5;
    const sd = rng();
    for (let k = 0; k < 2; k++) {
      const idx = i * 2 + k;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = z;
      baseY[idx] = y;
      speed[idx] = sp;
      tail[idx] = k; // 0 = head, 1 = tail
      seed[idx] = sd;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aBaseY', new THREE.BufferAttribute(baseY, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute('aTail', new THREE.BufferAttribute(tail, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uColor: { value: new THREE.Color(0x9cc3df) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      attribute float aBaseY;
      attribute float aSpeed;
      attribute float aTail;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        float span = 17.0;
        float fall = mod(aBaseY - uTime * aSpeed, span);
        vec3 p = position;
        p.y = fall + aTail * (0.25 + aSpeed * 0.052);
        p.x += (span - fall) * 0.035 + sin(uTime * 0.3 + aSeed * 6.2831) * 0.028;
        // don't draw drops inside the volumes of the two buildings
        float insideShop = step(-7.85, p.x) * step(p.x, 3.35) * step(-11.1, p.z) * step(p.z, 2.85);
        float insideCafe = step(-13.5, p.x) * step(p.x, -9.35) * step(-10.6, p.z) * step(p.z, 2.4);
        float clipped = max(insideShop * step(p.y, 7.95), insideCafe * step(p.y, 9.05));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = length(mv.xyz);
        vAlpha = (1.0 - aTail * 0.72) * smoothstep(0.0, 1.0, fall) * smoothstep(62.0, 14.0, dist);
        vAlpha *= uOpacity * (1.0 - clipped);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.004) discard;
        gl_FragColor = vec4(uColor, vAlpha);
      }
    `,
  });
  const rain = new THREE.LineSegments(geometry, material);
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);
  intro.add(rain, {
    start: 7.05,
    duration: 1.7,
    motion: 'fade',
    ease: (t) => t,
    onUpdate: (p) => {
      rain.visible = true;
      uniforms.uOpacity.value = 0.58 * ease.outCubic(p);
    },
    onDone: () => {
      rain.visible = true;
      uniforms.uOpacity.value = 0.58;
    },
  });
  return { rain, uniforms, material };
}

function makeRipples(scene, intro) {
  const rng = mulberry32(717);
  const group = new THREE.Group();
  group.name = 'rain ripples';
  const spots = [
    [2.2, 4.6, 0.17],
    [-4.7, 4.3, 0.17],
    [-3.9, 9.0, 0.055],
    [7.1, 7.2, 0.055],
    [9.6, 4.6, 0.055],
    [4.8, 2.3, 0.17],
    [-10.4, 4.6, 0.17],
    [-11.8, 12.3, 0.17],
    [12.6, 9.5, 0.17],
    [-1.3, 11.9, 0.17],
    [6.1, 11.9, 0.17],
    [-8.4, 2.7, 0.17],
    [4.4, -1.7, 0.17],
    [4.2, -8.4, 0.17],
    [0.6, 7.9, 0.055],
    [11.2, 1.9, 0.055],
    [13.0, 12.6, 0.17],
    [5.9, 10.1, 0.17],
    [-9.8, 7.2, 0.055],
    [10.4, 10.4, 0.17],
  ];
  const rings = [];
  for (let i = 0; i < spots.length; i++) {
    const [x, z, y] = spots[i];
    const mat = new THREE.MeshBasicMaterial({
      color: 0x7da6c4,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.325, 0.355, 20), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y + 0.008, z);
    mesh.scale.setScalar(0.25);
    mesh.renderOrder = 3;
    group.add(mesh);
    rings.push({
      mesh,
      mat,
      baseX: x,
      baseZ: z,
      baseY: y,
      phase: rng(),
      speed: 0.36 + rng() * 0.34,
      size: 0.6 + rng() * 0.55,
      sx: 0.55 + rng() * 0.7,
      sz: 0.55 + rng() * 0.7,
    });
  }
  group.visible = false;
  scene.add(group);
  let fade = 0;
  intro.add(group, {
    start: 7.35,
    duration: 1.0,
    motion: 'fade',
    ease: (t) => t,
    onUpdate: (p) => {
      group.visible = true;
      fade = p;
    },
    onDone: () => {
      group.visible = true;
      fade = 1;
    },
  });
  return {
    group,
    rings,
    update(time, dt) {
      if (!group.visible) return;
      for (const r of rings) {
        const p = (time * r.speed + r.phase) % 1;
        const s = 0.16 + p * 1.75 * r.size;
        r.mesh.scale.set(s * r.sx, s * r.sz, s);
        const fadeRing = Math.sin(Math.PI * Math.min(1, p * 1.12)) * (1 - p) * 0.14;
        r.mat.opacity = fade * fadeRing;
        r.mesh.position.y = r.baseY + 0.008 + Math.sin(p * 7.0 + r.phase * 4.0) * 0.004;
      }
    },
  };
}

function makeSteam(scene, intro) {
  const group = new THREE.Group();
  group.name = 'steam';
  const tex = makeSteamTexture();
  const sources = [
    { x: 2.0, y: 1.48, z: -2.72, rise: 1.25, size: 0.8, color: 0xf5d3a0, opacity: 0.13, count: 4 },
    { x: 1.72, y: 1.3, z: -3.08, rise: 0.95, size: 0.6, color: 0xffd29f, opacity: 0.09, count: 3 },
    { x: -8.7, y: 0.6, z: -3.7, rise: 2.2, size: 1.4, color: 0xa8c4cd, opacity: 0.08, count: 4 },
    { x: -9.3, y: 1.5, z: 2.0, rise: 1.5, size: 1.0, color: 0xe8c7b5, opacity: 0.07, count: 3 },
  ];
  const wisps = [];
  for (const s of sources) {
    for (let i = 0; i < s.count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: s.color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(s.x, s.y, s.z);
      const baseScale = s.size * (0.45 + (i / s.count) * 0.5);
      sprite.scale.set(baseScale * 0.75, baseScale, 1);
      group.add(sprite);
      wisps.push({
        sprite,
        mat,
        source: s,
        phase: i / s.count + Math.random() * 0.2,
        drift: (Math.random() - 0.5) * 0.3,
        speed: 0.08 + Math.random() * 0.055,
        baseScale,
      });
    }
  }
  group.visible = false;
  scene.add(group);
  let fade = 0;
  intro.add(group, {
    start: 6.8,
    duration: 1.2,
    motion: 'fade',
    ease: (t) => t,
    onUpdate: (p) => {
      group.visible = true;
      fade = p;
    },
    onDone: () => {
      group.visible = true;
      fade = 1;
    },
  });
  return {
    group,
    update(time) {
      if (!group.visible) return;
      for (const w of wisps) {
        const p = (time * w.speed + w.phase) % 1;
        const rise = w.source.rise;
        w.sprite.position.y = w.source.y + ease.outCubic(p) * rise;
        w.sprite.position.x = w.source.x + Math.sin(time * 0.5 + w.phase * 8) * 0.12 + w.drift * p;
        w.sprite.position.z = w.source.z + Math.cos(time * 0.35 + w.phase * 9) * 0.1;
        const s = w.baseScale * (0.65 + p * 1.55);
        w.sprite.scale.set(s * 0.75, s, 1);
        w.mat.opacity = fade * w.source.opacity * Math.sin(Math.PI * p) * 1.8;
      }
    },
  };
}

function makeAtmosphere(scene) {
  // A couple of very soft, wide sprites seated low over the wet intersection.
  const glow = makeSoftGlow();
  const mists = [];
  for (const [x, y, z, sx, sy, color, opacity] of [
    [6.5, 0.85, 7.5, 14, 5.2, 0x6f8aa4, 0.035],
    [-4.2, 0.7, 5.8, 12, 4.2, 0x6f857e, 0.025],
  ]) {
    const mat = new THREE.SpriteMaterial({
      map: glow,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(sx, sy, 1);
    scene.add(sprite);
    mists.push({ sprite, mat, baseX: x, phase: Math.random() * Math.PI * 2 });
  }
  return {
    update(time) {
      for (const m of mists) {
        m.sprite.position.x = m.baseX + Math.sin(time * 0.045 + m.phase) * 1.8;
        m.mat.opacity = 0.03 + Math.sin(time * 0.1 + m.phase) * 0.009;
      }
    },
  };
}

export function buildWeather(scene, intro) {
  const sky = makeSky(scene);
  const rain = makeRain(scene, intro);
  const ripples = makeRipples(scene, intro);
  const steam = makeSteam(scene, intro);
  const atmosphere = makeAtmosphere(scene);
  // fog: kept gentle so the diorama base remains legible
  scene.fog = new THREE.FogExp2(0x0a111d, 0.0105);
  let elapsed = 0;
  return {
    ...rain,
    ...ripples,
    sky,
    steam,
    atmosphere,
    update(time, dt) {
      elapsed = time;
      rain.uniforms.uTime.value = time;
      sky.uniforms.uTime.value = time;
      ripples.update(time, dt);
      steam.update(time);
      atmosphere.update(time);
    },
  };
}
