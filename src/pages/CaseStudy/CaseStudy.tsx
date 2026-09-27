import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Nav from '../../components/Nav/Nav';
import { gsap, ScrollTrigger, startSmoothScroll } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import { BALL_INTRO_X, BALL_SIZE, BALL_TRACK_X, attachToBall, threadPoints, threadY, viewport } from '../../thread/geometry';
import YarnBall, { type YarnBallHandle } from '../../thread/YarnBall';
import YarnThread, { type YarnThreadHandle } from '../../thread/YarnThread';
import { useUnroll } from '../../unroll/context';
import { Tags } from '../../components/Tag/Tag';
import { PROJECTS, projectBySlug, type Project } from '../../projects/projects';
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
  const project = projectBySlug(slug);
  return project ? <CaseStudyPage key={project.slug} project={project} /> : <NotFound />;
}

function CaseStudyPage({ project }: { project: Project }) {
  const { n } = project;
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
  const ballRef = useRef<YarnBallHandle>(null);
  const threadRef = useRef<YarnThreadHandle>(null);
  const stageRefs = useRef<(HTMLElement | null)[]>([]);
  const markerRefs = useRef<(SVGGElement | null)[]>([]);
  const revealed = useRef(false);

  const stages = t('caseStudy.stages', { returnObjects: true }) as Stage[];

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
    const yarn = threadRef.current;
    if (!track || !pin || !ball || !yarn) return;

    const r0 = BALL_SIZE / 2;
    const update = (p: number) => {
      const { w, h } = viewport();
      const offset = p * Math.max(0, track.scrollWidth - w);
      const vx = w * (BALL_INTRO_X + (BALL_TRACK_X - BALL_INTRO_X) * smooth(0, 0.15, p));
      const x = offset + vx; // ball position on the track
      const r = r0 * Math.pow(1 - p, 0.8); // used up by the end
      const cy = threadY(x, h) - r; // resting on the thread
      const rot = ((x - w * BALL_INTRO_X) / r0) * (180 / Math.PI); // rolling

      // thread in track coordinates, ending where it peels off the ball; decoration only where visible
      const { pts } = attachToBall(threadPoints(x, h), { x, y: cy }, r);
      yarn.draw(pts, offset - 40, offset + w + 40);
      ball.place({ x: vx, y: cy, size: r * 2, rot });

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
      <Nav ref={navRef} page="caseStudy" />

      <section ref={pinRef} className={styles.pin} aria-labelledby="case-title">
        <div ref={trackRef} className={styles.track}>
          <div ref={introRef} className={styles.intro}>
            <div className={styles.image} data-reveal aria-hidden="true">
              <span>{t('caseStudy.imageLabel')}</span>
            </div>
            <div className={styles.introContent}>
              <p className={styles.label} data-reveal>
                {t('caseStudy.label', { n: pad(n), total: pad(PROJECTS.length) })}
              </p>
              <h1 id="case-title" ref={titleRef} tabIndex={-1} className={styles.title} data-reveal>
                {project.name}
              </h1>
              <p className={styles.oneLiner} data-reveal>
                {project.oneLiner}
              </p>
              <div data-reveal>
                <Tags items={project.tools} label={t('caseStudy.toolsLabel')} className={styles.tags} />
              </div>
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
            <YarnThread ref={threadRef} />
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

        <YarnBall ref={ballRef} className={handoff ? `${styles.ball} ${styles.hidden}` : styles.ball} baseSize={BALL_SIZE} />
      </section>
    </main>
  );
}
