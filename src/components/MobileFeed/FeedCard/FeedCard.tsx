import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../../data/projects';
import { NAME } from '../../../data/profile';
import { channelUrl } from '../../../utils/broadcast';
import { renderInlineLinks } from '../../InlineLink/InlineLink';
import { ClipSources } from '../../ClipSources/ClipSources';
import { FeedSheet } from '../FeedSheet/FeedSheet';
import ChevronIcon from '../../../assets/icons/chevron.svg?react';
import DemoIcon from '../../../assets/icons/demo.svg?react';
import GithubIcon from '../../../assets/icons/github.svg?react';
import HeartIcon from '../../../assets/icons/heart.svg?react';
import ProfileIcon from '../../../assets/icons/profile.svg?react';
import ShareIcon from '../../../assets/icons/share.svg?react';
import './FeedCard.scss';

// Likes are just for fun, but persisting them keeps the heart filled across
// reloads, as people expect from this kind of feed.
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
    // storage unavailable — the in-memory state still updates
  }
}

interface FeedCardProps {
  project: Project;
  channel: number;
  isActive: boolean;
  /**
   * Within the preload window of the active card. Gates the `poster` image —
   * browsers fetch `<video poster>` for every card on mount regardless of
   * `preload`, so far-off cards must not carry one.
   */
  inWindow: boolean;
  setRef: (el: HTMLElement | null) => void;
  /** Jump back to the profile page, badging the card we came from. */
  onProfile: (fromChannel: number) => void;
}

/**
 * One project card in the feed: full-bleed teaser video (or placeholder), a
 * right-edge rail of icon actions, and a tap-to-expand caption. Neighbouring
 * clips are warmed by the shared <VideoPreloader> in MobileFeed, so this
 * component owns no preload logic.
 */
export function FeedCard({ project, channel, isActive, inWindow, setRef, onProfile }: FeedCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(() => readLikedChannels().has(channel));
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);

  // Only the card in view plays; leaving a card resets its open panels.
  // play() may reject without a user gesture (e.g. iOS low-power) — fine,
  // the first frame still shows.
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

  // Show a spinner once the active card has been waiting on its video for
  // >2s; clear it the moment playback (re)starts.
  useEffect(() => {
    const video = videoRef.current;
    if (!isActive || !project.videoUrl || !video) {
      setLoadingSlow(false);
      return;
    }

    let timer = window.setTimeout(() => setLoadingSlow(true), 2000);
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLoadingSlow(true), 2000);
    };
    const onPlaying = () => {
      window.clearTimeout(timer);
      setLoadingSlow(false);
    };

    // already buffered enough to play — no spinner needed
    if (video.readyState >= 3 && !video.paused) onPlaying();

    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', arm); // re-arm when it stalls mid-play

    return () => {
      window.clearTimeout(timer);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', arm);
    };
  }, [isActive, project.videoUrl]);

  // deep link to this card, same #ch-N format as the TV
  const shareUrl = channelUrl(channel);

  // Web Share API where available, otherwise copy the link with a confirmation
  const handleShare = async () => {
    const data = {
      title: project.title,
      text: `${project.title} — from ${NAME}'s portfolio`,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // user dismissed the share sheet
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        // clipboard blocked
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
          aria-label={`Silent preview clip of ${project.title}`}
          poster={inWindow ? (project.mobilePosterUrl ?? project.posterUrl) : undefined}
          muted
          loop
          playsInline
          // active card loads its own clip; neighbours are warmed by
          // <VideoPreloader> into the cache, so they fetch on demand here
          preload={isActive ? 'auto' : 'none'}
        >
          <ClipSources sources={project.mobileVideoUrl ?? project.videoUrl} />
        </video>
      ) : (
        <div className="feed__placeholder" aria-hidden="true">
          <span className="feed__placeholder-title">{project.title}</span>
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
          aria-label="Like" /* constant: aria-pressed carries the on/off state */
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
          {/* kept mounted so the status is announced when the text appears */}
          <span className="feed__rail-label feed__rail-copied" role="status">
            {copied ? 'Copied' : null}
          </span>
        </button>
      </div>

      {/* caption: title, tags, one-line synopsis that expands to the full
          description + behind-the-scenes */}
      <div className="feed__bug">
        <div className="feed__caption">
          <h2 className="feed__title">
            {project.title}
            {loadingSlow && (
              <span className="feed__spinner" role="status" aria-label="Loading video" />
            )}
          </h2>
          <ul className="feed__tech">
            {project.tech.map((tag) => (
              <li key={tag} className="feed__tag">
                {tag}
              </li>
            ))}
          </ul>

          <div className="feed__synopsis">
            <p className="feed__description" id={`feed-description-${channel}`}>
              {renderInlineLinks(project.description)}
            </p>
            <button
              className="feed__expand"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls={
                `feed-description-${channel}` +
                (project.behindTheScenes ? ` feed-details-${channel}` : '')
              }
              aria-label={expanded ? 'Hide details' : 'Show details'}
            >
              <ChevronIcon />
            </button>
          </div>

          {project.behindTheScenes && (
            <div className="feed__details" id={`feed-details-${channel}`} aria-hidden={!expanded}>
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

      {/* only a bundled channel needs the source sheet; a single repo is a
          plain rail link */}
      {project.repos && (
        <FeedSheet
          open={codeOpen}
          title="Source code"
          links={project.repos.map((repo) => ({ label: repo.name, href: repo.url }))}
          onClose={() => setCodeOpen(false)}
        />
      )}
    </section>
  );
}
