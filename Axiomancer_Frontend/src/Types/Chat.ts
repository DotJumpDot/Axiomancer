// Chat and Conversation types matching backend
export type ChatRole = "user" | "assistant" | "system";
export type RoutingMode = "auto" | "manual";

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface SearchContext {
  web_results?: any[];
  image_results?: any[];
  query?: string;
}

export interface Chat {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  model_id: string | null;
  prompt_profile_id: string | null;
  routing_mode: RoutingMode;
  used_web_search: boolean;
  used_image_search: boolean;
  search_context: SearchContext | null;
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
}

export interface CreateChatRequest {
  conversation_id: string;
  role: ChatRole;
  content: string;
  model_id?: string;
  prompt_profile_id?: string;
  routing_mode: RoutingMode;
  used_web_search?: boolean;
  used_image_search?: boolean;
  search_context?: SearchContext;
  chat_ai_respond_id?: string | null;
  respond_error?: boolean;
}

export interface UpdateChatRequest {
  role?: ChatRole;
  content?: string;
  model_id?: string | null;
  prompt_profile_id?: string | null;
  routing_mode?: RoutingMode;
  used_web_search?: boolean;
  used_image_search?: boolean;
  search_context?: SearchContext | null;
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
  useWebSearch?: boolean;
  useImageSearch?: boolean;
  selectedModel?: string;
  promptProfileId?: string;
  attachments?: File[];
  autoRouting?: boolean;
  temperature?: number;
  maxTokens?: number;
}

// Note: OpenRouterMessage is imported from AiModel.ts
