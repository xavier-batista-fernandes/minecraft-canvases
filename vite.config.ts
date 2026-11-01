import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the built site works from any path (GitHub Pages, a subfolder, or file hosting).
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
