import { useEffect, useRef, useState } from 'react';
import {
  CHANNEL_COUNT,
  FIRST_PROJECT_CHANNEL,
  PROJECTS,
  type Project,
} from '../../data/projects';
import { renderInlineLinks } from '../InlineLink/InlineLink';
import './MobileFeed.scss';

const SITE_TITLE = 'Aaron Kromer — Frontend Developer & Interaction Designer, Zürich';

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
 * The phone experience: a full-screen vertical feed, one snap-card per channel,
 * driven by the same `projects.ts` data and retro palette as the TV. No
 * three.js — the 3D room/TV is desktop+tablet only. Swiping up/down moves
 * between cards (native scroll-snap); the channel hash + tab title track the
 * card in view, so deep links and SEO stay consistent with the TV.
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
      <section
        className="feed__card feed__card--intro"
        data-channel={1}
        ref={setSectionRef(1)}
      >
        <div className="feed__intro">
          <p className="feed__pretitle">*** LIVE ***</p>
          <p className="feed__greeting">{greeting()} You’re tuned in to</p>
          <h1 className="feed__intro-title">Aaron Kromer</h1>
          <p className="feed__intro-subtitle">
            Frontend Developer &amp; Interaction Designer.
            <br />
            My projects, on every channel.
          </p>
          <p className="feed__contact">
            <a href="https://github.com/AarKro" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <span aria-hidden="true"> · </span>
            <a
              href="https://www.linkedin.com/in/aaron-kromer-a3026b193/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <span aria-hidden="true"> · </span>
            <a href="mailto:kromer.aaron@gmail.com">kromer.aaron@gmail.com</a>
          </p>
        </div>
        <p className="feed__swipe-hint" aria-hidden="true">
          swipe up to browse channels ↑
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
  const [teletextOpen, setTeletextOpen] = useState(false);
  const channelLabel = String(channel).padStart(2, '0');

  // Only the card in view plays (battery + mobile single-video limits); leaving
  // a card also closes its teletext sheet. play() may reject without a user
  // gesture (e.g. iOS low-power) — that's fine, the first frame still shows.
  useEffect(() => {
    const video = videoRef.current;
    if (isActive) {
      video?.play().catch(() => {});
    } else {
      video?.pause();
      setTeletextOpen(false);
    }
  }, [isActive]);

  const sourceControl = project.repos ? (
    <div className="feed__source-group">
      {project.repos.map((repo) => (
        <a key={repo.url} className="feed__source" href={repo.url} target="_blank" rel="noreferrer">
          {repo.name}
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  ) : project.githubUrl ? (
    <a className="feed__action" href={project.githubUrl} target="_blank" rel="noreferrer">
      VIEW CODE <span aria-hidden="true">↗</span>
    </a>
  ) : null;

  const actionLinks = (
    <>
      {sourceControl}
      {project.demoUrl && (
        <a className="feed__action" href={project.demoUrl} target="_blank" rel="noreferrer">
          OPEN DEMO <span aria-hidden="true">↗</span>
        </a>
      )}
    </>
  );

  return (
    <section
      className={`feed__card ${teletextOpen ? 'is-teletext' : ''}`}
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

      <div className="feed__bug">
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
        <div className="feed__actions">
          <button
            className="feed__action feed__action--teletext"
            onClick={() => setTeletextOpen(true)}
            aria-expanded={teletextOpen}
          >
            TELETEXT <span aria-hidden="true">▤</span>
          </button>
          {actionLinks}
        </div>
      </div>

      <article className="feed__teletext" aria-hidden={!teletextOpen}>
        <header className="feed__teletext-head">
          <span>P1{channelLabel}</span>
          <span className="feed__teletext-brand">AARKRO TV</span>
          <span>CH {channelLabel}</span>
        </header>
        <h3 className="feed__teletext-title">{project.title}</h3>
        <p className="feed__teletext-body">{renderInlineLinks(project.description)}</p>
        {project.behindTheScenes && (
          <p className="feed__teletext-behind">
            <span className="feed__behind-label">BEHIND THE SCENES</span>
            {renderInlineLinks(project.behindTheScenes)}
          </p>
        )}
        <div className="feed__actions feed__teletext-actions">
          <button
            className="feed__action feed__action--teletext"
            onClick={() => setTeletextOpen(false)}
          >
            CLOSE TELETEXT <span aria-hidden="true">▾</span>
          </button>
          {actionLinks}
        </div>
      </article>
    </section>
  );
}
