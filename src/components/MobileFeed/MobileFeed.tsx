import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  CHANNEL_COUNT,
  FIRST_PROJECT_CHANNEL,
  PROJECTS,
  type Project,
} from '../../data/projects';
import { renderInlineLinks } from '../InlineLink/InlineLink';
import {
  ChevronIcon,
  DemoIcon,
  GithubIcon,
  HeartIcon,
  LinkedinIcon,
  ProfileIcon,
  ShareIcon,
} from './icons';
import './MobileFeed.scss';

const SITE_TITLE = 'Aaron Kromer — Frontend Developer & Interaction Designer, Zürich';

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

/**
 * The phone & tablet experience: a full-screen vertical feed, one snap-card
 * per channel, taking its layout cues from TikTok — a tap-through caption and a
 * right-edge rail of icon actions. Driven by the same `projects.ts` data as the
 * desktop TV; no three.js. The channel hash + tab title track the card in view
 * so deep links and SEO stay consistent with the TV.
 */
export function MobileFeed() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  // Channel 1 is the profile, which is a tap-only overlay (NOT a swipe card):
  // `profileOpen` toggles it; `activeChannel` always tracks a project (2..N).
  const [initialChannel] = useState(channelFromHash);
  const [profileOpen, setProfileOpen] = useState(initialChannel === 1);
  const [activeChannel, setActiveChannel] = useState(
    initialChannel === 1 ? FIRST_PROJECT_CHANNEL : initialChannel,
  );
  // The project you opened the profile FROM — its grid tile gets a "just viewed"
  // badge while the profile is open, cleared once you leave again.
  const [justViewedChannel, setJustViewedChannel] = useState<number | null>(null);

  // Deep-linked straight to a project: put it in view under the closed profile
  useEffect(() => {
    if (initialChannel !== 1) sectionsRef.current[initialChannel - 1]?.scrollIntoView();
  }, [initialChannel]);

  // Whichever project card is most in view becomes the active channel
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

  // Mirror to the URL hash + tab title — the profile is channel 1
  useEffect(() => {
    const channel = profileOpen ? 1 : activeChannel;
    window.history.replaceState(null, '', `#ch-${channel}`);
    const project = profileOpen ? null : PROJECTS[activeChannel - FIRST_PROJECT_CHANNEL];
    document.title = project
      ? `CH ${String(activeChannel).padStart(2, '0')} · ${project.title} — Aaron Kromer`
      : SITE_TITLE;
  }, [profileOpen, activeChannel]);

  // Leaving the profile clears the "just viewed" badge
  useEffect(() => {
    if (!profileOpen) setJustViewedChannel(null);
  }, [profileOpen]);

  const setSectionRef = (channel: number) => (el: HTMLElement | null) => {
    sectionsRef.current[channel - 1] = el;
  };

  // Tile tap → reveal that project: scroll the feed under the overlay, then
  // slide the profile away.
  const openProject = (channel: number) => {
    sectionsRef.current[channel - 1]?.scrollIntoView();
    setProfileOpen(false);
  };

  // Rail profile icon → slide the profile back over, badging the card we left.
  const openProfile = (fromChannel: number) => {
    setJustViewedChannel(fromChannel);
    setProfileOpen(true);
  };

  return (
    <>
      <div className="feed">
        {PROJECTS.map((project, index) => {
          const channel = index + FIRST_PROJECT_CHANNEL;
          return (
            <FeedCard
              key={project.id}
              project={project}
              channel={channel}
              isActive={!profileOpen && activeChannel === channel}
              // preload the active card and its immediate neighbours only
              preloadVideo={Math.abs(channel - activeChannel) <= 1}
              setRef={setSectionRef(channel)}
              onProfile={openProfile}
            />
          );
        })}
      </div>

      <section className={`feed__profile ${profileOpen ? 'is-open' : ''}`} aria-hidden={!profileOpen}>
        <header className="feed__profile-head">
          <div className="feed__profile-id">
            <h1 className="feed__intro-title">Aaron Kromer</h1>
            <p className="feed__intro-kicker">Frontend Developer &amp; Interaction Designer</p>
            <p className="feed__intro-contact">
              <a href="https://github.com/AarKro" target="_blank" rel="noreferrer">
                <GithubIcon />
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/aaron-kromer-a3026b193/"
                target="_blank"
                rel="noreferrer"
              >
                <LinkedinIcon />
                LinkedIn
              </a>
            </p>
          </div>
          <p className="feed__intro-sub">Tap a project and swipe away!</p>
        </header>

        <div className="feed__grid">
          {PROJECTS.map((project, index) => {
            const channel = index + FIRST_PROJECT_CHANNEL;
            return (
              <button
                key={project.id}
                className={`feed__tile ${justViewedChannel === channel ? 'is-just-viewed' : ''}`}
                onClick={() => openProject(channel)}
                aria-label={`Open ${project.title}`}
              >
                {project.posterUrl ? (
                  <img className="feed__tile-media" src={project.posterUrl} alt="" loading="lazy" />
                ) : (
                  <span className="feed__tile-testcard" aria-hidden="true" />
                )}
                <span className="feed__tile-title">{project.title}</span>
                {justViewedChannel === channel && (
                  <span className="feed__tile-badge">Just viewed</span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

interface FeedCardProps {
  project: Project;
  channel: number;
  isActive: boolean;
  /** Whether to fetch this card's video ahead of time (active ± 1). */
  preloadVideo: boolean;
  setRef: (el: HTMLElement | null) => void;
  /** Jump back to the profile page, badging the card we came from. */
  onProfile: (fromChannel: number) => void;
}

function FeedCard({ project, channel, isActive, preloadVideo, setRef, onProfile }: FeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setCodeOpen(false);
    }
  }, [isActive]);

  // The shareable deep link to this card (same #ch-N format as the TV).
  const shareUrl = `${window.location.origin}${window.location.pathname}#ch-${channel}`;

  // Source code lives on its own rail button. A single repo links straight out;
  // a bundled channel (the Discord bots) opens a sheet listing each repo.
  const repoLinks: SheetLink[] = project.repos
    ? project.repos.map((repo) => ({ label: repo.name, href: repo.url }))
    : [];

  // Share: hand off to the OS share sheet (Web Share API). Where that's not
  // available, fall back to copying the link with a brief confirmation.
  const handleShare = async () => {
    const data = {
      title: project.title,
      text: `${project.title} — from Aaron Kromer's portfolio`,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // user dismissed the share sheet — nothing to do
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        // clipboard blocked — ignore
      }
    }
  };

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
          poster={project.posterUrl}
          muted
          loop
          playsInline
          preload={preloadVideo ? 'auto' : 'none'}
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
          className="feed__rail-btn feed__rail-btn--profile"
          onClick={() => onProfile(channel)}
          aria-label="Back to profile"
        >
          <ProfileIcon />
        </button>

        <button
          className={`feed__rail-btn feed__rail-btn--like ${liked ? 'is-liked' : ''}`}
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <HeartIcon />
        </button>

        {project.githubUrl ? (
          <a
            className="feed__rail-btn feed__rail-btn--code"
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="View source code"
          >
            <GithubIcon />
          </a>
        ) : project.repos ? (
          <button
            className="feed__rail-btn feed__rail-btn--code"
            onClick={() => setCodeOpen(true)}
            aria-label="View source code"
          >
            <GithubIcon />
          </button>
        ) : null}

        {project.demoUrl && (
          <a
            className="feed__rail-btn feed__rail-btn--demo"
            href={project.demoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open live demo"
          >
            <DemoIcon />
            <span className="feed__rail-label">DEMO</span>
          </a>
        )}

        <button
          className="feed__rail-btn feed__rail-btn--share"
          onClick={handleShare}
          aria-label="Share"
        >
          <ShareIcon />
          {copied && <span className="feed__rail-label feed__rail-copied">Copied</span>}
        </button>
      </div>

      {/* bottom-left caption: title, then tags, then a one-line synopsis that
          expands to the full description + behind-the-scenes */}
      <div className="feed__bug">
        <div className="feed__caption">
          <h2 className="feed__title">{project.title}</h2>
          <ul className="feed__tech">
            {project.tech.map((tag) => (
              <li key={tag} className="feed__tag">
                {tag}
              </li>
            ))}
          </ul>

          <div className="feed__synopsis">
            <p className="feed__description">{renderInlineLinks(project.description)}</p>
            <button
              className="feed__expand"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Hide details' : 'Show details'}
            >
              <ChevronIcon />
            </button>
          </div>

          {project.behindTheScenes && (
            <div className="feed__details" aria-hidden={!expanded}>
              <div className="feed__details-inner">
                <p className="feed__behind">
                  <span className="feed__behind-label">BEHIND THE SCENES</span>
                  {renderInlineLinks(project.behindTheScenes)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <FeedSheet
        open={codeOpen}
        title="Source code"
        links={repoLinks}
        onClose={() => setCodeOpen(false)}
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

/** How far (px) you must drag the sheet down before it dismisses. */
const SHEET_CLOSE_DISTANCE = 90;

/**
 * A scrim-backed menu that slides up from the bottom of the card. The grabber
 * handle is draggable: drag it down past a threshold to dismiss (it snaps back
 * otherwise), so the affordance actually does what it looks like it does.
 */
function FeedSheet({ open, title, links, onClose }: FeedSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const onPointerDown = (event: ReactPointerEvent) => {
    setDragging(true);
    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    if (!dragging) return;
    setDragY(Math.max(0, event.clientY - startY.current));
  };
  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragY > SHEET_CLOSE_DISTANCE) onClose();
    setDragY(0);
  };

  return (
    <div className={`feed__sheet-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="feed__sheet-scrim" onClick={onClose} aria-label="Close menu" />
      <div
        className={`feed__sheet ${dragging ? 'is-dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        style={open && dragY ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div
          className="feed__sheet-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className="feed__sheet-grabber" aria-hidden="true" />
          <p className="feed__sheet-title">{title}</p>
        </div>
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
