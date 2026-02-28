// Chat and Conversation types matching backend
export type ChatRole = "user" | "assistant" | "system";
export type RoutingMode = "auto" | "manual";

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface SearchContext {
  web_search?: {
    query: string;
    results: any[];
    abstract?: string;
    abstractURL?: string;
  };
  image_results?: any[];
  query?: string;
}

export interface DecisionInfo {
  model_key: string;
  display_name?: string;
  provider?: string;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_usd?: number;
  latency_ms?: number;
  is_free: boolean;
  used_for: "web_search" | "image_search" | "both";
  timestamp: string;
  error?: string;
}

export interface Chat {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  model_id: string | null;
  prompt_profile_id: string | null;
  routing_mode: RoutingMode;
  search_log_uuid: string | null;
  chat_ai_respond_id: string | null;
  respond_error: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined fields from chat_ai_respond (when fetching with AI response)
  ai_content?: string;
  ai_model_key?: string;
  ai_token_usage?: TokenUsage;
  ai_latency_ms?: number;
  ai_finish_reason?: string;
  // Decision model key (from auto-routing)
  decision_model_key?: string | null;
  // Joined fields from search_log (when available)
  search_log?: {
    memory_chat_include: number;
    used_web_search: boolean;
    used_image_search: boolean;
    used_steam: boolean;
    reasoning_effort: string | null;
    reasoning_content: string | null;
    search_context_web: any | null;
    search_context_picture: any | null;
    decision_prompt_model: string | null;
    prompt_web_search: string | null;
    prompt_picture_search: string | null;
    decision_info: DecisionInfo | null;
  };
}

export interface CreateChatRequest {
  conversation_id: string;
  role: ChatRole;
  content: string;
  model_id?: string;
  prompt_profile_id?: string;
  routing_mode: RoutingMode;
  search_log_uuid?: string | null;
  chat_ai_respond_id?: string | null;
  respond_error?: boolean;
}

export interface UpdateChatRequest {
  role?: ChatRole;
  content?: string;
  model_id?: string | null;
  prompt_profile_id?: string | null;
  routing_mode?: RoutingMode;
  search_log_uuid?: string | null;
  chat_ai_respond_id?: string | null;
  respond_error?: boolean;
}

export interface Conversation {
  id: string;
  user_uuid: string | null;
  title: string;
  auto_routing_enabled: boolean;
  chat_log: string[];
  archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConversationRequest {
  title: string;
  auto_routing_enabled?: boolean;
  archived?: boolean;
}

export interface UpdateConversationRequest {
  title?: string;
  auto_routing_enabled?: boolean;
  chat_log?: string[];
  archived?: boolean;
}

// Chat AI Respond type (matches backend chat_ai_respond table)
export interface ChatAiRespond {
  id: string;
  ai_content: string;
  model_key: string | null;
  token_usage: TokenUsage | null;
  latency_ms: number | null;
  finish_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// UI-specific types
export interface ChatMessage extends Chat {
  isLoading?: boolean;
  isStreaming?: boolean;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
  size?: number;
}

export interface SendMessageOptions {
  webSearch?: boolean;
  imageSearch?: boolean;
  steamSearch?: boolean;
  selectedModel?: string;
  promptProfileId?: string;
  attachments?: File[];
  autoRouting?: boolean;
  temperature?: number;
  maxTokens?: number;
  memoryCount?: number;
  reasoningEffort?: string;
  reasoning_content?: string;
  enhanceSearchMode?: string;
}

// Search Log types
export interface SearchLog {
  id_no: number;
  id_uuid: string;
  chat_id: string;
  memory_chat_include: number;
  used_web_search: boolean;
  used_image_search: boolean;
  used_steam: boolean;
  reasoning_effort: string | null;
  reasoning_content: string | null;
  search_context_web: any | null;
  search_context_picture: any | null;
  created_at: Date;
}

// Note: OpenRouterMessage is imported from AiModel.ts
