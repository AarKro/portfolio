import type { Ref } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import styles from './Nav.module.scss';

/**
 * Placeholder for the Figma "Nav" component (Page=Case study): drawn back
 * arrow, name in the centre, links on the right. LinkedIn/GitHub icons,
 * hover underline and hide-on-scroll come with the real component.
 */
export default function Nav({ ref }: { ref?: Ref<HTMLElement> }) {
  const { t } = useTranslation();
  return (
    <nav ref={ref} className={styles.nav} aria-label={t('nav.label')}>
      <Link to="/#work" className={styles.back}>
        <svg width="36" height="12" viewBox="0 0 36 12" aria-hidden="true">
          <path d="M35 6 H1 M6 1 L1 6 L6 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('nav.back')}
      </Link>
      <span className={styles.name}>{t('nav.name')}</span>
      <span className={styles.links}>
        <Link to="/loose-ends">{t('nav.looseEnds')}</Link>
        <Link to="/about">{t('nav.about')}</Link>
      </span>
    </nav>
  );
}
