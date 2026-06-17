import { useEffect, useState } from 'react';

export type DeviceTier = 'desktop' | 'mobile';

// Capability first: only a primary precise pointer that can hover
// (mouse/trackpad) gets the desktop 3D experience. Everything else — phones
// AND tablets — gets the touch feed. We key on the *primary* pointer on
// purpose, so a touch-enabled laptop (which also reports a coarse
// `any-pointer`) still counts as desktop. Mouse/keyboard always win over touch.
const DESKTOP_QUERY = '(hover: hover) and (pointer: fine)';

function readTier(): DeviceTier {
  // No matchMedia (SSR / ancient browsers): assume the richest experience.
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  return window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'mobile';
}

/**
 * Classifies the device into two experiences:
 *  - desktop → the full 3D living room with the CSS3D TV
 *  - mobile  → a vertical TikTok-style feed (phones and tablets; no three.js)
 *
 * Re-evaluates on input/orientation/resize changes so plugging in a mouse (or
 * unplugging it) re-tiers live. The initial value is read synchronously to
 * avoid a first-paint flash of the wrong experience.
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
