'use client';

import dynamic from 'next/dynamic';
import { ChartSkeleton, AudioPlayerSkeleton } from '@/components/ui/skeleton';

// Lazy loaded MetricsChart
export const LazyMetricsChart = dynamic(
  () => import('@/components/charts/MetricsChart').then(mod => ({ default: mod.MetricsChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Lazy loaded AudioPlayer
export const LazyAudioPlayer = dynamic(
  () => import('@/components/AudioPlayer').then(mod => ({ default: mod.AudioPlayer })),
  {
    loading: () => <AudioPlayerSkeleton />,
    ssr: false,
  }
);

// Lazy loaded comparison components
export const LazyRunComparison = dynamic(
  () => import('@/components/comparison/RunComparison').then(mod => ({ default: mod.RunComparison })),
  {
    loading: () => (
      <div className="rounded-lg border bg-card p-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    ),
    ssr: false,
  }
);

export const LazyComparisonPlayer = dynamic(
  () => import('@/components/comparison/ComparisonPlayer').then(mod => ({ default: mod.ComparisonPlayer })),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-4">
        <AudioPlayerSkeleton />
        <AudioPlayerSkeleton />
      </div>
    ),
    ssr: false,
  }
);
