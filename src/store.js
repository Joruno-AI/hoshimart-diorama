import {
  THREE,
  C,
  TAU,
  DISPLAY_FONT,
  JP_FONT,
  MONO_FONT,
  addBox,
  addPlane,
  addCylinder,
  addCylinderBetween,
  addOutline,
  addSphere,
  addTorus,
  basicMat,
  canvasTexture,
  glassMat,
  glowMat,
  makeStarGeometry,
  mulberry32,
  roundRectPath,
  drawStar2D,
  toonMat,
  toonGradient,
  clamp,
} from './core.js';
import {
  makeStoreSign,
  makeBladeSign as makeBladeSignTexture,
  makePoster,
  makeMagazineCover,
  makeFridgeSign,
  makeAisleSign,
  makePriceStrip,
  makeDoorDecal,
  makeFridgeGlassSheen,
  makeWelcomeMat,
  makeWarmWindow,
  makeWallPosterSmall,
  makeMascotSticker,
  makeSoftGlow,
} from './art.js';

const SX0 = -7.6;
const SX1 = 3.2;
const SZ0 = -10.9;
const SZ1 = 2.6;
const FLOOR_Y = 0.22;
const CEIL_Y = 3.05;
const GF_TOP = 3.55;
const UPPER_TOP = 7.32;

const COL = {
  wall: 0xe9ddc5,
  wallShade: 0xcbbca3,
  wallUpper: 0xb9ab96,
  upperDark: 0x53605f,
  mint: 0x8ed7c7,
  mintDeep: 0x2c8d83,
  teal: 0x174e50,
  tealDark: 0x0d3338,
  coral: 0xe77b68,
  warm: 0xffe5b8,
  interior: 0xffedcf,
  wood: 0xb0845b,
  woodDark: 0x5c4638,
  metal: 0x8b9598,
  frame: 0xd6cebb,
  floor: 0xd9cbb3,
};

const SHARED = {
  cream: toonMat(COL.wall, { emissive: 0x241b10, emissiveIntensity: 0.33 }),
  creamShade: toonMat(COL.wallShade, { emissive: 0x1a140d, emissiveIntensity: 0.25 }),
  mint: toonMat(COL.mint, { emissive: 0x102822, emissiveIntensity: 0.3 }),
  teal: toonMat(COL.teal, { emissive: 0x081b1c, emissiveIntensity: 0.3 }),
  tealDark: toonMat(COL.tealDark, { emissive: 0x050e10, emissiveIntensity: 0.35 }),
  coral: toonMat(COL.coral, { emissive: 0x2a0d08, emissiveIntensity: 0.28 }),
  interiorWall: toonMat(0xd9c6a8, { emissive: 0x3a2917, emissiveIntensity: 0.22 }),
  interiorCeil: toonMat(0xe4d5bc, { emissive: 0x43311d, emissiveIntensity: 0.25 }),
  metal: toonMat(COL.metal, { emissive: 0x131a1d, emissiveIntensity: 0.35 }),
  darkMetal: toonMat(0x394446, { emissive: 0x070c0d, emissiveIntensity: 0.3 }),
  wood: toonMat(COL.wood, { emissive: 0x27180c, emissiveIntensity: 0.3 }),
  woodDark: toonMat(COL.woodDark, { emissive: 0x0f0b07, emissiveIntensity: 0.25 }),
  warmGlow: basicMat(0xffe6b4),
  coolGlow: basicMat(0xeafaff),
  glass: glassMat(0.08),
};

// ---------------------------------------------------------------------------
// textures created for the interior
// ---------------------------------------------------------------------------
function makeFloorTexture() {
  return canvasTexture(
    768,
    768,
    (ctx, w, h) => {
      const rng = mulberry32(410);
      ctx.fillStyle = '#c4b49b';
      ctx.fillRect(0, 0, w, h);
      const cols = 8;
      const rows = 8;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const s = 0.93 + rng() * 0.12;
          ctx.fillStyle = `rgb(${Math.round(188 * s)},${Math.round(170 * s)},${Math.round(143 * s)})`;
          ctx.fillRect((x * w) / cols + 2, (y * h) / rows + 2, w / cols - 4, h / rows - 4);
        }
      }
      ctx.strokeStyle = 'rgba(122,108,86,.32)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo((i * w) / cols, 0);
        ctx.lineTo((i * w) / cols, h);
        ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i * h) / rows);
        ctx.lineTo(w, (i * h) / rows);
        ctx.stroke();
      }
      for (let i = 0; i < 360; i++) {
        ctx.fillStyle = `rgba(90,75,58,${0.015 + rng() * 0.035})`;
        ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
      }
      // speckled vinyl
      for (let i = 0; i < 520; i++) {
        ctx.fillStyle = `rgba(${rng() > 0.5 ? '255,250,232' : '92,76,55'},${0.02 + rng() * 0.055})`;
        ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
      }
    },
    { repeat: [2, 2], anisotropy: 8 }
  );
}

function makeShelfEdgeTexture() {
  return canvasTexture(2048, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f2ead8';
    ctx.fillRect(0, 0, w, h);
    const rng = mulberry32(90);
    let x = 2;
    const colors = ['#e8bd59', '#ef8d74', '#75c7b3', '#f5e9d0', '#c7b690'];
    let i = 0;
    while (x < w - 5) {
      const width = 140 + Math.floor(rng() * 40);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, 4, width, h - 8);
      ctx.fillStyle = i % 4 === 3 || i % 4 === 0 ? '#224343' : '#fff7e3';
      ctx.textAlign = 'center';
      ctx.font = `800 34px ${MONO_FONT}`;
      ctx.fillText(`¥${[128, 158, 178, 198, 248][i % 5]}`, x + width / 2, 53);
      ctx.font = `600 22px ${JP_FONT}`;
      ctx.fillText(['おにぎり', 'パン', '飲料', '菓子', 'めん'][i % 5], x + width / 2, 92);
      x += width + 4;
      i++;
    }
    ctx.textAlign = 'left';
  });
}

function makePOS() {
  return canvasTexture(512, 360, (ctx, w, h) => {
    ctx.fillStyle = '#eefaff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e6a6d';
    ctx.fillRect(0, 0, w, 58);
    ctx.fillStyle = '#f0fff9';
    ctx.font = `700 29px ${MONO_FONT}`;
    ctx.fillText('HOSHI POS 01', 20, 39);
    ctx.fillStyle = '#2e6d60';
    ctx.font = `600 23px ${JP_FONT}`;
    ctx.fillText('お会計', 24, 104);
    ctx.fillStyle = '#1d3e3e';
    ctx.font = `800 52px ${MONO_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('¥ 684', w - 24, 112);
    ctx.textAlign = 'left';
    const items = [
      ['おにぎり 鮭', '128'],
      ['からあげ', '240'],
      ['カフェオレ', '158'],
      ['ホットスナック', '158'],
    ];
    ctx.strokeStyle = '#adc8c4';
    ctx.lineWidth = 2;
    items.forEach(([name, price], i) => {
      ctx.fillStyle = '#36524f';
      ctx.font = `600 20px ${JP_FONT}`;
      ctx.fillText(name, 24, 166 + i * 38);
      ctx.fillStyle = '#44615d';
      ctx.font = `600 18px ${MONO_FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(price, w - 26, 166 + i * 38);
      ctx.textAlign = 'left';
      ctx.beginPath();
      ctx.moveTo(24, 177 + i * 38);
      ctx.lineTo(w - 26, 177 + i * 38);
      ctx.stroke();
    });
    ctx.fillStyle = '#efc465';
    roundRectPath(ctx, 22, h - 64, 250, 42, 8);
    ctx.fill();
    ctx.fillStyle = '#3c3b30';
    ctx.font = `700 21px ${JP_FONT}`;
    ctx.fillText('レジ袋  ¥5', 36, h - 37);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#76bcae';
    ctx.font = `600 20px ${JP_FONT}`;
    ctx.fillText('現金 / カード / QR', w - 26, h - 36);
  });
}

function makeCigaretteDisplay() {
  return canvasTexture(1200, 720, (ctx, w, h) => {
    ctx.fillStyle = '#17383b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#366a67';
    ctx.lineWidth = 4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i * h) / 4);
      ctx.lineTo(w, (i * h) / 4);
      ctx.stroke();
    }
    ctx.fillStyle = '#e6f5ee';
    ctx.font = `700 36px ${JP_FONT}`;
    ctx.letterSpacing = '6px';
    ctx.textAlign = 'center';
    ctx.fillText('たばこ ・ 切手 ・ はがき', w / 2, 50);
    const rows = [
      ['MEVIUS', ['#d8dfe1', '#b6c7d4', '#e4d6b6', '#8fa3aa']],
      ['SEVEN STARS', ['#e9e2d4', '#d3c6ab', '#a07755', '#f1eadc']],
      ['Pianissimo', ['#ecd7dc', '#e4c4ce', '#d7a9b8', '#f4e2e7']],
    ];
    rows.forEach(([label, packages], r) => {
      const y = 92 + r * 200;
      ctx.fillStyle = 'rgba(8,25,27,.28)';
      ctx.fillRect(26, y - 20, w - 52, 160);
      ctx.fillStyle = '#e4c47e';
      ctx.font = `600 22px ${MONO_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(label, 44, y + 3);
      for (let c = 0; c < 10; c++) {
        const x = 40 + c * 113;
        const color = packages[c % packages.length];
        ctx.fillStyle = color;
        roundRectPath(ctx, x, y + 24, 84, 108, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(38,48,48,.5)';
        ctx.fillRect(x, y + 24, 84, 14);
        ctx.fillStyle = '#fffaf0';
        ctx.fillRect(x + 10, y + 48, 64, 34);
        ctx.fillStyle = '#415354';
        ctx.font = `700 13px ${MONO_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('HOSHIMI', x + 42, y + 69);
        ctx.fillStyle = 'rgba(31,51,52,.55)';
        ctx.fillRect(x + 12, y + 96, 60, 20);
        ctx.textAlign = 'left';
      }
    });
    // under-shelf light strips
    ctx.fillStyle = '#b9d3c8';
    ctx.fillRect(0, h - 24, w, 9);
    ctx.fillStyle = '#d9b975';
    ctx.fillRect(0, h - 15, w, 4);
  });
}

function makeWindowSheen() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0.05, 'rgba(255,255,255,0)');
    g.addColorStop(0.28, 'rgba(219,248,246,.24)');
    g.addColorStop(0.37, 'rgba(255,255,255,.02)');
    g.addColorStop(0.57, 'rgba(255,255,255,0)');
    g.addColorStop(0.68, 'rgba(255,255,255,.12)');
    g.addColorStop(0.74, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath();
    ctx.moveTo(w * 0.18, 0);
    ctx.lineTo(w * 0.25, 0);
    ctx.lineTo(w * 0.04, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  });
}

function makeRoofTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const rng = mulberry32(88);
      ctx.fillStyle = '#3e4647';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) {
        ctx.fillStyle = 'rgba(15,20,22,.23)';
        ctx.fillRect(0, y, w, 3);
        for (let x = 0; x < w; x += 64) {
          ctx.fillStyle = 'rgba(177,178,166,.08)';
          ctx.fillRect(x, y + 3, 1, 29);
        }
      }
      for (let i = 0; i < 700; i++) {
        ctx.fillStyle = `rgba(${rng() > 0.5 ? '210,209,193' : '15,18,18'},${0.03 + rng() * 0.05})`;
        ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 3, 1 + rng() * 2);
      }
    },
    { repeat: [4, 4], anisotropy: 8 }
  );
}

// ---------------------------------------------------------------------------
// little helpers
// ---------------------------------------------------------------------------
function addInstances(parent, geo, items, mat) {
  if (!items.length) return null;
  const inst = new THREE.InstancedMesh(geo, mat, items.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
    dummy.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
    if (it.color !== undefined) {
      color.setHex(it.color);
      inst.setColorAt(i, color);
    }
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  inst.castShadow = true;
  inst.receiveShadow = true;
  inst.frustumCulled = false;
  parent.add(inst);
  return inst;
}

const PRODUCT_COLORS = [
  0xf4c75a, 0xeb826d, 0x57b9a5, 0x709cdb, 0xf1e1c2, 0xb89bdd, 0xeb9aae, 0x72c6de,
  0xd98439, 0xb6c6bd, 0xd55048, 0x3f8f84, 0xf0cc6e, 0x8f68bd, 0xf4ead9,
  0x245f9e, 0xb23236, 0x2d6f51, 0xd68127,
];

function productBoxItems(rng, length, depth, levels) {
  const boxes = [];
  for (const baseY of levels) {
    for (const side of [1, -1]) {
      let x = -length / 2 + 0.14;
      while (x < length / 2 - 0.14) {
        const w = 0.11 + rng() * 0.13;
        const h = 0.16 + rng() * 0.18;
        const d = 0.09 + rng() * 0.08;
        boxes.push({
          x: x + w / 2,
          y: baseY + h / 2 + 0.032,
          z: side * (0.17 + rng() * 0.1),
          sx: w,
          sy: h,
          sz: d,
          color: PRODUCT_COLORS[Math.floor(rng() * PRODUCT_COLORS.length)],
        });
        // occasional second row tucked behind
        if (rng() > 0.55) {
          boxes.push({
            x: x + w / 2 + 0.01,
            y: baseY + (h * 0.8) / 2 + 0.032,
            z: side * (0.03 + rng() * 0.045),
            sx: w * 0.88,
            sy: h * 0.8,
            sz: d * 0.88,
            color: PRODUCT_COLORS[Math.floor(rng() * PRODUCT_COLORS.length)],
          });
        }
        x += w + 0.035 + rng() * 0.025;
      }
    }
  }
  return boxes;
}

function makeShelfGroup(rng, label, sub, accent) {
  const group = new THREE.Group();
  const length = 5.3;
  const depth = 1.04;
  const levelY = [0.4, 0.79, 1.17, 1.52];
  const headerMat = toonMat(0x1b4648, {
    emissive: 0x071415,
    emissiveIntensity: 0.35,
  });
  // base and ends
  addBox(group, length, 0.17, depth, SHARED.tealDark, {
    y: 0.105,
    r: 0.035,
    outline: true,
    thickness: 0.013,
  });
  for (const x of [-length / 2, length / 2]) {
    addBox(group, 0.075, 1.66, depth, headerMat, {
      x,
      y: 0.87,
      outline: true,
      thickness: 0.011,
    });
  }
  // central divider gives the gondola two filled faces
  addBox(group, length - 0.1, 1.48, 0.055, toonMat(0x244f4d, {
    emissive: 0x081717,
    emissiveIntensity: 0.32,
  }), {
    y: 0.84,
    z: 0,
  });
  // warm shelf planks with a mint front edge
  const edgeTex = makeShelfEdgeTexture();
  const edgeMat = toonMat(0xffffff, {
    map: edgeTex,
    emissive: 0x4b361e,
    emissiveIntensity: 0.62,
  });
  for (let i = 0; i < levelY.length; i++) {
    addBox(group, length - 0.04, 0.055, depth + 0.02, SHARED.cream, {
      y: levelY[i],
      r: 0.012,
      outline: true,
      thickness: 0.009,
    });
    for (const side of [1, -1]) {
      addPlane(group, length - 0.14, 0.105, edgeMat, {
        y: levelY[i] + 0.05,
        z: side * (depth / 2 + 0.037),
        rx: side > 0 ? -0.03 : 0.03,
        ry: side > 0 ? 0 : Math.PI,
        receive: false,
      });
      addBox(group, length - 0.2, 0.018, 0.025, basicMat(0xffeac1), {
        y: levelY[i] - 0.015,
        z: side * (depth / 2 - 0.02),
        cast: false,
      });
    }
  }
  // a heavier top rail and end caps
  addBox(group, 0.09, 0.09, depth, SHARED.mint, {
    x: -length / 2,
    y: 1.71,
    cast: false,
  });
  addBox(group, 0.09, 0.09, depth, SHARED.mint, {
    x: length / 2,
    y: 1.71,
    cast: false,
  });
  // products packed to the front edges so they read through the shop windows
  const boxes = productBoxItems(rng, length - 0.22, depth - 0.12, levelY.slice(0, 3));
  const instMat = new THREE.MeshToonMaterial({
    color: 0xffffff,
    gradientMap: toonGradient,
    emissive: 0x3b2a17,
    emissiveIntensity: 0.62,
  });
  addInstances(group, new THREE.BoxGeometry(1, 1, 1), boxes, instMat);

  // a couple of tall cartons / promo packs on the top deck
  for (let i = 0; i < 7; i++) {
    const c = PRODUCT_COLORS[(i * 3 + 2) % PRODUCT_COLORS.length];
    addBox(
      group,
      0.16 + rng() * 0.06,
      0.24 + rng() * 0.08,
      0.12,
      toonMat(c, { emissive: 0x2a2014, emissiveIntensity: 0.4 }),
      {
        x: -2.0 + i * 0.67,
        y: levelY[3] + 0.17,
        z: (i % 2 === 0 ? 1 : -1) * (0.22 + rng() * 0.06),
        rx: (rng() - 0.5) * 0.1,
        ry: (rng() - 0.5) * 0.22,
        outline: true,
        thickness: 0.007,
        cast: false,
      }
    );
  }

  // hanging aisle sign with text visible from both directions
  const aisleTex = makeAisleSign(label, sub, `#${new THREE.Color(accent).getHexString()}`);
  const signW = 1.55;
  const signH = 0.46;
  const signGroup = new THREE.Group();
  signGroup.position.set(0, 2.2, 0.06);
  group.add(signGroup);
  addBox(signGroup, signW + 0.09, signH + 0.09, 0.075, SHARED.teal, {
    outline: true,
    thickness: 0.01,
    r: 0.035,
  });
  addPlane(signGroup, signW, signH, basicMat(0xffffff, { map: aisleTex }), { z: 0.043 });
  addPlane(signGroup, signW, signH, basicMat(0xffffff, { map: aisleTex }), {
    z: -0.043,
    ry: Math.PI,
  });
  addCylinder(signGroup, 0.007, 0.007, 0.74, SHARED.darkMetal, {
    x: -signW / 2 + 0.13,
    y: 0.56,
    segments: 4,
    cast: false,
  });
  addCylinder(signGroup, 0.007, 0.007, 0.74, SHARED.darkMetal, {
    x: signW / 2 - 0.13,
    y: 0.56,
    segments: 4,
    cast: false,
  });
  return group;
}

function makeFridgeBay(idx, x, category, sub, accent) {
  const group = new THREE.Group();
  group.position.set(x, FLOOR_Y, -10.27);
  const width = 1.92;
  const height = 2.42;
  const depth = 0.72;
  const white = toonMat(0xe4e1d6, { emissive: 0x1c1a13, emissiveIntensity: 0.22 });
  const frameMat = toonMat(0x254244, { emissive: 0x060f10, emissiveIntensity: 0.28 });
  // carcass
  addBox(group, width, height, 0.12, white, {
    z: -depth / 2 + 0.06,
    y: height / 2,
    receive: true,
  });
  addBox(group, 0.09, height, depth, white, {
    x: -width / 2 + 0.045,
    y: height / 2,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, 0.09, height, depth, white, {
    x: width / 2 - 0.045,
    y: height / 2,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, width, 0.1, depth, white, { y: 0.05 });
  addBox(group, width, 0.12, depth, white, { y: height - 0.06 });
  // bright back panel
  addBox(
    group,
    width - 0.17,
    height - 0.28,
    0.03,
    new THREE.MeshBasicMaterial({ color: 0xd7f4f7, toneMapped: true }),
    { z: -depth / 2 + 0.14, y: height / 2 + 0.01, cast: false, receive: false }
  );
  // thin shelf boards
  const levels = [0.35, 0.83, 1.31, 1.79, 2.25];
  const shelfMat = new THREE.MeshBasicMaterial({ color: 0xcfe8e5 });
  for (const y of levels) {
    addBox(group, width - 0.22, 0.035, depth - 0.12, shelfMat, {
      z: -0.02,
      y,
      cast: false,
      receive: false,
    });
  }
  // drinks, rows of little bottle / can silhouettes
  const rng = mulberry32(200 + idx);
  const bottles = [];
  const cans = [];
  for (let l = 0; l < 4; l++) {
    const baseY = levels[l] + 0.027;
    for (let c = 0; c < 7; c++) {
      for (let row = 0; row < 2; row++) {
        const h = 0.18 + rng() * 0.12;
        const xPos = -width / 2 + 0.25 + c * 0.22 + (rng() - 0.5) * 0.02;
        const zPos = -0.24 + row * 0.18;
        const color = PRODUCT_COLORS[(c + l * 3 + row + idx) % PRODUCT_COLORS.length];
        const item = {
          x: xPos,
          y: baseY + h / 2,
          z: zPos,
          sx: 0.085,
          sy: h,
          sz: 0.085,
          color,
        };
        if ((c + l) % 3 === 0) {
          item.sx = 0.105;
          item.sz = 0.105;
          bottles.push(item);
        } else {
          cans.push(item);
        }
      }
    }
  }
  addInstances(
    group,
    new THREE.CylinderGeometry(0.5, 0.53, 1, 7),
    bottles,
    new THREE.MeshToonMaterial({
      color: 0xffffff,
      gradientMap: toonGradient,
      emissive: 0x243228,
      emissiveIntensity: 0.7,
    })
  );
  addInstances(
    group,
    new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    cans,
    new THREE.MeshToonMaterial({
      color: 0xffffff,
      gradientMap: toonGradient,
      emissive: 0x243228,
      emissiveIntensity: 0.6,
    })
  );

  // glass door and frame
  addPlane(
    group,
    width - 0.12,
    height - 0.24,
    new THREE.MeshPhysicalMaterial({
      color: 0xd8f3f1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    { z: depth / 2 + 0.02, y: height / 2, renderOrder: 4 }
  );
  const sheenTex = makeFridgeGlassSheen();
  addPlane(
    group,
    width - 0.18,
    height - 0.28,
    new THREE.MeshBasicMaterial({
      map: sheenTex,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
    { z: depth / 2 + 0.035, y: height / 2, renderOrder: 5 }
  );
  addBox(group, width + 0.03, 0.075, 0.08, frameMat, {
    y: height - 0.02,
    z: depth / 2,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, width + 0.03, 0.075, 0.08, frameMat, {
    y: 0.06,
    z: depth / 2,
    outline: true,
    thickness: 0.008,
  });
  for (const fx of [-width / 2 + 0.04, 0, width / 2 - 0.04]) {
    addBox(group, 0.06, height - 0.02, 0.09, frameMat, {
      x: fx,
      y: height / 2,
      z: depth / 2,
      outline: true,
      thickness: 0.007,
    });
  }
  addCylinder(group, 0.021, 0.021, 0.55, SHARED.metal, {
    x: 0.19,
    y: 1.15,
    z: depth / 2 + 0.075,
    segments: 7,
    outline: true,
    thickness: 0.007,
  });
  // top category sign
  const catTex = makeFridgeSign(category, sub, `#${new THREE.Color(accent).getHexString()}`);
  addBox(group, width + 0.05, 0.54, 0.1, SHARED.tealDark, {
    y: height + 0.3,
    z: 0.02,
    outline: true,
    thickness: 0.01,
    r: 0.02,
  });
  addPlane(group, width - 0.02, 0.48, basicMat(0xffffff, { map: catTex }), {
    y: height + 0.3,
    z: 0.078,
  });
  return group;
}


function makeDisplayCooler() {
  const group = new THREE.Group();
  const width = 2.08;
  const height = 2.2;
  const depth = 0.76;
  const frameMat = toonMat(0x285b5c, { emissive: 0x071716, emissiveIntensity: 0.35 });
  const bodyMat = toonMat(0xc1c4b8, { emissive: 0x171814, emissiveIntensity: 0.2 });
  // open-front carcass so the drinks actually read through the glass
  addBox(group, width, height, 0.08, bodyMat, {
    y: height / 2,
    z: -depth / 2 + 0.04,
    outline: true,
    thickness: 0.012,
  });
  for (const x of [-width / 2 + 0.045, width / 2 - 0.045]) {
    addBox(group, 0.09, height, depth, bodyMat, {
      x,
      y: height / 2,
      outline: true,
      thickness: 0.008,
    });
  }
  addBox(group, width, 0.11, depth, bodyMat, {
    y: height - 0.055,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, width, 0.12, depth, bodyMat, {
    y: 0.06,
  });
  addBox(group, width - 0.2, height - 0.3, 0.03, new THREE.MeshBasicMaterial({
    color: 0x7faeb6,
    toneMapped: true,
  }), {
    y: height / 2,
    z: -depth / 2 + 0.1,
    cast: false,
    receive: false,
  });
  const levels = [0.34, 0.75, 1.16, 1.57, 1.94];
  for (const y of levels) {
    addBox(group, width - 0.15, 0.035, depth - 0.13, new THREE.MeshBasicMaterial({ color: 0xb7dedd }), {
      y,
      z: 0.024,
      cast: false,
    });
  }
  const rng = mulberry32(581);
  const drinks = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const h = 0.18 + rng() * 0.1;
      drinks.push({
        x: -width / 2 + 0.22 + col * 0.3 + (rng() - 0.5) * 0.015,
        y: levels[row] + 0.028 + h / 2,
        z: 0.12 + rng() * 0.08,
        sx: 0.1,
        sy: h * 1.25,
        sz: 0.1,
        color: PRODUCT_COLORS[Math.floor(rng() * PRODUCT_COLORS.length)],
      });
    }
  }
  addInstances(
    group,
    new THREE.CylinderGeometry(0.5, 0.51, 1, 8),
    drinks,
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true })
  );
  // crisp white label bands + dark caps make the refrigerated bottles read
  // even from across the street
  const labels = drinks.map((d) => ({
    x: d.x,
    y: d.y - 0.01,
    z: d.z + 0.004,
    sx: d.sx * 1.035,
    sy: 0.055,
    sz: d.sz * 1.035,
    color: 0xf4edda,
  }));
  addInstances(
    group,
    new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    labels,
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true })
  );
  const caps = drinks.map((d) => ({
    x: d.x,
    y: d.y + d.sy / 2 + 0.012,
    z: d.z,
    sx: d.sx * 0.7,
    sy: 0.025,
    sz: d.sz * 0.7,
    color: 0xe8e3d5,
  }));
  addInstances(
    group,
    new THREE.CylinderGeometry(0.5, 0.5, 1, 7),
    caps,
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true })
  );
  // bottles with warm side labels
  const hot = [];
  for (let i = 0; i < 8; i++) {
    hot.push({
      x: -width / 2 + 0.3 + i * 0.18,
      y: levels[4] + 0.13,
      z: 0.04,
      sx: 0.1,
      sy: 0.2,
      sz: 0.1,
      color: PRODUCT_COLORS[(i + 2) % PRODUCT_COLORS.length],
    });
  }
  addInstances(group, new THREE.BoxGeometry(1, 1, 1), hot, new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: true,
  }));
  // door frame and glass
  addBox(group, width + 0.02, 0.075, 0.08, frameMat, { y: height - 0.03, z: depth / 2 + 0.02 });
  addBox(group, width + 0.02, 0.075, 0.08, frameMat, { y: 0.04, z: depth / 2 + 0.02 });
  for (const x of [-width / 2 + 0.03, 0, width / 2 - 0.03]) {
    addBox(group, 0.055, height, 0.08, frameMat, { x, y: height / 2, z: depth / 2 + 0.02, outline: true, thickness: 0.006 });
  }
  addPlane(group, width - 0.12, height - 0.15, glassMat(0.08), {
    y: height / 2,
    z: depth / 2 + 0.065,
    renderOrder: 5,
  });
  addPlane(group, width - 0.1, height - 0.18, new THREE.MeshBasicMaterial({
    map: makeFridgeGlassSheen(),
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), {
    y: height / 2,
    z: depth / 2 + 0.075,
    renderOrder: 6,
  });
  addCylinder(group, 0.018, 0.018, 0.46, SHARED.metal, {
    x: width / 2 - 0.2,
    y: 1.15,
    z: depth / 2 + 0.11,
    segments: 7,
    outline: true,
    thickness: 0.005,
  });
  // header sign
  const signTex = makeFridgeSign('DRINKS', 'COLD & FRESH', '#a9f2e1');
  addBox(group, width + 0.06, 0.4, 0.08, SHARED.tealDark, {
    y: height + 0.2,
    z: 0.01,
    outline: true,
    thickness: 0.008,
    r: 0.02,
  });
  addPlane(group, width - 0.04, 0.34, basicMat(0xffffff, { map: signTex }), {
    y: height + 0.2,
    z: 0.055,
  });
  // little feet
  addBox(group, width - 0.1, 0.08, depth - 0.08, SHARED.darkMetal, {
    y: 0.04,
    z: 0,
    cast: false,
  });
  return group;
}


function makeCounterPromoTex(kind = 0) {
  return canvasTexture(700, 900, (ctx, w, h) => {
    ctx.textBaseline = 'middle';
    if (kind === 0) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f6c861');
      g.addColorStop(1, '#dc6a54');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff5df';
      ctx.fillRect(20, 20, w - 40, h - 40);
      ctx.fillStyle = '#a84632';
      ctx.fillRect(32, 32, w - 64, h - 64);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff4da';
      ctx.font = `800 112px ${JP_FONT}`;
      ctx.letterSpacing = '4px';
      ctx.fillText('からあげ', w / 2, 165);
      ctx.font = `700 40px ${JP_FONT}`;
      ctx.fillStyle = '#f2c270';
      ctx.fillText('できたて サクサク', w / 2, 247);
      // simple fried chicken shapes
      ctx.fillStyle = '#e4a04d';
      for (const [x, y, r] of [[230, 410, 95], [400, 390, 120], [540, 445, 80], [350, 545, 100]]) {
        ctx.beginPath();
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          const rr = r * (0.74 + ((k * 29) % 13) / 48);
          if (k === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75);
          else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f5cd7e';
        for (let c = 0; c < 4; c++) {
          ctx.beginPath();
          ctx.arc(x - 40 + c * 22, y - 10 + (c % 2) * 20, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#e4a04d';
      }
      ctx.fillStyle = '#fff0d0';
      roundRectPath(ctx, w / 2 - 135, h - 180, 270, 86, 40);
      ctx.fill();
      ctx.fillStyle = '#963a2e';
      ctx.font = `800 54px ${DISPLAY_FONT}`;
      ctx.letterSpacing = '1px';
      ctx.fillText('¥ 240', w / 2, h - 135);
      ctx.fillStyle = '#f7dbac';
      ctx.font = `600 28px ${MONO_FONT}`;
      ctx.letterSpacing = '3px';
      ctx.fillText('HOSHI MART HOT SNACK', w / 2, h - 62);
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#e8f3eb');
      g.addColorStop(1, '#b9ded2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1d5653';
      ctx.lineWidth = 16;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1d5653';
      ctx.font = `800 94px ${JP_FONT}`;
      ctx.letterSpacing = '3px';
      ctx.fillText('HOT', w / 2, 150);
      ctx.font = `800 118px ${JP_FONT}`;
      ctx.fillText('COFFEE', w / 2, 290);
      ctx.fillStyle = '#c06556';
      ctx.font = `800 52px ${DISPLAY_FONT}`;
      ctx.fillText('¥ 120', w / 2, 385);
      // cup
      ctx.fillStyle = '#f8f2e2';
      ctx.beginPath();
      ctx.moveTo(210, 480);
      ctx.lineTo(490, 480);
      ctx.lineTo(450, 700);
      ctx.lineTo(250, 700);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1d5653';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = '#1d5653';
      ctx.fillRect(194, 462, 312, 24);
      ctx.strokeStyle = 'rgba(232,248,239,.85)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(275 + i * 75, 418);
        ctx.bezierCurveTo(240 + i * 75, 370, 310 + i * 75, 340, 270 + i * 75, 298);
        ctx.stroke();
      }
      ctx.fillStyle = '#1d5653';
      ctx.font = `600 29px ${MONO_FONT}`;
      ctx.letterSpacing = '3px';
      ctx.fillText('HOSHI MART  /  24 HOURS', w / 2, 790);
      ctx.font = `600 25px ${JP_FONT}`;
      ctx.fillText('いつでも、あたたかい。', w / 2, 837);
    }
  });
}

function makeHangingPromo(kind = 0) {
  const group = new THREE.Group();
  const tex = makeCounterPromoTex(kind);
  addBox(group, 0.88, 1.1, 0.08, SHARED.tealDark, {
    outline: true,
    thickness: 0.008,
    r: 0.02,
  });
  addPlane(group, 0.78, 0.99, basicMat(0xffffff, { map: tex }), { z: 0.046 });
  addPlane(group, 0.78, 0.99, basicMat(0xffffff, { map: tex }), { z: -0.046, ry: Math.PI });
  for (const x of [-0.3, 0.3]) {
    addCylinder(group, 0.006, 0.006, 0.42, SHARED.darkMetal, {
      x,
      y: 0.72,
      segments: 4,
      cast: false,
    });
  }
  return group;
}

function makeCounterLamp(x, z) {
  const group = new THREE.Group();
  addCylinder(group, 0.008, 0.008, 0.58, SHARED.darkMetal, {
    y: 0.29,
    segments: 4,
    cast: false,
  });
  addCylinder(group, 0.06, 0.19, 0.16, SHARED.teal, {
    y: 0.16,
    segments: 12,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  addSphere(group, 0.1, basicMat(0xffd89c), {
    y: 0.08,
    sy: 0.55,
    cast: false,
  });
  group.position.set(x, 2.48, z);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSoftGlow(),
    color: 0xffd28e,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    fog: false,
  }));
  halo.scale.set(0.75, 0.75, 1);
  halo.position.set(0, 0.08, 0);
  group.add(halo);
  return group;
}

function makeGlassRainTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const rng = mulberry32(902);
    for (let i = 0; i < 170; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 1 + rng() * 5.5;
      ctx.fillStyle = `rgba(226,246,248,${0.04 + rng() * 0.14})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.8 + rng() * 1.8), 0, 0, Math.PI * 2);
      ctx.fill();
      if (rng() > 0.62) {
        ctx.strokeStyle = `rgba(224,245,247,${0.03 + rng() * 0.07})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3 - rng() * 5, y + 20 + rng() * 80);
        ctx.stroke();
      }
    }
    const shine = ctx.createLinearGradient(0, 0, w, h);
    shine.addColorStop(0.12, 'rgba(224,250,250,0)');
    shine.addColorStop(0.28, 'rgba(224,250,250,.13)');
    shine.addColorStop(0.34, 'rgba(224,250,250,0)');
    shine.addColorStop(0.62, 'rgba(255,255,255,0)');
    shine.addColorStop(0.72, 'rgba(255,255,255,.07)');
    shine.addColorStop(0.8, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeCounter() {
  const group = new THREE.Group();
  group.position.set(0, FLOOR_Y, 0);
  const counterX = 1.72;
  const zStart = -0.72;
  const zEnd = -3.45;
  const len = zStart - zEnd;
  // main counter
  addBox(group, 1.38, 0.93, len, toonMat(0xd8b489, { emissive: 0x33200f, emissiveIntensity: 0.36 }), {
    x: counterX,
    y: 0.465,
    z: (zStart + zEnd) / 2,
    r: 0.025,
    outline: true,
    thickness: 0.012,
  });
  addBox(group, 1.5, 0.1, len + 0.08, SHARED.tealDark, {
    x: counterX,
    y: 0.98,
    z: (zStart + zEnd) / 2,
    r: 0.015,
    outline: true,
    thickness: 0.012,
  });
  // wood slat front
  for (let i = 0; i < 11; i++) {
    addBox(group, 0.025, 0.65, len - 0.18, SHARED.woodDark, {
      x: counterX - 0.7,
      y: 0.48,
      z: (zStart + zEnd) / 2,
      cast: false,
    });
    break;
  }
  // cash register
  const reg = new THREE.Group();
  reg.position.set(counterX - 0.1, 1.03, -1.55);
  group.add(reg);
  addBox(reg, 0.44, 0.08, 0.34, SHARED.darkMetal, { ry: 0.1, outline: true, thickness: 0.008 });
  addCylinder(reg, 0.035, 0.045, 0.22, SHARED.metal, { y: 0.12, segments: 8 });
  addBox(reg, 0.55, 0.38, 0.06, SHARED.tealDark, {
    y: 0.34,
    z: -0.04,
    rx: -0.22,
    ry: 0.15,
    outline: true,
    thickness: 0.009,
  });
  const posTex = makePOS();
  const screenMat = basicMat(0xffffff, { map: posTex });
  addPlane(reg, 0.5, 0.33, screenMat, {
    y: 0.35,
    z: 0.0,
    rx: -0.22,
    ry: 0.15,
  });
  // card terminal
  addBox(reg, 0.18, 0.07, 0.23, SHARED.darkMetal, {
    x: -0.36,
    y: 0.04,
    z: 0.22,
    outline: true,
    thickness: 0.006,
  });
  addPlane(reg, 0.12, 0.08, glowMat(0x91f0db, 0.9), {
    x: -0.36,
    y: 0.082,
    z: 0.22,
    rx: -Math.PI / 2,
  });
  // hot snack warmer
  const warmer = new THREE.Group();
  warmer.position.set(counterX - 0.08, 1.05, -2.75);
  group.add(warmer);
  addBox(warmer, 0.63, 0.1, 0.5, SHARED.darkMetal, {
    y: 0.05,
    r: 0.015,
    outline: true,
    thickness: 0.007,
  });
  addBox(
    warmer,
    0.61,
    0.38,
    0.47,
    new THREE.MeshPhysicalMaterial({
      color: 0xdcf4eb,
      roughness: 0.05,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    { y: 0.31, cast: false, receive: false }
  );
  const foodMats = [toonMat(0xd5863f), toonMat(0xe8ac54), toonMat(0xbd6536)];
  for (let i = 0; i < 3; i++) {
    addBox(warmer, 0.24, 0.11, 0.16, foodMats[i], {
      x: -0.17 + i * 0.18,
      y: 0.16,
      z: -0.04 + (i % 2) * 0.14,
      rx: -0.1,
      outline: true,
      thickness: 0.006,
    });
  }
  addBox(warmer, 0.5, 0.025, 0.028, basicMat(0xffc074), {
    y: 0.49,
    z: 0.04,
    cast: false,
  });
  addBox(warmer, 0.58, 0.025, 0.05, SHARED.metal, {
    x: 0,
    y: 0.43,
    z: 0.26,
    cast: false,
  });
  // oden pot
  const oden = new THREE.Group();
  oden.position.set(counterX - 0.08, 1.03, -3.12);
  group.add(oden);
  addCylinder(oden, 0.29, 0.25, 0.18, toonMat(0x6f7b7a, { emissive: 0x111616, emissiveIntensity: 0.2 }), {
    y: 0.09,
    segments: 16,
    outline: true,
    thickness: 0.009,
  });
  addCylinder(oden, 0.25, 0.25, 0.03, toonMat(0xd0a15c, { emissive: 0x5b360f, emissiveIntensity: 0.4 }), {
    y: 0.19,
    segments: 16,
    cast: false,
  });
  const odenColors = [0xe4c084, 0xe9d8b0, 0xc18d52, 0xd8b180];
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3;
    addSphere(oden, 0.07, toonMat(odenColors[i % 4], { emissive: 0x2a1706, emissiveIntensity: 0.3 }), {
      x: Math.cos(a) * 0.13,
      y: 0.24,
      z: Math.sin(a) * 0.13,
      sx: 1.3,
      sy: 0.7,
      cast: false,
    });
  }
  addBox(oden, 0.28, 0.02, 0.04, basicMat(0xffd697), { y: 0.32, cast: false });
  // coffee machine
  const coffee = new THREE.Group();
  coffee.position.set(2.65, 1.03, -2.1);
  coffee.rotation.y = -0.12;
  group.add(coffee);
  addBox(coffee, 0.44, 0.72, 0.42, toonMat(0xeff0e9, { emissive: 0x1c1d18, emissiveIntensity: 0.2 }), {
    y: 0.38,
    r: 0.045,
    outline: true,
    thickness: 0.01,
  });
  addBox(coffee, 0.38, 0.3, 0.03, SHARED.tealDark, {
    y: 0.52,
    z: 0.218,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  addPlane(coffee, 0.28, 0.15, glowMat(0x95eadb, 0.72), { y: 0.55, z: 0.237, cast: false });
  addBox(coffee, 0.3, 0.05, 0.23, SHARED.darkMetal, { y: 0.21, z: 0.15, cast: false });
  addCylinder(coffee, 0.08, 0.07, 0.16, toonMat(0xf7f3e7), {
    x: 0.05,
    y: 0.11,
    z: 0.16,
    segments: 10,
  });
  addBox(coffee, 0.24, 0.025, 0.035, basicMat(0x9cf1dd), {
    y: 0.78,
    z: 0.08,
    cast: false,
  });
  // small paper cups
  for (let i = 0; i < 3; i++) {
    addCylinder(coffee, 0.045, 0.036, 0.12, toonMat(0xf3ead8), {
      x: -0.28 + i * 0.09,
      y: 0.06,
      z: 0.19,
      segments: 8,
      cast: false,
    });
  }
  // card-only sign and maneki cat
  const mascot = addPlane(group, 0.38, 0.38, basicMat(0xffffff, {
    map: makeMascotSticker(),
    transparent: true,
  }), {
    x: counterX - 0.05,
    y: 1.27,
    z: -0.74,
    rx: -0.2,
    ry: 0.2,
  });
  mascot.renderOrder = 3;
  // back counter along the wall
  addBox(group, 0.5, 1.1, 3.3, toonMat(0x8e755d, { emissive: 0x24170e, emissiveIntensity: 0.3 }), {
    x: 2.86,
    y: 0.55,
    z: -2.3,
    outline: true,
    thickness: 0.012,
  });
  addBox(group, 0.56, 0.07, 3.4, SHARED.tealDark, {
    x: 2.84,
    y: 1.13,
    z: -2.3,
  });
  // cigarette / service display
  const cigTex = makeCigaretteDisplay();
  addBox(group, 0.08, 1.38, 2.4, SHARED.tealDark, {
    x: 3.06,
    y: 2.0,
    z: -2.2,
    outline: true,
    thickness: 0.009,
  });
  addPlane(group, 2.32, 1.3, basicMat(0xffffff, { map: cigTex }), {
    x: 3.015,
    y: 2.0,
    z: -2.2,
    ry: -Math.PI / 2,
    cast: false,
  });
  // microwave / small shelves behind
  addBox(group, 0.46, 0.34, 0.52, toonMat(0xd9ded8, { emissive: 0x1c2220, emissiveIntensity: 0.2 }), {
    x: 2.62,
    y: 1.38,
    z: 0.05,
    r: 0.03,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, 0.3, 0.02, 0.35, basicMat(0xb7f0d9), {
    x: 2.62,
    y: 1.37,
    z: 0.05,
    cast: false,
  });
  // jars and cups on back counter
  for (let i = 0; i < 4; i++) {
    addCylinder(group, 0.06, 0.07, 0.2 + i * 0.02, toonMat(PRODUCT_COLORS[i]), {
      x: 2.62,
      y: 1.28,
      z: -0.7 - i * 0.35,
      segments: 7,
      cast: false,
    });
  }
  // a small pendant lamp over the register
  addCylinderBetween(group, [2.0, 3.03, -1.65], [2.0, 2.64, -1.65], 0.009, SHARED.darkMetal, {
    segments: 5,
    cast: false,
  });
  addCylinder(group, 0.05, 0.16, 0.16, toonMat(0x203b3d), {
    x: 2.0,
    y: 2.57,
    z: -1.65,
    segments: 12,
    outline: true,
    thickness: 0.006,
  });
  addSphere(
    group,
    0.095,
    basicMat(0xffdf9f),
    { x: 2.0, y: 2.54, z: -1.65, sy: 0.5, cast: false }
  );
  return group;
}

function makeMagazineRack() {
  const group = new THREE.Group();
  group.position.set(-3.12, FLOOR_Y, 1.33);
  const metal = SHARED.darkMetal;
  addBox(group, 2.5, 0.1, 0.62, metal, { y: 0.05, outline: true, thickness: 0.008 });
  addBox(group, 2.5, 0.9, 0.05, toonMat(0x3b4a4a), {
    y: 0.55,
    z: -0.23,
  });
  for (const x of [-1.19, 1.19]) {
    addBox(group, 0.06, 1.2, 0.6, metal, {
      x,
      y: 0.68,
      outline: true,
      thickness: 0.008,
    });
  }
  const coverTextures = [];
  for (let i = 0; i < 6; i++) coverTextures.push(makeMagazineCover(i));
  const coverMat = (i) => basicMat(0xffffff, { map: coverTextures[i] });
  for (let row = 0; row < 2; row++) {
    addBox(group, 2.36, 0.045, 0.48, SHARED.cream, {
      y: 0.46 + row * 0.43,
      rx: -0.1,
      outline: true,
      thickness: 0.007,
    });
    for (let i = 0; i < 5; i++) {
      const w = 0.39;
      const h = 0.53;
      const p = addPlane(group, w, h, coverMat(row * 5 + i > 5 ? 5 : row * 5 + i), {
        x: -0.94 + i * 0.47,
        y: 0.76 + row * 0.43,
        z: 0.11,
        rx: -0.16,
      });
      p.castShadow = false;
      // white edge
      addBox(group, w + 0.012, h + 0.012, 0.018, toonMat(0xf0e7d5), {
        x: -0.94 + i * 0.47,
        y: 0.76 + row * 0.43,
        z: 0.095,
        rx: -0.16,
        cast: false,
      });
    }
  }
  // small stack on top
  for (let i = 0; i < 3; i++) {
    addBox(group, 0.4, 0.025, 0.5, SHARED.cream, {
      x: 0.4,
      y: 1.22 + i * 0.03,
      z: 0.05,
      ry: -0.1 + i * 0.05,
      cast: false,
    });
  }
  return group;
}

function makeBasketStack() {
  const group = new THREE.Group();
  group.position.set(2.43, FLOOR_Y, 0.52);
  const colors = [0xe58270, 0x7dc8b7, 0xf0c466, 0xe58270, 0x7dc8b7];
  for (let i = 0; i < 5; i++) {
    addBox(group, 0.58, 0.16, 0.42, toonMat(colors[i], {
      emissive: 0x22140f,
      emissiveIntensity: 0.18,
    }), {
      y: 0.09 + i * 0.16,
      rx: 0.02,
      outline: true,
      thickness: 0.006,
    });
    addBox(group, 0.38, 0.08, 0.04, SHARED.darkMetal, {
      y: 0.17 + i * 0.16,
      z: 0.21,
      cast: false,
    });
  }
  return group;
}

function makeCeilingGroup() {
  const group = new THREE.Group();
  addBox(group, 11.15, 0.09, 13.45, SHARED.interiorCeil, {
    x: -2.2,
    y: CEIL_Y + 0.06,
    z: -4.15,
    receive: true,
    cast: false,
  });
  // structural beams
  for (const z of [0.6, -2.6, -5.8, -9.0]) {
    addBox(group, 10.85, 0.13, 0.12, SHARED.teal, {
      x: -2.2,
      y: CEIL_Y - 0.035,
      z,
      cast: false,
    });
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2d2 });
  for (const z of [1.05, -1.3, -3.9, -6.4, -9.0]) {
    addBox(group, 8.8, 0.035, 0.2, lightMat, {
      x: -2.2,
      y: CEIL_Y - 0.11,
      z,
      cast: false,
      receive: false,
    });
    addBox(group, 8.96, 0.05, 0.31, toonMat(0xe7dcc8, { emissive: 0x3a2b16, emissiveIntensity: 0.3 }), {
      x: -2.2,
      y: CEIL_Y - 0.08,
      z,
      cast: false,
    });
  }
  // small spotlights around the counter / entrance
  for (const [x, z] of [
    [1.25, -1.2],
    [1.25, -2.9],
    [-1.2, 1.2],
    [-6.4, 0.8],
  ]) {
    addCylinder(group, 0.07, 0.07, 0.045, SHARED.darkMetal, {
      x,
      y: CEIL_Y - 0.11,
      z,
      segments: 10,
      cast: false,
    });
    addCylinder(group, 0.055, 0.055, 0.012, basicMat(0xffe6b2), {
      x,
      y: CEIL_Y - 0.135,
      z,
      segments: 10,
      cast: false,
    });
  }
  // air vents
  for (const [x, z] of [
    [-5.0, -7.8],
    [1.2, -7.4],
  ]) {
    addBox(group, 0.6, 0.02, 0.34, SHARED.darkMetal, {
      x,
      y: CEIL_Y - 0.075,
      z,
      cast: false,
    });
    for (let i = 0; i < 4; i++) {
      addBox(group, 0.54, 0.008, 0.035, SHARED.metal, {
        x,
        y: CEIL_Y - 0.09,
        z: z - 0.12 + i * 0.08,
        cast: false,
      });
    }
  }
  return group;
}

function makeBackWallDecor() {
  const group = new THREE.Group();
  // small back door and service corner on the right of the fridges
  addBox(group, 0.9, 2.05, 0.08, toonMat(0xb7aa93, { emissive: 0x1d1811, emissiveIntensity: 0.25 }), {
    x: 2.3,
    y: FLOOR_Y + 1.02,
    z: -10.76,
    outline: true,
    thickness: 0.012,
  });
  addBox(group, 0.62, 1.32, 0.035, toonMat(0xc7b79d), {
    x: 2.3,
    y: FLOOR_Y + 1.25,
    z: -10.71,
  });
  addCylinder(group, 0.02, 0.02, 0.16, SHARED.metal, {
    x: 2.62,
    y: FLOOR_Y + 1.0,
    z: -10.67,
    segments: 6,
  });
  const posterTex = makeWallPosterSmall();
  addBox(group, 1.1, 1.55, 0.05, toonMat(0xf1e7d2), {
    x: 2.55,
    y: FLOOR_Y + 2.2,
    z: -10.72,
    outline: true,
    thickness: 0.008,
  });
  addPlane(group, 1.02, 1.46, basicMat(0xffffff, { map: posterTex }), {
    x: 2.55,
    y: FLOOR_Y + 2.2,
    z: -10.69,
  });
  // ceiling AC cassette / vent above fridges
  addBox(group, 1.35, 0.2, 0.65, SHARED.creamShade, {
    x: 2.2,
    y: 2.84,
    z: -9.95,
    outline: true,
    thickness: 0.01,
  });
  addBox(group, 1.16, 0.045, 0.52, SHARED.darkMetal, {
    x: 2.2,
    y: 2.72,
    z: -9.95,
    cast: false,
  });
  for (let i = 0; i < 4; i++) {
    addBox(group, 1.06, 0.01, 0.04, SHARED.metal, {
      x: 2.2,
      y: 2.7,
      z: -10.12 + i * 0.11,
      cast: false,
    });
  }
  return group;
}

export function makeExteriorAC(scale = 1) {
  const g = new THREE.Group();
  const bodyMat = toonMat(0xd8d3c0, { emissive: 0x1d1c17, emissiveIntensity: 0.25 });
  const dark = SHARED.darkMetal;
  addBox(g, 0.84 * scale, 0.67 * scale, 0.33 * scale, bodyMat, {
    y: 0.34 * scale,
    r: 0.035,
    outline: true,
    thickness: 0.009,
  });
  addCylinder(g, 0.23 * scale, 0.23 * scale, 0.025 * scale, dark, {
    x: -0.18 * scale,
    y: 0.34 * scale,
    z: 0.17 * scale,
    rx: Math.PI / 2,
    segments: 18,
    cast: false,
  });
  for (let i = 0; i < 3; i++) {
    addTorus(g, 0.18 * scale + i * 0.018, 0.007 * scale, SHARED.metal, {
      x: -0.18 * scale,
      y: 0.34 * scale,
      z: 0.19 * scale,
      radialSegments: 4,
      tubularSegments: 20,
      cast: false,
    });
  }
  addBox(g, 0.37 * scale, 0.42 * scale, 0.02 * scale, dark, {
    x: 0.21 * scale,
    y: 0.35 * scale,
    z: 0.175 * scale,
    cast: false,
  });
  for (let i = 0; i < 6; i++) {
    addBox(g, 0.3 * scale, 0.018 * scale, 0.018 * scale, SHARED.metal, {
      x: 0.21 * scale,
      y: (0.22 + i * 0.06) * scale,
      z: 0.19 * scale,
      cast: false,
    });
  }
  // little pipes
  addCylinder(g, 0.018 * scale, 0.018 * scale, 0.5 * scale, SHARED.metal, {
    x: 0.47 * scale,
    y: 0.06 * scale,
    z: -0.02,
    segments: 6,
    cast: false,
  });
  return g;
}

function makeLowerShell() {
  const group = new THREE.Group();
  // foundation
  addBox(group, 11.1, 0.2, 13.8, SHARED.tealDark, {
    x: -2.2,
    y: 0.1,
    z: -4.15,
    cast: false,
    receive: true,
    outline: true,
    thickness: 0.018,
  });
  addBox(group, 10.8, 0.06, 13.5, SHARED.teal, {
    x: -2.2,
    y: 0.19,
    z: -4.15,
    cast: false,
    receive: true,
  });
  // kickplates around glass
  addBox(group, 8.55, 0.32, 0.15, SHARED.tealDark, {
    x: -3.43,
    y: 0.37,
    z: SZ1,
    outline: true,
    thickness: 0.012,
  });
  addBox(group, 0.15, 0.32, 2.77, SHARED.tealDark, {
    x: SX1,
    y: 0.37,
    z: -0.97,
    outline: true,
    thickness: 0.012,
  });
  // left, back and right walls
  addBox(group, 0.24, GF_TOP, 13.5, SHARED.wall, {
    x: SX0,
    y: GF_TOP / 2,
    z: -4.15,
    receive: true,
    outline: true,
    thickness: 0.019,
  });
  addBox(group, 11.1, GF_TOP, 0.24, SHARED.wall, {
    x: -2.2,
    y: GF_TOP / 2,
    z: SZ0,
    receive: true,
    outline: true,
    thickness: 0.019,
  });
  addBox(group, 0.24, GF_TOP, 8.7, toonMat(0xb8a68e, {
    emissive: 0x1c1710,
    emissiveIntensity: 0.25,
  }), {
    x: SX1,
    y: GF_TOP / 2,
    z: -6.55,
    receive: true,
    outline: true,
    thickness: 0.019,
  });
  // right side wall above the side window
  addBox(group, 0.24, 0.55, 2.77, SHARED.wall, {
    x: SX1,
    y: 3.27,
    z: -0.97,
    receive: true,
  });
  // cream / tiled banding on outer walls
  addBox(group, 11.18, 0.1, 0.27, toonMat(0xcbb99c), {
    x: -2.2,
    y: 1.02,
    z: SZ0 - 0.015,
  });
  addBox(group, 11.18, 0.12, 0.27, SHARED.mint, {
    x: -2.2,
    y: 0.56,
    z: SZ0 - 0.015,
  });
  addBox(group, 0.27, 0.1, 13.55, toonMat(0xcbb99c), {
    x: SX0 - 0.015,
    y: 1.02,
    z: -4.15,
  });
  // structural front columns
  for (const x of [-7.52, -4.5, 0.72]) {
    addBox(group, 0.31, GF_TOP, 0.31, SHARED.wall, {
      x,
      y: GF_TOP / 2,
      z: SZ1,
      outline: true,
      thickness: 0.013,
    });
    addBox(group, 0.35, 0.22, 0.35, SHARED.teal, {
      x,
      y: 0.28,
      z: SZ1,
      outline: true,
      thickness: 0.01,
    });
    addBox(group, 0.35, 0.07, 0.35, SHARED.mint, {
      x,
      y: 0.44,
      z: SZ1,
      cast: false,
    });
  }
  // chamfer columns
  const chamfer = new THREE.Group();
  chamfer.position.set((0.72 + SX1) / 2, 0, (SZ1 + 0.3) / 2);
  chamfer.rotation.y = Math.PI / 4;
  group.add(chamfer);
  for (const lx of [-1.68, 1.68]) {
    addBox(chamfer, 0.3, GF_TOP, 0.3, SHARED.wall, {
      x: lx,
      y: GF_TOP / 2,
      outline: true,
      thickness: 0.013,
    });
    addBox(chamfer, 0.34, 0.22, 0.34, SHARED.teal, {
      x: lx,
      y: 0.28,
      outline: true,
      thickness: 0.01,
    });
  }
  // right corner column at z=.3
  addBox(group, 0.31, GF_TOP, 0.31, SHARED.wall, {
    x: SX1,
    y: GF_TOP / 2,
    z: 0.3,
    outline: true,
    thickness: 0.013,
  });
  // side columns along shopfront
  for (const z of [-1.2, -2.28]) {
    addBox(group, 0.31, 0.32, 0.31, SHARED.wall, {
      x: SX1,
      y: 0.4,
      z,
      outline: true,
      thickness: 0.01,
    });
  }
  // transom band / fascia backing all around
  addBox(group, 8.8, 0.5, 0.33, SHARED.cream, {
    x: -3.4,
    y: 3.28,
    z: SZ1 + 0.02,
    receive: true,
    outline: true,
    thickness: 0.016,
  });
  addBox(group, 0.33, 0.5, 2.93, SHARED.cream, {
    x: SX1 + 0.02,
    y: 3.28,
    z: -0.99,
    receive: true,
    outline: true,
    thickness: 0.016,
  });
  // front sill ledge
  addBox(group, 8.45, 0.08, 0.22, SHARED.mint, {
    x: -3.38,
    y: 0.5,
    z: SZ1 + 0.04,
    cast: false,
  });
  addBox(group, 0.22, 0.08, 2.75, SHARED.mint, {
    x: SX1 + 0.04,
    y: 0.5,
    z: -0.98,
    cast: false,
  });
  // interior floor
  const floorTex = makeFloorTexture();
  const floor = addPlane(
    group,
    10.7,
    13.2,
    toonMat(0xffffff, {
      map: floorTex,
      emissive: 0x23180d,
      emissiveIntensity: 0.24,
    }),
    { x: -2.2, y: FLOOR_Y, z: -4.14, rx: -Math.PI / 2, receive: true }
  );
  // long mint walkway leading from the entrance into the store
  addBox(group, 1.7, 0.022, 10.7, toonMat(0x5f7f77, {
    emissive: 0x12201c,
    emissiveIntensity: 0.24,
  }), {
    x: 0.55,
    y: FLOOR_Y + 0.012,
    z: -4.35,
    cast: false,
    receive: true,
  });
  for (let i = 0; i < 5; i++) {
    addPlane(group, 1.62, 0.035, toonMat(0xa6c5b7, { emissive: 0x233027, emissiveIntensity: 0.25 }), {
      x: 0.55,
      y: FLOOR_Y + 0.026,
      z: 0.8 - i * 2.2,
      rx: -Math.PI / 2,
      cast: false,
    });
  }
  // faint entry mat just inside
  addBox(group, 1.4, 0.03, 0.8, toonMat(0x4d6661, { emissive: 0x101918, emissiveIntensity: 0.22 }), {
    x: 1.55,
    y: FLOOR_Y + 0.02,
    z: 1.02,
    ry: -Math.PI / 4,
    cast: false,
  });
  // low interior rear skirting
  addBox(group, 10.7, 0.11, 0.06, SHARED.teal, {
    x: -2.2,
    y: FLOOR_Y + 0.055,
    z: SZ0 + 0.13,
  });
  // service pipes / downpipes on outer corners
  addCylinder(group, 0.065, 0.065, GF_TOP + 0.3, SHARED.darkMetal, {
    x: -7.4,
    y: (GF_TOP + 0.3) / 2,
    z: 2.46,
    segments: 7,
    outline: true,
    thickness: 0.008,
  });
  addCylinder(group, 0.045, 0.045, GF_TOP, SHARED.darkMetal, {
    x: 3.04,
    y: GF_TOP / 2,
    z: -10.7,
    segments: 7,
  });
  // small exterior wall lights and meter boxes
  addBox(group, 0.34, 0.42, 0.12, SHARED.creamShade, {
    x: 3.06,
    y: 1.6,
    z: -8.8,
    outline: true,
    thickness: 0.007,
  });
  addBox(group, 0.24, 0.3, 0.02, SHARED.darkMetal, {
    x: 3.06,
    y: 1.6,
    z: -8.73,
    cast: false,
  });
  addCylinder(group, 0.06, 0.075, 0.17, SHARED.darkMetal, {
    x: 3.28,
    y: 2.3,
    z: -8.8,
    rx: Math.PI / 2,
    segments: 8,
    outline: true,
    thickness: 0.007,
  });
  // back door
  addBox(group, 0.9, 2.0, 0.08, toonMat(0x718079, { emissive: 0x121b18, emissiveIntensity: 0.25 }), {
    x: 1.7,
    y: 1.1,
    z: SZ0 - 0.06,
    outline: true,
    thickness: 0.01,
  });
  addBox(group, 0.8, 0.04, 0.13, SHARED.mint, {
    x: 1.7,
    y: 2.12,
    z: SZ0 - 0.06,
    cast: false,
  });
  return group;
}

function makeGlassGroup() {
  const group = new THREE.Group();
  const frame = toonMat(0x285b5c, { emissive: 0x081718, emissiveIntensity: 0.3 });
  const glass = SHARED.glass;
  const sheenTex = makeWindowSheen();
  const sheenMat = new THREE.MeshBasicMaterial({
    map: sheenTex,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const rainGlassTex = makeGlassRainTexture();
  const rainGlassMat = new THREE.MeshBasicMaterial({
    map: rainGlassTex,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  // front fixed glass, three bays (slightly varied)
  const frontPanels = [
    [-7.4, -4.7],
    [-4.36, -2.2],
    [-1.86, 0.55],
  ];
  for (const [a, b] of frontPanels) {
    const w = b - a;
    addPlane(group, w, 2.5, glass, {
      x: (a + b) / 2,
      y: 1.83,
      z: SZ1 + 0.035,
      renderOrder: 6,
      receive: false,
    });
    addPlane(group, w - 0.08, 2.42, sheenMat, {
      x: (a + b) / 2,
      y: 1.84,
      z: SZ1 + 0.05,
      renderOrder: 7,
      receive: false,
    });
    addPlane(group, w - 0.12, 2.36, rainGlassMat, {
      x: (a + b) / 2,
      y: 1.84,
      z: SZ1 + 0.062,
      renderOrder: 8,
      receive: false,
    });
    addBox(group, 0.06, 2.48, 0.12, frame, {
      x: a,
      y: 1.83,
      z: SZ1 + 0.07,
      outline: true,
      thickness: 0.005,
      cast: false,
    });
    addBox(group, 0.06, 2.48, 0.12, frame, {
      x: b,
      y: 1.83,
      z: SZ1 + 0.07,
      outline: true,
      thickness: 0.005,
      cast: false,
    });
    addBox(group, w, 0.07, 0.12, frame, {
      x: (a + b) / 2,
      y: 3.06,
      z: SZ1 + 0.07,
      cast: false,
    });
    addBox(group, w, 0.08, 0.12, frame, {
      x: (a + b) / 2,
      y: 0.62,
      z: SZ1 + 0.07,
      cast: false,
    });
  }
  // side glass
  addPlane(group, 2.42, 2.5, glass, {
    x: SX1 + 0.035,
    y: 1.83,
    z: -0.98,
    ry: Math.PI / 2,
    renderOrder: 6,
    receive: false,
  });
  addPlane(group, 2.34, 2.42, sheenMat, {
    x: SX1 + 0.055,
    y: 1.84,
    z: -0.98,
    ry: Math.PI / 2,
    renderOrder: 7,
    receive: false,
  });
  addPlane(group, 2.28, 2.36, rainGlassMat, {
    x: SX1 + 0.062,
    y: 1.84,
    z: -0.98,
    ry: Math.PI / 2,
    renderOrder: 8,
    receive: false,
  });
  for (const z of [-2.24, 0.25]) {
    addBox(group, 0.12, 2.48, 0.06, frame, {
      x: SX1 + 0.07,
      y: 1.83,
      z,
      outline: true,
      thickness: 0.005,
      cast: false,
    });
  }
  addBox(group, 0.12, 0.07, 2.52, frame, {
    x: SX1 + 0.07,
    y: 3.06,
    z: -1.0,
    cast: false,
  });
  addBox(group, 0.12, 0.08, 2.52, frame, {
    x: SX1 + 0.07,
    y: 0.62,
    z: -1.0,
    cast: false,
  });
  // automatic entrance on the chamfer
  const door = new THREE.Group();
  door.position.set((0.72 + SX1) / 2, 0, (SZ1 + 0.3) / 2);
  door.rotation.y = Math.PI / 4;
  group.add(door);
  const doorW = 3.1;
  addPlane(door, doorW, 2.5, glass, {
    y: 1.83,
    z: 0.035,
    renderOrder: 6,
  });
  addPlane(door, doorW - 0.1, 2.42, sheenMat, {
    y: 1.84,
    z: 0.05,
    renderOrder: 7,
  });
  addPlane(door, doorW - 0.14, 2.36, rainGlassMat, {
    y: 1.84,
    z: 0.062,
    renderOrder: 8,
  });
  // framing: outer + center seam
  addBox(door, 0.09, 2.5, 0.12, frame, {
    x: -doorW / 2 + 0.03,
    y: 1.83,
    z: 0.08,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  addBox(door, 0.09, 2.5, 0.12, frame, {
    x: doorW / 2 - 0.03,
    y: 1.83,
    z: 0.08,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  addBox(door, 0.055, 2.42, 0.13, frame, {
    y: 1.82,
    z: 0.09,
    outline: true,
    thickness: 0.005,
    cast: false,
  });
  addBox(door, doorW, 0.075, 0.13, frame, {
    y: 3.07,
    z: 0.09,
    cast: false,
  });
  addBox(door, doorW, 0.16, 0.13, frame, {
    y: 0.52,
    z: 0.09,
    cast: false,
  });
  // door handles
  for (const x of [-0.26, 0.26]) {
    addCylinder(door, 0.022, 0.022, 0.62, SHARED.metal, {
      x,
      y: 1.6,
      z: 0.17,
      segments: 7,
      outline: true,
      thickness: 0.005,
      cast: false,
    });
    addCylinder(door, 0.028, 0.028, 0.04, SHARED.metal, {
      x,
      y: 1.25,
      z: 0.17,
      rx: Math.PI / 2,
      segments: 7,
      cast: false,
    });
  }
  // sticker layer
  const decalTex = makeDoorDecal();
  addPlane(door, 0.62, 1.05, basicMat(0xffffff, {
    map: decalTex,
    transparent: true,
    depthWrite: false,
  }), {
    x: -0.74,
    y: 1.58,
    z: 0.062,
    renderOrder: 8,
  });
  // sensor and green light above door
  addBox(door, 0.34, 0.12, 0.08, SHARED.darkMetal, {
    y: 2.62,
    z: 0.18,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  addBox(door, 0.035, 0.025, 0.018, basicMat(0x8ef2bb), {
    x: 0.08,
    y: 2.62,
    z: 0.23,
    cast: false,
  });
  // little 24h neon over entrance, inside glass
  addBox(door, 0.8, 0.22, 0.08, basicMat(0xf0a85d), {
    x: 0.8,
    y: 2.68,
    z: 0.21,
    cast: false,
  });
  addPlane(door, 0.75, 0.18, basicMat(0x5b3424, {
    map: makeAisleSign('24H', 'OPEN EVERYDAY', '#ffcf87'),
  }), {
    x: 0.8,
    y: 2.68,
    z: 0.255,
    cast: false,
  });
  return group;
}

function makeUpperShell() {
  const group = new THREE.Group();
  group.position.y = 4.5;
  // second-story walls
  addBox(group, 11.1, 2.78, 0.24, toonMat(COL.wallUpper, {
    emissive: 0x1b1710,
    emissiveIntensity: 0.28,
  }), {
    x: -2.2,
    y: 1.39,
    z: SZ1,
    outline: true,
    thickness: 0.018,
  });
  addBox(group, 0.24, 2.78, 13.5, toonMat(COL.wallUpper, {
    emissive: 0x1b1710,
    emissiveIntensity: 0.28,
  }), {
    x: SX1,
    y: 1.39,
    z: -4.15,
    outline: true,
    thickness: 0.018,
  });
  addBox(group, 0.24, 2.78, 13.5, toonMat(COL.wallUpper, {
    emissive: 0x1b1710,
    emissiveIntensity: 0.28,
  }), {
    x: SX0,
    y: 1.39,
    z: -4.15,
    outline: true,
    thickness: 0.018,
  });
  addBox(group, 11.1, 2.78, 0.24, toonMat(COL.wallUpper, {
    emissive: 0x1b1710,
    emissiveIntensity: 0.28,
  }), {
    x: -2.2,
    y: 1.39,
    z: SZ0,
    outline: true,
    thickness: 0.018,
  });
  // facade trim
  addBox(group, 11.24, 0.11, 0.28, SHARED.mint, {
    x: -2.2,
    y: 0.09,
    z: SZ1,
    cast: false,
  });
  addBox(group, 11.22, 0.08, 0.28, toonMat(0x4d5a58), {
    x: -2.2,
    y: 0.52,
    z: SZ1,
    cast: false,
  });
  addBox(group, 0.28, 0.1, 13.6, SHARED.mint, {
    x: SX1,
    y: 0.09,
    z: -4.15,
    cast: false,
  });
  // windows with warm interiors and frames
  const winData = [
    {
      x: -5.3,
      w: 2.15,
      tex: makeWarmWindow(0),
      lit: true,
      rail: true,
    },
    {
      x: -1.25,
      w: 2.55,
      tex: makeWarmWindow(2),
      lit: false,
      rail: false,
    },
  ];
  for (const win of winData) {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(win.x, 1.34, SZ1 + 0.14);
    group.add(frameGroup);
    addBox(frameGroup, win.w + 0.18, 1.5, 0.13, SHARED.tealDark, {
      outline: true,
      thickness: 0.011,
    });
    addPlane(frameGroup, win.w, 1.34, basicMat(win.lit ? 0xffffff : 0xb3b6b2, {
      map: win.tex,
    }), {
      z: 0.075,
    });
    // frame bars
    addBox(frameGroup, 0.045, 1.34, 0.06, SHARED.darkMetal, {
      z: 0.1,
      cast: false,
    });
    addBox(frameGroup, win.w, 0.045, 0.06, SHARED.darkMetal, {
      z: 0.1,
      cast: false,
    });
    if (win.rail) {
      for (const barY of [0.55, 0.79, 1.03, 1.27]) {
        addBox(frameGroup, win.w + 0.18, 0.025, 0.025, SHARED.metal, {
          y: barY,
          z: 0.32,
          cast: false,
        });
      }
      for (const x of [-win.w / 2, win.w / 2]) {
        addBox(frameGroup, 0.03, 0.8, 0.03, SHARED.metal, {
          x,
          y: 0.91,
          z: 0.32,
          cast: false,
        });
      }
    }
  }
  // side upper windows on right wall
  for (const [z, tex, lit] of [
    [-2.7, makeWarmWindow(1), true],
    [-7.8, makeWarmWindow(0), false],
  ]) {
    const fg = new THREE.Group();
    fg.position.set(SX1 + 0.14, 1.34, z);
    fg.rotation.y = Math.PI / 2;
    group.add(fg);
    addBox(fg, 1.3, 1.35, 0.12, SHARED.tealDark, {
      outline: true,
      thickness: 0.011,
      cast: false,
    });
    addPlane(fg, 1.14, 1.19, basicMat(lit ? 0xffffff : 0xa9aba7, { map: tex }), {
      z: 0.068,
    });
    addBox(fg, 1.14, 0.04, 0.05, SHARED.darkMetal, { z: 0.1, cast: false });
    addBox(fg, 0.04, 1.19, 0.05, SHARED.darkMetal, { z: 0.1, cast: false });
  }
  // pipes, vents, downpipes
  addCylinder(group, 0.055, 0.055, 2.6, SHARED.darkMetal, {
    x: -7.4,
    y: 1.3,
    z: SZ1 + 0.18,
    segments: 7,
    outline: true,
    thickness: 0.007,
  });
  addBox(group, 0.7, 0.5, 0.14, SHARED.creamShade, {
    x: 1.95,
    y: 0.7,
    z: SZ1 + 0.15,
    outline: true,
    thickness: 0.01,
    cast: false,
  });
  for (let i = 0; i < 6; i++) {
    addBox(group, 0.54, 0.018, 0.025, SHARED.metal, {
      x: 1.95,
      y: 0.54 + i * 0.06,
      z: SZ1 + 0.23,
      cast: false,
    });
  }
  // second-floor balcony under the left window
  addBox(group, 2.56, 0.13, 0.72, toonMat(0x8d806b, {
    emissive: 0x19140e,
    emissiveIntensity: 0.25,
  }), {
    x: -5.3,
    y: 0.63,
    z: SZ1 + 0.39,
    outline: true,
    thickness: 0.009,
  });
  for (const y of [0.88, 1.24]) {
    addBox(group, 2.5, 0.03, 0.03, SHARED.metal, {
      x: -5.3,
      y,
      z: SZ1 + 0.72,
      cast: false,
    });
  }
  for (const x of [-6.54, -4.06]) {
    addBox(group, 0.03, 0.36, 0.03, SHARED.metal, {
      x,
      y: 0.93,
      z: SZ1 + 0.72,
      cast: false,
    });
  }
  for (let i = 0; i < 10; i++) {
    addBox(group, 0.018, 0.29, 0.018, SHARED.metal, {
      x: -6.4 + i * 0.24,
      y: 0.96,
      z: SZ1 + 0.72,
      cast: false,
    });
  }
  // balcony plants and a little awning above the right window
  for (const [x, z, s] of [
    [-6.15, SZ1 + 0.47, 0.85],
    [-4.35, SZ1 + 0.5, 0.7],
  ]) {
    addCylinder(group, 0.16 * s, 0.12 * s, 0.24 * s, toonMat(0x95684c), {
      x,
      y: 0.82,
      z,
      segments: 8,
      outline: true,
      thickness: 0.004,
    });
    addSphere(group, 0.28 * s, toonMat(0x3f7055, {
      emissive: 0x0e1a12,
      emissiveIntensity: 0.25,
    }), {
      x,
      y: 1.07,
      z,
      sy: 0.7,
      sx: 1.05,
      outline: true,
      thickness: 0.006,
    });
  }
  const upperAwning = new THREE.Group();
  upperAwning.position.set(-1.25, 2.28, SZ1 + 0.14);
  group.add(upperAwning);
  addBox(upperAwning, 2.9, 0.055, 0.6, toonMat(0x3e7169, {
    emissive: 0x0a1714,
    emissiveIntensity: 0.25,
  }), {
    z: 0.25,
    rx: 0.16,
    outline: true,
    thickness: 0.007,
  });
  for (let i = 0; i < 8; i++) {
    addBox(upperAwning, 0.28, 0.14, 0.035, i % 2 ? SHARED.cream : SHARED.mint, {
      x: -1.27 + i * 0.36,
      y: -0.14,
      z: 0.53,
      cast: false,
    });
  }
  for (const x of [-1.25, 1.25]) {
    addCylinderBetween(upperAwning, [x, -0.02, 0.05], [x, 0.22, 0.52], 0.014, SHARED.darkMetal, {
      segments: 4,
      cast: false,
    });
  }
  // warm wall light beside the windows
  addBox(group, 0.16, 0.24, 0.12, SHARED.darkMetal, {
    x: 2.65,
    y: 1.55,
    z: SZ1 + 0.16,
    outline: true,
    thickness: 0.004,
    cast: false,
  });
  addSphere(group, 0.06, basicMat(0xffcb87), {
    x: 2.65,
    y: 1.5,
    z: SZ1 + 0.24,
    sy: 0.7,
    cast: false,
  });

  // roof floor + parapet
  addBox(group, 11.35, 0.2, 13.75, toonMat(0x4d5654, {
    emissive: 0x111514,
    emissiveIntensity: 0.3,
  }), {
    x: -2.2,
    y: 2.84,
    z: -4.15,
    outline: true,
    thickness: 0.018,
  });
  const parapetMat = toonMat(0x7f8277, { emissive: 0x171813, emissiveIntensity: 0.2 });
  addBox(group, 11.4, 0.38, 0.14, parapetMat, {
    x: -2.2,
    y: 3.08,
    z: SZ1 - 0.24,
    outline: true,
    thickness: 0.009,
  });
  addBox(group, 11.4, 0.38, 0.14, parapetMat, {
    x: -2.2,
    y: 3.08,
    z: SZ0 + 0.24,
    outline: true,
    thickness: 0.009,
  });
  addBox(group, 0.14, 0.38, 13.6, parapetMat, {
    x: SX1 - 0.19,
    y: 3.08,
    z: -4.15,
    outline: true,
    thickness: 0.009,
  });
  addBox(group, 0.14, 0.38, 13.6, parapetMat, {
    x: SX0 + 0.19,
    y: 3.08,
    z: -4.15,
    outline: true,
    thickness: 0.009,
  });
  // small AC unit on the front
  const ac = makeExteriorAC(0.94);
  ac.position.set(0.55, 0.0, SZ1 + 0.19);
  ac.rotation.y = 0;
  group.add(ac);
  addBox(group, 0.95, 0.08, 0.43, SHARED.darkMetal, {
    x: 0.55,
    y: -0.025,
    z: SZ1 + 0.25,
    cast: false,
  });
  // side AC
  const ac2 = makeExteriorAC(0.9);
  ac2.position.set(SX1 + 0.48, 0.52, -6.55);
  ac2.rotation.y = Math.PI / 2;
  group.add(ac2);
  addBox(group, 0.47, 0.07, 1.0, SHARED.darkMetal, {
    x: SX1 + 0.32,
    y: 0.46,
    z: -6.55,
    cast: false,
  });
  // roof access hatch / vent stack
  addBox(group, 0.95, 0.52, 0.9, toonMat(0x737472, { emissive: 0x171716, emissiveIntensity: 0.25 }), {
    x: -6.0,
    y: 3.13,
    z: -3.9,
    r: 0.03,
    outline: true,
    thickness: 0.01,
  });
  addCylinder(group, 0.12, 0.12, 0.9, SHARED.darkMetal, {
    x: 1.7,
    y: 3.22,
    z: -9.1,
    segments: 10,
    outline: true,
    thickness: 0.007,
  });
  addCylinder(group, 0.24, 0.24, 0.08, SHARED.metal, {
    x: 1.7,
    y: 3.68,
    z: -9.1,
    segments: 12,
  });
  // small roof stairs silhouette at the back
  for (let i = 0; i < 4; i++) {
    addBox(group, 0.6, 0.12, 0.35, SHARED.metal, {
      x: -5.9,
      y: 2.95 + i * 0.12,
      z: -7.4 - i * 0.28,
      cast: false,
    });
  }
  addBox(group, 11.0, 0.26, 0.26, SHARED.cream, {
    x: -2.2,
    y: 2.89,
    z: SZ1 - 0.03,
    outline: true,
    thickness: 0.012,
  });
  return group;
}

function makeRoofProps() {
  const group = new THREE.Group();
  group.position.y = 4.5;
  // water tank
  addBox(group, 1.65, 0.18, 1.65, toonMat(0x555f5e), {
    x: -2.1,
    y: 3.32,
    z: -6.8,
    outline: true,
    thickness: 0.012,
  });
  const standMat = SHARED.darkMetal;
  for (const [x, z] of [
    [-2.85, -7.55],
    [-1.35, -7.55],
    [-2.85, -6.05],
    [-1.35, -6.05],
  ]) {
    addBox(group, 0.08, 0.5, 0.08, standMat, {
      x,
      y: 3.58,
      z,
      cast: false,
    });
  }
  addCylinder(group, 0.58, 0.65, 1.25, toonMat(0x66706c, {
    emissive: 0x131615,
    emissiveIntensity: 0.25,
  }), {
    x: -2.1,
    y: 4.4,
    z: -6.8,
    segments: 16,
    outline: true,
    thickness: 0.013,
  });
  addCylinder(group, 0.62, 0.62, 0.07, SHARED.creamShade, {
    x: -2.1,
    y: 5.06,
    z: -6.8,
    segments: 16,
  });
  addCylinder(group, 0.1, 0.1, 0.1, SHARED.metal, {
    x: -2.1,
    y: 5.15,
    z: -6.8,
    segments: 8,
  });
  // antennas
  addCylinder(group, 0.025, 0.04, 3.4, SHARED.darkMetal, {
    x: 1.2,
    y: 4.6,
    z: -5.0,
    segments: 6,
    outline: true,
    thickness: 0.005,
  });
  for (const y of [5.35, 5.68, 6.0]) {
    addBox(group, 0.82, 0.025, 0.025, SHARED.darkMetal, {
      x: 1.2,
      y,
      z: -5.0,
      ry: 0.15,
      cast: false,
    });
  }
  // vent pipes
  for (const [x, z, h] of [
    [-6.15, -9.0, 0.7],
    [0.2, -8.7, 0.55],
    [-0.6, -2.0, 0.42],
  ]) {
    addCylinder(group, 0.08, 0.1, h, SHARED.metal, {
      x,
      y: 3.1 + h / 2,
      z,
      segments: 8,
      outline: true,
      thickness: 0.006,
    });
    addCylinder(group, 0.18, 0.18, 0.06, SHARED.darkMetal, {
      x,
      y: 3.1 + h + 0.02,
      z,
      segments: 10,
    });
  }
  // small rooftop potted shrubs
  for (const [x, z] of [
    [-6.1, 0.3],
    [0.5, 0.1],
  ]) {
    addCylinder(group, 0.22, 0.17, 0.34, toonMat(0x9b6d50), {
      x,
      y: 3.17,
      z,
      segments: 9,
    });
    addSphere(group, 0.33, toonMat(0x3d6a55), {
      x,
      y: 3.46,
      z,
      sy: 0.66,
      sx: 1.1,
      outline: true,
      thickness: 0.008,
    });
  }
  // rooftop laundry: two poles and soft cloths in the rain
  addCylinder(group, 0.025, 0.03, 1.3, SHARED.metal, {
    x: -5.4,
    y: 3.75,
    z: 0.1,
    segments: 6,
    outline: true,
    thickness: 0.004,
  });
  addCylinder(group, 0.025, 0.03, 1.3, SHARED.metal, {
    x: -2.75,
    y: 3.75,
    z: 0.1,
    segments: 6,
    outline: true,
    thickness: 0.004,
  });
  addCylinderBetween(group, [-5.4, 4.35, 0.1], [-2.75, 4.35, 0.1], 0.008, SHARED.darkMetal, {
    segments: 3,
    cast: false,
  });
  for (const [x, w, color] of [
    [-4.8, 0.75, 0xd8d5c7],
    [-3.55, 0.55, 0xe0b4b2],
  ]) {
    addPlane(group, w, 0.95, toonMat(color, {
      side: THREE.DoubleSide,
      emissive: 0x1c1a15,
      emissiveIntensity: 0.3,
    }), {
      x,
      y: 3.82,
      z: 0.1,
      rz: 0.03,
      cast: false,
    });
  }
  // tiny satellite dish for that lived-in Japanese roofline
  addCylinder(group, 0.03, 0.04, 0.7, SHARED.metal, {
    x: -0.4,
    y: 3.65,
    z: -7.6,
    segments: 5,
    cast: false,
  });
  addSphere(group, 0.34, toonMat(0xd6d2c3, {
    emissive: 0x191813,
    emissiveIntensity: 0.2,
  }), {
    x: -0.4,
    y: 3.85,
    z: -7.7,
    sx: 1.1,
    sy: 0.32,
    sz: 0.8,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  return group;
}

function makeCanopySegment(width, z, side = false) {
  const g = new THREE.Group();
  const depth = 0.78;
  addBox(g, width, 0.075, depth, toonMat(0x355f59, {
    emissive: 0x081413,
    emissiveIntensity: 0.2,
  }), {
    y: 3.15,
    z,
    rx: 0.045,
    outline: true,
    thickness: 0.012,
    cast: true,
  });
  // cream underside catches the warm light from the shop
  addBox(g, width - 0.05, 0.035, depth - 0.06, toonMat(0xe3d6bc, {
    emissive: 0x3b2a13,
    emissiveIntensity: 0.28,
  }), {
    y: 3.105,
    z: z + 0.01,
    cast: false,
  });
  // cream edge band
  addBox(g, width, 0.055, 0.06, toonMat(0xf0e4cb, {
    emissive: 0x3e301b,
    emissiveIntensity: 0.3,
  }), {
    y: 3.11,
    z: z + depth / 2,
    cast: false,
  });
  // striped valance at outer edge
  const count = Math.max(5, Math.round(width / 0.34));
  for (let i = 0; i < count; i++) {
    addBox(g, width / count - 0.015, 0.24, 0.045, i % 2 === 0 ? SHARED.mint : SHARED.cream, {
      x: -width / 2 + (i + 0.5) * (width / count),
      y: 3.0,
      z: z + depth / 2 - 0.01,
      cast: false,
    });
  }
  // slim support rods
  for (const xx of [-width / 2 + 0.18, width / 2 - 0.18]) {
    addCylinderBetween(g, [xx, 3.42, z - depth / 2 + 0.05], [xx, 3.12, z + depth / 2 - 0.02], 0.022, SHARED.darkMetal, {
      segments: 6,
      cast: false,
    });
  }
  // a warm continuous cove at the wall edge
  addBox(g, width - 0.5, 0.025, 0.03, basicMat(0xffd69a), {
    x: 0,
    y: 3.084,
    z: z - depth / 2 + 0.11,
    cast: false,
  });
  // round under-lights
  for (let i = 0; i < Math.max(2, Math.round(width / 2.2)); i++) {
    addCylinder(g, 0.06, 0.06, 0.025, SHARED.darkMetal, {
      x: -width / 2 + (i + 0.5) * (width / Math.max(2, Math.round(width / 2.2))),
      y: 3.075,
      z: z + 0.2,
      segments: 8,
      cast: false,
    });
    addCylinder(g, 0.045, 0.045, 0.015, basicMat(0xffe4ae), {
      x: -width / 2 + (i + 0.5) * (width / Math.max(2, Math.round(width / 2.2))),
      y: 3.059,
      z: z + 0.2,
      segments: 8,
      cast: false,
    });
  }
  return g;
}

// a tiny helper because mint underside should be slightly different
function SHAredSafe() {
  return SHARED.mint;
}

function makeAwning() {
  const group = new THREE.Group();
  const front = makeCanopySegment(8.72, 3.0);
  front.position.set(-3.35, 0, 0);
  group.add(front);
  const chamfer = new THREE.Group();
  chamfer.position.set((0.72 + SX1) / 2, 0, (SZ1 + 0.3) / 2);
  chamfer.rotation.y = Math.PI / 4;
  const cham = makeCanopySegment(3.3, 0.62);
  chamfer.add(cham);
  group.add(chamfer);
  const side = new THREE.Group();
  side.position.set(SX1 + 0.53, 0, -1.1);
  side.rotation.y = Math.PI / 2;
  const sideCanopy = makeCanopySegment(2.8, 0.53);
  side.add(sideCanopy);
  group.add(side);
  return group;
}

function makeSignBand() {
  const group = new THREE.Group();
  // front sign
  const frontTex = makeStoreSign('front');
  addBox(group, 8.75, 1.03, 0.2, SHARED.cream, {
    x: -3.37,
    y: 4.05,
    z: SZ1 + 0.1,
    r: 0.025,
    outline: true,
    thickness: 0.014,
  });
  addPlane(group, 8.58, 0.92, basicMat(0xffffff, { map: frontTex }), {
    x: -3.37,
    y: 4.05,
    z: SZ1 + 0.213,
  });
  // corner sign
  const chamferGroup = new THREE.Group();
  chamferGroup.position.set((0.72 + SX1) / 2, 0, (SZ1 + 0.3) / 2);
  chamferGroup.rotation.y = Math.PI / 4;
  group.add(chamferGroup);
  addBox(chamferGroup, 3.38, 1.03, 0.2, SHARED.cream, {
    y: 4.05,
    z: 0.1,
    outline: true,
    thickness: 0.012,
  });
  addPlane(chamferGroup, 3.22, 0.92, basicMat(0xffffff, { map: makeStoreSign('corner') }), {
    y: 4.05,
    z: 0.213,
  });
  // side sign
  const sideGroup = new THREE.Group();
  sideGroup.position.set(SX1 + 0.19, 0, -1.08);
  sideGroup.rotation.y = Math.PI / 2;
  group.add(sideGroup);
  addBox(sideGroup, 2.84, 1.03, 0.2, SHARED.cream, {
    y: 4.05,
    z: 0.1,
    outline: true,
    thickness: 0.012,
  });
  addPlane(sideGroup, 2.7, 0.92, basicMat(0xffffff, { map: makeStoreSign('side') }), {
    y: 4.05,
    z: 0.213,
  });
  // thin mint + coral LED trims under the sign
  addBox(group, 8.85, 0.035, 0.045, basicMat(0x9fe9d5), {
    x: -3.37,
    y: 3.51,
    z: SZ1 + 0.25,
    cast: false,
  });
  addBox(group, 8.85, 0.02, 0.03, basicMat(0xffa48e), {
    x: -3.37,
    y: 3.47,
    z: SZ1 + 0.255,
    cast: false,
  });
  // little crown stars on sign side
  const starGeo = makeStarGeometry(0.15, 0.065, 0.035);
  const starMat = toonMat(0xf4c777, { emissive: 0x4a2806, emissiveIntensity: 0.7 });
  const s1 = new THREE.Mesh(starGeo, starMat);
  s1.position.set(1.36, 4.68, SZ1 + 0.31);
  group.add(s1);
  return group;
}

function makeBladeSign() {
  const group = new THREE.Group();
  group.position.set(3.98, 5.87, 0.38);
  const tex = makeBladeSignTexture();
  addBox(group, 0.83, 2.66, 0.16, SHARED.tealDark, {
    outline: true,
    thickness: 0.014,
    r: 0.035,
  });
  addPlane(group, 0.75, 2.54, basicMat(0xffffff, { map: tex }), { z: 0.087 });
  addPlane(group, 0.75, 2.54, basicMat(0xffffff, { map: tex }), { z: -0.087, ry: Math.PI });
  // neon edge bars
  addBox(group, 0.045, 2.55, 0.045, basicMat(0xa9efda), {
    x: -0.43,
    z: 0.09,
    cast: false,
  });
  addBox(group, 0.045, 2.55, 0.045, basicMat(0xa9efda), {
    x: 0.43,
    z: 0.09,
    cast: false,
  });
  // bracket arms
  for (const y of [-0.8, 0.8]) {
    addCylinderBetween(group, [-0.42, y, 0], [-1.05, y + 0.15, -0.38], 0.035, SHARED.darkMetal, {
      segments: 7,
      cast: false,
    });
  }
  // little star cap
  const star = new THREE.Mesh(makeStarGeometry(0.24, 0.11, 0.08), toonMat(0xf0b65c, {
    emissive: 0x64370b,
    emissiveIntensity: 0.55,
  }));
  star.position.set(0, 1.5, 0);
  group.add(star);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSoftGlow(),
    color: 0x9ff6dc,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    fog: false,
  }));
  halo.scale.set(2.1, 3.8, 1);
  halo.position.set(0, 0, 0);
  group.add(halo);
  return group;
}


function makeSideMuralTexture() {
  return canvasTexture(1600, 620, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f6ead2');
    grad.addColorStop(0.58, '#ead9b9');
    grad.addColorStop(1, '#dfcca9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // mint diagonal field
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.34, 0);
    ctx.lineTo(w * 0.53, 0);
    ctx.lineTo(w * 0.19, h);
    ctx.closePath();
    ctx.fillStyle = '#79c9b8';
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.87, h);
    ctx.lineTo(w * 1.0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w * 0.93, h);
    ctx.closePath();
    ctx.fillStyle = '#e17a68';
    ctx.fill();
    ctx.restore();
    // crisp inner frame
    ctx.strokeStyle = '#1b5452';
    ctx.lineWidth = 12;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.strokeStyle = 'rgba(27,84,82,.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, w - 84, h - 84);
    // star emblem
    ctx.fillStyle = '#e17a68';
    ctx.beginPath();
    ctx.arc(202, 228, 105, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5452';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.fillStyle = '#f8edd7';
    drawStar2D(ctx, 202, 228, 68, 30, 5, -Math.PI / 2);
    ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1b4e4d';
    ctx.font = `900 152px ${DISPLAY_FONT}`;
    ctx.letterSpacing = '7px';
    ctx.fillText('HOSHI MART', 350, 205);
    ctx.font = `700 46px ${JP_FONT}`;
    ctx.letterSpacing = '9px';
    ctx.fillStyle = '#c56c5e';
    ctx.fillText('ほしまーと ・ 星見町', 356, 292);
    ctx.font = `600 29px ${JP_FONT}`;
    ctx.letterSpacing = '3px';
    ctx.fillStyle = '#42635d';
    ctx.fillText('あかるい くらしの まんなか。', 356, 356);
    // simple product line drawings
    ctx.strokeStyle = '#1b5452';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    // cup
    ctx.beginPath();
    ctx.moveTo(360, 428);
    ctx.lineTo(482, 428);
    ctx.lineTo(462, 540);
    ctx.lineTo(380, 540);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(352, 420);
    ctx.lineTo(490, 420);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(392 + i * 28, 402);
      ctx.bezierCurveTo(374 + i * 28, 374, 416 + i * 28, 356, 396 + i * 28, 332);
      ctx.stroke();
    }
    // onigiri
    ctx.beginPath();
    ctx.moveTo(545, 518);
    ctx.lineTo(620, 404);
    ctx.lineTo(695, 518);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#1b5452';
    ctx.fillRect(596, 468, 48, 30);
    // cup noodles
    ctx.strokeRect(752, 430, 108, 120);
    ctx.beginPath();
    ctx.moveTo(752, 462);
    ctx.lineTo(860, 462);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(782, 404);
    ctx.quadraticCurveTo(806, 386, 830, 404);
    ctx.stroke();
    // right badges
    ctx.fillStyle = '#1b4e4d';
    ctx.beginPath();
    ctx.arc(w - 245, 240, 108, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7edd7';
    ctx.textAlign = 'center';
    ctx.font = `800 68px ${DISPLAY_FONT}`;
    ctx.fillText('24H', w - 245, 226);
    ctx.font = `700 24px ${MONO_FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillText('OPEN EVERYDAY', w - 245, 283);
    // bottom strip
    ctx.fillStyle = '#1b5452';
    ctx.fillRect(0, h - 54, w, 32);
    ctx.fillStyle = '#f6ead2';
    ctx.font = `600 22px ${MONO_FONT}`;
    ctx.textAlign = 'left';
    ctx.letterSpacing = '5px';
    ctx.fillText('COFFEE    ATM    HOT SNACK    COPIES', 60, h - 38);
  });
}

function makeVendingCanopy() {
  const g = new THREE.Group();
  const awning = toonMat(0x396c65, {
    emissive: 0x081614,
    emissiveIntensity: 0.25,
  });
  addBox(g, 1.18, 0.07, 3.3, awning, {
    x: 3.82,
    y: 2.47,
    z: -4.15,
    rz: -0.045,
    outline: true,
    thickness: 0.009,
    cast: true,
  });
  addBox(g, 1.08, 0.025, 3.2, toonMat(0xf0e3ca, {
    emissive: 0x3e2d18,
    emissiveIntensity: 0.35,
  }), {
    x: 3.82,
    y: 2.425,
    z: -4.15,
    cast: false,
  });
  for (let i = 0; i < 9; i++) {
    addBox(g, 0.04, 0.18, 0.33, i % 2 ? SHARED.cream : SHARED.mint, {
      x: 4.4,
      y: 2.34,
      z: -5.62 + i * 0.37,
      cast: false,
    });
  }
  for (const z of [-5.5, -2.8]) {
    addCylinderBetween(g, [3.25, 2.75, z], [4.38, 2.48, z], 0.018, SHARED.darkMetal, {
      segments: 5,
      cast: false,
    });
  }
  for (const z of [-5.25, -4.15, -3.05]) {
    addCylinder(g, 0.045, 0.045, 0.018, basicMat(0xffe0a5), {
      x: 4.1,
      y: 2.42,
      z,
      segments: 8,
      cast: false,
    });
  }
  return g;
}

function makeSideDressing() {
  const group = new THREE.Group();
  // a large baked wall advert
  const muralTex = makeSideMuralTexture();
  addBox(group, 0.09, 1.45, 4.75, SHARED.tealDark, {
    x: 3.36,
    y: 2.64,
    z: -6.4,
    outline: true,
    thickness: 0.009,
    cast: false,
  });
  addPlane(group, 4.61, 1.32, basicMat(0xffffff, { map: muralTex }), {
    x: 3.422,
    y: 2.64,
    z: -6.4,
    ry: Math.PI / 2,
  });
  // service door near the rear
  addBox(group, 0.07, 2.05, 0.95, toonMat(0x416b65, {
    emissive: 0x0b1816,
    emissiveIntensity: 0.25,
  }), {
    x: 3.36,
    y: 1.04,
    z: -9.52,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  addBox(group, 0.09, 0.06, 0.62, SHARED.metal, {
    x: 3.41,
    y: 1.52,
    z: -9.52,
    cast: false,
  });
  addCylinder(group, 0.035, 0.035, 0.08, SHARED.metal, {
    x: 3.41,
    y: 1.05,
    z: -9.13,
    rx: Math.PI / 2,
    segments: 7,
    cast: false,
  });
  // little wall lamp above door
  addBox(group, 0.17, 0.08, 0.2, SHARED.darkMetal, {
    x: 3.43,
    y: 2.25,
    z: -9.52,
    cast: false,
    outline: true,
    thickness: 0.004,
  });
  addSphere(group, 0.06, basicMat(0xffc77d), {
    x: 3.51,
    y: 2.19,
    z: -9.52,
    sy: 0.6,
    cast: false,
  });
  // utility pipes
  addCylinder(group, 0.045, 0.045, 3.3, SHARED.metal, {
    x: 3.41,
    y: 1.65,
    z: -8.95,
    segments: 7,
    cast: false,
  });
  addBox(group, 0.2, 0.46, 0.34, SHARED.creamShade, {
    x: 3.42,
    y: 2.0,
    z: -8.2,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  // long banner above the vending canopy
  const bannerTex = canvasTexture(1800, 300, (ctx, w, h) => {
    ctx.fillStyle = '#f6ead4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1a5351';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#78cbb9';
    ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = '#e07a67';
    ctx.fillRect(0, h - 18, w, 10);
    ctx.fillStyle = '#184e4d';
    ctx.textBaseline = 'middle';
    ctx.font = `800 92px ${DISPLAY_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillText('COLD DRINK', 52, 118);
    ctx.font = `700 56px ${JP_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillStyle = '#c5655b';
    ctx.fillText('つめた〜い', 720, 118);
    ctx.font = `700 60px ${JP_FONT}`;
    ctx.fillStyle = '#184e4d';
    ctx.fillText('HOT SNACK  ・  ATM  ・  COPIES', 52, 218);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1a5351';
    ctx.font = `800 58px ${DISPLAY_FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillText('OPEN 24H', w - 66, 210);
    ctx.fillStyle = '#e07a67';
    drawStar2D(ctx, w - 110, 110, 34, 15, 5, -Math.PI / 2);
    ctx.fill();
  });
  addBox(group, 0.09, 0.52, 4.7, SHARED.tealDark, {
    x: 3.36,
    y: 2.92,
    z: -4.0,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  addPlane(group, 4.58, 0.42, basicMat(0xffffff, { map: bannerTex }), {
    x: 3.412,
    y: 2.92,
    z: -4.0,
    ry: Math.PI / 2,
  });
  // thin horizontal trim bands give the long side wall some rhythm
  for (const [y, color, depth] of [
    [0.72, 0x1b5351, 7.0],
    [3.48, 0x285f5b, 7.4],
    [3.62, 0xe5d8be, 7.4],
  ]) {
    addBox(group, 0.05, 0.045, depth, toonMat(color, {
      emissive: 0x0a1413,
      emissiveIntensity: 0.25,
    }), {
      x: 3.365,
      y,
      z: -5.95,
      cast: false,
    });
  }
  // slim neon line tucked under the upper windows
  addBox(group, 0.025, 0.025, 6.4, basicMat(0x8cf0d6), {
    x: 3.405,
    y: 3.83,
    z: -5.7,
    cast: false,
  });
  // roof-edge mint neon line on the side wall
  addBox(group, 0.03, 0.035, 8.2, basicMat(0x8eebd4), {
    x: 3.36,
    y: 3.66,
    z: -6.4,
    cast: false,
  });
  return group;
}

function makeExteriorDetails() {
  const group = new THREE.Group();
  // doormat outside the chamfer
  const matTex = makeWelcomeMat();
  const mat = addPlane(
    group,
    1.7,
    0.85,
    toonMat(0xffffff, {
      map: matTex,
      emissive: 0x171f1c,
      emissiveIntensity: 0.36,
      polygonOffset: true,
    }),
    {
      x: 2.82,
      y: 0.168,
      z: 2.48,
      rx: -Math.PI / 2,
      ry: -Math.PI / 4,
    }
  );
  mat.receiveShadow = true;
  // shop-side downlights / light spill
  addPlane(group, 2.8, 0.55, basicMat(0xffddac, {
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), {
    x: 2.72,
    y: 0.17,
    z: 2.48,
    rx: -Math.PI / 2,
    ry: -Math.PI / 4,
    renderOrder: 3,
  });
  // umbrella stand holder
  addCylinder(group, 0.2, 0.18, 0.54, toonMat(0x617b77, {
    emissive: 0x101a18,
    emissiveIntensity: 0.2,
  }), {
    x: 3.32,
    y: 0.45,
    z: 1.86,
    segments: 12,
    outline: true,
    thickness: 0.008,
  });
  const umbrellaColors = [0xd75f60, 0x5eb5a8, 0x3b4e84, 0xd9b45e];
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5;
    addCylinder(group, 0.016, 0.016, 0.9, SHARED.metal, {
      x: 3.32 + Math.cos(a) * 0.07,
      y: 1.08,
      z: 1.86 + Math.sin(a) * 0.07,
      segments: 6,
      cast: false,
    });
    addCylinder(group, 0.04, 0.11, 0.52, toonMat(umbrellaColors[i], {
      emissive: 0x221111,
      emissiveIntensity: 0.25,
    }), {
      x: 3.32 + Math.cos(a) * 0.07,
      y: 1.05,
      z: 1.86 + Math.sin(a) * 0.07,
      segments: 8,
      cast: false,
      outline: true,
      thickness: 0.006,
    });
    addSphere(group, 0.045, toonMat(umbrellaColors[i]), {
      x: 3.32 + Math.cos(a) * 0.07,
      y: 1.36,
      z: 1.86 + Math.sin(a) * 0.07,
      cast: false,
    });
  }
  // window posters on the leftmost window
  const iceTex = makePoster('ice');
  addBox(group, 0.92, 1.32, 0.04, toonMat(0xf1e6d1), {
    x: -1.28,
    y: 1.4,
    z: SZ1 + 0.13,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  addPlane(group, 0.85, 1.22, toonMat(0xffffff, { map: iceTex }), {
    x: -1.28,
    y: 1.4,
    z: SZ1 + 0.155,
  });
  // oden poster on the side wall
  const odenTex = makePoster('oden');
  addBox(group, 1.14, 1.58, 0.04, toonMat(0x1a363a), {
    x: SX1 + 0.04,
    y: 1.65,
    z: -3.75,
    ry: Math.PI / 2,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  addPlane(group, 1.06, 1.5, toonMat(0xffffff, { map: odenTex }), {
    x: SX1 + 0.066,
    y: 1.65,
    z: -3.75,
    ry: Math.PI / 2,
  });
  // small wall poster right of the side window
  addPlane(group, 0.95, 1.3, toonMat(0xffffff, {
    map: makePoster('karaage'),
  }), {
    x: SX1 + 0.03,
    y: 1.85,
    z: -8.2,
    ry: Math.PI / 2,
  });
  // small brand plaques on the entrance columns
  const badgeTex = canvasTexture(256, 620, (ctx, w, h) => {
    ctx.fillStyle = '#174e50';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8cdcc9';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#f8e9cd';
    drawStar2D(ctx, w / 2, 120, 45, 19, 5, -Math.PI / 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8e9cd';
    ctx.font = `800 82px ${DISPLAY_FONT}`;
    ctx.fillText('24', w / 2, 268);
    ctx.fillText('H', w / 2, 354);
    ctx.fillStyle = '#8cdcc9';
    ctx.font = `600 21px ${JP_FONT}`;
    ctx.fillText('OPEN', w / 2, 460);
    ctx.fillText('EVERYDAY', w / 2, 492);
    ctx.fillStyle = '#e27e6d';
    ctx.fillRect(62, 540, w - 124, 4);
  });
  for (const [x, y, z, ry] of [
    [-4.5, 1.7, SZ1 + 0.18, 0],
    [SX1 + 0.18, 1.75, -0.98, Math.PI / 2],
  ]) {
    addPlane(group, 0.22, 0.54, basicMat(0xffffff, { map: badgeTex }), {
      x,
      y,
      z,
      ry,
      cast: false,
    });
  }

  // folded newspaper stand / crates on the front
  addBox(group, 0.8, 0.36, 0.5, toonMat(0x7c6e5b), {
    x: -3.25,
    y: 0.35,
    z: 3.2,
    r: 0.02,
    outline: true,
    thickness: 0.007,
    cast: false,
  });
  addBox(group, 0.68, 0.045, 0.42, toonMat(0xe8dcc4), {
    x: -3.25,
    y: 0.55,
    z: 3.2,
    cast: false,
  });
  // small magazine tab
  addBox(group, 0.5, 0.04, 0.32, toonMat(0xd7b5a4), {
    x: -3.28,
    y: 0.59,
    z: 3.2,
    ry: 0.2,
    cast: false,
  });
  return group;
}

// public factory ------------------------------------------------------------
export function buildStore(scene, intro) {
  const store = new THREE.Group();
  store.name = 'hoshimart';
  scene.add(store);

  const lower = makeLowerShell();
  store.add(lower);
  intro.add(lower, {
    start: 2.02,
    duration: 1.02,
    motion: 'growY',
    ease: 'outCubic',
  });

  const backDecor = makeBackWallDecor();
  store.add(backDecor);
  intro.add(backDecor, {
    start: 2.75,
    duration: 0.65,
    motion: 'scale',
    ease: 'outBack',
  });

  const ceiling = makeCeilingGroup();
  store.add(ceiling);
  intro.add(ceiling, {
    start: 3.3,
    duration: 0.7,
    motion: 'drop',
    distance: 1.1,
    ease: 'outCubic',
  });

  // fridge banks
  const fridgeData = [
    ['おにぎり', 'RICE & DELI', 0xefc366],
    ['お弁当', 'LUNCH BOX', 0xef8f78],
    ['飲料', 'DRINKS', 0x7cd8c6],
    ['デザート', 'SWEETS', 0xefb4cc],
  ];
  const fridgeX = [-6.22, -4.2, -2.18, -0.16];
  fridgeX.forEach((x, i) => {
    const bay = makeFridgeBay(i, x, fridgeData[i][0], fridgeData[i][1], fridgeData[i][2]);
    store.add(bay);
    intro.add(bay, {
      start: 2.72 + i * 0.12,
      duration: 0.62,
      motion: 'drop',
      distance: 1.15 + i * 0.1,
      ease: 'outBack',
    });
  });

  // aisles
  const rng = mulberry32(813);
  const shelfData = [
    { z: 0.42, label: 'お菓子', sub: 'SNACKS', accent: 0xefc765 },
    { z: -2.3, label: 'カップ麺', sub: 'NOODLES', accent: 0xef9478 },
    { z: -5.02, label: '日用品', sub: 'HOUSEHOLD', accent: 0x7ccfbe },
  ];
  shelfData.forEach((d, i) => {
    const s = makeShelfGroup(rng, d.label, d.sub, d.accent);
    s.position.set(-4.12, FLOOR_Y, d.z);
    store.add(s);
    intro.add(s, {
      start: 3.0 + i * 0.13,
      duration: 0.62,
      motion: 'drop',
      distance: 0.85 + i * 0.12,
      ease: 'outBack',
    });
  });

  const counter = makeCounter();
  store.add(counter);
  intro.add(counter, {
    start: 3.42,
    duration: 0.68,
    motion: 'drop',
    distance: 0.7,
    ease: 'outBack',
  });

  const promoGroup = new THREE.Group();
  const hotPromo = makeHangingPromo(0);
  hotPromo.position.set(0.75, 2.2, -1.15);
  hotPromo.rotation.y = 0.1;
  promoGroup.add(hotPromo);
  const coffeePromo = makeHangingPromo(1);
  coffeePromo.position.set(2.55, 2.1, -3.3);
  coffeePromo.rotation.y = -Math.PI / 2 + 0.12;
  promoGroup.add(coffeePromo);
  for (const [x, z] of [
    [-0.9, -1.0],
    [0.2, -3.0],
    [1.45, -4.85],
  ]) {
    promoGroup.add(makeCounterLamp(x, z));
  }
  store.add(promoGroup);
  intro.add(promoGroup, {
    start: 4.0,
    duration: 0.68,
    motion: 'drop',
    distance: 0.55,
    ease: 'outBack',
  });

  const magazines = makeMagazineRack();
  store.add(magazines);
  intro.add(magazines, {
    start: 3.35,
    duration: 0.6,
    motion: 'scale',
    ease: 'outBack',
  });

  const displayCooler = makeDisplayCooler();
  displayCooler.position.set(-5.95, FLOOR_Y, 1.25);
  displayCooler.rotation.y = 0.03;
  store.add(displayCooler);
  intro.add(displayCooler, {
    start: 3.34,
    duration: 0.62,
    motion: 'drop',
    distance: 0.8,
    ease: 'outBack',
  });

  const baskets = makeBasketStack();
  store.add(baskets);
  intro.add(baskets, {
    start: 3.65,
    duration: 0.55,
    motion: 'drop',
    distance: 0.55,
    ease: 'outBack',
  });

  // automatic door glass + shop windows
  const glass = makeGlassGroup();
  store.add(glass);
  intro.add(glass, {
    start: 3.62,
    duration: 0.77,
    motion: 'drop',
    distance: 0.7,
    ease: 'outBack',
  });

  // upper apartment/office block
  const upper = makeUpperShell();
  store.add(upper);
  intro.add(upper, {
    start: 3.95,
    duration: 1.02,
    motion: 'growY',
    ease: 'outCubic',
  });

  // awning wraps the corner
  const awning = makeAwning();
  store.add(awning);
  intro.add(awning, {
    start: 4.25,
    duration: 0.72,
    motion: 'drop',
    distance: 0.9,
    ease: 'outBack',
  });

  const signBand = makeSignBand();
  store.add(signBand);
  intro.add(signBand, {
    start: 4.48,
    duration: 0.8,
    motion: 'drop',
    distance: 0.85,
    ease: 'outBack',
  });

  const bladeSign = makeBladeSign();
  store.add(bladeSign);
  intro.add(bladeSign, {
    start: 4.7,
    duration: 0.78,
    motion: 'drop',
    distance: 1.1,
    ease: 'outBack',
  });

  const exteriorDetails = makeExteriorDetails();
  store.add(exteriorDetails);
  intro.add(exteriorDetails, {
    start: 4.18,
    duration: 0.65,
    motion: 'drop',
    distance: 0.45,
    ease: 'outBack',
  });

  const sideDressing = makeSideDressing();
  store.add(sideDressing);
  intro.add(sideDressing, {
    start: 4.72,
    duration: 0.64,
    motion: 'drop',
    distance: 0.45,
    ease: 'outBack',
  });

  const vendingCanopy = makeVendingCanopy();
  store.add(vendingCanopy);
  intro.add(vendingCanopy, {
    start: 4.86,
    duration: 0.56,
    motion: 'drop',
    distance: 0.35,
    ease: 'outBack',
  });

  const roofProps = makeRoofProps();
  store.add(roofProps);
  intro.add(roofProps, {
    start: 5.0,
    duration: 0.75,
    motion: 'scale',
    ease: 'outBack',
  });

  // lights: the interior is intentionally over-full and warm so that it reads
  // clearly through the glass even from the far orbit distance.
  const interiorLights = [];
  const lightData = [
    { x: -4.9, y: 2.55, z: 0.3, color: 0xffebcb, intensity: 15, distance: 8.6 },
    { x: -3.2, y: 2.55, z: -4.1, color: 0xffefd8, intensity: 16, distance: 9.0 },
    { x: -0.6, y: 2.45, z: -8.7, color: 0xfff1dc, intensity: 13, distance: 8.0 },
    { x: 1.9, y: 2.45, z: -2.4, color: 0xffce94, intensity: 9, distance: 6.4 },
    { x: -1.0, y: 2.25, z: -9.8, color: 0xd7f2ff, intensity: 6, distance: 5.8 },
  ];
  lightData.forEach((d, i) => {
    const light = new THREE.PointLight(d.color, d.intensity, d.distance, 1.6);
    light.position.set(d.x, d.y, d.z);
    store.add(light);
    intro.addLight(light, {
      start: 6.22 + i * 0.1,
      duration: 0.65,
      flicker: i < 2,
      intensity: d.intensity,
    });
    interiorLights.push(light);
  });

  const interiorSpot = new THREE.SpotLight(0xffe1b3, 25, 12, 1.18, 0.6, 1.6);
  interiorSpot.position.set(-2.4, 2.9, -3.6);
  interiorSpot.target.position.set(-2.4, 0, -4.0);
  interiorSpot.castShadow = true;
  interiorSpot.shadow.mapSize.set(1024, 1024);
  interiorSpot.shadow.camera.near = 0.2;
  interiorSpot.shadow.camera.far = 12;
  interiorSpot.shadow.bias = -0.0004;
  interiorSpot.shadow.normalBias = 0.02;
  store.add(interiorSpot);
  store.add(interiorSpot.target);
  intro.addLight(interiorSpot, { start: 6.35, duration: 0.65, intensity: 25, flicker: false });

  const shopSpill = new THREE.PointLight(0xffc783, 2.8, 7.5, 1.9);
  shopSpill.position.set(0.8, 2.6, 3.6);
  store.add(shopSpill);
  intro.addLight(shopSpill, { start: 6.55, duration: 0.8, intensity: 2.8, flicker: true });

  const signLight = new THREE.PointLight(0xffe1a9, 4.6, 6.5, 2);
  signLight.position.set(-1.8, 4.1, 3.7);
  store.add(signLight);
  intro.addLight(signLight, { start: 4.62, duration: 0.6, intensity: 4.6, flicker: true });

  const bladeLight = new THREE.PointLight(0x8ff2d5, 3.2, 5.4, 2);
  bladeLight.position.set(4.15, 6.2, 1.0);
  store.add(bladeLight);
  intro.addLight(bladeLight, { start: 5.9, duration: 0.45, intensity: 3.2, flicker: true });

  // a few interior atmospheric glows via additive sprites
  return {
    store,
    lower,
    glass,
    upper,
    signBand,
    bladeSign,
    interiorLights,
    shopSpill,
    signLight,
    bladeLight,
  };
}
