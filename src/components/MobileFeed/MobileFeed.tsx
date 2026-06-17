import { useEffect, useRef, useState } from 'react';
import {
  CHANNEL_COUNT,
  FIRST_PROJECT_CHANNEL,
  PROJECTS,
  type Project,
} from '../../data/projects';
import { renderInlineLinks } from '../InlineLink/InlineLink';
import { ChevronIcon, CodeIcon, DemoIcon, HeartIcon, ShareIcon } from './icons';
import './MobileFeed.scss';

const SITE_TITLE = 'Aaron Kromer — Frontend Developer & Interaction Designer, Zürich';

const LINKEDIN_LINK: SheetLink = {
  label: 'LinkedIn',
  href: 'https://www.linkedin.com/in/aaron-kromer-a3026b193/',
};

interface SheetLink {
  label: string;
  href: string;
}

/** Channels are shareable links: #ch-5 opens the feed on that card. */
function channelFromHash(): number {
  const match = /^#ch-(\d+)$/.exec(window.location.hash);
  const parsed = match ? Number(match[1]) : 1;
  return parsed >= 1 && parsed <= CHANNEL_COUNT ? parsed : 1;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late?';
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

/**
 * The phone & tablet experience: a full-screen vertical feed, one snap-card
 * per channel, taking its layout cues from TikTok — a tap-through caption and a
 * right-edge rail of icon actions. Driven by the same `projects.ts` data as the
 * desktop TV; no three.js. The channel hash + tab title track the card in view
 * so deep links and SEO stay consistent with the TV.
 */
export function MobileFeed() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [activeChannel, setActiveChannel] = useState(channelFromHash);

  // Jump a deep-linked card into view on first paint
  useEffect(() => {
    const initial = channelFromHash();
    if (initial !== 1) sectionsRef.current[initial - 1]?.scrollIntoView();
  }, []);

  // Whichever card is most in view becomes the active channel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) setActiveChannel(Number((top.target as HTMLElement).dataset.channel));
      },
      { threshold: 0.6 },
    );
    sectionsRef.current.forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Mirror the active card to the URL hash and the browser tab
  useEffect(() => {
    window.history.replaceState(null, '', `#ch-${activeChannel}`);
    const project =
      activeChannel >= FIRST_PROJECT_CHANNEL ? PROJECTS[activeChannel - FIRST_PROJECT_CHANNEL] : null;
    document.title = project
      ? `CH ${String(activeChannel).padStart(2, '0')} · ${project.title} — Aaron Kromer`
      : SITE_TITLE;
  }, [activeChannel]);

  const setSectionRef = (channel: number) => (el: HTMLElement | null) => {
    sectionsRef.current[channel - 1] = el;
  };

  return (
    <div className="feed">
      <section className="feed__card feed__card--intro" data-channel={1} ref={setSectionRef(1)}>
        <div className="feed__intro">
          <p className="feed__intro-kicker">Frontend Developer &amp; Interaction Designer</p>
          <h1 className="feed__intro-title">Aaron Kromer</h1>
          <p className="feed__intro-sub">{greeting()} Every channel below is one of my projects.</p>
          <p className="feed__intro-contact">
            <a href="https://github.com/AarKro" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/aaron-kromer-a3026b193/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a href="mailto:kromer.aaron@gmail.com">Email</a>
          </p>
        </div>
        <p className="feed__swipe-hint" aria-hidden="true">
          swipe up to browse ↑
        </p>
      </section>

      {PROJECTS.map((project, index) => {
        const channel = index + FIRST_PROJECT_CHANNEL;
        return (
          <FeedCard
            key={project.id}
            project={project}
            channel={channel}
            isActive={activeChannel === channel}
            setRef={setSectionRef(channel)}
          />
        );
      })}
    </div>
  );
}

interface FeedCardProps {
  project: Project;
  channel: number;
  isActive: boolean;
  setRef: (el: HTMLElement | null) => void;
}

function FeedCard({ project, channel, isActive, setRef }: FeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [sheet, setSheet] = useState<'share' | 'code' | null>(null);
  const channelLabel = String(channel).padStart(2, '0');

  // Only the card in view plays (battery + mobile single-video limits); leaving
  // a card resets its open panels. play() may reject without a user gesture
  // (e.g. iOS low-power) — that's fine, the first frame still shows.
  useEffect(() => {
    const video = videoRef.current;
    if (isActive) {
      video?.play().catch(() => {});
    } else {
      video?.pause();
      setExpanded(false);
      setSheet(null);
    }
  }, [isActive]);

  // The "code" action: a single repo links straight out; a bundle of repos
  // (e.g. the Discord bots) opens a sheet listing them.
  const repoLinks: SheetLink[] | null = project.repos
    ? project.repos.map((repo) => ({ label: repo.name, href: repo.url }))
    : null;

  // Share: this project's GitHub first, then Aaron's LinkedIn. A bundled
  // channel lists each repo; a sourceless one (e.g. Tramly) is LinkedIn only.
  const githubShareLinks: SheetLink[] = project.githubUrl
    ? [{ label: 'GitHub', href: project.githubUrl }]
    : repoLinks
      ? repoLinks.map((repo) => ({ label: `GitHub — ${repo.label}`, href: repo.href }))
      : [];
  const shareLinks: SheetLink[] = [...githubShareLinks, LINKEDIN_LINK];

  return (
    <section
      className={`feed__card ${expanded ? 'is-expanded' : ''}`}
      data-channel={channel}
      ref={setRef}
    >
      {project.videoUrl ? (
        <video
          className="feed__video"
          ref={videoRef}
          src={project.videoUrl}
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="feed__testcard" aria-hidden="true">
          <div className="feed__testcard-bars" />
          <p className="feed__testcard-caption">NO LIVE FEED ON THIS CHANNEL</p>
        </div>
      )}

      {/* legibility scrim under the caption */}
      <div className="feed__scrim" aria-hidden="true" />

      {/* right-edge rail of icon actions */}
      <div className="feed__rail">
        <button
          className={`feed__rail-btn feed__rail-btn--like ${liked ? 'is-liked' : ''}`}
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <HeartIcon filled={liked} />
        </button>

        {project.githubUrl ? (
          <a
            className="feed__rail-btn"
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="View source code"
          >
            <CodeIcon />
          </a>
        ) : repoLinks ? (
          <button
            className="feed__rail-btn"
            onClick={() => setSheet('code')}
            aria-label="View source code"
          >
            <CodeIcon />
          </button>
        ) : null}

        {project.demoUrl && (
          <a
            className="feed__rail-btn"
            href={project.demoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open live demo"
          >
            <DemoIcon />
          </a>
        )}

        <button className="feed__rail-btn" onClick={() => setSheet('share')} aria-label="Share">
          <ShareIcon />
        </button>
      </div>

      {/* bottom-left caption: title + tags, expanding upward to reveal details */}
      <div className="feed__bug">
        <div className="feed__caption">
          <div className="feed__headline">
            <div className="feed__headline-text">
              <span className="feed__channel" aria-hidden="true">
                CH {channelLabel}
              </span>
              <h2 className="feed__title">{project.title}</h2>
              <ul className="feed__tech">
                {project.tech.map((tag) => (
                  <li key={tag} className="feed__tag">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="feed__expand"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Hide details' : 'Show details'}
            >
              <ChevronIcon />
            </button>
          </div>

          <div className="feed__details" aria-hidden={!expanded}>
            <div className="feed__details-inner">
              <p className="feed__description">{renderInlineLinks(project.description)}</p>
              {project.behindTheScenes && (
                <p className="feed__behind">
                  <span className="feed__behind-label">BEHIND THE SCENES</span>
                  {renderInlineLinks(project.behindTheScenes)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <FeedSheet
        open={sheet !== null}
        title={sheet === 'share' ? 'Share' : 'Source code'}
        links={sheet === 'code' && repoLinks ? repoLinks : shareLinks}
        onClose={() => setSheet(null)}
      />
    </section>
  );
}

interface FeedSheetProps {
  open: boolean;
  title: string;
  links: SheetLink[];
  onClose: () => void;
}

/** A scrim-backed menu that scrolls up from the bottom of the card. */
function FeedSheet({ open, title, links, onClose }: FeedSheetProps) {
  return (
    <div className={`feed__sheet-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="feed__sheet-scrim" onClick={onClose} aria-label="Close menu" />
      <div className="feed__sheet" role="dialog" aria-modal="true">
        <span className="feed__sheet-grabber" aria-hidden="true" />
        <p className="feed__sheet-title">{title}</p>
        <div className="feed__sheet-links">
          {links.map((link) => (
            <a
              key={link.href}
              className="feed__sheet-link"
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
            >
              {link.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
