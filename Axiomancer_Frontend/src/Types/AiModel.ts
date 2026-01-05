// AI Model types matching backend
export interface AiModelCapabilities {
  reasoning: boolean;
  coding: boolean;
  vision: boolean;
  fast: boolean;
}

export interface AiModel {
  id: string;
  provider: string;
  model_key: string;
  display_name: string;
  context_length: number;
  cost_per_1k_token: number;
  capabilities: AiModelCapabilities;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAiModelRequest {
  provider: string;
  model_key: string;
  display_name: string;
  context_length: number;
  cost_per_1k_token: number;
  capabilities: AiModelCapabilities;
  enabled?: boolean;
}

export interface UpdateAiModelRequest {
  provider?: string;
  model_key?: string;
  display_name?: string;
  context_length?: number;
  cost_per_1k_token?: number;
  capabilities?: AiModelCapabilities;
  enabled?: boolean;
}

// OpenRouter API types
export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenRouterMessage;
    finish_reason: string;
  }[];
  usage: OpenRouterUsage;
}
