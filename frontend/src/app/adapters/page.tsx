'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adaptersApi, Adapter } from '@/lib/api';
import {
  Loader2,
  Plus,
  Package,
  Archive,
  GitBranch,
  Zap,
  Trash2,
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
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdapter, setNewAdapter] = useState({ name: '', description: '', base_model: 'musicgen-small' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdapter.name.trim()) return;

    setCreating(true);
    try {
      await adaptersApi.create({
        name: newAdapter.name,
        description: newAdapter.description || undefined,
        base_model: newAdapter.base_model,
      });
      setShowCreateForm(false);
      setNewAdapter({ name: '', description: '', base_model: 'musicgen-small' });
      fetchAdapters();
    } catch (error) {
      console.error('Failed to create adapter:', error);
    } finally {
      setCreating(false);
    }
  };

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
        description="Manage LoRA adapters and their version history"
        breadcrumb={[{ label: 'Adapters' }]}
        actions={
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus size={16} />
            <span className="ml-2">New Adapter</span>
          </Button>
        }
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

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Adapter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    placeholder="e.g., jazz-style-v2"
                    value={newAdapter.name}
                    onChange={(e) => setNewAdapter({ ...newAdapter, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Base Model</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newAdapter.base_model}
                    onChange={(e) => setNewAdapter({ ...newAdapter, base_model: e.target.value })}
                  >
                    <option value="musicgen-small">MusicGen Small</option>
                    <option value="musicgen-medium">MusicGen Medium</option>
                    <option value="musicgen-large">MusicGen Large</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Input
                  placeholder="Brief description of the adapter"
                  value={newAdapter.description}
                  onChange={(e) => setNewAdapter({ ...newAdapter, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !newAdapter.name.trim()}>
                  {creating && <Loader2 size={16} className="animate-spin mr-2" />}
                  Create Adapter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
              <p className="text-sm text-muted-foreground mb-4">
                Create your first LoRA adapter to customize model behavior
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus size={16} className="mr-2" />
                Create First Adapter
              </Button>
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
    </div>
  );
}
