import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 独立于 vite.config.ts（其 root 指向 template 目录）
  test: {
    include: ['__tests__/**/*.spec.ts'],
  },
});
