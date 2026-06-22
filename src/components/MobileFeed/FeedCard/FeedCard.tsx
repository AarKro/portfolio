import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../../data/projects';
import { renderInlineLinks } from '../../InlineLink/InlineLink';
import { FeedSheet, type SheetLink } from '../FeedSheet/FeedSheet';
import ChevronIcon from '../../../assets/icons/chevron.svg?react';
import DemoIcon from '../../../assets/icons/demo.svg?react';
import GithubIcon from '../../../assets/icons/github.svg?react';
import HeartIcon from '../../../assets/icons/heart.svg?react';
import ProfileIcon from '../../../assets/icons/profile.svg?react';
import ShareIcon from '../../../assets/icons/share.svg?react';
import './FeedCard.scss';

// Likes are a bit of fun, not real data — but persisting them in localStorage
// (one shared key holding the set of liked channels) keeps the heart filled
// across reloads, which is what people expect from a TikTok-style feed.
const LIKES_KEY = 'feed:likes';

function readLikedChannels(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set(); // storage blocked (private mode) — likes stay in-memory
  }
}

function persistLike(channel: number, liked: boolean) {
  try {
    const set = readLikedChannels();
    liked ? set.add(channel) : set.delete(channel);
    localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
  } catch {
    // storage unavailable / quota — the in-memory state still updates
  }
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

/**
 * One project card in the feed: a full-bleed teaser video (or test card), a
 * right-edge rail of icon actions, and a tap-to-expand caption.
 */
export function FeedCard({ project, channel, isActive, preloadVideo, setRef, onProfile }: FeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(() => readLikedChannels().has(channel));
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
          src={project.mobileVideoUrl ?? project.videoUrl}
          poster={project.mobilePosterUrl ?? project.posterUrl}
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
          onClick={() =>
            setLiked((v) => {
              const next = !v;
              persistLike(channel, next);
              return next;
            })
          }
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
