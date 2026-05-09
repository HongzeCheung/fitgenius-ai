import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Vitest 2 内置的 Vite 5 类型与项目 Vite 6 的 Plugin 类型不兼容
  // @ts-expect-error — @vitejs/plugin-react 与 vitest 的 defineConfig 的 plugins 字段类型冲突
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'vite.config.ts',
        'vitest.config.ts'
      ],
      thresholds: {
        lines: 10,
        functions: 15,
        branches: 50,
        statements: 10
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@services': path.resolve(__dirname, './services')
    }
  }
});
