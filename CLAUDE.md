# Aaron's Portfolio — Retro TV

A portfolio site styled as a vintage CRT television. Every "channel" is one of
Aaron's GitHub projects (github.com/AarKro); channel 1 is the intro program.
Desktop-first; mobile only needs to not break.

## Commands

- `npm run dev` — dev server
- `npm run build` — typecheck (`tsc -b`) + production build
- `npm run preview` — serve the build

## Stack

React 19 + TypeScript + Vite + SCSS, plus **three.js** (the only other
runtime dependency, used exclusively by the lazy-loaded 3D room). No router,
no state library — keep it that way unless there is a strong reason.

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
- `behindTheScenes` (optional): one sentence on the interesting technical or
  design decision — written for hiring managers. Must be factually grounded
  in the repo (check its README/package.json), never invented.
- Projects *without* `embedUrl` automatically get an SMPTE test-card graphic
  ("no live feed on this channel") so they don't look flat next to live ones.
- Write `description` like a TV program blurb: one short paragraph, a bit of
  personality.

## Architecture

```
src/
  data/projects.ts          ← content (see above)
  hooks/useTV.ts            ← all TV behavior: channel state, static burst,
                              OSD timing, power, URL hash sync (#ch-N)
  components/               ← one folder per component: Name/Name.tsx + Name.scss
    TVSet/                  ← cabinet, antenna, feet; binds ← → arrow keys;
                              reports power-off to App (onPoweredOff)
    Screen/                 ← CRT tube: picks the program, layers noise/OSD/
                              scanlines/vignette/glare on top
    ControlPanel/           ← physical buttons strip (CH ▼/▲, power, decor)
    StaticNoise/            ← canvas noise; animates only while `active`
    Room3D/                 ← lazy-loaded first-person 3D living room
      Room3D.tsx            ← renderer, pointer lock, WASD, zoom flights
      buildRoom.ts          ← ALL scene geometry (placeholder primitives,
                              to be replaced by a GLTF model later)
    programs/IntroProgram/      ← channel 1 (intro + clickable TV guide)
    programs/ProjectProgram/    ← project channels (info card / live iframe)
  utils/noise.ts            ← shared static-noise pixel fill (2D + 3D screens)
  styles/_tokens.scss       ← ALL colors and fonts; theme changes happen here
  styles/global.scss        ← reset + base
```

## The 3D room (power-off easter egg)

`App.tsx` runs a view-mode state machine: `tv → to-room → room → to-tv → tv`.
Powering the TV off plays the CRT collapse, then the 2D layer shrinks/fades
(`tv-depart` animation) while the 3D camera pulls back from the 3D TV's
glass — revealing the visitor was "sitting" in a living room. Pointer-lock
mouselook + WASD walking; clicking the 3D TV (within 4m reach, crosshair
turns amber) flies the camera back into the glass and remounts the 2D TV in
standby (PWR turns it back on).

Things to know:
- `Room3D` is lazy-loaded (`React.lazy`) so three.js (~132 kB gz) never
  blocks the portfolio's first paint; the chunk is prefetched in an idle
  effect. Keep three.js imports out of eagerly-loaded modules.
- **`buildRoom.ts` is placeholder geometry by design.** The plan is to swap
  it for an imported GLTF model. Everything outside that file depends only
  on its exports ({ tvGroup, screenMesh }, BOUNDS, STANDING_SPOT,
  TV_SCREEN_CENTER, EYE_HEIGHT) — a GLTF version must keep that contract.
- The 3D TV screen plays the same `fillNoise()` static as the 2D screen,
  via a CanvasTexture updated every other frame.
- **The zoom is a matched-frame crossfade, not a morph.** The 3D TV mirrors
  the 2D set's design (4:3 screen, cream control strip, feet, antenna), and
  the camera starts/ends at `CLOSEUP_POSITION` looking at `TV_FRAME_TARGET`
  (buildRoom.ts) — a framing computed so the 3D cabinet has the same
  apparent size as the 2D TV. The camera *holds* that framing for
  `ENTER_HOLD` (0.55s) while the DOM layer fades (0.5s `tv-depart`), then
  pulls back with an FOV ramp (CLOSEUP_FOV 55° → WALKING_FOV 70°). The 2D
  fades must stay pure opacity (no scaling) and shorter than ENTER_HOLD,
  and resizing the 3D TV means recomputing CLOSEUP_POSITION (see comment).
- Transition timings: pull-back 1.9s / fly-in 1.15s (Room3D.tsx), 2D fades
  0.5s/0.45s (App.scss), CRT collapse handoff 700ms (POWER_OFF_DELAY,
  TVSet.tsx). Tune them together.
- Walkable area is clamped to `BOUNDS` (no collision with furniture yet).

Each component lives in its own folder bundling its `.tsx` and `.scss` (same
name as the folder, no barrel `index.ts` files), BEM-style class names,
importing tokens via a relative `@use '../../styles/tokens' as *;`.

## How the TV behaves (don't accidentally break these)

- Channel switching swaps content instantly and covers it with a ~450ms
  static noise burst (real TVs work this way; it also makes rapid button
  mashing safe). Timings live as constants at the top of `useTV.ts`.
- A green `CH 05` OSD shows for 2s after every switch.
- Power off plays a CRT collapse animation (`tv-off` keyframes in
  `Screen.scss`) and disables the channel buttons; power on bursts static.
  After ~2s off, a faint "PRESS PWR TO RESUME BROADCAST" hint fades in, and
  the panel LED turns red (green while on) so the site never looks broken.
- Current channel is mirrored to the URL hash (`#ch-5`), read once on load,
  so channels are shareable links. Deep-linked visitors (initial channel ≠ 1)
  get a one-time arrow-keys hint on screen for ~6s.
- `document.title` mirrors the broadcast ("CH 03 · WoW Graveyard 3D — Aaron
  Kromer"; "Standby — …" when off).
- Tuning in/out of a live demo fires the same static burst as a channel
  switch (`tv.staticBurst`), and the iframe stays covered in noise until its
  `load` event (6s safety timeout).
- The live-demo iframe carries `allow="camera; microphone; fullscreen;
  xr-spatial-tracking"` — Wine Me's webcam and A-Frame VR need it. Don't drop it.
- Leaving a channel always exits "tuned in" iframe mode.
- Decorative CRT layers (scanlines/vignette/glare) are `pointer-events: none`
  and sit *above* the iframe so embedded demos still look like a broadcast.
- The intro channel greets by time of day (morning/afternoon/evening/up-late)
  — `broadcastSlot()` in `IntroProgram.tsx`.

## Conventions

- Keep it simple: no new dependencies for things CSS/canvas can do.
- All colors/fonts come from `src/styles/_tokens.scss` — never hardcode them
  in component styles.
- Fonts: VT323 for everything on the screen, Bungee only for the cabinet
  brand badge. Loaded from Google Fonts in `index.html`.
- `vite.config.ts` uses `base: './'` so the build deploys to any subpath
  (e.g. GitHub Pages) without changes.

## SEO

Aaron shares his name with a well-known American football coach, so the site
is optimized to win **qualified** queries ("aaron kromer developer / frontend
/ portfolio / zürich") and to register as a distinct entity with search
engines — not to outrank ESPN for the bare name.

- `index.html` holds the SEO title ("Aaron Kromer — Frontend Developer &
  Interaction Designer, Zürich"), keyword-rich meta description, canonical
  URL, and two JSON-LD blocks: a `Person` (with `disambiguatingDescription`,
  `sameAs` GitHub/LinkedIn, Zürich address) and a `WebSite`. Keep the runtime
  default `document.title` in `Screen.tsx` in sync with the HTML title.
- `App.tsx` renders an `.sr-only` crawlable section generated from
  `projects.ts` — project channels are only reachable by interaction, which
  crawlers don't do. It must mirror on-screen content only (no extra
  keywords), otherwise it risks being treated as cloaking.
- `public/robots.txt` + `public/sitemap.xml` — bump the sitemap `lastmod`
  on significant content changes.
- A `<noscript>` fallback with name/title/links lives in `index.html`.
- The strongest levers are off-site and belong to Aaron: GitHub profile
  name/bio/website field, LinkedIn website link, repo About-links back to
  the portfolio, and Google Search Console registration.

## Deployment & social previews

- Auto-deploy: `.github/workflows/deploy.yml` builds and publishes to GitHub
  Pages on every push to `main` (Pages source must be set to "GitHub Actions"
  in the repo settings — one-time manual step).
- Canonical URL: https://aarkro.github.io/portfolio/ — hardcoded (absolute,
  as required) in the `og:url` / `og:image` meta tags in `index.html`.
  Update those if the domain ever changes.
- `public/og-image.png` (1200×630) is a screenshot of the intro channel.
  Regenerate after visual changes: build + preview, then capture at 1800×945
  with headless Chrome, center-crop to 1560×819 and resize to 1200×630
  (`sips -c 819 1560 og-image.png && sips -z 630 1200 og-image.png`).
- `public/favicon.svg` is a hand-drawn mini TV matching the site's palette.
