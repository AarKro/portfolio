import { useEffect, useRef, type ReactNode } from 'react';
import storyRaw from '../../assets/others/ich.md?raw';
import './StoryReader.scss';

/**
 * The reader that opens when the visitor picks up the "Ich." paper off the couch
 * in the 3D room. A sheet of paper laid over the room: the short story rendered
 * from src/assets/others/ich.md, with a control hint so it's clear you scroll to
 * read and press ESC (or ✕) to put it back down. Markdown here is just blank-line
 * paragraphs with `_inline italics_` (the story's system interjections) — parsed
 * inline below so we keep the no-dependencies rule.
 */
interface StoryReaderProps {
  open: boolean;
  onClose: () => void;
}

const PARAGRAPHS = storyRaw
  .split(/\r?\n\s*\r?\n/)
  .map((block) => block.trim())
  .filter(Boolean);

/** Render `_emphasis_` runs as <em>, everything else as plain text. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(_[^_]+_)/g).map((part, i) =>
    part.length > 2 && part.startsWith('_') && part.endsWith('_') ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      part
    ),
  );
}

export function StoryReader({ open, onClose }: StoryReaderProps) {
  const sheetRef = useRef<HTMLElement>(null);

  // ESC closes; focus the sheet on open so PageUp/Down/arrows scroll it
  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="story" role="dialog" aria-modal="true" aria-label="Ich. — a short story" onClick={onClose}>
      <article
        className="story__sheet"
        ref={sheetRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="story__close" type="button" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <header className="story__header">
          <h1 className="story__title">Ich.</h1>
          <p className="story__byline">Eine Kurzgeschichte von Aaron Kromer</p>
        </header>
        <div className="story__body">
          {PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{renderInline(paragraph)}</p>
          ))}
        </div>
      </article>

      <div className="story__hint" aria-hidden="true">
        <span>↕ Scroll to read</span>
        <span className="story__hint-sep">·</span>
        <span>ESC to close</span>
      </div>
    </div>
  );
}
