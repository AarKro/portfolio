import { useRef, type ReactNode } from 'react';
import { useDialog } from '../../hooks/useDialog';
import storyRaw from '../../assets/others/ich.md?raw';
import './StoryReader.scss';

/**
 * The reader for the "Ich." paper on the couch: the short story from
 * src/assets/others/ich.md laid over the room. Its markdown is just blank-line
 * paragraphs with `_italics_`, parsed inline to keep the no-dependencies rule.
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
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the sheet on open so PageUp/Down/arrows scroll it (and back to the
  // opener on close); ESC closes; Tab stays inside while open.
  useDialog(dialogRef, sheetRef, open, onClose);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="story"
      role="dialog"
      aria-modal="true"
      aria-label="Ich. — a short story"
      onClick={onClose}
    >
      {/* the story is German — lang keeps screen-reader pronunciation right */}
      <article
        className="story__sheet"
        lang="de"
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
