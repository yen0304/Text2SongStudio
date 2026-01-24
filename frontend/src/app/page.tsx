'use client';

import { useState } from 'react';
import { PromptEditor } from '@/components/PromptEditor';
import { AudioPlayer } from '@/components/AudioPlayer';
import { FeedbackPanel } from '@/components/FeedbackPanel';

export default function Home() {
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [audioSamples, setAudioSamples] = useState<string[]>([]);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Text2Song Studio</h1>
        <p className="text-sm text-muted-foreground">
          Human-in-the-loop text-to-music generation
        </p>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PromptEditor
              onPromptCreated={(promptId) => setCurrentPromptId(promptId)}
              onSamplesGenerated={(samples) => setAudioSamples(samples)}
            />
          </div>

          <div className="space-y-6">
            {audioSamples.length > 0 && (
              <>
                <AudioPlayer audioIds={audioSamples} />
                <FeedbackPanel audioIds={audioSamples} />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
