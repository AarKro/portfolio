/**
 * Shared geometry for the case-study thread. The unroll overlay and the case
 * study both use it, so the handoff between them lines up to the pixel.
 * All values are in viewport pixels (the case study track starts at x = 0).
 */

export interface Pt {
  x: number;
  y: number;
}

/** Ball diameter when it lands on the case study intro. */
export const BALL_SIZE = 150;
/** Ball centre x on the intro, as a fraction of the viewport width (Figma: Unroll 3). */
export const BALL_INTRO_X = 0.683;
/** Ball centre x once it leads the thread through the stages (Figma: Unroll 4). */
export const BALL_TRACK_X = 0.82;
/** The thread enters from just off the left edge. */
export const THREAD_START_X = -20;

/** Height of the thread at x: a line in the lower part of the screen with a gentle, irregular sag. */
export const threadY = (x: number, h: number) => h * 0.873 + Math.sin(x / 310) * 7 + Math.sin(x / 113 + 1.3) * 3;

/** Where the ball sits on the intro: resting on the thread. */
export function introBall(w: number, h: number) {
  const x = w * BALL_INTRO_X;
  return { x, y: threadY(x, h) - BALL_SIZE / 2 };
}

/** Points along the thread from the left edge to x1 (inclusive), about every `step` px. */
export function threadPoints(x1: number, h: number, step = 24): Pt[] {
  const pts: Pt[] = [];
  for (let x = THREAD_START_X; x < x1; x += step) pts.push({ x, y: threadY(x, h) });
  pts.push({ x: x1, y: threadY(x1, h) });
  return pts;
}

/** Smooth SVG path through points (quadratic curves through the midpoints). */
export function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
}

/** Resample a polyline into n points evenly spaced along its length. */
export function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length < 2) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = acc[acc.length - 1] || 1;
  const out: Pt[] = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const s = (k / (n - 1)) * total;
    while (j < pts.length - 1 && acc[j] < s) j++;
    const seg = acc[j] - acc[j - 1] || 1;
    const u = Math.min(1, Math.max(0, (s - acc[j - 1]) / seg));
    out.push({ x: pts[j - 1].x + (pts[j].x - pts[j - 1].x) * u, y: pts[j - 1].y + (pts[j].y - pts[j - 1].y) * u });
  }
  return out;
}

/** Viewport size without the scrollbar; the overlay and the case study must agree on it. */
export const viewport = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight });
