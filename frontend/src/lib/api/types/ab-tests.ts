/**
 * A/B Test-related types
 */

export interface ABTest {
  id: string;
  name: string;
  description: string | null;
  adapter_a_id: string | null;
  adapter_b_id: string | null;
  adapter_a_name: string | null;
  adapter_b_name: string | null;
  status: 'draft' | 'generating' | 'active' | 'completed';
  total_pairs: number;
  completed_pairs: number;
  results: { a_preferred: number; b_preferred: number; equal: number } | null;
  created_at: string;
  updated_at: string;
}

export interface ABTestPair {
  id: string;
  prompt_id: string;
  audio_a_id: string | null;
  audio_b_id: string | null;
  preference: 'a' | 'b' | 'equal' | null;
  voted_at: string | null;
  is_ready: boolean;
}

export interface ABTestDetail extends ABTest {
  pairs: ABTestPair[];
}

export interface ABTestResults {
  id: string;
  name: string;
  adapter_a_name: string | null;
  adapter_b_name: string | null;
  total_votes: number;
  a_preferred: number;
  b_preferred: number;
  equal: number;
  a_win_rate: number;
  b_win_rate: number;
  statistical_significance: number | null;
}

export interface CreateABTestRequest {
  name: string;
  description?: string;
  adapter_a_id?: string;
  adapter_b_id?: string;
  prompt_ids: string[];
}

export interface GenerateSamplesRequest {
  prompt_ids?: string[];
  samples_per_prompt?: number;
}
