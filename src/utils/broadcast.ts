import { CHANNEL_COUNT, type Project } from '../data/projects';

/**
 * The site/SEO title — must stay in sync with the <title> in index.html.
 * Shown when the TV is on the intro channel and on the mobile profile.
 */
export const SITE_TITLE = 'Aaron Kromer — Frontend Developer & Interaction Designer, Zürich';

/**
 * Reads the current channel from the URL hash. Channels are shareable links:
 * `#ch-5` opens on channel 5. Falls back to channel 1 (the intro) for a
 * missing or out-of-range hash. Shared by the desktop TV and the mobile feed.
 */
export function channelFromHash(): number {
  const match = /^#ch-(\d+)$/.exec(window.location.hash);
  const parsed = match ? Number(match[1]) : 1;
  return parsed >= 1 && parsed <= CHANNEL_COUNT ? parsed : 1;
}

/** Two-digit channel label, e.g. 5 → "05". */
export function formatChannel(channel: number): string {
  return String(channel).padStart(2, '0');
}

/**
 * The document title for a broadcast: a project channel reads
 * "CH 05 · Title — Aaron Kromer"; the intro/profile (no project) falls back to
 * the site title. Used by both the desktop TV and the mobile feed so they stay
 * consistent (and `#ch-N` deep links read the same in either experience).
 */
export function broadcastTitle(channel: number, project: Project | null): string {
  return project ? `CH ${formatChannel(channel)} · ${project.title} — Aaron Kromer` : SITE_TITLE;
}
