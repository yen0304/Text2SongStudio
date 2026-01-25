# Design: Front-End Testing Infrastructure

## Overview
This document outlines the technical architecture for the front-end testing infrastructure.

## Technology Choices

### Test Runner: Vitest
**Rationale:**
- Native ESM support (aligns with Next.js 14)
- Jest-compatible API (familiar patterns)
- Fast watch mode with HMR
- Built-in coverage via v8/istanbul
- First-class TypeScript support

**Alternatives Considered:**
- Jest: Requires additional ESM configuration, slower
- Testing Library's built-in: Less ecosystem support

### Testing Library: @testing-library/react
**Rationale:**
- Project convention (see `openspec/project.md`)
- Encourages testing behavior over implementation
- Good async utilities for data fetching
- Accessible queries by default

## Architecture

### Directory Structure
```
frontend/
├── vitest.config.ts
├── vitest.setup.ts
├── src/
│   ├── __mocks__/
│   │   ├── api.ts              # API mock factory
│   │   ├── next-navigation.ts  # Next.js router mocks
│   │   └── handlers.ts         # MSW handlers (optional)
│   ├── __tests__/
│   │   ├── lib/
│   │   │   └── utils.test.ts
│   │   │   └── api.test.ts
│   │   ├── hooks/
│   │   │   └── useAdapters.test.tsx
│   │   │   └── useDatasets.test.tsx
│   │   │   └── useFeedbackStats.test.tsx
│   │   └── components/
│   │       ├── ui/
│   │       │   ├── button.test.tsx
│   │       │   ├── card.test.tsx
│   │       │   ├── input.test.tsx
│   │       │   └── ...
│   │       ├── layout/
│   │       │   └── Sidebar.test.tsx
│   │       ├── FeedbackPanel.test.tsx
│   │       ├── PromptEditor.test.tsx
│   │       └── AudioPlayer.test.tsx
│   └── test-utils/
│       └── index.tsx           # Custom render with providers
```

### Test Categories

#### 1. Unit Tests (lib/, utils)
Pure function tests, no React involved.
```typescript
// Example: utils.test.ts
describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
});
```

#### 2. Hook Tests (hooks/)
Test hooks in isolation using `renderHook`.
```typescript
// Example: useAdapters.test.tsx
describe('useAdapters', () => {
  it('fetches adapters on mount', async () => {
    const { result } = renderHook(() => useAdapters());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.adapters).toHaveLength(2);
  });
});
```

#### 3. Component Tests (components/)
Test user interactions and rendered output.
```typescript
// Example: Button.test.tsx
describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Mocking Strategy

### API Mocking
Create a mock factory that mirrors the `api` object structure:
```typescript
// __mocks__/api.ts
export const mockApi = {
  listAdapters: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getAdapter: vi.fn(),
  // ... other methods
};

vi.mock('@/lib/api', () => ({
  api: mockApi,
}));
```

### Next.js Navigation
Mock `next/navigation` hooks:
```typescript
// __mocks__/next-navigation.ts
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));

export const usePathname = vi.fn(() => '/');
export const useSearchParams = vi.fn(() => new URLSearchParams());
```

### Custom Render
Wrap components with necessary providers:
```typescript
// test-utils/index.tsx
function AllProviders({ children }: { children: React.ReactNode }) {
  return children; // Add providers as needed
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: AllProviders });
}
```

## Coverage Strategy

### Target: 50%+ Overall Coverage
Prioritization based on risk and complexity:

| Priority | Category | Target | Files |
|----------|----------|--------|-------|
| High | Utilities | 100% | `lib/utils.ts` |
| High | Hooks | 80% | `hooks/*.ts` |
| High | UI Components | 70% | `components/ui/*.tsx` |
| Medium | Feature Components | 50% | `FeedbackPanel`, `PromptEditor` |
| Medium | Layout | 50% | `Sidebar`, `PageHeader` |
| Low | Pages | 30% | App router pages |

### Coverage Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          statements: 50,
          branches: 50,
          functions: 50,
          lines: 50,
        },
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**', 'src/**/__mocks__/**'],
    },
  },
});
```

## Configuration Details

### Vitest Config
```typescript
// vitest.config.ts
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
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Setup File
```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => require('./__mocks__/next-navigation'));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Trade-offs

### Vitest vs Jest
| Aspect | Vitest | Jest |
|--------|--------|------|
| Speed | ✅ Faster | Slower |
| ESM | ✅ Native | Requires config |
| Ecosystem | Growing | ✅ Mature |
| Snapshot | ✅ Supported | ✅ Supported |

**Decision:** Vitest for speed and ESM support.

### MSW vs Manual Mocks
| Aspect | MSW | Manual Mocks |
|--------|-----|--------------|
| Setup | Complex | ✅ Simple |
| Realism | ✅ Network-level | Function-level |
| Maintenance | Higher | ✅ Lower |

**Decision:** Start with manual mocks, add MSW if needed for integration tests.

## Future Considerations
- Add MSW for integration-level API mocking
- Add Playwright for E2E tests (separate proposal)
- Add visual regression tests with Percy/Chromatic
- Add Storybook for component documentation
