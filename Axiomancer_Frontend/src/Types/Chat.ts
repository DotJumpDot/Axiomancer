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
  token_usage: TokenUsage | null;
  latency_ms: number | null;
  created_at: Date;
  updated_at: Date;
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
  token_usage?: TokenUsage;
  latency_ms?: number;
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
  token_usage?: TokenUsage | null;
  latency_ms?: number | null;
}

export interface Conversation {
  id: string;
  user_id: number | null;
  title: string;
  system_prompt_snapshot: string | null;
  auto_routing_enabled: boolean;
  archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConversationRequest {
  title: string;
  system_prompt_snapshot?: string;
  auto_routing_enabled?: boolean;
  archived?: boolean;
}

export interface UpdateConversationRequest {
  title?: string;
  system_prompt_snapshot?: string | null;
  auto_routing_enabled?: boolean;
  archived?: boolean;
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
