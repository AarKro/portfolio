import { useState } from 'react';
import { Scene, type ViewMode } from '../Scene/Scene';
import { TVSet } from '../TVSet/TVSet';
import { StoryReader } from '../StoryReader/StoryReader';

/**
 * The desktop experience: the full 3D living room with the DOM TV projected onto
 * the 3D TV body, plus the short-story "Ich." reader. Lazy-loaded by App so
 * three.js (and the chess chunk the Scene defers to power-off) never ships to
 * the mobile feed.
 *
 * The camera mode machine lives here because it only concerns the desktop scene:
 * tv      → parked in front of the TV: the portfolio, fully interactive
 * to-room → user powered off: camera pulls back from the glass
 * room    → first-person walking (WASD + pointer lock)
 * to-tv   → user clicked the TV: camera flies back to the website framing
 */
export function DesktopExperience() {
  const [mode, setMode] = useState<ViewMode>('tv');
  // the short-story reader, opened by clicking the paper on the couch
  const [storyOpen, setStoryOpen] = useState(false);

  return (
    <>
      <Scene
        mode={mode}
        storyOpen={storyOpen}
        onArrivedInRoom={() => setMode('room')}
        onArrivedAtTV={() => setMode('tv')}
        onTVClicked={() => setMode('to-tv')}
        onPaperClicked={() => setStoryOpen(true)}
      >
        <TVSet onPoweredOff={() => setMode('to-room')} />
      </Scene>

      <StoryReader open={storyOpen} onClose={() => setStoryOpen(false)} />
    </>
  );
}
