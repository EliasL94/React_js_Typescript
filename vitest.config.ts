/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      // json-summary alimente le récapitulatif affiché par la CI ; html est le
      // rapport consultable, publié en artefact à chaque exécution.
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/setupTests.ts'],
      thresholds: {
        lines: 60,
        'src/domain/**': {
          lines: 90,
          branches: 90,
        },
      },
    },
  },
});
