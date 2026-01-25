'use client';

import { useState, useEffect } from 'react';
import { datasetsApi, DatasetCreate, FilterQuery } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface DatasetCreateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function DatasetCreateForm({ onSuccess, onCancel }: DatasetCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'supervised' | 'preference'>('supervised');
  const [minRating, setMinRating] = useState(4);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview sample count when filters change
  useEffect(() => {
    const fetchPreview = async () => {
      setIsPreviewLoading(true);
      try {
        const filterQuery: FilterQuery = type === 'supervised' ? { min_rating: minRating } : {};
        const response = await datasetsApi.previewCount(type, filterQuery);
        setPreviewCount(response.count);
      } catch (err) {
        setPreviewCount(null);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    const timeout = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timeout);
  }, [type, minRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data: DatasetCreate = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        filter_query: type === 'supervised' ? { min_rating: minRating } : undefined,
      };
      await datasetsApi.create(data);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dataset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create Training Dataset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dataset Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., high-quality-v1"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this dataset"
              rows={2}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dataset Type *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'supervised'}
                  onChange={() => setType('supervised')}
                  className="w-4 h-4"
                />
                <span>Supervised (rated samples)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'preference'}
                  onChange={() => setType('preference')}
                  className="w-4 h-4"
                />
                <span>Preference (A/B comparisons)</span>
              </label>
            </div>
          </div>

          {/* Min Rating Filter (for supervised) */}
          {type === 'supervised' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum Rating: {minRating}
              </label>
              <Slider
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                min={1}
                max={5}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Only include samples rated {minRating} or higher
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              {isPreviewLoading ? (
                <span className="text-muted-foreground">Calculating...</span>
              ) : previewCount !== null ? (
                <>
                  <span className="font-semibold text-lg">{previewCount}</span>
                  <span className="text-muted-foreground"> samples match this filter</span>
                </>
              ) : (
                <span className="text-muted-foreground">Unable to preview</span>
              )}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !name.trim() || previewCount === 0}
          >
            {isLoading ? 'Creating...' : 'Create Dataset'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
