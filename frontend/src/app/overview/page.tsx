'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { ArrowRight, Play, MessageSquare, Database, FlaskConical } from 'lucide-react';
import { PipelineSkeleton, CardSkeleton } from '@/components/ui/skeleton';
import { SectionErrorBoundary, ErrorDisplay } from '@/components/ui/error-boundary';

interface PipelineData {
  pipeline: {
    generation: { total: number; completed: number; active: number };
    feedback: { total: number; rated_samples: number; pending: number };
    dataset: { total: number; exported: number };
    training: { total: number; running: number };
  };
  quick_stats: {
    total_generations: number;
    total_samples: number;
    avg_rating: number | null;
    active_adapters: number;
    total_adapters: number;
    pending_feedback: number;
  };
}

interface PipelineStageProps {
  title: string;
  count: number;
  subtitle: string;
  icon: React.ReactNode;
  href: string;
  isActive?: boolean;
}

function PipelineStage({ title, count, subtitle, icon, href, isActive }: PipelineStageProps) {
  return (
    <Link
      href={href}
      className="flex-1 group"
    >
      <div className={`
        relative p-4 rounded-lg border-2 transition-all
        ${isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
        <div className="flex items-center gap-2 mb-2 text-muted-foreground group-hover:text-foreground">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{count}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </Link>
  );
}

function PipelineArrow() {
  return (
    <div className="flex items-center justify-center w-8">
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    api.getOverviewMetrics()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load metrics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Model tuning pipeline and system metrics"
        />
        <PipelineSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Model tuning pipeline and system metrics"
        />
        <ErrorDisplay
          message={error || 'Failed to load metrics'}
          onRetry={fetchData}
        />
      </div>
    );
  }

  return (
    <SectionErrorBoundary title="Overview Error">
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Model tuning pipeline and system metrics"
      />

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <PipelineStage
              title="Generate"
              count={data.pipeline.generation.completed}
              subtitle={`${data.pipeline.generation.active} active`}
              icon={<Play size={16} />}
              href="/jobs"
              isActive={data.pipeline.generation.active > 0}
            />
            <PipelineArrow />
            <PipelineStage
              title="Feedback"
              count={data.pipeline.feedback.rated_samples}
              subtitle={`${data.pipeline.feedback.pending} pending`}
              icon={<MessageSquare size={16} />}
              href="/jobs"
              isActive={data.pipeline.feedback.pending > 0}
            />
            <PipelineArrow />
            <PipelineStage
              title="Dataset"
              count={data.pipeline.dataset.total}
              subtitle={`${data.pipeline.dataset.exported} exported`}
              icon={<Database size={16} />}
              href="/datasets"
            />
            <PipelineArrow />
            <PipelineStage
              title="Training"
              count={data.pipeline.training.total}
              subtitle={`${data.pipeline.training.running} running`}
              icon={<FlaskConical size={16} />}
              href="/experiments"
              isActive={data.pipeline.training.running > 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.quick_stats.total_generations}</div>
            <div className="text-sm text-muted-foreground">Total Generations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.quick_stats.total_samples}</div>
            <div className="text-sm text-muted-foreground">Audio Samples</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {data.quick_stats.avg_rating ? `${data.quick_stats.avg_rating}/5` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {data.quick_stats.active_adapters}/{data.quick_stats.total_adapters}
            </div>
            <div className="text-sm text-muted-foreground">Active Adapters</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/generate">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium">Generate Audio</div>
                <div className="text-sm text-muted-foreground">Create new samples</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/experiments">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium">Start Experiment</div>
                <div className="text-sm text-muted-foreground">Train a new adapter</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ab-tests">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium">A/B Testing</div>
                <div className="text-sm text-muted-foreground">Compare adapters</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
    </SectionErrorBoundary>
  );
}
