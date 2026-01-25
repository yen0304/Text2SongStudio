# Tasks: Redesign Dashboard UI

## Phase 1: Layout Foundation & Backend Models

- [x] **1.1** Create database models for Experiment, ExperimentRun, ABTest
  - Add to `backend/app/models/`
  - Create Alembic migration
  - Validation: Migration runs, models can be queried

- [x] **1.2** Create Sidebar layout component
  - Navigation items: Overview, Generate, Jobs, Experiments, Adapters, Datasets, Settings
  - Active state indicator, collapsible on mobile
  - Validation: Sidebar renders on all pages, navigation works

- [x] **1.3** Create StatusBar component
  - Show active jobs count, pending feedback count
  - Auto-refresh every 30s
  - Validation: Stats update when jobs change

- [x] **1.4** Update root layout to use sidebar + content structure
  - Move existing page content to appropriate routes
  - `/` redirects to `/overview`
  - Validation: All existing routes still work

## Phase 2: Overview & Job Queue

- [x] **2.1** Create Pipeline visualization component
  - Four stages: Generate → Feedback → Dataset → Training
  - Show counts for each stage, clickable to navigate
  - Validation: Counts match database, links work

- [x] **2.2** Create Overview page (`/overview`)
  - Pipeline view, quick stats cards, recent activity feed
  - Validation: Page loads, shows accurate stats

- [x] **2.3** Create Job Queue API endpoints
  - `GET /jobs` with filters (status, adapter, date range)
  - `GET /jobs/stats` for queue overview
  - Validation: API returns paginated, filtered results

- [x] **2.4** Create Job Queue page (`/jobs`)
  - Table with status, prompt preview, progress, duration
  - Real-time status updates via polling
  - Filter by status, sort by date
  - Validation: Jobs display correctly, filters work

- [x] **2.5** Create Job Detail page (`/jobs/[id]`)
  - Show full job info, generation config
  - Embed AudioPlayer component for samples
  - Embed FeedbackPanel for rating
  - Validation: Audio plays, feedback submits

## Phase 3: Experiment Management

- [x] **3.1** Create Experiment CRUD API
  - `GET/POST /experiments`, `GET/PUT/DELETE /experiments/{id}`
  - `POST /experiments/{id}/runs` to start training
  - `GET /experiments/{id}/runs` list runs
  - Validation: API follows REST conventions, proper error handling

- [x] **3.2** Create Experiment List page (`/experiments`)
  - Table: name, run count, best loss, status, created date
  - Create experiment form/modal
  - Validation: Experiments list, create works

- [x] **3.3** Create Experiment Detail page (`/experiments/[id]`)
  - Runs table with metrics summary
  - Training config display
  - Link to resulting adapter
  - Validation: Runs display correctly

- [x] **3.4** Create MetricsChart component
  - Line chart for loss curve (use recharts or similar)
  - Support multiple runs overlay for comparison
  - Validation: Chart renders, data points correct

- [x] **3.5** Create Run comparison view
  - Side-by-side metrics for selected runs
  - Highlight best performing run
  - Validation: Comparison shows differences clearly

## Phase 4: Adapter Version History

- [x] **4.1** Create Adapter timeline API
  - `GET /adapters` with version history per adapter name
  - Include training metrics per version
  - Validation: API returns grouped versions

- [x] **4.2** Create AdapterTimeline component
  - Visual timeline showing versions like Git history
  - Show active version indicator
  - Quick compare button between versions
  - Validation: Timeline renders, versions display correctly

- [x] **4.3** Update Adapters page (`/adapters`)
  - Replace list view with timeline view
  - Filter by adapter name/status
  - Validation: Page shows version history

## Phase 5: A/B Testing

- [x] **5.1** Create A/B Test API endpoints
  - `GET/POST /ab-tests`
  - `GET /ab-tests/{id}` with results
  - `POST /ab-tests/{id}/generate` batch generate
  - `POST /ab-tests/{id}/vote` submit preference
  - Validation: API handles concurrent votes correctly

- [x] **5.2** Create A/B Test List page (`/ab-tests`)
  - Table: name, adapters being compared, status, win rate
  - Create test wizard (select adapters, prompts)
  - Validation: Tests display, creation works

- [x] **5.3** Create ComparisonPlayer component
  - Side-by-side audio players
  - Synchronized play/pause
  - Blind mode option (hide which is A/B)
  - Validation: Audio syncs, preference buttons work

- [x] **5.4** Create A/B Test View page (`/ab-tests/[id]`)
  - ComparisonPlayer for each prompt
  - Results summary (A vs B preferences)
  - Generate more samples button
  - Validation: Full test flow works

## Phase 6: Generate Page Enhancement

- [x] **6.1** Move existing PromptEditor to `/generate`
  - Preserve all current functionality (instruments, attributes)
  - Add mode toggle: Single / A/B Compare
  - Validation: All generation features work as before

- [x] **6.2** Add A/B generation mode
  - Select two adapters for comparison
  - Generate samples for both simultaneously
  - Link to A/B Test view for results
  - Validation: A/B generation creates proper test

## Phase 7: Integration & Polish

- [x] **7.1** Update Datasets page route (`/datasets`)
  - Move from `/training` to `/datasets`
  - Keep all existing functionality
  - Validation: Dataset features work

- [x] **7.2** Add keyboard shortcuts
  - `g` then `o` → Overview, `g` then `j` → Jobs, etc.
  - Space to play/pause audio
  - Validation: Shortcuts work globally

- [x] **7.3** Add loading states and error boundaries
  - Skeleton loaders for lists
  - Error boundary per page section
  - Validation: Loading states smooth, errors contained

- [x] **7.4** Performance optimization
  - Lazy load heavy components (charts, audio player)
  - Implement virtual scrolling for long lists
  - Validation: Lighthouse performance > 85

- [x] **7.5** Responsive design for tablet
  - Collapsible sidebar
  - Stacked layout for comparison views
  - Validation: Usable on 768px+ screens

## Dependencies

- Phase 1 required before all others
- Phase 2-4 can be parallelized after Phase 1
- Phase 5 depends on Phase 4 (adapter selection)
- Phase 6 depends on Phase 5 (A/B mode)
- Phase 7 depends on all feature phases
