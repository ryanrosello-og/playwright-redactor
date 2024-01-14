import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
