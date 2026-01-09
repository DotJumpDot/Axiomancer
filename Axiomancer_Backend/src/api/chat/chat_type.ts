export interface Chat {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model_id: string | null;
  prompt_profile_id: string | null;
  routing_mode: "auto" | "manual";
  used_web_search: boolean;
  used_image_search: boolean;
  search_context: any | null;
  token_usage: any | null;
  latency_ms: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateChatRequest {
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model_id?: string | null;
  prompt_profile_id?: string | null;
  routing_mode: "auto" | "manual";
  used_web_search?: boolean;
  used_image_search?: boolean;
  search_context?: any;
  token_usage?: any;
  latency_ms?: number;
}

export interface UpdateChatRequest {
  role?: "user" | "assistant" | "system";
  content?: string;
  model_id?: string | null;
  prompt_profile_id?: string | null;
  routing_mode?: "auto" | "manual";
  used_web_search?: boolean;
  used_image_search?: boolean;
  search_context?: any | null;
  token_usage?: any | null;
  latency_ms?: number | null;
}

// Conversation types
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

export interface SendMessageRequest {
  message: string;
  model_key?: string;
  prompt_profile_id?: string;
  autoRouting?: boolean;
  webSearch?: boolean;
  imageSearch?: boolean;
}
