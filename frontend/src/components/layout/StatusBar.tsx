'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';

interface StatusData {
  activeJobs: number;
  pendingFeedback: number;
}

export function StatusBar() {
  const [status, setStatus] = useState<StatusData>({ activeJobs: 0, pendingFeedback: 0 });

  const fetchStatus = async () => {
    try {
      const data = await api.getOverviewMetrics();
      setStatus({
        activeJobs: data.pipeline.generation.active,
        pendingFeedback: data.pipeline.feedback.pending,
      });
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="flex items-center justify-between h-8 px-4 bg-muted/50 border-t border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <Link
          href="/jobs?status=processing"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <Activity size={14} className={status.activeJobs > 0 ? 'text-green-500 animate-pulse' : ''} />
          <span>Active Jobs: {status.activeJobs}</span>
        </Link>
        <Link
          href="/jobs"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <MessageSquare size={14} />
          <span>Pending Feedback: {status.pendingFeedback}</span>
        </Link>
      </div>
      <div className="text-muted-foreground/70">
        Text2Song Studio v0.1.0
      </div>
    </footer>
  );
}
