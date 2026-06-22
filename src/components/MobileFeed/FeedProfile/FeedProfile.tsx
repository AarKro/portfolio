import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../../../data/projects';
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
 * The profile page: a fixed, tap-only overlay (NOT a swipe card). A clean,
 * light hero — the name as a chromatic-split logo, tagline, social links — over
 * the unchanged thumbnail grid of every project. Tapping a tile opens that
 * project. Reached only via the rail profile icon. Content mirrors the SEO block.
 */
export function FeedProfile({ open, justViewedChannel, onOpenProject }: FeedProfileProps) {
  return (
    <section className={`feed__profile ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <header className="feed__profile-head">
        {/* Figma-style geometric shapes — decorative, clipped to the hero only
            (so they never bleed into the grid or add scroll) */}
        <div className="feed__shapes" aria-hidden="true">
          <span className="feed__shape feed__shape--circle-cyan" />
          <span className="feed__shape feed__shape--ring-pink" />
          <span className="feed__shape feed__shape--square-violet" />
          <span className="feed__shape feed__shape--triangle-violet" />
          <span className="feed__shape feed__shape--pill-amber" />
          <span className="feed__shape feed__shape--plus-pink" />
          <span className="feed__shape feed__shape--dot-violet" />
          <span className="feed__shape feed__shape--dot-cyan" />
        </div>
        <div className="feed__profile-id">
          <div className="feed__nameplate">
            {/* deterministic break: two lines on phones, one on tablets (the
                <br> is hidden ≥600px) — avoids the wrap flip-flop from a
                width-scaled font size */}
            <h1 className="feed__intro-title">Aaron <br className="feed__name-break" />Kromer</h1>
          </div>
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
                <span className="feed__tile-placeholder" aria-hidden="true">
                  <span className="feed__tile-shape feed__tile-shape--circle" />
                  <span className="feed__tile-shape feed__tile-shape--ring" />
                  <span className="feed__tile-shape feed__tile-shape--square" />
                </span>
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
