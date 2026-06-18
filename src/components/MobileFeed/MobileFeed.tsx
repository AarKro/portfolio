import { useEffect, useRef, useState } from 'react';
import { FIRST_PROJECT_CHANNEL, PROJECTS } from '../../data/projects';
import { broadcastTitle, channelFromHash } from '../../utils/broadcast';
import { FeedCard } from './FeedCard/FeedCard';
import { FeedProfile } from './FeedProfile/FeedProfile';
import './MobileFeed.scss';

/**
 * The phone & tablet experience: a vertical scroll-snap feed of project cards
 * (TikTok-style), plus a tap-only profile overlay (channel 1). Driven by the
 * same `projects.ts` data as the desktop TV; no three.js. The channel hash + tab
 * title track what's shown so deep links and SEO stay consistent with the TV.
 */
export function MobileFeed() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  // Channel 1 is the profile, which is a tap-only overlay (NOT a swipe card):
  // `profileOpen` toggles it; `activeChannel` always tracks a project (2..N).
  const [initialChannel] = useState(channelFromHash);
  const [profileOpen, setProfileOpen] = useState(initialChannel === 1);
  const [activeChannel, setActiveChannel] = useState(
    initialChannel === 1 ? FIRST_PROJECT_CHANNEL : initialChannel,
  );
  // The project you opened the profile FROM — its grid tile gets a "just viewed"
  // badge while the profile is open, cleared once you leave again.
  const [justViewedChannel, setJustViewedChannel] = useState<number | null>(null);

  // Deep-linked straight to a project: put it in view under the closed profile
  useEffect(() => {
    if (initialChannel !== 1) sectionsRef.current[initialChannel - 1]?.scrollIntoView();
  }, [initialChannel]);

  // Whichever project card is most in view becomes the active channel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) setActiveChannel(Number((top.target as HTMLElement).dataset.channel));
      },
      { threshold: 0.6 },
    );
    sectionsRef.current.forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Mirror to the URL hash + tab title — the profile is channel 1
  useEffect(() => {
    const channel = profileOpen ? 1 : activeChannel;
    window.history.replaceState(null, '', `#ch-${channel}`);
    const project = profileOpen ? null : PROJECTS[activeChannel - FIRST_PROJECT_CHANNEL];
    document.title = broadcastTitle(activeChannel, project);
  }, [profileOpen, activeChannel]);

  // Leaving the profile clears the "just viewed" badge
  useEffect(() => {
    if (!profileOpen) setJustViewedChannel(null);
  }, [profileOpen]);

  const setSectionRef = (channel: number) => (el: HTMLElement | null) => {
    sectionsRef.current[channel - 1] = el;
  };

  // Tile tap → reveal that project: scroll the feed under the overlay, then
  // slide the profile away.
  const openProject = (channel: number) => {
    sectionsRef.current[channel - 1]?.scrollIntoView();
    setProfileOpen(false);
  };

  // Rail profile icon → slide the profile back over, badging the card we left.
  const openProfile = (fromChannel: number) => {
    setJustViewedChannel(fromChannel);
    setProfileOpen(true);
  };

  return (
    <>
      <div className="feed">
        {PROJECTS.map((project, index) => {
          const channel = index + FIRST_PROJECT_CHANNEL;
          return (
            <FeedCard
              key={project.id}
              project={project}
              channel={channel}
              isActive={!profileOpen && activeChannel === channel}
              // preload the active card and its immediate neighbours only
              preloadVideo={Math.abs(channel - activeChannel) <= 1}
              setRef={setSectionRef(channel)}
              onProfile={openProfile}
            />
          );
        })}
      </div>

      <FeedProfile
        open={profileOpen}
        justViewedChannel={justViewedChannel}
        onOpenProject={openProject}
      />
    </>
  );
}
