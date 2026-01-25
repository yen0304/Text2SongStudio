/**
 * Metrics-related types
 */

export interface OverviewMetrics {
  pipeline: {
    generation: { total: number; completed: number; active: number };
    feedback: { total: number; rated_samples: number; pending: number };
    dataset: { total: number; exported: number };
    training: { total: number; running: number };
  };
  quick_stats: {
    total_generations: number;
    total_samples: number;
    avg_rating: number | null;
    active_adapters: number;
    total_adapters: number;
    pending_feedback: number;
  };
}

export interface FeedbackMetrics {
  rating_distribution: Record<number, number>;
  by_adapter: {
    adapter_id: string | null;
    adapter_name: string;
    count: number;
    avg_rating: number | null;
  }[];
  preference_comparisons: number;
  tagged_feedback: number;
}
