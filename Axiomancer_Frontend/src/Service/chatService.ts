// Chat Service - handles chat and conversation management
import apiClient from "./apiClient";
import type {
  Chat,
  Conversation,
  CreateChatRequest,
  UpdateChatRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  OpenRouterMessage,
} from "@/Types";

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
    }
  ) {
    return apiClient.post<{ userMessage: Chat; aiResponse?: Chat }>(
      `${CHAT_ENDPOINTS.conversations}/${conversationId}/send`,
      data
    );
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
