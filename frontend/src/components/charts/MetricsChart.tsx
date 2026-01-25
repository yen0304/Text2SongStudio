'use client';

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MetricPoint {
  step: number;
  loss?: number;
  val_loss?: number;
  lr?: number;
  [key: string]: number | undefined;
}

interface MetricsChartProps {
  data: MetricPoint[];
  title?: string;
  showLoss?: boolean;
  showValLoss?: boolean;
  showLR?: boolean;
}

const COLORS = {
  loss: '#3b82f6',
  val_loss: '#ef4444',
  lr: '#10b981',
};

export function MetricsChart({
  data,
  title = 'Training Metrics',
  showLoss = true,
  showValLoss = true,
  showLR = false,
}: MetricsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No metrics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="step"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              {showLoss && (
                <Line
                  type="monotone"
                  dataKey="loss"
                  stroke={COLORS.loss}
                  strokeWidth={2}
                  dot={false}
                  name="Training Loss"
                />
              )}
              {showValLoss && (
                <Line
                  type="monotone"
                  dataKey="val_loss"
                  stroke={COLORS.val_loss}
                  strokeWidth={2}
                  dot={false}
                  name="Validation Loss"
                />
              )}
              {showLR && (
                <Line
                  type="monotone"
                  dataKey="lr"
                  stroke={COLORS.lr}
                  strokeWidth={2}
                  dot={false}
                  name="Learning Rate"
                  yAxisId="right"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
