import { useId, type CSSProperties } from 'react';
import styles from './YarnBundle.module.scss';

interface Props {
  className?: string;
  style?: CSSProperties;
}

// Wound yarn: great circles around the ball, seen as ellipses at different tilts (viewBox 0–100).
// [ry, rotation°, tone]; tone 0 = dark strand, 1 = light strand
const WINDS: Array<[number, number, 0 | 1]> = [
  [14, -18, 0],
  [30, 24, 1],
  [44, 62, 0],
  [20, 95, 1],
  [38, 128, 0],
  [10, 150, 1],
  [26, 172, 0],
  [46, 8, 1],
  [34, -52, 0],
  [18, 40, 0],
  [42, -80, 1],
  [24, 112, 0],
  [8, 70, 1],
  [36, -128, 1],
];

/**
 * Stand-in for the Figma "Yarn bundle" component: a wound ball of yarn in
 * --thread-current with dark (--thread-twist) and light (--thread-light)
 * strands and soft shading. Colour comes from the theme mode
 * (data-theme="project-n") of an ancestor. Decorative.
 */
export default function YarnBundle({ className, style }: Props) {
  const id = useId();
  const clip = `${id}-clip`;
  const shade = `${id}-shade`;
  return (
    <svg className={className ? `${styles.ball} ${className}` : styles.ball} style={style} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
        <radialGradient id={shade} cx="36%" cy="30%" r="75%">
          <stop offset="0" className={styles.shadeLight} />
          <stop offset="0.5" className={styles.shadeMid} />
          <stop offset="1" className={styles.shadeDark} />
        </radialGradient>
      </defs>
      <circle className={styles.body} cx="50" cy="50" r="50" />
      <g clipPath={`url(#${clip})`}>
        {WINDS.map(([ry, rot, tone]) => (
          <ellipse key={`${ry}-${rot}`} className={tone ? styles.light : styles.dark} cx="50" cy="50" rx="50" ry={ry} transform={`rotate(${rot} 50 50)`} />
        ))}
      </g>
      <circle cx="50" cy="50" r="50" fill={`url(#${shade})`} />
    </svg>
  );
}
