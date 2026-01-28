'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfigCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

/**
 * Card component for grouping related configuration parameters
 * Used in the adapter configuration tab for workstation-style layout
 */
export function ConfigCard({ title, icon, children }: ConfigCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
