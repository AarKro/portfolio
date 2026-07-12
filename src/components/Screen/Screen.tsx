import { useEffect, useRef, useState } from 'react';
import { projectAt } from '../../data/projects';
import { NAME } from '../../data/profile';
import { broadcastTitle, formatChannel } from '../../utils/broadcast';
import { matchesMedia } from '../../utils/media';
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
const coarsePointer = matchesMedia('(pointer: coarse)');

interface ScreenProps {
  tv: TVState;
}

/**
 * The CRT glass: renders the current program with the static noise,
 * channel OSD, scanlines and glare layered on top.
 */
export function Screen({ tv }: ScreenProps) {
  const { channel, poweredOn, staticVisible, osdVisible } = tv;
  const project = projectAt(channel);

  // warm neighbouring clips so CH ▲/▼ lands on an already-buffered video
  const neighborVideoSources = orderedNeighborClips(channel, (ch) => projectAt(ch)?.videoUrl);

  // deep-linked visitors never see the intro explainer — show a hint once
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

  // swipe the glass left/right to flip channels (touch equivalent of ← →)
  const swipe = useSwipe({
    onSwipeLeft: tv.channelUp,
    onSwipeRight: tv.channelDown,
  });

  // Browser tab mirrors the broadcast
  useEffect(() => {
    document.title = poweredOn ? broadcastTitle(channel, project) : `Standby — ${NAME}`;
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

        {/* Kept mounted: a live region only announces changes to text that is
            already in the accessibility tree, so mounting it with its content
            (the old conditional render) said nothing to screen readers. */}
        <div className="screen__osd" aria-live="polite">
          {poweredOn && osdVisible ? `CH ${formatChannel(channel)}` : null}
        </div>

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
