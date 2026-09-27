import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import YarnBundle from '../../components/YarnBundle/YarnBundle';
import ThreadsCanvas from '../../installation/ThreadsCanvas';
import { gsap, ScrollTrigger, scrollToTarget, startSmoothScroll } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import { useUnroll } from '../../unroll/context';
import styles from './Landing.module.scss';

const PROJECTS = [1, 2, 3, 4, 5];
// share of the dive you scroll yourself before it plays through on its own
const SNAP_THRESHOLD = 0.04;
const SNAP_DURATION = 2.6; // seconds

export default function Landing() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const unroll = useUnroll();
  // coming back from a case study ("back to overview"): land on the overview, settled
  const location = useLocation();
  const backToOverview = useRef(location.hash === '#work');

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
      // Snap: once you've scrolled a little way into the dive, it plays itself to
      // the end (the overview); scrolling back up from the overview plays it back
      // to the start. Input is locked while it runs.
      let auto = false;
      const snap = (target: HTMLElement | number) => {
        auto = true;
        scrollToTarget(target, { duration: SNAP_DURATION, lock: true, onComplete: () => (auto = false) });
      };
      ScrollTrigger.create({
        trigger: diveSectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          diveRef.current = self.progress;
          if (auto || !overviewRef.current) return;
          if (self.direction === 1 && self.progress > SNAP_THRESHOLD && self.progress < 1 - SNAP_THRESHOLD) snap(overviewRef.current);
          else if (self.direction === -1 && self.progress < 1 - SNAP_THRESHOLD && self.progress > SNAP_THRESHOLD) snap(0);
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
      if (text && bundles && !backToOverview.current) {
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

  // choosing a project: the ball jumps and unrolls into the case study (plain navigation with reduced motion or modifier keys)
  const follow = (e: MouseEvent<HTMLAnchorElement>, n: number) => {
    if (reduced || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    unroll.start(n, e.currentTarget, `/work/project-${n}`);
  };

  // unroll focus: the chosen ball is handed to the overlay, the rest of the overview fades
  useEffect(() => {
    const overview = overviewRef.current;
    if (unroll.project === null || !overview) return;
    const chosen = overview.querySelector(`[data-project="${unroll.project}"]`);
    const others = [
      ...overview.querySelectorAll('[data-reveal]'),
      ...[...(bundlesRef.current?.children ?? [])].filter((li) => !li.contains(chosen)),
    ];
    gsap.set(chosen, { autoAlpha: 0 });
    gsap.to(others, { autoAlpha: 0.12, duration: 0.35, ease: 'power1.out' });
  }, [unroll.project]);

  // back from a case study: jump straight to the overview
  useEffect(() => {
    if (backToOverview.current && overviewRef.current) scrollToTarget(overviewRef.current, { immediate: true });
  }, []);

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
        <ul ref={bundlesRef} className={styles.bundles}>
          {PROJECTS.map((n) => (
            <li key={n} className={styles.bundle}>
              <Link
                to={`/work/project-${n}`}
                className={styles.bundleLink}
                data-theme={`project-${n}`}
                data-project={n}
                aria-label={t('overview.follow', { name: t('caseStudy.title', { n }) })}
                onClick={(e) => follow(e, n)}
              >
                <YarnBundle />
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.note}>Prototype · the real overview comes next.</p>
      </section>
    </main>
  );
}
