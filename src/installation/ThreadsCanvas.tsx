import { useEffect, useRef, type RefObject } from 'react';
import p5 from 'p5';
import {
  CHARCOAL,
  SHELL,
  createThreads,
  drag,
  drawInEnd,
  drawThreads,
  grab,
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
 * p5 (instance mode) wrapper for the landing installation.
 * The canvas is decorative (aria-hidden); the page provides a text alternative.
 */
export default function ThreadsCanvas({ diveRef, reducedMotion, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const sketch = (p: p5) => {
      let threads: Thread[] = [];
      let start = 0;
      let readyAt = 0;
      let ready = false;
      let held: Grab | null = null;
      let lastX = -1;
      let lastY = -1;

      const build = () => {
        threads = createThreads(p.width, p.height);
        readyAt = drawInEnd(threads);
      };

      p.setup = () => {
        const c = p.createCanvas(window.innerWidth, window.innerHeight);
        c.elt.setAttribute('aria-hidden', 'true');
        p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        build();
        start = p.millis();
      };

      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
        build();
      };

      const interactive = () => (diveRef.current ?? 0) < 0.02;

      p.mousePressed = () => {
        if (!interactive()) return;
        held = grab(threads, p.mouseX, p.mouseY);
      };
      p.mouseReleased = () => {
        held = null;
      };

      p.draw = () => {
        const dive = diveRef.current ?? 0;
        const elapsed = reducedMotion ? Infinity : p.millis() - start;

        // background: charcoal → shell during the dive
        const bg = mixRgb(CHARCOAL, SHELL, smooth(0.25, 0.95, dive));
        p.background(bg[0], bg[1], bg[2]);

        // pointer interaction (only before the dive starts)
        if (interactive()) {
          if (held) drag(held, p.mouseX, p.mouseY);
          else if (lastX >= 0 && (p.mouseX !== lastX || p.mouseY !== lastY)) pluck(threads, lastX, lastY, p.mouseX, p.mouseY);
        } else {
          held = null;
        }
        lastX = p.mouseX;
        lastY = p.mouseY;

        step(threads);
        drawThreads(p, threads, { elapsed, dive, texture: true });

        // soften everything near the end of the dive
        const blur = smooth(0.55, 1, dive) * 8;
        (p.drawingContext as CanvasRenderingContext2D).canvas.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : '';

        if (!ready && elapsed >= readyAt) {
          ready = true;
          onReadyRef.current();
        }
      };
    };

    // friendly-error checks are for learning p5; they cost performance and log noise
    (p5 as unknown as { disableFriendlyErrors: boolean }).disableFriendlyErrors = true;
    const instance = new p5(sketch, host);
    return () => instance.remove();
  }, [diveRef, reducedMotion]);

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />;
}
