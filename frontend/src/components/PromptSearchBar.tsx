'use client';

import { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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

export interface SearchFilters {
  q?: string;
  style?: string;
  mood?: string;
  tempo_min?: number;
  tempo_max?: number;
}

interface PromptSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export function PromptSearchBar({ onSearch, isLoading }: PromptSearchBarProps) {
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState('');
  const [mood, setMood] = useState('');
  const [tempoMin, setTempoMin] = useState<number | undefined>();
  const [tempoMax, setTempoMax] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [style, mood, tempoMin, tempoMax].filter(Boolean).length;

  const handleSearch = useCallback(() => {
    onSearch({
      q: query || undefined,
      style: style || undefined,
      mood: mood || undefined,
      tempo_min: tempoMin,
      tempo_max: tempoMax,
    });
  }, [query, style, mood, tempoMin, tempoMax, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setStyle('');
    setMood('');
    setTempoMin(undefined);
    setTempoMax(undefined);
    setShowFilters(false);
    if (!query) {
      onSearch({});
    }
  };

  const clearAll = () => {
    setQuery('');
    clearFilters();
    onSearch({});
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search prompts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9"
        />
        {(query || activeFilterCount > 0) && (
          <button
            onClick={clearAll}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filters</h4>
              <p className="text-sm text-muted-foreground">
                Narrow down your search results
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Style</Label>
                <Select 
                  options={STYLE_OPTIONS} 
                  value={style} 
                  onChange={(e) => setStyle(e.target.value)} 
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Mood</Label>
                <Select 
                  options={MOOD_OPTIONS} 
                  value={mood} 
                  onChange={(e) => setMood(e.target.value)} 
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Tempo Range (BPM)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={40}
                    max={200}
                    value={tempoMin ?? ''}
                    onChange={(e) => setTempoMin(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    min={40}
                    max={200}
                    value={tempoMax ?? ''}
                    onChange={(e) => setTempoMax(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
              <Button size="sm" onClick={handleSearch}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search'}
      </Button>
    </div>
  );
}
