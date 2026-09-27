/**
 * About page content (placeholders, README §4.4). Stations sit on the braided
 * thread in order; years marked 20xx are still to be filled in.
 */
export interface Station {
  year: string;
  title: string;
  line: string;
}

export const STATIONS: Station[] = [
  { year: '2018', title: 'Software engineering apprenticeship', line: 'Where it started: learning to build things properly.' },
  { year: '20xx', title: 'CLEO AG', line: 'One line on what I did and what I took from it.' },
  { year: '20xx', title: 'Shipamax, London', line: 'One line on what I did and what I took from it.' },
  { year: '20xx', title: 'AXA, frontend developer', line: 'One line on my role and what I work on.' },
  { year: '20xx', title: 'Trainer and examiner for apprentices', line: 'Passing it on: what teaching taught me.' },
  { year: '2024', title: 'HF Interaction Design, SfGZ', line: 'Adding the design side to the engineering side.' },
];

export const LEARNINGS: string[] = [
  'Talk to people before opening Figma.',
  'Ship early; the real feedback starts after launch.',
  'Accessibility is a design decision, not a checklist.',
];
