// Small inline icons for the feed's action rail — hand-rolled SVGs (no icon
// dependency). They paint in `currentColor` so CSS controls colour/size.

interface IconProps {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  width: 28,
  height: 28,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** Heart — outline when not liked, solid (currentColor) when liked. */
export function HeartIcon({ filled, className }: IconProps & { filled: boolean }) {
  return (
    <svg {...base} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/** `</>` — source code. */
export function CodeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/** Box with an arrow leaving it — open the live demo (external). */
export function DemoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/** Three connected nodes — share. */
export function ShareIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

/** Chevron — points up; rotated by CSS when the caption is expanded. */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
