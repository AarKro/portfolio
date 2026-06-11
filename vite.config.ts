import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative base so the build works on GitHub Pages or any subpath
  base: './',
  build: {
    // the lazy-loaded Room3D chunk carries three.js and is expected to be big
    chunkSizeWarningLimit: 600,
  },
});
