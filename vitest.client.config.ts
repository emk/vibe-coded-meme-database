// vitest.client.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/client/**/*.test.{ts,tsx}'],
    // Remove the custom runner
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/client/src/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/client/src/main.tsx',
        'src/client/src/vite-env.d.ts',
      ],
    },
    setupFiles: ['test/client/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});