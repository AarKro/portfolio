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
import scholarsMateVideoAv1 from '../assets/videos/scholars_mate_landscape_av1.mp4';
import scholarsMateVideoPortrait from '../assets/videos/scholars_mate_portrait.mp4';
import scholarsMateVideoPortraitAv1 from '../assets/videos/scholars_mate_portrait_av1.mp4';
import scholarsMatePoster from '../assets/thumbnails/scholars_mate_landscape.jpg';
import scholarsMatePosterPortrait from '../assets/thumbnails/scholars_mate_portrait.jpg';
import wowGraveyard3dVideo from '../assets/videos/wow_graveyard_3d_landscape.mp4';
import wowGraveyard3dVideoAv1 from '../assets/videos/wow_graveyard_3d_landscape_av1.mp4';
import wowGraveyard3dVideoPortrait from '../assets/videos/wow_graveyard_3d_portrait.mp4';
import wowGraveyard3dVideoPortraitAv1 from '../assets/videos/wow_graveyard_3d_portrait_av1.mp4';
import wowGraveyard3dPoster from '../assets/thumbnails/wow_graveyard_3d_landscape.jpg';
import wowGraveyard3dPosterPortrait from '../assets/thumbnails/wow_graveyard_3d_portrait.jpg';
import wowGraveyard3dGridPoster from '../assets/thumbnails/wow_graveyard_3d_grid.jpg';
import scholarsMateGridPoster from '../assets/thumbnails/scholars_mate_grid.jpg';
import peggyAshcroftVideo from '../assets/videos/peggy_ashcroft_landscape.mp4';
import peggyAshcroftVideoAv1 from '../assets/videos/peggy_ashcroft_landscape_av1.mp4';
import peggyAshcroftVideoPortrait from '../assets/videos/peggy_ashcroft_portrait.mp4';
import peggyAshcroftVideoPortraitAv1 from '../assets/videos/peggy_ashcroft_portrait_av1.mp4';
import peggyAshcroftPoster from '../assets/thumbnails/peggy_ashcroft_landscape.jpg';
import peggyAshcroftPosterPortrait from '../assets/thumbnails/peggy_ashcroft_portrait.jpg';
import peggyAshcroftGridPoster from '../assets/thumbnails/peggy_ashcroft_grid.jpg';
import zephirFlexVideo from '../assets/videos/zephir-flex_landscape.mp4';
import zephirFlexVideoAv1 from '../assets/videos/zephir-flex_landscape_av1.mp4';
import zephirFlexVideoPortrait from '../assets/videos/zephir-flex_portrait.mp4';
import zephirFlexVideoPortraitAv1 from '../assets/videos/zephir-flex_portrait_av1.mp4';
import zephirFlexPoster from '../assets/thumbnails/zephir-flex_landscape.jpg';
import zephirFlexPosterPortrait from '../assets/thumbnails/zephir-flex_portrait.jpg';
import zephirFlexGridPoster from '../assets/thumbnails/zephir-flex_grid.jpg';
import sugarcubesVideo from '../assets/videos/sugarcubes_landscape.mp4';
import sugarcubesVideoAv1 from '../assets/videos/sugarcubes_landscape_av1.mp4';
import sugarcubesVideoPortrait from '../assets/videos/sugarcubes_portrait.mp4';
import sugarcubesVideoPortraitAv1 from '../assets/videos/sugarcubes_portrait_av1.mp4';
import sugarcubesPoster from '../assets/thumbnails/sugarcubes_landscape.jpg';
import sugarcubesPosterPortrait from '../assets/thumbnails/sugarcubes_portrait.jpg';
import sugarcubesGridPoster from '../assets/thumbnails/sugarcubes_grid.jpg';
import cssToolboxVideo from '../assets/videos/css_toolbox_landscape.mp4';
import cssToolboxVideoAv1 from '../assets/videos/css_toolbox_landscape_av1.mp4';
import cssToolboxVideoPortrait from '../assets/videos/css_toolbox_portrait.mp4';
import cssToolboxVideoPortraitAv1 from '../assets/videos/css_toolbox_portrait_av1.mp4';
import cssToolboxPoster from '../assets/thumbnails/css_toolbox_landscape.jpg';
import cssToolboxPosterPortrait from '../assets/thumbnails/css_toolbox_portrait.jpg';
import cssToolboxGridPoster from '../assets/thumbnails/css_toolbox_grid.jpg';
import zugliVideo from '../assets/videos/zugli_landscape.mp4';
import zugliVideoAv1 from '../assets/videos/zugli_landscape_av1.mp4';
import zugliVideoPortrait from '../assets/videos/zugli_portrait.mp4';
import zugliVideoPortraitAv1 from '../assets/videos/zugli_portrait_av1.mp4';
import zugliPoster from '../assets/thumbnails/zugli_landscape.jpg';
import zugliPosterPortrait from '../assets/thumbnails/zugli_portrait.jpg';
import zugliGridPoster from '../assets/thumbnails/zugli_grid.jpg';

/** A named source-code link, for channels that bundle several repos. */
export interface RepoLink {
  /** Short label shown on the source chip (e.g. the bot's name) */
  name: string;
  /** Repository URL */
  url: string;
}

/**
 * A teaser clip in both codecs. Each `<video>` offers AV1 first and H.264 as a
 * `<source>` fallback, so the browser plays the best it can decode (see the
 * `ClipSources` component and CLAUDE.md "Adding a teaser clip"). `av1` is
 * optional: until a clip has been re-encoded with `scripts/encode-clip.sh`,
 * only the H.264 file ships and every browser uses it.
 */
export interface VideoSources {
  /** AV1 encode (`*_av1.mp4`) — smaller at equal quality; preferred when present. */
  av1?: string;
  /** H.264 encode (`*.mp4`) — the universal fallback, always present. */
  h264: string;
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
   * Carries both codec encodes (`{ av1?, h264 }`); import the assets from
   * ../assets so Vite bundles them.
   */
  videoUrl?: VideoSources;
  /**
   * Portrait (9:16) variant of `videoUrl` for the mobile feed — ideally a
   * dedicated portrait recording, not a crop of the landscape clip (see CLAUDE.md
   * "Adding a teaser clip"). The feed prefers this when set and falls back to
   * `videoUrl`. Same `{ av1?, h264 }` shape; import from ../assets/videos.
   */
  mobileVideoUrl?: VideoSources;
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
    id: 'tramly',
    title: 'Zügli',
    description:
      "A DIY version of Tramly — one of those desk-sized departure boards that mimics the tram-stop signs around Zürich. The real thing is pricey enough that I'd rather build it than buy it, so I did, for about two-thirds the cost: an ESP32 driving an LED matrix, with Rust firmware that polls the SBB API every 30 seconds for the next connection. I'm not especially versed in wiring microcontrollers, so I leaned on AI to work a lot of it out, but kept it grounded in a detailed project brief spelling out exactly what the build needed. Mostly it's been a reminder of how cheap the parts are and how far you can get pinning a microcontroller to a public API at home — fully open-sourced so anyone can reproduce it.",
    tech: ['ESP32', 'Rust', 'Hardware'],
    githubUrl: 'https://github.com/AarKro/zugli',
    demoUrl: 'https://aarkro.github.io/zugli/',
    videoUrl: { av1: zugliVideoAv1, h264: zugliVideo },
    mobileVideoUrl: { av1: zugliVideoPortraitAv1, h264: zugliVideoPortrait },
    posterUrl: zugliPoster,
    mobilePosterUrl: zugliPosterPortrait,
    gridPosterUrl: zugliGridPoster,
  },
  {
    id: 'scholars-mate',
    title: "Scholar's Mate",
    description:
      "A scrollytelling page that walks through chess's most famous beginner trap, one move at a time, made for a course on infographics and scroll-driven storytelling. The whole thing was designed in Figma, then exported as SVGs and animated with plain CSS and a little JavaScript — no framework involved. The trickiest part turned out to be the nicest: by animating each SVG's strokes in order, the pieces appear to be drawn live as you scroll. It taught me a lot about building things in Figma and the messier business of turning a static design into an actual working page.",
    tech: ['SVG Animation', 'Scrollytelling', 'CSS'],
    githubUrl: 'https://github.com/AarKro/scholars-mate',
    demoUrl: 'https://aarkro.github.io/scholars-mate/',
    videoUrl: { av1: scholarsMateVideoAv1, h264: scholarsMateVideo },
    mobileVideoUrl: { av1: scholarsMateVideoPortraitAv1, h264: scholarsMateVideoPortrait },
    posterUrl: scholarsMatePoster,
    mobilePosterUrl: scholarsMatePosterPortrait,
    gridPosterUrl: scholarsMateGridPoster,
  },
  {
    id: 'zephir-flex',
    title: 'Zephir Flex',
    description:
      'A variable typeface I drew in Glyphs 3 for a type design course — the full lowercase set, with two axes: a normal weight axis and a "wind" axis that bends the letters as if they\'re caught in a gust. This page is its official specimen, showing the font across its range. Getting something genuinely readable on screen is harder than it looks: kerning issues that seem fine while you\'re drawing become eyesores in real use, the linework gets messy fast, and the wind axis fights clean interpolation because the letterforms themselves change shape between masters. If I did it again I\'d just give it more time — type is the kind of thing you have to sit with and test, and a course deadline doesn\'t leave much room for that.',
    tech: ['Type Design', 'Variable Fonts', 'CSS'],
    githubUrl: 'https://github.com/AarKro/zephir-flex',
    demoUrl: 'https://aarkro.github.io/zephir-flex/',
    videoUrl: { av1: zephirFlexVideoAv1, h264: zephirFlexVideo },
    mobileVideoUrl: { av1: zephirFlexVideoPortraitAv1, h264: zephirFlexVideoPortrait },
    posterUrl: zephirFlexPoster,
    mobilePosterUrl: zephirFlexPosterPortrait,
    gridPosterUrl: zephirFlexGridPoster,
  },
  {
    id: 'wow-graveyard-3d',
    title: 'WoW Graveyard 3D',
    description:
      "A 3D resting place for retired World of Warcraft characters, built to learn three.js by rebuilding [something I'd already made in 2D](https://github.com/AarKro/wow-graveyard) — this time in actual space, for a \"3D in the browser\" course. The scene holds a lot of objects, which becomes a real performance problem the moment anyone opens it on a phone, so I sectioned the world into chunks to keep it manageable. Along the way I picked up a fair bit about procedural generation and what three.js can actually do. Mostly it taught me that 3D in the browser still has an easy wow factor, if you're willing to fight the framerate for it.",
    tech: ['TypeScript', 'three.js', 'Procedural Generation'],
    githubUrl: 'https://github.com/AarKro/wow-graveyard-3d',
    demoUrl: 'https://aarkro.github.io/wow-graveyard-3d/',
    videoUrl: { av1: wowGraveyard3dVideoAv1, h264: wowGraveyard3dVideo },
    mobileVideoUrl: { av1: wowGraveyard3dVideoPortraitAv1, h264: wowGraveyard3dVideoPortrait },
    posterUrl: wowGraveyard3dPoster,
    mobilePosterUrl: wowGraveyard3dPosterPortrait,
    gridPosterUrl: wowGraveyard3dGridPoster,
  },
  {
    id: 'sugarcubes',
    title: 'The Sugarcubes',
    description:
      'A print poster digitized into a web page for a basic HTML and CSS course — the brief was to port a given poster to the browser with proper desktop, tablet and mobile variants. Already comfortable with the fundamentals, I used it as an excuse to have some fun: the animation where the squares shuffle around is driven entirely by big CSS selectors that work out for themselves where an empty space is to move into. The real work was the mobile layout — the poster maps over to tablet easily enough, but a phone screen just doesn\'t have room for a one-to-one translation. Mostly it was a chance to go deep on CSS selectors and pseudo-selectors, and enjoy doing it.',
    tech: ['Pure CSS', 'CSS Animation', 'Responsive Design'],
    githubUrl: 'https://github.com/AarKro/modul_webtech',
    demoUrl: 'https://aarkro.github.io/modul_webtech/sugarcubes/sugarcubes.html',
    videoUrl: { av1: sugarcubesVideoAv1, h264: sugarcubesVideo },
    mobileVideoUrl: { av1: sugarcubesVideoPortraitAv1, h264: sugarcubesVideoPortrait },
    posterUrl: sugarcubesPoster,
    mobilePosterUrl: sugarcubesPosterPortrait,
    gridPosterUrl: sugarcubesGridPoster,
  },
  {
    id: 'peggy-ashcroft',
    title: 'Peggy Ashcroft',
    description:
      'A tribute site to the actress Dame Peggy Ashcroft, built for a responsive design and accessibility course — the subject was picked at random off Wikipedia, and this is who came up. The interesting challenge was working the other direction from usual: scaling a mobile layout up to desktop without the extra space turning into emptiness, since a phone screen simply carries fewer features at once. It pushed me deep into the accessibility side of things — ARIA labels, keyboard navigation, screen-reader behaviour and the rest. A good reminder that "works on every screen" and "works for everyone" are two different jobs.',
    tech: ['TypeScript', 'React', 'Accessibility'],
    githubUrl: 'https://github.com/AarKro/peggy-ashcroft',
    demoUrl: 'https://aarkro.github.io/peggy-ashcroft/',
    videoUrl: { av1: peggyAshcroftVideoAv1, h264: peggyAshcroftVideo },
    mobileVideoUrl: { av1: peggyAshcroftVideoPortraitAv1, h264: peggyAshcroftVideoPortrait },
    posterUrl: peggyAshcroftPoster,
    mobilePosterUrl: peggyAshcroftPosterPortrait,
    gridPosterUrl: peggyAshcroftGridPoster,
  },
  {
    id: 'css-toolbox',
    title: 'CSS Toolbox',
    description:
      "A Figma prototype for a browser extension I'd been wanting to think through for a while — a Figma-like overlay for live websites. The idea: select an element, get its CSS in a neatly formatted panel, and adjust each property with little helper controls, so as a developer who also does design I could play with styles in the browser before committing them to code. Building it as a fully clickable prototype was the right call for feeling out the interactions, though it got to be a nightmare to edit once they piled up — and the real unsolved problem is the part I committed to too quickly: right now you can read and manipulate the page, but the actual payoff would be syncing those changes back into the CSS in an IDE. It taught me how fast and capable Figma prototyping is, even if I'm not sure how much that matters now that you can half-implement the real thing with AI. A project still waiting to be built.",
    tech: ['Figma', 'UI Design', 'Interaction Design'],
    demoUrl:
      'https://www.figma.com/proto/5SfRSVnselzgMdOXUHzGxJ/CSS-Toolbox?node-id=79-2083&p=f&viewport=309%2C309%2C0.05&t=b8LCt5BqsEUP6NZh-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=79%3A2083&page-id=0%3A1',
    videoUrl: { av1: cssToolboxVideoAv1, h264: cssToolboxVideo },
    mobileVideoUrl: { av1: cssToolboxVideoPortraitAv1, h264: cssToolboxVideoPortrait },
    posterUrl: cssToolboxPoster,
    mobilePosterUrl: cssToolboxPosterPortrait,
    gridPosterUrl: cssToolboxGridPoster,
  },
  {
    id: 'discord-bots',
    title: 'Discord Bots',
    description:
      "A phase where I got really into building Discord bots that could do all kinds of things; three survived. Hera is the big one — server administration with music and a fairly sophisticated permission system, which I took as an excuse to set up a SQL database on AWS and host it on an EC2 instance, and so backed into a bit of DevOps along the way. Apollo is voice-activated, listening to a voice channel and reacting to what you say, and League Buddy runs locally, reading your live League of Legends game state and answering it with a friend's prerecorded voice lines. I never touched the raw Discord API directly — always a wrapper, in both TypeScript and Java — which left room to experiment with voice recognition, audio and deployment, and drove home how many products quietly ship an API you can just register for and build on.",
    tech: ['Java', 'TypeScript', 'AWS'],
    repos: [
      { name: 'Hera', url: 'https://github.com/AarKro/Hera' },
      { name: 'Apollo', url: 'https://github.com/AarKro/Apollo' },
      { name: 'League Buddy', url: 'https://github.com/AarKro/League-Buddy' },
    ],
  },
  
];

/** Channel 1 is the intro; project channels start here. */
export const FIRST_PROJECT_CHANNEL = 2;

/** Total channel count: intro + all projects. */
export const CHANNEL_COUNT = PROJECTS.length + 1;
