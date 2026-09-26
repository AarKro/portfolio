import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ThreadsCanvas from '../../installation/ThreadsCanvas';
import { gsap, ScrollTrigger, scrollToTarget, startSmoothScroll } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import styles from './Landing.module.scss';

const PROJECTS = [1, 2, 3, 4, 5];

export default function Landing() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  const diveRef = useRef(0);
  const diveSectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const overviewRef = useRef<HTMLElement>(null);
  const bundlesRef = useRef<HTMLUListElement>(null);

  const onReady = useCallback(() => setReady(true), []);

  // smooth scrolling (off with reduced motion)
  useEffect(() => startSmoothScroll(reduced), [reduced]);

  // reveal: title first, then the scroll hint (plays once)
  useEffect(() => {
    if (!ready || reduced) return;
    const tl = gsap.timeline();
    tl.fromTo(titleRef.current, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' });
    tl.fromTo(hintRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.9);
    return () => {
      tl.kill();
    };
  }, [ready, reduced]);

  // dive: scrubbed, reverses when scrolling back up
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: diveSectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          diveRef.current = self.progress;
        },
      });
      gsap.to(overlayRef.current, {
        autoAlpha: 0,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: diveSectionRef.current, start: 'top top', end: '12% top', scrub: true },
      });
      // Arrival: the overview overlaps the last viewport of the dive, hidden,
      // and appears in place when the dive ends instead of scrolling up.
      // Showing it reverses when scrolling back into the dive.
      const overview = overviewRef.current;
      gsap.set(overview, { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: overview,
        start: 'top 5%',
        onEnter: () => gsap.to(overview, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }),
        onLeaveBack: () => gsap.to(overview, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }),
      });
      // content draws in, then the yarn bundles fall (plays once)
      const text = overview?.querySelectorAll('[data-reveal]');
      const bundles = bundlesRef.current?.children;
      if (text && bundles) {
        gsap.set(text, { autoAlpha: 0, y: 24 });
        gsap.set(bundles, { y: -600, rotation: -120, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: overview,
          start: 'top 5%',
          once: true,
          onEnter: () => {
            gsap
              .timeline()
              .to(text, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 }, 0.2)
              .to(bundles, { y: 0, rotation: 0, autoAlpha: 1, duration: 1.3, ease: 'bounce.out', stagger: 0.14 }, 0.5);
          },
        });
      }
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <main className={styles.page}>
      <section ref={diveSectionRef} className={reduced ? styles.diveStatic : styles.dive} aria-labelledby="landing-title">
        <div className={styles.sticky}>
          <ThreadsCanvas diveRef={diveRef} reducedMotion={reduced} onReady={onReady} />
          <p className="visually-hidden">{t('landing.canvasLabel')}</p>

          <div ref={overlayRef} className={styles.overlay}>
            <div ref={titleRef} className={reduced ? styles.title : `${styles.title} ${styles.hidden}`}>
              <h1 id="landing-title" className={styles.name}>
                {t('landing.name')}
              </h1>
              <p className={styles.subtitle}>{t('landing.subtitle')}</p>
            </div>

            <button
              ref={hintRef}
              type="button"
              className={reduced ? styles.hint : `${styles.hint} ${styles.hidden}`}
              onClick={() => overviewRef.current && scrollToTarget(overviewRef.current)}
            >
              <span>{t('landing.scrollHint')}</span>
              <svg className={styles.chevron} width="24" height="14" viewBox="0 0 24 14" aria-hidden="true">
                <path d="M1 1 L12 12 L23 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Placeholder overview, only to test the arrival of the dive */}
      <section ref={overviewRef} id="work" className={reduced ? styles.overview : `${styles.overview} ${styles.arrive}`} aria-labelledby="overview-title">
        <p className={styles.label} data-reveal>
          {t('overview.label')}
        </p>
        <h2 id="overview-title" className={styles.overviewTitle} data-reveal>
          {t('overview.title')}
        </h2>
        <p className={styles.intro} data-reveal>
          {t('overview.intro')}
        </p>
        <ul ref={bundlesRef} className={styles.bundles} aria-hidden="true">
          {PROJECTS.map((n) => (
            <li key={n} className={styles.bundle} style={{ ['--c' as string]: `var(--thread-project-${n})` }} />
          ))}
        </ul>
        <p className={styles.note}>Prototype · the real overview comes next.</p>
      </section>
    </main>
  );
}
