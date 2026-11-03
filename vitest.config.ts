import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      clean: true,
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
    },
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    mockReset: true,
    passWithNoTests: false,
    restoreMocks: true,
    watch: false,
  },
});
