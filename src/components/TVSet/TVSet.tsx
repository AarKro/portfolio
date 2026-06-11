import { useEffect, useRef } from 'react';
import { useTV } from '../../hooks/useTV';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { Screen } from '../Screen/Screen';
import './TVSet.scss';

/** How long the CRT collapse animation gets to play before zooming out (ms) */
const POWER_OFF_DELAY = 700;

interface TVSetProps {
  /** False when remounting after a trip to the 3D room: TV starts in standby */
  initialPoweredOn?: boolean;
  /** Called shortly after the user powers off, once the collapse has played */
  onPoweredOff?: () => void;
}

/** The whole television: cabinet, screen, controls, feet and antenna. */
export function TVSet({ initialPoweredOn = true, onPoweredOff }: TVSetProps) {
  const tv = useTV(initialPoweredOn);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') tv.channelUp();
      if (event.key === 'ArrowLeft') tv.channelDown();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tv.channelUp, tv.channelDown]);

  // Notify the app when the user powers off (true -> false transition only,
  // so mounting in standby after a room visit doesn't re-trigger the zoom).
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
