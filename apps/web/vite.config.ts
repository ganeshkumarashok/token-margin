import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/token-margin/ once Pages is enabled; override with BASE=/ for local previews.
export default defineConfig({
  base: process.env.BASE ?? '/token-margin/',
  plugins: [react()],
  server: { fs: { allow: ['../..'] } },
  build: { chunkSizeWarningLimit: 900 },
});
