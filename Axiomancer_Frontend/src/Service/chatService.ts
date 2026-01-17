// Chat Service - handles chat and conversation management
import apiClient from "./apiClient";
import type {
  Chat,
  ChatAiRespond,
  Conversation,
  CreateChatRequest,
  UpdateChatRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  OpenRouterMessage,
} from "@/Types";

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:4100";

const CHAT_ENDPOINTS = {
  conversations: "/api/conversations",
  messages: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
};

export const chatService = {
  // Conversation management
  async getConversations() {
    return apiClient.get<Conversation[]>(CHAT_ENDPOINTS.conversations);
  },

  async getConversationById(id: string) {
    return apiClient.get<Conversation>(`${CHAT_ENDPOINTS.conversations}/${id}`);
  },

  async createConversation(data: CreateConversationRequest) {
    return apiClient.post<Conversation>(CHAT_ENDPOINTS.conversations, data);
  },

  async updateConversation(id: string, data: UpdateConversationRequest) {
    return apiClient.put<Conversation>(`${CHAT_ENDPOINTS.conversations}/${id}`, data);
  },

  async archiveConversation(id: string, archived: boolean) {
    return apiClient.put<Conversation>(`${CHAT_ENDPOINTS.conversations}/${id}/archive`, {
      archived,
    });
  },

  async deleteConversation(id: string) {
    return apiClient.delete<boolean>(`${CHAT_ENDPOINTS.conversations}/${id}`);
  },

  // Chat messages
  async getMessages(conversationId: string) {
    return apiClient.get<Chat[]>(CHAT_ENDPOINTS.messages(conversationId));
  },

  async createMessage(data: CreateChatRequest) {
    return apiClient.post<Chat>(CHAT_ENDPOINTS.messages(data.conversation_id), data);
  },

  async updateMessage(conversationId: string, messageId: string, data: UpdateChatRequest) {
    return apiClient.put<Chat>(`${CHAT_ENDPOINTS.messages(conversationId)}/${messageId}`, data);
  },

  async deleteMessage(conversationId: string, messageId: string) {
    return apiClient.delete<boolean>(`${CHAT_ENDPOINTS.messages(conversationId)}/${messageId}`);
  },

  // Send message to AI and get response
  async sendToAI(
    conversationId: string,
    messages: OpenRouterMessage[],
    modelKey: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
      useWebSearch?: boolean;
      useImageSearch?: boolean;
      promptProfileId?: string;
    }
  ) {
    return apiClient.post<{ message: Chat; response: Chat }>(
      `${CHAT_ENDPOINTS.conversations}/${conversationId}/send`,
      {
        messages,
        model_key: modelKey,
        ...options,
      }
    );
  },

  // Send message with model and prompt (single mode)
  async sendMessage(
    conversationId: string,
    data: {
      message: string;
      model_key?: string;
      prompt_profile_id?: string;
      autoRouting?: boolean;
      webSearch?: boolean;
      imageSearch?: boolean;
      steamSearch?: boolean;
      memoryCount?: number;
    }
  ) {
    return apiClient.post<{ userMessage: Chat; aiResponse?: ChatAiRespond }>(
      `${CHAT_ENDPOINTS.conversations}/${conversationId}/send`,
      data
    );
  },

  // Send message with streaming response
  async sendMessageStream(
    conversationId: string,
    data: {
      message: string;
      model_key?: string;
      prompt_profile_id?: string;
      autoRouting?: boolean;
      webSearch?: boolean;
      imageSearch?: boolean;
      steamSearch?: boolean;
      memoryCount?: number;
    },
    onChunk: (chunk: string) => void,
    onDone: (result: { userMessage: Chat; aiResponse?: ChatAiRespond }) => void,
    onError: (error: string) => void
  ) {
    // Get auth token from localStorage
    const axmLogin = localStorage.getItem("AxmLogin");
    let authToken = null;
    if (axmLogin) {
      try {
        const loginData = JSON.parse(axmLogin);
        authToken = loginData.token;
      } catch (e) {
        console.warn("Failed to parse auth token for streaming");
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `${API_BASE_URL}${CHAT_ENDPOINTS.conversations}/${conversationId}/send-stream`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to start streaming: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                onChunk(data.chunk);
              } else if (data.done) {
                onDone(data.result);
              } else if (data.error) {
                onError(data.error);
              }
            } catch (e) {
              console.warn("Failed to parse SSE line:", trimmed);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  // Send anonymous message to AI (no conversation required)
  async sendAnonymousToAI(
    messages: OpenRouterMessage[],
    modelKey: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
      useWebSearch?: boolean;
      useImageSearch?: boolean;
    }
  ) {
    // Use a dummy conversation ID for the endpoint
    return apiClient.post<{ userMessage: Chat; aiResponse: Chat }>(
      `${CHAT_ENDPOINTS.conversations}/anonymous/send`,
      {
        message: messages[messages.length - 1]?.content || "", // Last message is the user message
        model_key: modelKey,
        ...options,
      }
    );
  },

  // Helper to convert Chat to OpenRouterMessage format
  toOpenRouterMessages(chats: Chat[]): OpenRouterMessage[] {
    return chats.map((chat) => ({
      role: chat.role,
      content: chat.content,
    }));
  },

  // Generate conversation title from first message
  generateTitle(content: string, maxLength: number = 50): string {
    const cleaned = content.replace(/\n/g, " ").trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength - 3) + "...";
  },
};

export default chatService;
