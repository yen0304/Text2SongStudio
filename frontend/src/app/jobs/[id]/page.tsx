'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { AudioPlayer } from '@/components/AudioPlayer';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import { JobFeedbackPanel } from '@/components/JobFeedbackPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface JobDetail {
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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);

  const handleFeedbackSubmitted = () => {
    setFeedbackRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        // Using listJobs with specific ID via filtering
        const data = await api.listJobs({ limit: 100 });
        const foundJob = data.items.find((j) => j.id === jobId);
        if (foundJob) {
          setJob(foundJob);
        }
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    
    // Poll for updates if job is still processing
    const interval = setInterval(() => {
      if (job?.status === 'processing' || job?.status === 'queued') {
        fetchJob();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Job not found</p>
        <Button variant="outline" onClick={() => router.push('/jobs')}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  const config = statusConfig[job.status] || statusConfig.queued;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Job #${job.id.slice(0, 8)}`}
        breadcrumb={[
          { label: 'Jobs', href: '/jobs' },
          { label: `#${job.id.slice(0, 8)}` },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/jobs')}>
            <ArrowLeft size={16} />
            <span className="ml-2">Back</span>
          </Button>
        }
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <Badge variant="secondary" className={config.color}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Duration</div>
            <div className="font-medium">{formatDuration(job.duration_seconds)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Adapter</div>
            <div className="font-medium">{job.adapter_name || 'Base Model'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Samples</div>
            <div className="font-medium">{job.audio_ids.length}/{job.num_samples}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar for processing jobs */}
      {job.status === 'processing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{Math.round(job.progress * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${job.progress * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {job.error && (
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-500 whitespace-pre-wrap">{job.error}</pre>
          </CardContent>
        </Card>
      )}

      {/* Audio samples */}
      {job.audio_ids.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <AudioPlayer audioIds={job.audio_ids} />
          </div>
          <div>
            <FeedbackPanel 
              audioIds={job.audio_ids} 
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />
          </div>
        </div>
      )}

      {/* Job Feedback History */}
      {job.status === 'completed' && job.audio_ids.length > 0 && (
        <JobFeedbackPanel 
          jobId={job.id} 
          refreshTrigger={feedbackRefreshTrigger}
        />
      )}

      {/* Generation Config */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Config</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Prompt</dt>
              <dd className="font-medium mt-1">{job.prompt_preview || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium mt-1">{new Date(job.created_at).toLocaleString()}</dd>
            </div>
            {job.completed_at && (
              <div>
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="font-medium mt-1">{new Date(job.completed_at).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
