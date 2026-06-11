import { useEffect } from 'react';
import { useTV } from '../../hooks/useTV';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { Screen } from '../Screen/Screen';
import './TVSet.scss';

/** The whole television: cabinet, screen, controls, feet and antenna. */
export function TVSet() {
  const tv = useTV();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') tv.channelUp();
      if (event.key === 'ArrowLeft') tv.channelDown();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tv.channelUp, tv.channelDown]);

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
