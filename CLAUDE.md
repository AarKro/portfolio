# Portfolio v2 — "The Red Thread"

Aaron Kromer's new portfolio: product design from UX and UI to code and deployment, told as process stories. This `v2` branch is a fresh start; `main` still holds the current CRT-TV site and is what GitHub Pages deploys.

**`README.md` is the spec and contract.** Every decision, its reasoning and the open questions live there, with a decision log at the bottom. Read it before changing anything conceptual, and update it (plus a decision-log line) whenever a decision changes.

## Working with Aaron

- **Don't assume, ask.** For anything with more than one reasonable answer (design, naming, scope, UX), offer 2–4 concrete options with a recommendation and let him choose. Small, reversible implementation details are fine to decide; say what you decided.
- He's a frontend developer (React, TypeScript, Figma), so talk to him as a peer. Keep answers direct.
- English copy, first person, honest and not salesy. Use metric units.
- Desktop first (designed at 1728 × 1117, MacBook Pro 16"), mobile second (simplified, still undefined).

## Commands

```bash
npm install
npm run dev      # http://localhost:5173/portfolio/
npm run build    # tsc -b + vite build
npm run lint     # ESLint 9 + jsx-a11y
```

Build and lint must pass before committing.

## Stack

Vite · React 19 · TypeScript · React Router (clean URLs, base `/portfolio/`, override with `BASE_PATH`) · SCSS modules · GSAP + ScrollTrigger · Lenis · plain Canvas 2D for the landing installation (no drawing library) · i18next · Geist / Geist Mono via `@fontsource-variable`.

Planned but not added yet: MDX for case studies (one file per project in `src/projects/<slug>/`).

## Structure

```
src/
  app/App.tsx              routes (lazy pages), wrapped in UnrollProvider
  pages/Landing/           landing + dive; renders the overview below the dive
  pages/Overview/          overview (Figma Overview v2): project rows as technical drawings, loose-ends teaser
  projects/projects.ts     placeholder project + loose-ends data (one place to edit until MDX)
  content/about.ts         about page stations and learnings (placeholders)
  pages/CaseStudy/         placeholder case study /work/project-n: pinned horizontal track, ball leads the thread
  pages/About/             about: intro + portrait, braided career thread, learnings clothesline, let's talk
  pages/LooseEnds/         loose ends: scraps on a table
  pages/NotFound/          404 ("lost the thread")
  installation/threads.ts  thread model: generation, physics, pluck/grab, drawing, dive camera
  installation/ThreadsCanvas.tsx  canvas + rAF loop, pointer input, fixed-step physics
  lib/motion.ts            Lenis + ScrollTrigger setup, scrollToTarget
  lib/reducedMotion.ts     prefers-reduced-motion hook
  unroll/                  unroll overlay (above the routes, survives navigation) + context/phases
  thread/geometry.ts       shared thread line, ball positions, attachToBall, path helpers (overlay and case study must match)
  thread/yarn.ts, YarnThread.tsx, YarnBall.tsx   yarn look (twist, hairs; also used by the landing canvas via Path2D) and the ball
  components/              YarnBundle, Nav, Tag, TextLink, SocialLink, Scrap
  styles/tokens.scss       design tokens (mirror of the Figma variables)
  styles/_type.scss        text-style mixins (mirror of the Figma text styles)
  styles/global.scss       reset, focus ring, Lenis classes
  locales/en.json          all UI text
```

## Conventions

- **Layout units.** Pages are designed at 1728 px. Composed layouts (the overview rows) write their geometry in design px with `u()` from `styles/_layout.scss` (`--u` = 1 design px, shrinks with the viewport); type keeps its own sizes. Below `$compose` (1200) they stack; below `$narrow` (720) one column. Other pages flow (grid/flex) and use `u()` only for spacing. Nothing may scroll sideways (`main` clips overflow).
- **Tokens only.** Colors, spacing, radii and type come from `tokens.scss` / `_type.scss`, never raw values. Names match the Figma code syntax: Figma `text/primary` → `var(--text-primary)`.
- **Theme modes.** Shell is the default. Projects use `data-theme="project-1"` … `"project-5"`, which remaps the semantic tokens (bg, text, border, accent, focus, `--thread-current`, `--thread-twist`, `--thread-light`). The landing uses `bg/inverse` (charcoal).
- **Text in locale files.** No hard-coded UI strings; German comes later.
- **Accessibility (WCAG 2.2 AA):** visible `:focus-visible` (2 px dashed `--focus-ring`), keyboard access to everything interactive, canvases `aria-hidden` with a text alternative, contrast checked per theme mode.
- **Motion:** every animation needs a reduced-motion version (static, no pinning, no dive). Movement through space is scrubbed and reverses on scroll back (dive, case study thread); content reveals play once (draw-in, text/image reveals, yarn bundles falling). Lenis must not break native scrolling or the keyboard.
- **Hover:** links draw in a 1.5 px underline left to right; yarn bundles wobble and their tail twitches.

## Figma

File: `https://www.figma.com/design/oWTu1dWLpHbVq78b4ufUHh/Portfolio` (fileKey `oWTu1dWLpHbVq78b4ufUHh`). Needs the Figma MCP server in Claude Code.

Pages:
- **cover** (`0:1`): file thumbnail (cover frame `30:2`).
- **design system** (`1:4`): style guide section and the Components section. **All main components live here**; every other page uses only instances.
- **concepting** (`1:3`): exploration. Sections: Landing (v2 chosen, blur), Overview (v2 chosen), Overview proposals, Case study (horizontal strip), About, Transitions (dive + unroll keyframes), Extras (favicon, share image, 404), Loose ends.
- **design** (`31:815`): final design, empty sections to fill with real content.

Variables: `Primitives` (hidden palette), `Semantic` (modes: shell, project-1…5), `Typography`, `Dimensions`. Text styles: Display XL/L/M, Heading 1–4, Body L/M/M Strong, Caption, Label/Mono.

Components: Tag, Text link (Default/Hover/Focus), Social link (Default/Hover/Focus), Icon/LinkedIn, Icon/GitHub (placeholders; use official icons in code), Peg, Stage marker, Yarn bundle (Default/Focus; color via theme mode), Nav (Case study/Overview), Stage progress (Current = Intro … Outcome), Scrap. They map to React components of the same names.

Node IDs (for `use_figma` / `get_design_context`; they only change if a node is deleted and recreated):

| Main component (design system page, Components section `25:2`) | ID |
|---|---|
| Tag | `25:12` |
| Text link (set) | `31:50` |
| Social link (set) | `31:61` |
| Icon/LinkedIn · Icon/GitHub | `25:26` · `25:28` |
| Peg | `25:35` |
| Stage marker | `25:36` |
| Yarn bundle (set) | `31:70` |
| Nav (set) · Page=Case study · Page=Overview | `25:120` · `25:95` · `25:107` |
| Stage progress (set) | `25:277` |
| Scrap | `33:58` |

| Chosen concept frame (concepting page) | ID |
|---|---|
| Landing v2 (blur) | `9:59` |
| Overview v2 · first row | `13:2` · `13:7` |
| Case study strip (project-1 mode) | `17:3` |
| About | `22:3` |
| Transitions section (dive + unroll) | `23:2` |
| Extras section (favicon, share image, 404) | `31:697` |
| Loose ends | `34:493` |

Semantic variable collection: `VariableCollectionId:3:71`.

## Current state and next steps

- Done: concept, design system, concept designs for all pages, transitions, landing prototype (threads, yarn texture, guitar-string pluck/drag physics, draw-in, scroll-driven dive, reduced motion), unroll prototype (ball jumps from the overview, thread unravels, lands on a placeholder case study, then leads the thread through a pinned horizontal track).
- Done since: overview, about and loose-ends pages from Figma (placeholder content), Nav/Tag/TextLink/SocialLink/Scrap components.
- Next: Aaron gathers assets, then the case studies are designed in Figma first; after that they're built in code (stages, clothesline, stage progress, MDX, responsive track) and polished. In Figma the case studies are a content structure to write things down in, not a one-to-one spec; no Figma sync of tokens/frames planned. Also open: official LinkedIn/GitHub icons.
- Open: the 5 main projects and their colors (the hues are placeholders), which small things go to Loose ends, GitHub Pages `404.html` redirect for clean URLs, mobile.

## Gotchas

- **Threads draw with quadratic midpoint curves** on the Canvas 2D context, for smoothness and speed.
- **Physics runs at a fixed 360 Hz step** (`STEP_MS`), decoupled from the display refresh (MacBooks run at 120 Hz). Tuning constants are per step; `TENSION` must stay below 1 or the string blows up.
- **Thread physics:** forces must act on the displacement from the rest shape, and every point updates from the previous frame's state. Tension on absolute positions pulls the curves straight and diverges.
- **ESLint** is pinned to 9: `eslint-plugin-jsx-a11y` doesn't support ESLint 10 yet.
- **Unroll handoff:** the overlay (`UnrollProvider`) draws the ball and thread until the case study takes over; both use `thread/geometry.ts` with `viewport()`, so the handoff is pixel-identical. Change the line or ball positions there, never in one place only.
- **The dive is one way.** Past its end, `Landing` sets `collapsed` and hides the dive section (the overview becomes the top of the page, scroll position is kept); "back to start" un-collapses, jumps to the dive's end and scrolls to 0 with Lenis locked. `/#work` starts collapsed.
- **ScrollTrigger pinning moves the pinned node in the DOM** (pin-spacer) on every refresh, which drops focus. The case study restores focus on `refreshInit`/`refresh`; do the same for any other pinned section.
- `vite.config.ts` uses an absolute base (`/portfolio/`); the relative `./` from v1 breaks nested routes.
