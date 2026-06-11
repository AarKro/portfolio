import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../data/projects';
import type { TVState } from '../hooks/useTV';
import { IntroProgram } from './programs/IntroProgram';
import { ProjectProgram } from './programs/ProjectProgram';
import { StaticNoise } from './StaticNoise';
import './Screen.scss';

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

  return (
    <div className={`screen ${poweredOn ? 'screen--on' : 'screen--off'}`}>
      <div className="screen__tube">
        <div className="screen__content">
          {poweredOn &&
            (project ? (
              <ProjectProgram project={project} channel={channel} />
            ) : (
              <IntroProgram tuneTo={tv.tuneTo} />
            ))}
        </div>

        <StaticNoise active={poweredOn && staticVisible} />

        {poweredOn && osdVisible && (
          <div className="screen__osd" aria-live="polite">
            CH {String(channel).padStart(2, '0')}
          </div>
        )}

        {/* purely decorative CRT layers */}
        <div className="screen__scanlines" aria-hidden="true" />
        <div className="screen__vignette" aria-hidden="true" />
        <div className="screen__glare" aria-hidden="true" />
      </div>
    </div>
  );
}
