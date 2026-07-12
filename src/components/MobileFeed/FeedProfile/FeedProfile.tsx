import { channelOf, PROJECTS } from '../../../data/projects';
import { GITHUB_URL, LINKEDIN_URL, TAGLINE } from '../../../data/profile';
import GithubIcon from '../../../assets/icons/github.svg?react';
import LinkedinIcon from '../../../assets/icons/linkedin.svg?react';
import './FeedProfile.scss';

interface FeedProfileProps {
  open: boolean;
  /** Channel whose tile shows the "just viewed" badge (or null). */
  justViewedChannel: number | null;
  /** Open a project from its tile. */
  onOpenProject: (channel: number) => void;
}

/**
 * The profile page: a fixed, tap-only overlay (not a swipe card) — hero with
 * name/tagline/social links over a thumbnail grid of every project.
 */
export function FeedProfile({ open, justViewedChannel, onOpenProject }: FeedProfileProps) {
  return (
    <section className={`feed__profile ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <header className="feed__profile-head">
        <div className="feed__profile-id">
          <div className="feed__nameplate">
            {/* deterministic break: two lines on phones, one on tablets */}
            <h1 className="feed__intro-title">Aaron <br className="feed__name-break" />Kromer</h1>
          </div>
          <p className="feed__intro-kicker">{TAGLINE}</p>
          <p className="feed__intro-contact">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GithubIcon />
              GitHub
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
              <LinkedinIcon />
              LinkedIn
            </a>
          </p>
        </div>
        <p className="feed__intro-sub">Tap a project and swipe away!</p>
      </header>

      <div className="feed__grid">
        {PROJECTS.map((project, index) => {
          const channel = channelOf(index);
          return (
            <button
              key={project.id}
              className={`feed__tile ${justViewedChannel === channel ? 'is-just-viewed' : ''}`}
              onClick={() => onOpenProject(channel)}
              aria-label={`Open ${project.title}`}
            >
              {project.posterUrl ? (
                <img
                  className="feed__tile-media"
                  src={project.gridPosterUrl ?? project.mobilePosterUrl ?? project.posterUrl}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <span className="feed__tile-placeholder" aria-hidden="true" />
              )}
              <span className="feed__tile-title">{project.title}</span>
              {justViewedChannel === channel && <span className="feed__tile-badge">Just viewed</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
