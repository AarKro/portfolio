import type { ReactNode } from 'react';
import './InlineLink.scss';

interface InlineLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * A link that sits inside running text and leaves the site — it carries the
 * same trailing ↗ "external" glyph as the action buttons so it's clear the
 * link navigates away.
 */
export function InlineLink({ href, children }: InlineLinkProps) {
  return (
    <a className="inline-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="inline-link__icon" aria-hidden="true">↗</span>
    </a>
  );
}

/** Matches a markdown-style `[label](url)` inline link. */
const INLINE_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/** A run of copy text; `href` set means the run is a link label. */
export interface InlineToken {
  text: string;
  href?: string;
}

/**
 * Splits a string with inline `[label](url)` links into plain/link tokens.
 * Shared by `renderInlineLinks` and renderers that need to lay the text out
 * themselves (the teletext page word-wraps it onto a character grid).
 */
export function tokenizeInlineLinks(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_LINK_PATTERN)) {
    const [full, label, url] = match;
    const start = match.index ?? 0;
    if (start > lastIndex) tokens.push({ text: text.slice(lastIndex, start) });
    tokens.push({ text: label, href: url });
    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) tokens.push({ text: text.slice(lastIndex) });
  return tokens;
}

/**
 * Renders a string that may contain inline `[label](url)` links as React nodes,
 * turning each into an `<InlineLink>`. Plain text passes through untouched, so
 * project copy can stay as simple strings in `projects.ts`.
 */
export function renderInlineLinks(text: string): ReactNode {
  return tokenizeInlineLinks(text).map((token, i) =>
    token.href ? (
      <InlineLink key={i} href={token.href}>
        {token.text}
      </InlineLink>
    ) : (
      token.text
    ),
  );
}

/** Strips `[label](url)` markup down to its plain label (for the SEO text). */
export function stripInlineLinks(text: string): string {
  return text.replace(INLINE_LINK_PATTERN, '$1');
}
