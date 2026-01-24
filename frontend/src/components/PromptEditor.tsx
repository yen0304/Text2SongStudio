'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type Adapter, type PromptAttributes } from '@/lib/api';

const STYLE_OPTIONS = [
  { value: '', label: 'Any style' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'classical', label: 'Classical' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'rock', label: 'Rock' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'pop', label: 'Pop' },
];

const MOOD_OPTIONS = [
  { value: '', label: 'Any mood' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'peaceful', label: 'Peaceful' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'uplifting', label: 'Uplifting' },
  { value: 'dark', label: 'Dark' },
];

interface PromptEditorProps {
  onPromptCreated: (promptId: string) => void;
  onSamplesGenerated: (audioIds: string[]) => void;
}

export function PromptEditor({ onPromptCreated, onSamplesGenerated }: PromptEditorProps) {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('');
  const [mood, setMood] = useState('');
  const [tempo, setTempo] = useState(120);
  const [instrumentation, setInstrumentation] = useState('');
  const [numSamples, setNumSamples] = useState(2);
  const [selectedAdapter, setSelectedAdapter] = useState('');
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listAdapters().then(setAdapters).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter a prompt description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setJobStatus('Creating prompt...');

    try {
      const attributes: PromptAttributes = {};
      if (style) attributes.style = style;
      if (mood) attributes.mood = mood;
      if (tempo) attributes.tempo = tempo;
      if (instrumentation) {
        attributes.instrumentation = instrumentation.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const prompt = await api.createPrompt({ text, attributes });
      onPromptCreated(prompt.id);

      setJobStatus('Submitting generation job...');
      const job = await api.submitGeneration({
        prompt_id: prompt.id,
        num_samples: numSamples,
        adapter_id: selectedAdapter || undefined,
      });

      setJobStatus('Generating audio...');
      await pollJobStatus(job.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
      setJobStatus(null);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const job = await api.getJobStatus(jobId);

      if (job.status === 'completed' && job.audio_ids) {
        onSamplesGenerated(job.audio_ids);
        return;
      }

      if (job.status === 'failed') {
        throw new Error(job.error || 'Generation failed');
      }

      if (job.progress) {
        setJobStatus(`Generating... ${Math.round(job.progress * 100)}%`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Generation timed out');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Music</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            placeholder="Describe the music you want to create... e.g., 'An upbeat electronic track with synth leads and a driving bassline'"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground mt-1">{text.length}/2000 characters</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <Select options={STYLE_OPTIONS} value={style} onChange={(e) => setStyle(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mood</label>
            <Select options={MOOD_OPTIONS} value={mood} onChange={(e) => setMood(e.target.value)} />
          </div>
        </div>

        <div>
          <Slider
            label="Tempo (BPM)"
            min={40}
            max={200}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Instrumentation</label>
          <Input
            placeholder="e.g., piano, drums, synth (comma-separated)"
            value={instrumentation}
            onChange={(e) => setInstrumentation(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Number of samples</label>
            <Select
              options={[
                { value: '1', label: '1 sample' },
                { value: '2', label: '2 samples' },
                { value: '4', label: '4 samples' },
              ]}
              value={String(numSamples)}
              onChange={(e) => setNumSamples(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LoRA Adapter</label>
            <Select
              options={[
                { value: '', label: 'None (base model)' },
                ...adapters.filter((a) => a.is_active).map((a) => ({
                  value: a.id,
                  label: `${a.name} v${a.version}`,
                })),
              ]}
              value={selectedAdapter}
              onChange={(e) => setSelectedAdapter(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? jobStatus || 'Generating...' : 'Generate Music'}
        </Button>
      </CardContent>
    </Card>
  );
}
