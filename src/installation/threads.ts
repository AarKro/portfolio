/**
 * Landing installation: spun threads.
 *
 * Each thread is a chain of points between two pinned ends, running edge to
 * edge in a straight line. Physics is a simple Verlet string, tuned
 * to feel like a guitar string: high tension to the neighbours (fast waves, a
 * quick twang) plus a spring back to the rest shape, with enough damping that
 * it rings briefly and settles. Threads live on three 2D layers;
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
  /** position along the thread as a fractional point index */
  s: number;
  side: 1 | -1;
  angle: number;
  len: number;
  dark: boolean;
}

export interface Thread {
  palette: number;
  layer: 0 | 1 | 2;
  /** 0 = farthest back … 1 = frontmost; orders drawing and the fade-out during the dive. */
  depth: number;
  weight: number;
  alpha: number;
  phase: number;
  delay: number;
  points: Point[];
  fibers: Fiber[];
}

const SEGMENTS = 72;
// px of thread per hair, per layer (the back layer has none)
const HAIR_SPACING = [Infinity, 12, 5];
const LAYERS = [
  { weight: 1.4, alpha: 0.38 },
  { weight: 2.6, alpha: 0.7 },
  { weight: 4.2, alpha: 1 },
];

// Physics tuning. The simulation runs at a fixed rate, independent of the
// display's refresh rate (60 vs 120 Hz), so these values are per step.
export const STEP_MS = 1000 / 360;
const TENSION = 0.8; // neighbour pull; higher = stiffer, faster waves (must stay below 1)
const SPRING = 0.004; // pull back to rest shape
const DAMPING = 0.9915; // energy kept per step (rings for about a second)
const MAX_PUSH = 16; // px per pluck
const SLIP = 84; // px a held thread stretches before it slips out of the grip

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

export function createThreads(w: number, h: number, seed = 7): Thread[] {
  const rand = mulberry32(seed);
  const threads: Thread[] = [];
  for (let c = 0; c < PALETTES.length; c++) {
    const count = Math.round((5 + Math.floor(rand() * 4)) * 1.2); // 6–10 per project
    for (let k = 0; k < count; k++) {
      const r = rand();
      const layer = (r < 0.4 ? 0 : r < 0.75 ? 1 : 2) as 0 | 1 | 2;
      const vertical = rand() < 0.3;
      // end points just outside two opposite edges
      const [x0, y0, x1, y1] = vertical
        ? [rand() * w, -60, rand() * w, h + 60]
        : [-60, rand() * h, w + 60, rand() * h];
      const points: Point[] = [];
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        points.push({ x, y, px: x, py: y, rx: x, ry: y });
      }
      const fibers: Fiber[] = [];
      if (layer > 0) {
        // fuzz: short hairs that lean along the thread, randomly spaced, the odd longer stray
        const count = Math.round(Math.hypot(x1 - x0, y1 - y0) / HAIR_SPACING[layer]);
        for (let f = 0; f < count; f++) {
          const side = rand() < 0.5 ? 1 : -1;
          const stray = layer === 2 && rand() < 0.08;
          fibers.push({
            s: 1 + rand() * (SEGMENTS - 2),
            side,
            angle: side * (0.5 + rand() * 0.8),
            len: stray ? 6 + rand() * 5 : layer === 2 ? 1.5 + rand() * 3.5 : 1 + rand() * 2,
            dark: rand() < 0.4,
          });
        }
        fibers.sort((a, b) => a.s - b.s);
      }
      threads.push({
        palette: c,
        layer,
        depth: (layer + rand()) / 3,
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
  return threads.sort((a, b) => a.depth - b.depth);
}

export const drawInEnd = (threads: Thread[]) => Math.max(...threads.map((t) => t.delay)) + DRAW_DURATION;

// scratch buffers for the displacement field (reused every frame)
let dx = new Float64Array(0);
let dy = new Float64Array(0);

/**
 * One physics step for all threads. End points stay pinned.
 * Forces act on the displacement from the rest shape (so the laid-out line itself
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
 * Pluck: when the pointer sweeps across a thread, displace the nearest points
 * in the direction of the movement and let go from rest, like a plucked string.
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
        const p = t.points[i];
        p.x += mx * f;
        p.y += my * f;
        p.px += mx * f;
        p.py += my * f;
      }
    }
  }
}

export interface Grab {
  thread: Thread;
  index: number;
  x: number;
  y: number;
}

/** Find the front-most thread point near the pointer. */
export function grab(threads: Thread[], x: number, y: number): Grab | null {
  for (let k = threads.length - 1; k >= 0; k--) {
    const t = threads[k];
    if (t.layer === 0) continue;
    for (let i = 2; i < t.points.length - 2; i++) {
      const p = t.points[i];
      if (Math.hypot(p.x - x, p.y - y) < 12 + t.weight * 2) return { thread: t, index: i, x: p.x, y: p.y };
    }
  }
  return null;
}

/**
 * Move the grip to the pointer. Returns false once the thread is pulled past
 * SLIP: it slips out of the grip and snaps back.
 */
export function drag(g: Grab, x: number, y: number) {
  const p = g.thread.points[g.index];
  if (Math.hypot(x - p.rx, y - p.ry) > SLIP) return false;
  g.x = x;
  g.y = y;
  return true;
}

/** Hold the grabbed point still at the grip (called every physics step). */
export function hold(g: Grab) {
  const p = g.thread.points[g.index];
  p.x = p.px = g.x;
  p.y = p.py = g.y;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

// Dive progress at which a thread is gone: the frontmost thread first, the farthest last.
const VANISH_FRONT = 0.35;
const VANISH_BACK = 0.9;
const VANISH_LENGTH = 0.03; // short: a thread stays fully visible, then drops out quickly

/**
 * Camera for the dive: the scale comes from the layer (parallax). A thread
 * stays fully visible until the camera gets close to it, then vanishes fast.
 * With these values every thread goes when it has grown to roughly 2–4× its size.
 */
export function diveCamera(t: Thread, dive: number) {
  const e = Math.pow(dive, 1.6);
  const scale = 1 + e * (1.4 + t.layer * 3.6);
  const end = VANISH_BACK - t.depth * (VANISH_BACK - VANISH_FRONT);
  const fade = 1 - smooth(end - VANISH_LENGTH, end, dive);
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

export function drawThreads(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threads: Thread[],
  { elapsed, dive, texture }: DrawOptions,
) {
  const cx = width / 2;
  const cy = height / 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const t of threads) {
    const reveal = easeOutCubic(clamp01((elapsed - t.delay) / DRAW_DURATION));
    if (reveal <= 0) continue;
    const { scale, fade } = diveCamera(t, dive);
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
      // fuzz: light and dark hairs, one path each
      ctx.lineWidth = t.layer === 2 ? 0.7 : 0.6;
      for (const dark of [false, true]) {
        ctx.strokeStyle = rgba(dark ? pal.dark : pal.light, alpha * (dark ? 0.45 : 0.55));
        ctx.beginPath();
        for (const f of t.fibers) {
          if (f.s >= n - 1) break;
          if (f.dark !== dark) continue;
          const i = Math.floor(f.s);
          const u = f.s - i;
          const a = pts[i];
          const b = pts[i + 1];
          const tx = b.x - a.x;
          const ty = b.y - a.y;
          const len = Math.hypot(tx, ty) || 1;
          const nx = (-ty / len) * f.side;
          const ny = (tx / len) * f.side;
          const ca = Math.cos(f.angle);
          const sa = Math.sin(f.angle);
          const dx = nx * ca - ny * sa;
          const dy = nx * sa + ny * ca;
          const sx = a.x + tx * u + nx * w * 0.4;
          const sy = a.y + ty * u + ny * w * 0.4;
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + dx * f.len, sy + dy * f.len);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
