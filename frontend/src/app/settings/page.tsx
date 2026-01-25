'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure system preferences and view status"
        breadcrumb={[{ label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server size={20} />
              System Status
            </CardTitle>
            <CardDescription>Current system health and resource usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">Backend API</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-muted-foreground" />
                <span className="text-sm">Database</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-muted-foreground" />
                <span className="text-sm">GPU Worker</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                Idle
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-muted-foreground" />
                <span className="text-sm">Storage</span>
              </div>
              <span className="text-sm text-muted-foreground">42 GB / 100 GB</span>
            </div>
          </CardContent>
        </Card>

        {/* Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={20} />
              Generation Defaults
            </CardTitle>
            <CardDescription>Default settings for audio generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Samples per Generation</label>
              <Input type="number" defaultValue={3} min={1} max={10} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Default Duration (seconds)</label>
              <Input type="number" defaultValue={10} min={5} max={30} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Default Temperature</label>
              <Input type="number" defaultValue={1.0} min={0.1} max={2.0} step={0.1} />
            </div>
            <Button className="w-full">Save Generation Settings</Button>
          </CardContent>
        </Card>

        {/* Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu size={20} />
              Model Configuration
            </CardTitle>
            <CardDescription>Base model and caching settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Base Model</label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                <option value="musicgen-small">MusicGen Small</option>
                <option value="musicgen-medium">MusicGen Medium</option>
                <option value="musicgen-large">MusicGen Large</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Model Cache Directory</label>
              <Input defaultValue="./model_cache" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable Model Caching</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <Button className="w-full" variant="outline">
              <RefreshCw size={16} className="mr-2" />
              Reload Model
            </Button>
          </CardContent>
        </Card>

        {/* Training Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={20} />
              Training Defaults
            </CardTitle>
            <CardDescription>Default training hyperparameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Learning Rate</label>
                <Input type="number" defaultValue={0.0001} step={0.00001} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Batch Size</label>
                <Input type="number" defaultValue={4} min={1} max={32} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Epochs</label>
                <Input type="number" defaultValue={10} min={1} max={100} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">LoRA Rank</label>
                <Input type="number" defaultValue={8} min={1} max={64} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Warmup Steps</label>
              <Input type="number" defaultValue={100} min={0} />
            </div>
            <Button className="w-full">Save Training Settings</Button>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts</CardTitle>
          <CardDescription>Quick access keys for common actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Toggle Sidebar</span>
              <kbd className="px-2 py-1 text-xs bg-background border rounded">⌘ + B</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Go to Generate</span>
              <kbd className="px-2 py-1 text-xs bg-background border rounded">⌘ + G</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Go to Jobs</span>
              <kbd className="px-2 py-1 text-xs bg-background border rounded">⌘ + J</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Go to Experiments</span>
              <kbd className="px-2 py-1 text-xs bg-background border rounded">⌘ + E</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Go to Adapters</span>
              <kbd className="px-2 py-1 text-xs bg-background border rounded">⌘ + A</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Search</span>
              <kbd className="px-2 py-1 text-xs bg-background border rounded">⌘ + K</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
