'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import for better bundle splitting
const TrainingDashboard = dynamic(
  () => import('@/components/training/TrainingDashboard').then(mod => ({ default: mod.TrainingDashboard })),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    ),
  }
);

export default function TrainingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Training Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage datasets and adapters for model fine-tuning
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Studio
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <TrainingDashboard />
      </div>
    </main>
  );
}
