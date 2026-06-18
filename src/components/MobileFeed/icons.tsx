// Small inline icons for the feed's action rail — hand-rolled SVGs (no icon
// dependency), solid/filled silhouettes (social-app style). They paint in
// `currentColor` so CSS controls colour/size.

interface IconProps {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  width: 28,
  height: 28,
  fill: 'currentColor',
  'aria-hidden': true,
};

/** Solid heart — white on the rail, fills `$feed-like` when liked (via CSS). */
export function HeartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/** Solid arrow leaving up-right — open the live demo (external). */
export function DemoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z" />
    </svg>
  );
}

/** Solid paper plane — share. Angled up for a more dynamic "sending" feel. */
export function ShareIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <g transform="rotate(-22 12 12)">
        <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.92.87.99L17 12 2.87 13.88c-.5.08-.87.49-.87.99l.01 4.61c0 .71.73 1.2 1.39.91z" />
      </g>
    </svg>
  );
}

/** Solid caret — points up; rotated by CSS when the caption is expanded. */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 8.5l6 7H6z" />
    </svg>
  );
}

/** Solid person — back to the profile page (top of the rail). */
export function ProfileIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4.2" />
      <path d="M12 14c-4.4 0-8 2.4-8 5.5V21h16v-1.5c0-3.1-3.6-5.5-8-5.5z" />
    </svg>
  );
}
