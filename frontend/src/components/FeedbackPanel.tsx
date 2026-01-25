'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Star, X } from 'lucide-react';

interface FeedbackPanelProps {
  audioIds: string[];
}

const RATING_CRITERIA = [
  { key: 'overall', label: 'Overall Quality' },
  { key: 'musicality', label: 'Musicality' },
  { key: 'coherence', label: 'Coherence' },
  { key: 'emotional', label: 'Emotional Alignment' },
];

const SUGGESTED_TAGS = [
  'good_melody',
  'good_rhythm',
  'good_harmony',
  'creative',
  'professional',
  'poor_melody',
  'poor_rhythm',
  'repetitive',
  'noisy',
  'artifacts',
];

const SAMPLE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function FeedbackPanel({ audioIds }: FeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<'rating' | 'preference' | 'tags'>('rating');
  const [selectedAudioId, setSelectedAudioId] = useState<string>(audioIds[0] || '');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRatingClick = (criterion: string, value: number) => {
    setRatings((prev) => ({ ...prev, [criterion]: value }));
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const tag = customTag.trim().toLowerCase().replace(/\s+/g, '_');
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setCustomTag('');
    }
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);

    try {
      if (activeTab === 'rating' && ratings.overall) {
        await api.submitFeedback({
          audio_id: selectedAudioId,
          rating: ratings.overall,
          tags: tags.length > 0 ? tags : undefined,
          notes: notes || undefined,
        });
      } else if (activeTab === 'preference' && preferredId) {
        const rejectedId = audioIds.find((id) => id !== preferredId);
        if (rejectedId) {
          await api.submitFeedback({
            audio_id: preferredId,
            preferred_over: rejectedId,
            tags: tags.length > 0 ? tags : undefined,
            notes: notes || undefined,
          });
        }
      } else if (activeTab === 'tags' && tags.length > 0) {
        await api.submitFeedback({
          audio_id: selectedAudioId,
          tags,
          notes: notes || undefined,
        });
      }

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (criterion: string) => {
    const currentRating = ratings[criterion] || 0;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleRatingClick(criterion, value)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
                value <= currentRating ? 'fill-primary text-primary' : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provide Feedback</CardTitle>
        <div className="flex gap-2">
          {(['rating', 'preference', 'tags'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTab === 'rating' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Sample</label>
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {audioIds.map((id, index) => (
                  <button
                    key={id}
                    onClick={() => setSelectedAudioId(id)}
                    className={`
                      flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all
                      ${selectedAudioId === id
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    Sample {SAMPLE_LABELS[index]}
                  </button>
                ))}
              </div>
            </div>

            {RATING_CRITERIA.map((criterion) => (
              <div key={criterion.key} className="flex items-center justify-between">
                <span className="text-sm">{criterion.label}</span>
                {renderStars(criterion.key)}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'preference' && audioIds.length >= 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Which sample do you prefer?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {audioIds.slice(0, 2).map((id, index) => (
                <button
                  key={id}
                  onClick={() => setPreferredId(id)}
                  className={`
                    p-4 rounded-lg border-2 text-center transition-all
                    ${preferredId === id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <span className="text-2xl font-bold block mb-1">
                    {SAMPLE_LABELS[index]}
                  </span>
                  <span className="text-sm">
                    {preferredId === id ? 'Preferred' : 'Sample ' + SAMPLE_LABELS[index]}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPreferredId(null)}
              className={`
                w-full p-2 rounded-md text-sm transition-all
                ${preferredId === null
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              No preference (tie)
            </button>
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Sample</label>
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {audioIds.map((id, index) => (
                  <button
                    key={id}
                    onClick={() => setSelectedAudioId(id)}
                    className={`
                      flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all
                      ${selectedAudioId === id
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    Sample {SAMPLE_LABELS[index]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Suggested Tags</label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      tags.includes(tag) ? handleRemoveTag(tag) : handleAddTag(tag)
                    }
                  >
                    {tag.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
              />
              <Button variant="outline" onClick={handleAddCustomTag}>
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Selected Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag.replace(/_/g, ' ')}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Notes (optional)</label>
          <Textarea
            placeholder="Add any additional notes about this sample..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmitFeedback}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : submitted ? 'Feedback Submitted!' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}
