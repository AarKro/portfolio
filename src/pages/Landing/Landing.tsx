import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import ThreadsCanvas from '../../installation/ThreadsCanvas';
import { gsap, ScrollTrigger, scrollToTarget, startSmoothScroll } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import { useUnroll } from '../../unroll/context';
import Overview from '../Overview/Overview';
import styles from './Landing.module.scss';

const REWIND_DURATION = 2.6; // seconds, "back to start" through the dive

export default function Landing() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const unroll = useUnroll();
  // coming back from a case study ("back to overview"): land on the overview, settled
  const location = useLocation();
  const [backToOverview] = useState(() => location.hash === '#work');

  const diveRef = useRef(0);
  const diveSectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const overviewRef = useRef<HTMLElement>(null);
  // the overview is on screen (arrived at the end of the dive)
  const [arrived, setArrived] = useState(backToOverview);
  // Past the end of the dive the intro is taken out of the page, so you can't
  // scroll back into it; "back to start" brings it back and plays the dive in reverse.
  const [collapsed, setCollapsed] = useState(backToOverview);
  const overshoot = useRef(0); // how far past the overview's top you were when it collapsed
  const rewind = useRef(false);

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

  // keep the view in place when the intro is taken out of or put back into the page
  useLayoutEffect(() => {
    const overview = overviewRef.current;
    if (reduced || !overview) return;
    if (collapsed) scrollToTarget(Math.max(0, overshoot.current), { immediate: true });
    else if (rewind.current) scrollToTarget(overview.offsetTop, { immediate: true });
    ScrollTrigger.refresh();
  }, [collapsed, reduced]);

  // dive: scrubbed while you scroll down through it
  useEffect(() => {
    if (reduced || collapsed) return;
    const ctx = gsap.context(() => {
      const overview = overviewRef.current;
      ScrollTrigger.create({
        trigger: diveSectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          diveRef.current = self.progress;
        },
        // scrolled past the end: take the intro out of the page
        onLeave: () => {
          if (rewind.current || !overview) return;
          overshoot.current = window.scrollY - overview.offsetTop;
          setCollapsed(true);
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
      const start = () => (overview ? overview.offsetTop - window.innerHeight * 0.05 : 0);
      gsap.set(overview, { autoAlpha: window.scrollY >= start() ? 1 : 0 });
      ScrollTrigger.create({
        trigger: overview,
        start: 'top 5%',
        onEnter: () => {
          gsap.to(overview, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' });
          setArrived(true);
        },
        onLeaveBack: () => {
          gsap.to(overview, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' });
          setArrived(false);
        },
      });
    });
    // "back to start": play the dive back up to the intro (input locked)
    if (rewind.current) {
      scrollToTarget(0, { duration: REWIND_DURATION, lock: true, onComplete: () => (rewind.current = false) });
    }
    return () => ctx.revert();
  }, [reduced, collapsed]);

  const backToStart = () => {
    if (reduced) {
      scrollToTarget(0);
      return;
    }
    rewind.current = true;
    overshoot.current = 0;
    setCollapsed(false);
  };

  // choosing a project: the ball jumps and unrolls into the case study (plain navigation with reduced motion or modifier keys)
  const follow = (e: MouseEvent<HTMLElement>, n: number) => {
    if (reduced || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const ball = overviewRef.current?.querySelector(`[data-project="${n}"]`);
    if (!ball) return;
    e.preventDefault();
    unroll.start(n, ball, `/work/project-${n}`);
  };

  // unroll focus: the chosen ball is handed to the overlay, the rest of the overview fades
  useEffect(() => {
    const overview = overviewRef.current;
    if (unroll.project === null || !overview) return;
    gsap.set(overview.querySelector(`[data-project="${unroll.project}"]`), { autoAlpha: 0 });
    gsap.to(overview, { opacity: 0.12, duration: 0.35, ease: 'power1.out' });
  }, [unroll.project]);

  // back from a case study (reduced motion: the page isn't collapsed): jump straight to the overview
  useEffect(() => {
    if (backToOverview && reduced && overviewRef.current) scrollToTarget(overviewRef.current, { immediate: true });
  }, [backToOverview, reduced]);

  return (
    <main className={styles.page}>
      <section
        ref={diveSectionRef}
        className={reduced ? styles.diveStatic : styles.dive}
        aria-labelledby="landing-title"
        hidden={collapsed && !reduced}
      >
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
              onClick={() =>
                overviewRef.current &&
                scrollToTarget(overviewRef.current, {
                  onComplete: () => {
                    overshoot.current = 0;
                    setCollapsed(true);
                  },
                })
              }
            >
              <span>{t('landing.scrollHint')}</span>
              <svg className={styles.chevron} width="24" height="14" viewBox="0 0 24 14" aria-hidden="true">
                <path d="M1 1 L12 12 L23 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <Overview
        ref={overviewRef}
        className={reduced || collapsed ? undefined : styles.arrive}
        active={arrived || reduced}
        settled={reduced || backToOverview}
        onFollow={follow}
        onBackToStart={backToStart}
      />
    </main>
  );
}
