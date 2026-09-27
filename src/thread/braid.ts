import type { Pt } from './geometry';

/**
 * A braid of strands (one per project colour) woven around a centre line.
 * Each strand swings across the centre on a sine, phase-shifted so they
 * cross each other; a slow second wave keeps it from looking mechanical.
 * Returns points along the length `s` (0…len) as { along, across } pairs;
 * the caller maps them to x/y for a vertical or horizontal braid.
 */
export function braid(strands: number, len: number, centre: (s: number) => number, { amp = 8, wave = 92, step = 12 } = {}): Pt[][] {
  return Array.from({ length: strands }, (_, i) => {
    const phase = (i / strands) * Math.PI * 2;
    const pts: Pt[] = [];
    for (let s = 0; s <= len; s += step) {
      const across = centre(s) + amp * Math.sin((s / wave) * Math.PI * 2 + phase) + 1.5 * Math.sin(s / 37 + i * 1.7);
      pts.push({ x: s, y: across });
    }
    return pts;
  });
}

/** Smooth centre line through control points (Catmull-Rom), evaluated at s along the first coordinate. */
export function throughPoints(ctrl: Pt[]) {
  return (s: number) => {
    let i = 0;
    while (i < ctrl.length - 2 && s > ctrl[i + 1].x) i++;
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const t = Math.max(0, Math.min(1, (s - p1.x) / (p2.x - p1.x || 1)));
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  };
}
