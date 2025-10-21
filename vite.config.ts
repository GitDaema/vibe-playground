/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@physics': '/src/physics',
      '@core': '/src/core',
      '@dsl-physics': '/src/dsl-physics',
      '@nlu': '/src/nlu',
      '@ai': '/src/ai',
      '@schemas': '/src/schemas',
      '@ui': '/src/ui',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});