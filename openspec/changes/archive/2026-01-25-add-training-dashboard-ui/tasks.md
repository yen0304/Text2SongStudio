# Tasks: Add Training Dashboard UI

## Phase 1: API Client and Foundation

- [x] **1.1** Add dataset API methods to `lib/api.ts`
  - `listDatasets()`, `createDataset()`, `exportDataset()`, `getDatasetStats()`
  - Validation: TypeScript compiles, API calls return expected types

- [x] **1.2** Add adapter API methods to `lib/api.ts`
  - `listAdapters()` already exists, add `activateAdapter()`, `deactivateAdapter()`
  - Validation: TypeScript compiles, API calls return expected types

- [x] **1.3** Create SWR hooks for data fetching
  - `useDatasets()`, `useAdapters()`, `useFeedbackStats()`
  - Validation: Hooks deduplicate requests, handle loading/error states

## Phase 2: Training Dashboard Page

- [x] **2.1** Create `/training` page with tab navigation
  - Three tabs: Datasets, Adapters, Progress
  - Use dynamic import for the page component
  - Validation: Page loads, tabs switch without full reload

- [x] **2.2** Implement DatasetList component
  - Display datasets with name, type, sample count, created date
  - Show export status and path if exported
  - Validation: Datasets render correctly, empty state shown when no datasets

- [x] **2.3** Implement DatasetCreateForm component
  - Form fields: name, description, type (supervised/preference), min_rating filter
  - Preview sample count before creation
  - Validation: Form submits, dataset appears in list, error handling works

- [x] **2.4** Implement DatasetExportDialog component
  - Export format selection (jsonl, huggingface)
  - Show export path and CLI training command after export
  - Validation: Export completes, path displayed, command is copyable

## Phase 3: Adapter Management

- [x] **3.1** Implement AdapterList component
  - Display adapters with name, version, base model, status
  - Filter by active/inactive
  - Validation: Adapters render, filter works

- [x] **3.2** Implement AdapterCard component
  - Show adapter details: description, training config, created date
  - Activate/deactivate toggle
  - Validation: Toggle updates adapter status via API

- [x] **3.3** Add AdapterSelector to PromptEditor
  - Dropdown to select adapter for generation
  - Show "Base Model" option when no adapter selected
  - Validation: Selected adapter passed to generation API

## Phase 4: Progress Tracking

- [x] **4.1** Implement FeedbackStats component
  - Show total feedback count, rating distribution chart
  - Show samples by adapter breakdown
  - Validation: Stats update after submitting feedback

- [x] **4.2** Implement TrainingReadiness indicator
  - Show progress toward minimum samples for training (e.g., 50 samples)
  - Suggest creating dataset when threshold reached
  - Validation: Progress bar reflects actual feedback count

## Phase 5: Integration and Polish

- [x] **5.1** Add navigation to training dashboard
  - Add "Training" link to header navigation
  - Validation: Navigation works from any page

- [x] **5.2** Add feedback collection prompt to FeedbackPanel
  - Show "X more ratings needed for training" message
  - Link to training dashboard
  - Validation: Message updates as feedback is collected

- [x] **5.3** Performance optimization review
  - Apply vercel-react-best-practices rules
  - Ensure dynamic imports, SWR deduplication, proper memoization
  - Validation: Lighthouse performance score > 90

## Dependencies

- Phase 2-4 depend on Phase 1 (API client)
- Phase 5 depends on Phase 2-4 completion
- Tasks within each phase can be parallelized
