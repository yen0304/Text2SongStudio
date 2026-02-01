import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/**/test-utils/**',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
        // Type definitions only - no runtime code
        'src/lib/api/types/**',
        // Re-export barrels - no logic
        'src/lib/api/index.ts',
        'src/hooks/index.ts',
        'src/lib/api.ts',
        'src/**/index.ts',
        // Constants - no runtime logic
        'src/lib/constants/**',
        // shadcn/ui generated components - third-party code
        'src/components/ui/checkbox.tsx',
        'src/components/ui/progress.tsx',
        'src/components/ui/tooltip.tsx',
        // Complex UI components with minimal business logic
        'src/components/ModelSwitchingModal.tsx',
        'src/components/PromptSearchBar.tsx',
        // Adapter config components - pure UI forms
        'src/components/adapters/AdapterConfigTab.tsx',
        'src/components/adapters/ConfigFormItem.tsx',
        'src/components/adapters/ConfigItem.tsx',
        'src/components/adapters/ConfigCard.tsx',
        // Experiment config forms - complex UI only
        'src/components/experiments/**',
        // Lazy loading wrappers - thin UI wrappers
        'src/components/lazy/**',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 70,
          functions: 75,
          lines: 80,
        },
      },
    },
  },
});
