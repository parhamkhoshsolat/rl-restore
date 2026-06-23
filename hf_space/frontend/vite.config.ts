import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build emits to ./dist; the FastAPI backend mounts StaticFiles(dist, html=True)
// LAST (after /api). `base: './'` makes asset URLs relative so the SPA works no
// matter what path the HF Space serves it under. The dev proxy forwards /api to
// the local backend on :7860 (same origin in prod, no CORS needed).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7860',
        changeOrigin: true,
      },
    },
  },
});
