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
        {poweredOn ? String(channel).padStart(2, '0') : '--'}
      </div>

      <span
        className={`controls__led ${poweredOn ? 'controls__led--on' : 'controls__led--standby'}`}
        aria-hidden="true"
      />

      <div className="controls__buttons">
        <button
          className="controls__button"
          onClick={channelDown}
          disabled={!poweredOn}
          aria-label="Previous channel"
        >
          CH ▼
        </button>
        <button
          className="controls__button"
          onClick={channelUp}
          disabled={!poweredOn}
          aria-label="Next channel"
        >
          CH ▲
        </button>
        <button
          className={`controls__button controls__button--power ${poweredOn ? 'is-on' : ''}`}
          onClick={togglePower}
          aria-label={poweredOn ? 'Turn TV off' : 'Turn TV on'}
        >
          PWR
        </button>
      </div>

      <div className="controls__knobs" aria-hidden="true">
        <span className="controls__knob" />
        <span className="controls__knob" />
      </div>
    </div>
  );
}
