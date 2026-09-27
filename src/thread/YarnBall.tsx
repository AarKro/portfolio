import { useImperativeHandle, useRef, type Ref } from 'react';
import YarnBundle from '../components/YarnBundle/YarnBundle';

export interface BallPose {
  /** centre, px */
  x: number;
  y: number;
  /** diameter, px */
  size: number;
  /** spin, degrees */
  rot: number;
}

export interface YarnBallHandle {
  place: (pose: BallPose) => void;
}

/**
 * The ball the thread comes from, positioned and spun from code.
 * `className` positions it (absolute, top-left 0).
 */
export default function YarnBall({ ref, className, baseSize }: { ref: Ref<YarnBallHandle>; className?: string; baseSize: number }) {
  const outer = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    place({ x, y, size, rot }) {
      const el = outer.current;
      if (!el) return;
      el.style.transform = `translate(${x - baseSize / 2}px, ${y - baseSize / 2}px) rotate(${rot}deg) scale(${size / baseSize})`;
    },
  }));

  return (
    <div ref={outer} className={className} style={{ width: baseSize, height: baseSize, transformOrigin: '50% 50%' }} aria-hidden="true">
      <YarnBundle />
    </div>
  );
}
