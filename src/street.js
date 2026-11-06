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
  addTube,
  basicMat,
  canvasTexture,
  glowMat,
  makeStarGeometry,
  mulberry32,
  roundRectPath,
  drawStar2D,
  toonMat,
  toonGradient,
} from './core.js';
import {
  makeCafeSign,
  makeCafeNoren,
  makeCafeWindow,
  makeCafeMenu,
  makeWarmWindow,
  makeVendingTexture,
  makeVendingTop,
  makeBulletinBoard as makeBulletinBoardTexture,
  makeAlleySign,
  makeSoftGlow,
  makeSteamTexture,
} from './art.js';
import { makeExteriorAC } from './store.js';

const NEIGHBOR = { x0: -13.35, x1: -9.5, z0: -10.4, z1: 2.2, h: 8.35 };
const ALLEY = { x0: -9.5, x1: -7.6, z0: -10.4, z1: 2.6 };

const MAT = {
  plaster: toonMat(0x8c796e, { emissive: 0x211914, emissiveIntensity: 0.3 }),
  plasterDim: toonMat(0x685a56, { emissive: 0x16100f, emissiveIntensity: 0.25 }),
  trim: toonMat(0x4b403c, { emissive: 0x0e0b0b, emissiveIntensity: 0.2 }),
  darkWood: toonMat(0x40342f, { emissive: 0x0b0908, emissiveIntensity: 0.2 }),
  metal: toonMat(0x798080, { emissive: 0x101516, emissiveIntensity: 0.25 }),
  darkMetal: toonMat(0x2a3033),
  whiteMetal: toonMat(0xcfd1c9, { emissive: 0x1d2221, emissiveIntensity: 0.3 }),
  concrete: toonMat(0x6d706b, { emissive: 0x141716, emissiveIntensity: 0.25 }),
  shutter: toonMat(0x5f7772, { emissive: 0x111c1b, emissiveIntensity: 0.25 }),
  foliage: toonMat(0x355c4e, { emissive: 0x0c1712, emissiveIntensity: 0.25 }),
  cream: toonMat(0xf0e4cc, { emissive: 0x2a2418, emissiveIntensity: 0.25 }),
  mint: toonMat(0x83cabb, { emissive: 0x143028, emissiveIntensity: 0.25 }),
  coral: toonMat(0xdb796d, { emissive: 0x2c0d0a, emissiveIntensity: 0.25 }),
  warm: toonMat(0xffdfac),
};

function addGlowSprite(parent, texture, color, scale, x, y, z, opacity = 0.6) {
  const mat = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(x, y, z);
  sprite.scale.set(scale[0], scale[1] ?? scale[0], 1);
  parent.add(sprite);
  return sprite;
}

function makeShutterTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#607a74';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 18) {
      ctx.fillStyle = 'rgba(18,33,32,.42)';
      ctx.fillRect(0, y, w, 3);
      ctx.fillStyle = 'rgba(214,228,218,.15)';
      ctx.fillRect(0, y + 4, w, 2);
    }
    for (let i = 0; i < 170; i++) {
      const x = mulberry32(i + 2)() * w;
      const y = mulberry32(i + 70)() * h;
      ctx.fillStyle = `rgba(${i % 2 ? '20,39,38' : '219,225,212'},.05)`;
      ctx.fillRect(x, y, 1 + (i % 4), 1 + (i % 3));
    }
    ctx.fillStyle = 'rgba(24,40,38,.5)';
    ctx.fillRect(w * 0.42, 0, 18, h);
    ctx.fillStyle = 'rgba(239,231,208,.7)';
    ctx.font = `600 24px ${JP_FONT}`;
    ctx.save();
    ctx.translate(w * 0.54, h * 0.6);
    ctx.fillText('本日 定休', 0, 0);
    ctx.restore();
  });
}

function makeBinLabel(text, color) {
  return canvasTexture(360, 160, (ctx, w, h) => {
    ctx.fillStyle = '#f5edd8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, 14);
    ctx.fillStyle = '#223536';
    ctx.font = `700 56px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 78);
    ctx.font = `600 22px ${MONO_FONT}`;
    ctx.fillText('HOSHI MART', w / 2, 119);
  });
}

function makeLanternTexture(char, color = '#c84f42') {
  return canvasTexture(256, 384, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,238,207,.35)';
    ctx.lineWidth = 3;
    for (let y = 18; y < h; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(w / 2, y + 8, w, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#2e201a';
    ctx.font = `700 104px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, w / 2, h / 2 - 18);
    ctx.fillStyle = 'rgba(255,224,180,.78)';
    ctx.font = `700 28px ${MONO_FONT}`;
    ctx.fillText('あまね', w / 2, h - 54);
  });
}

function makeShopSign() {
  return canvasTexture(900, 260, (ctx, w, h) => {
    ctx.fillStyle = '#1b3435';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c6ad83';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#e8d9ba';
    ctx.font = `700 58px ${JP_FONT}`;
    ctx.letterSpacing = '8px';
    ctx.textAlign = 'center';
    ctx.fillText('喫茶 あまね', w / 2, 108);
    ctx.fillStyle = '#d69a9f';
    ctx.font = `600 24px ${MONO_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillText('COFFEE  ·  JAZZ  ·  NIGHT', w / 2, 171);
    ctx.fillStyle = '#88b4a6';
    ctx.font = `600 22px ${JP_FONT}`;
    ctx.fillText('18:00 - 26:00', w / 2, 214);
  });
}

function makeNeonOpen() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#f2b4c3';
    ctx.lineWidth = 7;
    ctx.shadowColor = '#ff7fa7';
    ctx.shadowBlur = 18;
    roundRectPath(ctx, 18, 18, w - 36, h - 36, 22);
    ctx.stroke();
    ctx.fillStyle = '#ffe7d8';
    ctx.shadowColor = '#ff7fa7';
    ctx.shadowBlur = 22;
    ctx.font = `700 86px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('営業中', w / 2, 142);
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#d9f1e8';
    ctx.font = `600 28px ${MONO_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillText('OPEN', w / 2, 193);
  });
}

function makeBikeBagLogo() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f6ecd7';
    roundRectPath(ctx, 12, 44, w - 24, h - 58, 14);
    ctx.fill();
    ctx.strokeStyle = '#1a5453';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#e17f6c';
    drawStar2D(ctx, w / 2, 100, 32, 14, 5, -Math.PI / 2);
    ctx.fill();
    ctx.fillStyle = '#1a5453';
    ctx.font = `700 27px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('ほしまーと', w / 2, 165);
  });
}

// ---------------------------------------------------------------------------
// neighbour / cafe
// ---------------------------------------------------------------------------
function makeNeighbourStructure() {
  const group = new THREE.Group();
  const { x0, x1, z0, z1, h } = NEIGHBOR;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const w = x1 - x0;
  const d = z1 - z0;
  // three storey body, broken into bands for depth
  addBox(group, w, h, d, MAT.plaster, {
    x: cx,
    y: h / 2,
    z: cz,
    outline: true,
    thickness: 0.02,
    receive: true,
  });
  // dark plinth
  addBox(group, w + 0.06, 0.52, d + 0.06, MAT.trim, {
    x: cx,
    y: 0.26,
    z: cz,
    receive: true,
  });
  // floor divisions / overhang
  for (const y of [3.16, 5.72]) {
    addBox(group, w + 0.18, 0.15, d + 0.18, MAT.trim, {
      x: cx,
      y,
      z: cz,
      outline: true,
      thickness: 0.01,
    });
  }
  // facade wood battens
  for (let i = 0; i < 5; i++) {
    addBox(group, 0.07, 2.7, 0.06, MAT.darkWood, {
      x: x0 + 0.35 + i * 0.82,
      y: 1.75,
      z: z1 + 0.035,
      cast: false,
    });
  }
  // ground-floor shop front: closed shutter + warm doorway
  const shutterTex = makeShutterTexture();
  addBox(group, 2.05, 2.14, 0.08, toonMat(0xffffff, {
    map: shutterTex,
    emissive: 0x0f1b1a,
    emissiveIntensity: 0.35,
  }), {
    x: -12.28,
    y: 1.36,
    z: z1 + 0.075,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, 2.18, 0.16, 0.12, MAT.darkWood, {
    x: -12.28,
    y: 0.28,
    z: z1 + 0.08,
    cast: false,
  });
  addBox(group, 2.18, 0.12, 0.16, MAT.metal, {
    x: -12.28,
    y: 2.47,
    z: z1 + 0.1,
    cast: false,
  });
  // awning above shutter
  addBox(group, 2.15, 0.07, 0.6, MAT.trim, {
    x: -12.28,
    y: 2.66,
    z: z1 + 0.26,
    rx: 0.04,
    outline: true,
    thickness: 0.008,
  });
  for (let i = 0; i < 7; i++) {
    addBox(group, 0.24, 0.18, 0.03, i % 2 ? MAT.coral : MAT.cream, {
      x: -13.16 + i * 0.27,
      y: 2.57,
      z: z1 + 0.53,
      cast: false,
    });
  }
  // café doorway
  addBox(group, 1.07, 2.25, 0.1, MAT.darkWood, {
    x: -10.2,
    y: 1.16,
    z: z1 + 0.08,
    outline: true,
    thickness: 0.01,
  });
  const cafeWin = makeCafeWindow();
  addBox(group, 0.74, 1.8, 0.04, toonMat(0xffffff, {
    map: cafeWin,
    emissive: 0x6b4926,
    emissiveIntensity: 0.85,
  }), {
    x: -10.24,
    y: 1.25,
    z: z1 + 0.14,
    outline: true,
    thickness: 0.007,
  });
  addBox(group, 0.05, 1.8, 0.05, MAT.darkWood, {
    x: -10.24,
    y: 1.25,
    z: z1 + 0.18,
    cast: false,
  });
  addBox(group, 0.74, 0.05, 0.05, MAT.darkWood, {
    x: -10.24,
    y: 1.25,
    z: z1 + 0.18,
    cast: false,
  });
  addSphere(group, 0.045, MAT.metal, {
    x: -9.92,
    y: 1.05,
    z: z1 + 0.2,
    cast: false,
  });
  // noren over the door
  const norenTex = makeCafeNoren();
  addBox(group, 1.25, 0.58, 0.035, toonMat(0xffffff, {
    map: norenTex,
    emissive: 0x0b1b24,
    emissiveIntensity: 0.3,
  }), {
    x: -10.22,
    y: 2.53,
    z: z1 + 0.23,
    outline: true,
    thickness: 0.006,
  });
  // little menu box
  const menuTex = makeCafeMenu();
  addBox(group, 0.68, 0.94, 0.06, MAT.darkWood, {
    x: -10.95,
    y: 1.47,
    z: z1 + 0.14,
    outline: true,
    thickness: 0.008,
  });
  addPlane(group, 0.6, 0.84, basicMat(0xffffff, { map: menuTex }), {
    x: -10.95,
    y: 1.47,
    z: z1 + 0.18,
  });
  // main shop sign above shutter
  const shopTex = makeShopSign();
  addBox(group, 2.7, 0.62, 0.12, MAT.darkWood, {
    x: -12.12,
    y: 3.0,
    z: z1 + 0.19,
    outline: true,
    thickness: 0.008,
  });
  addPlane(group, 2.55, 0.52, basicMat(0xffffff, { map: shopTex }), {
    x: -12.12,
    y: 3.0,
    z: z1 + 0.26,
  });
  // pick up the shop sign with a warm brass gooseneck above the door
  addCylinderBetween(group, [-10.85, 3.18, z1 + 0.28], [-10.85, 2.97, z1 + 0.68], 0.022, MAT.darkMetal, {
    segments: 6,
    cast: false,
  });
  addSphere(group, 0.11, basicMat(0xffcf89), {
    x: -10.85,
    y: 2.92,
    z: z1 + 0.7,
    sy: 0.52,
    cast: false,
  });
  // warm light under shop sign
  addBox(group, 2.1, 0.025, 0.05, basicMat(0xf3c97e), {
    x: -12.15,
    y: 2.7,
    z: z1 + 0.33,
    cast: false,
  });

  // 2F balcony and windows
  addBox(group, w + 0.16, 0.14, 0.8, MAT.trim, {
    x: cx,
    y: 3.3,
    z: z1 + 0.4,
    outline: true,
    thickness: 0.008,
  });
  for (let i = 0; i < 3; i++) {
    addBox(group, w + 0.1, 0.025, 0.025, MAT.whiteMetal, {
      x: cx,
      y: 3.62 + i * 0.16,
      z: z1 + 0.75,
      cast: false,
    });
  }
  for (const bx of [x0 + 0.15, cx, x1 - 0.15]) {
    addBox(group, 0.03, 0.62, 0.03, MAT.whiteMetal, {
      x: bx,
      y: 3.6,
      z: z1 + 0.75,
      cast: false,
    });
  }
  for (const [wx, tex, lit] of [
    [-12.2, makeWarmWindow(0), true],
    [-10.8, makeWarmWindow(1), true],
  ]) {
    const fg = new THREE.Group();
    fg.position.set(wx, 4.62, z1 + 0.11);
    group.add(fg);
    addBox(fg, 1.12, 1.58, 0.12, MAT.trim, {
      outline: true,
      thickness: 0.009,
      cast: false,
    });
    addPlane(fg, 0.98, 1.43, basicMat(lit ? 0xffffff : 0x9a9fa0, { map: tex }), {
      z: 0.07,
    });
    addBox(fg, 0.045, 1.43, 0.055, MAT.darkWood, { z: 0.095, cast: false });
    addBox(fg, 0.98, 0.045, 0.055, MAT.darkWood, { z: 0.095, cast: false });
  }
  // laundry hanging over balcony
  for (let i = 0; i < 3; i++) {
    addPlane(group, 0.34, 0.54, toonMat([0xd5e3dc, 0xe9cfbb, 0xb7c4df][i], {
      side: THREE.DoubleSide,
      emissive: 0x121516,
      emissiveIntensity: 0.2,
    }), {
      x: -12.5 + i * 0.5,
      y: 3.56,
      z: z1 + 0.77,
      rx: 0.02,
      rz: (i - 1) * 0.06,
    });
  }
  // little potted plant on balcony
  addCylinder(group, 0.16, 0.12, 0.22, toonMat(0x9b6b50), {
    x: -9.95,
    y: 3.45,
    z: z1 + 0.55,
    segments: 8,
  });
  addSphere(group, 0.3, MAT.foliage, {
    x: -9.95,
    y: 3.72,
    z: z1 + 0.55,
    sx: 1.0,
    sy: 0.8,
    outline: true,
    thickness: 0.006,
  });

  // 3F window / balcony
  addBox(group, w + 0.1, 0.12, 0.62, MAT.trim, {
    x: cx,
    y: 5.86,
    z: z1 + 0.31,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, w + 0.05, 0.76, 0.04, toonMat(0x46403e), {
    x: cx,
    y: 6.22,
    z: z1 + 0.45,
    outline: true,
    thickness: 0.006,
  });
  addBox(group, w - 0.2, 0.06, 0.035, MAT.darkWood, {
    x: cx,
    y: 6.48,
    z: z1 + 0.48,
    cast: false,
  });
  const win3 = makeWarmWindow(2);
  addBox(group, 1.2, 1.32, 0.08, MAT.trim, {
    x: -12.05,
    y: 6.45,
    z: z1 + 0.1,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  addPlane(group, 1.05, 1.18, basicMat(0xffffff, { map: win3 }), {
    x: -12.05,
    y: 6.45,
    z: z1 + 0.16,
  });
  addBox(group, 0.8, 1.12, 0.06, MAT.darkWood, {
    x: -10.55,
    y: 6.45,
    z: z1 + 0.08,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  // AC / pipes / meters
  const ac = makeExteriorAC(0.82);
  ac.position.set(-9.68, 5.0, z1 + 0.4);
  ac.rotation.y = Math.PI / 2;
  group.add(ac);
  addCylinder(group, 0.045, 0.045, 7.6, MAT.darkMetal, {
    x: -9.72,
    y: 3.9,
    z: z1 + 0.31,
    segments: 7,
    outline: true,
    thickness: 0.006,
  });
  // side wall drain pipes / details
  addCylinder(group, 0.07, 0.07, 8.1, MAT.darkMetal, {
    x: x1 + 0.04,
    y: 4.15,
    z: z0 + 0.4,
    segments: 7,
    outline: true,
    thickness: 0.008,
  });
  for (let i = 0; i < 3; i++) {
    addBox(group, 0.24, 0.36, 0.13, MAT.metal, {
      x: x1 + 0.08,
      y: 1.3 + i * 1.7,
      z: z0 + 1.1,
      cast: false,
    });
  }
  // roof parapet and rooftop bits
  addBox(group, w + 0.22, 0.26, d + 0.2, toonMat(0x4c4441), {
    x: cx,
    y: h + 0.12,
    z: cz,
    outline: true,
    thickness: 0.009,
  });
  addBox(group, w + 0.3, 0.44, 0.15, MAT.concrete, {
    x: cx,
    y: h + 0.5,
    z: z1 - 0.16,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  addBox(group, 0.15, 0.44, d + 0.3, MAT.concrete, {
    x: x1 - 0.17,
    y: h + 0.5,
    z: cz,
    outline: true,
    thickness: 0.008,
    cast: false,
  });
  // rooftop water tank and aerial
  addBox(group, 1.15, 0.95, 1.0, toonMat(0x6b6f6b, {
    emissive: 0x131514,
    emissiveIntensity: 0.2,
  }), {
    x: -12.0,
    y: 9.1,
    z: -4.2,
    r: 0.03,
    outline: true,
    thickness: 0.01,
  });
  addCylinder(group, 0.018, 0.035, 2.6, MAT.darkMetal, {
    x: -10.1,
    y: h + 1.4,
    z: -3.4,
    segments: 6,
    outline: true,
    thickness: 0.004,
  });
  for (const y of [9.5, 9.72, 9.94]) {
    addBox(group, 0.68, 0.02, 0.02, MAT.darkMetal, {
      x: -10.1,
      y,
      z: -3.4,
      ry: 0.1,
      cast: false,
    });
  }
  // side wall texture accents facing the alley
  for (let i = 0; i < 4; i++) {
    addBox(group, 0.05, 2.0, 0.04, MAT.metal, {
      x: x1 + 0.1,
      y: 1.1,
      z: -6.0 + i * 1.8,
      cast: false,
    });
  }
  return group;
}

function makeNeighbourSigns() {
  const group = new THREE.Group();
  // projecting neon blade sign
  const cafeTex = makeCafeSign();
  const sgroup = new THREE.Group();
  sgroup.position.set(-9.73, 5.14, 2.56);
  group.add(sgroup);
  addBox(sgroup, 0.58, 2.55, 0.14, toonMat(0x241a28, {
    emissive: 0x12071a,
    emissiveIntensity: 0.3,
  }), {
    outline: true,
    thickness: 0.012,
    r: 0.025,
  });
  addPlane(sgroup, 0.5, 2.42, basicMat(0xffffff, { map: cafeTex }), { z: 0.076 });
  addPlane(sgroup, 0.5, 2.42, basicMat(0xffffff, { map: cafeTex }), { z: -0.076, ry: Math.PI });
  // bracket arms back to wall
  for (const y of [-0.92, 0.92]) {
    addCylinderBetween(sgroup, [-0.15, y, -0.06], [-0.58, y + 0.15, -0.48], 0.028, MAT.darkMetal, {
      segments: 6,
      cast: false,
    });
  }
  addBox(sgroup, 0.66, 0.035, 0.18, basicMat(0xf5a8bc), {
    y: 1.28,
    cast: false,
  });
  const glowTex = makeSoftGlow();
  addGlowSprite(sgroup, glowTex, 0xff8fac, [2.2, 2.2], 0, 0.1, 0.12, 0.3);
  // open sign in the cafe window
  addPlane(group, 0.62, 0.32, basicMat(0xffffff, {
    map: makeNeonOpen(),
    transparent: true,
  }), {
    x: -10.23,
    y: 2.12,
    z: 2.31,
  });
  // small wall lamp above door
  addBox(group, 0.2, 0.11, 0.15, MAT.darkMetal, {
    x: -9.86,
    y: 2.76,
    z: 2.32,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  addSphere(group, 0.06, basicMat(0xffc681), {
    x: -9.86,
    y: 2.68,
    z: 2.35,
    sy: 0.7,
    cast: false,
  });
  // pair of glowing paper lanterns at the cafe entrance
  for (const [x, y, z, s] of [
    [-9.84, 2.35, 2.62, 0.21],
    [-11.18, 2.28, 2.58, 0.17],
  ]) {
    addCylinder(group, s, s, s * 2.2, toonMat(0xffd8a2, {
      emissive: 0xffa554,
      emissiveIntensity: 0.9,
    }), {
      x,
      y,
      z,
      segments: 12,
      outline: true,
      thickness: 0.004,
      cast: false,
    });
    addCylinder(group, s * 0.7, s * 0.7, s * 0.16, MAT.darkMetal, {
      x,
      y: y + s * 1.2,
      z,
      segments: 10,
      cast: false,
    });
    addCylinder(group, s * 0.7, s * 0.7, s * 0.16, MAT.darkMetal, {
      x,
      y: y - s * 1.2,
      z,
      segments: 10,
      cast: false,
    });
  }
  return group;
}

// ---------------------------------------------------------------------------
// alley dressing
// ---------------------------------------------------------------------------
function makeAlley() {
  const group = new THREE.Group();
  const { x0, x1, z0, z1 } = ALLEY;
  const cx = (x0 + x1) / 2;
  // damp concrete lane
  addBox(group, x1 - x0 - 0.04, 0.06, 12.4, toonMat(0x4c5351, {
    emissive: 0x0f1212,
    emissiveIntensity: 0.3,
  }), {
    x: cx,
    y: 0.11,
    z: -4.0,
    receive: true,
    cast: false,
  });
  // stepping slabs
  for (let i = 0; i < 6; i++) {
    addBox(group, 0.8, 0.025, 0.6, toonMat(0x666b64, {
      emissive: 0x151815,
      emissiveIntensity: 0.2,
    }), {
      x: cx + (i % 2 ? 0.2 : -0.2),
      y: 0.15,
      z: -1.1 - i * 1.5,
      ry: (i % 3) * 0.2,
      cast: false,
      receive: true,
    });
  }
  // wooden lattice gate at the back
  for (let i = 0; i < 8; i++) {
    addBox(group, 0.055, 1.45, 0.06, MAT.darkWood, {
      x: x0 + 0.25 + i * 0.21,
      y: 0.8,
      z: -7.1,
      cast: false,
    });
  }
  addBox(group, x1 - x0 - 0.25, 0.08, 0.07, MAT.darkWood, {
    x: cx,
    y: 1.45,
    z: -7.1,
    cast: false,
  });
  // stack of beer crates
  const crateColors = [0xd6b055, 0xb3453d, 0x487a78];
  for (let stack = 0; stack < 2; stack++) {
    for (let i = 0; i < 3; i++) {
      addBox(group, 0.65, 0.32, 0.42, toonMat(crateColors[(i + stack) % 3], {
        emissive: 0x1b1410,
        emissiveIntensity: 0.25,
      }), {
        x: x0 + 0.4,
        y: 0.19 + i * 0.31,
        z: -3.8 - stack * 1.0,
        ry: 0.03 * stack,
        outline: true,
        thickness: 0.006,
      });
    }
  }
  // crates / buckets / broom
  addCylinder(group, 0.22, 0.2, 0.42, toonMat(0x7d8d89), {
    x: x1 - 0.33,
    y: 0.38,
    z: -2.25,
    segments: 10,
    outline: true,
    thickness: 0.006,
  });
  addCylinder(group, 0.02, 0.024, 1.3, MAT.darkWood, {
    x: x0 + 0.24,
    y: 0.8,
    z: -1.8,
    rz: 0.09,
    segments: 5,
  });
  addBox(group, 0.12, 0.28, 0.025, toonMat(0xb99258), {
    x: x0 + 0.29,
    y: 0.35,
    z: -1.8,
    rz: 0.09,
  });
  // pipes and wall vents
  addCylinderBetween(group, [x0 + 0.06, 0.3, -9.3], [x0 + 0.06, 3.1, -9.3], 0.018, MAT.metal, {
    segments: 5,
    cast: false,
  });
  addCylinderBetween(group, [x0 + 0.05, 3.05, 1.75], [x0 + 0.05, 1.4, 1.75], 0.018, MAT.metal, {
    segments: 5,
    cast: false,
  });
  addBox(group, 0.3, 0.5, 0.14, MAT.darkMetal, {
    x: x0 + 0.16,
    y: 2.22,
    z: -5.3,
    cast: false,
  });
  // little wall lamp deep in the lane
  addBox(group, 0.15, 0.1, 0.24, MAT.darkMetal, {
    x: x1 - 0.2,
    y: 2.35,
    z: -5.1,
    outline: true,
    thickness: 0.005,
    cast: false,
  });
  addSphere(group, 0.055, basicMat(0xffc581), {
    x: x1 - 0.31,
    y: 2.30,
    z: -5.1,
    sy: 0.65,
    cast: false,
  });
  // entrance lantern
  const lanternTex = makeLanternTexture('雨');
  addCylinder(group, 0.19, 0.19, 0.56, toonMat(0xffffff, {
    map: lanternTex,
    emissive: 0x53221a,
    emissiveIntensity: 0.45,
  }), {
    x: x0 + 0.3,
    y: 2.05,
    z: z1 - 0.34,
    segments: 12,
    outline: true,
    thickness: 0.005,
  });
  addCylinder(group, 0.14, 0.14, 0.04, MAT.darkMetal, {
    x: x0 + 0.3,
    y: 2.35,
    z: z1 - 0.34,
    segments: 10,
    cast: false,
  });
  addCylinder(group, 0.14, 0.14, 0.04, MAT.darkMetal, {
    x: x0 + 0.3,
    y: 1.75,
    z: z1 - 0.34,
    segments: 10,
    cast: false,
  });
  // a small perpendicular entrance sign
  const alleySign = makeAlleySign();
  addBox(group, 0.36, 0.98, 0.06, MAT.darkWood, {
    x: x1 - 0.06,
    y: 2.4,
    z: z1 - 0.06,
    ry: 0.1,
    outline: true,
    thickness: 0.007,
    cast: false,
  });
  addPlane(group, 0.3, 0.9, basicMat(0xffffff, { map: alleySign }), {
    x: x1 + 0.002,
    y: 2.4,
    z: z1 - 0.035,
    ry: 0.1,
  });
  addCylinderBetween(group, [x1 - 0.02, 2.86, z1 - 0.06], [x1 - 0.35, 2.98, z1 - 0.06], 0.025, MAT.darkMetal, {
    segments: 6,
    cast: false,
  });
  // greenery in the alley
  for (let i = 0; i < 3; i++) {
    addCylinder(group, 0.12, 0.1, 0.26, toonMat(0x8a624d), {
      x: x0 + 0.25,
      y: 0.28,
      z: -8.5 + i * 0.6,
      segments: 8,
    });
    addSphere(group, 0.23, MAT.foliage, {
      x: x0 + 0.25,
      y: 0.54,
      z: -8.5 + i * 0.6,
      sx: 0.9,
      sy: 0.7,
      outline: true,
      thickness: 0.005,
    });
  }
  return group;
}

// ---------------------------------------------------------------------------
// street furniture
// ---------------------------------------------------------------------------
function makeVendingMachine(theme, index) {
  const group = new THREE.Group();
  const bodyColor = theme === 'warm' ? 0xd97361 : 0x65b9b0;
  addBox(group, 1.05, 1.9, 0.78, toonMat(bodyColor, {
    emissive: theme === 'warm' ? 0x2a0f08 : 0x0d2422,
    emissiveIntensity: 0.35,
  }), {
    y: 0.95,
    r: 0.055,
    outline: true,
    thickness: 0.01,
  });
  const frontTex = makeVendingTexture(theme);
  addPlane(group, 0.96, 1.72, basicMat(0xffffff, { map: frontTex }), {
    y: 0.92,
    z: 0.395,
  });
  // glow behind the panel
  addBox(
    group,
    0.9,
    0.2,
    0.05,
    basicMat(theme === 'warm' ? 0xffc37f : 0xa6f4e2),
    { y: 1.74, z: 0.4, cast: false }
  );
  // top marquee
  addBox(group, 1.03, 0.16, 0.82, toonMat(theme === 'warm' ? 0xf2b26f : 0x94dfd3), {
    y: 1.94,
    r: 0.03,
    outline: true,
    thickness: 0.007,
  });
  addPlane(group, 0.9, 0.12, basicMat(0xffffff, {
    map: makeVendingTop(theme),
  }), {
    y: 1.94,
    z: 0.415,
  });
  // coin / delivery details
  addBox(group, 0.28, 0.08, 0.06, MAT.darkMetal, {
    x: 0.24,
    y: 0.53,
    z: 0.43,
    cast: false,
    outline: true,
    thickness: 0.004,
  });
  addBox(group, 0.68, 0.17, 0.06, MAT.darkMetal, {
    x: 0,
    y: 0.33,
    z: 0.43,
    cast: false,
  });
  addBox(group, 0.54, 0.025, 0.02, basicMat(theme === 'warm' ? 0xffbe79 : 0x9af1dd), {
    y: 0.43,
    z: 0.46,
    cast: false,
  });
  addCylinder(group, 0.04, 0.04, 0.06, MAT.metal, {
    x: -0.36,
    y: 0.66,
    z: 0.43,
    rx: Math.PI / 2,
    segments: 8,
    cast: false,
  });
  // sides/brand strip
  addBox(group, 0.06, 1.72, 0.12, toonMat(theme === 'warm' ? 0xb85545 : 0x438b84), {
    x: -0.49,
    y: 0.92,
    z: 0.33,
    cast: false,
  });
  addBox(group, 0.06, 1.72, 0.12, toonMat(theme === 'warm' ? 0xb85545 : 0x438b84), {
    x: 0.49,
    y: 0.92,
    z: 0.33,
    cast: false,
  });
  const tex = makeSoftGlow();
  addGlowSprite(group, tex, theme === 'warm' ? 0xffb574 : 0x9af7e3, [1.9, 1.9], 0, 1.05, 0.5, 0.3);
  return group;
}

export function makeBicycle(color = 0x87c6b3) {
  const group = new THREE.Group();
  const tire = toonMat(0x1d2325);
  const rim = toonMat(0x9ea7a7, { emissive: 0x141818, emissiveIntensity: 0.2 });
  const frame = toonMat(color, { emissive: 0x0d2220, emissiveIntensity: 0.25 });
  const chrome = toonMat(0xc7ceca, { emissive: 0x252b29, emissiveIntensity: 0.25 });
  const wheelZ = 0;
  for (const x of [-0.54, 0.54]) {
    addTorus(group, 0.33, 0.025, tire, {
      x,
      y: 0.36,
      z: wheelZ,
      radialSegments: 7,
      tubularSegments: 26,
      outline: true,
      thickness: 0.008,
    });
    addTorus(group, 0.285, 0.012, rim, {
      x,
      y: 0.36,
      z: wheelZ,
      radialSegments: 5,
      tubularSegments: 22,
      cast: false,
    });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      addCylinderBetween(
        group,
        [x, 0.36, wheelZ],
        [x + Math.cos(a) * 0.27, 0.36 + Math.sin(a) * 0.27, wheelZ],
        0.004,
        chrome,
        { segments: 3, cast: false }
      );
    }
  }
  const rear = [-0.54, 0.36, 0];
  const front = [0.54, 0.36, 0];
  const crank = [-0.04, 0.36, 0];
  const seat = [-0.22, 0.78, 0];
  const head = [0.38, 0.82, 0];
  const frameTubes = [
    [rear, seat],
    [rear, crank],
    [seat, crank],
    [seat, head],
    [head, crank],
    [head, front],
  ];
  frameTubes.forEach(([a, b], i) => {
    addCylinderBetween(group, a, b, i === 1 ? 0.018 : 0.021, frame, {
      segments: 6,
      outline: true,
      thickness: 0.006,
    });
  });
  // seat post + saddle
  addCylinderBetween(group, seat, [-0.24, 0.93, 0], 0.014, chrome, {
    segments: 5,
    cast: false,
  });
  addBox(group, 0.25, 0.06, 0.12, toonMat(0x1d2527), {
    x: -0.26,
    y: 0.96,
    z: 0,
    r: 0.025,
    outline: true,
    thickness: 0.005,
    cast: false,
  });
  // handle stem + bars
  addCylinderBetween(group, head, [0.42, 1.04, 0], 0.014, chrome, { segments: 5, cast: false });
  addCylinderBetween(group, [0.42, 1.04, -0.22], [0.42, 1.04, 0.22], 0.016, chrome, {
    segments: 5,
    cast: false,
  });
  for (const z of [-0.22, 0.22]) {
    addCylinder(group, 0.025, 0.025, 0.11, toonMat(0x2b2f2e), {
      x: 0.42,
      y: 1.02,
      z,
      rx: Math.PI / 2,
      segments: 6,
      cast: false,
    });
  }
  // pedal crank
  addCylinder(group, 0.035, 0.035, 0.03, chrome, {
    x: crank[0],
    y: crank[1],
    z: 0.02,
    rx: Math.PI / 2,
    segments: 8,
    cast: false,
  });
  addBox(group, 0.2, 0.025, 0.06, MAT.darkMetal, {
    x: crank[0] + 0.05,
    y: crank[1] - 0.1,
    z: 0.13,
    ry: 0.12,
    cast: false,
  });
  // rear rack
  addCylinderBetween(group, [-0.22, 0.7, -0.12], [-0.7, 0.7, -0.12], 0.01, chrome, {
    segments: 4,
    cast: false,
  });
  addCylinderBetween(group, [-0.22, 0.7, 0.12], [-0.7, 0.7, 0.12], 0.01, chrome, {
    segments: 4,
    cast: false,
  });
  addBox(group, 0.5, 0.025, 0.28, MAT.darkMetal, {
    x: -0.47,
    y: 0.7,
    z: 0,
    cast: false,
  });
  // basket
  addCylinderBetween(group, [0.54, 0.75, 0], [0.58, 1.0, 0], 0.01, chrome, {
    segments: 4,
    cast: false,
  });
  addBox(group, 0.36, 0.25, 0.32, toonMat(0xc4c5b8), {
    x: 0.62,
    y: 1.08,
    z: 0,
    r: 0.01,
    outline: true,
    thickness: 0.006,
    cast: false,
  });
  addBox(group, 0.3, 0.2, 0.26, toonMat(0x9b9e94), {
    x: 0.62,
    y: 1.095,
    z: 0,
    cast: false,
  });
  // paper bag in basket
  addBox(group, 0.22, 0.24, 0.13, toonMat(0xf2e4ca), {
    x: 0.6,
    y: 1.22,
    z: 0.02,
    rz: 0.05,
    outline: true,
    thickness: 0.004,
    cast: false,
  });
  addPlane(group, 0.16, 0.16, basicMat(0xffffff, {
    map: makeBikeBagLogo(),
    transparent: true,
  }), {
    x: 0.58,
    y: 1.22,
    z: 0.115,
    rz: 0.05,
    cast: false,
  });
  // front lamp
  addCylinder(group, 0.055, 0.06, 0.1, MAT.darkMetal, {
    x: 0.68,
    y: 0.94,
    z: 0,
    rz: Math.PI / 2,
    segments: 8,
    cast: false,
  });
  addPlane(group, 0.06, 0.05, basicMat(0xffe0a0), {
    x: 0.74,
    y: 0.95,
    z: 0,
    ry: Math.PI / 2,
    cast: false,
  });
  // kickstand
  addCylinderBetween(group, [-0.2, 0.3, -0.02], [-0.38, 0.02, -0.24], 0.012, chrome, {
    segments: 5,
    cast: false,
  });
  // fenders
  addTorus(group, 0.34, 0.013, frame, {
    x: -0.54,
    y: 0.36,
    z: 0,
    radialSegments: 4,
    tubularSegments: 20,
    arc: Math.PI * 0.92,
    rz: Math.PI * 0.04,
    cast: false,
    outline: false,
  });
  addTorus(group, 0.34, 0.013, frame, {
    x: 0.54,
    y: 0.36,
    z: 0,
    radialSegments: 4,
    tubularSegments: 20,
    arc: Math.PI * 0.92,
    cast: false,
  });
  return group;
}

function makeStreetLamp() {
  const group = new THREE.Group();
  const poleMat = toonMat(0x5f6b6b, { emissive: 0x121a1a, emissiveIntensity: 0.25 });
  addCylinder(group, 0.11, 0.14, 0.34, MAT.darkMetal, {
    y: 0.17,
    segments: 12,
    outline: true,
    thickness: 0.008,
  });
  addCylinder(group, 0.065, 0.095, 4.65, poleMat, {
    y: 2.62,
    segments: 10,
    outline: true,
    thickness: 0.012,
  });
  // soft curved arm toward the road
  const armPoints = [
    new THREE.Vector3(0, 4.96, 0),
    new THREE.Vector3(0.25, 5.45, 0.16),
    new THREE.Vector3(0.82, 5.72, 0.58),
    new THREE.Vector3(1.45, 5.78, 1.02),
  ];
  addTube(group, armPoints, 0.055, poleMat, {
    segments: 22,
    radialSegments: 7,
    cast: false,
  });
  // lamp housing
  const head = new THREE.Group();
  head.position.set(1.48, 5.7, 1.05);
  head.rotation.y = -0.16;
  group.add(head);
  addBox(head, 0.62, 0.16, 0.32, MAT.darkMetal, {
    y: 0.04,
    r: 0.045,
    outline: true,
    thickness: 0.006,
  });
  addBox(head, 0.52, 0.045, 0.24, basicMat(0xffe3ad), {
    y: -0.06,
    cast: false,
  });
  addGlowSprite(group, makeSoftGlow(), 0xffcf88, [2.8, 2.8], 1.48, 5.68, 1.05, 0.34);
  // small sign band on pole
  addBox(group, 0.16, 0.48, 0.02, toonMat(0xf0e8d5, {
    emissive: 0x252116,
    emissiveIntensity: 0.3,
  }), {
    y: 2.28,
    z: 0.08,
    cast: false,
  });
  addBox(group, 0.02, 0.16, 0.06, MAT.darkMetal, {
    y: 3.2,
    x: 0.09,
    cast: false,
  });
  return group;
}

function makeUtilityPole(height = 10.2) {
  const group = new THREE.Group();
  const concrete = toonMat(0x818580, {
    emissive: 0x171a18,
    emissiveIntensity: 0.3,
  });
  addCylinder(group, 0.13, 0.22, height, concrete, {
    y: height / 2,
    segments: 9,
    outline: true,
    thickness: 0.013,
  });
  // dark hazard band at base
  for (let i = 0; i < 3; i++) {
    addCylinder(group, 0.19 - i * 0.007, 0.196 - i * 0.007, 0.17, i % 2 ? toonMat(0xe6c04f) : toonMat(0x2a2c2a), {
      y: 0.5 + i * 0.17,
      segments: 9,
      cast: false,
    });
  }
  // service plaque
  addBox(group, 0.22, 0.36, 0.05, MAT.metal, {
    y: 1.9,
    z: 0.14,
    cast: false,
  });
  addBox(group, 0.16, 0.26, 0.02, toonMat(0xe7dfc5), {
    x: 0,
    y: 1.9,
    z: 0.17,
    cast: false,
  });
  // crossarms, insulators
  for (const [y, w, rot] of [
    [height - 1.15, 2.4, 0],
    [height - 0.55, 1.8, Math.PI / 2],
  ]) {
    const arm = new THREE.Group();
    arm.position.set(0, y, 0);
    arm.rotation.y = rot;
    group.add(arm);
    addBox(arm, w, 0.1, 0.1, MAT.darkWood, {
      outline: true,
      thickness: 0.006,
      cast: true,
    });
    for (const x of [-w / 2 + 0.15, 0, w / 2 - 0.15]) {
      addCylinder(arm, 0.06, 0.08, 0.16, toonMat(0xe7e0d1), {
        x,
        y: 0.14,
        segments: 8,
        cast: false,
      });
    }
    // diagonal steel braces
    addCylinderBetween(arm, [-0.12, -0.62, 0], [-w / 2 + 0.18, -0.03, 0], 0.018, MAT.darkMetal, {
      segments: 4,
      cast: false,
    });
    addCylinderBetween(arm, [0.12, -0.62, 0], [w / 2 - 0.18, -0.03, 0], 0.018, MAT.darkMetal, {
      segments: 4,
      cast: false,
    });
  }
  // transformer drums
  for (const [x, y, z] of [
    [-0.28, height - 2.2, 0.35],
    [0.3, height - 2.65, -0.28],
  ]) {
    addCylinder(group, 0.18, 0.18, 0.72, toonMat(0x707573, {
      emissive: 0x111413,
      emissiveIntensity: 0.25,
    }), {
      x,
      y,
      z,
      segments: 10,
      outline: true,
      thickness: 0.008,
    });
    addCylinder(group, 0.06, 0.06, 0.76, MAT.darkMetal, {
      x,
      y,
      z,
      segments: 8,
      cast: false,
    });
  }
  // step bolts
  for (let i = 0; i < 8; i++) {
    addBox(group, 0.03, 0.02, 0.26, MAT.darkMetal, {
      x: -0.12,
      y: 2.7 + i * 0.55,
      z: 0.12,
      cast: false,
    });
  }
  // little cable spool / sign
  addBox(group, 0.3, 0.18, 0.04, toonMat(0xd2c48f), {
    y: 2.55,
    z: 0.14,
    cast: false,
  });
  return group;
}

function makeGuardrail(length = 3.2) {
  const group = new THREE.Group();
  const white = toonMat(0xe2e3d8, { emissive: 0x292b26, emissiveIntensity: 0.35 });
  const postMat = MAT.metal;
  for (let i = 0; i <= Math.floor(length / 1.6); i++) {
    const x = -length / 2 + i * 1.6;
    addCylinder(group, 0.055, 0.065, 0.88, postMat, {
      x,
      y: 0.44,
      segments: 8,
      outline: true,
      thickness: 0.006,
    });
    addCylinder(group, 0.08, 0.09, 0.09, postMat, {
      x,
      y: 0.045,
      segments: 8,
      cast: false,
    });
  }
  for (const y of [0.48, 0.82]) {
    addCylinderBetween(group, [-length / 2, y, 0], [length / 2, y, 0], 0.045, white, {
      segments: 8,
      outline: true,
      thickness: 0.006,
    });
  }
  for (let i = 0; i < Math.floor(length / 0.38); i++) {
    addCylinder(group, 0.02, 0.02, 0.31, postMat, {
      x: -length / 2 + 0.19 + i * 0.38,
      y: 0.65,
      segments: 5,
      cast: false,
    });
  }
  // reflective amber plates
  addBox(group, 0.16, 0.09, 0.03, basicMat(0xeecb6f), {
    x: -length / 2 + 0.2,
    y: 0.85,
    z: 0.04,
    cast: false,
  });
  addBox(group, 0.16, 0.09, 0.03, basicMat(0xeecb6f), {
    x: length / 2 - 1.5,
    y: 0.85,
    z: 0.04,
    cast: false,
  });
  return group;
}

function makeBulletinBoard() {
  const group = new THREE.Group();
  const postMat = MAT.darkWood;
  for (const x of [-0.8, 0.8]) {
    addCylinder(group, 0.07, 0.09, 2.25, postMat, {
      x,
      y: 1.12,
      segments: 7,
      outline: true,
      thickness: 0.007,
    });
  }
  addBox(group, 1.9, 0.12, 0.16, postMat, {
    y: 2.2,
    outline: true,
    thickness: 0.007,
  });
  addBox(group, 1.86, 1.12, 0.09, postMat, {
    y: 1.45,
    z: 0.04,
    outline: true,
    thickness: 0.008,
  });
  addBox(group, 1.66, 0.94, 0.03, basicMat(0xffffff, {
    map: makeBulletinBoardTexture(),
  }), {
    y: 1.45,
    z: 0.1,
  });
  // tiny roof
  addBox(group, 1.98, 0.11, 0.55, toonMat(0x4a4f49), {
    y: 2.27,
    z: 0.05,
    rx: 0.06,
    outline: true,
    thickness: 0.006,
  });
  // little lamp above
  addCylinder(group, 0.04, 0.04, 0.25, MAT.darkMetal, {
    x: 0.65,
    y: 2.42,
    z: 0.02,
    segments: 5,
    cast: false,
  });
  addSphere(group, 0.07, basicMat(0xffdb9b), {
    x: 0.65,
    y: 2.33,
    z: 0.16,
    sy: 0.65,
    cast: false,
  });
  return group;
}

function makeBin(label, color) {
  const group = new THREE.Group();
  addBox(group, 0.4, 0.7, 0.4, toonMat(0x5e6b67, {
    emissive: 0x101615,
    emissiveIntensity: 0.2,
  }), {
    y: 0.36,
    r: 0.03,
    outline: true,
    thickness: 0.007,
  });
  addBox(group, 0.34, 0.12, 0.05, toonMat(0xf1e9d6), {
    y: 0.53,
    z: 0.205,
    cast: false,
  });
  addPlane(group, 0.3, 0.11, basicMat(0xffffff, { map: makeBinLabel(label, color) }), {
    y: 0.53,
    z: 0.235,
    cast: false,
  });
  addBox(group, 0.25, 0.035, 0.25, MAT.darkMetal, {
    y: 0.73,
    cast: false,
  });
  return group;
}

function makeAFrameSign() {
  const group = new THREE.Group();
  const tex = canvasTexture(512, 720, (ctx, w, h) => {
    ctx.fillStyle = '#f2e7cf';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#215b5a';
    ctx.lineWidth = 17;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#215b5a';
    ctx.textAlign = 'center';
    ctx.font = `800 72px ${JP_FONT}`;
    ctx.fillText('HOT', w / 2, 150);
    ctx.font = `800 88px ${JP_FONT}`;
    ctx.fillText('COFFEE', w / 2, 250);
    ctx.fillStyle = '#d47a62';
    ctx.font = `700 48px ${JP_FONT}`;
    ctx.fillText('¥ 120', w / 2, 334);
    // cup illustration
    ctx.fillStyle = '#e7f1eb';
    ctx.beginPath();
    ctx.moveTo(140, 400);
    ctx.lineTo(372, 400);
    ctx.lineTo(340, 610);
    ctx.lineTo(172, 610);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1d5455';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = '#1d5455';
    ctx.fillRect(130, 386, 252, 25);
    ctx.strokeStyle = 'rgba(220,235,226,.8)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(200 + i * 54, 352);
      ctx.bezierCurveTo(174 + i * 54, 315, 230 + i * 54, 294, 198 + i * 54, 254);
      ctx.stroke();
    }
    ctx.fillStyle = '#376866';
    ctx.font = `600 25px ${MONO_FONT}`;
    ctx.fillText('HOSHI MART', w / 2, 678);
  });
  const panel = new THREE.Group();
  panel.rotation.x = 0.13;
  panel.position.set(0, 0.53, 0.12);
  addBox(panel, 0.7, 1.0, 0.04, toonMat(0xf2e7cf), {
    outline: true,
    thickness: 0.006,
  });
  addPlane(panel, 0.64, 0.93, basicMat(0xffffff, { map: tex }), { z: 0.025 });
  group.add(panel);
  const back = new THREE.Group();
  back.rotation.x = -0.13;
  back.position.set(0, 0.53, -0.12);
  addBox(back, 0.7, 1.0, 0.04, toonMat(0xe0d4ba), {});
  group.add(back);
  // legs
  addBox(group, 0.05, 0.1, 0.5, MAT.darkWood, { y: 0.04, z: 0 });
  return group;
}


function makeStreetTree(scale = 1, seed = 3) {
  const g = new THREE.Group();
  const rng = mulberry32(seed);
  const trunkMat = toonMat(0x4a3b30, { emissive: 0x0d0a08, emissiveIntensity: 0.2 });
  const leafMats = [
    toonMat(0x2f5a49, { emissive: 0x0b1712, emissiveIntensity: 0.25 }),
    toonMat(0x3b6a53, { emissive: 0x0c1a13, emissiveIntensity: 0.2 }),
    toonMat(0x48775d, { emissive: 0x0d1a13, emissiveIntensity: 0.2 }),
    toonMat(0x2a4f43, { emissive: 0x07100d, emissiveIntensity: 0.25 }),
  ];
  // base grate
  addCylinder(g, 0.55 * scale, 0.55 * scale, 0.035, toonMat(0x383f40), {
    y: 0.015,
    segments: 20,
    cast: false,
  });
  for (let i = 0; i < 6; i++) {
    addBox(g, 0.9 * scale, 0.012, 0.035, MAT.darkMetal, {
      y: 0.038,
      z: -0.4 * scale + i * 0.16 * scale,
      cast: false,
    });
  }
  // trunk with a bit of a curve
  const trunkPts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.07, 1.0, -0.04),
    new THREE.Vector3(-0.06, 1.95, 0.03),
    new THREE.Vector3(0.1, 2.8, 0.08),
  ];
  addTube(g, trunkPts, 0.13 * scale, trunkMat, {
    segments: 14,
    radialSegments: 6,
    cast: false,
  });
  addCylinder(g, 0.16 * scale, 0.2 * scale, 0.3 * scale, trunkMat, {
    y: 0.15 * scale,
    segments: 7,
    cast: false,
  });
  // branches
  const branches = [
    [new THREE.Vector3(0.08, 2.25, 0.02), new THREE.Vector3(0.9, 3.2, 0.35)],
    [new THREE.Vector3(-0.02, 2.55, 0.03), new THREE.Vector3(-0.95, 3.45, 0.2)],
    [new THREE.Vector3(0.04, 2.8, 0.07), new THREE.Vector3(0.25, 3.9, -0.5)],
    [new THREE.Vector3(0.08, 2.2, 0.02), new THREE.Vector3(-0.4, 3.0, -0.8)],
  ];
  for (const [a, b] of branches) {
    addCylinderBetween(g, [a.x, a.y, a.z], [b.x, b.y, b.z], 0.045 * scale, trunkMat, {
      segments: 5,
      cast: false,
    });
  }
  // clustered canopy
  const clusters = [
    [0.0, 3.75, 0.0, 1.25, 0.88],
    [0.95, 3.55, 0.2, 0.9, 0.7],
    [-0.9, 3.7, 0.1, 0.95, 0.72],
    [0.35, 4.15, -0.35, 0.8, 0.65],
    [-0.4, 4.05, 0.45, 0.85, 0.62],
    [0.1, 4.42, 0.12, 0.55, 0.5],
    [0.65, 3.15, -0.55, 0.58, 0.55],
    [-0.58, 3.2, -0.55, 0.52, 0.48],
  ];
  for (let i = 0; i < clusters.length; i++) {
    const [x, y, z, r, h] = clusters[i];
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, leafMats[i % leafMats.length]);
    mesh.position.set(x * scale, y * scale, z * scale);
    mesh.scale.set(r * scale, h * scale, r * scale);
    mesh.rotation.set(rng() * 0.3, rng() * 1.2, rng() * 0.2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addOutline(mesh, 0.024);
    g.add(mesh);
  }
  // a few warm-lit leaves on the street-facing side
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.IcosahedronGeometry(0.2 + rng() * 0.1, 0);
    const mesh = new THREE.Mesh(geo, toonMat(0x60916f, {
      emissive: 0x17251a,
      emissiveIntensity: 0.3,
    }));
    mesh.position.set((0.6 + rng() * 0.7) * scale, (3.1 + rng() * 1.0) * scale, (0.45 + rng() * 0.3) * scale);
    mesh.castShadow = true;
    addOutline(mesh, 0.012);
    g.add(mesh);
  }
  return g;
}

function makeStreetBench() {
  const g = new THREE.Group();
  const wood = toonMat(0x6f5440, {
    emissive: 0x18100a,
    emissiveIntensity: 0.22,
  });
  const metal = MAT.darkMetal;
  for (const x of [-0.72, 0.72]) {
    addBox(g, 0.08, 0.42, 0.42, metal, { x, y: 0.21, cast: true });
    addBox(g, 0.08, 0.48, 0.06, metal, { x, y: 0.55, z: -0.2, cast: false });
  }
  for (let i = 0; i < 3; i++) {
    addBox(g, 1.65, 0.055, 0.12, wood, {
      y: 0.46,
      z: -0.12 + i * 0.14,
      r: 0.015,
      cast: false,
    });
    addBox(g, 1.65, 0.055, 0.1, wood, {
      y: 0.7 + i * 0.13,
      z: 0.15,
      rx: -0.18,
      r: 0.012,
      cast: false,
    });
  }
  return g;
}

function makeNeighbourProps() {
  const group = new THREE.Group();
  // potted plants by café door
  for (const [x, z, s] of [
    [-11.05, 2.58, 1.0],
    [-9.63, 2.7, 0.7],
  ]) {
    addCylinder(group, 0.15 * s, 0.12 * s, 0.28 * s, toonMat(0x966d54), {
      x,
      y: 0.3,
      z,
      segments: 9,
    });
    addSphere(group, 0.28 * s, MAT.foliage, {
      x,
      y: 0.62 * s,
      z,
      sy: 0.8,
      outline: true,
      thickness: 0.005,
    });
  }
  // stacked newspaper / crates
  addBox(group, 0.5, 0.12, 0.34, toonMat(0xbea37e), {
    x: -9.74,
    y: 0.22,
    z: 3.05,
    outline: true,
    thickness: 0.004,
  });
  addBox(group, 0.45, 0.1, 0.3, toonMat(0xd1b68f), {
    x: -9.74,
    y: 0.33,
    z: 3.05,
    ry: 0.15,
    cast: false,
  });
  return group;
}

// ---------------------------------------------------------------------------
// cables
// ---------------------------------------------------------------------------
function wireMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0x11151b,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
}

function addCable(group, points, radius = 0.018, material) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35);
  const geo = new THREE.TubeGeometry(curve, 36, radius, 4, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);
  return mesh;
}

function makeWires(poleA, poleB) {
  const group = new THREE.Group();
  const mat = wireMaterial();
  const sagPoints = (a, b, sag = 1.2, steps = 20) => {
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      out.push(
        new THREE.Vector3(
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag,
          a[2] + (b[2] - a[2]) * t
        )
      );
    }
    return out;
  };
  // long spans over the corner
  const spans = [
    [[12.45, 9.55, 4.6], [-8.0, 8.95, 12.6], 1.4, 0.023],
    [[12.25, 9.1, 4.6], [-8.0, 8.55, 12.6], 1.55, 0.014],
    [[12.6, 8.7, 4.6], [-7.8, 8.2, 12.6], 1.2, 0.012],
    [[12.45, 9.55, 4.6], [3.1, 7.5, -0.2], 0.8, 0.018],
    [[12.2, 8.9, 4.6], [2.9, 7.2, 0.7], 0.5, 0.011],
    [[-8.0, 8.95, 12.6], [-11.4, 8.9, 1.6], 0.65, 0.016],
    [[-8.25, 8.5, 12.6], [-11.7, 8.5, 0.2], 0.4, 0.01],
    [[-8.0, 8.95, 12.6], [-3.1, 7.1, -7.8], 1.85, 0.01],
  ];
  for (const [a, b, sag, r] of spans) {
    addCable(group, sagPoints(a, b, sag, 24), r, mat);
  }
  // little service drops to the café and the shop
  addCable(group, sagPoints([12.4, 8.4, 4.6], [3.0, 6.9, 1.0], 0.45, 14), 0.009, mat);
  addCable(group, sagPoints([-8.0, 8.4, 12.6], [-11.6, 7.2, 1.3], 0.6, 14), 0.009, mat);
  // tie loops
  for (const p of [
    [12.45, 9.55, 4.6],
    [-8.0, 8.95, 12.6],
  ]) {
    addTorus(group, 0.11, 0.016, mat, {
      x: p[0],
      y: p[1] - 0.12,
      z: p[2],
      rx: Math.PI / 2,
      radialSegments: 4,
      tubularSegments: 10,
      cast: false,
    });
  }
  return { group, material: mat };
}

// ---------------------------------------------------------------------------
// public builder
// ---------------------------------------------------------------------------
export function buildStreet(scene, intro) {
  const neighbour = makeNeighbourStructure();
  scene.add(neighbour);
  intro.add(neighbour, {
    start: 2.65,
    duration: 1.15,
    motion: 'growY',
    ease: 'outCubic',
  });

  const neighbourSigns = makeNeighbourSigns();
  scene.add(neighbourSigns);
  intro.add(neighbourSigns, {
    start: 4.65,
    duration: 0.65,
    motion: 'drop',
    distance: 1.5,
    ease: 'outBack',
  });

  const alley = makeAlley();
  scene.add(alley);
  intro.add(alley, {
    start: 4.32,
    duration: 0.7,
    motion: 'scale',
    ease: 'outBack',
  });

  const neighbourProps = makeNeighbourProps();
  scene.add(neighbourProps);
  intro.add(neighbourProps, {
    start: 5.55,
    duration: 0.55,
    motion: 'drop',
    distance: 0.5,
    ease: 'outBack',
  });

  // bulletin board
  const board = makeBulletinBoard();
  board.position.set(-11.7, 0.16, 3.42);
  board.rotation.y = 0.05;
  scene.add(board);
  intro.add(board, {
    start: 5.15,
    duration: 0.6,
    motion: 'rise',
    distance: 0.6,
    ease: 'outBack',
  });

  // vending machines, side of the shop
  const vendingGroup = new THREE.Group();
  scene.add(vendingGroup);
  const vm1 = makeVendingMachine('mint', 0);
  vm1.position.set(3.72, 0.16, -3.55);
  vm1.rotation.y = Math.PI / 2;
  vendingGroup.add(vm1);
  const vm2 = makeVendingMachine('warm', 1);
  vm2.position.set(3.72, 0.16, -4.83);
  vm2.rotation.y = Math.PI / 2;
  vendingGroup.add(vm2);
  intro.add(vm1, {
    start: 5.02,
    duration: 0.6,
    motion: 'rise',
    distance: 0.8,
    ease: 'outBack',
  });
  intro.add(vm2, {
    start: 5.16,
    duration: 0.6,
    motion: 'rise',
    distance: 0.9,
    ease: 'outBack',
  });
  // little canopy / glow bar over vending
  addBox(vendingGroup, 0.08, 0.1, 2.55, basicMat(0xd7fff2), {
    x: 3.28,
    y: 2.38,
    z: -4.2,
    cast: false,
  });
  const vendingLight = new THREE.PointLight(0x93f2dc, 6.5, 4.8, 1.8);
  vendingLight.position.set(4.35, 1.35, -4.2);
  scene.add(vendingLight);
  intro.addLight(vendingLight, { start: 5.35, duration: 0.6, intensity: 6.5, flicker: true });

  // bins by vending machines
  const bins = new THREE.Group();
  const binData = [
    ['かん・びん', '#3b9f9e'],
    ['ペット', '#d8a652'],
    ['もえる', '#c36d64'],
  ];
  binData.forEach(([label, color], i) => {
    const bin = makeBin(label, color);
    bin.position.set(0.0, 0, -i * 0.48);
    bin.rotation.y = Math.PI / 2;
    bins.add(bin);
  });
  bins.position.set(4.53, 0.16, -6.15);
  bins.rotation.y = 0;
  scene.add(bins);
  intro.add(bins, {
    start: 5.5,
    duration: 0.55,
    motion: 'drop',
    distance: 0.6,
    ease: 'outBack',
  });

  // bicycle at the front-left corner
  const bike = makeBicycle(0x84c8b7);
  bike.position.set(-6.83, 0.16, 4.18);
  bike.rotation.y = -0.14;
  bike.scale.setScalar(0.96);
  scene.add(bike);
  intro.add(bike, {
    start: 5.3,
    duration: 0.7,
    motion: 'drop',
    distance: 0.75,
    spin: 0.28,
    ease: 'outBack',
  });
  // tiny bike stand
  const bikeStand = new THREE.Group();
  addCylinder(bikeStand, 0.025, 0.025, 0.5, MAT.metal, {
    x: -7.45,
    y: 0.4,
    z: 4.25,
    rz: 0.16,
    segments: 5,
  });
  scene.add(bikeStand);
  intro.add(bikeStand, { start: 5.4, duration: 0.4, motion: 'rise', distance: 0.2 });

  // guardrails
  const guard1 = makeGuardrail(3.2);
  guard1.position.set(-10.9, 0.16, 5.16);
  guard1.rotation.y = 0.0;
  scene.add(guard1);
  intro.add(guard1, {
    start: 5.08,
    duration: 0.55,
    motion: 'rise',
    distance: 0.6,
    ease: 'outBack',
  });
  const guard2 = makeGuardrail(2.8);
  guard2.position.set(5.14, 0.16, -2.15);
  guard2.rotation.y = -Math.PI / 2;
  scene.add(guard2);
  intro.add(guard2, {
    start: 5.2,
    duration: 0.55,
    motion: 'rise',
    distance: 0.7,
    ease: 'outBack',
  });

  // street lamp at the corner
  const lamp = makeStreetLamp();
  lamp.position.set(11.95, 0.16, 4.85);
  lamp.rotation.y = Math.PI;
  scene.add(lamp);
  intro.add(lamp, {
    start: 5.35,
    duration: 0.8,
    motion: 'rise',
    distance: 0.8,
    ease: 'outBack',
  });
  const lampLight = new THREE.SpotLight(0xffc87f, 38, 17, 0.78, 0.66, 1.4);
  lampLight.position.set(11.95 - 1.48, 0.16 + 5.72, 4.85 - 1.05);
  lampLight.target.position.set(9.4, 0, 4.4);
  lampLight.castShadow = false;
  scene.add(lampLight);
  scene.add(lampLight.target);
  intro.addLight(lampLight, {
    start: 6.4,
    duration: 0.75,
    intensity: 38,
    flicker: true,
  });
  // fake warm pool under the lamp
  const poolTex = makeSoftGlow();
  const poolMat = new THREE.MeshBasicMaterial({
    map: poolTex,
    color: 0xffd89c,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(10.3, 0.062, 3.9);
  pool.renderOrder = 2;
  scene.add(pool);
  intro.add(pool, {
    start: 6.4,
    duration: 0.8,
    motion: 'scale',
    ease: 'outCubic',
    scaleFrom: 0.3,
  });
  // light shaft through the rain
  const beamTex = canvasTexture(128, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,225,172,.35)');
    g.addColorStop(0.25, 'rgba(255,220,166,.16)');
    g.addColorStop(0.75, 'rgba(255,220,166,.04)');
    g.addColorStop(1, 'rgba(255,220,166,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    const side = ctx.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, 'rgba(0,0,0,0)');
    side.addColorStop(0.2, 'rgba(0,0,0,.85)');
    side.addColorStop(0.5, 'rgba(0,0,0,.45)');
    side.addColorStop(0.8, 'rgba(0,0,0,.85)');
    side.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, w, h);
  });
  const beamGeo = new THREE.ConeGeometry(2.7, 5.4, 28, 8, true);
  const beamMat = new THREE.MeshBasicMaterial({
    map: beamTex,
    color: 0xffd99f,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(10.47, 2.85, 3.8);
  beam.renderOrder = 1;
  scene.add(beam);
  intro.add(beam, {
    start: 6.4,
    duration: 1.2,
    motion: 'fade',
    onUpdate: (p) => {
      beamMat.opacity = 0.16 * p;
    },
    onDone: () => {
      beamMat.opacity = 0.16;
    },
  });

  // utility poles
  const poleA = makeUtilityPole(10.2);
  poleA.position.set(12.45, 0.16, 4.6);
  scene.add(poleA);
  intro.add(poleA, {
    start: 5.52,
    duration: 0.9,
    motion: 'growY',
    ease: 'outCubic',
  });
  const poleB = makeUtilityPole(9.4);
  poleB.position.set(-8.0, 0.16, 12.6);
  scene.add(poleB);
  intro.add(poleB, {
    start: 5.66,
    duration: 0.9,
    motion: 'growY',
    ease: 'outCubic',
  });
  // a third pole tucked behind the shop for pass-through wires
  const poleC = makeUtilityPole(8.8);
  poleC.position.set(-12.8, 0.16, -11.9);
  scene.add(poleC);
  intro.add(poleC, {
    start: 5.8,
    duration: 0.85,
    motion: 'growY',
    ease: 'outCubic',
  });

  const wires = makeWires();
  scene.add(wires.group);
  wires.group.visible = false;
  const wireBase = 0.82;
  wires.group.traverse((o) => {
    if (o.isMesh) o.material = wires.material;
  });
  wires.material.opacity = 0;
  intro.add(wires.group, {
    start: 6.0,
    duration: 1.1,
    motion: 'fade',
    onUpdate: (p) => {
      wires.group.visible = true;
      wires.material.opacity = wireBase * p;
    },
    onDone: () => {
      wires.group.visible = true;
      wires.material.opacity = wireBase;
    },
  });

  // A-frame sidewalk sign by the entrance
  const aFrame = makeAFrameSign();
  aFrame.position.set(4.22, 0.16, 2.72);
  aFrame.rotation.y = -0.55;
  scene.add(aFrame);
  intro.add(aFrame, {
    start: 5.72,
    duration: 0.55,
    motion: 'scale',
    ease: 'outBack',
  });

  // a store delivery crate by the side
  const crate = new THREE.Group();
  addBox(crate, 0.7, 0.45, 0.5, toonMat(0x9f805f), {
    y: 0.225,
    z: 0,
    r: 0.02,
    outline: true,
    thickness: 0.006,
  });
  addBox(crate, 0.58, 0.05, 0.38, toonMat(0x6f5b46), {
    y: 0.47,
    z: 0,
    cast: false,
  });
  addBox(crate, 0.24, 0.25, 0.22, toonMat(0xd4c4a5), {
    x: 0.12,
    y: 0.35,
    z: 0.08,
    rz: 0.12,
    cast: false,
  });
  crate.position.set(4.48, 0.16, -7.2);
  scene.add(crate);
  intro.add(crate, { start: 5.5, duration: 0.5, motion: 'drop', distance: 0.45, ease: 'outBack' });

  // foreground street tree + little bench on the opposite sidewalk
  const tree = makeStreetTree(0.98, 23);
  tree.position.set(-12.05, 0.16, 12.18);
  tree.rotation.y = 0.18;
  scene.add(tree);
  intro.add(tree, {
    start: 5.92,
    duration: 1.0,
    motion: 'growY',
    ease: 'outCubic',
  });
  const tree2 = makeStreetTree(0.68, 41);
  tree2.position.set(12.75, 0.16, -8.1);
  tree2.rotation.y = -0.4;
  scene.add(tree2);
  intro.add(tree2, {
    start: 6.12,
    duration: 0.9,
    motion: 'growY',
    ease: 'outCubic',
  });
  const bench = makeStreetBench();
  bench.position.set(-10.55, 0.16, 13.1);
  bench.rotation.y = Math.PI;
  scene.add(bench);
  intro.add(bench, {
    start: 5.75,
    duration: 0.6,
    motion: 'drop',
    distance: 0.4,
    ease: 'outBack',
  });

  // café ambient glow
  const cafeLight = new THREE.PointLight(0xff88ac, 7.0, 6.5, 1.9);
  cafeLight.position.set(-9.73, 5.1, 2.85);
  scene.add(cafeLight);
  intro.addLight(cafeLight, { start: 6.3, duration: 0.5, intensity: 7.0, flicker: true });

  const cafeDoorLight = new THREE.PointLight(0xffb66f, 4.6, 3.2, 2);
  cafeDoorLight.position.set(-10.2, 2.0, 2.6);
  scene.add(cafeDoorLight);
  intro.addLight(cafeDoorLight, { start: 6.12, duration: 0.6, intensity: 4.6, flicker: false });

  const alleyMouthLight = new THREE.PointLight(0xffb36a, 3.6, 3.4, 2);
  alleyMouthLight.position.set(-8.55, 2.0, 2.6);
  scene.add(alleyMouthLight);
  intro.addLight(alleyMouthLight, { start: 6.1, duration: 0.6, intensity: 3.6, flicker: false });

  // tiny warm light in the alley
  const alleyLight = new THREE.PointLight(0xffb568, 4.8, 4.2, 2);
  alleyLight.position.set(-8.7, 2.4, -3.6);
  scene.add(alleyLight);
  intro.addLight(alleyLight, { start: 6.6, duration: 0.6, intensity: 4.8, flicker: true });

  // wall-mounted AC on the front of the café
  const cafeAC = makeExteriorAC(0.78);
  cafeAC.position.set(-9.65, 7.35, 2.6);
  cafeAC.rotation.y = 0;
  scene.add(cafeAC);
  intro.add(cafeAC, {
    start: 5.65,
    duration: 0.5,
    motion: 'drop',
    distance: 0.5,
    ease: 'outBack',
  });

  return {
    neighbour,
    alley,
    vendingGroup,
    bike,
    lamp,
    lampLight,
    poleA,
    poleB,
    wires: wires.group,
    vendingLight,
    cafeLight,
    alleyLight,
  };
}
