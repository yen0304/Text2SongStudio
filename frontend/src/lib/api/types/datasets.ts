/**
 * Dataset-related types
 */

export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: 'supervised' | 'preference';
  filter_query: FilterQuery;
  sample_count: number;
  export_path: string | null;
  is_exported: boolean;
  created_at: string;
}

export interface FilterQuery {
  min_rating?: number;
  max_rating?: number;
  required_tags?: string[];
  excluded_tags?: string[];
  adapter_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface DatasetCreate {
  name: string;
  description?: string;
  type: 'supervised' | 'preference';
  filter_query?: FilterQuery;
}

export interface DatasetExport {
  dataset_id: string;
  export_path: string;
  sample_count: number;
  format: string;
}

export interface DatasetStats {
  dataset_id: string;
  sample_count: number;
  total_samples: number;
  rating_distribution: Record<number, number>;
  unique_prompts: number;
  unique_adapters: number;
  tag_frequency: Record<string, number>;
  avg_rating: number | null;
  inter_rater_agreement?: number;
  preference_consistency?: number;
}
