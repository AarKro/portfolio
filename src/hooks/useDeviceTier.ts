import { useEffect, useState } from 'react';

export type DeviceTier = 'desktop' | 'tablet' | 'mobile';

// Capability first, width second. A precise pointer that can hover
// (mouse/trackpad) marks the *primary* input as desktop-class — we key on the
// primary pointer on purpose, so a touch-enabled laptop (which also reports a
// coarse `any-pointer`) still counts as desktop. Mouse/keyboard always win
// over touch; touch stays an additive enhancement.
const DESKTOP_QUERY = '(hover: hover) and (pointer: fine)';
const MOBILE_QUERY = '(max-width: 767px)';

function readTier(): DeviceTier {
  // No matchMedia (SSR / ancient browsers): assume the richest experience.
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop';
  return window.matchMedia(MOBILE_QUERY).matches ? 'mobile' : 'tablet';
}

/**
 * Coarsely classifies the device so the app can adapt:
 *  - desktop → the full 3D room (the only tier with power-off-to-room)
 *  - tablet  → the same 3D TV, but no room and reduced GPU settings
 *  - mobile  → a separate vertical feed UI (never instantiates three.js)
 *
 * Re-evaluates on input/orientation/resize changes so rotating a tablet or
 * dragging a desktop window across the breakpoint re-tiers live. The initial
 * value is read synchronously to avoid a first-paint flash of the wrong tier.
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(readTier);

  useEffect(() => {
    const queries = [DESKTOP_QUERY, MOBILE_QUERY].map((q) => window.matchMedia(q));
    const update = () => setTier(readTier());
    queries.forEach((mq) => mq.addEventListener('change', update));
    // a resize can cross the width breakpoint without a media-query `change`
    // firing in some engines, so re-check on resize too (setState bails when
    // the value is unchanged, so this stays cheap)
    window.addEventListener('resize', update);
    return () => {
      queries.forEach((mq) => mq.removeEventListener('change', update));
      window.removeEventListener('resize', update);
    };
  }, []);

  return tier;
}
