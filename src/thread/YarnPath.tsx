import { useLayoutEffect, useRef } from 'react';
import type { Pt } from './geometry';
import YarnThread, { type YarnThreadHandle } from './YarnThread';

interface Props {
  /** points in the SVG's own pixel coordinates */
  points: Pt[];
  width: number;
  height: number;
  className?: string;
}

/** A short, static piece of yarn (a loose tail or a loose end) in its own SVG. Decorative. */
export default function YarnPath({ points, width, height, className }: Props) {
  const ref = useRef<YarnThreadHandle>(null);
  useLayoutEffect(() => ref.current?.draw(points), [points]);
  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible" aria-hidden="true">
      <YarnThread ref={ref} />
    </svg>
  );
}

