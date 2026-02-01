'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdapterTimelineView, AdapterConfigTab } from '@/components/adapters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adaptersApi, AdapterDetail, AdapterTimeline, AdapterVersion } from '@/lib/api';
import {
  Loader2,
  ArrowLeft,
  Plus,
  GitBranch,
  Zap,
  Archive,
  Check,
  Settings,
  Trash2,
  Pencil,
  X,
  LayoutDashboard,
} from 'lucide-react';

export default function AdapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adapterId = params.id as string;
  
  const [adapter, setAdapter] = useState<AdapterDetail | null>(null);
  const [timeline, setTimeline] = useState<AdapterTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({ version: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Rename state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [adapterData, timelineData] = await Promise.all([
        adaptersApi.get(adapterId),
        adaptersApi.getTimeline(adapterId),
      ]);
      setAdapter(adapterData);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Failed to fetch adapter:', error);
    } finally {
      setLoading(false);
    }
  }, [adapterId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.version.trim()) return;
    
    setCreatingVersion(true);
    try {
      await adaptersApi.createVersion(adapterId, {
        version: newVersion.version,
        description: newVersion.description || undefined,
      });
      setShowVersionForm(false);
      setNewVersion({ version: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create version:', error);
    } finally {
      setCreatingVersion(false);
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    try {
      await adaptersApi.activateVersion(adapterId, versionId);
      fetchData();
    } catch (error) {
      console.error('Failed to activate version:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await adaptersApi.update(adapterId, {
        status: adapter?.status === 'active' ? 'archived' : 'active'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update adapter:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }

    setDeleting(true);
    try {
      await adaptersApi.delete(adapterId);
      router.push('/adapters');
    } catch (error) {
      console.error('Failed to delete adapter:', error);
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const startEditingName = () => {
    if (adapter) {
      setEditedName(adapter.name);
      setNameError(null);
      setIsEditingName(true);
    }
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditedName('');
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

  const handleSaveName = async () => {
    const trimmedName = editedName.trim();
    const error = validateName(trimmedName);
    if (error) {
      setNameError(error);
      return;
    }

    if (trimmedName === adapter?.name) {
      cancelEditingName();
      return;
    }

    setSavingName(true);
    try {
      await adaptersApi.update(adapterId, { name: trimmedName });
      setAdapter(prev => prev ? { ...prev, name: trimmedName } : null);
      setIsEditingName(false);
      setEditedName('');
    } catch (error) {
      console.error('Failed to rename adapter:', error);
      setNameError('Failed to save name');
    } finally {
      setSavingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!adapter) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Adapter not found</p>
        <Button variant="outline" onClick={() => router.push('/adapters')}>
          Back to Adapters
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isEditingName ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => {
                      setEditedName(e.target.value);
                      setNameError(null);
                    }}
                    onKeyDown={handleNameKeyDown}
                    className="h-8 text-lg font-semibold w-64"
                    autoFocus
                    disabled={savingName}
                    maxLength={100}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveName}
                    disabled={savingName}
                  >
                    {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEditingName}
                    disabled={savingName}
                  >
                    <X size={16} />
                  </Button>
                </div>
                {nameError && (
                  <span className="text-xs text-destructive mt-1">{nameError}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditingName}>
              <span>{adapter.name}</span>
              <Pencil size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )
        }
        description={adapter.description || undefined}
        breadcrumb={[
          { label: 'Adapters', href: '/adapters' },
          { label: adapter.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/adapters')}>
              <ArrowLeft size={16} />
              <span className="ml-2">Back</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              {adapter.status === 'active' ? <Archive size={16} /> : <Zap size={16} />}
              <span className="ml-2">{adapter.status === 'active' ? 'Archive' : 'Reactivate'}</span>
            </Button>
            <Button
              variant={deleteConfirm ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={16} />
              <span className="ml-2">{deleteConfirm ? 'Click to confirm' : 'Delete'}</span>
            </Button>
            <Button onClick={() => setShowVersionForm(!showVersionForm)}>
              <Plus size={16} />
              <span className="ml-2">New Version</span>
            </Button>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Base Model</div>
            <Badge variant="outline">{adapter.base_model}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Current Version</div>
            <div className="font-bold">
              {adapter.current_version ? `v${adapter.current_version}` : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Versions</div>
            <div className="font-bold">{adapter.versions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
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
          </CardContent>
        </Card>
      </div>

      {/* Create Version Form */}
      {showVersionForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Version</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVersion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Version</label>
                  <Input
                    placeholder="e.g., 1.0.0"
                    value={newVersion.version}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                    pattern="\d+\.\d+\.\d+"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Format: x.y.z (e.g., 1.0.0)</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Input
                    placeholder="What changed in this version"
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowVersionForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingVersion || !newVersion.version.trim()}>
                  {creatingVersion && <Loader2 size={16} className="animate-spin mr-2" />}
                  Create Version
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Overview and Configuration */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings size={16} />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Versions List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch size={20} />
                  Versions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {adapter.versions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="mb-4">No versions created yet</p>
                    <Button onClick={() => setShowVersionForm(true)} variant="outline" size="sm">
                      Create First Version
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {adapter.versions.map((version) => (
                      <div
                        key={version.id}
                        className={`p-4 ${version.is_active ? 'bg-green-500/5' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">v{version.version}</span>
                            {version.is_active && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                <Check size={12} className="mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          {!version.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateVersion(version.id)}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                        {version.description && (
                          <p className="text-sm text-muted-foreground mt-1">{version.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Created {new Date(version.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Config Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  Quick Config
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adapter.training_config ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Learning Rate</span>
                      <span className="font-mono">{adapter.training_config.learning_rate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LoRA Rank</span>
                      <span className="font-mono">{adapter.training_config.lora_r}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Epochs</span>
                      <span className="font-mono">{adapter.training_config.num_epochs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch Size</span>
                      <span className="font-mono">{adapter.training_config.batch_size}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs"
                        onClick={() => {
                          const tabsList = document.querySelector('[data-state="active"][value="overview"]');
                          const configTab = document.querySelector('[value="configuration"]') as HTMLButtonElement;
                          configTab?.click();
                        }}
                      >
                        View full configuration →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No training configuration available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          {timeline && <AdapterTimelineView timeline={timeline} />}
        </TabsContent>

        <TabsContent value="configuration">
          <AdapterConfigTab trainingConfig={adapter.training_config} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
