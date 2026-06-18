import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  // svgr lets us import `*.svg?react` as React components (icons in src/assets/icons)
  plugins: [react(), svgr()],
  // relative base so the build works on GitHub Pages or any subpath
  base: './',
  build: {
    // the bundle carries three.js (the whole site is one 3D scene)
    chunkSizeWarningLimit: 800,
  },
});
