import { useLayoutEffect, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Tags } from '../../components/Tag/Tag';
import TextLink from '../../components/TextLink/TextLink';
import YarnBundle from '../../components/YarnBundle/YarnBundle';
import type { Project } from '../../projects/projects';
import { cubicPoints } from '../../thread/geometry';
import YarnPath from '../../thread/YarnPath';
import styles from './Overview.module.scss';

// the ball's loose tail, in the ball's own coordinates (Figma "Loose tail")
const TAIL = cubicPoints({ x: 190, y: 220 }, { x: 250, y: 290 }, { x: 160, y: 350 }, { x: 230, y: 440 }, 24);

interface Props {
  project: Project;
  total: number;
  onFollow: (e: MouseEvent<HTMLAnchorElement | HTMLElement>, n: number) => void;
}

/**
 * One project on the overview (Figma "Overview v2", Project row, 1728 × 900).
 * Left: the yarn bundle as a technical drawing (index, facts, rings,
 * crosshair, diameter, ruler). Right: the hero image fading in behind the
 * content. Line art is 1.5 px in border/strong and draws in on reveal
 * (paths with pathLength=1 and the `draw` class).
 */
export default function ProjectRow({ project: p, total, onFollow }: Props) {
  const { t } = useTranslation();
  const pad = (n: number) => String(n).padStart(2, '0');
  const follow = t('overview.follow', { name: p.name });
  const plateRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<HTMLDListElement>(null);
  const bracketRef = useRef<SVGPathElement>(null);
  const leaderRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  // The drawing scales with the screen but the facts' text doesn't, so the
  // bracket and its leader follow the text box: bracket just right of it,
  // leader across to the ball's axis and down to the top of the crosshair.
  useLayoutEffect(() => {
    const plate = plateRef.current;
    const facts = factsRef.current;
    if (!plate || !facts) return;
    const update = () => {
      const pr = plate.getBoundingClientRect();
      const fr = facts.getBoundingClientRect();
      const k = pr.width / 560; // screen px per design px
      const top = fr.top - pr.top;
      const bottom = fr.bottom - pr.top;
      const mid = (top + bottom) / 2;
      const bx = Math.max(240 * k, fr.right - pr.left + 10);
      const axis = 280 * k;
      const dotY = Math.max(228 * k, bottom + 8);
      const turn = Math.max(axis, bx + 14);
      bracketRef.current?.setAttribute('d', `M${bx - 6} ${top}H${bx}V${bottom}H${bx - 6}`);
      leaderRef.current?.setAttribute('d', `M${bx} ${mid}H${turn}V${dotY}H${axis}V${230 * k}`);
      dotRef.current?.setAttribute('cx', String(axis));
      dotRef.current?.setAttribute('cy', String(dotY));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(plate);
    ro.observe(facts);
    return () => ro.disconnect();
  }, []);

  return (
    <li className={styles.row} data-row>
      {/* ---- left: the yarn bundle as a technical drawing (a 560 × 900 plate) */}
      <div ref={plateRef} className={styles.plate}>
        <p className={styles.index} data-reveal>
          {t('overview.index', { n: pad(p.n), total: pad(total) })}
        </p>
        <dl ref={factsRef} className={styles.facts} aria-label={t('overview.factsLabel')} data-reveal>
          <div>
            <dt>{t('overview.year')}</dt>
            <dd>{p.year}</dd>
          </div>
          <div>
            <dt>{t('overview.role')}</dt>
            <dd>{p.role}</dd>
          </div>
          <div>
            <dt>{t('overview.duration')}</dt>
            <dd>{p.duration}</dd>
          </div>
        </dl>

        <svg className={styles.drawing} width="560" height="900" viewBox="0 0 560 900" aria-hidden="true">
          <circle className={styles.dashed} cx="280" cy="450" r="199.25" data-fade />
          <circle className={styles.draw} cx="280" cy="450" r="159.25" pathLength={1} />
          {/* index rule */}
          <path className={styles.draw} d="M80 124.75H180" pathLength={1} />
          {/* crosshair */}
          <path className={styles.draw} d="M60 450H150M410 450H500M280 230V320" pathLength={1} />
          {/* diameter */}
          <path className={styles.draw} d="M160.75 600H400.75M160.75 594V606M400.75 594V606" pathLength={1} />
          {/* ruler: minor ticks every 16 px, major every 80 */}
          <path
            className={styles.draw}
            d={`M80.75 826V840H560.75V826${Array.from({ length: 29 }, (_, i) => `M${96.75 + i * 16} 840V${(i + 1) % 5 === 0 ? 826 : 834}`).join('')}`}
            pathLength={1}
          />
        </svg>
        {/* facts bracket and leader, laid out in screen px (see above) */}
        <svg className={styles.factsLines} aria-hidden="true">
          <path ref={bracketRef} className={styles.draw} pathLength={1} />
          <path ref={leaderRef} className={styles.draw} pathLength={1} />
          <circle ref={dotRef} className={styles.dot} r="4" data-fade />
        </svg>
        <p className={styles.diameter} data-reveal aria-hidden="true">
          {t('overview.diameter')}
        </p>

        <Link
          to={`/work/${p.slug}`}
          className={styles.bundle}
          data-theme={`project-${p.n}`}
          data-project={p.n}
          aria-label={follow}
          onClick={(e) => onFollow(e, p.n)}
        >
          <YarnBundle className={styles.ball} />
          <YarnPath className={styles.tail} points={TAIL} width={240} height={240} />
        </Link>
      </div>

      {/* ---- right: hero image (placeholder) with its annotations */}
      <div className={styles.image} data-theme={`project-${p.n}`} data-image aria-hidden="true">
        <span className={styles.shapeA} />
        <span className={styles.shapeB} />
        <span className={styles.shapeC} />
        <span className={styles.shapeD} />
        <span className={styles.shapeE} />
        <span className={styles.shapeF} />
        <span className={styles.shapeG} />
        <span className={styles.shapeH} />
      </div>
      <div className={styles.fade} aria-hidden="true" />
      <div className={styles.imageNotes} aria-hidden="true" data-fade>
        <span className={styles.cropTL} />
        <span className={styles.cropTR} />
        <span className={styles.cropBL} />
        <span className={styles.cropBR} />
        <span className={styles.dimension}>
          <span>{p.impression}</span>
        </span>
        <span className={styles.callout}>1</span>
        <span className={styles.calloutLeader} />
      </div>

      {/* ---- content */}
      <div className={styles.content}>
        <h3 className={styles.name} data-reveal>
          {p.name}
        </h3>
        <p className={styles.summary} data-reveal>
          {p.summary}
        </p>
        <div data-reveal>
          <Tags items={p.tools} label={t('overview.toolsLabel')} />
        </div>
        <div data-reveal>
          <TextLink to={`/work/${p.slug}`} aria-label={follow} onClick={(e) => onFollow(e, p.n)}>
            {t('overview.followLink')}
          </TextLink>
        </div>
      </div>
    </li>
  );
}
