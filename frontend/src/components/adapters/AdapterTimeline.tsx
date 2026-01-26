'use client';

import { AdapterTimeline, AdapterTimelineEvent } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Package,
} from 'lucide-react';

interface TimelineProps {
  timeline: AdapterTimeline;
}

const eventTypeConfig: Record<string, { icon: React.ReactNode; bgColor: string; lineColor: string }> = {
  created: {
    icon: <Package size={16} />,
    bgColor: 'bg-purple-500',
    lineColor: 'from-purple-500',
  },
  version: {
    icon: <GitBranch size={16} />,
    bgColor: 'bg-blue-500',
    lineColor: 'from-blue-500',
  },
  training: {
    icon: <Zap size={16} />,
    bgColor: 'bg-orange-500',
    lineColor: 'from-orange-500',
  },
};

const trainingStatusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock size={12} />, color: 'bg-gray-500/10 text-gray-600' },
  running: { icon: <Clock size={12} className="animate-spin" />, color: 'bg-blue-500/10 text-blue-600' },
  completed: { icon: <CheckCircle size={12} />, color: 'bg-green-500/10 text-green-600' },
  failed: { icon: <XCircle size={12} />, color: 'bg-red-500/10 text-red-600' },
  cancelled: { icon: <XCircle size={12} />, color: 'bg-gray-500/10 text-gray-600' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TimelineEventItem({ event, isLast }: { event: AdapterTimelineEvent; isLast: boolean }) {
  const config = eventTypeConfig[event.type] || eventTypeConfig.created;

  return (
    <div className="relative pl-10 pb-8">
      {/* Connector Line */}
      {!isLast && (
        <div 
          className={`absolute left-[15px] top-8 w-0.5 h-full bg-gradient-to-b ${config.lineColor} to-transparent`}
        />
      )}
      
      {/* Event Icon */}
      <div className={`absolute left-0 w-8 h-8 rounded-full ${config.bgColor} text-white flex items-center justify-center`}>
        {config.icon}
      </div>
      
      {/* Event Content */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{event.title}</h4>
          <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
        </div>
        
        {event.description && (
          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
        )}
        
        {/* Event Metadata */}
        {event.type === 'version' && event.metadata && (
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
              v{event.metadata.version}
            </Badge>
            {event.metadata.is_active && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Active
              </Badge>
            )}
          </div>
        )}
        
        {event.type === 'training' && event.metadata && (
          <div className="flex flex-wrap gap-2 mt-2">
            {event.metadata.status && (
              <Badge 
                variant="secondary" 
                className={trainingStatusConfig[event.metadata.status]?.color || 'bg-gray-500/10'}
              >
                {trainingStatusConfig[event.metadata.status]?.icon}
                <span className="ml-1 capitalize">{event.metadata.status}</span>
              </Badge>
            )}
            {event.metadata.final_loss !== null && event.metadata.final_loss !== undefined && (
              <Badge variant="outline">
                Loss: {event.metadata.final_loss.toFixed(4)}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdapterTimelineView({ timeline }: TimelineProps) {
  if (timeline.events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolution Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No events recorded yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evolution Timeline</CardTitle>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline">{timeline.total_versions} versions</Badge>
          <Badge variant="outline">{timeline.total_training_runs} training runs</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {timeline.events.map((event, index) => (
            <TimelineEventItem 
              key={event.id} 
              event={event} 
              isLast={index === timeline.events.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
