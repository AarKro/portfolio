import { useEffect, useRef, type RefObject } from 'react';
import {
  CHARCOAL,
  SHELL,
  STEP_MS,
  createThreads,
  drag,
  drawInEnd,
  drawThreads,
  grab,
  hold,
  mixRgb,
  pluck,
  smooth,
  step,
  type Grab,
  type Thread,
} from './threads';

interface Props {
  /** Dive progress 0–1, written by the scroll trigger, read every frame. */
  diveRef: RefObject<number>;
  reducedMotion: boolean;
  /** Called once the threads are fully drawn in. */
  onReady: () => void;
}

/**
 * Canvas and animation loop for the landing installation.
 * The canvas is decorative (aria-hidden); the page provides a text alternative.
 */
export default function ThreadsCanvas({ diveRef, reducedMotion, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let threads: Thread[] = [];
    let readyAt = 0;
    let ready = false;
    let held: Grab | null = null;
    // latest pointer position (canvas coordinates) and the one the last frame saw
    let pointer: { x: number; y: number } | null = null;
    let last: { x: number; y: number } | null = null;
    let acc = 0;
    let frame = 0;
    const start = performance.now();
    let prev = start;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      threads = createThreads(width, height);
      readyAt = drawInEnd(threads);
      held = null;
    };

    const interactive = () => (diveRef.current ?? 0) < 0.02;

    const toCanvas = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      pointer = toCanvas(e);
    };
    const onDown = (e: PointerEvent) => {
      pointer = toCanvas(e);
      if (!interactive()) return;
      held = grab(threads, pointer.x, pointer.y);
      if (held) canvas.setPointerCapture(e.pointerId);
    };
    const onUp = () => {
      held = null;
    };
    const onLeave = () => {
      pointer = null;
      last = null;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dive = diveRef.current ?? 0;
      const elapsed = reducedMotion ? Infinity : now - start;

      if (!ready && elapsed >= readyAt) {
        ready = true;
        onReadyRef.current();
      }
      // hidden (the intro is taken out of the page past the dive): skip the work
      if (canvas.offsetParent === null) {
        prev = now;
        return;
      }

      // pointer interaction (only before the dive starts)
      if (interactive() && pointer) {
        if (held) {
          if (!drag(held, pointer.x, pointer.y)) held = null;
        } else if (last && (pointer.x !== last.x || pointer.y !== last.y)) {
          pluck(threads, last.x, last.y, pointer.x, pointer.y);
        }
      } else if (!interactive()) {
        held = null;
      }
      last = pointer && { ...pointer };

      // fixed-rate physics; cap the catch-up after a stalled or hidden tab
      acc += Math.min(100, now - prev);
      prev = now;
      while (acc >= STEP_MS) {
        if (held) hold(held);
        step(threads);
        acc -= STEP_MS;
      }

      // background: charcoal → shell during the dive
      const bg = mixRgb(CHARCOAL, SHELL, smooth(0.25, 0.95, dive));
      ctx.fillStyle = `rgb(${bg[0] | 0},${bg[1] | 0},${bg[2] | 0})`;
      ctx.fillRect(0, 0, width, height);
      drawThreads(ctx, width, height, threads, { elapsed, dive, texture: true });

      // soften everything near the end of the dive
      const blur = smooth(0.55, 1, dive) * 8;
      canvas.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : '';

    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [diveRef, reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0 }} />;
}
