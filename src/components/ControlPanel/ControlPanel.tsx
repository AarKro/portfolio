import { formatChannel } from '../../utils/broadcast';
import type { TVState } from '../../hooks/useTV';
import './ControlPanel.scss';

interface ControlPanelProps {
  tv: TVState;
}

/** The strip of physical controls below the screen. */
export function ControlPanel({ tv }: ControlPanelProps) {
  const { channel, poweredOn, channelUp, channelDown, togglePower } = tv;

  return (
    <div className="controls">
      <div className="controls__brand">
        <span className="controls__logo">KROMERTRON</span>
        <span className="controls__model">color · model AK-1986</span>
      </div>

      <div className="controls__speaker" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="controls__speaker-slit" />
        ))}
      </div>

      <div className="controls__channel-display" aria-label={`Channel ${channel}`}>
        {poweredOn ? formatChannel(channel) : '--'}
      </div>

      <span
        className={`controls__led ${poweredOn ? 'controls__led--on' : 'controls__led--standby'}`}
        aria-hidden="true"
      />

      {/* channel buttons stay clickable when the TV is off — like a real
          set, pressing them just does nothing (useTV guards the power) */}
      <div className="controls__buttons">
        <button className="controls__button" onClick={channelDown} aria-label="Previous channel">
          CH ▼
        </button>
        <button className="controls__button" onClick={channelUp} aria-label="Next channel">
          CH ▲
        </button>
        <button
          className={`controls__button controls__button--power ${poweredOn ? 'is-on' : ''}`}
          onClick={togglePower}
          aria-label={poweredOn ? 'Turn TV off' : 'Turn TV on'}
        >
          PWR <span className="controls__power-icon" aria-hidden="true">⏻</span>
        </button>
      </div>

      <div className="controls__knobs" aria-hidden="true">
        <span className="controls__knob" />
        <span className="controls__knob" />
      </div>
    </div>
  );
}
