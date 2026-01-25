'use client';

import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      style={style}
    />
  );
}

// Card skeleton for stats cards
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// Table skeleton with header and rows
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-6 w-32" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-4 w-48 mb-2" />
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-4">
        <div className="h-64 flex items-end gap-2 justify-evenly">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-8"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Pipeline skeleton
export function PipelineSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 p-6 rounded-lg border bg-card">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-1 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto mb-1" />
          <Skeleton className="h-6 w-8 mx-auto" />
        </div>
      ))}
    </div>
  );
}

// Audio player skeleton
export function AudioPlayerSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-2 w-full rounded-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Full page loading skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Activity feed skeleton
export function ActivityFeedSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-6 w-32" />
      </div>
      <div>
        {Array.from({ length: items }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
