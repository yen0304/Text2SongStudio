/**
 * Audio-related types
 */

export interface AudioSample {
  id: string;
  prompt_id: string;
  adapter_id: string | null;
  duration_seconds: number;
  sample_rate: number;
  created_at: string;
}
