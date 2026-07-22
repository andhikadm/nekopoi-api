import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Runs before each test file is loaded (critical for File polyfill on Node 18).
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    pool: 'forks',
  },
});
