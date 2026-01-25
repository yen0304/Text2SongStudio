'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generationApi } from '@/lib/api';
import { ListItemSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton';
import { SectionErrorBoundary, ErrorDisplay } from '@/components/ui/error-boundary';
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface Job {
  id: string;
  prompt_id: string | null;
  prompt_preview: string | null;
  adapter_id: string | null;
  adapter_name: string | null;
  status: string;
  progress: number;
  num_samples: number;
  audio_ids: string[];
  error: string | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  queued: { icon: <Clock size={14} />, color: 'bg-yellow-500/10 text-yellow-600', label: 'Queued' },
  processing: { icon: <Loader2 size={14} className="animate-spin" />, color: 'bg-blue-500/10 text-blue-600', label: 'Processing' },
  completed: { icon: <CheckCircle size={14} />, color: 'bg-green-500/10 text-green-600', label: 'Completed' },
  failed: { icon: <XCircle size={14} />, color: 'bg-red-500/10 text-red-600', label: 'Failed' },
  cancelled: { icon: <AlertCircle size={14} />, color: 'bg-gray-500/10 text-gray-600', label: 'Cancelled' },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

function JobsContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;
      
      const data = await generationApi.listJobs(params);
      setJobs(data.items);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchJobs();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (deleteConfirm === jobId) {
      // User confirmed deletion
      setDeleting(true);
      try {
        await generationApi.deleteJob(jobId);
        setDeleteConfirm(null);
        fetchJobs();
      } catch (err) {
        setError((err as Error).message || 'Failed to delete job');
      } finally {
        setDeleting(false);
      }
    } else {
      // Show confirmation
      setDeleteConfirm(jobId);
      // Auto-dismiss after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'queued', label: 'Queued' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Jobs" description="Generation jobs" />
        <ErrorDisplay message={error} onRetry={fetchJobs} />
      </div>
    );
  }

  return (
    <SectionErrorBoundary title="Jobs Error">
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description={`${total} generation jobs`}
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="ml-2">Refresh</span>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/jobs?status=${filter.value}` : '/jobs'}
          >
            <Button
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
            >
              {filter.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Jobs List */}
      <Card>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No jobs found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => {
                const config = statusConfig[job.status] || statusConfig.queued;
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 w-32">
                      <Badge variant="secondary" className={config.color}>
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {job.prompt_preview || 'No prompt'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.adapter_name || 'Base Model'} • {job.num_samples} samples
                      </div>
                    </div>

                    {job.status === 'processing' && (
                      <div className="w-24">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${job.progress * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-center">
                          {Math.round(job.progress * 100)}%
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground w-20 text-right">
                      {formatDuration(job.duration_seconds)}
                    </div>

                    <div className="text-sm text-muted-foreground w-24 text-right">
                      {formatTime(job.created_at)}
                    </div>

                    <Button
                      variant={deleteConfirm === job.id ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={(e) => handleDelete(job.id, e)}
                      disabled={deleting}
                      className="ml-2"
                    >
                      <Trash2 size={14} />
                      {deleteConfirm === job.id && (
                        <span className="ml-1">Confirm?</span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </SectionErrorBoundary>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeaderSkeleton />
          <Card>
            <CardContent className="p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </CardContent>
          </Card>
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
