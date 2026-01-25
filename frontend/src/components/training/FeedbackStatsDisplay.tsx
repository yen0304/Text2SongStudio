'use client';

import { FeedbackStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeedbackStatsDisplayProps {
  stats: FeedbackStats | null;
  isLoading: boolean;
}

const LoadingState = (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
    ))}
  </div>
);

export function FeedbackStatsDisplay({ stats, isLoading }: FeedbackStatsDisplayProps) {
  if (isLoading) {
    return LoadingState;
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feedback data available
      </div>
    );
  }

  const ratingLabels = ['1', '2', '3', '4', '5'];
  const maxCount = Math.max(...Object.values(stats.rating_distribution), 1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total_feedback}</div>
            <p className="text-sm text-muted-foreground">Total Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total_ratings}</div>
            <p className="text-sm text-muted-foreground">Ratings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total_preferences}</div>
            <p className="text-sm text-muted-foreground">Preferences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.high_rated_samples}</div>
            <p className="text-sm text-muted-foreground">High Rated (4+)</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {ratingLabels.map((label) => {
              const count = (stats.rating_distribution as Record<string, number>)[label] || 0;
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative h-24">
                    <div
                      className="absolute bottom-0 w-full bg-primary/80 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{count}</span>
                  <span className="text-xs text-muted-foreground">★{label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
