'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adaptersApi, Adapter } from '@/lib/api';
import {
  Loader2,
  Package,
  Archive,
  GitBranch,
  Zap,
  Trash2,
  Pencil,
} from 'lucide-react';

export default function AdaptersPage() {
  const router = useRouter();
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    archived: number;
    total_versions: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Rename state
  const [renameAdapter, setRenameAdapter] = useState<Adapter | null>(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const fetchAdapters = async () => {
    try {
      const [adapterList, adapterStats] = await Promise.all([
        adaptersApi.list(),
        adaptersApi.getStats(),
      ]);
      setAdapters(adapterList.items);
      setStats(adapterStats);
    } catch (error) {
      console.error('Failed to fetch adapters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdapters();
  }, []);

  const handleDelete = async (adapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (deleteConfirm === adapterId) {
      setDeleting(true);
      try {
        await adaptersApi.delete(adapterId);
        setDeleteConfirm(null);
        fetchAdapters();
      } catch (error) {
        console.error('Failed to delete adapter:', error);
      } finally {
        setDeleting(false);
      }
    } else {
      setDeleteConfirm(adapterId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const openRenameDialog = (adapter: Adapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameAdapter(adapter);
    setNewName(adapter.name);
    setNameError(null);
  };

  const closeRenameDialog = () => {
    setRenameAdapter(null);
    setNewName('');
    setNameError(null);
  };

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Name cannot be empty';
    }
    if (name.length > 100) {
      return 'Name must be 100 characters or less';
    }
    return null;
  };

  const handleRename = async () => {
    if (!renameAdapter) return;

    const trimmedName = newName.trim();
    const error = validateName(trimmedName);
    if (error) {
      setNameError(error);
      return;
    }

    if (trimmedName === renameAdapter.name) {
      closeRenameDialog();
      return;
    }

    setRenaming(true);
    try {
      await adaptersApi.update(renameAdapter.id, { name: trimmedName });
      closeRenameDialog();
      fetchAdapters();
    } catch (error) {
      console.error('Failed to rename adapter:', error);
      setNameError('Failed to save name');
    } finally {
      setRenaming(false);
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
        title="Adapters"
        description="LoRA adapters are automatically created when training completes successfully"
        breadcrumb={[{ label: 'Adapters' }]}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Adapters</div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active</div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <Archive className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Archived</div>
                  <div className="text-2xl font-bold">{stats.archived}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <GitBranch className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Versions</div>
                  <div className="text-2xl font-bold">{stats.total_versions}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Adapters Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Adapters</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {adapters.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No adapters yet</h3>
              <p className="text-sm text-muted-foreground">
                Adapters are automatically created when training runs complete successfully.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start by creating a dataset with rated samples, then run an experiment.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Base Model</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Version</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {adapters.map((adapter) => (
                  <tr
                    key={adapter.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/adapters/${adapter.id}`)}
                  >
                    <td className="p-4">
                      <div className="font-medium">{adapter.name}</div>
                      {adapter.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {adapter.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{adapter.base_model}</Badge>
                    </td>
                    <td className="p-4">
                      {adapter.current_version ? (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                          v{adapter.current_version}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="secondary"
                        className={
                          adapter.status === 'active'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-gray-500/10 text-gray-600'
                        }
                      >
                        {adapter.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(adapter.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => openRenameDialog(adapter, e)}
                          title="Rename adapter"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/adapters/${adapter.id}`);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant={deleteConfirm === adapter.id ? 'destructive' : 'ghost'}
                          size="sm"
                          onClick={(e) => handleDelete(adapter.id, e)}
                          disabled={deleting}
                        >
                          <Trash2 size={14} />
                          {deleteConfirm === adapter.id && (
                            <span className="ml-1">Confirm?</span>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={!!renameAdapter} onOpenChange={(open: boolean) => !open && closeRenameDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Adapter</DialogTitle>
            <DialogDescription>
              Enter a new name for the adapter. This helps identify it when selecting adapters for generation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRename();
                }
              }}
              placeholder="Adapter name"
              maxLength={100}
              disabled={renaming}
              autoFocus
            />
            {nameError && (
              <p className="text-sm text-destructive mt-2">{nameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRenameDialog} disabled={renaming}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={renaming}>
              {renaming && <Loader2 size={16} className="animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
