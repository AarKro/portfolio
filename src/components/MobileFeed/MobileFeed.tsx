import { useEffect, useRef, useState } from 'react';
import { channelOf, FIRST_PROJECT_CHANNEL, projectAt, PROJECTS } from '../../data/projects';
import { broadcastTitle, channelFromHash, setChannelHash } from '../../utils/broadcast';
import { orderedNeighborClips, PRELOAD_RADIUS } from '../../utils/preload';
import { VideoPreloader } from '../VideoPreloader/VideoPreloader';
import { FeedCard } from './FeedCard/FeedCard';
import { FeedProfile } from './FeedProfile/FeedProfile';
import './MobileFeed.scss';

/**
 * The phone & tablet experience: a vertical scroll-snap feed of project cards,
 * plus a tap-only profile overlay (channel 1). Same projects.ts data and #ch-N
 * deep links as the desktop TV; no three.js.
 */
export function MobileFeed() {
  const sectionsRef = useRef(new Map<number, HTMLElement>());
  // The profile is an overlay, not a swipe card: `profileOpen` toggles it;
  // `activeChannel` always tracks a project (2..N).
  const [initialChannel] = useState(channelFromHash);
  const [profileOpen, setProfileOpen] = useState(initialChannel === 1);
  const [activeChannel, setActiveChannel] = useState(
    initialChannel === 1 ? FIRST_PROJECT_CHANNEL : initialChannel,
  );
  // the project you opened the profile FROM — its grid tile gets a badge
  const [justViewedChannel, setJustViewedChannel] = useState<number | null>(null);

  // Deep-linked straight to a project: put it in view under the closed profile
  useEffect(() => {
    if (initialChannel !== 1) sectionsRef.current.get(initialChannel)?.scrollIntoView();
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
    sectionsRef.current.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);


  // Mirror to the URL hash + tab title — the profile is channel 1
  useEffect(() => {
    setChannelHash(profileOpen ? 1 : activeChannel);
    const project = profileOpen ? null : projectAt(activeChannel);
    document.title = broadcastTitle(activeChannel, project);
  }, [profileOpen, activeChannel]);

  // Leaving the profile clears the "just viewed" badge
  useEffect(() => {
    if (!profileOpen) setJustViewedChannel(null);
  }, [profileOpen]);

  const setSectionRef = (channel: number) => (el: HTMLElement | null) => {
    if (el) sectionsRef.current.set(channel, el);
    else sectionsRef.current.delete(channel);
  };

  // tile tap: scroll the feed under the overlay, then slide the profile away
  const openProject = (channel: number) => {
    sectionsRef.current.get(channel)?.scrollIntoView();
    setProfileOpen(false);
  };

  const openProfile = (fromChannel: number) => {
    setJustViewedChannel(fromChannel);
    setProfileOpen(true);
  };

  return (
    <>
      {/* focusable so an external keyboard (iPad etc.) can scroll it directly */}
      <div className="feed" role="region" aria-label="Project feed" tabIndex={0}>
        {PROJECTS.map((project, index) => {
          const channel = channelOf(index);
          return (
            <FeedCard
              key={project.id}
              project={project}
              channel={channel}
              isActive={!profileOpen && activeChannel === channel}
              inWindow={Math.abs(channel - activeChannel) <= PRELOAD_RADIUS}
              setRef={setSectionRef(channel)}
              onProfile={openProfile}
            />
          );
        })}
      </div>

      {/* warm the clips around the active card — same policy as the desktop
          TV, portrait sources here */}
      <VideoPreloader
        sources={orderedNeighborClips(activeChannel, (ch) => {
          const p = projectAt(ch);
          return p?.mobileVideoUrl ?? p?.videoUrl;
        })}
      />

      <FeedProfile
        open={profileOpen}
        justViewedChannel={justViewedChannel}
        onOpenProject={openProject}
      />
    </>
  );
}
