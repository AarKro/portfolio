# Aaron's Portfolio — Retro TV

A portfolio site styled as a vintage CRT television. Every "channel" is one of
Aaron's GitHub projects (github.com/AarKro); channel 1 is the intro program.
Desktop-first; mobile only needs to not break.

## Commands

- `npm run dev` — dev server
- `npm run build` — typecheck (`tsc -b`) + production build
- `npm run preview` — serve the build

## Stack

React 19 + TypeScript + Vite + SCSS. No router, no state library, no other
runtime dependencies — keep it that way unless there is a strong reason.

## The one file that matters for content

`src/data/projects.ts` — array of `Project` objects, one per channel, in
broadcast order. **Adding/removing/reordering a project means editing only
this file.** Channel numbers are derived from array position (projects start
at channel 2), so they renumber automatically.

Per project:
- `githubUrl` is required; `demoUrl` (new-tab link) and `embedUrl` are optional.
- `embedUrl` enables the "TUNE IN LIVE" button, which renders the demo in an
  iframe inside the TV screen. Only set it for URLs that allow framing
  (GitHub Pages and Netlify do). Verify with a quick manual check before adding.
- Write `description` like a TV program blurb: one short paragraph, a bit of
  personality.

## Architecture

```
src/
  data/projects.ts          ← content (see above)
  hooks/useTV.ts            ← all TV behavior: channel state, static burst,
                              OSD timing, power, URL hash sync (#ch-N)
  components/
    TVSet.tsx               ← cabinet, antenna, feet; binds ← → arrow keys
    Screen.tsx              ← CRT tube: picks the program, layers noise/OSD/
                              scanlines/vignette/glare on top
    ControlPanel.tsx        ← physical buttons strip (CH ▼/▲, power, decor)
    StaticNoise.tsx         ← canvas noise; animates only while `active`
    programs/IntroProgram.tsx    ← channel 1 (intro + clickable TV guide)
    programs/ProjectProgram.tsx  ← project channels (info card / live iframe)
  styles/_tokens.scss       ← ALL colors and fonts; theme changes happen here
  styles/global.scss        ← reset + base
```

Each component has a sibling `.scss` file with the same name, BEM-style class
names, importing tokens via `@use '../styles/tokens' as *;`.

## How the TV behaves (don't accidentally break these)

- Channel switching swaps content instantly and covers it with a ~450ms
  static noise burst (real TVs work this way; it also makes rapid button
  mashing safe). Timings live as constants at the top of `useTV.ts`.
- A green `CH 05` OSD shows for 2s after every switch.
- Power off plays a CRT collapse animation (`tv-off` keyframes in
  `Screen.scss`) and disables the channel buttons; power on bursts static.
- Current channel is mirrored to the URL hash (`#ch-5`), read once on load,
  so channels are shareable links.
- Leaving a channel always exits "tuned in" iframe mode.
- Decorative CRT layers (scanlines/vignette/glare) are `pointer-events: none`
  and sit *above* the iframe so embedded demos still look like a broadcast.

## Conventions

- Keep it simple: no new dependencies for things CSS/canvas can do.
- All colors/fonts come from `src/styles/_tokens.scss` — never hardcode them
  in component styles.
- Fonts: VT323 for everything on the screen, Bungee only for the cabinet
  brand badge. Loaded from Google Fonts in `index.html`.
- `vite.config.ts` uses `base: './'` so the build deploys to any subpath
  (e.g. GitHub Pages) without changes.
