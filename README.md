# 📺 Aaron's Portfolio

My portfolio, broadcast on a vintage CRT television. Every channel is one of
my projects — flip through them with the channel buttons on the set (or the
`←` `→` arrow keys), and "tune in live" to watch the hosted demos right on
the TV screen. Yes, the power knob works. Yes, there is static.

## Running it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Adding or removing a project

Edit `src/data/projects.ts` — one object per channel, in order. That's it.
Channel numbers renumber automatically. See `CLAUDE.md` for the full
contributor/agent documentation.

## Stack

React · TypeScript · Vite · SCSS — and nothing else.
