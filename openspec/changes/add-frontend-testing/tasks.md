# Tasks: Add Front-End Testing Infrastructure

## Phase 1: Setup Testing Infrastructure

- [x] **1.1** Install test dependencies (vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @vitejs/plugin-react)
- [x] **1.2** Create `vitest.config.ts` with jsdom environment, path aliases, and coverage settings
- [x] **1.3** Create `vitest.setup.ts` with jest-dom matchers and global mocks
- [x] **1.4** Update `package.json` with test scripts (test, test:run, test:coverage)
- [x] **1.5** Create `src/__mocks__/next-navigation.ts` for Next.js router mocks
- [x] **1.6** Create `src/__mocks__/api.ts` for API mock factory
- [x] **1.7** Create `src/test-utils/index.tsx` with custom render function

## Phase 2: Utility & Hook Tests

- [x] **2.1** Create `src/__tests__/lib/utils.test.ts` - test `cn()` utility
- [x] **2.2** Create `src/__tests__/lib/api.test.ts` - test API functions (mock fetch)
- [x] **2.3** Create `src/__tests__/hooks/useAdapters.test.tsx` - test loading, success, error states
- [x] **2.4** Create `src/__tests__/hooks/useDatasets.test.tsx` - test data fetching hook
- [x] **2.5** Create `src/__tests__/hooks/useFeedbackStats.test.tsx` - test feedback stats hook

## Phase 3: UI Component Tests

- [x] **3.1** Create `src/__tests__/components/ui/button.test.tsx` - test variants, sizes, click handler
- [x] **3.2** Create `src/__tests__/components/ui/card.test.tsx` - test card composition
- [x] **3.3** Create `src/__tests__/components/ui/input.test.tsx` - test input behavior
- [x] **3.4** Create `src/__tests__/components/ui/badge.test.tsx` - test badge variants
- [x] **3.5** Create `src/__tests__/components/ui/select.test.tsx` - test select interactions
- [x] **3.6** Create `src/__tests__/components/ui/textarea.test.tsx` - test textarea behavior
- [x] **3.7** Create `src/__tests__/components/ui/skeleton.test.tsx` - test skeleton rendering
- [x] **3.8** Create `src/__tests__/components/ui/slider.test.tsx` - test slider interactions
- [x] **3.9** Create `src/__tests__/components/ui/error-boundary.test.tsx` - test error catching

## Phase 4: Layout Component Tests

- [x] **4.1** Create `src/__tests__/components/layout/Sidebar.test.tsx` - test navigation rendering
- [x] **4.2** Create `src/__tests__/components/layout/PageHeader.test.tsx` - test header composition
- [x] **4.3** Create `src/__tests__/components/layout/StatusBar.test.tsx` - test status display

## Phase 5: Feature Component Tests

- [x] **5.1** Create `src/__tests__/components/FeedbackPanel.test.tsx` - test rating, tags, submission
- [x] **5.2** Create `src/__tests__/components/PromptEditor.test.tsx` - test prompt creation
- [x] **5.3** Create `src/__tests__/components/FeedbackHistory.test.tsx` - test history display
- [x] **5.4** Create `src/__tests__/components/JobFeedbackPanel.test.tsx` - test job feedback display
- [x] **5.5** Create `src/__tests__/components/AudioPlayer.test.tsx` - test audio player (mock wavesurfer)

## Phase 6: Training Component Tests

- [x] **6.1** Create `src/__tests__/components/training/AdapterSelector.test.tsx` - test adapter selection
- [x] **6.2** Create `src/__tests__/components/training/DatasetList.test.tsx` - test dataset list rendering
- [x] **6.3** Create `src/__tests__/components/training/DatasetCreateForm.test.tsx` - test form validation

## Phase 7: Validation & CI

- [x] **7.1** Run `npm run test:coverage` and verify ≥50% coverage
- [x] **7.2** Fix any failing tests or coverage gaps
- [x] **7.3** Add test command to CI workflow (if exists) or document CI setup
- [x] **7.4** Update README.md with testing instructions

## Dependencies
- Phase 2-6 depend on Phase 1 completion
- Phases 2-6 can be parallelized
- Phase 7 depends on all previous phases

## Verification
Each task should be verified by:
1. Running `npm test` - all tests pass
2. Running `npm run test:coverage` - coverage meets threshold
3. No TypeScript errors in test files
