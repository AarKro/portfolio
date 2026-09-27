import { useEffect, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import TextLink from '../TextLink/TextLink';
import styles from './Nav.module.scss';

const LINKEDIN = 'https://www.linkedin.com/in/aaron-kromer-a3026b193/';
const GITHUB = 'https://github.com/AarKro';

interface Props {
  ref?: Ref<HTMLElement>;
  /** Figma "Nav": Page=Overview (back to start, divider) or Page=Case study (back to overview) */
  page: 'overview' | 'caseStudy';
  /** overview: scroll back up to the landing threads */
  onBackToStart?: () => void;
  /** hide completely (e.g. while the overview isn't on screen) */
  hidden?: boolean;
}

/**
 * Global nav: technical-drawing arrow on the left, name in the centre,
 * links and social icons on the right; no background bar. Hides while
 * scrolling down and comes back when scrolling up.
 */
export default function Nav({ ref, page, onBackToStart, hidden = false }: Props) {
  const { t } = useTranslation();
  const tucked = useHideOnScroll(!hidden);

  return (
    <nav
      ref={ref}
      className={`${styles.nav} ${page === 'overview' ? styles.divider : ''} ${hidden || tucked ? styles.away : ''}`}
      aria-label={t('nav.label')}
      inert={hidden}
    >
      <span className={styles.left}>
        {page === 'overview' ? (
          <TextLink onClick={onBackToStart} className={styles.back}>
            <svg className={styles.arrow} width="16" height="24" viewBox="0 0 15.5 23.5" aria-hidden="true">
              <path d="M7.75 22.75V0.75M14.75 7.75L7.75 0.75L0.75 7.75" />
            </svg>
            <span className={styles.backLabel}>{t('nav.backToStart')}</span>
          </TextLink>
        ) : (
          <TextLink to="/#work" className={styles.back}>
            <svg className={styles.arrow} width="36" height="16" viewBox="0 0 36 16" aria-hidden="true">
              <path d="M35 8H1M8 1L1 8L8 15" />
            </svg>
            <span className={styles.backLabel}>{t('nav.back')}</span>
          </TextLink>
        )}
      </span>
      <span className={styles.name}>{t('nav.name')}</span>
      <span className={styles.right}>
        <TextLink to="/loose-ends">{t('nav.looseEnds')}</TextLink>
        <TextLink to="/about">{t('nav.about')}</TextLink>
        {/* placeholder icons (Figma Icon/LinkedIn, Icon/GitHub); official marks come later */}
        <a className={styles.icon} href={LINKEDIN} target="_blank" rel="noreferrer" aria-label={t('nav.linkedin')}>
          in
        </a>
        <a className={styles.icon} href={GITHUB} target="_blank" rel="noreferrer" aria-label={t('nav.github')}>
          gh
        </a>
      </span>
    </nav>
  );
}

/**
 * True while the user is scrolling down (once past the nav's own height),
 * false as soon as they scroll up. Only listens while `enabled`; turning it
 * off resets it, so the nav is back whenever it's shown again.
 */
function useHideOnScroll(enabled: boolean) {
  const [away, setAway] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const d = y - last;
      if (Math.abs(d) < 3) return;
      setAway(d > 0 && y > 88);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      setAway(false);
    };
  }, [enabled]);
  return away;
}
