import { useEffect, useLayoutEffect, useRef, type MouseEvent, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import Nav from '../../components/Nav/Nav';
import Scrap from '../../components/Scrap/Scrap';
import TextLink from '../../components/TextLink/TextLink';
import { gsap, ScrollTrigger } from '../../lib/motion';
import { LOOSE_ENDS, PROJECTS } from '../../projects/projects';
import ProjectRow from './ProjectRow';
import styles from './Overview.module.scss';

// the teaser's three scraps and their tilt (Figma "Loose ends teaser")
const TEASER = [
  { item: LOOSE_ENDS[0], tilt: 3 },
  { item: LOOSE_ENDS[3], tilt: -2 },
  { item: LOOSE_ENDS[4], tilt: 1.5 },
];

const ROW_HEIGHT = 900;
const ROW_GAP = 40;
const BALL_X = 280;
const BALL_Y = 450;

// dashed thread connecting the balls, with a gentle S between each pair (Figma "Connecting thread")
const CONNECTOR = PROJECTS.slice(1)
  .map((_, i) => {
    const y0 = BALL_Y + i * (ROW_HEIGHT + ROW_GAP);
    const y1 = y0 + ROW_HEIGHT + ROW_GAP;
    const d = y1 - y0;
    return `${i === 0 ? `M${BALL_X} ${y0}` : ''}C${BALL_X + 40} ${y0 + d / 3} ${BALL_X - 40} ${y0 + (2 * d) / 3} ${BALL_X} ${y1}`;
  })
  .join('');

interface Props {
  ref: Ref<HTMLElement>;
  className?: string;
  /** the overview is on screen: start revealing rows as they scroll in */
  active: boolean;
  /** show everything in its final state (reduced motion, or back from a case study) */
  settled: boolean;
  onFollow: (e: MouseEvent<HTMLAnchorElement | HTMLElement>, n: number) => void;
  onBackToStart: () => void;
}

/**
 * The overview (yarn picker, README §4.2): intro, one row per project with a
 * dashed thread connecting the balls, and the loose-ends teaser.
 * Reveals play once per row: the ball falls in, the line art draws, the
 * content fades up.
 */
export default function Overview({ ref, className, active, settled, onFollow, onBackToStart }: Props) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);

  // hide what will be revealed, before the first paint
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (settled || !root) return;
    const q = (s: string) => root.querySelectorAll(s);
    gsap.set(q('[data-reveal]'), { autoAlpha: 0, y: 24 });
    gsap.set(q('[data-fade]'), { autoAlpha: 0 });
    gsap.set(q(`.${styles.draw}`), { strokeDashoffset: 1 });
    gsap.set(q('[data-image]'), { autoAlpha: 0, x: 40 });
    gsap.set(q('[data-project]'), { y: -600, rotation: -120, autoAlpha: 0 });
    gsap.set(q('[data-scrap]'), { autoAlpha: 0, y: 60 });
  }, [settled]);

  useEffect(() => {
    const root = rootRef.current;
    if (settled || !active || !root) return;
    const ctx = gsap.context(() => {
      const intro = root.querySelectorAll(`.${styles.intro} [data-reveal]`);
      gsap.to(intro, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
      gsap.to(root.querySelector(`.${styles.connector}`), { autoAlpha: 1, duration: 1.2, delay: 0.6 });

      for (const row of root.querySelectorAll<HTMLElement>('[data-row]')) {
        const q = (s: string) => row.querySelectorAll(s);
        ScrollTrigger.create({
          trigger: row,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap
              .timeline()
              .to(q('[data-project]'), { y: 0, rotation: 0, autoAlpha: 1, duration: 1.3, ease: 'bounce.out' }, 0)
              .to(q(`.${styles.draw}`), { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: 0.05 }, 0.4)
              .to(q('[data-fade]'), { autoAlpha: 1, duration: 0.8 }, 0.5)
              .to(q('[data-image]'), { autoAlpha: 1, x: 0, duration: 1, ease: 'power3.out' }, 0.3)
              .to(q('[data-reveal]'), { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.6);
          },
        });
      }

      const teaser = root.querySelector(`.${styles.teaser}`);
      ScrollTrigger.create({
        trigger: teaser,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.to(teaser?.querySelectorAll('[data-reveal]') ?? [], { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 });
          gsap.to(teaser?.querySelectorAll('[data-scrap]') ?? [], { autoAlpha: 1, y: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.12, delay: 0.2 });
        },
      });
    }, root);
    return () => ctx.revert();
  }, [active, settled]);

  return (
    <section ref={ref} id="work" className={className ? `${styles.overview} ${className}` : styles.overview} aria-labelledby="overview-title">
      <Nav page="overview" hidden={!active} onBackToStart={onBackToStart} />
      <div ref={rootRef} className={styles.frame}>
        <header className={styles.intro}>
          <p className={styles.label} data-reveal>
            {t('overview.label')}
          </p>
          <h2 id="overview-title" className={styles.title} data-reveal>
            {t('overview.title')}
          </h2>
          <p className={styles.lede} data-reveal>
            {t('overview.intro')}
          </p>
        </header>

        <div className={styles.rows}>
          <svg
            className={styles.connector}
            width="560"
            height={PROJECTS.length * (ROW_HEIGHT + ROW_GAP)}
            viewBox={`0 0 560 ${PROJECTS.length * (ROW_HEIGHT + ROW_GAP)}`}
            aria-hidden="true"
            data-fade
          >
            <path d={CONNECTOR} />
          </svg>
          <ol className={styles.list}>
            {PROJECTS.map((p) => (
              <ProjectRow key={p.n} project={p} total={PROJECTS.length} onFollow={onFollow} />
            ))}
          </ol>
        </div>

        <section className={styles.teaser} aria-labelledby="loose-ends-title">
          <h2 id="loose-ends-title" className={styles.teaserTitle} data-reveal>
            {t('looseEnds.title')}
          </h2>
          <p className={styles.teaserLede} data-reveal>
            {t('looseEnds.lede')}
          </p>
          <ul className={styles.scraps}>
            {TEASER.map(({ item, tilt }, i) => (
              <li key={i} data-scrap>
                <Scrap item={item} tilt={tilt} />
              </li>
            ))}
          </ul>
          <TextLink to="/loose-ends" className={styles.teaserLink}>
            {t('looseEnds.seeAll')}
          </TextLink>
        </section>
      </div>
    </section>
  );
}
