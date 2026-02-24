export interface AiModel {
  id: string;
  provider: string;
  model_key: string;
  display_name: string;
  description: string;
  context_length: number;
  cost_per_1k_token: number;
  capabilities: {
    reasoning: boolean;
    coding: boolean;
    vision: boolean;
    fast: boolean;
  };
  enabled: boolean;
  chat_type_to_type: string;
  created: number;
  expiration_date: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAiModelRequest {
  provider: string;
  model_key: string;
  display_name: string;
  context_length: number;
  cost_per_1k_token: number;
  capabilities: {
    reasoning: boolean;
    coding: boolean;
    vision: boolean;
    fast: boolean;
  };
  enabled?: boolean;
}

export interface UpdateAiModelRequest {
  provider?: string;
  model_key?: string;
  display_name?: string;
  context_length?: number;
  cost_per_1k_token?: number;
  capabilities?: {
    reasoning: boolean;
    coding: boolean;
    vision: boolean;
    fast: boolean;
  };
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
  reasoning?: {
    effort?: string;
  };
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
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// OpenRouter Models API types
export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
    web_search?: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits?: any;
  supported_parameters: string[];
  default_parameters: Record<string, any>;
  expiration_date: number | null;
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}
