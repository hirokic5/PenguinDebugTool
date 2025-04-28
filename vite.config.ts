import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 52260,
    host: '0.0.0.0',
    cors: true,
    hmr: {
      overlay: true, // Enable error overlay
    },
  },
  base: '/',
  logLevel: 'info', // Options: 'info', 'warn', 'error', 'silent'
  clearScreen: false, // Prevent clearing console
  build: {
    sourcemap: true, // Enable sourcemaps
  },
});
