'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ratingsApi, 
  type QualityRating, 
  type RatingListResponse 
} from '@/lib/api';
import { Star, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeedbackHistoryProps {
  initialAudioId?: string;
}

export function FeedbackHistory({ initialAudioId }: FeedbackHistoryProps) {
  const [ratings, setRatings] = useState<QualityRating[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [audioIdFilter, setAudioIdFilter] = useState(initialAudioId || '');
  const [minRating, setMinRating] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ratingsApi.list({
        audio_id: audioIdFilter || undefined,
        min_rating: minRating ? parseFloat(minRating) : undefined,
        page,
        limit,
      });
      setRatings(response.items);
      setTotal(response.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchFeedback();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rating History</CardTitle>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by Audio ID..."
              value={audioIdFilter}
              onChange={(e) => setAudioIdFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-64"
            />
          </div>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Any Rating</option>
            <option value="1">★ 1+</option>
            <option value="2">★★ 2+</option>
            <option value="3">★★★ 3+</option>
            <option value="4">★★★★ 4+</option>
            <option value="5">★★★★★ 5</option>
          </select>
          <Button onClick={handleSearch} variant="secondary">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-4">{error}</p>
        ) : ratings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No ratings found matching your filters.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {ratings.map((rating) => (
                <RatingRow key={rating.id} rating={rating} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RatingRow({ rating }: { rating: QualityRating }) {
  return (
    <div className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Rating stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <Star
                key={v}
                className={`h-3.5 w-3.5 ${
                  v <= rating.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>

          {/* Criterion */}
          {rating.criterion && rating.criterion !== 'overall' && (
            <Badge variant="secondary" className="text-xs">
              {rating.criterion}
            </Badge>
          )}
        </div>

        {/* Notes */}
        {rating.notes && (
          <p className="text-sm text-muted-foreground italic">
            &quot;{rating.notes}&quot;
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="text-right text-xs text-muted-foreground shrink-0">
        <p className="font-mono">{rating.audio_id.slice(0, 8)}...</p>
        <p>{new Date(rating.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
