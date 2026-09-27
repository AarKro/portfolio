import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Nav from '../../components/Nav/Nav';
import YarnBundle from '../../components/YarnBundle/YarnBundle';
import { gsap, ScrollTrigger, startSmoothScroll } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import { BALL_INTRO_X, BALL_SIZE, BALL_TRACK_X, smoothPath, threadPoints, threadY, viewport } from '../../thread/geometry';
import thread from '../../thread/thread.module.scss';
import { useUnroll } from '../../unroll/context';
import NotFound from '../NotFound/NotFound';
import styles from './CaseStudy.module.scss';

interface Stage {
  label: string;
  title: string;
  body: string;
}

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

/**
 * Placeholder case study: intro + three stages on a pinned horizontal track.
 * The ball rolls ahead along the bottom and unravels the thread as you scroll;
 * it shrinks and is used up by the end. Scrubbed, so scrolling back rewinds it.
 */
export default function CaseStudy() {
  const { slug } = useParams();
  const n = Number(/^project-([1-5])$/.exec(slug ?? '')?.[1]);
  return n ? <CaseStudyPage key={n} n={n} /> : <NotFound />;
}

function CaseStudyPage({ n }: { n: number }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const { phase } = useUnroll();
  // while the unroll runs, its overlay shows the ball and thread; ours take over when it ends
  const handoff = phase !== 'idle';
  const waiting = phase === 'focus' || phase === 'jump';

  const navRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const twistRef = useRef<SVGPathElement>(null);
  const stageRefs = useRef<(HTMLElement | null)[]>([]);
  const markerRefs = useRef<(SVGGElement | null)[]>([]);
  const revealed = useRef(false);

  const stages = t('caseStudy.stages', { returnObjects: true }) as Stage[];
  const tools = t('caseStudy.tools', { returnObjects: true }) as string[];

  // start at the top
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => startSmoothScroll(reduced), [reduced]);

  // ball + thread for a track progress p (0–1)
  useLayoutEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    const ball = ballRef.current;
    const core = coreRef.current;
    const twist = twistRef.current;
    if (!track || !pin || !ball || !core || !twist) return;

    const r0 = BALL_SIZE / 2;
    const update = (p: number) => {
      const { w, h } = viewport();
      const offset = p * Math.max(0, track.scrollWidth - w);
      const vx = w * (BALL_INTRO_X + (BALL_TRACK_X - BALL_INTRO_X) * smooth(0, 0.15, p));
      const x = offset + vx; // ball position on the track
      const r = r0 * Math.pow(1 - p, 0.8); // used up by the end
      const cy = threadY(x, h) - r; // resting on the thread
      const rot = ((x - w * BALL_INTRO_X) / r0) * (180 / Math.PI); // rolling
      ball.style.transform = `translate(${vx - r0}px, ${cy - r0}px) rotate(${rot}deg) scale(${r / r0})`;

      const d = smoothPath(threadPoints(x, h));
      core.setAttribute('d', d);
      twist.setAttribute('d', d);

      // stage markers sit on the thread and appear once it reaches them
      markerRefs.current.forEach((g, i) => {
        const stage = stageRefs.current[i];
        if (!g || !stage) return;
        const mx = stage.offsetLeft + 40;
        g.setAttribute('transform', `translate(${mx.toFixed(1)},${threadY(mx, h).toFixed(1)})`);
        g.style.opacity = x >= mx ? '1' : '0';
      });
    };

    // move focus to the title (SPA navigation), after pinning: pinning moves the section in the DOM
    const focusTitle = () => titleRef.current?.focus({ preventScroll: true });

    update(0);
    if (reduced) {
      focusTitle();
      return;
    }

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - viewport().w);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          pin: true,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        },
      });
    });
    focusTitle();

    // every ScrollTrigger refresh briefly unpins the section, which drops focus; put it back
    let focused: HTMLElement | null = null;
    const beforeRefresh = () => {
      const el = document.activeElement;
      focused = el instanceof HTMLElement && pin.contains(el) ? el : null;
    };
    const afterRefresh = () => focused?.focus({ preventScroll: true });
    ScrollTrigger.addEventListener('refreshInit', beforeRefresh);
    ScrollTrigger.addEventListener('refresh', afterRefresh);

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', beforeRefresh);
      ScrollTrigger.removeEventListener('refresh', afterRefresh);
      ctx.revert();
    };
  }, [reduced]);

  // content reveal (plays once): after the ball has landed, or right away on a direct visit
  useLayoutEffect(() => {
    if (reduced) return;
    const items = introRef.current?.querySelectorAll('[data-reveal]');
    if (!items) return;
    // opacity, not visibility: the title keeps focus while it's hidden
    gsap.set([...items, navRef.current], { opacity: 0 });
    gsap.set(items, { y: 24 });
  }, [reduced]);

  useEffect(() => {
    if (reduced || waiting || revealed.current) return;
    revealed.current = true;
    const items = introRef.current?.querySelectorAll('[data-reveal]');
    if (!items) return;
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(items, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
    tl.to(navRef.current, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.3);
  }, [reduced, waiting]);

  const pad = (i: number) => String(i).padStart(2, '0');

  return (
    <main data-theme={`project-${n}`} className={reduced ? `${styles.page} ${styles.stacked}` : styles.page}>
      <Nav ref={navRef} />

      <section ref={pinRef} className={styles.pin} aria-labelledby="case-title">
        <div ref={trackRef} className={styles.track}>
          <div ref={introRef} className={styles.intro}>
            <div className={styles.image} data-reveal aria-hidden="true">
              <span>{t('caseStudy.imageLabel')}</span>
            </div>
            <div className={styles.introContent}>
              <p className={styles.label} data-reveal>
                {t('caseStudy.label', { n: pad(n) })}
              </p>
              <h1 id="case-title" ref={titleRef} tabIndex={-1} className={styles.title} data-reveal>
                {t('caseStudy.title', { n })}
              </h1>
              <p className={styles.oneLiner} data-reveal>
                {t('caseStudy.oneLiner')}
              </p>
              <ul className={styles.tags} aria-label={t('caseStudy.toolsLabel')} data-reveal>
                {tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
            <p className={styles.hint} data-reveal>
              {t('caseStudy.scrollHint')}
            </p>
          </div>

          {stages.map((s, i) => (
            <section
              key={s.label}
              ref={(el) => {
                stageRefs.current[i] = el;
              }}
              className={styles.stage}
            >
              <p className={styles.label}>{s.label}</p>
              <h2 className={styles.stageTitle}>{s.title}</h2>
              <p className={styles.body}>{s.body}</p>
            </section>
          ))}
          {/* room for the ball to roll on and be used up */}
          <div className={styles.end} aria-hidden="true" />

          <svg className={handoff ? `${styles.thread} ${styles.hidden}` : styles.thread} aria-hidden="true">
            <path ref={coreRef} className={thread.core} />
            <path ref={twistRef} className={thread.twist} />
            {stages.map((s, i) => (
              <g
                key={s.label}
                ref={(el) => {
                  markerRefs.current[i] = el;
                }}
                className={styles.marker}
              >
                <circle r="12" />
                <text dy="4">{i + 1}</text>
              </g>
            ))}
          </svg>
        </div>

        <div ref={ballRef} className={handoff ? `${styles.ball} ${styles.hidden}` : styles.ball} aria-hidden="true">
          <YarnBundle />
        </div>
      </section>
    </main>
  );
}
