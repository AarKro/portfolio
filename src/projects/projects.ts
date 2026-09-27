/**
 * The main projects, in overview order. Placeholder content until the real
 * five are chosen; later each project gets its own folder (meta.ts + MDX,
 * README §9.1) and this list is built from those.
 * `n` is the project number: it picks the theme mode (data-theme="project-n")
 * and with it the thread colour.
 */
export interface Project {
  n: number;
  slug: string;
  name: string;
  summary: string;
  /** one line on the case study intro */
  oneLiner: string;
  tools: string[];
  year: string;
  role: string;
  duration: string;
  /** caption on the dimension line above the hero image */
  impression: string;
}

const summary = 'A short description of the project: the problem, who it was for and what I did, in two or three sentences.';
const oneLiner = 'One sentence on what this project is and why it mattered.';

export const PROJECTS: Project[] = [
  { n: 1, name: 'Project one', tools: ['Research', 'Figma', 'React', 'TypeScript'] },
  { n: 2, name: 'Project two', tools: ['UX', 'Figma', 'Accessibility'] },
  { n: 3, name: 'Project three', tools: ['Research', 'Figma', 'Vue', 'Motion'] },
  { n: 4, name: 'Project four', tools: ['Research', 'Prototyping', 'Vue'] },
  { n: 5, name: 'Project five', tools: ['GSAP', 'Research', 'Figma'] },
].map(({ n, name, tools }) => ({
  n,
  slug: `project-${n}`,
  name,
  summary,
  oneLiner,
  tools,
  year: '2025',
  role: 'design + code',
  duration: '8 weeks',
  impression: `impression ${String(n).padStart(2, '0')} · first prototype`,
}));

export const projectBySlug = (slug: string | undefined) => PROJECTS.find((p) => p.slug === slug);

/** Small things for the loose-ends playground (placeholders). `theme` sets the thread colour. */
export interface LooseEnd {
  title: string;
  line: string;
  tags: string[];
  link: string;
  theme: number;
  /** show an image area (placeholder) */
  image: boolean;
}

const placeholder = { title: 'placeholder title', line: 'One line on what it is and why it was fun.' };

export const LOOSE_ENDS: LooseEnd[] = [
  { title: 'zephir flex', line: 'A lowercase variable typeface I’m drawing in Glyphs.', tags: ['type design', 'glyphs'], link: 'see the specimen', theme: 1, image: true },
  { ...placeholder, tags: ['hardware', 'esp32'], link: 'open', theme: 2, image: true },
  { ...placeholder, tags: ['bot', 'typescript'], link: 'github', theme: 3, image: false },
  { ...placeholder, tags: ['widget'], link: 'open', theme: 4, image: true },
  { ...placeholder, tags: ['p5', 'generative'], link: 'play', theme: 5, image: true },
  { ...placeholder, tags: ['tool'], link: 'github', theme: 1, image: false },
  { ...placeholder, tags: ['experiment', 'css'], link: 'open', theme: 2, image: true },
  { ...placeholder, tags: ['game'], link: 'play', theme: 3, image: false },
];
