'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { experimentsApi } from '@/lib/api';
import type { RunMetricsResponse, MetricDataPoint } from '@/lib/api/types/experiments';
import { Loader2, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';

// Color palette for multiple runs
const RUN_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

// Metric display configuration
const METRIC_CONFIG: Record<string, { label: string; color: string; format: (v: number) => string }> = {
  loss: { label: 'Loss', color: '#3b82f6', format: (v) => v.toFixed(4) },
  learning_rate: { label: 'Learning Rate', color: '#10b981', format: (v) => v.toExponential(2) },
  grad_norm: { label: 'Gradient Norm', color: '#f59e0b', format: (v) => v.toFixed(3) },
  rewards_chosen: { label: 'Rewards (Chosen)', color: '#22c55e', format: (v) => v.toFixed(3) },
  rewards_rejected: { label: 'Rewards (Rejected)', color: '#ef4444', format: (v) => v.toFixed(3) },
};

export type MetricType = 'loss' | 'learning_rate' | 'grad_norm' | 'rewards_chosen' | 'rewards_rejected';

interface TrainingMetricsChartProps {
  /** Experiment ID */
  experimentId: string;
  /** Single run ID or array of run IDs for comparison */
  runIds: string | string[];
  /** Which metric to display */
  metricType?: MetricType;
  /** Height of the chart container */
  height?: string;
  /** Whether to poll for updates (for live training) */
  isLive?: boolean;
  /** Polling interval in milliseconds (default 3000) */
  pollInterval?: number;
  /** Optional class name */
  className?: string;
  /** Optional run names for legend (keyed by run ID) */
  runNames?: Record<string, string>;
  /** Show the metric selector */
  showMetricSelector?: boolean;
  /** Callback when metric type changes */
  onMetricTypeChange?: (type: MetricType) => void;
}

interface ChartDataPoint {
  step: number;
  [key: string]: number | undefined;
}

export function TrainingMetricsChart({
  experimentId,
  runIds,
  metricType = 'loss',
  height = '300px',
  isLive = false,
  pollInterval = 3000,
  className,
  runNames = {},
  showMetricSelector = false,
  onMetricTypeChange,
}: TrainingMetricsChartProps) {
  const [metricsData, setMetricsData] = useState<Record<string, RunMetricsResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(metricType);

  // Normalize runIds to array
  const runIdArray = useMemo(() => 
    Array.isArray(runIds) ? runIds : [runIds],
    [runIds]
  );

  // Fetch metrics for all runs
  const fetchMetrics = useCallback(async () => {
    try {
      const results: Record<string, RunMetricsResponse> = {};
      
      await Promise.all(
        runIdArray.map(async (runId) => {
          try {
            const data = await experimentsApi.getRunMetrics(experimentId, runId);
            results[runId] = data;
          } catch (err) {
            console.warn(`Failed to fetch metrics for run ${runId}:`, err);
            // Continue with other runs even if one fails
          }
        })
      );

      setMetricsData(results);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [experimentId, runIdArray]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  // Polling for live updates
  useEffect(() => {
    if (!isLive) return;

    const intervalId = setInterval(fetchMetrics, pollInterval);
    return () => clearInterval(intervalId);
  }, [isLive, pollInterval, fetchMetrics]);

  // Handle metric type changes
  useEffect(() => {
    setSelectedMetric(metricType);
  }, [metricType]);

  const handleMetricChange = (type: MetricType) => {
    setSelectedMetric(type);
    onMetricTypeChange?.(type);
  };

  // Transform data for Recharts
  const chartData = useMemo(() => {
    const stepMap = new Map<number, ChartDataPoint>();

    runIdArray.forEach((runId, index) => {
      const runMetrics = metricsData[runId]?.metrics[selectedMetric];
      if (!runMetrics) return;

      const dataKey = runIdArray.length > 1 ? `run_${index}` : 'value';

      runMetrics.forEach((point: MetricDataPoint) => {
        const existing = stepMap.get(point.step) || { step: point.step };
        existing[dataKey] = point.value;
        stepMap.set(point.step, existing);
      });
    });

    // Sort by step
    return Array.from(stepMap.values()).sort((a, b) => a.step - b.step);
  }, [metricsData, runIdArray, selectedMetric]);

  // Get available metrics for selector (exclude epoch since X-axis is already epoch)
  const availableMetrics = useMemo(() => {
    const available = new Set<string>();
    
    Object.values(metricsData).forEach((data) => {
      Object.keys(data.metrics).forEach((key) => {
        // Exclude 'epoch' since the X-axis is already epoch-based
        if (key !== 'epoch' && data.metrics[key]?.length) {
          available.add(key);
        }
      });
    });

    return Array.from(available) as MetricType[];
  }, [metricsData]);

  // Check if any run has data
  const hasData = chartData.length > 0;
  const hasMetrics = Object.keys(metricsData).length > 0;

  // Get latest value for display
  const latestValue = useMemo(() => {
    if (!chartData.length) return null;
    const lastPoint = chartData[chartData.length - 1];
    const key = runIdArray.length > 1 ? 'run_0' : 'value';
    return lastPoint[key];
  }, [chartData, runIdArray]);

  // Loading state
  if (loading) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-zinc-900/50 rounded-lg', className)}
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading metrics...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-zinc-900/50 rounded-lg', className)}
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // No data state
  if (!hasMetrics || !hasData) {
    return (
      <div 
        className={cn('flex flex-col items-center justify-center bg-zinc-900/50 rounded-lg', className)}
        style={{ height }}
      >
        <BarChart3 className="h-8 w-8 text-zinc-600 mb-2" />
        <p className="text-zinc-400 text-sm">No metrics available yet</p>
        {isLive && (
          <p className="text-zinc-500 text-xs mt-1">Metrics will appear as training progresses</p>
        )}
      </div>
    );
  }

  const config = METRIC_CONFIG[selectedMetric] || { 
    label: selectedMetric, 
    color: '#3b82f6', 
    format: (v: number) => v.toFixed(4) 
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header with metric selector and current value */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 rounded-t-lg border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-4 w-4 text-zinc-400" />
          {showMetricSelector && availableMetrics.length > 1 ? (
            <select
              value={selectedMetric}
              onChange={(e) => handleMetricChange(e.target.value as MetricType)}
              className="bg-zinc-700 text-zinc-200 text-sm rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-500"
            >
              {availableMetrics.map((metric) => (
                <option key={metric} value={metric}>
                  {METRIC_CONFIG[metric]?.label || metric}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-medium text-zinc-200">{config.label}</span>
          )}
          {isLive && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        {latestValue !== null && latestValue !== undefined && (
          <div className="text-sm">
            <span className="text-zinc-400">Latest: </span>
            <span className="font-mono text-zinc-200">{config.format(latestValue)}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-b-lg p-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <XAxis
              dataKey="step"
              tick={{ fontSize: 11, fill: '#374151' }}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              label={{ value: 'Epoch', position: 'bottom', offset: -5, fill: '#374151', fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#374151' }}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(value) => config.format(value)}
              label={{ 
                value: config.label, 
                angle: -90, 
                position: 'insideLeft', 
                fill: '#374151',
                fontSize: 11,
                offset: 10
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#374151' }}
              formatter={(value: number, name: string) => {
                const runIndex = name.startsWith('run_') ? parseInt(name.split('_')[1]) : null;
                const runId = runIndex !== null ? runIdArray[runIndex] : null;
                const displayName = runId && runIndex !== null 
                  ? (runNames[runId] || `Run ${runIndex + 1}`) 
                  : config.label;
                return [config.format(value), displayName];
              }}
              labelFormatter={(step) => `Epoch ${step}`}
            />
            {runIdArray.length > 1 && (
              <Legend
                formatter={(value) => {
                  const runIndex = parseInt(value.split('_')[1]);
                  const runId = runIdArray[runIndex];
                  return runNames[runId] || `Run ${runIndex + 1}`;
                }}
              />
            )}
            {runIdArray.length === 1 ? (
              <Line
                type="monotone"
                dataKey="value"
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: config.color }}
                isAnimationActive={false}
              />
            ) : (
              runIdArray.map((_, index) => (
                <Line
                  key={`run_${index}`}
                  type="monotone"
                  dataKey={`run_${index}`}
                  stroke={RUN_COLORS[index % RUN_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
