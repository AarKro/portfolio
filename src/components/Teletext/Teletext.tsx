import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Project } from '../../data/projects';
import { tokenizeInlineLinks, type InlineToken } from '../InlineLink/InlineLink';
import './Teletext.scss';

/**
 * A real Mode 7 teletext page (BBC Ceefax style), replacing the broadcast
 * picture while open — black screen, a fixed 40-character grid, a header row
 * with the page number and a live clock (HH:MM/SS), a yellow double-height
 * headline, white body copy with cyan links, and a Fastext row of coloured
 * link labels at the bottom (red = CLOSE, then green/yellow/cyan for the
 * project's source/demo links).
 *
 * Behaviour is modelled on the real thing too: requesting the page first
 * shows the header hunting through rolling page numbers (teletext was a
 * broadcast carousel — you waited for your page to come round), then the
 * rows paint in top-to-bottom. Long descriptions split into numbered
 * subpages ("2/3") that rotate on a timer, exactly like Ceefax articles.
 */

/** Classic Mode 7 geometry: 40 character cells per row. */
const COLS = 40;
/** Body rows per subpage; everything else on the grid is fixed chrome. */
const BODY_ROWS = 10;
/** How long the header hunts (rolling page numbers) before the page lands. */
const SEARCH_DURATION = 900;
/** How fast the rolling page numbers tick over while hunting. */
const SEARCH_TICK = 90;
/** Subpage carousel period — Ceefax articles rotated on a timer like this. */
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

/** Word-wraps tokenized copy onto the 40-column grid (a link's ↗ costs a cell). */
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

  // ── The carousel hunt: header up instantly, page numbers rolling ─────────
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

  // ── The live header clock, ticking seconds like the real service ─────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  // ── Copy wrapped onto the grid and split into subpages ───────────────────
  // The tech line wraps like everything else; when it takes more than one row
  // the extra rows come out of the body budget so the grid never overflows.
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

  // ESC is the remote's TEXT button: back to the programme.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Header fields ─────────────────────────────────────────────────────────
  const pageNo = 100 + channel;
  const dateLabel = `${DAYS[now.getDay()]} ${pad2(now.getDate())} ${MONTHS[now.getMonth()]}`;
  const clockLabel = `${pad2(now.getHours())}:${pad2(now.getMinutes())}/${pad2(now.getSeconds())}`;

  // ── Fastext row: red CLOSE, then up to three coloured project links ──────
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
  if (fastext.length < 4 && pageCount > 1) {
    fastext.push({ label: 'MORE', color: linkColors[fastext.length - 1], onClick: advance });
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
    <section className="teletext" aria-label={`Teletext page ${pageNo} — ${project.title}`}>
      {/* container-query units resolve against the nearest ANCESTOR container,
          so the grid sizing lives on this inner screen div, not the section */}
      <div className="teletext__screen">
      {/* Row 0: the page header — up instantly, even while the page is hunted.
          While hunting, the requested number sits fixed on the left and the
          carousel's passing page numbers roll in the middle slot, like the
          real thing. Once found, that slot shows the subpage counter. */}
      <header className="teletext__row teletext__head">
        <span className="teletext__pageno">P{pageNo}</span>
        <span>AARKRO</span>
        <span className="teletext__head-spacer" aria-hidden="true" />
        {!found ? (
          <span className="teletext__pageno">{rollingPage}</span>
        ) : pageCount > 1 ? (
          <button
            className="teletext__subpage"
            onClick={advance}
            aria-label={`Subpage ${subpage + 1} of ${pageCount} — show next`}
          >
            {subpage + 1}/{pageCount}
          </button>
        ) : (
          <span>{pageNo}</span>
        )}
        <span>{dateLabel}</span>
        <span className="teletext__clock">{clockLabel}</span>
      </header>

      {found && (
        <div className="teletext__page" key={subpage}>
          {/* Colour-block masthead with the classic mosaic stepped edge */}
          <div className="teletext__row teletext__masthead" style={paintDelay(2)}>
            <span className="teletext__masthead-label">AARKRO PROJECTS</span>
            <span className="teletext__masthead-channel">CH {pad2(channel)}</span>
          </div>

          {/* Double-height yellow headline, Mode 7 style */}
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
                    className={`teletext__key teletext__key--${slot.color}`}
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
