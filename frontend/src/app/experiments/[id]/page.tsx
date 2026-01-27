'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { experimentsApi, datasetsApi, ExperimentDetail, ExperimentRun, Dataset } from '@/lib/api';
import { RunComparison } from '@/components/comparison/RunComparison';
import { TrainingLogViewer } from '@/components/training/TrainingLogViewer';
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  GitCompare,
  Terminal,
  Database,
  X,
} from 'lucide-react';

const runStatusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock size={14} />, color: 'bg-gray-500/10 text-gray-600', label: 'Pending' },
  running: { icon: <Loader2 size={14} className="animate-spin" />, color: 'bg-blue-500/10 text-blue-600', label: 'Running' },
  completed: { icon: <CheckCircle size={14} />, color: 'bg-green-500/10 text-green-600', label: 'Completed' },
  failed: { icon: <XCircle size={14} />, color: 'bg-red-500/10 text-red-600', label: 'Failed' },
  cancelled: { icon: <XCircle size={14} />, color: 'bg-gray-500/10 text-gray-600', label: 'Cancelled' },
};

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '-';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

export default function ExperimentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const experimentId = params.id as string;
  
  const [experiment, setExperiment] = useState<ExperimentDetail | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRun, setStartingRun] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [viewingLogsRunId, setViewingLogsRunId] = useState<string | null>(null);

  // Get the current run data from experiment (for real-time status updates)
  const viewingLogsRun = viewingLogsRunId 
    ? experiment?.runs.find(r => r.id === viewingLogsRunId) || null 
    : null;

  const fetchExperiment = async () => {
    try {
      const data = await experimentsApi.get(experimentId);
      setExperiment(data);
    } catch (error) {
      console.error('Failed to fetch experiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasets = async () => {
    try {
      const data = await datasetsApi.list();
      setDatasets(data.items);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    }
  };

  useEffect(() => {
    fetchExperiment();
    fetchDatasets();
  }, [experimentId]);

  // Poll for updates when there are running runs
  useEffect(() => {
    if (!experiment) return;
    
    const hasActiveRuns = experiment.runs.some(
      run => run.status === 'running' || run.status === 'pending'
    );
    
    // Poll every 2 seconds when there are active runs
    const intervalId = setInterval(() => {
      fetchExperiment();
    }, hasActiveRuns ? 2000 : 30000);  // Fast poll when active, slow poll otherwise
    
    return () => clearInterval(intervalId);
  }, [experiment?.id, experiment?.runs.map(r => r.status).join(',')]);

  const handleStartRun = async () => {
    setStartingRun(true);
    try {
      await experimentsApi.createRun(experimentId);
      // Refresh to show new run
      await fetchExperiment();
    } catch (error) {
      console.error('Failed to start run:', error);
      alert(`Failed to start run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setStartingRun(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Experiment not found</p>
        <Button variant="outline" onClick={() => router.push('/experiments')}>
          Back to Experiments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={experiment.name}
        description={experiment.description || undefined}
        breadcrumb={[
          { label: 'Experiments', href: '/experiments' },
          { label: experiment.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/experiments')}>
              <ArrowLeft size={16} />
              <span className="ml-2">Back</span>
            </Button>
            <Button onClick={handleStartRun} disabled={startingRun}>
              {startingRun ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Start Run
            </Button>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Runs</div>
            <div className="text-2xl font-bold">{experiment.run_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Best Loss</div>
            <div className="text-2xl font-bold">
              {experiment.best_loss !== null ? experiment.best_loss.toFixed(4) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <Badge
              variant="secondary"
              className={
                experiment.status === 'running'
                  ? 'bg-blue-500/10 text-blue-600'
                  : experiment.status === 'completed'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-gray-500/10 text-gray-600'
              }
            >
              {experiment.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Created</div>
            <div className="font-medium">{new Date(experiment.created_at).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dataset Section */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Database className="text-muted-foreground" size={20} />
            <div>
              <p className="font-medium">
                Dataset: {datasets.find(d => d.id === experiment.dataset_id)?.name || experiment.dataset_id}
              </p>
              <p className="text-sm text-muted-foreground">
                This dataset is used for all training runs in this experiment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training Runs</CardTitle>
            {selectedRuns.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(true)}
              >
                <GitCompare size={16} className="mr-2" />
                Compare ({selectedRuns.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {experiment.runs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="mb-4">No runs yet</p>
              <Button onClick={handleStartRun} disabled={startingRun}>
                Start your first run
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 p-4"></th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Run</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Final Loss</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Adapter</th>
                  <th className="w-20 p-4"></th>
                </tr>
              </thead>
              <tbody>
                {experiment.runs.map((run) => {
                  const config = runStatusConfig[run.status] || runStatusConfig.pending;
                  const isBest = experiment.best_run_id === run.id;
                  const isSelected = selectedRuns.includes(run.id);
                  return (
                    <tr
                      key={run.id}
                      className={`border-b border-border last:border-0 cursor-pointer ${
                        isSelected ? 'bg-primary/5' : isBest ? 'bg-green-500/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedRuns(prev =>
                          prev.includes(run.id)
                            ? prev.filter(id => id !== run.id)
                            : [...prev, run.id]
                        );
                      }}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-border"
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{run.name || run.id.slice(0, 8)}</span>
                        {isBest && (
                          <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600">
                            Best
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className={config.color}>
                            {config.icon}
                            <span className="ml-1">{config.label}</span>
                          </Badge>
                          {run.error && (
                            <span className="text-xs text-red-500 max-w-[200px] truncate" title={run.error}>
                              {run.error}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {run.final_loss !== null ? run.final_loss.toFixed(4) : '-'}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatDuration(run.started_at, run.completed_at)}
                      </td>
                      <td className="p-4">
                        {run.adapter_id ? (
                          <a href={`/adapters`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                            View Adapter
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingLogsRunId(run.id);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Terminal size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Training Logs Viewer */}
      {viewingLogsRun && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Training Logs</CardTitle>
                <Badge variant="secondary">
                  {viewingLogsRun.name || viewingLogsRun.id.slice(0, 8)}
                </Badge>
                {viewingLogsRun.status === 'running' && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                    <Loader2 size={12} className="animate-spin mr-1" />
                    Running
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingLogsRunId(null)}
              >
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TrainingLogViewer
              runId={viewingLogsRun.id}
              isLive={viewingLogsRun.status === 'running'}
              height="500px"
            />
          </CardContent>
        </Card>
      )}

      {/* Run Comparison View */}
      {showComparison && selectedRuns.length >= 2 && (
        <RunComparison
          runs={experiment.runs.filter(r => selectedRuns.includes(r.id))}
          bestRunId={experiment.best_run_id}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Config */}
      {experiment.config && Object.keys(experiment.config).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Training Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(experiment.config, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
