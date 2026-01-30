'use client';

import { ExperimentRun } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrainingMetricsChart } from '@/components/training/TrainingMetricsChart';
import { X, TrendingUp, TrendingDown, Minus, Trophy, Clock, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface RunComparisonProps {
  runs: ExperimentRun[];
  experimentId: string;
  bestRunId?: string | null;
  onClose: () => void;
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '-';
  
  // Backend returns UTC times without timezone suffix
  // Append 'Z' if not present to ensure correct UTC parsing
  const normalizeToUTC = (dateStr: string) => {
    if (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('-', 10)) {
      return dateStr;
    }
    return dateStr + 'Z';
  };
  
  const startDate = new Date(normalizeToUTC(start));
  const endDate = end ? new Date(normalizeToUTC(end)) : new Date();
  
  const diffMs = endDate.getTime() - startDate.getTime();
  
  // Handle edge cases: negative or very small differences
  if (diffMs < 0) return '-';
  if (diffMs < 60000) return '<1m';
  
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

function getComparisonIndicator(value: number | null, bestValue: number | null, lowerIsBetter = true) {
  if (value === null || bestValue === null) return null;
  
  const isBest = lowerIsBetter ? value <= bestValue : value >= bestValue;
  const diff = lowerIsBetter ? bestValue - value : value - bestValue;
  const percentDiff = bestValue !== 0 ? Math.abs(diff / bestValue) * 100 : 0;
  
  if (Math.abs(diff) < 0.0001) {
    return { icon: <Trophy size={14} className="text-yellow-500" />, label: 'Best', color: 'text-yellow-600' };
  } else if (isBest) {
    return { icon: <TrendingUp size={14} />, label: `${percentDiff.toFixed(1)}% better`, color: 'text-green-600' };
  } else {
    return { icon: <TrendingDown size={14} />, label: `${percentDiff.toFixed(1)}% worse`, color: 'text-red-600' };
  }
}

// Mobile card view for a single run
function RunCard({ run, bestRunId, bestLoss }: { run: ExperimentRun; bestRunId: string | null | undefined; bestLoss: number | null }) {
  const [expanded, setExpanded] = useState(false);
  const isBest = bestRunId === run.id;
  const lossIndicator = getComparisonIndicator(run.final_loss, bestLoss, true);

  return (
    <Card className={isBest ? 'border-yellow-500/50' : ''}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{run.name || run.id.slice(0, 8)}</span>
            {isBest && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                <Trophy size={12} className="mr-1" />
                Best
              </Badge>
            )}
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Final Loss</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">
              {run.final_loss !== null ? run.final_loss.toFixed(4) : '-'}
            </span>
            {lossIndicator && (
              <span className={`flex items-center gap-1 text-xs ${lossIndicator.color}`}>
                {lossIndicator.icon}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            variant="secondary"
            className={
              run.status === 'completed' ? 'bg-green-500/10 text-green-600' :
              run.status === 'running' ? 'bg-blue-500/10 text-blue-600' :
              run.status === 'failed' ? 'bg-red-500/10 text-red-600' :
              'bg-gray-500/10 text-gray-600'
            }
          >
            {run.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Duration</span>
          <span className="text-sm">{formatDuration(run.started_at, run.completed_at)}</span>
        </div>
        
        {expanded && run.metrics && Object.keys(run.metrics).length > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {Object.entries(run.metrics).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm font-mono">
                  {typeof value === 'number' ? value.toFixed(4) : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RunComparison({ runs, experimentId, bestRunId, onClose }: RunComparisonProps) {
  if (runs.length === 0) {
    return null;
  }

  // Find best loss among selected runs
  const validLosses = runs.filter(r => r.final_loss !== null).map(r => r.final_loss as number);
  const bestLoss = validLosses.length > 0 ? Math.min(...validLosses) : null;

  // Extract common metrics from runs
  const allMetricKeys = new Set<string>();
  runs.forEach(run => {
    if (run.metrics) {
      Object.keys(run.metrics).forEach(key => allMetricKeys.add(key));
    }
  });
  const metricKeys = Array.from(allMetricKeys).filter(k => k !== 'loss');

  // Build run names map
  const runNames = runs.reduce((acc, run) => {
    acc[run.id] = run.name || run.id.slice(0, 8);
    return acc;
  }, {} as Record<string, string>);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            <span className="hidden sm:inline">Run Comparison ({runs.length} runs)</span>
            <span className="sm:hidden">Compare ({runs.length})</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile: Stacked card view */}
        <div className="md:hidden space-y-4">
          {runs.map(run => (
            <RunCard key={run.id} run={run} bestRunId={bestRunId} bestLoss={bestLoss} />
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-card">Metric</th>
                {runs.map(run => (
                  <th key={run.id} className="text-left p-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[120px]">{run.name || run.id.slice(0, 8)}</span>
                      {bestRunId === run.id && (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                          <Trophy size={12} className="mr-1" />
                          Best
                        </Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Status Row */}
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground sticky left-0 bg-card">Status</td>
                {runs.map(run => (
                  <td key={run.id} className="p-3">
                    <Badge
                      variant="secondary"
                      className={
                        run.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                        run.status === 'running' ? 'bg-blue-500/10 text-blue-600' :
                        run.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                        'bg-gray-500/10 text-gray-600'
                      }
                    >
                      {run.status}
                    </Badge>
                  </td>
                ))}
              </tr>
              
              {/* Final Loss Row */}
              <tr className="border-b border-border/50 bg-muted/30">
                <td className="p-3 font-medium sticky left-0 bg-muted/30">Final Loss</td>
                {runs.map(run => {
                  const indicator = getComparisonIndicator(run.final_loss, bestLoss, true);
                  return (
                    <td key={run.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">
                          {run.final_loss !== null ? run.final_loss.toFixed(4) : '-'}
                        </span>
                        {indicator && (
                          <span className={`flex items-center gap-1 text-xs ${indicator.color}`}>
                            {indicator.icon}
                            {indicator.label}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Duration Row */}
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground sticky left-0 bg-card flex items-center gap-2">
                  <Clock size={14} />
                  Duration
                </td>
                {runs.map(run => (
                  <td key={run.id} className="p-3 text-muted-foreground">
                    {formatDuration(run.started_at, run.completed_at)}
                  </td>
                ))}
              </tr>

              {/* Dynamic Metrics Rows */}
              {metricKeys.map(key => {
                const values = runs.map(r => (r.metrics as Record<string, number | null>)?.[key] ?? null);
                const validValues = values.filter((v): v is number => v !== null);
                const bestValue = validValues.length > 0 ? Math.min(...validValues) : null;
                
                return (
                  <tr key={key} className="border-b border-border/50">
                    <td className="p-3 text-muted-foreground capitalize sticky left-0 bg-card">
                      {key.replace(/_/g, ' ')}
                    </td>
                    {runs.map((run, idx) => {
                      const value = values[idx];
                      const indicator = value !== null ? getComparisonIndicator(value, bestValue, true) : null;
                      return (
                        <td key={run.id} className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {value !== null ? (typeof value === 'number' ? value.toFixed(4) : String(value)) : '-'}
                            </span>
                            {indicator && (
                              <span className={`flex items-center gap-1 text-xs ${indicator.color}`}>
                                {indicator.icon}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Adapter Row */}
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground sticky left-0 bg-card">Adapter</td>
                {runs.map(run => (
                  <td key={run.id} className="p-3">
                    {run.adapter_id ? (
                      <a href="/adapters" className="text-primary hover:underline text-sm">
                        View Adapter
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Started At Row */}
              <tr>
                <td className="p-3 text-muted-foreground sticky left-0 bg-card">Started</td>
                {runs.map(run => (
                  <td key={run.id} className="p-3 text-sm text-muted-foreground">
                    {run.started_at ? new Date(run.started_at).toLocaleString() : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Loss Comparison Chart */}
        {runs.length >= 2 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Loss Comparison</h4>
            <TrainingMetricsChart
              experimentId={experimentId}
              runIds={runs.map(r => r.id)}
              metricType="loss"
              height="300px"
              isLive={false}
              runNames={runNames}
              showMetricSelector={true}
            />
          </div>
        )}

        {/* Summary */}
        {runs.length >= 2 && bestLoss !== null && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <p className="text-sm text-muted-foreground">
              {runs.find(r => r.final_loss === bestLoss)?.name || 'Best run'} achieved the lowest loss 
              of <span className="font-mono font-semibold text-foreground">{bestLoss.toFixed(4)}</span>
              {validLosses.length > 1 && (
                <>, which is{' '}
                <span className="font-semibold text-green-600">
                  {(((Math.max(...validLosses) - bestLoss) / Math.max(...validLosses)) * 100).toFixed(1)}%
                </span>{' '}
                better than the worst performing run.</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}