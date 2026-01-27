'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackHistory } from '@/components/FeedbackHistory';
import { Loader2 } from 'lucide-react';

function FeedbackHistoryContent() {
  const searchParams = useSearchParams();
  const audioId = searchParams.get('audio_id') || undefined;

  return <FeedbackHistory initialAudioId={audioId} />;
}

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback History"
        description="View and filter all feedback records"
        breadcrumb={[{ label: 'Feedback' }]}
      />
      
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <FeedbackHistoryContent />
      </Suspense>
    </div>
  );
}
