import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Nav from '../../components/Nav/Nav';
import SocialLink from '../../components/SocialLink/SocialLink';
import { LEARNINGS, STATIONS } from '../../content/about';
import { gsap, ScrollTrigger, startSmoothScroll } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import { braid, throughPoints } from '../../thread/braid';
import styles from './About.module.scss';

const LINKEDIN = 'https://www.linkedin.com/in/aaron-kromer-a3026b193/';
const STRANDS = 5;

// ---- "my thread": a vertical braid in its own 240 wide column (Figma "About"),
// a station every 244 px, the first 80 px in. The SVG stretches to the column's
// actual width, so these are column coordinates, not screen pixels.
const COLUMN = 240;
const FIRST_STATION = 80;
const STATION_GAP = 244;
const THREAD_LENGTH = FIRST_STATION * 2 + (STATIONS.length - 1) * STATION_GAP;
// where the braid runs across the column, through the station knots
const threadX = throughPoints([
  { x: 0, y: 140 },
  { x: 80, y: 151 },
  { x: 324, y: 170 },
  { x: 568, y: 152 },
  { x: 812, y: 120 },
  { x: 1056, y: 112 },
  { x: 1300, y: 138 },
  { x: 1380, y: 136 },
]);
const THREAD = braid(STRANDS, THREAD_LENGTH, threadX, { amp: 7 }).map((pts) => pts.map((p) => ({ x: p.y, y: p.x })));
const KNOTS = STATIONS.map((_, i) => threadX(FIRST_STATION + i * STATION_GAP));

// ---- "what I learned": a horizontal braided clothesline across the section,
// dipping between the pegs (which sit above the centres of the three cards)
const LINE = 1000;
const lineY = throughPoints([
  { x: 0, y: 30 },
  { x: 167, y: 16 },
  { x: 333, y: 38 },
  { x: 500, y: 16 },
  { x: 667, y: 38 },
  { x: 833, y: 16 },
  { x: 1000, y: 28 },
]);
const CLOTHESLINE = braid(STRANDS, LINE, lineY, { amp: 4, wave: 44, step: 6 });
const CARD_TILT = [2.5, -1.5, 1];

const path = (pts: { x: number; y: number }[]) => 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L');

/**
 * About (README §4.4): intro with portrait, "my thread" (a braid of the five
 * project colours with career stations), learnings on a clothesline, and a
 * closing call to talk. Placeholder content in src/content/about.ts.
 * The braid draws with the scroll (and rewinds); everything else reveals once.
 */
export default function About() {
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
    const q = (s: string) => root.querySelectorAll(s);
    const ctx = gsap.context(() => {
      gsap.from(q('[data-intro]'), { autoAlpha: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.1 });

      // the braid follows the scroll
      const timeline = root.querySelector(`.${styles.timeline}`);
      gsap.fromTo(
        q(`.${styles.braid} .${styles.strand}`),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: timeline, start: 'top 70%', end: 'bottom 70%', scrub: true } },
      );

      // one-off reveals
      const once = (el: Element, vars: gsap.TweenVars, start = 'top 80%') =>
        gsap.from(el, { ...vars, scrollTrigger: { trigger: el, start, once: true } });
      for (const el of q('[data-reveal]')) once(el, { autoAlpha: 0, y: 24, duration: 0.8, ease: 'power3.out' });
      for (const el of q('[data-station]')) once(el, { autoAlpha: 0, x: -16, duration: 0.7, ease: 'power3.out' }, 'top 70%');
      for (const el of q('[data-knot]')) once(el, { scale: 0, duration: 0.5, ease: 'back.out(3)' }, 'top 70%');
      const line = root.querySelector(`.${styles.clothesline}`);
      if (line) once(line, { autoAlpha: 0, duration: 0.6 });
      for (const el of q('[data-card]')) once(el, { autoAlpha: 0, rotation: -12, y: -30, transformOrigin: '50% 0', duration: 1.1, ease: 'elastic.out(1, 0.5)' });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  return (
    <main className={styles.page}>
      <Nav page="caseStudy" />
      <div ref={rootRef} className={styles.frame}>
        {/* ---- intro */}
        <div className={styles.introRow}>
          <header className={styles.intro}>
            <p className={styles.label} data-intro>
              {t('about.label')}
            </p>
            <h1 className={styles.title} data-intro>
              {t('about.title')}
            </h1>
            <p className={styles.lede} data-intro>
              {t('about.intro')}
            </p>
          </header>
          <figure className={styles.portrait} data-intro>
            <div className={styles.photo}>
              <span>{t('about.portrait')}</span>
            </div>
            <span className={styles.cropTL} />
            <span className={styles.cropTR} />
            <span className={styles.cropBL} />
            <span className={styles.cropBR} />
            <svg className={styles.captionLeader} width="101" height="141" aria-hidden="true">
              <path d="M0.75 0V140.25H101" />
            </svg>
            <figcaption className={styles.caption}>{t('about.portraitCaption')}</figcaption>
          </figure>
        </div>

        {/* ---- my thread */}
        <section className={styles.threadSection} aria-labelledby="my-thread-title">
          <div className={styles.sectionHeader} data-reveal>
            <h2 id="my-thread-title" className={styles.heading}>
              {t('about.threadTitle')}
            </h2>
            <p className={styles.lede}>{t('about.threadLede')}</p>
          </div>
          <div className={styles.timeline} style={{ height: THREAD_LENGTH }}>
            <svg className={styles.braid} viewBox={`0 0 ${COLUMN} ${THREAD_LENGTH}`} preserveAspectRatio="none" aria-hidden="true">
              {THREAD.map((pts, i) => (
                <g key={i} data-theme={`project-${i + 1}`}>
                  <path className={styles.strand} d={path(pts)} pathLength={1} />
                </g>
              ))}
            </svg>
            <ol className={styles.stations}>
              {STATIONS.map((s, i) => (
                <li key={s.title} style={{ top: FIRST_STATION + i * STATION_GAP, ['--knot' as string]: KNOTS[i] / COLUMN }} data-station>
                  <span className={styles.year}>{s.year}</span>
                  <span className={styles.leaders} aria-hidden="true" />
                  <span className={styles.knot} aria-hidden="true" data-knot />
                  <div className={styles.station}>
                    <h3 className={styles.stationTitle}>{s.title}</h3>
                    <p className={styles.stationLine}>{s.line}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---- what I learned */}
        <section className={styles.learnedSection} aria-labelledby="learned-title">
          <h2 id="learned-title" className={styles.heading} data-reveal>
            {t('about.learnedTitle')}
          </h2>
          <div className={styles.line}>
            <svg className={styles.clothesline} viewBox={`0 0 ${LINE} 60`} preserveAspectRatio="none" aria-hidden="true">
              {CLOTHESLINE.map((pts, i) => (
                <g key={i} data-theme={`project-${i + 1}`}>
                  <path className={styles.strand} d={path(pts)} />
                </g>
              ))}
            </svg>
            <ol className={styles.learnings}>
              {LEARNINGS.map((text, i) => (
                <li key={text}>
                  <div className={styles.card} style={{ rotate: `${CARD_TILT[i]}deg` }} data-card>
                    <p className={styles.cardLabel}>{t('about.learning', { n: String(i + 1).padStart(2, '0') })}</p>
                    <p className={styles.cardText}>{text}</p>
                  </div>
                  <span className={styles.peg} aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---- easter egg + closing */}
        <div className={styles.end}>
          <p className={styles.egg} data-reveal>
            {t('about.egg')} <Link to="/loose-ends">zephir flex</Link>
          </p>
          <section className={styles.closing} aria-labelledby="talk-title" data-reveal>
            <h2 id="talk-title" className={styles.talkTitle}>
              {t('about.talkTitle')}
            </h2>
            <p className={styles.lede}>{t('about.talkBody')}</p>
            <SocialLink href={LINKEDIN} icon="in">
              {t('about.sayHi')}
            </SocialLink>
          </section>
        </div>
      </div>
    </main>
  );
}
