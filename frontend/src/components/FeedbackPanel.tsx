'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Star, X, ThumbsUp, Check, Tag, MessageSquare } from 'lucide-react';

interface FeedbackPanelProps {
  audioIds: string[];
  onFeedbackSubmitted?: () => void;
}

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

export function FeedbackPanel({ audioIds, onFeedbackSubmitted }: FeedbackPanelProps) {
  // Selected sample for rating/tags
  const [selectedAudioId, setSelectedAudioId] = useState<string>(audioIds[0] || '');
  
  // Rating state
  const [rating, setRating] = useState<number | null>(null);
  
  // Preference state (for A/B comparison)
  const [preferredId, setPreferredId] = useState<string | null>(null);
  
  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  
  // Notes
  const [notes, setNotes] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);

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

  const handleSubmitRating = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await api.submitFeedback({
        audio_id: selectedAudioId,
        rating,
        notes: notes || undefined,
      });
      setLastSubmitted('rating');
      setRating(null);
      setNotes('');
      setTimeout(() => setLastSubmitted(null), 2000);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPreference = async () => {
    if (!preferredId) return;
    const rejectedId = audioIds.find((id) => id !== preferredId);
    if (!rejectedId) return;
    
    setIsSubmitting(true);
    try {
      await api.submitFeedback({
        audio_id: preferredId,
        preferred_over: rejectedId,
        notes: notes || undefined,
      });
      setLastSubmitted('preference');
      setPreferredId(null);
      setNotes('');
      setTimeout(() => setLastSubmitted(null), 2000);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit preference:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTags = async () => {
    if (tags.length === 0) return;
    setIsSubmitting(true);
    try {
      await api.submitFeedback({
        audio_id: selectedAudioId,
        tags,
        notes: notes || undefined,
      });
      setLastSubmitted('tags');
      setTags([]);
      setNotes('');
      setTimeout(() => setLastSubmitted(null), 2000);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit tags:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => setRating(value)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-7 w-7 ${
                rating && value <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const selectedIndex = audioIds.indexOf(selectedAudioId);
  const selectedLabel = selectedIndex >= 0 ? SAMPLE_LABELS[selectedIndex] : '?';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Provide Feedback
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Each feedback type is submitted independently
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Section 1: Rating */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Rating
            </h3>
            {lastSubmitted === 'rating' && (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" /> Submitted
              </Badge>
            )}
          </div>
          
          {/* Sample selector for rating */}
          {audioIds.length > 1 && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {audioIds.map((id, index) => (
                <button
                  key={id}
                  onClick={() => setSelectedAudioId(id)}
                  className={`
                    flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${selectedAudioId === id
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }
                  `}
                >
                  {SAMPLE_LABELS[index]}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Rate Sample {selectedLabel}
            </span>
            {renderStars()}
          </div>
          
          <Button
            onClick={handleSubmitRating}
            disabled={!rating || isSubmitting}
            size="sm"
            className="w-full"
          >
            Submit Rating {rating ? `(${rating} stars)` : ''}
          </Button>
        </div>

        {/* Section 2: A/B Preference */}
        {audioIds.length >= 2 && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Preference
              </h3>
              {lastSubmitted === 'preference' && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" /> Submitted
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Compare Sample A and B, select your preferred one
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {audioIds.slice(0, 2).map((id, index) => (
                <button
                  key={id}
                  onClick={() => setPreferredId(preferredId === id ? null : id)}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all
                    ${preferredId === id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <span className="text-xl font-bold block">
                    {SAMPLE_LABELS[index]}
                  </span>
                  <span className="text-xs">
                    {preferredId === id ? '✓ Selected' : 'Click to select'}
                  </span>
                </button>
              ))}
            </div>
            
            <Button
              onClick={handleSubmitPreference}
              disabled={!preferredId || isSubmitting}
              size="sm"
              className="w-full"
            >
              Submit Preference {preferredId ? `(${SAMPLE_LABELS[audioIds.indexOf(preferredId)]})` : ''}
            </Button>
          </div>
        )}

        {/* Section 3: Tags */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h3>
            {lastSubmitted === 'tags' && (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" /> Submitted
              </Badge>
            )}
          </div>
          
          {/* Sample selector for tags */}
          {audioIds.length > 1 && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {audioIds.map((id, index) => (
                <button
                  key={id}
                  onClick={() => setSelectedAudioId(id)}
                  className={`
                    flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${selectedAudioId === id
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }
                  `}
                >
                  {SAMPLE_LABELS[index]}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={tags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() =>
                  tags.includes(tag) ? handleRemoveTag(tag) : handleAddTag(tag)
                }
              >
                {tag.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
              className="h-8 text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleAddCustomTag}>
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                  {tag.replace(/_/g, ' ')}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
          
          <Button
            onClick={handleSubmitTags}
            disabled={tags.length === 0 || isSubmitting}
            size="sm"
            className="w-full"
          >
            Submit Tags {tags.length > 0 ? `(${tags.length})` : ''}
          </Button>
        </div>

        {/* Optional Notes Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Notes (included with next submission)
          </label>
          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Training Progress Link */}
        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Your feedback helps improve the model.{' '}
            <a href="/training" className="text-primary hover:underline">
              View training progress →
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
