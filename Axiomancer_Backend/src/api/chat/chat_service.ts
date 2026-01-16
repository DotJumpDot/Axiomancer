import { ChatQuery } from "./chat_query";
import { openRouterClient, OpenRouterClient } from "@/api/ai/ai_openrouter";
import { getAiModelByModelKey } from "@/api/ai/ai_query";
import { getPromptProfileById } from "@/api/prompt/prompt_query";
import { getUserById } from "@/api/user/user_query";
import { decryptApiKey } from "@/api/user/user_service";
import { DuckDuckGoService } from "@/api/search/duckduckgo/duckduckgo_service";
import type {
  Chat,
  CreateChatRequest,
  UpdateChatRequest,
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
  ChatAiRespond,
} from "./chat_type";
import type { OpenRouterRequest } from "@/api/ai/ai_type";

export class ChatService {
  // Conversation management
  static async getAllConversations(userUuid?: string): Promise<Conversation[]> {
    try {
      return await ChatQuery.getAllConversations(userUuid);
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
    userUuid?: string,
    autoRouting?: boolean
  ): Promise<Conversation> {
    try {
      // Validate required fields
      if (!conversation.title?.trim()) {
        throw new Error("Conversation title is required");
      }

      // Single mode defaults to auto_routing = false, auto mode = true
      const effectiveAutoRouting = autoRouting ?? conversation.auto_routing_enabled ?? false;

      return await ChatQuery.createConversation(conversation, userUuid, effectiveAutoRouting);
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

  static async archiveConversation(id: string, archived: boolean): Promise<Conversation | null> {
    try {
      return await this.updateConversation(id, { archived });
    } catch (error) {
      console.error("Error archiving conversation:", error);
      throw error instanceof Error ? error : new Error("Failed to archive conversation");
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

  //! Send message and get AI response with error handling
  static async sendMessage(
    conversationId: string,
    userMessage: string,
    modelKey?: string,
    promptProfileId?: string,
    options?: {
      webSearch?: boolean;
      imageSearch?: boolean;
      autoRouting?: boolean;
    },
    userId?: number
  ): Promise<{
    userMessage: Chat;
    aiResponse?: ChatAiRespond;
  }> {
    let savedUserMessage: Chat | null = null;

    try {
      // Validate conversation exists
      const conversation = await ChatQuery.getConversationById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Get user's OpenRouter API key if user is authenticated
      let userApiKey: string | undefined;
      if (userId) {
        const user = await getUserById(userId);
        if (user?.openrouter_api_key) {
          try {
            userApiKey = decryptApiKey(user.openrouter_api_key);
          } catch (error) {
            console.error("Error decrypting user API key:", error);
          }
        }
      }

      // Determine which OpenRouter client to use
      const activeClient = userApiKey ? new OpenRouterClient(userApiKey) : openRouterClient;

      if (!activeClient) {
        throw new Error("OpenRouter API key not configured. Please add your API key in settings.");
      }

      // Get the AI model details if modelKey provided
      let actualModelKey = modelKey;
      if (modelKey) {
        const aiModel = await getAiModelByModelKey(modelKey);
        if (aiModel) {
          actualModelKey = aiModel.model_key;
        }
      }

      // Get prompt profile if provided
      let systemPrompt: string | undefined;
      if (promptProfileId) {
        const promptProfile = await getPromptProfileById(promptProfileId);
        if (promptProfile) {
          systemPrompt = promptProfile.system_prompt;
        }
      }

      // Determine routing mode
      const routingMode = options?.autoRouting ? "auto" : "manual";

      // Create user message first
      const userChat: CreateChatRequest = {
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
        model_id: actualModelKey || null,
        prompt_profile_id: promptProfileId || null,
        routing_mode: routingMode,
        used_web_search: options?.webSearch || false,
        used_image_search: options?.imageSearch || false,
        respond_error: false,
      };

      savedUserMessage = await this.createChat(userChat);

      //! Perform web search if enabled
      let searchContext: any = null;
      if (options?.webSearch) {
        try {
          const searchResponse = await DuckDuckGoService.search(userMessage, 5);

          if (searchResponse.success && searchResponse.results.length > 0) {
            searchContext = {
              web_search: {
                query: searchResponse.query,
                results: searchResponse.results,
                abstract: searchResponse.abstract,
                abstractURL: searchResponse.abstractURL,
              },
            };
          }
        } catch (searchError) {
          console.error("SearchError : ", searchError);
          // Continue without search results if search fails
        }
      }

      // Update user message with search context if available
      if (searchContext) {
        await ChatQuery.updateChat(savedUserMessage.id, { search_context: searchContext });
        savedUserMessage.search_context = searchContext;
      }

      // Get conversation history for context
      const previousMessages = await ChatQuery.getChatsByConversationId(conversationId);

      // Build messages array for OpenRouter (excluding the just-added user message)
      const openRouterMessages: { role: "user" | "assistant" | "system"; content: string }[] = [];

      // Add system prompt if available
      if (systemPrompt) {
        openRouterMessages.push({ role: "system", content: systemPrompt });
      }

      // Add web search context to system prompt if available
      if (searchContext?.web_search) {
        const searchFormatted = DuckDuckGoService.formatResultsForAI({
          success: true,
          query: searchContext.web_search.query,
          results: searchContext.web_search.results,
          abstract: searchContext.web_search.abstract,
          abstractURL: searchContext.web_search.abstractURL,
        });

        openRouterMessages.push({
          role: "system",
          content: `The following web search results may help answer the user's question:\\n\\n${searchFormatted}\\n\\nUse this information to provide accurate and up-to-date responses. Cite sources when relevant.`,
        });
      }

      // Add conversation history (limit to last 20 messages for context)
      const recentMessages = previousMessages.slice(-20);
      for (const msg of recentMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          openRouterMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Prepare OpenRouter request
      const openRouterRequest: OpenRouterRequest = {
        model: actualModelKey || "anthropic/claude-3-haiku",
        messages: openRouterMessages,
      };

      // Call OpenRouter API
      const startTime = Date.now();
      const aiResponse = await activeClient.chatCompletion(openRouterRequest);
      const latencyMs = Date.now() - startTime;

      // Extract AI response content
      const aiContent = aiResponse.choices[0]?.message?.content || "No response generated";
      const tokenUsage = aiResponse.usage;
      const finishReason = aiResponse.choices[0]?.finish_reason;

      //* Create chat_ai_respond record
      const chatAiRespond = await ChatQuery.createChatAiRespond({
        ai_content: aiContent,
        model_key: actualModelKey || null,
        token_usage: tokenUsage
          ? {
              prompt_tokens: tokenUsage.prompt_tokens,
              completion_tokens: tokenUsage.completion_tokens,
              total_tokens: tokenUsage.total_tokens,
            }
          : null,
        latency_ms: latencyMs,
        finish_reason: finishReason || null,
      });

      // Update user message to link to AI response
      await ChatQuery.updateChat(savedUserMessage.id, {
        chat_ai_respond_id: chatAiRespond.id,
        respond_error: false,
      });

      // Update local user message with AI response link
      savedUserMessage.chat_ai_respond_id = chatAiRespond.id;

      return {
        userMessage: savedUserMessage,
        aiResponse: chatAiRespond,
      };
    } catch (error) {
      console.error("Error sending message:", error);

      //! Save error message to database even if AI call fails
      if (savedUserMessage) {
        try {
          const errorContent = `Error: ${
            error instanceof Error ? error.message : "Failed to get AI response"
          }`;

          const errorRespond = await ChatQuery.createChatAiRespond({
            ai_content: errorContent,
            model_key: modelKey || null,
            token_usage: null,
            latency_ms: null,
            finish_reason: "error",
          });

          // Update user message to link to error response
          await ChatQuery.updateChat(savedUserMessage.id, {
            chat_ai_respond_id: errorRespond.id,
            respond_error: true,
          });

          // Update local user message
          savedUserMessage.chat_ai_respond_id = errorRespond.id;
          savedUserMessage.respond_error = true;

          return {
            userMessage: savedUserMessage,
            aiResponse: errorRespond,
          };
        } catch (dbError) {
          console.error("Error saving error message to database:", dbError);
        }
      }

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
      const modelKey =
        body.model_key || process.env.SERVER_ANON_MODEL || "xiaomi/mimo-v2-flash:free"; // Default model

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
        chat_ai_respond_id: null,
        respond_error: false,
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
        chat_ai_respond_id: null,
        respond_error: false,
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
