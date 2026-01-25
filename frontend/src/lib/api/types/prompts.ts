/**
 * Prompt-related types
 */

export interface Prompt {
  id: string;
  text: string;
  attributes: PromptAttributes;
  instruments?: string[];
  created_at: string;
}

export interface PromptAttributes {
  style?: string;
  tempo?: number;
  primary_instruments?: string[];
  secondary_instruments?: string[];
  mood?: string;
  duration?: number;
}

export interface CreatePromptRequest {
  text: string;
  attributes?: PromptAttributes;
}
