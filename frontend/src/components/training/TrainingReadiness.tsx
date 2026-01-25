'use client';

import { FeedbackStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TrainingReadinessProps {
  stats: FeedbackStats | null;
  isLoading: boolean;
  onCreateDataset: () => void;
}

const MIN_SAMPLES_FOR_TRAINING = 50;

export function TrainingReadiness({ stats, isLoading, onCreateDataset }: TrainingReadinessProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="h-8 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const highRatedCount = stats?.high_rated_samples || 0;
  const progress = Math.min((highRatedCount / MIN_SAMPLES_FOR_TRAINING) * 100, 100);
  const isReady = highRatedCount >= MIN_SAMPLES_FOR_TRAINING;

  return (
    <Card className={isReady ? 'border-green-500' : ''}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Training Readiness
          {isReady && <span className="text-green-500">✓</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>High-rated samples collected</span>
            <span className="font-medium">
              {highRatedCount} / {MIN_SAMPLES_FOR_TRAINING}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isReady ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        {isReady ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Ready to train!</p>
            <p className="text-sm text-green-700 mt-1">
              You have enough high-quality samples to create a training dataset.
            </p>
            <Button className="mt-3" onClick={onCreateDataset}>
              Create Dataset
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Keep collecting feedback! You need{' '}
              <span className="font-medium">{MIN_SAMPLES_FOR_TRAINING - highRatedCount}</span>{' '}
              more high-rated samples (4+ stars) to start training.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Tips for better training:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Generate multiple samples with different seeds</li>
            <li>Rate samples honestly - only 4+ ratings are used</li>
            <li>Use A/B comparisons for preference learning</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
