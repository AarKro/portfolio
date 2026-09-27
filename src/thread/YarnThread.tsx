import { useId, useImperativeHandle, useRef, type Ref } from 'react';
import type { Pt } from './geometry';
import styles from './thread.module.scss';
import { polyline, smoothSample, yarnDecor } from './yarn';

export interface YarnThreadHandle {
  /** Draw the thread through `pts`; decoration is only built between xMin and xMax (the visible part). */
  draw: (pts: Pt[], xMin?: number, xMax?: number) => void;
}

/**
 * The case-study thread as layered SVG (render inside an <svg>):
 * soft shadow, core, highlight, twist marks and hairs. Colours come from the
 * theme mode: --thread-current, --thread-twist, --thread-light.
 */
export default function YarnThread({ ref }: { ref: Ref<YarnThreadHandle> }) {
  const blur = useId();
  const shadow = useRef<SVGPathElement>(null);
  const core = useRef<SVGPathElement>(null);
  const highlight = useRef<SVGPathElement>(null);
  const ply = useRef<SVGPathElement>(null);
  const hairsLight = useRef<SVGPathElement>(null);
  const hairsDark = useRef<SVGPathElement>(null);

  useImperativeHandle(ref, () => ({
    draw(pts, xMin, xMax) {
      const dense = smoothSample(pts);
      const d = polyline(dense);
      const decor = yarnDecor(dense, { xMin, xMax });
      shadow.current?.setAttribute('d', d);
      core.current?.setAttribute('d', d);
      highlight.current?.setAttribute('d', d);
      ply.current?.setAttribute('d', decor.ply);
      hairsLight.current?.setAttribute('d', decor.hairsLight);
      hairsDark.current?.setAttribute('d', decor.hairsDark);
    },
  }));

  return (
    <g>
      <defs>
        <filter id={blur} x="-5%" y="-50%" width="110%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <path ref={shadow} className={styles.shadow} filter={`url(#${blur})`} />
      <path ref={core} className={styles.core} />
      <path ref={highlight} className={styles.highlight} />
      <path ref={ply} className={styles.ply} />
      <path ref={hairsLight} className={styles.hairsLight} />
      <path ref={hairsDark} className={styles.hairsDark} />
    </g>
  );
}
