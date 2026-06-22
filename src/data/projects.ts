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
import wowGraveyard3dGridPoster from '../assets/thumbnails/wow_graveyard_3d_grid.jpg';
import scholarsMateGridPoster from '../assets/thumbnails/scholars_mate_grid.jpg';
import peggyAshcroftVideo from '../assets/videos/peggy_ashcroft_landscape.mp4';
import peggyAshcroftVideoPortrait from '../assets/videos/peggy_ashcroft_portrait.mp4';
import peggyAshcroftPoster from '../assets/thumbnails/peggy_ashcroft_landscape.jpg';
import peggyAshcroftPosterPortrait from '../assets/thumbnails/peggy_ashcroft_portrait.jpg';
import peggyAshcroftGridPoster from '../assets/thumbnails/peggy_ashcroft_grid.jpg';
import zephirFlexVideo from '../assets/videos/zephir-flex_landscape.mp4';
import zephirFlexVideoPortrait from '../assets/videos/zephir-flex_portrait.mp4';
import zephirFlexPoster from '../assets/thumbnails/zephir-flex_landscape.jpg';
import zephirFlexPosterPortrait from '../assets/thumbnails/zephir-flex_portrait.jpg';
import zephirFlexGridPoster from '../assets/thumbnails/zephir-flex_grid.jpg';
import sugarcubesVideo from '../assets/videos/sugarcubes_landscape.mp4';
import sugarcubesVideoPortrait from '../assets/videos/sugarcubes_portrait.mp4';
import sugarcubesPoster from '../assets/thumbnails/sugarcubes_landscape.jpg';
import sugarcubesPosterPortrait from '../assets/thumbnails/sugarcubes_portrait.jpg';
import sugarcubesGridPoster from '../assets/thumbnails/sugarcubes_grid.jpg';
import cssToolboxVideo from '../assets/videos/css_toolbox_landscape.mp4';
import cssToolboxVideoPortrait from '../assets/videos/css_toolbox_portrait.mp4';
import cssToolboxPoster from '../assets/thumbnails/css_toolbox_landscape.jpg';
import cssToolboxPosterPortrait from '../assets/thumbnails/css_toolbox_portrait.jpg';
import cssToolboxGridPoster from '../assets/thumbnails/css_toolbox_grid.jpg';

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
  /**
   * Portrait poster for the mobile profile grid tile ONLY — grabbed a moment
   * into the clip (1.5s) so the tile previews real content rather than the
   * first frame (which is often an intro/title card). The grid prefers this and
   * falls back to `mobilePosterUrl` / `posterUrl`. It is NOT used as a `<video
   * poster>` (those stay first-frame to match the clip's opening). Generate at
   * `-ss 1.5` from `*_portrait.mp4` (see CLAUDE.md "Adding a teaser clip").
   */
  gridPosterUrl?: string;
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
    gridPosterUrl: wowGraveyard3dGridPoster,
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
    gridPosterUrl: scholarsMateGridPoster,
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
    videoUrl: peggyAshcroftVideo,
    mobileVideoUrl: peggyAshcroftVideoPortrait,
    posterUrl: peggyAshcroftPoster,
    mobilePosterUrl: peggyAshcroftPosterPortrait,
    gridPosterUrl: peggyAshcroftGridPoster,
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
    videoUrl: zephirFlexVideo,
    mobileVideoUrl: zephirFlexVideoPortrait,
    posterUrl: zephirFlexPoster,
    mobilePosterUrl: zephirFlexPosterPortrait,
    gridPosterUrl: zephirFlexGridPoster,
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
    videoUrl: sugarcubesVideo,
    mobileVideoUrl: sugarcubesVideoPortrait,
    posterUrl: sugarcubesPoster,
    mobilePosterUrl: sugarcubesPosterPortrait,
    gridPosterUrl: sugarcubesGridPoster,
  },
  {
    id: 'css-toolbox',
    title: 'CSS Toolbox',
    description:
      'A Figma prototype for a browser extension: it drops an overlay of CSS and colour tools straight onto any site you are visiting. This channel is the interactive design itself — click through the prototype to see how the tool would feel in the browser.',
    tech: ['Figma', 'UI Design', 'Prototype'],
    behindTheScenes:
      'Designed start to finish in Figma as a clickable prototype — the whole tool overlay and its flows mapped out before a line of code.',
    demoUrl:
      'https://www.figma.com/proto/5SfRSVnselzgMdOXUHzGxJ/CSS-Toolbox?node-id=79-2083&p=f&viewport=309%2C309%2C0.05&t=b8LCt5BqsEUP6NZh-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=79%3A2083&page-id=0%3A1',
    videoUrl: cssToolboxVideo,
    mobileVideoUrl: cssToolboxVideoPortrait,
    posterUrl: cssToolboxPoster,
    mobilePosterUrl: cssToolboxPosterPortrait,
    gridPosterUrl: cssToolboxGridPoster,
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
    title: 'Zügli',
    description:
      'A tiny tram departure board for your desk. An ESP32 build that lights up the next trams the way the signs at the stop do — still on the soldering bench.',
    tech: ['ESP32', 'Arduino', 'Hardware'],
    githubUrl: 'https://github.com/AarKro/zugli',
    demoUrl: 'https://aarkro.github.io/zugli/',
    behindTheScenes:
      'Built on an ESP32-S3, with the display chosen to mimic a real transit departure board — amber pixels and all.',
  },
];

/** Channel 1 is the intro; project channels start here. */
export const FIRST_PROJECT_CHANNEL = 2;

/** Total channel count: intro + all projects. */
export const CHANNEL_COUNT = PROJECTS.length + 1;
