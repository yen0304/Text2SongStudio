# Proposal: Add Front-End Testing Infrastructure

## Change ID
`add-frontend-testing`

## Summary
Introduce a comprehensive front-end testing infrastructure using Vitest and React Testing Library to achieve over 50% code coverage. This establishes the testing foundation described in the project conventions (React Testing Library for component tests).

## Motivation
Currently, the frontend has no testing infrastructure in place (`npm test` echoes "No tests configured yet"). Adding tests will:
- Catch regressions before deployment
- Document expected component behavior
- Enable confident refactoring
- Align with project conventions outlined in `openspec/project.md`

## Scope

### In Scope
- Install and configure Vitest + React Testing Library + jsdom
- Create test utilities and mock infrastructure (API mocks, custom render)
- Write unit tests for utility functions (`lib/utils.ts`)
- Write unit tests for custom hooks (`hooks/`)
- Write component tests for UI primitives (`components/ui/`)
- Write component tests for key feature components
- Configure coverage reporting with 50%+ threshold
- Add CI-compatible test scripts

### Out of Scope
- E2E tests (Playwright) - separate initiative
- Backend testing - already covered by pytest
- Visual regression testing
- Performance testing

## Impact Analysis

### Files to Add
- `frontend/vitest.config.ts` - Test runner configuration
- `frontend/vitest.setup.ts` - Test environment setup
- `frontend/src/__tests__/` - Test files directory
- `frontend/src/__mocks__/` - Shared mocks

### Files to Modify
- `frontend/package.json` - Add test dependencies and scripts
- `frontend/tsconfig.json` - Include test paths

### Breaking Changes
None. This is purely additive infrastructure.

## Dependencies
- Vitest (test runner, compatible with Vite/Next.js)
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- jsdom

## Success Criteria
1. `npm test` runs all tests successfully
2. `npm run test:coverage` reports ≥50% coverage
3. CI can run tests in non-interactive mode
4. All existing functionality remains unaffected

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Next.js App Router compatibility issues | Use vitest with happy-dom/jsdom, mock Next.js internals |
| API mocking complexity | Create centralized mock factory |
| Flaky tests | Avoid timers, use proper async utilities |

## Estimated Effort
Medium - 2-3 days for full implementation

## References
- Project testing strategy: `openspec/project.md`
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Vitest: https://vitest.dev/
