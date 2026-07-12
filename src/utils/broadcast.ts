import { CHANNEL_COUNT, type Project } from '../data/projects';

/** The site/SEO title — must stay in sync with the <title> in index.html. */
export const SITE_TITLE = 'Aaron Kromer — Frontend Developer & Interaction Designer';

/**
 * Reads the channel from the URL hash (`#ch-5` → 5); channels are shareable
 * links. Falls back to channel 1 for a missing or out-of-range hash.
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
 * Document title for a broadcast: "CH 05 · Title — Aaron Kromer" for a project
 * channel, the site title for the intro/profile.
 */
export function broadcastTitle(channel: number, project: Project | null): string {
  return project ? `CH ${formatChannel(channel)} · ${project.title} — Aaron Kromer` : SITE_TITLE;
}
