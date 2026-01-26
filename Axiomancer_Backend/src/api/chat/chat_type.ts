// Chat AI Respond types
export interface ChatAiRespond {
  id: string;
  ai_content: string;
  model_key: string | null;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
  latency_ms: number | null;
  finish_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateChatAiRespondRequest {
  ai_content: string;
  model_key?: string | null;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
  latency_ms?: number | null;
  finish_reason?: string | null;
}

export interface Chat {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model_id: string | null;
  prompt_profile_id: string | null;
  routing_mode: "auto" | "manual";
  search_log_uuid: string | null;
  chat_ai_respond_id: string | null;
  respond_error: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined fields from chat_ai_respond (when fetching with AI response)
  ai_content?: string;
  ai_model_key?: string;
  ai_token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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
  };
}

export interface CreateChatRequest {
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model_id?: string | null;
  prompt_profile_id?: string | null;
  routing_mode: "auto" | "manual";
  search_log_uuid?: string | null;
  chat_ai_respond_id?: string | null;
  respond_error?: boolean;
}

export interface UpdateChatRequest {
  role?: "user" | "assistant" | "system";
  content?: string;
  model_id?: string | null;
  prompt_profile_id?: string | null;
  routing_mode?: "auto" | "manual";
  search_log_uuid?: string | null;
  chat_ai_respond_id?: string | null;
  respond_error?: boolean;
}

// Conversation types
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

export interface SendMessageRequest {
  message: string;
  model_key?: string;
  prompt_profile_id?: string;
  autoRouting?: boolean;
  webSearch?: boolean;
  imageSearch?: boolean;
  memoryCount?: number;
  reasoningEffort?: string;
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

export interface CreateSearchLogRequest {
  chat_id: string;
  memory_chat_include: number;
  used_web_search: boolean;
  used_image_search: boolean;
  used_steam: boolean;
  reasoning_effort?: string | null;
  reasoning_content?: string | null;
  search_context_web?: any | null;
  search_context_picture?: any | null;
}
