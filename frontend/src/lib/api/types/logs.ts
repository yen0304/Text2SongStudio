/**
 * Training log types
 */

export interface TrainingLogResponse {
  run_id: string;
  data: string; // Base64 encoded bytes
  size: number;
  updated_at: string;
}

export interface TrainingLogChunk {
  chunk: string; // Base64 encoded bytes
}

export interface TrainingLogDone {
  exit_code: number | null;
  final_size: number;
}

export type SSEEvent =
  | { type: 'log'; data: TrainingLogChunk }
  | { type: 'heartbeat'; data: Record<string, never> }
  | { type: 'done'; data: TrainingLogDone };
