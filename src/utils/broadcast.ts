import { CHANNEL_COUNT, type Project } from '../data/projects';
import { NAME, TAGLINE } from '../data/profile';

/** The site/SEO title — must stay in sync with the <title> in index.html. */
export const SITE_TITLE = `${NAME} — ${TAGLINE}`;

/** The `#ch-N` fragment for a channel — the one place the format lives. */
export function channelHash(channel: number): string {
  return `#ch-${channel}`;
}

/** Mirrors the channel to the URL hash (without a history entry). */
export function setChannelHash(channel: number): void {
  window.history.replaceState(null, '', channelHash(channel));
}

/** Absolute shareable deep link to a channel. */
export function channelUrl(channel: number): string {
  return `${window.location.origin}${window.location.pathname}${channelHash(channel)}`;
}

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
  return project ? `CH ${formatChannel(channel)} · ${project.title} — ${NAME}` : SITE_TITLE;
}
