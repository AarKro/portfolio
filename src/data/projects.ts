/**
 * THE content file. Each entry below becomes one TV channel, in order.
 * Channel 1 is always the intro program; projects start at channel 2.
 *
 * To add a project: append (or insert) an object here. Done.
 * To remove one: delete its entry. Channel numbers renumber automatically.
 *
 * embedUrl: set it to render the live demo inside the TV screen ("tune in").
 * Only use URLs that allow being iframed (GitHub Pages and Netlify do).
 * Leave it out for repos without a hosted demo.
 */

export interface Project {
  /** Stable identifier, used as React key */
  id: string;
  /** Title shown on screen */
  title: string;
  /** One short paragraph, written like a TV program description */
  description: string;
  /** Tech keywords shown as tags */
  tech: string[];
  /** Link to the repository */
  githubUrl: string;
  /** Link to a hosted demo, opens in a new tab */
  demoUrl?: string;
  /** Demo URL to render inside the TV screen via iframe */
  embedUrl?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'wine-me',
    title: 'Wine Me',
    description:
      'A gesture-controlled interactive image viewer. No mouse, no keyboard — you browse with hand gestures through your webcam.',
    tech: ['TypeScript', 'Gesture Recognition', 'Webcam'],
    githubUrl: 'https://github.com/AarKro/wine-me',
    demoUrl: 'https://aarkro.github.io/wine-me/',
    embedUrl: 'https://aarkro.github.io/wine-me/',
  },
  {
    id: 'wow-graveyard-3d',
    title: 'WoW Graveyard 3D',
    description:
      'A 3D graveyard for retired World of Warcraft characters, built with three.js. Every tombstone is a character laid to rest.',
    tech: ['TypeScript', 'three.js', '3D'],
    githubUrl: 'https://github.com/AarKro/wow-graveyard-3d',
    demoUrl: 'https://aarkro.github.io/wow-graveyard-3d/',
    embedUrl: 'https://aarkro.github.io/wow-graveyard-3d/',
  },
  {
    id: 'neural-network-exploration',
    title: 'Neural Network Exploration',
    description:
      'A playground for learning how neural networks work, using Brain.js. Draw a capital letter and the network guesses which one you wrote.',
    tech: ['TypeScript', 'Brain.js', 'Machine Learning'],
    githubUrl: 'https://github.com/AarKro/neural-network-exploration',
    demoUrl: 'https://aarkro.github.io/neural-network-exploration/',
    embedUrl: 'https://aarkro.github.io/neural-network-exploration/',
  },
  {
    id: 'scholars-mate',
    title: "Scholar's Mate",
    description:
      "A scrollytelling page that explains the four moves of chess's most famous beginner trap, one scroll at a time.",
    tech: ['HTML', 'CSS', 'Scrollytelling'],
    githubUrl: 'https://github.com/AarKro/scholars-mate',
    demoUrl: 'https://aarkro.github.io/scholars-mate/',
    embedUrl: 'https://aarkro.github.io/scholars-mate/',
  },
  {
    id: 'zephir-flex',
    title: 'Zephir Flex',
    description:
      'A type specimen site for Zephir Flex — a flexible font I designed myself. The page shows it off in all its variations.',
    tech: ['Type Design', 'JavaScript', 'CSS'],
    githubUrl: 'https://github.com/AarKro/zephir-flex',
    demoUrl: 'https://aarkro.github.io/zephir-flex/',
    embedUrl: 'https://aarkro.github.io/zephir-flex/',
  },
  {
    id: 'prompt-assistant',
    title: 'Prompt Assistant',
    description:
      'A small tool that helps you structure and refine prompts for AI models instead of typing them freehand.',
    tech: ['TypeScript', 'React', 'AI'],
    githubUrl: 'https://github.com/AarKro/prompt-assistant',
    demoUrl: 'https://aarkro.github.io/prompt-assistant/dist/',
    embedUrl: 'https://aarkro.github.io/prompt-assistant/dist/',
  },
  {
    id: 'typography-sandbox',
    title: 'Typography Sandbox',
    description:
      'A sandbox to try out Google Fonts and compare them side by side across different screen sizes before committing to one.',
    tech: ['TypeScript', 'Google Fonts', 'Typography'],
    githubUrl: 'https://github.com/AarKro/typography-sandbox',
    demoUrl: 'https://aarkro.github.io/typography-sandbox/',
    embedUrl: 'https://aarkro.github.io/typography-sandbox/',
  },
  {
    id: 'wow-graveyard',
    title: 'WoW Graveyard',
    description:
      'The original 2D version of the WoW character graveyard — where the idea for the 3D remake on the earlier channel started.',
    tech: ['JavaScript', 'CSS'],
    githubUrl: 'https://github.com/AarKro/wow-graveyard',
    demoUrl: 'https://aarkro.github.io/wow-graveyard/',
    embedUrl: 'https://aarkro.github.io/wow-graveyard/',
  },
  {
    id: 'aframe-virtual-reality',
    title: 'A-Frame VR',
    description:
      'Virtual reality experiments with A-Frame, running straight in the browser — no headset required to look around.',
    tech: ['A-Frame', 'WebVR', 'JavaScript'],
    githubUrl: 'https://github.com/AarKro/aframe-virtual-reality',
    demoUrl: 'https://aarkro.github.io/aframe-virtual-reality/',
    embedUrl: 'https://aarkro.github.io/aframe-virtual-reality/',
  },
  {
    id: 'hera',
    title: 'Hera',
    description:
      'A multi-purpose Discord chatbot with a music player, server metrics tracking and moderation features, deployed on AWS with its own build pipeline.',
    tech: ['Java', 'Discord', 'AWS'],
    githubUrl: 'https://github.com/AarKro/Hera',
  },
  {
    id: 'apollo',
    title: 'Apollo',
    description:
      'A voice-controlled smart assistant for Discord. Talk to your server instead of typing commands.',
    tech: ['TypeScript', 'Discord', 'Voice Recognition'],
    githubUrl: 'https://github.com/AarKro/Apollo',
  },
  {
    id: 'diablo-companion',
    title: 'Diablo Companion',
    description:
      'A companion PWA for Diablo 3 built on Blizzard’s community API. Create reorderable lists from every item in the game — installable like a native app.',
    tech: ['TypeScript', 'PWA', 'Blizzard API'],
    githubUrl: 'https://github.com/AarKro/Diablo-Companion',
    demoUrl: 'https://festive-agnesi-223011.netlify.app/',
    embedUrl: 'https://festive-agnesi-223011.netlify.app/',
  },
  {
    id: 'toggle-game',
    title: 'Toggle Game',
    description:
      'A small web-based puzzle game: toggle all the tiles on or off. Sounds easy. It is not. Also installable as a PWA.',
    tech: ['TypeScript', 'PWA', 'Game'],
    githubUrl: 'https://github.com/AarKro/Toggle-Game',
    demoUrl: 'https://silly-rosalind-93c29a.netlify.app/',
    embedUrl: 'https://silly-rosalind-93c29a.netlify.app/',
  },
];

/** Channel 1 is the intro; project channels start here. */
export const FIRST_PROJECT_CHANNEL = 2;

/** Total channel count: intro + all projects. */
export const CHANNEL_COUNT = PROJECTS.length + 1;
