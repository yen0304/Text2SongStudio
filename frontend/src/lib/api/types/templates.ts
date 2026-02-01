/**
 * Template-related types
 */

import type { PromptAttributes } from './prompts';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  text: string;
  attributes: PromptAttributes | null;
  category: string | null;
  is_system: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  text: string;
  attributes?: PromptAttributes;
  category?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  text?: string;
  attributes?: PromptAttributes;
  category?: string;
}

export interface ListTemplatesParams {
  page?: number;
  limit?: number;
  category?: string;
  is_system?: boolean;
}
