import {
  canvasTexture,
  C,
  DISPLAY_FONT,
  JP_FONT,
  MONO_FONT,
  mulberry32,
  roundRectPath,
  drawStar2D,
  hexToCss,
} from './core.js';

const TEAL = '#164e4e';
const TEAL_DEEP = '#0c353a';
const CREAM = '#f8ecd7';
const CORAL = '#e87263';
const MINT = '#8bd9c8';

function noise(ctx, w, h, amount, rng, light = true) {
  for (let i = 0; i < amount; i++) {
    const a = rng() * 0.09;
    ctx.fillStyle = light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const s = 0.5 + rng() * 2.2;
    ctx.fillRect(rng() * w, rng() * h, s, s);
  }
}

function spacedText(ctx, text, x, y, spacing = 0) {
  if (!spacing) {
    ctx.fillText(text, x, y);
    return ctx.measureText(text).width;
  }
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
  return cursor - x - spacing;
}

export function makeAsphaltTexture() {
  return canvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      const rng = mulberry32(44);
      ctx.fillStyle = '#2b303b';
      ctx.fillRect(0, 0, w, h);
      // broad tonal patches
      for (let i = 0; i < 26; i++) {
        const x = rng() * w;
        const y = rng() * h;
        const r = 40 + rng() * 180;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${rng() > 0.5 ? '12,18,27' : '76,82,93'},${0.08 + rng() * 0.08})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // fine aggregate
      for (let i = 0; i < 6200; i++) {
        const bright = rng() > 0.78;
        ctx.fillStyle = bright
          ? `rgba(162,170,181,${0.035 + rng() * 0.12})`
          : `rgba(7,11,17,${0.03 + rng() * 0.14})`;
        const s = 0.45 + rng() * 1.8;
        ctx.fillRect(rng() * w, rng() * h, s, s);
      }
      // repaired seams
      ctx.strokeStyle = 'rgba(11,16,24,.22)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 362);
      ctx.bezierCurveTo(220, 366, 490, 355, 1024, 358);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(139,146,154,.06)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 369);
      ctx.bezierCurveTo(310, 374, 610, 360, 1024, 365);
      ctx.stroke();
      // hairline cracks
      for (let i = 0; i < 5; i++) {
        let x = rng() * w;
        let y = rng() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += -30 + rng() * 60;
          y += 20 + rng() * 40;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(8,12,18,.2)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      noise(ctx, w, h, 900, rng, true);
    },
    { repeat: [5, 5], anisotropy: 16 }
  );
}

export function makePaverTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const rng = mulberry32(71);
      ctx.fillStyle = '#7e858c';
      ctx.fillRect(0, 0, w, h);
      const cols = 4;
      const rows = 4;
      const cw = w / cols;
      const ch = h / rows;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const shade = 0.88 + rng() * 0.22;
          const base = Math.floor(124 * shade);
          ctx.fillStyle = `rgb(${base},${base + 4},${base + 7})`;
          ctx.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4);
          // pillowed edge highlight
          const g = ctx.createLinearGradient(x * cw, y * ch, x * cw, (y + 1) * ch);
          g.addColorStop(0, 'rgba(255,255,255,.1)');
          g.addColorStop(0.45, 'rgba(255,255,255,0)');
          g.addColorStop(1, 'rgba(0,0,0,.11)');
          ctx.fillStyle = g;
          ctx.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4);
        }
      }
      ctx.strokeStyle = 'rgba(43,48,56,.44)';
      ctx.lineWidth = 4;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cw, 0);
        ctx.lineTo(i * cw, h);
        ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * ch);
        ctx.lineTo(w, i * ch);
        ctx.stroke();
      }
      for (let i = 0; i < 450; i++) {
        ctx.fillStyle = `rgba(${rng() > 0.5 ? '230,238,240' : '38,46,52'},${0.03 + rng() * 0.08})`;
        ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
      }
    },
    { repeat: [2, 2], anisotropy: 8 }
  );
}

export function makeTactileTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#d8b34c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,225,139,.8)';
      for (let y = 12; y < h; y += 26) {
        for (let x = 12; x < w; x += 26) {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(109,86,20,.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    },
    { repeat: [4, 4], anisotropy: 4 }
  );
}

export function makeConcreteTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const rng = mulberry32(81);
      ctx.fillStyle = '#555c63';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 48; i++) {
        const x = rng() * w;
        const y = rng() * h;
        const r = 18 + rng() * 100;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${rng() > 0.5 ? '25,31,37' : '139,146,151'},.09)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      noise(ctx, w, h, 2700, rng, true);
      ctx.strokeStyle = 'rgba(22,28,32,.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, h - 2);
    },
    { repeat: [3, 3], anisotropy: 8 }
  );
}

// ---------------------------------------------------------------------------
// Store signage
// ---------------------------------------------------------------------------
function signBackground(ctx, w, h, style = 'cream') {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (style === 'cream') {
    grad.addColorStop(0, '#fff7e6');
    grad.addColorStop(0.55, '#f4e6cd');
    grad.addColorStop(1, '#e8d4b2');
  } else {
    grad.addColorStop(0, '#164e50');
    grad.addColorStop(1, '#0a3034');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 10;
  ctx.strokeRect(7, 7, w - 14, h - 14);
  // mint stripes
  ctx.fillStyle = MINT;
  ctx.fillRect(0, h - 24, w, 12);
  ctx.fillStyle = CORAL;
  ctx.fillRect(0, h - 12, w, 5);
}

export function makeStoreSign(kind = 'front') {
  const sizes = {
    front: [2048, 360],
    corner: [900, 360],
    side: [960, 360],
  };
  const [w, h] = sizes[kind] ?? sizes.front;
  return canvasTexture(w, h, (ctx) => {
    signBackground(ctx, w, h);
    ctx.save();
    ctx.textBaseline = 'middle';
    if (kind === 'front') {
      // emblem
      const cx = 196;
      const cy = 171;
      ctx.fillStyle = CORAL;
      ctx.beginPath();
      ctx.arc(cx, cy, 112, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.fillStyle = CREAM;
      drawStar2D(ctx, cx, cy, 78, 34, 5, -Math.PI / 2);
      ctx.fill();
      // main wordmark
      ctx.fillStyle = TEAL;
      ctx.font = `900 122px ${DISPLAY_FONT}`;
      ctx.letterSpacing = '5px';
      ctx.fillText('HOSHI MART', 346, 142);
      ctx.font = `700 56px ${JP_FONT}`;
      ctx.letterSpacing = '8px';
      ctx.fillStyle = CORAL;
      ctx.fillText('ほしまーと', 354, 232);
      ctx.fillStyle = TEAL;
      ctx.font = `600 28px ${JP_FONT}`;
      ctx.letterSpacing = '4px';
      ctx.fillText('あかるい くらしの まんなか。', 356, 292);
      // right badge
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w - 170, 168, 95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = TEAL;
      ctx.textAlign = 'center';
      ctx.font = `800 78px ${DISPLAY_FONT}`;
      ctx.letterSpacing = '0px';
      ctx.fillText('24H', w - 170, 156);
      ctx.font = `600 25px ${MONO_FONT}`;
      ctx.fillText('OPEN EVERYDAY', w - 170, 215);
      // tiny stars
      ctx.fillStyle = CORAL;
      for (const [sx, sy, sr] of [
        [w - 300, 102, 6],
        [w - 320, 242, 4],
        [w - 84, 84, 5],
      ]) {
        drawStar2D(ctx, sx, sy, sr, sr * 0.42, 5, -Math.PI / 2);
        ctx.fill();
      }
    } else if (kind === 'corner') {
      ctx.fillStyle = TEAL;
      ctx.font = `900 118px ${DISPLAY_FONT}`;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('HOSHI', w / 2, 145);
      ctx.fillStyle = CORAL;
      ctx.font = `700 66px ${JP_FONT}`;
      ctx.letterSpacing = '18px';
      ctx.fillText('マート', w / 2, 244);
      ctx.fillStyle = TEAL;
      ctx.font = `600 24px ${MONO_FONT}`;
      ctx.letterSpacing = '5px';
      ctx.fillText('GOOD COFFEE  /  GOOD DAY', w / 2, 305);
      ctx.fillStyle = CORAL;
      drawStar2D(ctx, 82, 80, 28, 12, 5, -Math.PI / 2);
      ctx.fill();
      drawStar2D(ctx, w - 82, 274, 20, 9, 5, -Math.PI / 2);
      ctx.fill();
    } else {
      ctx.fillStyle = TEAL;
      ctx.font = `900 120px ${DISPLAY_FONT}`;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('MART', w / 2, 144);
      ctx.fillStyle = CORAL;
      ctx.font = `700 62px ${JP_FONT}`;
      ctx.letterSpacing = '14px';
      ctx.fillText('ほしまーと', w / 2, 236);
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, 290);
      ctx.lineTo(w - 110, 290);
      ctx.stroke();
      ctx.fillStyle = TEAL;
      ctx.font = `600 23px ${MONO_FONT}`;
      ctx.letterSpacing = '3px';
      ctx.fillText('OPEN 24 HOURS', w / 2, 320);
    }
    ctx.restore();
  });
}

export function makeBladeSign() {
  return canvasTexture(400, 1360, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0b4549');
    grad.addColorStop(1, '#082c34');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e9ddc1';
    ctx.lineWidth = 10;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.strokeStyle = 'rgba(139,217,200,.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    // glowing star
    ctx.save();
    ctx.shadowColor = '#ffbe66';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ffcf82';
    drawStar2D(ctx, w / 2, 160, 92, 40, 5, -Math.PI / 2);
    ctx.fill();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff2d9';
    ctx.shadowColor = 'rgba(255,226,168,.85)';
    ctx.shadowBlur = 18;
    ctx.font = `700 124px ${JP_FONT}`;
    const chars = ['ほ', 'し', 'マ', 'ー', 'ト'];
    chars.forEach((ch, i) => {
      ctx.fillText(ch, w / 2, 330 + i * 170);
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = MINT;
    ctx.font = `700 26px ${MONO_FONT}`;
    ctx.letterSpacing = '6px';
    ctx.fillText('OPEN 24H', w / 2, h - 84);
    ctx.fillStyle = CORAL;
    ctx.fillRect(70, h - 150, w - 140, 4);
  });
}

// ---------------------------------------------------------------------------
// Posters and small artwork
// ---------------------------------------------------------------------------
export function makePoster(kind = 'ice') {
  return canvasTexture(680, 980, (ctx, w, h) => {
    ctx.textBaseline = 'middle';
    if (kind === 'ice') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#c9eff8');
      grad.addColorStop(0.55, '#e9e5fa');
      grad.addColorStop(1, '#ffd7df');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff9ed';
      ctx.fillRect(26, 26, w - 52, h - 52);
      const inner = ctx.createLinearGradient(0, 40, 0, h);
      inner.addColorStop(0, '#d6f3f7');
      inner.addColorStop(1, '#ffe6e7');
      ctx.fillStyle = inner;
      ctx.fillRect(36, 36, w - 72, h - 72);
      ctx.fillStyle = TEAL;
      ctx.font = `800 25px ${MONO_FONT}`;
      ctx.letterSpacing = '5px';
      ctx.fillText('HOSHI MART  /  SUMMER', 70, 82);
      ctx.fillStyle = CORAL;
      roundRectPath(ctx, 64, 128, 160, 58, 29);
      ctx.fill();
      ctx.fillStyle = '#fff7e8';
      ctx.font = `800 28px ${DISPLAY_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('NEW', 144, 158);
      ctx.textAlign = 'left';
      ctx.fillStyle = TEAL;
      ctx.font = `800 88px ${JP_FONT}`;
      ctx.letterSpacing = '2px';
      ctx.fillText('星の', 64, 285);
      ctx.fillText('かき氷', 64, 382);
      ctx.fillStyle = '#cc6a60';
      ctx.font = `700 34px ${JP_FONT}`;
      ctx.fillText('夏、はじめました。', 68, 458);
      // ice bowl
      ctx.save();
      ctx.translate(w / 2, 700);
      // mound
      const ice = ctx.createLinearGradient(-180, -130, 200, 20);
      ice.addColorStop(0, '#ffffff');
      ice.addColorStop(0.55, '#d8f5ff');
      ice.addColorStop(1, '#ffcad9');
      ctx.fillStyle = ice;
      ctx.beginPath();
      ctx.moveTo(-200, -20);
      ctx.bezierCurveTo(-210, -180, 20, -265, 160, -150);
      ctx.bezierCurveTo(240, -80, 208, -12, 190, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,153,162,.22)';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-30 + i * 70, -100 - i * 25, 54, 0.2, 2.6);
        ctx.stroke();
      }
      ctx.fillStyle = '#d9578c';
      ctx.beginPath();
      ctx.arc(40, -195, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a5e2cb';
      ctx.beginPath();
      ctx.arc(116, -150, 24, 0, Math.PI * 2);
      ctx.fill();
      // bowl
      ctx.fillStyle = '#167177';
      ctx.beginPath();
      ctx.moveTo(-218, 0);
      ctx.quadraticCurveTo(-190, 154, 0, 162);
      ctx.quadraticCurveTo(190, 154, 218, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f0d190';
      ctx.fillRect(-214, 0, 428, 20);
      ctx.strokeStyle = '#f7e3b8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-80, 30);
      ctx.quadraticCurveTo(0, 80, 80, 30);
      ctx.stroke();
      // spoon
      ctx.rotate(-0.5);
      ctx.fillStyle = '#c5aa7c';
      ctx.fillRect(90, -140, 12, 180);
      ctx.beginPath();
      ctx.ellipse(96, -158, 34, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.textAlign = 'center';
      ctx.fillStyle = TEAL;
      ctx.font = `800 50px ${DISPLAY_FONT}`;
      ctx.fillText('¥ 360', w / 2, 900);
      ctx.fillStyle = '#5f7574';
      ctx.font = `600 25px ${JP_FONT}`;
      ctx.fillText('ほしまーと 各店', w / 2, 942);
    } else if (kind === 'karaage') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#f8c65f');
      grad.addColorStop(1, '#df6d55');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8e342e';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 80 + i * 50, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,220,145,${0.16 - i * 0.019})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = '#fff4da';
      ctx.fillRect(30, 30, w - 60, h - 60);
      ctx.fillStyle = '#9d3f32';
      ctx.fillRect(42, 42, w - 84, h - 84);
      ctx.fillStyle = '#f9e4b7';
      ctx.font = `800 27px ${MONO_FONT}`;
      ctx.letterSpacing = '6px';
      ctx.textAlign = 'center';
      ctx.fillText('HOT SNACK  /  FRESH FRIED', w / 2, 94);
      ctx.fillStyle = '#fff5d8';
      ctx.font = `800 130px ${JP_FONT}`;
      ctx.letterSpacing = '4px';
      ctx.fillText('からあげ', w / 2, 245);
      ctx.font = `700 42px ${JP_FONT}`;
      ctx.fillStyle = '#f4ca7c';
      ctx.fillText('できたて、サクサク。', w / 2, 311);
      // basket
      ctx.save();
      ctx.translate(w / 2, 665);
      ctx.rotate(-0.06);
      ctx.fillStyle = '#f7efe0';
      ctx.beginPath();
      ctx.moveTo(-210, -70);
      ctx.lineTo(210, -70);
      ctx.lineTo(156, 132);
      ctx.lineTo(-156, 132);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9e3e35';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(-220, -82);
      ctx.lineTo(220, -82);
      ctx.stroke();
      // paper stripes
      ctx.strokeStyle = '#d16a5a';
      ctx.lineWidth = 8;
      for (let i = -160; i < 190; i += 55) {
        ctx.beginPath();
        ctx.moveTo(i, -52);
        ctx.lineTo(i + 18, 116);
        ctx.stroke();
      }
      // fried chicken pieces
      const pieces = [
        [-122, -132, 82, 0.2, '#c97532'],
        [5, -156, 94, -0.3, '#e2973e'],
        [126, -118, 76, 0.5, '#b9642b'],
        [-55, -228, 75, 0.1, '#d08336'],
        [72, -238, 66, -0.4, '#e0a145'],
      ];
      for (const [x, y, r, rot, col] of pieces) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = col;
        ctx.beginPath();
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          const rr = r * (0.72 + ((k * 37) % 11) / 42);
          const px = Math.cos(a) * rr;
          const py = Math.sin(a) * rr * 0.72;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,224,151,.55)';
        for (let c = 0; c < 6; c++) {
          ctx.beginPath();
          ctx.arc(-r * 0.4 + c * 14, -10 + ((c * 17) % 19), 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      // steam
      ctx.strokeStyle = 'rgba(255,247,222,.65)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (const x of [-90, 0, 90]) {
        ctx.beginPath();
        ctx.moveTo(x, -280);
        ctx.bezierCurveTo(x - 30, -330, x + 30, -360, x, -406);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#fff2cc';
      roundRectPath(ctx, w / 2 - 92, 862, 184, 60, 30);
      ctx.fill();
      ctx.fillStyle = '#9b3c31';
      ctx.font = `800 38px ${DISPLAY_FONT}`;
      ctx.fillText('¥ 240', w / 2, 893);
    } else {
      // oden
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#203a50');
      grad.addColorStop(0.6, '#33565e');
      grad.addColorStop(1, '#13252d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f0ddb7';
      ctx.lineWidth = 14;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f3dfb8';
      ctx.font = `600 25px ${MONO_FONT}`;
      ctx.letterSpacing = '7px';
      ctx.fillText('HOSHI MART  /  WINTER', w / 2, 88);
      ctx.fillStyle = '#ffe4a8';
      ctx.shadowColor = '#ffb151';
      ctx.shadowBlur = 26;
      ctx.font = `800 118px ${JP_FONT}`;
      ctx.letterSpacing = '8px';
      ctx.fillText('おでん', w / 2, 255);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#a9d7ca';
      ctx.font = `700 31px ${JP_FONT}`;
      ctx.fillText('あったかい、ひとくち。', w / 2, 325);
      // steam
      ctx.strokeStyle = 'rgba(229,244,235,.7)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(190 + i * 85, 420);
        ctx.bezierCurveTo(150 + i * 85, 360, 240 + i * 85, 335, 195 + i * 85, 275);
        ctx.stroke();
      }
      // pot
      ctx.fillStyle = '#8b4b3d';
      ctx.beginPath();
      ctx.ellipse(w / 2, 690, 235, 95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d0a26c';
      ctx.beginPath();
      ctx.ellipse(w / 2, 665, 210, 73, 0, 0, Math.PI * 2);
      ctx.fill();
      // broth
      ctx.fillStyle = '#d6b377';
      ctx.beginPath();
      ctx.ellipse(w / 2, 658, 190, 58, 0, 0, Math.PI * 2);
      ctx.fill();
      // ingredients
      const items = [
        [-122, -6, '#e6c17e', 26, 16],
        [-55, 9, '#ead7ac', 30, 25],
        [20, -14, '#d0a267', 28, 20],
        [88, 8, '#c58050', 31, 23],
        [142, -12, '#dfbc7b', 22, 14],
      ];
      for (const [x, y, col, rx, ry] of items) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(w / 2 + x, 650 + y, rx, ry, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,52,30,.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      for (const x of [-100, 10, 110]) {
        ctx.strokeStyle = '#dac394';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(w / 2 + x, 610);
        ctx.lineTo(w / 2 + x + 14, 520);
        ctx.stroke();
      }
      // bowl loops
      ctx.fillStyle = '#f2e1bd';
      ctx.fillRect(w / 2 - 250, 690, 500, 22);
      ctx.fillStyle = '#1a3039';
      ctx.font = `800 60px ${DISPLAY_FONT}`;
      ctx.fillText('¥ 160', w / 2, 824);
      ctx.font = `600 23px ${JP_FONT}`;
      ctx.fillStyle = '#d9d0bb';
      ctx.fillText('各店 16時より', w / 2, 872);
    }
  });
}

export function makeMagazineCover(index = 0) {
  const themes = [
    ['#efb6ae', '#fff1db', '夜ふかし', '小さな夜の楽しみ', 'cat'],
    ['#aadbd6', '#1e5656', '街角', '雨あがりの散歩', 'rain'],
    ['#f6d479', '#3f3b32', '珈琲', '一杯の時間', 'coffee'],
    ['#b9b7e8', '#fbf7ed', '星をみる', '冬の空と物語', 'star'],
    ['#dfe5e3', '#215e63', 'MINT', '暮らしの余白', 'leaf'],
    ['#f4c0c8', '#573944', '装苑', 'わたしの好きなもの', 'dress'],
  ];
  const [bg, ink, title, sub, motif] = themes[index % themes.length];
  return canvasTexture(460, 640, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fdf6e6';
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, w - 30, h - 30);
    ctx.fillStyle = ink;
    ctx.fillRect(36, 38, w - 72, 3);
    ctx.font = `700 22px ${JP_FONT}`;
    ctx.letterSpacing = '3px';
    ctx.fillText('月刊  HOSHI', 44, 78);
    ctx.fillStyle = ink;
    ctx.font = `800 76px ${JP_FONT}`;
    ctx.letterSpacing = '1px';
    ctx.fillText(title, 42, 174);
    ctx.font = `600 25px ${JP_FONT}`;
    ctx.fillStyle = ink;
    ctx.fillText(sub, 46, 218);
    // image block
    ctx.save();
    ctx.translate(w / 2, 380);
    ctx.fillStyle = 'rgba(255,255,255,.38)';
    ctx.fillRect(-w / 2 + 36, -135, w - 72, 268);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    if (motif === 'cat') {
      ctx.beginPath();
      ctx.arc(0, -16, 74, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-62, -60);
      ctx.lineTo(-82, -118);
      ctx.lineTo(-24, -88);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(62, -60);
      ctx.lineTo(82, -118);
      ctx.lineTo(24, -88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(-26, -24, 6, 0, Math.PI * 2);
      ctx.arc(26, -24, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = bg;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-16, 4, 16, 0, Math.PI);
      ctx.arc(18, 4, 16, 0, Math.PI);
      ctx.stroke();
    } else if (motif === 'rain') {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 6;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(-148 + i * 32, -96 + (i % 3) * 20);
        ctx.lineTo(-172 + i * 32, 32 + (i % 3) * 20);
        ctx.stroke();
      }
      ctx.fillStyle = '#f6e7c8';
      ctx.beginPath();
      ctx.moveTo(-72, 60);
      ctx.bezierCurveTo(-130, 10, -100, -86, -18, -86);
      ctx.bezierCurveTo(82, -86, 118, 14, 42, 58);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if (motif === 'coffee') {
      ctx.fillStyle = '#f8f0e0';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(-22, 20, 92, 65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(78, 16, 44, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-36, 2, 55, 1.4, 2.5);
      ctx.stroke();
    } else if (motif === 'star') {
      ctx.fillStyle = ink;
      drawStar2D(ctx, 0, -20, 96, 42, 5, -Math.PI / 2);
      ctx.fill();
      for (let i = 0; i < 12; i++) {
        const a = i * 2.2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 120, -25 + Math.sin(a) * 80, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (motif === 'leaf') {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 90);
      ctx.bezierCurveTo(-10, 0, 0, -50, 22, -120);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.ellipse(-28 + i * 15, 30 - i * 35, 28, 11, -0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, -62, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-52, -20);
      ctx.quadraticCurveTo(0, -34, 52, -20);
      ctx.lineTo(90, 105);
      ctx.lineTo(-90, 105);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = ink;
    ctx.font = `700 21px ${JP_FONT}`;
    ctx.fillText('特集  |  雨の日の過ごし方', 38, 560);
    ctx.font = `600 18px ${MONO_FONT}`;
    ctx.fillText('HOSHIMI BOOKS', 38, 600);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f7f0df';
    ctx.fillRect(w - 138, 566, 94, 40);
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.font = `700 21px ${JP_FONT}`;
    ctx.fillText('¥ 880', w - 91, 593);
  });
}

export function makeVendingTexture(theme = 'mint') {
  const warm = theme === 'warm';
  const accent = warm ? '#e0715f' : '#16857c';
  const bg = warm ? '#f9e8d0' : '#eef8f3';
  const deep = warm ? '#7e302a' : '#0f4c4c';
  return canvasTexture(720, 1240, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // header light box
    const head = ctx.createLinearGradient(0, 0, 0, 180);
    head.addColorStop(0, warm ? '#ffd7a0' : '#bdf4e7');
    head.addColorStop(1, warm ? '#efab77' : '#73d8c7');
    ctx.fillStyle = head;
    ctx.fillRect(0, 0, w, 196);
    ctx.fillStyle = deep;
    ctx.font = `800 32px ${MONO_FONT}`;
    ctx.letterSpacing = '6px';
    ctx.fillText(warm ? 'HOT & HEART' : 'SORA DRINKS', 38, 56);
    ctx.font = `800 76px ${JP_FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillText(warm ? 'あったか〜い' : 'つめた〜い', 38, 137);
    // little steam/bubbles
    ctx.strokeStyle = warm ? 'rgba(255,247,232,.9)' : 'rgba(240,255,251,.9)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(w - 146 + i * 28, 122);
      ctx.bezierCurveTo(w - 166 + i * 28, 94, w - 122 + i * 28, 76, w - 144 + i * 28, 48);
      ctx.stroke();
    }
    // product window
    ctx.fillStyle = '#fbf8ed';
    roundRectPath(ctx, 32, 218, 656, 650, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(16,75,75,.18)';
    ctx.lineWidth = 3;
    ctx.stroke();
    const rng = mulberry32(warm ? 12 : 18);
    const drinkColors = warm
      ? ['#b95e3c', '#e6b261', '#9f4937', '#f4d59a', '#784636', '#d88f63', '#f7ead0', '#be713e']
      : ['#55b9c0', '#f5cf67', '#e87375', '#8bcfa0', '#7f8ede', '#f4efe2', '#e8a5ba', '#71c4e0'];
    const rows = 3;
    const cols = 5;
    for (let r = 0; r < rows; r++) {
      const y = 255 + r * 200;
      // shelf
      ctx.fillStyle = 'rgba(15,60,60,.12)';
      ctx.fillRect(50, y + 154, 620, 4);
      for (let c = 0; c < cols; c++) {
        const x = 68 + c * 120;
        const col = drinkColors[(r * cols + c) % drinkColors.length];
        const isBottle = (r + c) % 3 === 0;
        // can or bottle
        ctx.fillStyle = col;
        if (isBottle) {
          roundRectPath(ctx, x + 24, y + 22, 48, 122, 16);
          ctx.fill();
          ctx.fillRect(x + 36, y + 6, 24, 28);
          ctx.fillStyle = '#f8f3e6';
          ctx.fillRect(x + 34, y + 10, 28, 9);
        } else {
          roundRectPath(ctx, x + 22, y + 30, 54, 118, 8);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.15)';
          ctx.fillRect(x + 34, y + 44, 10, 88);
        }
        // label band
        ctx.fillStyle = 'rgba(255,255,255,.82)';
        ctx.fillRect(x + 20, y + 88, 60, 20);
        ctx.fillStyle = deep;
        ctx.font = `700 13px ${JP_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(['そら', 'みかん', 'もも', 'おちゃ', 'ココア'][(r + c) % 5], x + 50, y + 102);
        ctx.textAlign = 'left';
        // price tag
        ctx.fillStyle = accent;
        roundRectPath(ctx, x + 28, y + 156, 38, 23, 3);
        ctx.fill();
        ctx.fillStyle = '#fff9e8';
        ctx.font = `700 14px ${MONO_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('150', x + 47, y + 172);
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,.3)';
        ctx.fillRect(x + 20, y + 30, 4, 120);
      }
    }
    // glass reflection
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ffffff';
    ctx.rotate(0.22);
    ctx.fillRect(-80, 240, 100, 760);
    ctx.fillRect(220, 240, 42, 760);
    ctx.restore();
    // button column
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#e9e3d0' : accent;
      roundRectPath(ctx, 590, 280 + i * 62, 46, 28, 8);
      ctx.fill();
    }
    // coin unit
    ctx.fillStyle = '#273c3d';
    roundRectPath(ctx, 574, 656, 88, 128, 12);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(608, 674, 20, 8);
    ctx.fillStyle = '#cfe0d8';
    ctx.font = `700 16px ${MONO_FONT}`;
    ctx.fillText('COIN', 590, 730);
    // bottom pickup
    ctx.fillStyle = '#d6ccb8';
    roundRectPath(ctx, 38, 900, 640, 288, 18);
    ctx.fill();
    ctx.fillStyle = deep;
    ctx.fillRect(58, 930, 420, 110);
    ctx.fillStyle = '#0b1416';
    ctx.fillRect(82, 950, 372, 68);
    ctx.fillStyle = '#d9d0bc';
    ctx.font = `600 22px ${JP_FONT}`;
    ctx.fillText('とりだし口', 520, 986);
    ctx.fillStyle = accent;
    ctx.fillRect(58, 1080, 600, 8);
    ctx.fillStyle = deep;
    ctx.font = `600 18px ${MONO_FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillText(warm ? 'HOSHIMI COFFEE SERVICE' : 'SORA BEVERAGE CO., LTD.', 58, 1132);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(20,67,65,.7)';
    ctx.font = `700 18px ${JP_FONT}`;
    ctx.fillText('つめた〜い / あったか〜い', w - 56, 1132);
    ctx.textAlign = 'left';
  });
}

export function makeFridgeSign(text, sub, color = '#eaf6f4') {
  return canvasTexture(600, 250, (ctx, w, h) => {
    ctx.fillStyle = '#123c40';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    for (let i = 0; i < 8; i++) ctx.fillRect(0, 20 + i * 28, w, 2);
    ctx.fillStyle = color;
    ctx.font = `800 96px ${JP_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 124);
    ctx.fillStyle = '#e7b878';
    ctx.font = `600 31px ${MONO_FONT}`;
    ctx.letterSpacing = '3px';
    ctx.fillText(sub, w / 2, 193);
    ctx.strokeStyle = '#91d4c8';
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  });
}

export function makeAisleSign(text, sub, accent = '#8bd9c8') {
  return canvasTexture(640, 260, (ctx, w, h) => {
    ctx.fillStyle = '#f5e8cf';
    roundRectPath(ctx, 0, 0, w, h, 22);
    ctx.fill();
    ctx.fillStyle = '#154f50';
    roundRectPath(ctx, 10, 10, w - 20, h - 20, 16);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(30, 48, 8, 160);
    ctx.fillStyle = '#fff2d8';
    ctx.font = `800 104px ${JP_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillText(text, 66, 140);
    ctx.fillStyle = accent;
    ctx.font = `600 25px ${MONO_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillText(sub, 72, 200);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f6e2b8';
    ctx.font = `800 38px ${DISPLAY_FONT}`;
    ctx.fillText('HOSHI', w - 36, 184);
  });
}

export function makePriceStrip() {
  return canvasTexture(1600, 120, (ctx, w, h) => {
    ctx.fillStyle = '#e8dfcc';
    ctx.fillRect(0, 0, w, h);
    let x = 4;
    const rng = mulberry32(55);
    let count = 0;
    while (x < w - 10) {
      const width = 100 + Math.floor(rng() * 34);
      const colors = ['#f0c65c', '#ee8c78', '#77c8b4', '#f5ead4', '#a8bbe5'];
      ctx.fillStyle = colors[count % colors.length];
      ctx.fillRect(x, 9, width, h - 18);
      ctx.fillStyle = count % 5 === 0 ? '#f9f4e9' : '#1c4143';
      ctx.font = `700 27px ${MONO_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`¥${[118, 150, 198, 240, 298][count % 5]}`, x + width / 2, 48);
      ctx.font = `600 19px ${JP_FONT}`;
      ctx.fillText(['おにぎり', 'からあげ', '飲料', 'スイーツ', '日用品'][count % 5], x + width / 2, 82);
      ctx.textAlign = 'left';
      x += width + 4;
      count++;
    }
  });
}

export function makeDoorDecal() {
  return canvasTexture(512, 900, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f9f2df';
    ctx.beginPath();
    ctx.arc(150, 115, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#185556';
    ctx.textAlign = 'center';
    ctx.font = `800 44px ${DISPLAY_FONT}`;
    ctx.fillText('24H', 150, 130);
    ctx.font = `600 15px ${MONO_FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillText('OPEN', 150, 158);
    // little sticker cluster
    ctx.fillStyle = '#f4d179';
    roundRectPath(ctx, 265, 68, 136, 54, 8);
    ctx.fill();
    ctx.fillStyle = '#53472c';
    ctx.font = `700 23px ${JP_FONT}`;
    ctx.fillText('ATM', 333, 103);
    ctx.fillStyle = '#d9eee7';
    roundRectPath(ctx, 265, 136, 136, 46, 8);
    ctx.fill();
    ctx.fillStyle = '#205a58';
    ctx.font = `700 20px ${MONO_FONT}`;
    ctx.fillText('WI-FI', 333, 166);
    // automatic door arrows
    ctx.strokeStyle = 'rgba(247,240,222,.9)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(140, 410);
    ctx.lineTo(226, 410);
    ctx.moveTo(196, 382);
    ctx.lineTo(226, 410);
    ctx.lineTo(196, 438);
    ctx.moveTo(372, 410);
    ctx.lineTo(286, 410);
    ctx.moveTo(316, 382);
    ctx.lineTo(286, 410);
    ctx.lineTo(316, 438);
    ctx.stroke();
    ctx.fillStyle = '#eff2e6';
    ctx.font = `600 31px ${JP_FONT}`;
    ctx.fillText('自動ドア', w / 2, 500);
    ctx.font = `600 19px ${JP_FONT}`;
    ctx.fillText('お気をつけてお入りください', w / 2, 548);
    // credit mark bar
    ctx.fillStyle = 'rgba(247,239,218,.95)';
    roundRectPath(ctx, 80, 650, 352, 116, 14);
    ctx.fill();
    ctx.fillStyle = '#1a4d4d';
    ctx.font = `700 22px ${MONO_FONT}`;
    ctx.fillText('CARD  /  QR  /  POINT', w / 2, 694);
    ctx.fillStyle = '#d96e61';
    ctx.fillRect(140, 718, 84, 24);
    ctx.fillStyle = '#5a8aa4';
    ctx.fillRect(240, 718, 132, 24);
    // star
    ctx.fillStyle = '#dc7a65';
    drawStar2D(ctx, w / 2, 830, 28, 12, 5, -Math.PI / 2);
    ctx.fill();
  });
}

export function makeMascotSticker() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // halo
    ctx.fillStyle = 'rgba(255,228,165,.2)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 210, 0, Math.PI * 2);
    ctx.fill();
    // cat body
    ctx.fillStyle = '#fbf1db';
    ctx.strokeStyle = '#174e4f';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.ellipse(w / 2, 282, 152, 132, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // ears
    ctx.beginPath();
    ctx.moveTo(118, 200);
    ctx.lineTo(146, 78);
    ctx.lineTo(234, 148);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(394, 200);
    ctx.lineTo(366, 78);
    ctx.lineTo(278, 148);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // eyes
    ctx.strokeStyle = '#174e4f';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(202, 272, 22, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(310, 272, 22, 0.15, Math.PI - 0.15);
    ctx.stroke();
    // nose, mouth
    ctx.fillStyle = '#db7f82';
    ctx.beginPath();
    ctx.moveTo(244, 318);
    ctx.lineTo(268, 318);
    ctx.lineTo(256, 336);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(240, 344, 17, 0.25, Math.PI - 0.25);
    ctx.arc(272, 344, 17, 0.25, Math.PI - 0.25);
    ctx.stroke();
    // star mark
    ctx.fillStyle = '#e7b95a';
    drawStar2D(ctx, 256, 182, 34, 15, 5, -Math.PI / 2);
    ctx.fill();
    // apron
    ctx.fillStyle = '#86d5c2';
    ctx.beginPath();
    ctx.ellipse(w / 2, 382, 122, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#174e4f';
    ctx.font = `700 30px ${MONO_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('HOSHI', w / 2, 393);
    // text
    ctx.fillStyle = '#f6e7c8';
    ctx.font = `700 32px ${JP_FONT}`;
    ctx.letterSpacing = '3px';
    ctx.fillText('ほしねこ', w / 2, 488);
  });
}

export function makeWelcomeMat() {
  return canvasTexture(640, 300, (ctx, w, h) => {
    ctx.fillStyle = '#193f3f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#eadfc8';
    ctx.lineWidth = 7;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#8ed7c7';
    drawStar2D(ctx, 92, 150, 42, 18, 5, -Math.PI / 2);
    ctx.fill();
    ctx.fillStyle = '#f7ebd2';
    ctx.font = `800 66px ${DISPLAY_FONT}`;
    ctx.letterSpacing = '6px';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME', w / 2 + 32, 126);
    ctx.fillStyle = '#d9b77e';
    ctx.font = `600 28px ${JP_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillText('ほしまーと へ ようこそ', w / 2 + 32, 188);
    // weave texture
    ctx.globalAlpha = 0.08;
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += 4) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, 0, 1, h);
    }
    ctx.globalAlpha = 1;
  });
}

export function makeCafeSign() {
  return canvasTexture(420, 1400, (ctx, w, h) => {
    ctx.fillStyle = '#251b2b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d98ba4';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#ff8ab0';
    ctx.shadowBlur = 24;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2b9c9';
    ctx.font = `700 34px ${JP_FONT}`;
    ctx.letterSpacing = '9px';
    ctx.save();
    ctx.translate(w / 2, 166);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('純喫茶', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = '#ff7ca7';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ffe6dd';
    ctx.font = `800 128px ${JP_FONT}`;
    ctx.letterSpacing = '6px';
    ctx.fillText('雨', w / 2, 500);
    ctx.fillText('音', w / 2, 665);
    ctx.restore();
    // steam curls
    ctx.strokeStyle = 'rgba(255,184,205,.6)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(126, 840);
    ctx.bezierCurveTo(84, 790, 166, 754, 126, 706);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(294, 840);
    ctx.bezierCurveTo(336, 790, 254, 754, 294, 706);
    ctx.stroke();
    // moon + typography
    ctx.strokeStyle = '#f6d7a2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, 950, 64, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f6d7a2';
    ctx.font = `600 24px ${MONO_FONT}`;
    ctx.letterSpacing = '3px';
    ctx.fillText('COFFEE  &  JAZZ', w / 2, 1070);
    ctx.fillText('OPEN  18:00 - 26:00', w / 2, 1110);
    ctx.fillStyle = '#94d7c9';
    ctx.font = `600 26px ${JP_FONT}`;
    ctx.fillText('月曜 定休', w / 2, 1230);
    ctx.strokeStyle = 'rgba(242,185,201,.5)';
    ctx.beginPath();
    ctx.moveTo(118, 1300);
    ctx.lineTo(w - 118, 1300);
    ctx.stroke();
  });
}

export function makeCafeNoren() {
  return canvasTexture(700, 420, (ctx, w, h) => {
    ctx.fillStyle = '#1a3244';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(209,227,222,.28)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = '#ecdfc8';
    ctx.font = `700 178px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('雨 音', w / 2, h / 2 + 12);
    ctx.fillStyle = '#c9878e';
    ctx.fillRect(w / 2 - 75, h - 48, 150, 4);
  });
}

export function makeCafeWindow() {
  return canvasTexture(512, 640, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#4b3b32');
    grad.addColorStop(0.5, '#9f7a52');
    grad.addColorStop(1, '#3f3a2d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // curtains
    ctx.fillStyle = 'rgba(228,198,149,.7)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.35, 0);
    ctx.bezierCurveTo(w * 0.2, h * 0.4, w * 0.42, h * 0.7, 0, h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.68, 0);
    ctx.bezierCurveTo(w * 0.8, h * 0.4, w * 0.6, h * 0.72, w, h);
    ctx.closePath();
    ctx.fill();
    // lamp
    ctx.fillStyle = 'rgba(255,223,163,.9)';
    ctx.beginPath();
    ctx.arc(w * 0.52, h * 0.3, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#47403a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.52, 0);
    ctx.lineTo(w * 0.52, h * 0.3 - 42);
    ctx.stroke();
    // table silhouette
    ctx.fillStyle = 'rgba(42,35,29,.75)';
    ctx.fillRect(w * 0.18, h * 0.7, w * 0.58, 18);
    ctx.fillRect(w * 0.26, h * 0.72, 16, h * 0.22);
    ctx.fillRect(w * 0.68, h * 0.72, 16, h * 0.22);
    ctx.fillStyle = 'rgba(250,237,203,.85)';
    ctx.beginPath();
    ctx.ellipse(w * 0.45, h * 0.67, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // little plant
    ctx.fillStyle = '#5d7160';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(w * 0.77, h * 0.58 - i * 14, 24, 7, -0.5 + i * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#b98061';
    ctx.fillRect(w * 0.73, h * 0.65, 42, 40);
    // window reflection
    const refl = ctx.createLinearGradient(0, 0, w, h);
    refl.addColorStop(0.2, 'rgba(215,235,235,0)');
    refl.addColorStop(0.45, 'rgba(215,235,235,.18)');
    refl.addColorStop(0.55, 'rgba(215,235,235,0)');
    ctx.fillStyle = refl;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeWarmWindow(kind = 0) {
  return canvasTexture(512, 540, (ctx, w, h) => {
    const palettes = [
      ['#253448', '#f6cf84', '#e2a56a', '#775d48'],
      ['#192a3d', '#f5ead3', '#8eb2b0', '#4e544d'],
      ['#2c354a', '#f0c7b5', '#c48587', '#73646d'],
    ];
    const [bg, light, mid, dark] = palettes[kind % palettes.length];
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, '#101824');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // warm ambient
    const glow = ctx.createRadialGradient(w * 0.55, h * 0.6, 0, w * 0.55, h * 0.6, w * 0.8);
    glow.addColorStop(0, light);
    glow.addColorStop(0.45, mid + '99');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // shoji / blinds
    ctx.strokeStyle = 'rgba(33,39,44,.55)';
    ctx.lineWidth = 3;
    for (let y = 80; y < h; y += 58) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // curtain
    ctx.fillStyle = 'rgba(238,215,180,.72)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.34, 0);
    ctx.bezierCurveTo(w * 0.24, h * 0.32, w * 0.5, h * 0.7, 0, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(20,28,34,.2)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.06 + i * 36, 0);
      ctx.bezierCurveTo(w * 0.1 + i * 30, h * 0.3, w * 0.14 + i * 26, h * 0.65, w * 0.02 + i * 24, h);
      ctx.lineTo(w * 0.08 + i * 24, h);
      ctx.bezierCurveTo(w * 0.17 + i * 26, h * 0.6, w * 0.13 + i * 30, h * 0.32, w * 0.1 + i * 36, 0);
      ctx.closePath();
      ctx.fill();
    }
    // furniture silhouettes
    ctx.fillStyle = dark;
    ctx.fillRect(w * 0.52, h * 0.68, w * 0.34, 18);
    ctx.fillRect(w * 0.58, h * 0.7, 14, h * 0.25);
    ctx.fillRect(w * 0.8, h * 0.7, 14, h * 0.25);
    ctx.fillStyle = 'rgba(255,235,195,.85)';
    ctx.beginPath();
    ctx.arc(w * 0.63, h * 0.55, 26, 0, Math.PI * 2);
    ctx.fill();
    // hanging plant
    ctx.strokeStyle = 'rgba(28,33,32,.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.88, 0);
    ctx.lineTo(w * 0.88, h * 0.2);
    ctx.stroke();
    ctx.fillStyle = '#405b4c';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(w * 0.88 + (i % 2 ? -14 : 14), h * 0.2 + i * 24, 26, 9, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // window streaks
    ctx.fillStyle = 'rgba(218,239,240,.09)';
    ctx.beginPath();
    ctx.moveTo(w * 0.32, 0);
    ctx.lineTo(w * 0.46, 0);
    ctx.lineTo(w * 0.2, h);
    ctx.lineTo(w * 0.06, h);
    ctx.closePath();
    ctx.fill();
    // frame
    ctx.strokeStyle = 'rgba(18,24,28,.8)';
    ctx.lineWidth = 18;
    ctx.strokeRect(0, 0, w, h);
  });
}

export function makeFridgeGlassSheen() {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0.15, 'rgba(255,255,255,0)');
    g.addColorStop(0.35, 'rgba(221,251,255,.18)');
    g.addColorStop(0.42, 'rgba(221,251,255,.03)');
    g.addColorStop(0.6, 'rgba(255,255,255,0)');
    g.addColorStop(0.72, 'rgba(255,255,255,.12)');
    g.addColorStop(0.8, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, 0);
    ctx.lineTo(w * 0.28, 0);
    ctx.lineTo(w * 0.05, h);
    ctx.lineTo(w * 0.0, h);
    ctx.closePath();
    ctx.fill();
  });
}

export function makeBulletinBoard() {
  return canvasTexture(900, 620, (ctx, w, h) => {
    // cork
    ctx.fillStyle = '#886947';
    ctx.fillRect(0, 0, w, h);
    const rng = mulberry32(9);
    for (let i = 0; i < 1500; i++) {
      ctx.fillStyle = `rgba(${rng() > 0.5 ? '220,190,140' : '55,38,24'},${0.06 + rng() * 0.16})`;
      ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 3, 1 + rng() * 2);
    }
    const papers = [
      [44, 46, 250, 310, '#f4ebd6', '夏祭り', '星見町 盆踊り大会', '#d1845e'],
      [326, 62, 224, 250, '#e9f0df', '防災', '避難場所のお知らせ', '#486e5b'],
      [576, 46, 276, 342, '#f6eee0', '募集', '商店街 イベント', '#b26c5b'],
      [332, 344, 210, 222, '#e6edf1', '図書館', '夜間開館', '#527084'],
      [52, 390, 248, 170, '#f2e8ce', '子育て', '交流ひろば', '#b08b4f'],
    ];
    for (const [x, y, pw, ph, bg, kicker, title, color] of papers) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rng() - 0.5) * 0.035);
      ctx.fillStyle = 'rgba(40,28,16,.24)';
      ctx.fillRect(6, 8, pw, ph);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, pw, ph);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, pw, 36);
      ctx.fillStyle = '#fff9ed';
      ctx.font = `700 21px ${JP_FONT}`;
      ctx.fillText(kicker, 14, 25);
      ctx.fillStyle = '#39423d';
      ctx.font = `700 30px ${JP_FONT}`;
      const words = title.split(' ');
      words.forEach((line, i) => ctx.fillText(line, 16, 84 + i * 40));
      ctx.fillStyle = 'rgba(57,66,61,.7)';
      ctx.fillRect(16, 110, pw - 32, 2);
      ctx.font = `500 17px ${JP_FONT}`;
      const lines = {
        '星見町 盆踊り大会': ['8月13日（土）', '19:00 - 21:30', '星見公園にて'],
        防災: ['9月1日 10:00', '非常持ち出し袋', 'の確認を。'],
        募集: ['出店者さん募集', '締切 8/20', '商店街事務局まで'],
        図書館: ['毎週木曜日', '21:00まで', '開館しています'],
        子育て: ['毎週水曜', '10:00 - 12:00', '雨音喫茶にて'],
      }[title] ?? [];
      ctx.fillStyle = '#555d59';
      ctx.font = `500 17px ${JP_FONT}`;
      lines.forEach((line, i) => ctx.fillText(line, 16, 150 + i * 28));
      // drawing block
      if (ph > 260) {
        ctx.fillStyle = `${color}33`;
        ctx.fillRect(16, ph - 118, pw - 32, 84);
        ctx.fillStyle = color;
        drawStar2D(ctx, pw / 2, ph - 76, 28, 12, 5, -Math.PI / 2);
        ctx.fill();
      }
      ctx.fillStyle = '#d2b05c';
      ctx.beginPath();
      ctx.arc(pw / 2, 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // little header strip
    ctx.fillStyle = 'rgba(50,38,26,.8)';
    ctx.fillRect(w - 190, h - 44, 156, 22);
    ctx.fillStyle = '#efe3c8';
    ctx.font = `600 15px ${MONO_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('HOSHIMI COMMUNITY', w - 46, h - 28);
  });
}

export function makeVendingTop(theme = 'mint') {
  return canvasTexture(600, 128, (ctx, w, h) => {
    ctx.fillStyle = theme === 'warm' ? '#f3b278' : '#95dfd4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = theme === 'warm' ? '#8e3b2e' : '#0f5558';
    ctx.font = `800 52px ${MONO_FONT}`;
    ctx.letterSpacing = '8px';
    ctx.textAlign = 'center';
    ctx.fillText(theme === 'warm' ? 'HOT & HEART' : 'SORA DRINKS', w / 2, 80);
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.fillRect(12, 12, w - 24, 6);
  });
}

export function makeReflectionTexture() {
  return canvasTexture(256, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const rng = mulberry32(31);
    ctx.filter = 'blur(12px)';
    for (let i = 0; i < 22; i++) {
      const x = w / 2 + (rng() - 0.5) * w * 0.65;
      const ww = 6 + rng() * 28;
      const y0 = rng() * h * 0.22;
      const len = 180 + rng() * 620;
      const grad = ctx.createLinearGradient(0, y0, 0, y0 + len);
      grad.addColorStop(0, `rgba(255,255,255,${0.2 + rng() * 0.32})`);
      grad.addColorStop(0.28, `rgba(255,255,255,${0.08 + rng() * 0.16})`);
      grad.addColorStop(0.7, `rgba(255,255,255,${0.02 + rng() * 0.05})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - ww / 2, y0, ww, len);
    }
    // soft central pool near the light source
    const glow = ctx.createRadialGradient(w / 2, 130, 0, w / 2, 130, 150);
    glow.addColorStop(0, 'rgba(255,255,255,.32)');
    glow.addColorStop(0.5, 'rgba(255,255,255,.12)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h * 0.45);
    ctx.filter = 'none';
    // fade the left and right edges so the quad never reads as a rectangle
    ctx.globalCompositeOperation = 'destination-in';
    const fade = ctx.createLinearGradient(0, 0, w, 0);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.2, 'rgba(0,0,0,1)');
    fade.addColorStop(0.8, 'rgba(0,0,0,1)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  });
}

export function makeSoftGlow() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,255,255,.65)');
    grad.addColorStop(0.5, 'rgba(255,255,255,.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeSteamTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const rng = mulberry32(4);
    for (let i = 0; i < 18; i++) {
      const x = w / 2 + (rng() - 0.5) * w * 0.55;
      const y = h * 0.2 + rng() * h * 0.5;
      const r = 20 + rng() * 55;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(230,242,245,.22)');
      grad.addColorStop(0.5, 'rgba(220,236,242,.09)');
      grad.addColorStop(1, 'rgba(220,236,242,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

export function makeWeatherWindow(kind = 0) {
  return canvasTexture(512, 680, (ctx, w, h) => {
    const grads = [
      ['#17293b', '#d4aa76', '#52776e'],
      ['#1b2e3a', '#e4bd84', '#6c7d75'],
    ];
    const [dark, warm, accent] = grads[kind % 2];
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, dark);
    grad.addColorStop(1, '#0a1018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
    ctx.fillStyle = warm;
    ctx.fillRect(w * 0.12, h * 0.22, w * 0.42, h * 0.42);
    ctx.fillStyle = 'rgba(20,35,36,.5)';
    ctx.fillRect(w * 0.32, h * 0.22, w * 0.06, h * 0.42);
    ctx.strokeStyle = 'rgba(244,235,211,.45)';
    ctx.lineWidth = 8;
    ctx.strokeRect(w * 0.12, h * 0.22, w * 0.42, h * 0.42);
    // little bottles / objects silhouettes
    ctx.fillStyle = 'rgba(38,48,44,.6)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(w * 0.17 + i * 45, h * 0.48, 18, 55);
    }
    // curtains
    ctx.fillStyle = 'rgba(232,210,178,.66)';
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.67, 0);
    ctx.bezierCurveTo(w * 0.74, h * 0.24, w * 0.6, h * 0.5, w, h);
    ctx.closePath();
    ctx.fill();
    // rain streaks on window
    ctx.strokeStyle = 'rgba(205,236,240,.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 53) % w, h * 0.1 + (i * 37) % (h * 0.4));
      ctx.lineTo(((i * 53) % w) - 6, h * 0.5 + (i * 31) % (h * 0.4));
      ctx.stroke();
    }
    // reflection
    ctx.fillStyle = 'rgba(215,239,238,.1)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.5, 0);
    ctx.lineTo(w * 0.7, 0);
    ctx.lineTo(w * 0.2, h);
    ctx.closePath();
    ctx.fill();
  });
}

export function makeAirConLabel() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(241,235,216,.9)';
    roundRectPath(ctx, 10, 10, w - 20, h - 20, 18);
    ctx.fill();
    ctx.fillStyle = '#355c57';
    ctx.font = `700 56px ${MONO_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillText('HOSHI', 34, 105);
    ctx.font = `600 24px ${JP_FONT}`;
    ctx.fillText('空調室外機', 36, 160);
    ctx.fillStyle = '#c67d5c';
    ctx.font = `600 21px ${MONO_FONT}`;
    ctx.fillText('DAIKIN  ·  2.8kW', 36, 200);
  });
}

export function makeParkingSign() {
  return canvasTexture(512, 680, (ctx, w, h) => {
    ctx.fillStyle = '#f4ebd6';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1b5657';
    ctx.lineWidth = 26;
    ctx.strokeRect(13, 13, w - 26, h - 26);
    ctx.fillStyle = '#1b5657';
    ctx.textAlign = 'center';
    ctx.font = `800 380px ${DISPLAY_FONT}`;
    ctx.fillText('P', w / 2, 440);
    ctx.font = `700 44px ${JP_FONT}`;
    ctx.fillText('ほしまーと', w / 2, 540);
    ctx.font = `600 26px ${MONO_FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillText('CUSTOMER PARKING', w / 2, 594);
  });
}

export function makeStreetSign(kind = 'name') {
  if (kind === 'crossing') {
    return canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1d65a9';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#eef3ee';
      ctx.lineWidth = 18;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      // zebra
      ctx.fillStyle = '#eef3ee';
      for (let i = 0; i < 5; i++) ctx.fillRect(42 + i * 65, 360, 38, 110);
      // walking person
      ctx.fillStyle = '#eef3ee';
      ctx.beginPath();
      ctx.arc(270, 120, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#eef3ee';
      ctx.lineWidth = 44;
      ctx.beginPath();
      ctx.moveTo(268, 170);
      ctx.lineTo(250, 286);
      ctx.stroke();
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(256, 214);
      ctx.lineTo(178, 278);
      ctx.moveTo(256, 214);
      ctx.lineTo(338, 270);
      ctx.moveTo(250, 286);
      ctx.lineTo(156, 380);
      ctx.moveTo(250, 286);
      ctx.lineTo(342, 360);
      ctx.stroke();
    });
  }
  if (kind === 'stop') {
    return canvasTexture(700, 640, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f6f0dd';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 24);
      ctx.lineTo(w - 30, h - 34);
      ctx.lineTo(30, h - 34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c84f50';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 70);
      ctx.lineTo(w - 84, h - 92);
      ctx.lineTo(84, h - 92);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff8ea';
      ctx.textAlign = 'center';
      ctx.font = `800 140px ${JP_FONT}`;
      ctx.letterSpacing = '6px';
      ctx.fillText('止まれ', w / 2, h - 178);
    });
  }
  return canvasTexture(900, 300, (ctx, w, h) => {
    ctx.fillStyle = '#1c5b92';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f2f0e3';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#f5f2e5';
    ctx.font = `700 94px ${JP_FONT}`;
    ctx.letterSpacing = '8px';
    ctx.textAlign = 'center';
    ctx.fillText('星見町 三丁目', w / 2, 138);
    ctx.font = `600 42px ${MONO_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillText('HOSHIMI-CHO 3', w / 2, 216);
  });
}

export function makeCafeMenu() {
  return canvasTexture(512, 720, (ctx, w, h) => {
    ctx.fillStyle = '#201c22';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d5b98b';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = '#eddcb9';
    ctx.textAlign = 'center';
    ctx.font = `700 42px ${JP_FONT}`;
    ctx.letterSpacing = '12px';
    ctx.fillText('雨音', w / 2, 90);
    ctx.font = `600 19px ${MONO_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillStyle = '#b99476';
    ctx.fillText('COFFEE & JAZZ', w / 2, 130);
    ctx.strokeStyle = 'rgba(213,185,139,.35)';
    ctx.beginPath();
    ctx.moveTo(100, 160);
    ctx.lineTo(w - 100, 160);
    ctx.stroke();
    ctx.fillStyle = '#e4d4b7';
    ctx.textAlign = 'left';
    ctx.font = `500 28px ${JP_FONT}`;
    const items = [
      ['雨音ブレンド', '¥ 480'],
      ['深煎りカフェオレ', '¥ 550'],
      ['手焼きチーズケーキ', '¥ 520'],
      ['夜のプリン', '¥ 450'],
      ['ウイスキー', '¥ 700'],
      ['自家製レモンサワー', '¥ 650'],
    ];
    items.forEach(([a, b], i) => {
      ctx.fillStyle = '#e4d4b7';
      ctx.fillText(a, 76, 230 + i * 62);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c2a578';
      ctx.font = `500 26px ${MONO_FONT}`;
      ctx.fillText(b, w - 76, 230 + i * 62);
      ctx.textAlign = 'left';
      ctx.font = `500 28px ${JP_FONT}`;
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fcfc0';
    ctx.font = `600 21px ${JP_FONT}`;
    ctx.fillText('18:00 〜 26:00  /  水曜定休', w / 2, h - 68);
  });
}

export function makeWallPosterSmall() {
  return canvasTexture(520, 720, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#e8d7b7');
    grad.addColorStop(1, '#d1b68c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#274d4d';
    ctx.font = `800 34px ${MONO_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.textAlign = 'center';
    ctx.fillText('HOSHI MART', w / 2, 70);
    ctx.fillStyle = '#a75a4a';
    ctx.font = `800 78px ${JP_FONT}`;
    ctx.fillText('地域の', w / 2, 180);
    ctx.fillText('あんしん', w / 2, 270);
    ctx.fillStyle = '#3c5754';
    ctx.font = `600 26px ${JP_FONT}`;
    ctx.fillText('防犯カメラ作動中', w / 2, 350);
    // camera icon
    ctx.strokeStyle = '#314c49';
    ctx.lineWidth = 8;
    roundRectPath(ctx, 150, 400, 220, 130, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(220, 465, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(370, 430);
    ctx.lineTo(422, 405);
    ctx.lineTo(430, 445);
    ctx.lineTo(380, 462);
    ctx.stroke();
    ctx.fillStyle = '#355a54';
    ctx.font = `500 24px ${JP_FONT}`;
    ctx.fillText('24時間 見守っています', w / 2, 615);
    ctx.fillStyle = '#a65c49';
    ctx.font = `600 20px ${MONO_FONT}`;
    ctx.fillText('HOSHIMI SECURITY', w / 2, 670);
  });
}

export function makeAlleySign() {
  return canvasTexture(360, 900, (ctx, w, h) => {
    ctx.fillStyle = '#192b2b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b99968';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#ede1c7';
    ctx.textAlign = 'center';
    ctx.font = `700 92px ${JP_FONT}`;
    ctx.letterSpacing = '12px';
    ['路', '地', '入', '口'].forEach((ch, i) => {
      ctx.fillText(ch, w / 2, 155 + i * 132);
    });
    ctx.strokeStyle = '#a37c55';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 50, 710);
    ctx.lineTo(w / 2 + 50, 710);
    ctx.stroke();
    ctx.fillStyle = '#88b3a7';
    ctx.font = `600 22px ${MONO_FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillText('HOSHIMI', w / 2, 765);
  });
}

export function makeNeonParkingArrow() {
  return canvasTexture(640, 320, (ctx, w, h) => {
    ctx.fillStyle = '#f4e6ca';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#19595b';
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#19595b';
    ctx.textAlign = 'center';
    ctx.font = `800 150px ${DISPLAY_FONT}`;
    ctx.fillText('P', 142, 208);
    ctx.font = `700 42px ${JP_FONT}`;
    ctx.fillText('駐車場', 380, 130);
    ctx.font = `600 24px ${MONO_FONT}`;
    ctx.fillText('24 HOURS', 380, 180);
    ctx.strokeStyle = '#e07b64';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(430, 236);
    ctx.lineTo(540, 236);
    ctx.lineTo(510, 206);
    ctx.moveTo(540, 236);
    ctx.lineTo(510, 266);
    ctx.stroke();
  });
}
