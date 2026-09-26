import type p5 from 'p5';

/**
 * Landing installation: spun threads.
 *
 * Each thread is a chain of points between two pinned ends, running edge to
 * edge along a random cubic curve. Physics is a simple Verlet string:
 * tension to the neighbours (lets waves travel, the "guitar string" feel)
 * plus a weak spring back to the rest shape. Threads live on three 2D layers;
 * back layers are thinner and dimmer, which fakes depth, and during the dive
 * each layer scales at its own rate (parallax).
 */

export type Rgb = [number, number, number];

export interface ThreadPalette {
  base: Rgb;
  dark: Rgb;
  light: Rgb;
}

const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// thread/project-1 … 5 (500), with 700 and 300 for the twisted strands.
export const PALETTES: ThreadPalette[] = [
  { base: hex('#ef4444'), dark: hex('#b91c1c'), light: hex('#fca5a5') },
  { base: hex('#f59e0b'), dark: hex('#b45309'), light: hex('#fcd34d') },
  { base: hex('#14b8a6'), dark: hex('#0f766e'), light: hex('#5eead4') },
  { base: hex('#3b82f6'), dark: hex('#1d4ed8'), light: hex('#93c5fd') },
  { base: hex('#8b5cf6'), dark: hex('#6d28d9'), light: hex('#c4b5fd') },
];

export const CHARCOAL = hex('#1c1917'); // bg/inverse
export const SHELL = hex('#fafaf9'); // bg/default

interface Point {
  x: number;
  y: number;
  px: number;
  py: number;
  rx: number;
  ry: number;
}

interface Fiber {
  i: number;
  side: 1 | -1;
  angle: number;
  len: number;
}

export interface Thread {
  palette: number;
  layer: 0 | 1 | 2;
  weight: number;
  alpha: number;
  phase: number;
  delay: number;
  points: Point[];
  fibers: Fiber[];
}

const SEGMENTS = 72;
const LAYERS = [
  { weight: 1.4, alpha: 0.38 },
  { weight: 2.6, alpha: 0.7 },
  { weight: 4.2, alpha: 1 },
];

// Physics tuning
const TENSION = 0.32; // neighbour pull; higher = stiffer, faster waves
const SPRING = 0.006; // pull back to rest shape
const DAMPING = 0.982; // energy kept per frame
const MAX_PUSH = 26; // px per pluck

// Draw-in
export const DRAW_DURATION = 1500;

/** Small seeded PRNG so the composition is the same on every visit. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bezier = (t: number, a: number, b: number, c: number, d: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

export function createThreads(w: number, h: number, seed = 7): Thread[] {
  const rand = mulberry32(seed);
  const threads: Thread[] = [];
  for (let c = 0; c < PALETTES.length; c++) {
    const count = 5 + Math.floor(rand() * 4); // 5–8 per project
    for (let k = 0; k < count; k++) {
      const r = rand();
      const layer = (r < 0.4 ? 0 : r < 0.75 ? 1 : 2) as 0 | 1 | 2;
      const vertical = rand() < 0.3;
      let p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number];
      if (vertical) {
        p0 = [rand() * w, -60];
        p3 = [rand() * w, h + 60];
        p1 = [rand() * w * 1.6 - w * 0.3, h * 0.3];
        p2 = [rand() * w * 1.6 - w * 0.3, h * 0.7];
      } else {
        p0 = [-60, rand() * h];
        p3 = [w + 60, rand() * h];
        p1 = [w * 0.3, rand() * h * 1.6 - h * 0.3];
        p2 = [w * 0.7, rand() * h * 1.6 - h * 0.3];
      }
      const points: Point[] = [];
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const x = bezier(t, p0[0], p1[0], p2[0], p3[0]);
        const y = bezier(t, p0[1], p1[1], p2[1], p3[1]);
        points.push({ x, y, px: x, py: y, rx: x, ry: y });
      }
      const fibers: Fiber[] = [];
      if (layer > 0) {
        // fuzz: short fibers that lean along the thread, irregularly spaced
        for (let i = 1; i < SEGMENTS; i++) {
          if (rand() > (layer === 2 ? 0.55 : 0.2)) continue;
          const side = rand() < 0.5 ? 1 : -1;
          fibers.push({ i, side, angle: side * (0.7 + rand() * 0.6), len: 1 + rand() * (layer === 2 ? 3.5 : 2) });
        }
      }
      threads.push({
        palette: c,
        layer,
        weight: LAYERS[layer].weight * (0.85 + rand() * 0.3),
        alpha: LAYERS[layer].alpha,
        phase: rand() * Math.PI * 2,
        delay: layer * 260 + rand() * 900, // back layers draw first
        points,
        fibers,
      });
    }
  }
  // back to front
  return threads.sort((a, b) => a.layer - b.layer);
}

export const drawInEnd = (threads: Thread[]) => Math.max(...threads.map((t) => t.delay)) + DRAW_DURATION;

// scratch buffers for the displacement field (reused every frame)
let dx = new Float64Array(0);
let dy = new Float64Array(0);

/**
 * One physics step for all threads. End points stay pinned.
 * Forces act on the displacement from the rest shape (so the spun curve itself
 * is the equilibrium), and every point updates from the previous frame's state.
 */
export function step(threads: Thread[]) {
  for (const t of threads) {
    const pts = t.points;
    const n = pts.length;
    if (dx.length < n) {
      dx = new Float64Array(n);
      dy = new Float64Array(n);
    }
    for (let i = 0; i < n; i++) {
      dx[i] = pts[i].x - pts[i].rx;
      dy[i] = pts[i].y - pts[i].ry;
    }
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * DAMPING;
      const vy = (p.y - p.py) * DAMPING;
      const ax = TENSION * (dx[i - 1] + dx[i + 1] - 2 * dx[i]) - SPRING * dx[i];
      const ay = TENSION * (dy[i - 1] + dy[i + 1] - 2 * dy[i]) - SPRING * dy[i];
      p.px = p.x;
      p.py = p.y;
      p.x += vx + ax;
      p.y += vy + ay;
    }
  }
}

const distToSegment = (px: number, py: number, x0: number, y0: number, x1: number, y1: number) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2)) : 0;
  const cx = x0 + t * dx - px;
  const cy = y0 + t * dy - py;
  return Math.sqrt(cx * cx + cy * cy);
};

/**
 * Pluck: when the pointer sweeps across a thread, push the nearest point in
 * the direction of the movement. Tension turns the kink into a travelling wave.
 */
export function pluck(threads: Thread[], x0: number, y0: number, x1: number, y1: number) {
  const mx = Math.max(-MAX_PUSH, Math.min(MAX_PUSH, (x1 - x0) * 0.6));
  const my = Math.max(-MAX_PUSH, Math.min(MAX_PUSH, (y1 - y0) * 0.6));
  if (Math.abs(mx) + Math.abs(my) < 1) return;
  for (const t of threads) {
    if (t.layer === 0) continue;
    const radius = 10 + t.weight * 2;
    let best = -1;
    let bestD = radius;
    for (let i = 2; i < t.points.length - 2; i++) {
      const d = distToSegment(t.points[i].x, t.points[i].y, x0, y0, x1, y1);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best > 0) {
      // spread the push over neighbouring points (cosine falloff) so the
      // thread bends in a soft bump instead of a sharp kink
      const spread = 5;
      for (let k = -spread; k <= spread; k++) {
        const i = best + k;
        if (i < 1 || i > t.points.length - 2) continue;
        const f = 0.5 + 0.5 * Math.cos((k / (spread + 1)) * Math.PI);
        t.points[i].x += mx * f;
        t.points[i].y += my * f;
      }
    }
  }
}

export interface Grab {
  thread: Thread;
  index: number;
}

/** Find the front-most thread point near the pointer. */
export function grab(threads: Thread[], x: number, y: number): Grab | null {
  for (let k = threads.length - 1; k >= 0; k--) {
    const t = threads[k];
    if (t.layer === 0) continue;
    for (let i = 2; i < t.points.length - 2; i++) {
      const p = t.points[i];
      if (Math.hypot(p.x - x, p.y - y) < 12 + t.weight * 2) return { thread: t, index: i };
    }
  }
  return null;
}

/** Hold the grabbed point at the pointer, but only let it stretch so far. */
export function drag(g: Grab, x: number, y: number) {
  const p = g.thread.points[g.index];
  const dx = x - p.rx;
  const dy = y - p.ry;
  const d = Math.hypot(dx, dy);
  const max = 140;
  const k = d > max ? max / d : 1;
  p.x = p.rx + dx * k;
  p.y = p.ry + dy * k;
  p.px = p.x;
  p.py = p.y;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

/** Per-layer camera for the dive: scale factor and opacity. */
export function layerCamera(layer: number, dive: number) {
  const e = Math.pow(dive, 1.6);
  const scale = 1 + e * (1.4 + layer * 3.6);
  const fade = 1 - smooth(0.3 + layer * 0.14, 0.72 + layer * 0.1, dive);
  return { scale, fade };
}

interface DrawOptions {
  elapsed: number; // ms since draw-in started (Infinity = fully drawn)
  dive: number; // 0–1
  texture: boolean;
}

const rgba = (c: Rgb, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;

/** Stroke a smooth curve through points using quadratic midpoints. */
function strokeSmooth(ctx: CanvasRenderingContext2D, xs: Float64Array, ys: Float64Array, n: number) {
  ctx.beginPath();
  ctx.moveTo(xs[0], ys[0]);
  for (let i = 1; i < n - 1; i++) {
    ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
  }
  ctx.lineTo(xs[n - 1], ys[n - 1]);
  ctx.stroke();
}

let bx = new Float64Array(0);
let by = new Float64Array(0);

export function drawThreads(p: p5, threads: Thread[], { elapsed, dive, texture }: DrawOptions) {
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  const cx = p.width / 2;
  const cy = p.height / 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const t of threads) {
    const reveal = easeOutCubic(clamp01((elapsed - t.delay) / DRAW_DURATION));
    if (reveal <= 0) continue;
    const { scale, fade } = layerCamera(t.layer, dive);
    const alpha = t.alpha * fade;
    if (alpha <= 0.01) continue;

    const pts = t.points;
    const n = Math.max(2, Math.floor(reveal * (pts.length - 1)) + 1);
    if (bx.length < pts.length) {
      bx = new Float64Array(pts.length);
      by = new Float64Array(pts.length);
    }
    const pal = PALETTES[t.palette];
    const w = t.weight;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // core
    for (let i = 0; i < n; i++) {
      bx[i] = pts[i].x;
      by[i] = pts[i].y;
    }
    ctx.strokeStyle = rgba(pal.base, alpha);
    ctx.lineWidth = w;
    strokeSmooth(ctx, bx, by, n);

    if (texture && t.layer > 0) {
      // twisted strands winding around the core (the yarn "twist")
      const strands: Array<[Rgb, number, number, number]> = [
        [pal.dark, 0.34, 0.75, 0],
        [pal.light, 0.22, 0.5, Math.PI],
      ];
      for (const [col, wf, af, off] of strands) {
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(0, i - 1)];
          const b = pts[Math.min(pts.length - 1, i + 1)];
          const tx = b.x - a.x;
          const ty = b.y - a.y;
          const len = Math.hypot(tx, ty) || 1;
          const o = Math.sin(i * 1.7 + t.phase + off) * w * 0.3;
          bx[i] = pts[i].x + (-ty / len) * o;
          by[i] = pts[i].y + (tx / len) * o;
        }
        ctx.strokeStyle = rgba(col, alpha * af);
        ctx.lineWidth = w * wf;
        strokeSmooth(ctx, bx, by, n);
      }
      // fuzz
      ctx.strokeStyle = rgba(pal.light, alpha * 0.3);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (const f of t.fibers) {
        if (f.i >= n - 1) break;
        const a = pts[f.i - 1];
        const b = pts[f.i + 1];
        const tx = b.x - a.x;
        const ty = b.y - a.y;
        const len = Math.hypot(tx, ty) || 1;
        const nx = (-ty / len) * f.side;
        const ny = (tx / len) * f.side;
        const ca = Math.cos(f.angle);
        const sa = Math.sin(f.angle);
        const dx = nx * ca - ny * sa;
        const dy = nx * sa + ny * ca;
        const sx = pts[f.i].x + nx * w * 0.4;
        const sy = pts[f.i].y + ny * w * 0.4;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + dx * f.len, sy + dy * f.len);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
