'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { experimentsApi, datasetsApi, Experiment, Dataset } from '@/lib/api';
import { Select } from '@/components/ui/select';
import {
  Loader2,
  Plus,
  FlaskConical,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  X,
  Archive,
  ArchiveRestore,
  Database,
} from 'lucide-react';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  draft: { icon: <Clock size={14} />, color: 'bg-gray-500/10 text-gray-600', label: 'Draft' },
  running: { icon: <Play size={14} />, color: 'bg-blue-500/10 text-blue-600', label: 'Running' },
  completed: { icon: <CheckCircle size={14} />, color: 'bg-green-500/10 text-green-600', label: 'Completed' },
  failed: { icon: <XCircle size={14} />, color: 'bg-red-500/10 text-red-600', label: 'Failed' },
  archived: { icon: <Archive size={14} />, color: 'bg-orange-500/10 text-orange-600', label: 'Archived' },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Experiment | null>(null);
  const [archiving, setArchiving] = useState(false);

  const fetchExperiments = async () => {
    try {
      const data = await experimentsApi.list({ include_archived: showArchived });
      setExperiments(data.items);
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
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
    fetchExperiments();
    fetchDatasets();
  }, [showArchived]);

  const handleCreate = async () => {
    if (!newName.trim() || !selectedDatasetId) return;
    
    setCreating(true);
    try {
      await experimentsApi.create({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        dataset_id: selectedDatasetId,
      });
      setNewName('');
      setNewDescription('');
      setSelectedDatasetId('');
      setShowCreateForm(false);
      fetchExperiments();
    } catch (error) {
      console.error('Failed to create experiment:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    
    setArchiving(true);
    try {
      if (archiveTarget.status === 'archived') {
        await experimentsApi.unarchive(archiveTarget.id);
      } else {
        await experimentsApi.archive(archiveTarget.id);
      }
      setArchiveTarget(null);
      fetchExperiments();
    } catch (error) {
      console.error('Failed to archive/unarchive experiment:', error);
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        description="Training experiments and model iterations"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="text-sm">Show archived</Label>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={16} />
              <span className="ml-2">New Experiment</span>
            </Button>
          </div>
        }
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveTarget?.status === 'archived' ? 'Unarchive' : 'Archive'} Experiment
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.status === 'archived' 
                ? `Are you sure you want to unarchive "${archiveTarget?.name}"? It will appear in the default list again.`
                : `Are you sure you want to archive "${archiveTarget?.name}"? You can unarchive it later.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving}>
              {archiving && <Loader2 size={16} className="animate-spin mr-2" />}
              {archiveTarget?.status === 'archived' ? 'Unarchive' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-medium">Create New Experiment</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., ambient-style-v2"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the goal of this experiment..."
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Dataset <span className="text-red-500">*</span></label>
                <Select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  options={[
                    { value: '', label: 'Select a dataset...' },
                    ...datasets.map((ds) => ({
                      value: ds.id,
                      label: `${ds.name} (${ds.type})`,
                    })),
                  ]}
                />
                {datasets.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    No datasets available. Create one in Datasets page first.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={creating || !newName.trim() || !selectedDatasetId}>
                  {creating ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                  Create Experiment
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experiments List */}
      {experiments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No experiments yet</p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create your first experiment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Runs</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Best Loss</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => {
                  const config = statusConfig[exp.status] || statusConfig.draft;
                  return (
                    <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4">
                        <Link href={`/experiments/${exp.id}`} className="hover:underline font-medium">
                          {exp.name}
                        </Link>
                        {exp.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {exp.description}
                          </p>
                        )}
                      </td>
                      <td className="p-4">{exp.run_count}</td>
                      <td className="p-4">
                        {exp.best_loss !== null ? exp.best_loss.toFixed(4) : '-'}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={config.color}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatTime(exp.created_at)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setArchiveTarget(exp)}
                          title={exp.status === 'archived' ? 'Unarchive' : 'Archive'}
                        >
                          {exp.status === 'archived' ? (
                            <ArchiveRestore size={16} />
                          ) : (
                            <Archive size={16} />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
