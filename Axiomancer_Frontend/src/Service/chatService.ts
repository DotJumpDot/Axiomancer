// Chat Service - handles chat and conversation management
import apiClient from "./apiClient";
import type {
  Chat,
  Conversation,
  CreateChatRequest,
  UpdateChatRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  ApiResponse,
  OpenRouterMessage,
} from "../Types";

const CHAT_ENDPOINTS = {
  conversations: "/api/conversations",
  messages: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
};

export const chatService = {
  // Conversation management
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiClient.get(CHAT_ENDPOINTS.conversations);
  },

  async getConversationById(id: string): Promise<ApiResponse<Conversation>> {
    return apiClient.get(`${CHAT_ENDPOINTS.conversations}/${id}`);
  },

  async createConversation(data: CreateConversationRequest): Promise<ApiResponse<Conversation>> {
    return apiClient.post(CHAT_ENDPOINTS.conversations, data);
  },

  async updateConversation(
    id: string,
    data: UpdateConversationRequest
  ): Promise<ApiResponse<Conversation>> {
    return apiClient.put(`${CHAT_ENDPOINTS.conversations}/${id}`, data);
  },

  async deleteConversation(id: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`${CHAT_ENDPOINTS.conversations}/${id}`);
  },

  // Chat messages
  async getMessages(conversationId: string): Promise<ApiResponse<Chat[]>> {
    return apiClient.get(CHAT_ENDPOINTS.messages(conversationId));
  },

  async createMessage(data: CreateChatRequest): Promise<ApiResponse<Chat>> {
    return apiClient.post(CHAT_ENDPOINTS.messages(data.conversation_id), data);
  },

  async updateMessage(
    conversationId: string,
    messageId: string,
    data: UpdateChatRequest
  ): Promise<ApiResponse<Chat>> {
    return apiClient.put(`${CHAT_ENDPOINTS.messages(conversationId)}/${messageId}`, data);
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`${CHAT_ENDPOINTS.messages(conversationId)}/${messageId}`);
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
  ): Promise<ApiResponse<{ message: Chat; response: Chat }>> {
    return apiClient.post(`${CHAT_ENDPOINTS.conversations}/${conversationId}/send`, {
      messages,
      model_key: modelKey,
      ...options,
    });
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
  ): Promise<ApiResponse<{ userMessage: Chat; aiResponse: Chat }>> {
    // Use a dummy conversation ID for the endpoint
    return apiClient.post(`${CHAT_ENDPOINTS.conversations}/anonymous/send`, {
      message: messages[messages.length - 1]?.content || "", // Last message is the user message
      model_key: modelKey,
      ...options,
    });
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
