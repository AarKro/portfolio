import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /portfolio/. Clean URLs need an absolute
// base (relative './' breaks nested routes). Override with BASE_PATH when
// deploying somewhere else, e.g. BASE_PATH=/ npm run build.
const base = process.env.BASE_PATH ?? '/portfolio/';

export default defineConfig({
  base,
  plugins: [react()],
});
