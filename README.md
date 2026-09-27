# Portfolio v2 — "The Red Thread" (working title)

> This README is the spec and contract for the new portfolio. It records what we decided, why, and what is still open. Change it deliberately: if a decision changes, update the relevant section and add a line to the **Decision log** at the bottom.

**Status:** Concept and design system done in Figma → prototyping in code (landing threads + dive)
**Owner:** Aaron [Surname]
**Branch:** `v2`, a fresh (orphan) branch in the existing `portfolio` repository. `main` keeps the current site; the deploy workflow only runs on `main`.

---

## 1. Purpose

A portfolio that shows how I work across the whole product design process: **UX → UI → code → deployment**. It's for potential clients and employers, but it is a **portfolio first**: it shows the work, it doesn't sell. No sales language, no pricing, no "services" pitch.

The focus is on **process, not end results**. Each project gets enough room to tell its story: the problem, the research, the explorations, the decisions, the build.

### Goals
- Show range: varied projects, each end-to-end.
- Make the process tangible and enjoyable to follow.
- Feel like a high-end UX agency site: bold, clean, fluid, full of considered micro-interactions.
- Be accessible, and demonstrate it.

### Non-goals
- No CMS. Content lives in the repo.
- No contact page, no contact form, no public email address.
- No German in the first version.

---

## 2. Core concept: the red thread

The site is built around the German idiom *der rote Faden*, the thread that ties a story together. Here it is **literal**: a visible line (or possibly a character) the visitor follows through the whole site. It isn't literally red: the thread always takes the color of the project it belongs to.

- **Landing:** five spun threads, one per project in that project's color, form an interactive art installation. They behave like guitar strings: you can pull and pluck them with the mouse and they spring back into shape.
- **Dive:** the threads are layered in 3D. Entering takes you through the layers down to the "bottom", which is the overview. There, the balls of yarn fall down into place.
- **Overview:** each project is represented by its own **ball of yarn** in its own color. You choose one.
- **Project:** the chosen yarn unrolls and becomes the thread you follow through the case study. Its color becomes that project's accent.

The thread is the constant; everything around it can change per project. On the landing page it takes the form of spun threads; its exact look inside case studies is decided in design.

---

## 3. Site map

| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Interactive art installation + intro text. Entry point to the dive. |
| `/work` | Overview | 2D page after the depth transition. Yarn picker with 4–5 projects. |
| `/work/:slug` | Case study | One per project, told in stages, following that project's thread. |
| `/loose-ends` | Loose ends | Playground: small side projects as scraps, no case study. Linked in the nav and teased at the end of the overview. |
| `/about` | About | Longer version, reached via navigation. A short intro is also woven into the landing text. |

There is no contact page: LinkedIn and GitHub are always in the nav. Calls to action point to the about page where it makes sense.

---

## 4. Pages in detail

### 4.1 Landing: art installation
An interactive generative piece, shown on **every visit**. It's not an intro that plays once; it *is* the landing page. Drawn with the plain Canvas 2D API (no drawing library). Only the *perception* of 3D is needed.

**Look**
- Full screen, **dark charcoal background** (`bg/inverse`, warm gray 900). This is the only dark part of the site.
- **25–50 threads:** 5–10 per project, each in that project's thread color (`thread/project-1…5`).
- Threads run from screen edge to screen edge, spun somewhat randomly across the screen.
- **Depth from 2D layers:** the threads are flat, but layered. Back layers are thinner and dimmer, front layers thicker and brighter.
- **Yarn texture:** threads should look like real yarn, not flat lines. Plan: build each thread from 2–3 thin twisted strands along one curve, add fine fiber noise and a soft fuzzy edge. The Figma frames only show the composition; the texture is tuned in code.

**Sequence**
1. **Draw-in:** the threads are drawn in across the screen.
2. **Reveal:** once they are complete, the title appears: my name (Display XL) and the subtitle *"I design and build things :)"*.
3. **Scroll hint:** a short info line ("scroll to untangle") and a bouncing chevron fade in at the bottom.
4. **Dive (scroll-driven, scrubbed):** scrolling moves the camera forward through the center of the threads. At the same time the background gradually lightens from charcoal to the light shell background (`bg/default`). Scrolling back up reverses it.
5. **Arrival:** the dive ends on the overview (§4.2).

**Readability**
- ~~A soft backdrop blur with a slight charcoal tint behind the title and the scroll hint.~~ On trial: no blur at all (2026-09-26). If it comes back: a DOM layer over the canvas with `backdrop-filter: blur()` and a radial `mask-image` for the feathered edge.
- White text must still reach at least 4.5:1 (3:1 for large text) against the threads behind it. Open: check this without the blur.

**Interaction**
- Guitar-string behavior: the mouse can drag and pluck the threads; they stretch a little, vibrate and spring back into form. Technically a damped spring simulation (a chain of points per thread). Tuned tight: a pluck rings for about a second; a grabbed thread slips out of the grip when pulled about 84 px and snaps back.
- This interaction is specified here only; it is not shown in Figma.

**Title**
- The name may later be replaced by an **After Effects animation** (e.g. exported as Lottie). A real text fallback stays in the markup for accessibility and SEO.

**Accessibility**
- With reduced motion: threads are shown fully drawn and static, the title is visible immediately, and the dive becomes a simple crossfade to the overview.
- The scroll hint is also a real link/button to the overview, usable by keyboard.
- The canvas is decorative (`aria-hidden`); the name and subtitle exist as real text.

### 4.2 Overview: the yarn picker
- A flat (2D) page on the light background: the "bottom" the dive lands on.
- As you arrive, the yarn bundles fall onto the page (staggered, one per project) and reveal each project's content.
- **Layout: stacked rows**, one project per band. Left: the yarn bundle in the project's thread color, with line art. Right: the content.
- **Per project:** short project name (Display M, Geist Bold), short description (Body L), tools used as mono tags (Label/Mono in outlined pills), one hero image as an impression, and a "follow this thread →" link.
- **Hero image behind the text:** the image sits on the right; its left part fades into the background with a gradient and backdrop blur, and the text overlaps that faded area. The right part stays sharp. Text contrast must hold at least 4.5:1.
- **Line art: technical annotation style**, carrying real information where possible: a metadata block (year, role, duration) with a leader to the yarn, construction circles, crosshair and diameter dimension around the yarn, crop marks, a dimension line with caption and numbered callouts on the image, an index label ("01 / 05"), a ruler, and a dashed connector running through all bundles down the page. Line weight: **1.5 px**, in `border/strong`; leader dots 8 px.
- Choosing a project rolls its yarn out, and you follow that thread into the case study's scrollytelling.

### 4.3 Case study
- Told in **stages** (for example Context → Problem → Research → Exploration → Decisions → Build → Outcome). Stages can differ per project, but they're built from the same system.
- **Horizontal scrollytelling.** Choosing a project on the overview rolls its yarn out sideways, and the case study continues horizontally: you follow the thread to the right through the stages.
- Driven by normal scrolling: mouse wheel or trackpad down moves the story sideways (pinned track, see §6.1).
- Each stage is a panel (or group of panels). The project's thread runs horizontally through all of them. Content builds up as the thread passes: headlines, text, images, illustrations.
- Copy is written in short chunks per panel; long text blocks don't suit horizontal panels.
- **Theme:** the whole case study runs in the project's mode (tinted background, project-colored text and accents).
- **Thread:** the unrolled yarn (`thread/current`) runs behind the content through all panels, weaving under images and cards. Each stage has a numbered marker on the thread with a 1.5 px leader up to the stage label. The thread ends at the next project.
- **Panels (example set):** Intro (title, one-liner, tools, hero image fading behind the title) → Context → Problem (big "how might we" statement) → Research (insight cards) → Exploration (staggered sketches) → Decisions (option A vs B, chosen one marked) → Build (screenshot + code snippet) → Outcome (key numbers + reflection) → Next project.
- **Clothesline:** in stages with cards or sketches (e.g. Research, Exploration) the thread rises and runs along their tops; the items hang from it with small pegs, slightly rotated. The thread makes loops or knots at key moments (e.g. the problem statement, the outcome).
- **Technical layer, kept light:** only a few annotations that explain something (a trade-off, what was shipped, how a number was measured), in muted text. It supports the content and never competes with it.
- **Fixed UI:** the nav (§4.5) at the top and a **stage progress bar** at the bottom: stage names on a track, filled in the thread color up to the current stage, clickable to jump to a stage.
- SVG animations in the background react to scroll.
- Each project has its **own character**: colors, backgrounds, image treatment, possibly its own display font.
- Media: mainly text and images, optionally video.

### 4.3a Loose ends (playground)
- For fun side projects that don't warrant a full case study. In the thread metaphor: the loose ends that never became a ball of yarn.
- **Layout: scraps on a table.** Small cards scattered and slightly rotated, each with a loose piece of thread in a project color and a peg. A faint technical grid marks the "table".
- **Per item:** title, one line, a few tags, a link (demo, GitHub, specimen …), optional small image or GIF. No process story.
- **Zephir Flex** gets an entry here; the small easter egg on the about page stays as a second way in.
- **Overview teaser:** after the five projects, "…and some loose ends" with three scraps and a "see all loose ends →" link.
- Hover: a scrap straightens and lifts a little.

### 4.4 About
- A short intro about me is also part of the landing page text; the full version lives on `/about`, always linked in the nav.
- **Intro:** "hi, I'm Aaron", a few first-person sentences, and a portrait with crop marks and a small caption.
- **My thread:** my path told as a thread braided from all five project colors ("every project on this site started somewhere along here"). Stations are knots on the thread; years sit on the left with technical leaders, titles and one line each on the right: apprenticeship (2018), CLEO AG, Shipamax (London), AXA, trainer and examiner for apprentices, HF Interaction Design (2024).
- **What I learned:** three short learnings hanging on a braided clothesline.
- **Easter egg:** a small line "set in geist. also, I design type → zephir flex", linking to the typeface page.
- **Closing:** "let's talk" with a direct LinkedIn link ("say hi on LinkedIn ↗").

### 4.5 Navigation
- **Technical drawing style**, the same line language used for support lines that guide the eye.
- **Case study:** left a drawn arrow with "back to overview", center my full name, right "loose ends" and "about" links plus LinkedIn and GitHub as icons (official icons in code, e.g. Simple Icons). No divider line.
- **Overview:** left a drawn up-arrow with "back to start" (back up to the landing threads); center and right as above; a 1.5 px divider line under the nav.
- The "loose ends" and "about" links are always present in the nav.
- **Behavior:** hidden on the landing page until scrolling starts; hides when scrolling down and reappears when scrolling up.
- Just icons and text on the top edge of the screen. Behind them a soft backdrop: the page colour with a blur, solid at the top and fading to transparent at the nav's bottom edge, so scrolling content doesn't collide with the links.

---

## 5. Visual design

- **Mode:** light, except the landing page, which is dark charcoal (`bg/inverse`) and lightens to the shell background during the dive.
- **Shell:** neutral and clean, so each project's color and character can take over.
- **Accent:** there is no single site accent. The thread always carries a project color: all five colors on the landing page and overview, the chosen project's color inside a case study. The shell stays neutral. Final palette decided in design.
- **Typography:** bold, modern display type that stays legible, paired with a highly readable text face.
- **Zephir Flex:** my own lowercase-only variable typeface. Used **only in the easter egg** on the about page, which links to its page. Geist everywhere else.
- **Visuals:** mostly abstract (lines, shapes), made in Figma, plus project-specific visuals and plenty of project imagery.
- **Identity:** just my name, Aaron [Surname]. No studio name, no wordmark.
- **Voice:** first person ("I designed…"), clear and honest, not salesy.
- **References:**
  - buyckveth.nl: content building up as you scroll, like following a trail on a treasure map; simple, coherent illustration style.
  - hadaka.jp: the dramatic "dive in" opening and very well-crafted transitions (much more extreme than we'll go).
  - snowhouse.studio/year-in-review-2024: bold display type, lowercase headlines, discipline tags per project.
  - gsap.com: its horizontal scrolling section and scroll-driven feel (see §6.1).

---

## 6. Motion principles

- One signature depth moment (the dive through the threads). Everything else is scroll storytelling.
- Motion guides attention along the thread; it never blocks content.
- Smooth scrolling without hijacking: native scroll behavior, keyboard and scrollbar must keep working.
- Every animation has a reduced-motion equivalent (see §7).

### 6.1 Scroll directions (reference: gsap.com)
- **Landing and overview scroll vertically.**
- **Case studies scroll horizontally**, as one long pinned track: the page pins while vertical scroll input moves the panels sideways, like the horizontal section on gsap.com.
- **Scroll-linked (scrubbed):** all scroll animations are tied directly to scroll position, so they move forwards and backwards with the user and never play on their own.
- **Choreography:** text, images and the thread animate together as one sequence, not as isolated effects.
- **Implementation:** GSAP ScrollTrigger with `pin` and `scrub` for the track, and `containerAnimation` for animations inside the horizontal panels. Wrapped in reusable components usable in MDX (e.g. `<Track>`, `<Panel>`).
- **Keyboard:** arrow keys and Tab move through the panels; focusing an element scrolls its panel into view. DOM order stays logical.
- **Mobile and reduced motion:** panels stack vertically, no pinning, content in its final state.

---

### 6.2 Transitions (keyframes in Figma, "Transitions" section)
**Dive (landing → overview)**, scroll-driven:
1. Threads loaded: title and scroll hint visible.
2. ~30%: title and hint fade out fast; threads scale up from the center (camera moving forward); each thread stays fully visible until the camera gets close, then drops out quickly (within ~5% of the dive); the front threads go first (~35%), the farthest last (~90%).
3. ~70%: only a few huge, soft front threads left; background lightens toward `bg/default`.
4. 100%: background fully light; the five yarn bundles drop in staggered with a small bounce, settle into their rows and reveal the content.

**Unroll (overview → case study)**, on selecting a project. The thread always comes *from* the ball:
1. The chosen yarn gets focus; the rest of the overview fades.
2. The ball jumps across the page along an arc. As it moves, its thread unravels from it and stays behind. The background tints toward the project theme.
3. The ball lands in the lower half of the case study intro, smaller now, with its thread trailing back to where it came from. The intro content sits above it; the nav fades in.
4. While scrolling through the case study, the ball keeps rolling ahead and unravels the thread through the stages. It shrinks as it goes and is used up by the end.

### 6.3 Reverse behavior
- **Movement through space reverses** (scrubbed, tied to scroll position): the dive (scrolling up goes back up through the threads to the landing) and the case study thread (scrolling back rewinds it onto the ball).
- **Content reveals play once:** the landing threads drawing in, text and images building up, the yarn bundles falling onto the overview. Scrolling back shows them settled instead of animating them out and in again.
- **The unroll** is triggered by a click, not by scroll. Going back to the overview shows it settled; a quick "roll back up" can be added later if it feels missing.

## 7. Accessibility requirements

- Target **WCAG 2.2 AA**.
- `prefers-reduced-motion`: no dive, no scroll-driven reveals. The thread is shown already drawn and all content is visible immediately.
- The installation and the yarn picker are fully usable by keyboard, with visible focus states.
- Canvas content has text alternatives; nothing essential exists only inside a canvas.
- Focus is managed on route changes; the page title updates.
- All images have meaningful alt text; decorative visuals are hidden from assistive tech.
- Color contrast is checked per project theme, not just for the shell.

---

### 7.1 Components (Figma, design system page)
Tag · Text link · Social link (icon + label) · Scrap (loose ends item) · Icon/LinkedIn, Icon/GitHub (placeholders; official icons in code) · Peg · Stage marker · Yarn bundle (colored via `thread/current`, set the instance to a project mode) · Nav (Page = Case study / Overview) · Stage progress (Current = Intro … Outcome). These map to React components of the same names. The chosen concept designs use them as instances, so changes to a component update every page.

### 7.2 Interaction states
- **Links and nav items:** on hover a 1.5 px line draws in under the text from left to right (the technical line language) and retracts on leave.
- **Yarn bundles (overview):** on hover the ball rotates a little and its loose tail twitches, as if about to roll.
- **Focus (all interactive elements):** a 2 px dashed ring in `focus/ring`, with a small gap around yarn bundles. Always visible on keyboard focus (`:focus-visible`).
- In Figma: Text link and Social link have State = Default / Hover / Focus; Yarn bundle has State = Default / Focus.

## 8. Responsive

**Desktop first, mobile second.** Mobile must work fully, but the richest experience is designed for large screens. Mobile will be **significantly simplified**; the details are decided later.

---

## 9. Technical architecture

| Area | Choice |
|---|---|
| Build | Vite |
| Framework | React + TypeScript |
| Routing | React Router with clean URLs (GitHub Pages `404.html` redirect) |
| i18n | i18next + react-i18next from day one; English only at launch |
| Styling | SCSS modules per component + CSS custom properties for theming |
| Scroll | Lenis (smooth scroll) |
| Animation | GSAP + ScrollTrigger (DrawSVG for the thread, MorphSVG where useful) |
| Landing installation | Plain Canvas 2D with a `requestAnimationFrame` loop in a React component, fixed-step physics. Three.js only if 2D hits a real limit. |
| Content | MDX: one file per case study |
| Linting | ESLint 9 + `eslint-plugin-jsx-a11y` (the a11y plugin doesn't support ESLint 10 yet) |
| Hosting | GitHub Pages (static SPA), portable to other hosts later |

### 9.1 Project structure (draft)

```
src/
  app/            routing, layout, navigation
  pages/          Landing, Overview, About
  installation/   thread model + canvas wrapper
  thread/         the thread: SVG path, scroll logic
  components/     shared building blocks (Stage, ImageReveal, …)
  styles/         global SCSS, tokens, mixins
  projects/
    <project-slug>/
      index.mdx     the story
      meta.ts       title, slug, thread color, disciplines, order
      theme.scss    project theme (colors, fonts, backgrounds)
      components/   project-only components
      images/
```

### 9.2 Case studies in MDX

MDX is Markdown that can contain React components. The story is written as text, with components dropped in where needed:

```mdx
## Research
I started by interviewing five users…

<Stage>
  <ImageReveal src="./images/sketches.jpg" alt="Early paper sketches" />
</Stage>
```

Flexibility, from least to most custom:
1. Shared components configured with props and themed via CSS variables.
2. Project-only components, imported only by that case study.
3. Overriding how plain Markdown elements render per project (e.g. custom `h2`).
4. A per-project `theme.scss`.
5. Escape hatch: a project can be a plain `.tsx` page if MDX gets in the way.

Rule of thumb: keep the MDX readable. Layout-heavy sections become components.

### 9.3 Theming
Each project defines its tokens (thread color, background, text colors, display font) as CSS custom properties. Entering a project swaps the tokens; leaving restores the shell.

### 9.4 Internationalization
- All UI text (navigation, buttons, labels, landing text) lives in i18next translation files, never hard-coded in components.
- Case studies get one MDX file per language later (e.g. `index.en.mdx`, `index.de.mdx`).
- Launch language: English. German follows in a later pass.

### 9.5 Extras
- **Favicon:** a tiny yarn ball with a tail in `thread/project-1` red (SVG + PNG sizes, apple-touch-icon).
- **Share image:** 1200 × 630, based on the Figma cover: threads on charcoal, my name and the subtitle.
- **404:** "lost the thread", a tangled thread and a link back to the overview.

### 9.6 Performance
- The installation and any 3D code are loaded only on the landing page (code splitting).
- Images are optimized and lazy-loaded.
- Animations use transforms/opacity and respect reduced motion.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173/portfolio/
npm run build    # typecheck + production build
npm run lint
```

### Prototype status
- **Landing threads (`src/installation/`):** straight spun threads (6–10 per project color) on three depth layers, with draw-in, the same yarn look as the case-study thread (core, highlight, twist marks, two-tone hairs; decoration cached per thread and rebuilt only when its shape changes), pluck on pointer sweep and drag-and-release. Physics: Verlet string with tension on the displacement from the rest shape and a weak spring back.
- **Dive (`src/pages/Landing/`):** 400vh scroll section with a sticky viewport; scrubbed with GSAP ScrollTrigger (reverses on scroll up). Layers scale at different rates, threads stay fully visible and drop out quickly one by one, front to back by depth, background shifts from `bg/inverse` to `bg/default`, canvas blurs at the end. You scroll through the dive yourself. **One way:** once you're past its end, the intro is taken out of the page (the overview becomes the top), so you can't scroll back into it; "back to start" in the nav brings it back and plays the dive in reverse (2.6 s, input locked). The threads canvas pauses while hidden. The overview overlaps the last viewport of the dive and appears in place when it ends (no scrolling up), then its content draws in and the bundles fall. No backdrop blur behind the title and hint (tried, removed).
- **Overview (`src/pages/Overview/`):** built from Figma Overview v2 with placeholder content (`src/projects/projects.ts`): intro, five project rows and the loose-ends teaser, plus the Nav (Page=Overview). Each row is a technical drawing at the Figma geometry: index, facts (year/role/duration), rings, crosshair, diameter and ruler on the left; hero image (placeholder shapes in the project's colours) with crop marks, dimension line and callout on the right, its left part fading behind the content. A dashed thread connects the balls. The line art is SVG in `border/strong` (not the exported Figma images), so it follows the tokens and draws in. Reveal per row, once, after the dive arrives: the ball falls in with a bounce, the line art draws, the image slides in, the content fades up. Hover on a ball: it rolls a little and its loose tail twitches. The ball and the "follow this thread" link both start the unroll. Components: `Tag`, `TextLink` (underline draws in on hover/focus), `Nav` (both pages, hides while scrolling down), `Scrap`, `YarnPath` (static yarn for tails and loose ends).
- **Unroll (`src/unroll/`, `src/pages/CaseStudy/`, `src/thread/`):** clicking (or Enter on) a bundle fades the rest of the overview; an app-level overlay takes the ball, which jumps along an arc (rolling, ~1.1 s) while its SVG thread unravels behind it and the background tints to the project theme. The route changes to `/work/project-n` under the tint; the ball hops on landing and the thread settles into the case study's line, then the case study takes over (pixel-identical handoff) and reveals its intro and nav. In the case study, a pinned horizontal track (intro + 3 placeholder stages) moves sideways while you scroll; the ball rolls ahead along the bottom, shrinks and is used up by the end, stage markers appear as the thread reaches them. Scrubbed: scrolling back rewinds the thread onto the ball. "back to overview" returns to `/#work` with the overview settled. Reduced motion: plain navigation, stages stacked, ball and thread static on the intro.
- **Yarn look (`src/thread/`):** the SVG thread is layered: soft shadow, core, highlight, slanted ply marks (the twist) and two-tone hairs, placed by distance along the thread so they don't shimmer as it grows (`yarn.ts`, `YarnThread`). The ball is wound yarn: tilted great circles in dark and light strands with soft shading (`YarnBundle`). The thread comes out of the ball: in the air from its back (opposite to its travel); on the ground it lifts off just before the ball and enters it a little way up its back side, then tucks in behind it (`attachToBall`, `tuck` in `geometry.ts`).
- **New tokens:** `thread/twist` (`--thread-twist`, the hue's 700) and `thread/light` (`--thread-light`, the hue's 300) for the yarn's dark and light strands. Still need adding to the Figma Semantic collection.
- **About (`src/pages/About/`, content in `src/content/about.ts`):** built from the Figma About frame with placeholder text: intro with a portrait placeholder (crop marks, caption on a leader), "my thread" as a braid of the five project colours with six career stations (knot, year, leaders), learnings as cards hanging from a braided clothesline with pegs, the Zephir Flex easter egg and "let's talk" with a LinkedIn social link. The braid draws with the scroll (scrubbed); stations, cards and headers reveal once. Braids are generated in code (`src/thread/braid.ts`).
- **Loose ends (`src/pages/LooseEnds/`):** built from the Figma Loose ends frame: intro, eight scraps (some without an image) lying on a table with a faint grid of plus marks, each dropping in once as it scrolls in, and a link back to the overview. Items in `src/projects/projects.ts`.
- Tuning knobs live at the top of `threads.ts` (tension, spring, damping, draw duration, layer weights).
- Open: the GitHub Pages `404.html` redirect for clean URLs still needs adding before deploying.

## 10. Workflow

1. **Spec** (this README)
2. **Design** in Figma (page "concepting" for exploration; a separate final-design page later with real texts and images): concepts → key pages → prototype of the installation, dive, yarn picker and one case study
3. **Prototype early in code:** small canvas/GSAP prototypes for the landing threads and pluck physics, the dive, the yarn texture and the unroll, to tune the feel before the final design is finished
4. **Final design** on the Figma page "design" (sections: Landing, Overview, Case studies, About, Extras), built only from component instances, with real content
5. **Build**, section by section, starting with the shell and one full case study
6. **Content**: projects added one by one as they are ready
7. **Release**: see open questions

---

## 11. Open questions

- **Release / switchover:** only one site can live on GitHub Pages; how and when the new version replaces the current one.
- **Installation:** how the dive looks in detail; tuning of the pluck physics.
- **Yarn picker:** layout and unrolling interaction.
- **Palette:** final project colors once the projects are chosen (contrast check per theme mode).
- **Projects:** which 5 main projects (fewer if there aren't five strong ones), their stages, and which things go to loose ends.
- **German version:** timing.
- **Mobile:** how the simplified version looks; how much of the installation and dive to keep.

---

## 12. Decision log

| Date | Decision |
|---|---|
| 2026-09-25 | Portfolio first, for clients and employers; no sales language. Focus on process. |
| 2026-09-25 | 4–5 projects, quality over quantity. |
| 2026-09-25 | Fresh branch in the existing portfolio repo. |
| 2026-09-25 | English first, German later. |
| 2026-09-25 | React + TypeScript SPA on GitHub Pages; no CMS. |
| 2026-09-25 | Desktop first, mobile second. |
| 2026-09-25 | Identity: name only, first-person copy. |
| 2026-09-25 | Light mode, neutral shell, per-project themes. |
| 2026-09-25 | Literal red thread concept; yarn picker on the overview. |
| 2026-09-25 | Landing = interactive p5 installation on every visit; depth dive into a 2D overview. |
| 2026-09-25 | Case studies built in stages; MDX for content. |
| 2026-09-25 | Styling in SCSS; linting with ESLint + `eslint-plugin-jsx-a11y`. |
| 2026-09-25 | Accessibility target: WCAG 2.2 AA. |
| 2026-09-25 | Clean URLs via GitHub Pages `404.html` redirect. |
| 2026-09-25 | About: short intro on the landing page + separate `/about` page. |
| 2026-09-25 | i18next integrated from the start; English only at launch. |
| 2026-09-25 | Mobile significantly simplified; details later. |
| 2026-09-26 | Landing installation: five spun threads in project colors with guitar-string physics, layered in 3D, text on top; dive through the threads to the bottom (the overview), where the balls of yarn fall into place. |
| 2026-09-26 | The dive leads to the overview; you pick a project there. |
| 2026-09-26 | No red accent: the thread always carries project colors. |
| 2026-09-26 | Landing: dark charcoal background (reuses `bg/inverse`, no extra theme mode), 5–10 threads per project color, yarn texture, draw-in → title → scroll hint → scroll-driven dive that lightens the background. |
| 2026-09-26 | Dragging and plucking the threads stays part of the landing page (README only, not in Figma). |
| 2026-09-26 | Landing readability: feathered backdrop blur with charcoal tint behind title and scroll hint. Scroll hint copy: "scroll to untangle". |
| 2026-09-26 | Overview: stacked rows, technical line art, tools as mono tags, one hero image per project. |
| 2026-09-26 | Overview rows: hero image fades behind the text (gradient + backdrop blur); technical line art at 1.5 px. |
| 2026-09-26 | Case studies scroll horizontally (pinned track driven by vertical scroll input); landing and overview stay vertical. Mobile and reduced motion stack vertically. |
| 2026-09-26 | Case study: one wide horizontal strip, yarn thread with stage markers, full project theme, fixed stage progress bar. |
| 2026-09-26 | Nav: technical drawing style; back to overview / full name / LinkedIn + GitHub icons; hides on scroll down. Case study adds clothesline thread and a light technical layer. |
| 2026-09-26 | Nav: "about" link always on the right next to the icons; overview left slot is "back to start". About page stays (short text on what I did and learned). |
| 2026-09-26 | Contact page dropped; LinkedIn + GitHub live in the nav, CTAs point to the about page where it makes sense. |
| 2026-09-26 | About page: braided career thread, learnings on a clothesline, Zephir Flex easter egg. Transition keyframes for dive and unroll. First component set in Figma. |
| 2026-09-26 | Scrubbed movement reverses, content reveals play once. Unroll: the thread unravels from the jumping ball, which then leads the thread through the case study. Designs use component instances. |
| 2026-09-26 | Final design on one Figma page with sections. Hover: line draws in; yarn wobble + tail twitch; focus: dashed technical ring. Zephir Flex only in the easter egg. Prototype dive, pluck, texture and unroll in code early. Favicon, share image and 404 designed. |
| 2026-09-26 | Loose ends playground: own page (/loose-ends) as scraps on a table, teaser at the end of the overview, link in the nav; Zephir Flex gets an entry. Template stays at five main projects. |
| 2026-09-26 | Subtitle: "I design and build things :)". Name may be replaced by an After Effects animation. |
| 2026-09-26 | Design system: Geist + Geist Mono, warm gray shell, perfect fourth type scale, placeholder project hues (red, amber, teal, blue, violet). |
| 2026-09-26 | ~~Vertical scrolling only.~~ Superseded below. |
| 2026-09-25 | ~~Contact: LinkedIn + GitHub only, separate page.~~ Superseded 2026-09-26. |
| 2026-09-26 | Dropped p5.js: the landing draws with plain Canvas 2D and a rAF loop (easier to maintain, ~400 KB gzipped less). Thread physics tightened to feel like a guitar string: stiffer, faster ring, quick settle, grip slips past ~70 px. |
| 2026-09-26 | Landing threads are straight lines (edge to edge) instead of curves; about 20% more of them. During the dive they fade front to back by depth, so the farthest threads vanish last. |
| 2026-09-26 | Landing text blurs lighter (12 px, less tint) and fade in just after their text instead of being there from the start. The overview appears in place at the end of the dive instead of scrolling up. |
| 2026-09-26 | Trying the landing without any backdrop blur behind the title and hint. |
| 2026-09-26 | Dive fade: threads no longer fade gradually with scrolling. Each stays fully visible, then vanishes quickly when the camera is close (front ~35% → back ~90% of the dive). |
| 2026-09-26 | Threads stretch 20% further before slipping (84 px). Denser fuzz: hairs every ~5 px on the front layer and ~12 px on the middle, light and dark, with the odd longer stray. |
| 2026-09-27 | Unroll prototype: app-level overlay above the routes (survives navigation), SVG thread (core + dashed twist) so it can weave under/over DOM content, click-triggered jump into `/work/:slug`, then a scrubbed horizontal track where the ball leads and is used up. New token `thread/twist`. |
| 2026-09-27 | Case-study thread and ball look like yarn (ply twist, hairs, shadow; wound ball with shading). The thread peels off the ball's surface and wraps once across its front instead of ending at its centre. New token `thread/light`. |
| 2026-09-27 | Dropped the wrap on the ball; the thread enters the ball a little way up its back instead. Landing threads use the same yarn look as the case-study thread. The dive snaps: past a small threshold it auto-scrolls to the overview (and back to the start when scrolling up from the overview). |
| 2026-09-27 | Overview built from Figma (placeholder content in `src/projects/projects.ts`); line art rebuilt as token-driven SVG; LinkedIn/GitHub icons stay placeholders until the official marks are added. Nav hides while scrolling down. |
| 2026-09-27 | About and Loose ends pages built from Figma with placeholder content (`src/content/about.ts`, `src/projects/projects.ts`). Braids are generated in code; scrap links point to /loose-ends until the real items exist. |
| 2026-09-27 | Dive snap removed. The dive is one way: past its end the intro leaves the page and the overview becomes the top; only "back to start" goes back (plays the dive in reverse). |
| 2026-09-27 | Responsive pass: overview rows scale with the viewport from 1200 px up and stack below; About and Loose ends reflow (grid/flex). No sideways scrolling at any width. Nav hides as soon as you scroll down and returns on scroll up. Mobile design is still open; the stacked layouts are a working fallback. |
| 2026-09-27 | Nav gets a soft backdrop (page colour + blur, fading out towards its bottom edge) against overlap with scrolling content. |
| 2026-09-27 | Case studies: gather assets, design them in Figma first, then build and polish in code. |
