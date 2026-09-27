import type { MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './TextLink.module.scss';

interface Props {
  /** internal route */
  to?: string;
  /** external URL (opens in a new tab) */
  href?: string;
  /** no destination: renders a button */
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

/**
 * Figma "Text link": a link or CTA whose 1.5 px underline draws in from left
 * to right on hover (and on focus). Focus: the global dashed ring.
 */
export default function TextLink({ to, href, onClick, className, children, ...rest }: Props) {
  const cls = className ? `${styles.link} ${className}` : styles.link;
  if (to !== undefined) {
    return (
      <Link to={to} className={cls} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }
  if (href !== undefined) {
    return (
      <a href={href} className={cls} onClick={onClick} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
