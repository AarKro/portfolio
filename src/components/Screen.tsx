import { useEffect, useRef, useState } from 'react';
import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../data/projects';
import type { TVState } from '../hooks/useTV';
import { IntroProgram } from './programs/IntroProgram';
import { ProjectProgram } from './programs/ProjectProgram';
import { StaticNoise } from './StaticNoise';
import './Screen.scss';

/** How long the one-time arrow-keys hint stays up for deep-linked visitors */
const KEYS_HINT_DURATION = 6000;

interface ScreenProps {
  tv: TVState;
}

/**
 * The CRT glass: renders the current program with the static noise,
 * channel OSD, scanlines and glare layered on top.
 */
export function Screen({ tv }: ScreenProps) {
  const { channel, poweredOn, staticVisible, osdVisible } = tv;
  const project = channel >= FIRST_PROJECT_CHANNEL ? PROJECTS[channel - FIRST_PROJECT_CHANNEL] : null;

  // Visitors who deep-link past the intro never see the explainer,
  // so show them the arrow-keys hint once.
  const initialChannel = useRef(channel);
  const [keysHintVisible, setKeysHintVisible] = useState(initialChannel.current !== 1);

  useEffect(() => {
    if (!keysHintVisible) return;
    const timer = window.setTimeout(() => setKeysHintVisible(false), KEYS_HINT_DURATION);
    return () => window.clearTimeout(timer);
  }, [keysHintVisible]);

  useEffect(() => {
    if (channel !== initialChannel.current) setKeysHintVisible(false);
  }, [channel]);

  // Browser tab mirrors the broadcast
  useEffect(() => {
    if (!poweredOn) {
      document.title = 'Standby — Aaron Kromer';
    } else if (project) {
      document.title = `CH ${String(channel).padStart(2, '0')} · ${project.title} — Aaron Kromer`;
    } else {
      document.title = 'Aaron Kromer — Portfolio';
    }
  }, [channel, poweredOn, project]);

  return (
    <div className={`screen ${poweredOn ? 'screen--on' : 'screen--off'}`}>
      <div className="screen__tube">
        <div className="screen__content">
          {poweredOn &&
            (project ? (
              <ProjectProgram project={project} channel={channel} onStatic={tv.staticBurst} />
            ) : (
              <IntroProgram tuneTo={tv.tuneTo} />
            ))}
        </div>

        {!poweredOn && <p className="screen__standby">PRESS PWR TO RESUME BROADCAST</p>}

        <StaticNoise active={poweredOn && staticVisible} />

        {poweredOn && osdVisible && (
          <div className="screen__osd" aria-live="polite">
            CH {String(channel).padStart(2, '0')}
          </div>
        )}

        {poweredOn && keysHintVisible && (
          <p className="screen__keys-hint">← → flips channels · the guide is on CH 01</p>
        )}

        {/* purely decorative CRT layers */}
        <div className="screen__scanlines" aria-hidden="true" />
        <div className="screen__vignette" aria-hidden="true" />
        <div className="screen__glare" aria-hidden="true" />
      </div>
    </div>
  );
}
