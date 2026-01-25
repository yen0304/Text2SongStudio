'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

const INSTRUMENT_CATEGORIES = [
  {
    id: 'keys',
    label: '🎹 Keys',
    instruments: [
      { value: 'acoustic-piano', label: 'Acoustic Piano' },
      { value: 'electric-piano', label: 'Electric Piano' },
      { value: 'organ', label: 'Organ' },
      { value: 'clavinet', label: 'Clavinet' },
      { value: 'celesta', label: 'Celesta' },
    ],
  },
  {
    id: 'strings',
    label: '🎸 Strings',
    instruments: [
      { value: 'acoustic-guitar', label: 'Acoustic Guitar' },
      { value: 'electric-guitar-clean', label: 'Electric Guitar (Clean)' },
      { value: 'electric-guitar-distorted', label: 'Electric Guitar (Distorted)' },
      { value: 'bass-guitar', label: 'Bass Guitar' },
      { value: 'synth-bass', label: 'Synth Bass' },
      { value: 'violin', label: 'Violin' },
      { value: 'viola', label: 'Viola' },
      { value: 'cello', label: 'Cello' },
      { value: 'double-bass', label: 'Double Bass' },
      { value: 'harp', label: 'Harp' },
    ],
  },
  {
    id: 'drums',
    label: '🥁 Drums & Percussion',
    instruments: [
      { value: 'acoustic-drum-kit', label: 'Acoustic Drum Kit' },
      { value: 'electronic-drum-kit', label: 'Electronic Drum Kit' },
      { value: 'lofi-drum-kit', label: 'Lo-fi Drum Kit' },
      { value: '808-drums', label: '808 Drums' },
      { value: '909-drums', label: '909 Drums' },
      { value: 'kick-drum', label: 'Kick Drum' },
      { value: 'snare-drum', label: 'Snare Drum' },
      { value: 'hi-hat', label: 'Hi-hat' },
      { value: 'cymbals', label: 'Cymbals' },
      { value: 'toms', label: 'Toms' },
    ],
  },
  {
    id: 'brass-woodwind',
    label: '🎷 Brass & Woodwind',
    instruments: [
      { value: 'saxophone', label: 'Saxophone' },
      { value: 'trumpet', label: 'Trumpet' },
      { value: 'trombone', label: 'Trombone' },
      { value: 'french-horn', label: 'French Horn' },
      { value: 'flute', label: 'Flute' },
      { value: 'piccolo', label: 'Piccolo' },
      { value: 'clarinet', label: 'Clarinet' },
      { value: 'oboe', label: 'Oboe' },
      { value: 'bassoon', label: 'Bassoon' },
    ],
  },
  {
    id: 'synth',
    label: '🎛️ Synths & Electronic',
    instruments: [
      { value: 'analog-synth-lead', label: 'Analog Synth (Lead)' },
      { value: 'analog-synth-pad', label: 'Analog Synth (Pad)' },
      { value: 'digital-synth', label: 'Digital Synth' },
      { value: 'fm-synth', label: 'FM Synth' },
      { value: 'mono-synth-bass', label: 'Mono Synth Bass' },
      { value: 'poly-synth', label: 'Poly Synth' },
      { value: 'arpeggiator-synth', label: 'Arpeggiator Synth' },
    ],
  },
  {
    id: 'world',
    label: '🌍 World / Ethnic',
    instruments: [
      { value: 'acoustic-strings-ensemble', label: 'Strings Ensemble' },
      { value: 'taiko-drums', label: 'Taiko Drums' },
      { value: 'kalimba', label: 'Kalimba' },
      { value: 'sitar', label: 'Sitar' },
      { value: 'shamisen', label: 'Shamisen' },
      { value: 'erhu', label: 'Erhu' },
    ],
  },
  {
    id: 'texture',
    label: '🎧 Texture / FX',
    instruments: [
      { value: 'vocal-pad', label: 'Vocal Pad' },
      { value: 'choir', label: 'Choir (Ah / Oh)' },
      { value: 'breath-fx', label: 'Breath FX' },
      { value: 'vinyl-noise', label: 'Vinyl Noise' },
      { value: 'tape-saturation', label: 'Tape Saturation' },
      { value: 'ambient-noise', label: 'Ambient Noise' },
    ],
  },
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
  const [primaryInstruments, setPrimaryInstruments] = useState<string[]>([]);
  const [secondaryInstruments, setSecondaryInstruments] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [numSamples, setNumSamples] = useState(2);
  const [selectedAdapter, setSelectedAdapter] = useState('');
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleInstrument = (
    value: string,
    isPrimary: boolean
  ) => {
    if (isPrimary) {
      setPrimaryInstruments((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
      // Remove from secondary if adding to primary
      setSecondaryInstruments((prev) => prev.filter((v) => v !== value));
    } else {
      setSecondaryInstruments((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
      // Remove from primary if adding to secondary
      setPrimaryInstruments((prev) => prev.filter((v) => v !== value));
    }
  };

  useEffect(() => {
    api.listAdapters({ activeOnly: true }).then((response) => setAdapters(response.items)).catch(() => {});
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
      if (primaryInstruments.length > 0) {
        attributes.primary_instruments = primaryInstruments;
      }
      if (secondaryInstruments.length > 0) {
        attributes.secondary_instruments = secondaryInstruments;
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
          <p className="text-xs text-muted-foreground mb-3">
            Select primary (main) and secondary (supporting) instruments
          </p>
          <div className="space-y-2">
            {INSTRUMENT_CATEGORIES.map((category) => (
              <div key={category.id} className="border rounded-md">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  <span>{category.label}</span>
                  <span className="text-muted-foreground">
                    {expandedCategories.includes(category.id) ? '▼' : '▶'}
                  </span>
                </button>
                {expandedCategories.includes(category.id) && (
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                    {category.instruments.map((inst) => {
                      const isPrimary = primaryInstruments.includes(inst.value);
                      const isSecondary = secondaryInstruments.includes(inst.value);
                      return (
                        <div key={inst.value} className="flex items-center gap-2 text-sm">
                          <label className="flex items-center gap-1 cursor-pointer" title="Primary">
                            <input
                              type="checkbox"
                              checked={isPrimary}
                              onChange={() => toggleInstrument(inst.value, true)}
                              className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <span className="text-xs text-muted-foreground">P</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer" title="Secondary">
                            <input
                              type="checkbox"
                              checked={isSecondary}
                              onChange={() => toggleInstrument(inst.value, false)}
                              className="h-4 w-4 rounded border-input accent-secondary"
                            />
                            <span className="text-xs text-muted-foreground">S</span>
                          </label>
                          <span className={isPrimary ? 'font-medium' : isSecondary ? 'text-muted-foreground' : ''}>
                            {inst.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          {(primaryInstruments.length > 0 || secondaryInstruments.length > 0) && (
            <div className="mt-3 text-xs">
              {primaryInstruments.length > 0 && (
                <p><span className="font-medium">Primary:</span> {primaryInstruments.join(', ')}</p>
              )}
              {secondaryInstruments.length > 0 && (
                <p><span className="font-medium">Secondary:</span> {secondaryInstruments.join(', ')}</p>
              )}
            </div>
          )}
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
                  label: `${a.name}${a.current_version ? ` v${a.current_version}` : ''}`,
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
