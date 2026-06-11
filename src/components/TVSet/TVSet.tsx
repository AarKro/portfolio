import { useEffect, useRef } from 'react';
import { useTV } from '../../hooks/useTV';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { Screen } from '../Screen/Screen';
import './TVSet.scss';

/** How long the CRT collapse animation gets to play before zooming out (ms) */
const POWER_OFF_DELAY = 700;

interface TVSetProps {
  /** Called shortly after the user powers off, once the collapse has played */
  onPoweredOff?: () => void;
}

/**
 * The whole television: cabinet, screen, controls, feet and antenna.
 * Renders at a fixed pixel size — it lives on the front of the 3D TV body
 * (via Scene's CSS3D layer), so apparent size is the camera's job.
 */
export function TVSet({ onPoweredOff }: TVSetProps) {
  const tv = useTV();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') tv.channelUp();
      if (event.key === 'ArrowLeft') tv.channelDown();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tv.channelUp, tv.channelDown]);

  // Notify the app when the user powers off (true -> false transition only).
  // Pressing PWR again within the delay cancels via the effect cleanup.
  const wasPoweredOn = useRef(tv.poweredOn);
  useEffect(() => {
    const was = wasPoweredOn.current;
    wasPoweredOn.current = tv.poweredOn;
    if (was && !tv.poweredOn && onPoweredOff) {
      const timer = window.setTimeout(onPoweredOff, POWER_OFF_DELAY);
      return () => window.clearTimeout(timer);
    }
  }, [tv.poweredOn, onPoweredOff]);

  return (
    <div className="tv">
      <div className="tv__antenna" aria-hidden="true">
        <span className="tv__antenna-rod tv__antenna-rod--left" />
        <span className="tv__antenna-rod tv__antenna-rod--right" />
        <span className="tv__antenna-base" />
      </div>

      <div className="tv__cabinet">
        <Screen tv={tv} />
        <ControlPanel tv={tv} />
      </div>

      <div className="tv__feet" aria-hidden="true">
        <span className="tv__foot" />
        <span className="tv__foot" />
      </div>
    </div>
  );
}
