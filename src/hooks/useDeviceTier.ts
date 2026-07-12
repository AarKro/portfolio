import { useEffect, useState } from 'react';

export type DeviceTier = 'desktop' | 'mobile';

// Keyed on the *primary* pointer on purpose: a touch-enabled laptop (which
// also reports a coarse any-pointer) still counts as desktop.
const DESKTOP_QUERY = '(hover: hover) and (pointer: fine)';

function readTier(): DeviceTier {
  // no matchMedia (SSR / ancient browsers): assume the richest experience
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  return window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'mobile';
}

/**
 * desktop (3D room) vs mobile (vertical feed; phones AND tablets). Read
 * synchronously on first paint to avoid a wrong-experience flash; re-evaluates
 * live when the primary input changes (e.g. a mouse is plugged in).
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(readTier);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setTier(readTier());
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return tier;
}
