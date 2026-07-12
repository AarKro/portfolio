import type { ReactNode } from 'react';
import './InlineLink.scss';

interface InlineLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * An external link inside running text, with the same trailing ↗ glyph as the
 * action buttons.
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

/** Splits a string with inline `[label](url)` links into plain/link tokens. */
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

/** Renders a string with inline `[label](url)` links as React nodes. */
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
