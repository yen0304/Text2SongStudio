'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PromptEditor } from '@/components/PromptEditor';
import { AudioPlayer } from '@/components/AudioPlayer';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu } from 'lucide-react';
import { modelsApi, type ModelConfig } from '@/lib/api';

type GenerateMode = 'single' | 'ab-compare';

export default function GeneratePage() {
  const [mode, setMode] = useState<GenerateMode>('single');
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [audioSamples, setAudioSamples] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<ModelConfig | null>(null);

  useEffect(() => {
    modelsApi.getCurrent().then(setCurrentModel).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate"
        description="Create audio samples from text prompts"
        actions={
          <div className="flex items-center gap-4">
            {currentModel && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                <Cpu className="h-3.5 w-3.5" />
                <span>{currentModel.display_name}</span>
              </Badge>
            )}
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={mode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('single')}
              >
                Single
              </Button>
              <Button
                variant={mode === 'ab-compare' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('ab-compare')}
              >
                A/B Compare
              </Button>
            </div>
          </div>
        }
      />

      {mode === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PromptEditor
              onPromptCreated={(promptId) => setCurrentPromptId(promptId)}
              onSamplesGenerated={(samples) => setAudioSamples(samples)}
            />
          </div>

          <div className="space-y-6">
            {audioSamples.length > 0 ? (
              <>
                {currentPromptId && (
                  <Card>
                    <CardContent className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">Current Prompt</span>
                      <FavoriteButton
                        targetType="prompt"
                        targetId={currentPromptId}
                        size="sm"
                      />
                    </CardContent>
                  </Card>
                )}
                <AudioPlayer audioIds={audioSamples} />
                <FeedbackPanel audioIds={audioSamples} promptId={currentPromptId} />
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  Generated audio samples will appear here
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              A/B Compare mode allows you to generate samples with two different adapters
              and compare them side by side.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/ab-tests'}>
              Go to A/B Tests
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
