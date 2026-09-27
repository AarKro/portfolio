import type { Pt } from './geometry';

/**
 * Yarn look for the SVG thread: the smoothed centre line plus decoration
 * built along it (ply marks for the twist, fine hairs). Decoration sits at
 * fixed distances from the start of the thread, so it stays put while the
 * thread grows at its end.
 */

export const THREAD_WIDTH = 4;
const HAIR_STEP = 3; // px between hair candidates

// stable pseudo-random value in [0, 1) for an integer index
const hash = (k: number) => {
  const s = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Sample the same quadratic-midpoint curve as `smoothPath` densely, so the
 * core and its decoration follow exactly the same line.
 */
export function smoothSample(pts: Pt[], sub = 4): Pt[] {
  if (pts.length < 3) return pts.slice();
  const out: Pt[] = [pts[0]];
  let from = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i];
    const to = { x: (c.x + pts[i + 1].x) / 2, y: (c.y + pts[i + 1].y) / 2 };
    for (let k = 1; k <= sub; k++) {
      const t = k / sub;
      const u = 1 - t;
      out.push({ x: u * u * from.x + 2 * u * t * c.x + t * t * to.x, y: u * u * from.y + 2 * u * t * c.y + t * t * to.y });
    }
    from = to;
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Call `fn` at every `step` px along a polyline with the position, unit tangent and station index. */
function walk(pts: Pt[], step: number, fn: (k: number, x: number, y: number, tx: number, ty: number) => void) {
  let next = 0; // arc length of the next station
  let s = 0;
  let k = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len === 0) continue;
    const tx = (b.x - a.x) / len;
    const ty = (b.y - a.y) / len;
    while (next <= s + len) {
      const u = next - s;
      fn(k++, a.x + tx * u, a.y + ty * u, tx, ty);
      next += step;
    }
    s += len;
  }
}

const f = (n: number) => n.toFixed(1);

export const polyline = (pts: Pt[]) => (pts.length < 2 ? '' : 'M' + pts.map((p) => `${f(p.x)},${f(p.y)}`).join('L'));

export interface YarnDecor {
  ply: string;
  hairsLight: string;
  hairsDark: string;
}

export interface DecorOptions {
  /** thread width, px */
  width?: number;
  /** share of hair candidates that get a hair */
  hairChance?: number;
  /** only build decoration between these x values (the visible part) */
  xMin?: number;
  xMax?: number;
}

/** Twist marks and hairs along a (dense) thread, as SVG path data (also usable with canvas Path2D). */
export function yarnDecor(
  pts: Pt[],
  { width = THREAD_WIDTH, hairChance = 0.4, xMin = -Infinity, xMax = Infinity }: DecorOptions = {},
): YarnDecor {
  const hw = width / 2;
  let ply = '';
  let hairsLight = '';
  let hairsDark = '';

  // ply marks: short strokes slanted across the thread, like the twist of plied yarn
  walk(pts, Math.max(3, width * 1.1), (_, x, y, tx, ty) => {
    if (x < xMin || x > xMax) return;
    const nx = -ty;
    const ny = tx;
    const sx = tx * hw * 0.9;
    const sy = ty * hw * 0.9;
    ply += `M${f(x - nx * hw - sx)},${f(y - ny * hw - sy)}L${f(x + nx * hw + sx)},${f(y + ny * hw + sy)}`;
  });

  // hairs: short fibres leaning along the thread, the odd longer stray
  walk(pts, HAIR_STEP, (k, x, y, tx, ty) => {
    if (x < xMin || x > xMax || hash(k) > hairChance) return;
    const side = hash(k + 0.5) < 0.5 ? 1 : -1;
    const nx = -ty * side;
    const ny = tx * side;
    const a = 0.5 + hash(k + 0.7) * 0.8; // lean from the normal toward the thread direction
    const lean = hash(k + 0.2) < 0.5 ? 1 : -1;
    const dx = nx * Math.cos(a) + tx * lean * Math.sin(a);
    const dy = ny * Math.cos(a) + ty * lean * Math.sin(a);
    const len = hash(k + 0.3) < 0.07 ? 6 + hash(k + 0.9) * 5 : 1.5 + hash(k + 0.9) * 3;
    const bx = x + nx * hw * 0.8;
    const by = y + ny * hw * 0.8;
    const seg = `M${f(bx)},${f(by)}L${f(bx + dx * len)},${f(by + dy * len)}`;
    if (hash(k + 0.11) < 0.6) hairsLight += seg;
    else hairsDark += seg;
  });

  return { ply, hairsLight, hairsDark };
}
