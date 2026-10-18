import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/gpu-roi/ once Pages is enabled; override with BASE=/ for local previews.
export default defineConfig({
  base: process.env.BASE ?? '/gpu-roi/',
  plugins: [react()],
  server: { fs: { allow: ['../..'] } },
  build: { chunkSizeWarningLimit: 900 },
});
