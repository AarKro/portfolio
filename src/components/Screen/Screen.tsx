import { useEffect, useRef, useState } from 'react';
import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../../data/projects';
import { broadcastTitle, formatChannel } from '../../utils/broadcast';
import { orderedNeighborClips } from '../../utils/preload';
import type { TVState } from '../../hooks/useTV';
import { useSwipe } from '../../hooks/useSwipe';
import { IntroProgram } from '../IntroProgram/IntroProgram';
import { ProjectProgram } from '../ProjectProgram/ProjectProgram';
import { StaticNoise } from '../StaticNoise/StaticNoise';
import { VideoPreloader } from '../VideoPreloader/VideoPreloader';
import './Screen.scss';

/** How long the one-time channel hint stays up for deep-linked visitors */
const KEYS_HINT_DURATION = 6000;

/** Touch devices can't read "← →", so they get a swipe/buttons hint instead. */
const coarsePointer =
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

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

  // Warm the clips within ±2 channels of the current one (priority-ordered) so
  // CH ▲/▼ lands on an already-buffered video — same policy as the mobile feed.
  const neighborVideoSources = orderedNeighborClips(
    channel,
    (ch) => PROJECTS[ch - FIRST_PROJECT_CHANNEL]?.videoUrl,
  );

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

  // Swipe the glass left/right to flip channels (the touch equivalent of the
  // arrow keys); the on-screen CH ▲/▼ buttons still work too.
  const swipe = useSwipe({
    onSwipeLeft: tv.channelUp,
    onSwipeRight: tv.channelDown,
  });

  // Browser tab mirrors the broadcast
  useEffect(() => {
    document.title = poweredOn ? broadcastTitle(channel, project) : 'Standby — Aaron Kromer';
  }, [channel, poweredOn, project]);

  return (
    <div className={`screen ${poweredOn ? 'screen--on' : 'screen--off'}`}>
      <div className="screen__tube" {...swipe}>
        <div className="screen__content">
          {poweredOn &&
            (project ? (
              <ProjectProgram project={project} channel={channel} />
            ) : (
              <IntroProgram tuneTo={tv.tuneTo} />
            ))}
        </div>

        {!poweredOn && <p className="screen__standby">PRESS PWR TO RESUME BROADCAST</p>}

        <StaticNoise active={poweredOn && staticVisible} />

        {poweredOn && osdVisible && (
          <div className="screen__osd" aria-live="polite">
            CH {formatChannel(channel)}
          </div>
        )}

        {poweredOn && keysHintVisible && (
          <p className="screen__keys-hint">
            {coarsePointer
              ? 'swipe or tap CH ▲ / CH ▼ · the guide is on CH 01'
              : '← → flips channels · the guide is on CH 01'}
          </p>
        )}

        {/* purely decorative CRT layers */}
        <div className="screen__scanlines" aria-hidden="true" />
        <div className="screen__vignette" aria-hidden="true" />
        <div className="screen__glare" aria-hidden="true" />
      </div>

      {poweredOn && <VideoPreloader sources={neighborVideoSources} />}
    </div>
  );
}
