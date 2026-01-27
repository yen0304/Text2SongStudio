'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generationApi, ratingsApi, preferencesApi, type JobFeedbackResponse, type SampleFeedbackGroup } from '@/lib/api';
import { Star, ThumbsUp, MessageSquare, Loader2, RefreshCw, Trash2, Tag } from 'lucide-react';

interface JobFeedbackPanelProps {
  jobId: string;
  refreshTrigger?: number; // Increment this to trigger a refresh
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
    </div>
  );
}

function SampleFeedbackCard({
  sample,
  allAudioIds,
  onDeleteFeedback,
  deletingId,
  deleteConfirmId,
}: {
  sample: SampleFeedbackGroup;
  allAudioIds: string[];
  onDeleteFeedback: (feedbackId: string, isPreference: boolean) => void;
  deletingId: string | null;
  deleteConfirmId: string | null;
}) {
  const getLabelForAudioId = (audioId: string) => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const index = allAudioIds.indexOf(audioId);
    return index >= 0 && index < labels.length ? labels[index] : '?';
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-bold">
            Sample {sample.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {sample.feedback_count} feedback{sample.feedback_count !== 1 ? 's' : ''}
          </span>
        </div>
        {sample.average_rating !== null && (
          <RatingStars rating={sample.average_rating} />
        )}
      </div>

      {/* Display sample-level tags from AudioTag table */}
      {sample.tags && sample.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {sample.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {sample.feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No feedback yet</p>
      ) : (
        <div className="space-y-2">
          {sample.feedback.map((fb) => {
            const isPreference = fb.preferred_over !== null;
            return (
              <div
                key={fb.id}
                className="bg-muted/50 rounded-md p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {fb.rating !== null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-sm font-medium">{fb.rating}</span>
                      {fb.rating_criterion && fb.rating_criterion !== 'overall' && (
                        <span className="text-xs text-muted-foreground">
                          ({fb.rating_criterion})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {fb.preferred_over && (
                    <div className="flex items-center gap-1 text-green-600">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span className="text-sm">
                        Preferred over {getLabelForAudioId(fb.preferred_over)}
                      </span>
                    </div>
                  )}
                </div>

                {fb.notes && (
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                    <p className="text-muted-foreground italic">&quot;{fb.notes}&quot;</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleString()}
                  </p>
                  <Button
                    variant={deleteConfirmId === fb.id ? 'destructive' : 'ghost'}
                    size="sm"
                    className={deleteConfirmId === fb.id ? 'h-6 px-2' : 'h-6 w-6 p-0 text-muted-foreground hover:text-destructive'}
                    onClick={() => onDeleteFeedback(fb.id, isPreference)}
                    disabled={deletingId === fb.id}
                  >
                    {deletingId === fb.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : deleteConfirmId === fb.id ? (
                      <span className="text-xs">Confirm?</span>
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function JobFeedbackPanel({ jobId, refreshTrigger = 0 }: JobFeedbackPanelProps) {
  const [data, setData] = useState<JobFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFeedback = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await generationApi.getJobFeedback(jobId);
      setData(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [jobId]);

  // Initial load
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchFeedback(true);
    }
  }, [refreshTrigger, fetchFeedback]);

  const handleManualRefresh = () => {
    fetchFeedback(true);
  };

  // Track whether the pending delete is a preference (for using correct API)
  const [pendingDeleteIsPreference, setPendingDeleteIsPreference] = useState(false);

  const handleDeleteFeedback = async (feedbackId: string, isPreference: boolean) => {
    if (deleteConfirm === feedbackId) {
      // User confirmed, delete using appropriate API
      setDeletingId(feedbackId);
      try {
        if (pendingDeleteIsPreference) {
          await preferencesApi.delete(feedbackId);
        } else {
          await ratingsApi.delete(feedbackId);
        }
        setDeleteConfirm(null);
        fetchFeedback(true);
      } catch (e) {
        console.error('Failed to delete feedback:', e);
      } finally {
        setDeletingId(null);
      }
    } else {
      // Show confirmation and remember the type
      setDeleteConfirm(feedbackId);
      setPendingDeleteIsPreference(isPreference);
      setTimeout(() => {
        setDeleteConfirm(null);
        setPendingDeleteIsPreference(false);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading feedback...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const allAudioIds = data.samples.map((s) => s.audio_id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Job Feedback</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{data.total_feedback} total feedback</span>
              {data.average_rating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span>{data.average_rating.toFixed(1)} avg</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.total_feedback === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No feedback has been submitted for this job yet.
          </p>
        ) : (
          data.samples.map((sample) => (
            <SampleFeedbackCard
              key={sample.audio_id}
              sample={sample}
              allAudioIds={allAudioIds}
              onDeleteFeedback={handleDeleteFeedback}
              deletingId={deletingId}
              deleteConfirmId={deleteConfirm}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
