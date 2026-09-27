import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import YarnBundle from '../components/YarnBundle/YarnBundle';
import { gsap } from '../lib/motion';
import { BALL_SIZE, introBall, resample, smoothPath, threadPoints, viewport, type Pt } from '../thread/geometry';
import thread from '../thread/thread.module.scss';
import { UnrollContext, type UnrollPhase } from './context';
import styles from './UnrollLayer.module.scss';

interface Run {
  project: number;
  rect: DOMRect;
  to: string;
}

// Timeline (seconds). The route changes at NAVIGATE, hidden under the tinted background.
const JUMP_START = 0.25;
const JUMP_DURATION = 1.1;
const LAND = JUMP_START + JUMP_DURATION;
const NAVIGATE = 1.1;
const SETTLE_DURATION = 0.8;

/**
 * Owns the unroll. It lives above the routes, so the ball and its thread
 * survive the route change from the overview to the case study.
 */
export default function UnrollProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<Run | null>(null);
  const [phase, setPhase] = useState<UnrollPhase>('idle');
  const running = useRef(false);

  const start = useCallback((project: number, from: Element, to: string) => {
    if (running.current) return;
    running.current = true;
    // load the case study chunk now, so it's ready when the route changes
    void import('../pages/CaseStudy/CaseStudy');
    setRun({ project, rect: from.getBoundingClientRect(), to });
    setPhase('focus');
  }, []);

  const done = useCallback(() => {
    running.current = false;
    setRun(null);
    setPhase('idle');
  }, []);

  const value = useMemo(() => ({ project: run?.project ?? null, phase, start }), [run, phase, start]);

  return (
    <UnrollContext.Provider value={value}>
      {children}
      {run && <UnrollLayer run={run} onPhase={setPhase} onDone={done} />}
    </UnrollContext.Provider>
  );
}

function UnrollLayer({ run, onPhase, onDone }: { run: Run; onPhase: (p: UnrollPhase) => void; onDone: () => void }) {
  const navigate = useNavigate();
  const bgRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const twistRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const bg = bgRef.current;
    const ballEl = ballRef.current;
    const core = coreRef.current;
    const twist = twistRef.current;
    if (!bg || !ballEl || !core || !twist) return;

    const { w, h } = viewport();
    const { rect } = run;
    const S = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const E = introBall(w, h);
    // arc control point: well above both ends
    const C = { x: (S.x + E.x) / 2, y: Math.min(S.y, E.y) - h * 0.35 };
    const ball = { x: S.x, y: S.y, size: rect.width, rot: 0 };
    const trail: Pt[] = [{ ...S }];

    const draw = (pts: Pt[]) => {
      const d = smoothPath(pts);
      core.setAttribute('d', d);
      twist.setAttribute('d', d);
    };
    const place = () => {
      ballEl.style.width = ballEl.style.height = `${ball.size}px`;
      ballEl.style.transform = `translate(${ball.x - ball.size / 2}px, ${ball.y - ball.size / 2}px) rotate(${ball.rot}deg)`;
    };
    place();

    const jump = { u: 0 };
    const settle = { k: 0 };
    let from: Pt[] = [];
    let target: Pt[] = [];

    const tl = gsap.timeline({ onComplete: onDone });
    tl.call(() => onPhase('jump'), [], JUMP_START);
    // background tints toward the project theme
    tl.to(bg, { opacity: 1, duration: 0.8, ease: 'power1.inOut' }, 0.3);
    // the ball jumps along the arc, rolling, and its thread unravels behind it
    tl.to(
      jump,
      {
        u: 1,
        duration: JUMP_DURATION,
        ease: 'power2.inOut',
        onUpdate: () => {
          const u = jump.u;
          const v = 1 - u;
          ball.x = v * v * S.x + 2 * v * u * C.x + u * u * E.x;
          ball.y = v * v * S.y + 2 * v * u * C.y + u * u * E.y;
          ball.size = rect.width + (BALL_SIZE - rect.width) * u;
          ball.rot = 720 * u; // whole turns, so it matches the case study ball at rest
          trail.push({ x: ball.x, y: ball.y });
          draw(trail);
          place();
        },
      },
      JUMP_START,
    );
    tl.call(() => navigate(run.to), [], NAVIGATE);
    // small hop on landing
    tl.to(ball, { y: E.y - 14, duration: 0.14, ease: 'power1.out', onUpdate: place }, LAND);
    tl.to(ball, { y: E.y, duration: 0.3, ease: 'bounce.out', onUpdate: place });
    // the thread settles into the line the case study continues from
    tl.call(
      () => {
        onPhase('settle');
        target = threadPoints(E.x, h);
        from = resample(trail, target.length);
      },
      [],
      LAND,
    );
    tl.to(
      settle,
      {
        k: 1,
        duration: SETTLE_DURATION,
        ease: 'power3.out',
        onUpdate: () => {
          const k = settle.k;
          draw(from.map((p, i) => ({ x: p.x + (target[i].x - p.x) * k, y: p.y + (target[i].y - p.y) * k })));
        },
      },
      LAND,
    );

    return () => {
      tl.kill();
    };
    // runs once per unroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.layer} data-theme={`project-${run.project}`} aria-hidden="true">
      <div ref={bgRef} className={styles.bg} />
      <svg className={styles.svg}>
        <path ref={coreRef} className={thread.core} />
        <path ref={twistRef} className={thread.twist} />
      </svg>
      <div ref={ballRef} className={styles.ball}>
        <YarnBundle />
      </div>
    </div>
  );
}
