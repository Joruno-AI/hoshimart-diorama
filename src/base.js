import {
  THREE,
  C,
  addBox,
  addPlane,
  addCylinder,
  addCylinderBetween,
  addOutline,
  addSphere,
  basicMat,
  canvasTexture,
  glowMat,
  mulberry32,
  roundRectPath,
  drawStar2D,
  toonMat,
  JP_FONT,
  MONO_FONT,
  DISPLAY_FONT,
} from './core.js';
import {
  makeAsphaltTexture,
  makePaverTexture,
  makeTactileTexture,
  makeConcreteTexture,
  makeReflectionTexture,
  makeParkingSign,
  makeStreetSign,
} from './art.js';

const PAVER_TEX = makePaverTexture();
const TACTILE_TEX = makeTactileTexture();
const CONCRETE_TEX = makeConcreteTexture();

function paverMaterial(repeatX, repeatY) {
  const tex = PAVER_TEX.clone();
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return toonMat(0xffffff, {
    map: tex,
    emissive: 0x192228,
    emissiveIntensity: 0.55,
  });
}

function concreteMaterial(repeatX = 3, repeatY = 3) {
  const tex = CONCRETE_TEX.clone();
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return toonMat(0xffffff, {
    map: tex,
    emissive: 0x111820,
    emissiveIntensity: 0.4,
  });
}

function addPaintPlane(parent, w, d, x, z, y = 0.047, rotY = 0, mat) {
  const m =
    mat ??
    toonMat(0xd8ded7, {
      emissive: 0x252d2f,
      emissiveIntensity: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
  return addPlane(parent, w, d, m, {
    x,
    y,
    z,
    rx: -Math.PI / 2,
    ry: rotY,
    receive: true,
  });
}

function makeBasePlaqueTexture() {
  return canvasTexture(1400, 220, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#171d22');
    grad.addColorStop(0.55, '#0f1418');
    grad.addColorStop(1, '#20262b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#a58a5a';
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.strokeStyle = 'rgba(165,138,90,.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    ctx.fillStyle = '#c6aa76';
    drawStar2D(ctx, 98, h / 2, 38, 16, 5, -Math.PI / 2);
    ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d6c29b';
    ctx.font = `600 44px ${JP_FONT}`;
    ctx.letterSpacing = '7px';
    ctx.fillText('雨夜の交差点', 160, 90);
    ctx.fillStyle = '#9b8a6d';
    ctx.font = `600 30px ${MONO_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillText('HOSHIMI CORNER  ·  COLLECTOR’S MODEL', 162, 146);
    ctx.fillStyle = '#b4a17c';
    ctx.font = `600 24px ${MONO_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('No. 03   /   1:100', w - 70, 116);
  });
}

function makePuddleShape(rng, rx, rz) {
  const points = [];
  const count = 13;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 0.72 + rng() * 0.38;
    points.push(new THREE.Vector2(Math.cos(a) * rx * r, Math.sin(a) * rz * r));
  }
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = points[i - 1];
    const mx = (prev.x + p.x) * 0.5 + (rng() - 0.5) * rx * 0.15;
    const my = (prev.y + p.y) * 0.5 + (rng() - 0.5) * rz * 0.15;
    shape.quadraticCurveTo(mx, my, p.x, p.y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 18);
}

const PUDDLE_MAT = new THREE.MeshPhysicalMaterial({
  color: 0x1b2e3d,
  roughness: 0.06,
  metalness: 0.32,
  clearcoat: 1,
  clearcoatRoughness: 0.03,
  emissive: 0x0d1d2b,
  emissiveIntensity: 0.5,
  envMapIntensity: 1.25,
  transparent: true,
  opacity: 0.48,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function addPuddle(parent, x, z, rx, rz, rotation, y, seed = 1) {
  const rng = mulberry32(seed);
  const geo = makePuddleShape(rng, rx, rz);
  const mesh = new THREE.Mesh(geo, PUDDLE_MAT);
  mesh.rotation.set(-Math.PI / 2, 0, rotation);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;
  parent.add(mesh);
  // a few faint inner highlights to make the puddle read in toon lighting
  const hi = new THREE.Mesh(
    new THREE.RingGeometry(0.015, 0.05, 16, 1, 0, Math.PI * 1.6),
    glowMat(0x9bc7dc, 0.18)
  );
  hi.rotation.set(-Math.PI / 2, 0, rotation + 0.6);
  hi.position.set(x + rx * 0.2, y + 0.004, z - rz * 0.1);
  hi.scale.set(rx * 1.2, 1, rz * 1.2);
  parent.add(hi);
  return mesh;
}

function addDrain(parent, x, z, rot = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.16, z);
  g.rotation.y = rot;
  parent.add(g);
  addBox(
    g,
    0.92,
    0.035,
    0.46,
    toonMat(0x353d43, { emissive: 0x070a0c, emissiveIntensity: 0.2 }),
    { y: 0.01, cast: false, receive: true }
  );
  const barMat = toonMat(0x171c21);
  for (let i = 0; i < 7; i++) {
    addBox(g, 0.055, 0.025, 0.37, barMat, {
      x: -0.36 + i * 0.12,
      y: 0.038,
      cast: false,
    });
  }
  addBox(g, 0.78, 0.02, 0.05, barMat, { y: 0.045, z: 0.16, cast: false });
  addBox(g, 0.78, 0.02, 0.05, barMat, { y: 0.045, z: -0.16, cast: false });
  return g;
}

export function buildBase(scene, intro) {
  const base = new THREE.Group();
  base.name = 'base';
  scene.add(base);

  // Slab + deck rim ---------------------------------------------------------
  addBox(base, 28, 1.22, 28, toonMat(C.baseSide, { emissive: 0x090d12, emissiveIntensity: 0.4 }), {
    y: -0.66,
    r: 0.18,
    roundSegments: 2,
    outline: true,
    thickness: 0.028,
    cast: true,
    receive: true,
    name: 'square base',
  });
  addBox(base, 28.08, 0.045, 28.08, toonMat(C.baseTrim, { emissive: 0x2c2111, emissiveIntensity: 0.4 }), {
    y: -0.11,
    cast: false,
    receive: false,
  });
  addBox(base, 27.66, 0.04, 27.66, toonMat(0x20262d), {
    y: 0.0,
    cast: false,
    receive: true,
  });
  const asphaltTex = makeAsphaltTexture();
  const asphaltMat = toonMat(0xffffff, {
    map: asphaltTex,
    emissive: 0x0c121a,
    emissiveIntensity: 0.65,
  });
  addPlane(base, 27.5, 27.5, asphaltMat, {
    x: 0,
    y: 0.025,
    z: 0,
    rx: -Math.PI / 2,
    receive: true,
  });
  // A very thin clearcoat surface gives the whole roadway a wet, neon-
  // smeared sheen while the pavement pattern stays visible underneath.
  const wetSheenMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b111a,
    roughness: 0.13,
    metalness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.38,
    envMapIntensity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  addPlane(base, 27.42, 27.42, wetSheenMat, {
    x: 0,
    y: 0.034,
    z: 0,
    rx: -Math.PI / 2,
    receive: false,
    renderOrder: 1,
  });

  // Model plaque on the front face
  const plaqueTex = makeBasePlaqueTexture();
  const plaque = addPlane(
    base,
    5.4,
    0.84,
    basicMat(0xffffff, { map: plaqueTex }),
    { x: 0, y: -0.63, z: 14.012 }
  );
  plaque.rotation.y = 0;

  intro.add(base, { start: 0, duration: 1.2, motion: 'rise', distance: 2.8, ease: 'outQuint' });

  // Sidewalks ---------------------------------------------------------------
  const walk = new THREE.Group();
  scene.add(walk);

  const frontWalk = addBox(
    walk,
    19.1,
    0.16,
    3.1,
    paverMaterial(5, 1),
    { x: -4.25, y: 0.08, z: 3.75, cast: false, receive: true }
  );
  const sideWalk = addBox(
    walk,
    2.1,
    0.16,
    15.9,
    paverMaterial(1, 4.4),
    { x: 4.25, y: 0.08, z: -5.75, cast: false, receive: true }
  );
  const backWalk = addBox(
    walk,
    16.9,
    0.13,
    2.8,
    concreteMaterial(5, 1),
    { x: -5.25, y: 0.065, z: -12.3, cast: false, receive: true }
  );
  const southWalk = addBox(
    walk,
    27.4,
    0.16,
    2.2,
    paverMaterial(9, 1),
    { x: 0, y: 0.08, z: 12.6, cast: false, receive: true }
  );
  const eastWalk = addBox(
    walk,
    2.2,
    0.16,
    25.2,
    paverMaterial(1, 8),
    { x: 12.6, y: 0.08, z: -1.2, cast: false, receive: true }
  );

  intro.add(frontWalk, { start: 0.55, duration: 0.7, motion: 'drop', distance: 1.6, ease: 'outCubic' });
  intro.add(sideWalk, { start: 0.65, duration: 0.7, motion: 'drop', distance: 1.6, ease: 'outCubic' });
  intro.add(backWalk, { start: 0.85, duration: 0.7, motion: 'drop', distance: 1.3, ease: 'outCubic' });
  intro.add(southWalk, { start: 0.75, duration: 0.75, motion: 'drop', distance: 1.6, ease: 'outCubic' });
  intro.add(eastWalk, { start: 0.82, duration: 0.75, motion: 'drop', distance: 1.6, ease: 'outCubic' });

  // Curbs -------------------------------------------------------------------
  const curbs = new THREE.Group();
  walk.add(curbs);
  const curbMat = toonMat(0x8d969b, { emissive: 0x222a2f, emissiveIntensity: 0.55 });
  // front curb, split around the little crossing and the parking entrance
  addBox(curbs, 11.6, 0.2, 0.17, curbMat, { x: -7.95, y: 0.1, z: 5.31, cast: false });
  addBox(curbs, 6.6, 0.2, 0.17, curbMat, { x: 1.95, y: 0.1, z: 5.31, cast: false });
  addBox(curbs, 0.17, 0.2, 15.9, curbMat, { x: 5.31, y: 0.1, z: -5.75, cast: false });
  // far curbs
  addBox(curbs, 27.4, 0.2, 0.17, curbMat, { x: 0, y: 0.1, z: 11.53, cast: false });
  addBox(curbs, 0.17, 0.2, 25.2, curbMat, { x: 11.53, y: 0.1, z: -1.2, cast: false });
  // a pale stripe along the tops
  addBox(curbs, 27.4, 0.025, 0.18, toonMat(0xbcc2bf), { x: 0, y: 0.205, z: 11.53, cast: false });
  addBox(curbs, 0.18, 0.025, 25.2, toonMat(0xbcc2bf), { x: 11.53, y: 0.205, z: -1.2, cast: false });
  intro.add(curbs, { start: 0.95, duration: 0.7, motion: 'rise', distance: 0.4, ease: 'outCubic' });

  // tactile paving strips at crossings ------------------------------------
  const tactileMat = toonMat(0xffffff, {
    map: TACTILE_TEX,
    emissive: 0x35280a,
    emissiveIntensity: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });
  const tactile = new THREE.Group();
  walk.add(tactile);
  const tacPlane = (w, d, x, z, ry = 0) =>
    addPlane(tactile, w, d, tactileMat, {
      x,
      y: 0.166,
      z,
      rx: -Math.PI / 2,
      ry,
      receive: true,
    });
  tacPlane(5.2, 0.34, 2.1, 5.02);
  tacPlane(5.2, 0.34, 2.1, 11.72);
  tacPlane(0.34, 3.8, 5.04, 3.35);
  tacPlane(0.34, 3.8, 11.75, 3.35);
  // guide strip toward the store entrance
  tacPlane(0.34, 2.0, 3.22, 2.1);
  intro.add(tactile, { start: 1.3, duration: 0.45, motion: 'scale', ease: 'outBack' });

  // Crosswalks --------------------------------------------------------------
  const paintMat = toonMat(0xc8d0ca, {
    emissive: 0x20282b,
    emissiveIntensity: 0.48,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const markings = new THREE.Group();
  scene.add(markings);
  markings.position.y = 0.047;

  const stripes = [];
  const crossA = 2.12;
  for (let i = 0; i < 6; i++) {
    const x = crossA - 2.4 + i * 0.84;
    const s = addPaintPlane(markings, 0.43, 5.65, x, 8.48, 0, 0, paintMat);
    stripes.push(s);
  }
  for (let i = 0; i < 5; i++) {
    const z = 1.7 + i * 0.8;
    const s = addPaintPlane(markings, 5.65, 0.4, 8.4, z, 0, 0, paintMat);
    stripes.push(s);
  }
  // stop line + dashed lane line
  addPaintPlane(markings, 5.2, 0.25, 8.25, 0.95, 0, 0, paintMat);
  for (let i = 0; i < 4; i++) {
    addPaintPlane(markings, 0.16, 1.6, 8.34, -4.2 - i * 2.7, 0, 0, paintMat);
  }
  addPaintPlane(markings, 0.15, 2.4, -0.45, 7.0, 0, 0, paintMat);

  intro.add(markings, { start: 1.05, duration: 0.8, motion: 'scale', ease: 'outCubic', scaleFrom: 0.04 });

  // Parking bay in front of the store --------------------------------------
  const parking = new THREE.Group();
  scene.add(parking);
  parking.position.y = 0.048;
  // outline of two generous Japanese compact-car bays
  addPaintPlane(parking, 5.4, 0.15, -6.1, 5.75, 0, 0, paintMat);
  addPaintPlane(parking, 5.4, 0.15, -6.1, 10.65, 0, 0, paintMat);
  addPaintPlane(parking, 0.15, 4.9, -8.8, 8.2, 0, 0, paintMat);
  addPaintPlane(parking, 0.15, 4.9, -3.4, 8.2, 0, 0, paintMat);
  addPaintPlane(parking, 0.12, 4.9, -6.1, 8.2, 0, 0, paintMat);
  // small P letter
  intro.add(parking, { start: 1.55, duration: 0.7, motion: 'scale', ease: 'outBack', scaleFrom: 0.1 });

  // painted P inside the customer parking bay
  const parkingMarkTex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(210,218,211,.86)';
    ctx.font = `800 400px ${DISPLAY_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', w / 2, h / 2 + 20);
    ctx.strokeStyle = 'rgba(210,218,211,.55)';
    ctx.lineWidth = 18;
    ctx.strokeRect(46, 46, w - 92, h - 92);
  });
  const parkingMark = addPlane(markings, 1.6, 1.6, new THREE.MeshBasicMaterial({
    map: parkingMarkTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    toneMapped: true,
  }), {
    x: -6.1,
    y: 0.052,
    z: 8.25,
    rx: -Math.PI / 2,
    renderOrder: 2,
  });

  // white painted road text on the side street
  const roadTextTex = canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(208,216,211,.72)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 190px ${JP_FONT}`;
    ctx.letterSpacing = '8px';
    ctx.fillText('止まれ', w / 2, h / 2 - 40);
    ctx.font = `700 60px ${MONO_FONT}`;
    ctx.letterSpacing = '18px';
    ctx.fillText('STOP', w / 2, h / 2 + 135);
  });
  addPlane(markings, 2.6, 1.3, new THREE.MeshBasicMaterial({
    map: roadTextTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    toneMapped: true,
  }), {
    x: 8.4,
    y: 0.054,
    z: -2.45,
    rx: -Math.PI / 2,
    renderOrder: 2,
  });
  // a modest directional arrow on the lane
  const arrowTex = canvasTexture(256, 768, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(207,215,210,.72)';
    ctx.fillStyle = 'rgba(207,215,210,.72)';
    ctx.lineWidth = 54;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 40);
    ctx.lineTo(w / 2, 220);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2, 58);
    ctx.lineTo(40, 274);
    ctx.lineTo(w - 40, 274);
    ctx.closePath();
    ctx.fill();
  });
  addPlane(markings, 1.15, 3.5, new THREE.MeshBasicMaterial({
    map: arrowTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    toneMapped: true,
  }), {
    x: 6.55,
    y: 0.053,
    z: 9.1,
    rx: -Math.PI / 2,
    renderOrder: 2,
  });

  // Wheel stops
  const wheelStopGroup = new THREE.Group();
  scene.add(wheelStopGroup);
  const stopMat = toonMat(0xb9b6a9, { emissive: 0x25231d, emissiveIntensity: 0.4 });
  for (const x of [-7.45, -4.75]) {
    addBox(wheelStopGroup, 1.3, 0.16, 0.23, stopMat, {
      x,
      y: 0.11,
      z: 10.22,
      r: 0.06,
      receive: true,
    });
    addBox(wheelStopGroup, 0.18, 0.09, 0.24, toonMat(0xe3b457), {
      x: x - 0.35,
      y: 0.18,
      z: 10.22,
      cast: false,
    });
    addBox(wheelStopGroup, 0.18, 0.09, 0.24, toonMat(0xe3b457), {
      x: x + 0.35,
      y: 0.18,
      z: 10.22,
      cast: false,
    });
  }
  intro.add(wheelStopGroup, { start: 2.0, duration: 0.5, motion: 'scale', ease: 'outBack' });

  // Drains and gutters ------------------------------------------------------
  const drains = new THREE.Group();
  scene.add(drains);
  addDrain(drains, -10.0, 5.2, 0);
  addDrain(drains, -2.2, 5.2, 0);
  addDrain(drains, 4.95, -1.1, Math.PI / 2);
  addDrain(drains, 4.95, -8.0, Math.PI / 2);
  addDrain(drains, 12.05, 7.8, Math.PI / 2);
  addDrain(drains, 6.1, 11.78, 0);
  intro.add(drains, { start: 1.5, duration: 0.65, motion: 'scale', ease: 'outBack' });

  // gutter lines: shallow dark strips along the curbs
  const gutterMat = toonMat(0x1b2228);
  addBox(drains, 19.0, 0.015, 0.1, gutterMat, {
    x: -4.25,
    y: 0.03,
    z: 5.48,
    cast: false,
    receive: true,
  });
  addBox(drains, 0.1, 0.015, 15.8, gutterMat, {
    x: 5.48,
    y: 0.03,
    z: -5.8,
    cast: false,
    receive: true,
  });

  // Manhole ---------------------------------------------------------------
  const manholeTex = canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#3c4246');
    g.addColorStop(0.7, '#2c3236');
    g.addColorStop(1, '#1d2327');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(187,195,192,.28)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 210, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(22,26,29,.85)';
    ctx.lineWidth = 4;
    for (let r = 52; r < 198; r += 26) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * 48, h / 2 + Math.sin(a) * 48);
      ctx.lineTo(w / 2 + Math.cos(a) * 202, h / 2 + Math.sin(a) * 202);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(202,208,203,.24)';
    ctx.font = `700 30px ${MONO_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('星見市 下水道', w / 2, h / 2 + 10);
  });
  const manhole = new THREE.Mesh(
    new THREE.CircleGeometry(0.76, 36),
    toonMat(0xffffff, {
      map: manholeTex,
      emissive: 0x0d1318,
      emissiveIntensity: 0.4,
      polygonOffset: true,
    })
  );
  manhole.rotation.x = -Math.PI / 2;
  manhole.position.set(8.6, 0.049, 8.8);
  manhole.receiveShadow = true;
  scene.add(manhole);

  // Puddles + wet reflection decals ---------------------------------------
  const wet = new THREE.Group();
  wet.name = 'wet surface';
  wet.visible = false;
  scene.add(wet);
  const rng = mulberry32(102);
  addPuddle(wet, 2.0, 4.55, 1.2, 0.5, 0.2, 0.17, 21);
  addPuddle(wet, -5.7, 4.1, 0.95, 0.45, -0.3, 0.17, 22);
  addPuddle(wet, -4.0, 9.05, 1.7, 0.85, 0.1, 0.052, 23);
  addPuddle(wet, 7.1, 7.2, 1.9, 1.2, -0.5, 0.052, 24);
  addPuddle(wet, 11.9, 3.3, 1.35, 0.7, 0.4, 0.052, 25);
  addPuddle(wet, 12.35, 12.3, 0.8, 0.34, 0.5, 0.17, 27);

  const reflectionTex = makeReflectionTexture();
  const reflMat = (color, opacity) =>
    new THREE.MeshBasicMaterial({
      color,
      map: reflectionTex,
      transparent: true,
      opacity: opacity * 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: true,
      side: THREE.DoubleSide,
      fog: false,
    });
  const addReflection = (x, z, w, d, color, opacity, ry = 0, y = 0.058) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), reflMat(color, opacity));
    m.rotation.set(-Math.PI / 2, 0, ry);
    m.position.set(x, y, z);
    m.renderOrder = 2;
    wet.add(m);
    return m;
  };
  // warm window spill
  addReflection(-2.7, 4.25, 7.2, 2.4, 0xffd08c, 0.5, 0, 0.168);
  addReflection(-3.2, 4.1, 4.8, 1.2, 0xffe0b0, 0.18, 0, 0.171);
  addReflection(-2.5, 7.15, 5.2, 4.2, 0xffbd74, 0.24);
  addReflection(1.2, 4.25, 2.2, 1.8, 0x84f2dc, 0.4, 0, 0.169);
  addReflection(-0.6, 4.35, 3.0, 1.4, 0xff9a83, 0.26, 0, 0.17);
  addReflection(6.0, -3.6, 1.8, 3.7, 0x8ff3da, 0.42, -0.22);
  addReflection(6.5, -4.8, 1.3, 2.2, 0xffa878, 0.3, -0.22);
  addReflection(-10.8, 4.6, 1.5, 3.2, 0xff7ca8, 0.34, 0, 0.168);
  addReflection(-10.8, 7.1, 1.2, 2.7, 0xff7ca8, 0.13);
  addReflection(10.2, 4.0, 2.8, 3.1, 0xffcf8d, 0.24);
  addReflection(8.5, 9.1, 2.0, 1.1, 0xffd37f, 0.22);
  addReflection(2.25, 8.2, 4.4, 6.1, 0xe3ecf7, 0.12, 0.0, 0.055);
  addReflection(2.2, 4.9, 5.6, 1.25, 0x8ff0d6, 0.18, 0, 0.168);
  addReflection(0.3, 6.0, 6.0, 2.1, 0xffc680, 0.22);
  addReflection(4.2, 7.4, 3.5, 3.8, 0x8fe8d9, 0.16);
  addReflection(4.45, -3.4, 1.6, 3.6, 0x89f1d6, 0.2, 0, 0.168);
  addReflection(4.2, 1.55, 1.3, 2.2, 0x8ef9dd, 0.22, 0, 0.168);
  addReflection(2.8, 0.9, 1.1, 1.6, 0xffb078, 0.16, 0, 0.168);
  addReflection(3.6, 5.8, 3.0, 2.1, 0xa6d8e8, 0.1);
  addReflection(2.2, 8.5, 3.6, 5.3, 0xa7d6e5, 0.09, 0.0, 0.055);
  addReflection(8.4, 3.4, 4.2, 2.0, 0xbbbec8, 0.06, Math.PI / 2, 0.055);

  const wetMaterials = new Map();
  wet.traverse((o) => {
    if (o.isMesh && o.material && o.material.transparent) {
      wetMaterials.set(o.material.uuid, { mat: o.material, opacity: o.material.opacity });
    }
  });
  intro.add(wet, {
    start: 6.1,
    duration: 1.2,
    motion: 'fade',
    onUpdate: (p) => {
      wet.visible = true;
      for (const { mat, opacity } of wetMaterials.values()) mat.opacity = opacity * p;
    },
    onDone: () => {
      wet.visible = true;
      for (const { mat, opacity } of wetMaterials.values()) mat.opacity = opacity;
    },
  });

  // Parking sign ----------------------------------------------------------
  const parkSign = new THREE.Group();
  parkSign.position.set(-8.65, 0, 4.75);
  scene.add(parkSign);
  addCylinder(parkSign, 0.035, 0.045, 2.25, toonMat(0x7d8589), {
    y: 1.12,
    segments: 8,
    outline: true,
    thickness: 0.012,
  });
  const parkTex = makeParkingSign();
  const pSign = addPlane(parkSign, 0.72, 0.95, basicMat(0xffffff, { map: parkTex }), {
    y: 1.74,
    z: 0.045,
  });
  pSign.castShadow = false;
  const pBack = addBox(parkSign, 0.78, 1.02, 0.055, toonMat(0x264e4e), {
    y: 1.74,
    z: 0,
    r: 0.03,
    outline: true,
    thickness: 0.012,
  });
  pBack.castShadow = false;
  intro.add(parkSign, { start: 5.2, duration: 0.65, motion: 'drop', distance: 1.1, ease: 'outBack' });

  // Traffic sign pole at the corner --------------------------------------
  const signPole = new THREE.Group();
  signPole.position.set(10.85, 0, 12.62);
  scene.add(signPole);
  addCylinder(signPole, 0.038, 0.05, 2.9, toonMat(0x737c81), {
    y: 1.45,
    segments: 8,
    outline: true,
    thickness: 0.01,
  });
  const crossTex = makeStreetSign('crossing');
  const crossMat = basicMat(0xffffff, { map: crossTex });
  addBox(signPole, 0.58, 0.58, 0.045, toonMat(0x1e5b96), {
    y: 2.72,
    z: 0.01,
    r: 0.03,
    outline: true,
    thickness: 0.01,
    cast: false,
  });
  addPlane(signPole, 0.53, 0.53, crossMat, { y: 2.72, z: 0.041 });
  const streetTex = makeStreetSign('name');
  addBox(signPole, 0.98, 0.32, 0.04, toonMat(0x1e5680), {
    y: 2.2,
    z: 0.01,
    r: 0.025,
    outline: true,
    thickness: 0.009,
    cast: false,
  });
  addPlane(signPole, 0.92, 0.28, basicMat(0xffffff, { map: streetTex }), { y: 2.2, z: 0.036 });
  intro.add(signPole, { start: 5.45, duration: 0.7, motion: 'rise', distance: 1.4, ease: 'outBack' });

  // A couple of yellow marker posts at the curb
  const posts = new THREE.Group();
  scene.add(posts);
  for (const [x, z] of [
    [5.55, 10.6],
    [10.85, 5.1],
  ]) {
    addCylinder(posts, 0.045, 0.055, 0.7, toonMat(0xd9c06b), {
      x,
      y: 0.35,
      z,
      segments: 8,
      outline: true,
      thickness: 0.01,
    });
    addCylinder(posts, 0.048, 0.048, 0.12, toonMat(0xe9e5d6), {
      x,
      y: 0.58,
      z,
      segments: 8,
    });
  }
  intro.add(posts, { start: 5.8, duration: 0.55, motion: 'scale', ease: 'outBack' });

  return {
    base,
    walk,
    markings,
    wet,
    paintMat,
    stripes,
    frontWalk,
    sideWalk,
  };
}
