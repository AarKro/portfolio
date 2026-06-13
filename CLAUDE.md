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
- `githubUrl` is required; `demoUrl`, `videoUrl` and `behindTheScenes` are optional.
- `demoUrl` (optional) is the hosted demo; it becomes the "OPEN DEMO ↗"
  new-tab link (there is no in-screen iframe — demos are never framed).
- `videoUrl` (optional) gives the channel a short teaser clip that autoplays
  (muted, looping) full-bleed as the program backdrop. Import the file
  from `../assets` so Vite bundles + fingerprints it (`import clip from
  '../assets/foo.mp4'; … videoUrl: clip`), don't hand-write a path. Compress
  before adding (see "Adding a teaser clip").
- `behindTheScenes` (optional): one sentence on the interesting technical or
  design decision — written for hiring managers. Must be factually grounded
  in the repo (check its README/package.json), never invented. Shown on the
  teletext page (see below), not on the front bug.
- **Every project channel shares one "broadcast" layout** (so channels look
  like one consistent building block): a full-bleed *backdrop* — the `videoUrl`
  teaser, or a full-bleed SMPTE test card ("NO LIVE FEED ON THIS CHANNEL") when
  there's none — with a lower-third *bug* over it (CH · NOW SHOWING, title, tech
  tags, action links, and a `▤ TELETEXT` button). The `description` +
  `behindTheScenes` live on a **teletext page** that slides up over the bug when
  TELETEXT is pressed. So those two fields are revealed on demand on *all*
  channels, not shown up front. The teletext page repeats the source/demo links
  in a bottom row that mirrors the bug's action row — same screen position in
  both states, so the links don't jump; only the toggle morphs `▤ TELETEXT` ↔
  `▾ CLOSE TELETEXT`. Teletext has its own colour voice — `$phosphor-purple`
  (the TELETEXT/CLOSE buttons, the teletext header rule, the BEHIND THE SCENES
  label) — to set it apart from the green broadcast UI and the neutral
  external-link buttons.
- Write `description` like a TV program blurb: one short paragraph, a bit of
  personality.

## Adding a teaser clip

Clips live in `src/assets/*.mp4` (imported, bundled, fingerprinted — not in
`public/`). Always compress before committing — raw screen recordings are
huge (the source for Scholar's Mate was 2360×1594 @ 120fps, 9.7 MB; the
shipped clip is 1066×720 @ 30fps, no audio, 1.3 MB). Recipe with ffmpeg:

```
ffmpeg -i raw.mov -vf "scale=-2:720,fps=30" -c:v libx264 -preset slow \
  -crf 28 -profile:v high -pix_fmt yuv420p -movflags +faststart -an out.mp4
```

`-an` strips audio (clips play muted — see behaviour notes), `+faststart`
lets it start before fully downloaded, 720p is plenty for the small CRT
screen. Drop `crf` toward 30 / `scale` to 540 for an even smaller file.

## Architecture

```
src/
  data/projects.ts          ← content (see above)
  hooks/useTV.ts            ← all TV behavior: channel state, static burst,
                              OSD timing, power, URL hash sync (#ch-N)
  components/               ← one folder per component: Name/Name.tsx + Name.scss
    Scene/                  ← THE view: 3D room + camera + the DOM TV in 3D
      Scene.tsx             ← WebGL+CSS3D renderers, pointer lock, WASD,
                              camera flights, DOM↔world size sync
      buildRoom.ts          ← WebGL geometry (placeholder primitives,
                              to be replaced by a GLTF model later)
    TVSet/                  ← the DOM TV (cabinet, screen, controls, antenna,
                              feet) at a FIXED 920px design size; binds ← →
                              arrow keys; reports power-off (onPoweredOff)
    Screen/                 ← CRT tube: picks the program, layers noise/OSD/
                              scanlines/vignette/glare on top
    ControlPanel/           ← physical buttons strip (CH ▼/▲, power, decor)
    StaticNoise/            ← canvas noise; animates only while `active`
    programs/IntroProgram/      ← channel 1 (intro + clickable TV guide)
    programs/ProjectProgram/    ← project channels: one "broadcast" layout
                                  (teaser-or-testcard backdrop + bug +
                                  slide-up teletext page)
  utils/noise.ts            ← static-noise pixel fill (used by StaticNoise)
  styles/_tokens.scss       ← ALL colors and fonts; theme changes happen here
  styles/global.scss        ← reset + base
```

## One scene, one TV (the core architecture)

There is no separate "2D site" — the whole page is a single three.js scene.
The DOM TV (`TVSet`, fully interactive React: buttons, programs) is
placed in 3D space with **CSS3DRenderer** as the front face of the WebGL TV
body. "Website mode" is just the camera parked in front of the TV.

`App.tsx` tracks the camera as a mode machine: `tv → to-room → room → to-tv
→ tv`. Powering off plays the CRT collapse, then the camera pulls back
(seamless — it's literally the same TV). **Pointer lock is requested at the
start of that pull-back** (the PWR click's user activation is still fresh),
so mouselook is already live when the flight lands — no extra click. In the
room: WASD walking, ambient control hints in the lower corners (WASD keycaps
left, mouse glyph right — iconic only, no explainer text by design), ESC
frees the mouse and any click re-locks it; clicking the TV (within 4m,
crosshair turns amber) flies the camera back to the website framing, where
the TV sits in standby (PWR resumes).

Things to know:
- **`Scene.tsx` syncs the 3D world to the DOM** (`syncWorldToDOM`): it
  measures the TVSet element, scales/positions the WebGL body box behind
  the cabinet, and computes the closeup camera framing (cabinet fills
  FIT_HEIGHT/FIT_WIDTH of the viewport). Runs on resize and via a
  ResizeObserver (fonts loading shift the layout). `WORLD_PER_PX` in
  buildRoom.ts maps the 920px cabinet to ~1.1m — if the cabinet's CSS width
  changes, change WORLD_PER_PX with it.
- **TVSet must stay fixed-size** (920px cabinet, no viewport units for its
  width) — apparent size is controlled by camera distance, not CSS.
- TVSet renders into a detached host div via `createPortal`; CSS3DRenderer
  adopts that div. Pointer events on it are enabled only in `tv` mode.
- **`buildRoom.ts` is placeholder geometry by design**, to be swapped for a
  GLTF model later. Outside code relies only on its exports
  ({ tvGroup, tvBody }, BOUNDS, STANDING_SPOT, STAND_TOP_Y, TV_FRONT_Z,
  WORLD_PER_PX, EYE_HEIGHT, CLOSEUP_FOV, WALKING_FOV) — a GLTF version
  must keep that contract. The TV body has no front face: the DOM is the
  front face.
- Camera flights lerp position/quaternion/FOV (CLOSEUP_FOV 55° ↔
  WALKING_FOV 70°); durations at the top of Scene.tsx; the CRT collapse
  handoff is POWER_OFF_DELAY (700ms) in TVSet.tsx.
- three.js is in the main bundle now (~200 kB gz total) — it can't be
  lazy-loaded since the scene IS the page.
- Walkable area is clamped to `BOUNDS` (no collision with furniture yet).
- Known CSS3D limitation: the DOM TV ignores WebGL depth, so meshes between
  the camera and the TV won't occlude it (mostly invisible in practice;
  `backface-visibility: hidden` handles viewing from behind).
- **No CSS `border` on rounded elements inside the TV.** Under the CSS3D
  3D transform, Chrome renders border + border-radius with square corner
  artifacts ("little squares" at the corners). Use box-shadow or background
  layers for edge definition instead. (Found by Aaron in devtools, June
  2026 — cabinet/button/antenna borders were removed for this reason.)

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
- A `videoUrl` channel autoplays its teaser the moment you land on it. The clip
  stays covered by static until the `<video>` fires `playing` (6s safety
  timeout), so there's no black-frame flash. The video is
  `muted loop autoplay playsInline` — muted is mandatory for browsers to allow
  autoplay (and teasers have no audio anyway). Don't drop those attributes.
- The `▤ TELETEXT` button reveals the detailed info. The bug and the teletext
  page are two stacked pages in a `program__deck-track` (200% tall); toggling
  `is-teletext` slides the track up by one page (CSS transform, ~520ms), so the
  bug scrolls up and the teletext page scrolls into view. The CLOSE button uses
  a `▾` glyph because closing slides the page back *down*. Teletext closes on
  that button and resets on channel change.
- There is **no in-screen live demo / iframe** — that feature was removed.
  Demos are external new-tab links only (`demoUrl` → "OPEN DEMO ↗").
- Decorative CRT layers (scanlines/vignette/glare) are `pointer-events: none`
  and sit *above* the program so the teaser still looks like a broadcast.
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
