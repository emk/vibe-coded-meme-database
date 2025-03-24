// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/{api,services}/**/*.test.ts'],
    // Remove the custom runner
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/**/*.ts',
      ],
      exclude: [
        'src/scripts/**/*.ts',
        'src/migrations/**/*.ts',
        'src/index.ts',
        'src/client/**/*.ts',
        'src/client/**/*.tsx',
      ],
    },
    setupFiles: ['test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});