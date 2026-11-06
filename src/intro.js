import { clamp, ease } from './core.js';

const EASINGS = {
  outCubic: ease.outCubic,
  outQuint: ease.outQuint,
  outBack: ease.outBack,
  inOutCubic: ease.inOutCubic,
  inOutSine: ease.inOutSine,
};

function flickerValue(p) {
  if (p < 0.08) return 0.15;
  if (p < 0.16) return 1.0;
  if (p < 0.21) return 0.08;
  if (p < 0.28) return 0.72;
  if (p < 0.34) return 0.16;
  if (p < 0.41) return 0.9;
  return 1.0;
}

/**
 * Small timeline that assembles the diorama out of loose parts.
 * Each entry animates only the group it was registered with, so entries
 * must not be nested inside one another.
 */
export class Intro {
  constructor() {
    this.entries = [];
    this.lights = [];
    this.time = 0;
    this.duration = 0;
    this.finished = false;
    this.onFinish = [];
  }

  add(object, opts = {}) {
    if (!object) return object;
    const motion = opts.motion ?? 'drop';
    const start = opts.start ?? 0;
    const duration = opts.duration ?? 0.9;
    const offset = opts.offset ? [...opts.offset] : [0, 0, 0];
    if (opts.direction) {
      const d = opts.direction;
      offset[0] += d[0] * (opts.distance ?? 1);
      offset[1] += d[1] * (opts.distance ?? 1);
      offset[2] += d[2] * (opts.distance ?? 1);
    }
    if (motion === 'drop' && !opts.offset && !opts.direction) offset[1] = opts.distance ?? 5;
    if (motion === 'rise' && !opts.offset && !opts.direction) offset[1] = -(opts.distance ?? 2);
    const easeOpt = opts.ease ?? (motion === 'scale' ? 'outBack' : 'outCubic');
    const easeFn = typeof easeOpt === 'function' ? easeOpt : EASINGS[easeOpt];
    const entry = {
      object,
      start,
      duration,
      motion,
      offset,
      ease: easeFn ?? EASINGS.outCubic,
      basePos: object.position.clone(),
      baseRot: object.rotation.clone(),
      baseScale: object.scale.clone(),
      spin: opts.spin ?? 0,
      scaleFrom: opts.scaleFrom ?? 0.001,
      done: false,
      onUpdate: opts.onUpdate ?? null,
      onDone: opts.onDone ?? null,
    };
    object.visible = false;
    this.entries.push(entry);
    this.duration = Math.max(this.duration, start + duration);
    return object;
  }

  addLight(light, opts = {}) {
    if (!light) return;
    const start = opts.start ?? 0;
    const duration = opts.duration ?? 0.5;
    const target = opts.intensity ?? light.intensity;
    const entry = {
      light,
      start,
      duration,
      target,
      flicker: opts.flicker ?? false,
      done: false,
      onDone: opts.onDone ?? null,
    };
    light.intensity = 0;
    this.lights.push(entry);
    this.duration = Math.max(this.duration, start + duration);
    return light;
  }

  addCallback(time, fn) {
    this.entries.push({
      isCallback: true,
      start: time,
      duration: 0.001,
      done: false,
      onDone: fn,
    });
    this.duration = Math.max(this.duration, time);
  }

  updateAt(t) {
    this.time = t;
    let allDone = true;
    for (const e of this.entries) {
      if (e.isCallback) {
        if (!e.done && t >= e.start) {
          e.done = true;
          e.onDone?.();
        }
        if (!e.done) allDone = false;
        continue;
      }
      if (e.done) continue;
      const raw = (t - e.start) / e.duration;
      if (raw < 0) {
        e.object.visible = false;
        allDone = false;
        continue;
      }
      const p = clamp(raw, 0, 1);
      const ep = e.ease(p);
      e.object.visible = true;
      const o = e.object;
      if (e.motion === 'scale') {
        const s = e.scaleFrom + (1 - e.scaleFrom) * ep;
        o.scale.set(e.baseScale.x * s, e.baseScale.y * s, e.baseScale.z * s);
        o.position.copy(e.basePos);
      } else if (e.motion === 'growY') {
        const sy = e.scaleFrom + (1 - e.scaleFrom) * ep;
        o.scale.set(e.baseScale.x, e.baseScale.y * sy, e.baseScale.z);
        o.position.copy(e.basePos);
      } else if (e.motion === 'fade') {
        o.position.copy(e.basePos);
        o.rotation.copy(e.baseRot);
        o.scale.copy(e.baseScale);
      } else {
        o.position.set(
          e.basePos.x + e.offset[0] * (1 - ep),
          e.basePos.y + e.offset[1] * (1 - ep),
          e.basePos.z + e.offset[2] * (1 - ep)
        );
        o.scale.copy(e.baseScale);
      }
      if (e.spin) {
        o.rotation.set(
          e.baseRot.x + e.spin * (1 - ep),
          e.baseRot.y + e.spin * (1 - ep) * 0.35,
          e.baseRot.z + e.spin * (1 - ep)
        );
      } else {
        o.rotation.copy(e.baseRot);
      }
      e.onUpdate?.(p, t);
      if (p >= 1) {
        e.done = true;
        o.position.copy(e.basePos);
        o.rotation.copy(e.baseRot);
        o.scale.copy(e.baseScale);
        e.onDone?.();
      } else {
        allDone = false;
      }
    }
    for (const l of this.lights) {
      if (l.done) continue;
      const raw = (t - l.start) / l.duration;
      if (raw < 0) {
        l.light.intensity = 0;
        allDone = false;
        continue;
      }
      if (raw >= 1) {
        l.light.intensity = l.target;
        l.done = true;
        l.onDone?.();
        continue;
      }
      allDone = false;
      const p = clamp(raw, 0, 1);
      const v = l.flicker ? flickerValue(p) : ease.outCubic(p);
      l.light.intensity = l.target * v;
    }
    if (allDone && !this.finished) {
      this.finished = true;
      this.onFinish.forEach((fn) => fn());
    }
  }

  finish() {
    const t = this.duration + 1;
    this.updateAt(t);
    this.finished = true;
  }
}
