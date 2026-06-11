import { useCallback, useEffect, useRef, useState } from 'react';
import { CHANNEL_COUNT } from '../data/projects';

/** How long the static noise covers the screen on a channel switch (ms) */
const STATIC_DURATION = 450;
/** How long the channel number OSD stays visible (ms) */
const OSD_DURATION = 2000;

export interface TVState {
  /** Current channel, 1-based. Channel 1 is the intro program. */
  channel: number;
  poweredOn: boolean;
  /** True while the static noise burst covers the screen */
  staticVisible: boolean;
  /** True while the green channel number overlay is shown */
  osdVisible: boolean;
  tuneTo: (channel: number) => void;
  channelUp: () => void;
  channelDown: () => void;
  togglePower: () => void;
}

/** Channels are shareable links: #ch-5 opens the TV on channel 5. */
function channelFromHash(): number {
  const match = /^#ch-(\d+)$/.exec(window.location.hash);
  const parsed = match ? Number(match[1]) : 1;
  return parsed >= 1 && parsed <= CHANNEL_COUNT ? parsed : 1;
}

export function useTV(): TVState {
  const [channel, setChannel] = useState(channelFromHash);
  const [poweredOn, setPoweredOn] = useState(true);
  const [staticVisible, setStaticVisible] = useState(false);
  const [osdVisible, setOsdVisible] = useState(false);

  // Ref mirrors let the callbacks read fresh values without being recreated,
  // which keeps rapid button mashing and key repeats simple.
  const channelRef = useRef(channel);
  const poweredRef = useRef(poweredOn);
  const staticTimer = useRef<number | undefined>(undefined);
  const osdTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearTimeout(staticTimer.current);
      window.clearTimeout(osdTimer.current);
    };
  }, []);

  const burst = useCallback(() => {
    setStaticVisible(true);
    setOsdVisible(true);
    window.clearTimeout(staticTimer.current);
    window.clearTimeout(osdTimer.current);
    staticTimer.current = window.setTimeout(() => setStaticVisible(false), STATIC_DURATION);
    osdTimer.current = window.setTimeout(() => setOsdVisible(false), OSD_DURATION);
  }, []);

  // Old TVs switch instantly and let the noise cover the change, so the
  // channel updates immediately while the burst restarts on every press.
  const tuneTo = useCallback(
    (target: number) => {
      if (!poweredRef.current) return;
      const wrapped = ((target - 1 + CHANNEL_COUNT) % CHANNEL_COUNT) + 1;
      if (wrapped === channelRef.current) return;
      channelRef.current = wrapped;
      setChannel(wrapped);
      window.history.replaceState(null, '', `#ch-${wrapped}`);
      burst();
    },
    [burst],
  );

  const channelUp = useCallback(() => tuneTo(channelRef.current + 1), [tuneTo]);
  const channelDown = useCallback(() => tuneTo(channelRef.current - 1), [tuneTo]);

  const togglePower = useCallback(() => {
    const next = !poweredRef.current;
    poweredRef.current = next;
    setPoweredOn(next);
    if (next) burst(); // powering on greets you with a noise burst
  }, [burst]);

  return {
    channel,
    poweredOn,
    staticVisible,
    osdVisible,
    tuneTo,
    channelUp,
    channelDown,
    togglePower,
  };
}
