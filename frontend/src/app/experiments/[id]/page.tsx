'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  List,
  BarChart3,
  Settings,
} from 'lucide-react';

const runStatusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock size={14} />, color: 'bg-gray-500/10 text-gray-600', label: 'Pending' },
  running: { icon: <Loader2 size={14} className="animate-spin" />, color: 'bg-blue-500/10 text-blue-600', label: 'Running' },
  completed: { icon: <CheckCircle size={14} />, color: 'bg-green-500/10 text-green-600', label: 'Completed' },
  failed: { icon: <XCircle size={14} />, color: 'bg-red-500/10 text-red-600', label: 'Failed' },
  cancelled: { icon: <XCircle size={14} />, color: 'bg-gray-500/10 text-gray-600', label: 'Cancelled' },
};

// Terminal states that allow deletion
const DELETABLE_STATES = ['failed', 'completed', 'cancelled'];

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
  
  // Delete run state
  const [deleteTarget, setDeleteTarget] = useState<ExperimentRun | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  
  // Pagination state
  const [runsPage, setRunsPage] = useState(1);
  const RUNS_PER_PAGE = 10;

  // Get the current run data from experiment (for real-time status updates)
  const viewingLogsRun = viewingLogsRunId 
    ? experiment?.runs.find(r => r.id === viewingLogsRunId) || null 
    : null;

  // Get runs that have logs (for terminal tabs)
  const runsWithLogs = experiment?.runs.filter(r => 
    r.status === 'running' || r.status === 'completed' || r.status === 'failed'
  ) || [];

  // Get selected runs that can be deleted
  const deletableSelectedRuns = selectedRuns.filter(id => {
    const run = experiment?.runs.find(r => r.id === id);
    return run && DELETABLE_STATES.includes(run.status);
  });

  const fetchExperiment = async () => {
    try {
      const data = await experimentsApi.get(experimentId);
      setExperiment(data);
      
      // Auto-select first run with logs if none selected
      if (!viewingLogsRunId && data.runs.length > 0) {
        const firstRunWithLogs = data.runs.find(r => 
          r.status === 'running' || r.status === 'completed' || r.status === 'failed'
        );
        if (firstRunWithLogs) {
          setViewingLogsRunId(firstRunWithLogs.id);
        }
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  // Poll for updates when there are running runs
  const runStatuses = experiment?.runs.map(r => r.status).join(',') || '';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiment?.id, runStatuses]);

  const handleStartRun = async () => {
    setStartingRun(true);
    try {
      const newRun = await experimentsApi.createRun(experimentId);
      // Auto-select the new run for viewing
      setViewingLogsRunId(newRun.id);
      // Refresh to show new run
      await fetchExperiment();
    } catch (error) {
      console.error('Failed to start run:', error);
      alert(`Failed to start run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setStartingRun(false);
    }
  };

  const handleDeleteRun = async () => {
    if (!deleteTarget) return;
    
    setDeleting(true);
    try {
      await experimentsApi.deleteRun(experimentId, deleteTarget.id);
      
      // If we're viewing the deleted run, switch to another
      if (viewingLogsRunId === deleteTarget.id) {
        const remainingRuns = experiment?.runs.filter(r => r.id !== deleteTarget.id) || [];
        const nextRun = remainingRuns.find(r => 
          r.status === 'running' || r.status === 'completed' || r.status === 'failed'
        );
        setViewingLogsRunId(nextRun?.id || null);
      }
      
      // Remove from selected runs if present
      setSelectedRuns(prev => prev.filter(id => id !== deleteTarget.id));
      
      setDeleteTarget(null);
      await fetchExperiment();
    } catch (error) {
      console.error('Failed to delete run:', error);
      alert(`Failed to delete run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (deletableSelectedRuns.length === 0) return;
    
    setDeleting(true);
    try {
      await experimentsApi.deleteRunsBatch(experimentId, deletableSelectedRuns);
      
      // If we're viewing a deleted run, switch to another
      if (viewingLogsRunId && deletableSelectedRuns.includes(viewingLogsRunId)) {
        const remainingRuns = experiment?.runs.filter(r => !deletableSelectedRuns.includes(r.id)) || [];
        const nextRun = remainingRuns.find(r => 
          r.status === 'running' || r.status === 'completed' || r.status === 'failed'
        );
        setViewingLogsRunId(nextRun?.id || null);
      }
      
      setSelectedRuns([]);
      setShowBatchDeleteConfirm(false);
      await fetchExperiment();
    } catch (error) {
      console.error('Failed to delete runs:', error);
      alert(`Failed to delete runs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
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
    <div className="min-h-full flex flex-col pb-8">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col mt-6">
        <Tabs defaultValue="runs" className="flex-1 flex flex-col">
          <div className="flex items-center justify-between border-b px-1 flex-shrink-0">
            <TabsList className="h-10">
              <TabsTrigger value="runs" className="gap-2">
                <List size={14} />
                Runs
              </TabsTrigger>
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 size={14} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings size={14} />
                Config
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {deletableSelectedRuns.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBatchDeleteConfirm(true)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete ({deletableSelectedRuns.length})
                </Button>
              )}
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
          </div>

            {/* Runs Tab - Contains table and terminal */}
            <TabsContent value="runs" className="mt-0 p-0 flex-1 flex flex-col min-h-0">
              {experiment.runs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="mb-4">No runs yet</p>
                  <Button onClick={handleStartRun} disabled={startingRun}>
                    Start your first run
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Runs Table */}
                  <div className="flex-shrink-0 border-b">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="w-10 p-3"></th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-sm">Run</th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-sm">Status</th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-sm">Final Loss</th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-sm">Duration</th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-sm">Adapter</th>
                          <th className="w-20 p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {experiment.runs
                          .slice((runsPage - 1) * RUNS_PER_PAGE, runsPage * RUNS_PER_PAGE)
                          .map((run) => {
                          const config = runStatusConfig[run.status] || runStatusConfig.pending;
                          const isBest = experiment.best_run_id === run.id;
                          const isSelected = selectedRuns.includes(run.id);
                          const isViewing = viewingLogsRunId === run.id;
                          const canDelete = DELETABLE_STATES.includes(run.status);
                          
                          return (
                            <tr
                              key={run.id}
                              className={`border-b border-border last:border-0 cursor-pointer ${
                                isViewing ? 'bg-primary/10' : isSelected ? 'bg-primary/5' : isBest ? 'bg-green-500/5' : 'hover:bg-muted/50'
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
                            <td className="p-3">
                              <span className="font-medium text-sm">{run.name || run.id.slice(0, 8)}</span>
                              {isBest && (
                                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600 text-xs">
                                  Best
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                <Badge variant="secondary" className={`${config.color} text-xs`}>
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
                            <td className="p-3 text-sm">
                              {run.final_loss !== null ? run.final_loss.toFixed(4) : '-'}
                            </td>
                            <td className="p-3 text-muted-foreground text-sm">
                              {formatDuration(run.started_at, run.completed_at)}
                            </td>
                            <td className="p-3">
                              {run.adapter_id ? (
                                <Badge 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-primary/10 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = '/adapters';
                                  }}
                                >
                                  View Adapter
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingLogsRunId(run.id);
                                  }}
                                  className={`text-muted-foreground hover:text-foreground ${isViewing ? 'bg-primary/20' : ''}`}
                                  title="View logs"
                                >
                                  <Terminal size={16} />
                                </Button>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget(run);
                                    }}
                                    className="text-muted-foreground hover:text-red-500"
                                    title="Delete run"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {experiment.runs.length <= RUNS_PER_PAGE 
                      ? `${experiment.runs.length} runs`
                      : `Showing ${(runsPage - 1) * RUNS_PER_PAGE + 1}-${Math.min(runsPage * RUNS_PER_PAGE, experiment.runs.length)} of ${experiment.runs.length} runs`
                    }
                  </div>
                  {experiment.runs.length > RUNS_PER_PAGE && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRunsPage(p => Math.max(1, p - 1))}
                        disabled={runsPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <span className="text-sm px-2">
                        Page {runsPage} of {Math.ceil(experiment.runs.length / RUNS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRunsPage(p => Math.min(Math.ceil(experiment.runs.length / RUNS_PER_PAGE), p + 1))}
                        disabled={runsPage >= Math.ceil(experiment.runs.length / RUNS_PER_PAGE)}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  )}
                </div>
                  
                  {/* Terminal inside Runs tab */}
                  <div className="border-t border-zinc-700 bg-[#1a1b26] rounded-b-lg">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
                      <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-300">Training Logs</span>
                      </div>
                      {/* Run Tabs */}
                      {runsWithLogs.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto">
                          {runsWithLogs.map((run) => {
                            const isActive = viewingLogsRunId === run.id;
                            const statusConfig = runStatusConfig[run.status];
                            return (
                              <button
                                key={run.id}
                                onClick={() => setViewingLogsRunId(run.id)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                                }`}
                              >
                                {statusConfig?.icon}
                                <span>{run.name || run.id.slice(0, 8)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      {viewingLogsRun ? (
                        <TrainingLogViewer
                          key={viewingLogsRun.id}
                          runId={viewingLogsRun.id}
                          isLive={viewingLogsRun.status === 'running'}
                          height="400px"
                        />
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-zinc-500">
                          <p>Select a run to view logs</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 p-4 space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

              {/* Dataset Info */}
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
            </TabsContent>

            {/* Config Tab */}
            <TabsContent value="config" className="mt-0 p-4">
              {experiment.config && Object.keys(experiment.config).length > 0 ? (
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(experiment.config, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-center py-8">No configuration available</p>
              )}
            </TabsContent>
          </Tabs>
      </div>

      {/* Run Comparison View */}
      {showComparison && selectedRuns.length >= 2 && (
        <RunComparison
          runs={experiment.runs.filter(r => selectedRuns.includes(r.id))}
          bestRunId={experiment.best_run_id}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Run</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete run &quot;{deleteTarget?.name || deleteTarget?.id.slice(0, 8)}&quot;?
              This will permanently remove the run and its training logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRun}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={showBatchDeleteConfirm} onOpenChange={setShowBatchDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletableSelectedRuns.length} Runs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletableSelectedRuns.length} selected run(s)?
              This will permanently remove them and their training logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
