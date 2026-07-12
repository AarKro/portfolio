import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import './FeedSheet.scss';

export interface SheetLink {
  label: string;
  href: string;
}

interface FeedSheetProps {
  open: boolean;
  title: string;
  links: SheetLink[];
  onClose: () => void;
}

/** How far (px) you must drag the sheet down before it dismisses. */
const SHEET_CLOSE_DISTANCE = 90;

/**
 * A scrim-backed menu that slides up from the bottom of the card. The grabber
 * handle is draggable: drag it down past a threshold to dismiss (it snaps back
 * otherwise), so the affordance actually does what it looks like it does.
 */
export function FeedSheet({ open, title, links, onClose }: FeedSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const layerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Dialog focus contract: focus moves into the sheet on open and back to
  // whatever opened it on close; ESC closes; Tab stays inside while open.
  useEffect(() => {
    if (open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      sheetRef.current?.focus();
    } else {
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useFocusTrap(layerRef, open);

  const onPointerDown = (event: ReactPointerEvent) => {
    setDragging(true);
    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    if (!dragging) return;
    setDragY(Math.max(0, event.clientY - startY.current));
  };
  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragY > SHEET_CLOSE_DISTANCE) onClose();
    setDragY(0);
  };

  return (
    <div
      ref={layerRef}
      className={`feed__sheet-layer ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
    >
      <button className="feed__sheet-scrim" onClick={onClose} aria-label="Close menu" />
      <div
        ref={sheetRef}
        className={`feed__sheet ${dragging ? 'is-dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={open && dragY ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div
          className="feed__sheet-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className="feed__sheet-grabber" aria-hidden="true" />
          <p className="feed__sheet-title">{title}</p>
        </div>
        <div className="feed__sheet-links">
          {links.map((link) => (
            <a
              key={link.href}
              className="feed__sheet-link"
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
            >
              {link.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
