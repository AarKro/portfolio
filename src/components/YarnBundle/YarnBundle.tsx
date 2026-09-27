import { useId, type CSSProperties } from 'react';
import styles from './YarnBundle.module.scss';

interface Props {
  className?: string;
  style?: CSSProperties;
}

// Wound strands across the ball (viewBox 0–100), clipped to the circle.
const STRANDS = [
  'M2,38 C30,20 70,24 98,44',
  'M4,62 C34,48 66,54 96,70',
  'M10,24 C40,46 62,78 76,98',
  'M30,4 C22,40 34,74 58,98',
  'M70,6 C52,30 44,62 50,98',
  'M2,50 C36,70 70,40 98,56',
  'M16,84 C40,60 70,30 92,20',
];

/**
 * Stand-in for the Figma "Yarn bundle" component: a ball in --thread-current
 * with wound strands in --thread-twist. Colour comes from the theme mode
 * (data-theme="project-n") of an ancestor. Decorative.
 */
export default function YarnBundle({ className, style }: Props) {
  const clip = useId();
  return (
    <svg className={className ? `${styles.ball} ${className}` : styles.ball} style={style} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="49" />
        </clipPath>
      </defs>
      <circle className={styles.body} cx="50" cy="50" r="49" />
      <g className={styles.strands} clipPath={`url(#${clip})`}>
        {STRANDS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
