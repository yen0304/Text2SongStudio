'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { abTestsApi, adaptersApi, ABTest, Adapter } from '@/lib/api';
import {
  Loader2,
  Plus,
  GitCompare,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  draft: { icon: <Clock size={14} />, color: 'bg-gray-500/10 text-gray-600', label: 'Draft' },
  generating: { icon: <Loader2 size={14} className="animate-spin" />, color: 'bg-blue-500/10 text-blue-600', label: 'Generating' },
  active: { icon: <Play size={14} />, color: 'bg-green-500/10 text-green-600', label: 'Active' },
  completed: { icon: <CheckCircle size={14} />, color: 'bg-purple-500/10 text-purple-600', label: 'Completed' },
};

export default function ABTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    adapter_a_id: '',
    adapter_b_id: '',
  });

  const fetchData = async () => {
    try {
      const [testsData, adaptersData] = await Promise.all([
        abTestsApi.list(),
        adaptersApi.list(),
      ]);
      setTests(testsData.items);
      setAdapters(adaptersData.items);
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.name.trim()) return;
    
    setCreating(true);
    try {
      const result = await abTestsApi.create({
        name: newTest.name,
        description: newTest.description || undefined,
        adapter_a_id: newTest.adapter_a_id || undefined,
        adapter_b_id: newTest.adapter_b_id || undefined,
        prompt_ids: [],
      });
      setShowCreateForm(false);
      setNewTest({ name: '', description: '', adapter_a_id: '', adapter_b_id: '' });
      router.push(`/ab-tests/${result.id}`);
    } catch (error) {
      console.error('Failed to create A/B test:', error);
    } finally {
      setCreating(false);
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
        title="A/B Tests"
        description="Compare adapter performance through blind listening tests"
        breadcrumb={[{ label: 'A/B Tests' }]}
        actions={
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus size={16} />
            <span className="ml-2">New A/B Test</span>
          </Button>
        }
      />

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create A/B Test</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Test Name</label>
                  <Input
                    placeholder="e.g., Jazz vs Rock Style"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Input
                    placeholder="What are you comparing?"
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Adapter A (Control)</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newTest.adapter_a_id}
                    onChange={(e) => setNewTest({ ...newTest, adapter_a_id: e.target.value })}
                  >
                    <option value="">Base Model (No Adapter)</option>
                    {adapters.map((adapter) => (
                      <option key={adapter.id} value={adapter.id}>
                        {adapter.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Adapter B (Variant)</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newTest.adapter_b_id}
                    onChange={(e) => setNewTest({ ...newTest, adapter_b_id: e.target.value })}
                  >
                    <option value="">Base Model (No Adapter)</option>
                    {adapters.map((adapter) => (
                      <option key={adapter.id} value={adapter.id}>
                        {adapter.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !newTest.name.trim()}>
                  {creating && <Loader2 size={16} className="animate-spin mr-2" />}
                  Create Test
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All A/B Tests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tests.length === 0 ? (
            <div className="py-12 text-center">
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No A/B tests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a test to compare different adapters side by side
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus size={16} className="mr-2" />
                Create First Test
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Adapters</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Progress</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Results</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => {
                  const config = statusConfig[test.status] || statusConfig.draft;
                  const progress = test.total_pairs > 0 
                    ? Math.round((test.completed_pairs / test.total_pairs) * 100)
                    : 0;
                  
                  return (
                    <tr
                      key={test.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/ab-tests/${test.id}`)}
                    >
                      <td className="p-4">
                        <div className="font-medium">{test.name}</div>
                        {test.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {test.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {test.adapter_a_name || 'Base Model'}
                          </Badge>
                          <span className="text-muted-foreground">vs</span>
                          <Badge variant="outline" className="text-xs">
                            {test.adapter_b_name || 'Base Model'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {test.completed_pairs}/{test.total_pairs}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={config.color}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        {test.results && test.completed_pairs > 0 ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className={test.results.a_preferred > test.results.b_preferred ? 'font-bold text-green-600' : ''}>
                              A: {test.results.a_preferred}
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className={test.results.b_preferred > test.results.a_preferred ? 'font-bold text-green-600' : ''}>
                              B: {test.results.b_preferred}
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-muted-foreground">
                              Tie: {test.results.equal}
                            </span>
                          </div>
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
                            router.push(`/ab-tests/${test.id}`);
                          }}
                        >
                          View
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
    </div>
  );
}
