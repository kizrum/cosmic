import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Fixed port: the VS Code launch configuration opens http://localhost:5173.
  server: { port: 5173, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
