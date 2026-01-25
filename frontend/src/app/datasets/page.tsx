'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { datasetsApi, Dataset, DatasetStats } from '@/lib/api';
import {
  Loader2,
  Plus,
  Database,
  Download,
  FileJson,
  BarChart,
  Trash2,
} from 'lucide-react';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: '',
    description: '',
    type: 'supervised' as 'supervised' | 'preference',
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, DatasetStats>>({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchDatasets = async () => {
    try {
      const data = await datasetsApi.list({ include_deleted: showDeleted });
      setDatasets(data.items);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [showDeleted]);

  const fetchStats = async (datasetId: string) => {
    if (stats[datasetId]) return;
    try {
      const data = await datasetsApi.getStats(datasetId);
      setStats(prev => ({ ...prev, [datasetId]: data }));
    } catch (error) {
      console.error('Failed to fetch dataset stats:', error);
    }
  };

  const handleExpand = (datasetId: string) => {
    if (expandedId === datasetId) {
      setExpandedId(null);
    } else {
      setExpandedId(datasetId);
      fetchStats(datasetId);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDataset.name.trim()) return;
    
    setCreating(true);
    try {
      await datasetsApi.create({
        name: newDataset.name,
        description: newDataset.description || undefined,
        type: newDataset.type,
      });
      setShowCreateForm(false);
      setNewDataset({ name: '', description: '', type: 'supervised' });
      fetchDatasets();
    } catch (error) {
      console.error('Failed to create dataset:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async (datasetId: string, format: 'jsonl' | 'huggingface') => {
    try {
      const result = await datasetsApi.export(datasetId, format);
      // In real app, would trigger download or show path
      console.log('Export result:', result);
    } catch (error) {
      console.error('Failed to export dataset:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setDeleting(true);
    setDeleteError(null);
    try {
      await datasetsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchDatasets();
    } catch (error: unknown) {
      // Check if it's a 400 error with reference blocking message
      if (error && typeof error === 'object' && 'message' in error) {
        const errMsg = (error as { message: string }).message;
        if (errMsg.includes('referenced by')) {
          setDeleteError(errMsg);
        } else {
          setDeleteError('Failed to delete dataset. Please try again.');
        }
      } else {
        setDeleteError('Failed to delete dataset. Please try again.');
      }
      console.error('Failed to delete dataset:', error);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Datasets"
        description="Manage training and preference datasets"
        breadcrumb={[{ label: 'Datasets' }]}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-deleted"
                checked={showDeleted}
                onCheckedChange={setShowDeleted}
              />
              <Label htmlFor="show-deleted" className="text-sm">
                Show deleted
              </Label>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus size={16} />
              <span className="ml-2">New Dataset</span>
            </Button>
          </div>
        }
      />

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Dataset</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    placeholder="e.g., jazz-training-v1"
                    value={newDataset.name}
                    onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newDataset.type}
                    onChange={(e) => setNewDataset({ ...newDataset, type: e.target.value as 'supervised' | 'preference' })}
                  >
                    <option value="supervised">Supervised (Rating-based)</option>
                    <option value="preference">Preference (Comparison-based)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Input
                    placeholder="Dataset description"
                    value={newDataset.description}
                    onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !newDataset.name.trim()}>
                  {creating && <Loader2 size={16} className="animate-spin mr-2" />}
                  Create Dataset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Datasets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Datasets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {datasets.length === 0 ? (
            <div className="py-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No datasets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first dataset to start collecting training data
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus size={16} className="mr-2" />
                Create First Dataset
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {datasets.map((dataset) => (
                <div key={dataset.id}>
                  <div
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleExpand(dataset.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{dataset.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {dataset.type}
                          </Badge>
                          {dataset.deleted_at && (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-600 text-xs">
                              Deleted
                            </Badge>
                          )}
                          {dataset.is_exported && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                              Exported
                            </Badge>
                          )}
                        </div>
                        {dataset.description && (
                          <p className="text-sm text-muted-foreground mt-1">{dataset.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{dataset.sample_count}</div>
                          <div className="text-xs text-muted-foreground">samples</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(dataset.id, 'jsonl');
                          }}
                        >
                          <Download size={16} />
                        </Button>
                        {!dataset.deleted_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteError(null);
                              setDeleteTarget(dataset);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Stats */}
                  {expandedId === dataset.id && (
                    <div className="px-4 pb-4 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats[dataset.id] ? (
                          <>
                            <div className="p-4 bg-background rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart size={16} className="text-muted-foreground" />
                                <span className="text-sm font-medium">Statistics</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Samples</span>
                                  <span>{stats[dataset.id].total_samples}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Unique Prompts</span>
                                  <span>{stats[dataset.id].unique_prompts}</span>
                                </div>
                                {stats[dataset.id].avg_rating !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Avg Rating</span>
                                    <span>{stats[dataset.id].avg_rating?.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="p-4 bg-background rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FileJson size={16} className="text-muted-foreground" />
                                <span className="text-sm font-medium">Export</span>
                              </div>
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleExport(dataset.id, 'jsonl')}
                                >
                                  Export as JSONL
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleExport(dataset.id, 'huggingface')}
                                >
                                  Export for HuggingFace
                                </Button>
                              </div>
                            </div>
                            <div className="p-4 bg-background rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Database size={16} className="text-muted-foreground" />
                                <span className="text-sm font-medium">Metadata</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created</span>
                                  <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                                </div>
                                {dataset.export_path && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Path</span>
                                    <span className="truncate max-w-[150px]">{dataset.export_path}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-3 flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action will
              soft-delete the dataset. It can be viewed again by enabling &quot;Show deleted&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 size={16} className="animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
