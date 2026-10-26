import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from the root of its own (sub)domain; set BASE to serve it under a path.
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react()],
  server: { fs: { allow: ['../..'] } },
  build: { chunkSizeWarningLimit: 900 },
});
