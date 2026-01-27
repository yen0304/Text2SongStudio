/**
 * Preference Pair types for DPO/RLHF training data
 */

export interface PreferencePair {
  id: string;
  prompt_id: string;
  chosen_audio_id: string;
  rejected_audio_id: string;
  user_id: string | null;
  margin: number | null;  // 1-5 scale, how much better chosen is
  notes: string | null;
  created_at: string;
}

export interface PreferencePairWithDetails extends PreferencePair {
  prompt_text: string | null;
  chosen_audio_path: string | null;
  rejected_audio_path: string | null;
}

export interface CreatePreferenceRequest {
  prompt_id: string;
  chosen_audio_id: string;
  rejected_audio_id: string;
  margin?: number;  // 1-5
  notes?: string;
}

export interface PreferenceListResponse {
  items: PreferencePair[];
  total: number;
}

export interface PreferenceStats {
  total_pairs: number;
  unique_prompts: number;
  unique_audios: number;
  average_margin: number | null;
  audio_win_rates: Record<string, number> | null;
}

export interface ListPreferencesParams {
  prompt_id?: string;
  audio_id?: string;  // Filter where audio is chosen or rejected
  page?: number;
  limit?: number;
}
