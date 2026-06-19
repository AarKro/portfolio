/**
 * THE content file. Each entry below becomes one TV channel, in order.
 * Channel 1 is always the intro program; projects start at channel 2.
 *
 * To add a project: append (or insert) an object here. Done.
 * To remove one: delete its entry. Channel numbers renumber automatically.
 *
 * videoUrl: import a teaser clip from ../assets and set it here. The channel
 * then autoplays the clip as its program backdrop (muted loop); channels
 * without one fall back to a full-bleed SMPTE test card. Import the file so
 * Vite bundles + fingerprints it.
 */

import scholarsMateVideo from '../assets/videos/scholars_mate_landscape.mp4';
import scholarsMateVideoPortrait from '../assets/videos/scholars_mate_portrait.mp4';
import scholarsMatePoster from '../assets/thumbnails/scholars_mate_landscape.jpg';
import scholarsMatePosterPortrait from '../assets/thumbnails/scholars_mate_portrait.jpg';
import wowGraveyard3dVideo from '../assets/videos/wow_graveyard_3d_landscape.mp4';
import wowGraveyard3dVideoPortrait from '../assets/videos/wow_graveyard_3d_portrait.mp4';
import wowGraveyard3dPoster from '../assets/thumbnails/wow_graveyard_3d_landscape.jpg';
import wowGraveyard3dPosterPortrait from '../assets/thumbnails/wow_graveyard_3d_portrait.jpg';

/** A named source-code link, for channels that bundle several repos. */
export interface RepoLink {
  /** Short label shown on the source chip (e.g. the bot's name) */
  name: string;
  /** Repository URL */
  url: string;
}

export interface Project {
  /** Stable identifier, used as React key */
  id: string;
  /** Title shown on screen */
  title: string;
  /** One short paragraph, written like a TV program description */
  description: string;
  /** Tech keywords shown as tags */
  tech: string[];
  /**
   * Optional "behind the scenes" line: the interesting technical or design
   * decision behind the project, aimed at hiring managers. One sentence.
   */
  behindTheScenes?: string;
  /** Link to the repository (single-repo channels). Use `repos` for bundles. */
  githubUrl?: string;
  /**
   * Several source repos for one bundled channel (e.g. the Discord bots).
   * Rendered as a compact labelled cluster of source links in place of the
   * single VIEW CODE button. Set this OR `githubUrl`, not both.
   */
  repos?: RepoLink[];
  /** Link to a hosted demo, opens in a new tab */
  demoUrl?: string;
  /**
   * Teaser clip that autoplays as this channel's program backdrop (muted,
   * looping). When omitted, the channel shows a full-bleed SMPTE test card.
   * Import the asset from ../assets so Vite bundles it.
   */
  videoUrl?: string;
  /**
   * Portrait (9:16) variant of `videoUrl` for the mobile feed — the landscape
   * clip cropped to portrait (sides cut equally). The feed prefers this when
   * set and falls back to `videoUrl`. Generate it with ffmpeg (see CLAUDE.md
   * "Adding a teaser clip") and import from ../assets/videos.
   */
  mobileVideoUrl?: string;
  /**
   * First-frame poster for `videoUrl` — shown instantly while the clip loads
   * (the `<video poster>`), and as the project's thumbnail in the feed grid.
   * Generate from the video (see "Adding a teaser clip"); pairs with videoUrl.
   */
  posterUrl?: string;
  /**
   * Portrait (9:16) variant of `posterUrl` for the mobile feed — the feed card
   * `<video poster>` and the profile grid tile prefer this and fall back to
   * `posterUrl`. Generate from `mobileVideoUrl` (see CLAUDE.md).
   */
  mobilePosterUrl?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'wow-graveyard-3d',
    title: 'WoW Graveyard 3D',
    description:
      'A 3D graveyard for retired World of Warcraft characters, built with three.js. Every tombstone is a character laid to rest.',
    tech: ['TypeScript', 'three.js', '3D'],
    behindTheScenes:
      'A 3D remake of my original [2D graveyard](https://github.com/AarKro/wow-graveyard) — three.js this time, with a postprocessing pipeline of volumetric godrays and simplex-noise terrain to set the mood.',
    githubUrl: 'https://github.com/AarKro/wow-graveyard-3d',
    demoUrl: 'https://aarkro.github.io/wow-graveyard-3d/',
    videoUrl: wowGraveyard3dVideo,
    mobileVideoUrl: wowGraveyard3dVideoPortrait,
    posterUrl: wowGraveyard3dPoster,
    mobilePosterUrl: wowGraveyard3dPosterPortrait,
  },
  {
    id: 'scholars-mate',
    title: "Scholar's Mate",
    description:
      "A scrollytelling page that explains the four moves of chess's most famous beginner trap, one scroll at a time.",
    tech: ['HTML', 'CSS', 'Scrollytelling'],
    behindTheScenes:
      'Scrolling drives the story: each section advances the same four-move sequence one step at a time.',
    githubUrl: 'https://github.com/AarKro/scholars-mate',
    demoUrl: 'https://aarkro.github.io/scholars-mate/',
    videoUrl: scholarsMateVideo,
    mobileVideoUrl: scholarsMateVideoPortrait,
    posterUrl: scholarsMatePoster,
    mobilePosterUrl: scholarsMatePosterPortrait,
  },
  {
    id: 'peggy-ashcroft',
    title: 'Peggy Ashcroft',
    description:
      'A tribute site to Dame Peggy Ashcroft, the English stage-and-screen great — scroll through her life, her films and her awards. Built to look right on every screen and read well for everyone.',
    tech: ['TypeScript', 'React', 'Accessibility'],
    behindTheScenes:
      'Built for a Responsive Design & Accessibility brief — hand-rolled hooks drive the scroll-spy navigation and sticky header, with the whole layout designed mobile-up and accessibility-first.',
    githubUrl: 'https://github.com/AarKro/peggy-ashcroft',
    demoUrl: 'https://aarkro.github.io/peggy-ashcroft/',
  },
  {
    id: 'zephir-flex',
    title: 'Zephir Flex',
    description:
      'A type specimen site for Zephir Flex — a flexible font I designed myself. The page shows it off in all its variations.',
    tech: ['Type Design', 'JavaScript', 'CSS'],
    behindTheScenes:
      'The font is mine too, not just the site — this page is its official specimen.',
    githubUrl: 'https://github.com/AarKro/zephir-flex',
    demoUrl: 'https://aarkro.github.io/zephir-flex/',
  },
  {
    id: 'sugarcubes',
    title: 'The Sugarcubes',
    description:
      'A print poster reimagined as a web page. Made for a Webtech module in my interaction design studies — simple, but a nice bit of type and layout to sit and look at.',
    tech: ['HTML', 'CSS', 'JavaScript'],
    behindTheScenes:
      'Hand-built in plain HTML, CSS and JavaScript — the whole page is a faithful translation of a print poster into the browser.',
    githubUrl: 'https://github.com/AarKro/modul_webtech',
    demoUrl: 'https://aarkro.github.io/modul_webtech/sugarcubes/sugarcubes.html',
  },
  {
    id: 'css-toolbox',
    title: 'CSS Toolbox',
    description:
      'A browser extension in the works: it drops an overlay of CSS and colour tools straight onto any site you are visiting. Still on the workbench — more tools (and some Figma-designed UI) on the way.',
    tech: ['TypeScript', 'React', 'Browser Extension'],
    behindTheScenes:
      'A Chrome extension built on Vite + CRXJS — content scripts inject a React overlay directly into the page you are browsing.',
    githubUrl: 'https://github.com/AarKro/css-toolbox',
  },
  {
    id: 'discord-bots',
    title: 'Discord Bots',
    description:
      'A trio of Discord bots built over the years. Hera is the flagship — music, server stats and moderation for any server. Apollo answers to voice and sound commands, and League Buddy reacts live to your League of Legends client.',
    tech: ['Java', 'TypeScript', 'Discord'],
    behindTheScenes:
      'Hera is a Java / Discord4J monorepo that ships through its own AWS CodePipeline onto EC2, backed by an RDS database; Apollo and League Buddy are leaner discord.ts bots.',
    repos: [
      { name: 'Hera', url: 'https://github.com/AarKro/Hera' },
      { name: 'Apollo', url: 'https://github.com/AarKro/Apollo' },
      { name: 'League Buddy', url: 'https://github.com/AarKro/League-Buddy' },
    ],
  },
  {
    id: 'tramly',
    title: 'Tramly',
    description:
      'A tiny tram departure board for your desk. An ESP32 build that lights up the next trams the way the signs at the stop do — still on the soldering bench.',
    tech: ['ESP32', 'Arduino', 'Hardware'],
    behindTheScenes:
      'Built on an ESP32-S3, with the display chosen to mimic a real transit departure board — amber pixels and all.',
    // No source or demo link yet — a website will be added here later.
  },
];

/** Channel 1 is the intro; project channels start here. */
export const FIRST_PROJECT_CHANNEL = 2;

/** Total channel count: intro + all projects. */
export const CHANNEL_COUNT = PROJECTS.length + 1;
