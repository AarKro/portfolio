import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Nav from '../../components/Nav/Nav';
import Scrap from '../../components/Scrap/Scrap';
import TextLink from '../../components/TextLink/TextLink';
import { gsap, ScrollTrigger, startSmoothScroll } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import { LOOSE_ENDS } from '../../projects/projects';
import styles from './LooseEnds.module.scss';

// how each scrap lies on the table: tilt and how far it sits below its grid cell's top (from Figma "Loose ends")
const LAYOUT = [
  { drop: 0, tilt: 3 },
  { drop: 80, tilt: -2.5 },
  { drop: 0, tilt: 1.5 },
  { drop: 60, tilt: -3.5 },
  { drop: 60, tilt: -2 },
  { drop: 0, tilt: 2.5 },
  { drop: 80, tilt: -1.5 },
  { drop: 0, tilt: 3.5 },
];

/**
 * Loose ends (README §4.3a): small side projects as scraps on a table, each
 * pinned with a peg and trailing a loose end in its colour. No case study.
 * Scraps drop onto the table once as they scroll in.
 */
export default function LooseEnds() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => startSmoothScroll(reduced), [reduced]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (reduced || !root) return;
    const ctx = gsap.context(() => {
      gsap.from(root.querySelectorAll('[data-reveal]'), { autoAlpha: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.1 });
      for (const scrap of root.querySelectorAll('[data-scrap]')) {
        gsap.from(scrap, {
          autoAlpha: 0,
          y: -80,
          rotation: -6,
          duration: 1,
          ease: 'back.out(1.6)',
          scrollTrigger: { trigger: scrap, start: 'top 90%', once: true },
        });
      }
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  return (
    <main className={styles.page}>
      <Nav page="caseStudy" />
      <div ref={rootRef} className={styles.frame}>
        <header className={styles.intro}>
          <p className={styles.label} data-reveal>
            {t('looseEnds.label', { count: String(LOOSE_ENDS.length).padStart(2, '0') })}
          </p>
          <h1 className={styles.title} data-reveal>
            {t('looseEnds.pageTitle')}
          </h1>
          <p className={styles.lede} data-reveal>
            {t('looseEnds.pageLede')}
          </p>
        </header>

        <div className={styles.table}>
          {/* faint technical grid on the table: a plus every 160 px */}
          <svg className={styles.grid} aria-hidden="true">
            <defs>
              <pattern id="loose-ends-grid" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M0 6H12M6 0V12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#loose-ends-grid)" />
          </svg>
          <ul className={styles.scraps}>
            {LOOSE_ENDS.map((item, i) => (
              <li key={i} data-scrap style={{ ['--drop' as string]: LAYOUT[i].drop }}>
                <Scrap item={item} tilt={LAYOUT[i].tilt} />
              </li>
            ))}
          </ul>
        </div>

        <TextLink to="/#work" className={styles.back}>
          {t('looseEnds.back')}
        </TextLink>
      </div>
    </main>
  );
}
