import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // config options
  root: path.resolve(import.meta.dirname, 'template'),
  define: {
    VERSION: JSON.stringify(pkg.version),
  },
  plugins: [
    vue({
      script: {
        fs: {
          fileExists: (file: string): boolean => existsSync(file),
          readFile: (file: string): string => readFileSync(file, 'utf-8'),
        },
      },
    }),
  ],
  envDir: path.resolve(import.meta.dirname),
  envPrefix: ['VITE_', 'SERVERURL'],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
    },
  },
});
