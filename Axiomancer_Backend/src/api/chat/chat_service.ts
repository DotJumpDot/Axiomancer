import { ChatQuery } from "./chat_query";
import { openRouterClient } from "../ai/ai_openrouter";
import type {
  Chat,
  CreateChatRequest,
  UpdateChatRequest,
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
} from "./chat_type";

export class ChatService {
  // Conversation management
  static async getAllConversations(userId?: number): Promise<Conversation[]> {
    try {
      return await ChatQuery.getAllConversations(userId);
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw new Error("Failed to retrieve conversations");
    }
  }

  static async getConversationById(id: string): Promise<Conversation | null> {
    try {
      return await ChatQuery.getConversationById(id);
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw new Error("Failed to retrieve conversation");
    }
  }

  static async createConversation(
    conversation: CreateConversationRequest,
    userId?: number
  ): Promise<Conversation> {
    try {
      // Validate required fields
      if (!conversation.title?.trim()) {
        throw new Error("Conversation title is required");
      }

      return await ChatQuery.createConversation(conversation, userId);
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error instanceof Error ? error : new Error("Failed to create conversation");
    }
  }

  static async updateConversation(
    id: string,
    updates: UpdateConversationRequest
  ): Promise<Conversation | null> {
    try {
      // Validate conversation exists
      const existing = await ChatQuery.getConversationById(id);
      if (!existing) {
        return null;
      }

      // Validate title if provided
      if (updates.title !== undefined && !updates.title.trim()) {
        throw new Error("Conversation title cannot be empty");
      }

      return await ChatQuery.updateConversation(id, updates);
    } catch (error) {
      console.error("Error updating conversation:", error);
      throw error instanceof Error ? error : new Error("Failed to update conversation");
    }
  }

  static async deleteConversation(id: string): Promise<boolean> {
    try {
      // Validate conversation exists
      const existing = await ChatQuery.getConversationById(id);
      if (!existing) {
        return false;
      }

      return await ChatQuery.deleteConversation(id);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw new Error("Failed to delete conversation");
    }
  }

  // Chat message management
  static async getChatsByConversationId(conversationId: string): Promise<Chat[]> {
    try {
      // Validate conversation exists
      const conversation = await ChatQuery.getConversationById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return await ChatQuery.getChatsByConversationId(conversationId);
    } catch (error) {
      console.error("Error getting chats:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve chat messages");
    }
  }

  static async getChatById(id: string): Promise<Chat | null> {
    try {
      return await ChatQuery.getChatById(id);
    } catch (error) {
      console.error("Error getting chat:", error);
      throw new Error("Failed to retrieve chat message");
    }
  }

  static async createChat(chat: CreateChatRequest): Promise<Chat> {
    try {
      // Validate conversation exists
      const conversation = await ChatQuery.getConversationById(chat.conversation_id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Validate required fields
      if (!chat.role || !chat.content?.trim()) {
        throw new Error("Chat role and content are required");
      }

      // Validate role
      if (!["user", "assistant", "system"].includes(chat.role)) {
        throw new Error("Invalid chat role. Must be 'user', 'assistant', or 'system'");
      }

      return await ChatQuery.createChat(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error instanceof Error ? error : new Error("Failed to create chat message");
    }
  }

  static async updateChat(id: string, updates: UpdateChatRequest): Promise<Chat | null> {
    try {
      // Validate chat exists
      const existing = await ChatQuery.getChatById(id);
      if (!existing) {
        return null;
      }

      // Validate role if provided
      if (updates.role !== undefined && !["user", "assistant", "system"].includes(updates.role)) {
        throw new Error("Invalid chat role. Must be 'user', 'assistant', or 'system'");
      }

      // Validate content if provided
      if (updates.content !== undefined && !updates.content.trim()) {
        throw new Error("Chat content cannot be empty");
      }

      return await ChatQuery.updateChat(id, updates);
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error instanceof Error ? error : new Error("Failed to update chat message");
    }
  }

  static async deleteChat(id: string): Promise<boolean> {
    try {
      // Validate chat exists
      const existing = await ChatQuery.getChatById(id);
      if (!existing) {
        return false;
      }

      return await ChatQuery.deleteChat(id);
    } catch (error) {
      console.error("Error deleting chat:", error);
      throw new Error("Failed to delete chat message");
    }
  }

  // Helper methods for conversation with messages
  static async getConversationWithMessages(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Chat[];
  } | null> {
    try {
      const conversation = await ChatQuery.getConversationById(conversationId);
      if (!conversation) {
        return null;
      }

      const messages = await ChatQuery.getChatsByConversationId(conversationId);

      return {
        conversation,
        messages,
      };
    } catch (error) {
      console.error("Error getting conversation with messages:", error);
      throw new Error("Failed to retrieve conversation and messages");
    }
  }

  // Send message and get AI response (placeholder for AI integration)
  static async sendMessage(
    conversationId: string,
    userMessage: string,
    userId?: number
  ): Promise<{
    userMessage: Chat;
    aiResponse?: Chat;
  }> {
    try {
      // Create user message
      const userChat: CreateChatRequest = {
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
        routing_mode: "auto",
      };

      const savedUserMessage = await this.createChat(userChat);

      // TODO: Implement AI response generation
      // For now, return just the user message
      // Later this will integrate with AI service for routing and response generation

      return {
        userMessage: savedUserMessage,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error instanceof Error ? error : new Error("Failed to send message");
    }
  }

  // Send anonymous message (no database storage)
  static async sendAnonymousMessage(body: { message: string; model_key?: string }): Promise<{
    message: Chat;
    response: Chat;
  }> {
    try {
      if (!openRouterClient) {
        throw new Error("AI service not configured");
      }

      const userMessage = body.message;
      const modelKey = body.model_key || "anthropic/claude-3-haiku"; // Default model

      // Get AI response
      const aiContent = await openRouterClient.simpleChat(modelKey, userMessage);

      // Create Chat objects for response
      const userChat: Chat = {
        id: `anon-user-${Date.now()}`,
        conversation_id: "anonymous",
        role: "user",
        content: userMessage,
        model_id: null,
        prompt_profile_id: null,
        routing_mode: "auto",
        used_web_search: false,
        used_image_search: false,
        search_context: null,
        token_usage: null,
        latency_ms: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const aiChat: Chat = {
        id: `anon-ai-${Date.now()}`,
        conversation_id: "anonymous",
        role: "assistant",
        content: aiContent,
        model_id: modelKey,
        prompt_profile_id: null,
        routing_mode: "auto",
        used_web_search: false,
        used_image_search: false,
        search_context: null,
        token_usage: null,
        latency_ms: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      return {
        message: userChat,
        response: aiChat,
      };
    } catch (error) {
      console.error("Error sending anonymous message:", error);
      throw error instanceof Error ? error : new Error("Failed to send anonymous message");
    }
  }
}
