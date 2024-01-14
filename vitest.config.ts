import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/build/**'],
    reporters: ['html'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
