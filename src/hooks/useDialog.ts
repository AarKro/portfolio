import { useEffect, useRef, type RefObject } from 'react';
import { useFocusTrap } from './useFocusTrap';

/**
 * Shared modal-dialog behaviour: on open, focus moves to `initialFocusRef`
 * (remembering the opener); on close it returns to the opener. ESC closes
 * (swallowed so it doesn't reach other listeners), and Tab stays inside
 * `containerRef` while open.
 */
export function useDialog(
  containerRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      initialFocusRef.current?.focus();
    } else {
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useFocusTrap(containerRef, open);
}
