import type { ReactNode } from 'react';
import styles from './SocialLink.module.scss';

interface Props {
  href: string;
  /** short icon text (placeholder until the official marks are added) */
  icon: string;
  children: ReactNode;
}

/**
 * Figma "Social link": icon + label linking to a profile (opens in a new tab).
 * Hover/focus: the label's 1.5 px underline draws in from the left.
 */
export default function SocialLink({ href, icon, children }: Props) {
  return (
    <a className={styles.link} href={href} target="_blank" rel="noreferrer">
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label}>{children}</span>
    </a>
  );
}
