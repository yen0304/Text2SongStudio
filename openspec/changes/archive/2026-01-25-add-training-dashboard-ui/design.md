# Design: Training Dashboard UI Architecture

## Overview

This document describes the architectural decisions for adding a training dashboard UI to Text2Song Studio.

## Component Architecture

```
src/
├── app/
│   ├── page.tsx                    # Main generation page (existing)
│   └── training/
│       └── page.tsx                # Training dashboard (new, dynamic import)
├── components/
│   ├── PromptEditor.tsx            # Add AdapterSelector integration
│   ├── FeedbackPanel.tsx           # Add progress indicator
│   ├── training/                   # New training components
│   │   ├── DatasetList.tsx
│   │   ├── DatasetCreateForm.tsx
│   │   ├── DatasetExportDialog.tsx
│   │   ├── AdapterList.tsx
│   │   ├── AdapterCard.tsx
│   │   ├── AdapterSelector.tsx
│   │   ├── FeedbackStats.tsx
│   │   └── TrainingReadiness.tsx
│   └── ui/                         # Shared UI components (existing)
├── hooks/
│   ├── useDatasets.ts              # SWR hook for datasets
│   ├── useAdapters.ts              # SWR hook for adapters
│   └── useFeedbackStats.ts         # SWR hook for feedback stats
└── lib/
    └── api.ts                      # Add dataset/adapter API methods
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Training Dashboard                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Datasets Tab  │   Adapters Tab  │        Progress Tab         │
├─────────────────┼─────────────────┼─────────────────────────────┤
│                 │                 │                             │
│  useDatasets()  │  useAdapters()  │    useFeedbackStats()       │
│       │         │       │         │           │                 │
│       ▼         │       ▼         │           ▼                 │
│  SWR Cache      │  SWR Cache      │      SWR Cache              │
│       │         │       │         │           │                 │
│       ▼         │       ▼         │           ▼                 │
│  GET /datasets  │ GET /adapters   │  GET /feedback/stats        │
│                 │                 │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## State Management Strategy

### Why SWR over useState + useEffect

1. **Automatic deduplication** - Multiple components can call `useDatasets()` without duplicate requests
2. **Stale-while-revalidate** - Shows cached data instantly, updates in background
3. **Automatic revalidation** - Refreshes data on window focus
4. **Optimistic updates** - Better UX for create/update operations

### Example SWR Hook

```typescript
// hooks/useDatasets.ts
import useSWR from 'swr';
import { api } from '@/lib/api';

export function useDatasets() {
  const { data, error, isLoading, mutate } = useSWR(
    '/datasets',
    () => api.listDatasets()
  );

  return {
    datasets: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}
```

## Performance Considerations

Following vercel-react-best-practices:

### Bundle Size Optimization (CRITICAL)

```typescript
// app/training/page.tsx - Use dynamic import
import dynamic from 'next/dynamic';

const TrainingDashboard = dynamic(
  () => import('@/components/training/TrainingDashboard'),
  { loading: () => <DashboardSkeleton /> }
);
```

### Eliminating Waterfalls (CRITICAL)

```typescript
// Parallel data fetching in training page
export default function TrainingPage() {
  // These hooks run in parallel, not sequentially
  const { datasets } = useDatasets();
  const { adapters } = useAdapters();
  const { stats } = useFeedbackStats();
  
  // ...
}
```

### Re-render Optimization (MEDIUM)

```typescript
// Memoize expensive list rendering
const DatasetList = memo(function DatasetList({ datasets }) {
  return datasets.map(d => <DatasetRow key={d.id} dataset={d} />);
});

// Extract static JSX outside component
const EmptyState = (
  <div className="text-center py-8 text-muted-foreground">
    No datasets yet. Create one to start training.
  </div>
);
```

## API Additions

### New Endpoints in api.ts

```typescript
// Datasets
listDatasets: (page?: number, limit?: number) => 
  Promise<{ items: Dataset[]; total: number }>;

createDataset: (data: DatasetCreate) => 
  Promise<Dataset>;

exportDataset: (id: string, format: 'jsonl' | 'huggingface') => 
  Promise<DatasetExport>;

getDatasetStats: (id: string) => 
  Promise<DatasetStats>;

// Adapters (additions)
activateAdapter: (id: string) => Promise<Adapter>;
deactivateAdapter: (id: string) => Promise<Adapter>;

// Feedback (additions)
getFeedbackStats: () => Promise<FeedbackStats>;
```

### New Types

```typescript
interface Dataset {
  id: string;
  name: string;
  description: string;
  type: 'supervised' | 'preference';
  filter_query: FilterQuery;
  sample_count: number;
  export_path: string | null;
  created_at: string;
}

interface DatasetCreate {
  name: string;
  description?: string;
  type: 'supervised' | 'preference';
  filter_query?: FilterQuery;
}

interface FilterQuery {
  min_rating?: number;
  max_rating?: number;
  required_tags?: string[];
  excluded_tags?: string[];
  adapter_id?: string;
  start_date?: string;
  end_date?: string;
}

interface DatasetExport {
  dataset_id: string;
  export_path: string;
  sample_count: number;
  format: string;
}

interface FeedbackStats {
  total_feedback: number;
  rating_distribution: Record<number, number>;
  samples_by_adapter: Record<string, number>;
  preference_pairs: number;
}
```

## UI Component Details

### AdapterSelector (for PromptEditor)

```tsx
interface AdapterSelectorProps {
  value: string | null;
  onChange: (adapterId: string | null) => void;
}

// Shows:
// - "Base Model (facebook/musicgen-small)" as default option
// - List of active adapters with name and version
// - Loading state while fetching adapters
```

### DatasetCreateForm

```tsx
// Form fields:
// - name: string (required)
// - description: string (optional)
// - type: 'supervised' | 'preference' (required, radio)
// - min_rating: 1-5 (optional, slider, default 4)
// - Preview: "X samples match this filter"

// On submit:
// 1. Show loading state
// 2. Call api.createDataset()
// 3. On success, close form, refresh list, show toast
// 4. On error, show error message in form
```

### TrainingReadiness

```tsx
// Shows progress toward training:
// - "15 / 50 samples collected" with progress bar
// - When >= 50: "Ready to train! Create a dataset to get started"
// - Link to Datasets tab
```

## Error Handling

1. **API Errors**: Show toast notification with error message
2. **Empty States**: Show helpful message with action button
3. **Loading States**: Show skeleton loaders, not spinners
4. **Offline**: SWR handles gracefully with cached data

## Future Enhancements (Out of Scope)

1. Training job submission from UI
2. Real-time training progress via WebSocket
3. A/B comparison view for adapter quality
4. Batch feedback import from external sources
