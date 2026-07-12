import { useState } from 'react';
import { Scene, type ViewMode } from '../Scene/Scene';
import { TVSet } from '../TVSet/TVSet';
import { StoryReader } from '../StoryReader/StoryReader';

/**
 * The desktop experience: the 3D living room with the DOM TV, plus the
 * short-story reader. Lazy-loaded by App so three.js never ships to the feed.
 * Owns the camera mode machine: tv → to-room → room → to-tv → tv.
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
