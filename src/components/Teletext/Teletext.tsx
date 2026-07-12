import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Project } from '../../data/projects';
import { tokenizeInlineLinks, type InlineToken } from '../InlineLink/InlineLink';
import './Teletext.scss';

/**
 * A Mode 7 teletext page (BBC Ceefax style) that replaces the broadcast
 * picture while open: fixed 40-character grid, live clock, double-height
 * headline, body copy split into rotating subpages, Fastext row of coloured
 * links at the bottom. Opening plays the authentic carousel "hunt" (rolling
 * page numbers) before the rows paint in top-to-bottom.
 */

/** Classic Mode 7 geometry: 40 character cells per row. */
const COLS = 40;
/** Body rows per subpage; everything else on the grid is fixed chrome. */
const BODY_ROWS = 10;
/** How long the header hunts (rolling page numbers) before the page lands. */
const SEARCH_DURATION = 900;
/** How fast the rolling page numbers tick over while hunting. */
const SEARCH_TICK = 90;
/** Subpage carousel period. */
const ROTATE_INTERVAL = 18000;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n: number) => String(n).padStart(2, '0');

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One word cell-counted onto the grid; `linkEnd` carries the trailing ↗. */
interface Word {
  text: string;
  href?: string;
  linkEnd?: boolean;
}

type Line = Word[];

/** Word-wraps tokenized copy onto the grid (a link's ↗ costs a cell). */
function wrapTokens(tokens: InlineToken[], cols: number): Line[] {
  const words: Word[] = [];
  for (const token of tokens) {
    const parts = token.text.split(/\s+/).filter(Boolean);
    parts.forEach((part, i) =>
      words.push({
        text: part,
        href: token.href,
        linkEnd: token.href ? i === parts.length - 1 : undefined,
      }),
    );
  }

  const lines: Line[] = [];
  let line: Line = [];
  let used = 0;
  for (const word of words) {
    const cells = word.text.length + (word.linkEnd ? 1 : 0);
    if (line.length && used + 1 + cells > cols) {
      lines.push(line);
      line = [];
      used = 0;
    }
    used += (line.length ? 1 : 0) + cells;
    line.push(word);
  }
  if (line.length) lines.push(line);
  return lines;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** One subpage of body rows; `heading` marks the BEHIND THE SCENES pages. */
interface Subpage {
  heading?: string;
  lines: Line[];
}

/** A Fastext slot: a coloured link label on the bottom row. */
interface FastextSlot {
  label: string;
  color: 'red' | 'green' | 'yellow' | 'cyan';
  href?: string;
  onClick?: () => void;
  /** Mode 7 flash attribute — hard on/off blink to draw the eye. */
  flash?: boolean;
}

interface TeletextProps {
  project: Project;
  channel: number;
  onClose: () => void;
}

/** Consecutive words of one link (or one plain run) merged for rendering. */
interface WordGroup {
  text: string;
  href?: string;
  linkEnd: boolean;
}

function groupLine(line: Line): WordGroup[] {
  const groups: WordGroup[] = [];
  for (const word of line) {
    const last = groups[groups.length - 1];
    if (last && last.href === word.href) {
      last.text += ` ${word.text}`;
      last.linkEnd ||= !!word.linkEnd;
    } else {
      groups.push({ text: word.text, href: word.href, linkEnd: !!word.linkEnd });
    }
  }
  return groups;
}

export function Teletext({ project, channel, onClose }: TeletextProps) {
  const reducedMotion = useMemo(prefersReducedMotion, []);

  // Opening hides the bug (and the focused TELETEXT button), which would drop
  // keyboard focus to <body> — take it, so the page is announced and ESC/Tab
  // work from here. ProjectProgram restores focus on close.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    sectionRef.current?.focus();
  }, []);

  // carousel hunt: header up instantly, page numbers rolling until "found"
  const [found, setFound] = useState(reducedMotion);
  const [rollingPage, setRollingPage] = useState(100);

  useEffect(() => {
    if (found) return;
    const roll = window.setInterval(
      () => setRollingPage((p) => ((p - 100 + 1 + Math.floor(Math.random() * 7)) % 800) + 100),
      SEARCH_TICK,
    );
    const land = window.setTimeout(() => setFound(true), SEARCH_DURATION);
    return () => {
      window.clearInterval(roll);
      window.clearTimeout(land);
    };
  }, [found]);

  // live header clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  // Copy wrapped onto the grid and split into subpages. When the tech line
  // wraps to more than one row, the extra rows come out of the body budget so
  // the grid never overflows.
  const { techLines, subpages } = useMemo(() => {
    const tech = wrapTokens([{ text: project.tech.join(' · ').toUpperCase() }], COLS);
    const bodyRows = BODY_ROWS - (tech.length - 1);
    const description = chunk(
      wrapTokens(tokenizeInlineLinks(project.description), COLS),
      bodyRows,
    ).map((lines) => ({ lines }));
    const behind = project.behindTheScenes
      ? chunk(
          wrapTokens(tokenizeInlineLinks(project.behindTheScenes), COLS),
          // heading + blank row eat into the page
          bodyRows - 2,
        ).map((lines) => ({ heading: 'BEHIND THE SCENES', lines }))
      : [];
    return { techLines: tech, subpages: [...description, ...behind] as Subpage[] };
  }, [project]);

  const [subpage, setSubpage] = useState(0);
  const pageCount = subpages.length;
  const advance = () => setSubpage((s) => (s + 1) % pageCount);

  // Rotate subpages on a timer (manual advance resets it via the dep).
  useEffect(() => {
    if (!found || pageCount < 2 || reducedMotion) return;
    const rotate = window.setInterval(() => setSubpage((s) => (s + 1) % pageCount), ROTATE_INTERVAL);
    return () => window.clearInterval(rotate);
  }, [found, pageCount, subpage, reducedMotion]);

  // ESC closes. Capture phase so the ← → swallow runs before TVSet's
  // window-level channel keys — flipping channels would yank the page away.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const pageNo = 100 + channel;
  const dateLabel = `${DAYS[now.getDay()]} ${pad2(now.getDate())} ${MONTHS[now.getMonth()]}`;
  const clockLabel = `${pad2(now.getHours())}:${pad2(now.getMinutes())}/${pad2(now.getSeconds())}`;

  // Fastext row: red CLOSE, then up to three coloured project links
  const fastext: FastextSlot[] = [{ label: 'CLOSE', color: 'red', onClick: onClose }];
  const linkColors: FastextSlot['color'][] = ['green', 'yellow', 'cyan'];
  const links: Omit<FastextSlot, 'color'>[] = [];
  if (project.repos) {
    links.push(...project.repos.map((repo) => ({ label: repo.name.toUpperCase(), href: repo.url })));
  } else if (project.githubUrl) {
    links.push({ label: 'CODE', href: project.githubUrl });
  }
  if (project.demoUrl) links.push({ label: 'DEMO', href: project.demoUrl });
  links.slice(0, 3).forEach((link, i) => fastext.push({ ...link, color: linkColors[i] }));
  // The subpage advance control: a flashing cyan MORE key when a Fastext slot
  // is free; when the row is full, the header's subpage counter flashes
  // instead so the affordance never vanishes.
  const hasMoreSlot = fastext.length < 4 && pageCount > 1;
  if (hasMoreSlot) {
    fastext.push({
      label: 'MORE ▸',
      color: linkColors[fastext.length - 1],
      onClick: advance,
      flash: true,
    });
  }

  // Rows paint in top-to-bottom in coarse chunks, like a slow decoder.
  let rowIndex = 0;
  const paintDelay = (rows = 1): CSSProperties => {
    const delay = Math.floor(rowIndex / 2) * 70 + (rowIndex % 2) * 25;
    rowIndex += rows;
    return { '--tt-delay': `${delay}ms` } as CSSProperties;
  };

  const current = subpages[subpage] ?? { lines: [] };

  const renderLine = (line: Line, key: number) => (
    <p className="teletext__row" style={paintDelay()} key={key}>
      {line.length === 0
        ? ' '
        : groupLine(line).map((group, i) => (
            <span key={i}>
              {i > 0 && ' '}
              {group.href ? (
                <a className="teletext__link" href={group.href} target="_blank" rel="noreferrer">
                  {group.text}
                  {group.linkEnd && <span aria-hidden="true">↗</span>}
                </a>
              ) : (
                group.text
              )}
            </span>
          ))}
    </p>
  );

  return (
    <section
      className="teletext"
      id="teletext-page"
      ref={sectionRef}
      tabIndex={-1}
      aria-label={`Teletext page ${pageNo} — ${project.title}`}
    >
      {/* container-query units resolve against the nearest ANCESTOR container,
          so the grid sizing lives on this inner screen div, not the section */}
      <div className="teletext__screen">
      {/* Header row — up instantly, even while the page is hunted. While
          hunting, the middle slot shows the carousel's rolling page numbers;
          once found it shows the subpage counter. */}
      <header className="teletext__row teletext__head">
        <span className="teletext__pageno">P{pageNo}</span>
        <span>AARKRO</span>
        <span className="teletext__head-spacer" aria-hidden="true" />
        {!found ? (
          <span className="teletext__pageno">{rollingPage}</span>
        ) : pageCount > 1 ? (
          <button
            className={`teletext__subpage ${hasMoreSlot ? '' : 'teletext__subpage--flash'}`}
            onClick={advance}
            aria-label={`Subpage ${subpage + 1} of ${pageCount} — show next`}
          >
            {subpage + 1}/{pageCount} ▸
          </button>
        ) : (
          <span>{pageNo}</span>
        )}
        <span>{dateLabel}</span>
        <span className="teletext__clock">{clockLabel}</span>
      </header>

      {found && (
        <div className="teletext__page" key={subpage}>
          {/* masthead label is the SECTION name (Ceefax said NEWS or SPORT);
              the service name already sits in the header row above */}
          <div className="teletext__row teletext__masthead" style={paintDelay(2)}>
            <span className="teletext__masthead-label">PROJECT GUIDE</span>
            <span className="teletext__masthead-channel">CH {pad2(channel)}</span>
          </div>

          <h3 className="teletext__row teletext__title-row" style={paintDelay(2)}>
            <span className="teletext__title">{project.title}</span>
          </h3>

          {techLines.map((line, i) => (
            <p className="teletext__row teletext__tech" style={paintDelay()} key={i}>
              {line.map((word) => word.text).join(' ')}
            </p>
          ))}

          <p className="teletext__row" style={paintDelay()}>
            {' '}
          </p>

          {current.heading && (
            <>
              <p className="teletext__row teletext__heading" style={paintDelay()}>
                {current.heading}
              </p>
              <p className="teletext__row" style={paintDelay()}>
                {' '}
              </p>
            </>
          )}

          {current.lines.map(renderLine)}

          <div className="teletext__footer">
            <p className="teletext__row teletext__band" style={paintDelay()}>
              PROGRAMME CONTINUES BEHIND THIS PAGE
            </p>
            <nav className="teletext__row teletext__fastext" style={paintDelay()} aria-label="Teletext links">
              {fastext.map((slot) =>
                slot.href ? (
                  <a
                    key={slot.label}
                    className={`teletext__key teletext__key--${slot.color}`}
                    href={slot.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {slot.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <button
                    key={slot.label}
                    className={`teletext__key teletext__key--${slot.color} ${
                      slot.flash ? 'teletext__key--flash' : ''
                    }`}
                    onClick={slot.onClick}
                  >
                    {slot.label}
                  </button>
                ),
              )}
            </nav>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
