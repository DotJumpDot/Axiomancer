import { ChatQuery } from "./chat_query";
import { openRouterClient, OpenRouterClient } from "@/api/ai/ai_openrouter";
import {
  getAiModelByModelKey,
  getAiModels,
  getOrCreateAiModel,
} from "@/api/ai/ai_query";
import { getPromptProfileById } from "@/api/prompt/prompt_query";
import { getUserById } from "@/api/user/user_query";
import { decryptApiKey } from "@/api/user/user_service";
import { DuckDuckGoService } from "@/api/search/duckduckgo/duckduckgo_service";
import { PixabayService } from "@/api/search/pixabay/pixabay_service";
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
    autoRouting?: boolean,
  ): Promise<Conversation> {
    try {
      // Validate required fields
      if (!conversation.title?.trim()) {
        throw new Error("Conversation title is required");
      }

      // Single mode defaults to auto_routing = false, auto mode = true
      const effectiveAutoRouting =
        autoRouting ?? conversation.auto_routing_enabled ?? false;

      return await ChatQuery.createConversation(
        conversation,
        userUuid,
        effectiveAutoRouting,
      );
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create conversation");
    }
  }

  static async updateConversation(
    id: string,
    updates: UpdateConversationRequest,
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
      throw error instanceof Error
        ? error
        : new Error("Failed to update conversation");
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

  static async archiveConversation(
    id: string,
    archived: boolean,
  ): Promise<Conversation | null> {
    try {
      return await this.updateConversation(id, { archived });
    } catch (error) {
      console.error("Error archiving conversation:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to archive conversation");
    }
  }

  // Chat message management
  static async getChatsByConversationId(
    conversationId: string,
  ): Promise<Chat[]> {
    try {
      // Validate conversation exists
      const conversation = await ChatQuery.getConversationById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return await ChatQuery.getChatsByConversationId(conversationId);
    } catch (error) {
      console.error("Error getting chats:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to retrieve chat messages");
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
      const conversation = await ChatQuery.getConversationById(
        chat.conversation_id,
      );
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Validate required fields
      if (!chat.role || !chat.content?.trim()) {
        throw new Error("Chat role and content are required");
      }

      // Validate role
      if (!["user", "assistant", "system"].includes(chat.role)) {
        throw new Error(
          "Invalid chat role. Must be 'user', 'assistant', or 'system'",
        );
      }

      return await ChatQuery.createChat(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create chat message");
    }
  }

  static async updateChat(
    id: string,
    updates: UpdateChatRequest,
  ): Promise<Chat | null> {
    try {
      // Validate chat exists
      const existing = await ChatQuery.getChatById(id);
      if (!existing) {
        return null;
      }

      // Validate role if provided
      if (
        updates.role !== undefined &&
        !["user", "assistant", "system"].includes(updates.role)
      ) {
        throw new Error(
          "Invalid chat role. Must be 'user', 'assistant', or 'system'",
        );
      }

      // Validate content if provided
      if (updates.content !== undefined && !updates.content.trim()) {
        throw new Error("Chat content cannot be empty");
      }

      return await ChatQuery.updateChat(id, updates);
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update chat message");
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
      steamSearch?: boolean;
      autoRouting?: boolean;
      memoryCount?: number;
      reasoningEffort?: string;
      enhanceSearchMode?: "disabled" | "server-default" | "current-model";
    },
    userId?: number,
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
      const activeClient = userApiKey
        ? new OpenRouterClient(userApiKey)
        : openRouterClient;

      if (!activeClient) {
        throw new Error(
          "OpenRouter API key not configured. Please add your API key in settings.",
        );
      }

      // Get the AI model details if modelKey provided - auto-create if missing
      let actualModelKey = modelKey;
      let modelId: string | null = null;
      if (modelKey) {
        const aiModel = await getOrCreateAiModel(modelKey);
        actualModelKey = aiModel.model_key;
        modelId = aiModel.id;
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

      // Store the decision model (the model used for routing in auto mode)
      const decisionModelKey = actualModelKey;

      // Create user message first (without search_log_uuid initially)
      const userChat: CreateChatRequest = {
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
        model_id: modelId || null,
        prompt_profile_id: promptProfileId || null,
        routing_mode: routingMode,
        respond_error: false,
      };

      savedUserMessage = await this.createChat(userChat);

      //! Enhanced search: Use AI to optimize search queries if enabled
      let enhancedWebQuery = userMessage;
      let enhancedImageQuery = userMessage;
      let decisionPromptModel: string | null = null;
      let promptWebSearch: string | null = null;
      let promptPictureSearch: string | null = null;

      if (
        options?.enhanceSearchMode &&
        options.enhanceSearchMode !== "disabled" &&
        (options?.webSearch || options?.imageSearch)
      ) {
        try {
          // Determine which model to use for enhanced search
          let enhanceModelKey: string;
          if (options.enhanceSearchMode === "server-default") {
            enhanceModelKey =
              process.env.SERVER_ANON_MODEL || "openai/gpt-oss-120b:free";
          } else {
            // current-model
            enhanceModelKey = actualModelKey || "openai/gpt-oss-120b:free";
          }
          decisionPromptModel = enhanceModelKey;

          // Create prompt for extracting search keywords
          const enhancePrompt = `You are a search query optimizer. Extract the most relevant search keywords from the user's message.
Rules:
- Extract only the key concepts/terms that would be good for searching
- Remove conversational words like "can you", "tell me", "what is", "please", etc.
- Return ONLY the optimized search query, nothing else
- Keep it concise (1-5 words typically)
- If the message is already a good search query, return it as-is

User message: "${userMessage}"

Optimized search query:`;

          const enhanceRequest: OpenRouterRequest = {
            model: enhanceModelKey,
            messages: [{ role: "user", content: enhancePrompt }],
          };

          const enhanceResponse =
            await activeClient.chatCompletion(enhanceRequest);
          const optimizedQuery =
            enhanceResponse.choices[0]?.message?.content?.trim() || userMessage;

          // Use the optimized query for both searches
          enhancedWebQuery = optimizedQuery;
          enhancedImageQuery = optimizedQuery;

          console.log(
            `[EnhancedSearch] Original: "${userMessage}" -> Optimized: "${optimizedQuery}"`,
          );
        } catch (enhanceError) {
          console.error(
            "Enhanced search optimization failed, using original query:",
            enhanceError,
          );
          // Fall back to original message if enhancement fails
        }
      }

      //! Perform web search and/or image search if enabled
      let searchContextWeb: any = null;
      let searchContextPicture: any = null;

      if (options?.webSearch) {
        try {
          promptWebSearch = enhancedWebQuery;
          const searchResponse = await DuckDuckGoService.search(
            enhancedWebQuery,
            5,
          );

          if (searchResponse.success && searchResponse.results.length > 0) {
            searchContextWeb = {
              query: searchResponse.query,
              results: searchResponse.results,
              abstract: searchResponse.abstract,
              abstractURL: searchResponse.abstractURL,
            };
          }
        } catch (searchError) {
          console.error("SearchError : ", searchError);
          // Continue without search results if search fails
        }
      }

      //! Perform Pixabay image search if enabled
      if (options?.imageSearch) {
        try {
          promptPictureSearch = enhancedImageQuery;
          const imageResponse = await PixabayService.search(
            enhancedImageQuery,
            5,
            "photo",
          );
          if (imageResponse.success && imageResponse.results.length > 0) {
            searchContextPicture = {
              query: enhancedImageQuery,
              results: imageResponse.results.map((img: any) => ({
                id: img.id,
                previewURL: img.previewURL,
                webformatURL: img.webformatURL,
                largeImageURL: img.largeImageURL,
                tags: img.tags,
                pageURL: img.pageURL,
                user: img.user,
                likes: img.likes,
                views: img.views,
              })),
            };
          } else {
            // Store empty results to indicate search was performed but no results found
            searchContextPicture = {
              query: enhancedImageQuery,
              results: [],
            };
          }
        } catch (imageError) {
          console.error("ImageSearchError : ", imageError);
          // Store error state
          searchContextPicture = {
            query: enhancedImageQuery,
            results: [],
            error:
              imageError instanceof Error
                ? imageError.message
                : "Image search failed",
          };
        }
      }

      // Determine memory count (default to 20 if not specified)
      const memoryCount = options?.memoryCount ?? 20;

      // Normalize reasoning effort - convert "disabled" to "none" for storage
      const normalizedReasoningEffort =
        options?.reasoningEffort === "disabled"
          ? "none"
          : options?.reasoningEffort || null;

      //* Create search log record
      const searchLog = await ChatQuery.createSearchLog({
        chat_id: savedUserMessage.id,
        memory_chat_include: memoryCount,
        used_web_search: options?.webSearch || false,
        used_image_search: options?.imageSearch || false,
        used_steam: options?.steamSearch || false,
        reasoning_effort: normalizedReasoningEffort,
        decision_prompt_model: decisionPromptModel,
        prompt_web_search: promptWebSearch,
        prompt_picture_search: promptPictureSearch,
        search_context_web: searchContextWeb,
        search_context_picture: searchContextPicture,
      });

      // Update user message with search log UUID
      await ChatQuery.updateChat(savedUserMessage.id, {
        search_log_uuid: searchLog.id_uuid,
      });
      savedUserMessage.search_log_uuid = searchLog.id_uuid;

      // Get conversation history for context
      const previousMessages =
        await ChatQuery.getChatsByConversationId(conversationId);

      // Build messages array for OpenRouter (excluding the just-added user message)
      const openRouterMessages: {
        role: "user" | "assistant" | "system";
        content: string;
      }[] = [];

      // Add system prompt if available (but NOT in auto-routing mode - routing prompt is only for decision)
      if (systemPrompt && !options?.autoRouting) {
        openRouterMessages.push({ role: "system", content: systemPrompt });
      }

      // Add web search context to system prompt if available
      if (searchContextWeb) {
        const searchFormatted = DuckDuckGoService.formatResultsForAI({
          success: true,
          query: searchContextWeb.query,
          results: searchContextWeb.results,
          abstract: searchContextWeb.abstract,
          abstractURL: searchContextWeb.abstractURL,
        });

        openRouterMessages.push({
          role: "system",
          content: `The following web search results may help answer the user's question:\\n\\n${searchFormatted}\\n\\nUse this information to provide accurate and up-to-date responses. Cite sources when relevant.`,
        });
      }

      // Add conversation history (limit to memoryCount messages for context)
      const recentMessages = previousMessages.slice(-memoryCount);
      for (const msg of recentMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          openRouterMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      //* Auto-routing logic: Use decision model to select the best model
      let routingInfo: { selectedModel: string; reasoning: string } | null =
        null;

      if (options?.autoRouting && promptProfileId) {
        try {
          // Build decision messages with routing prompt
          const decisionMessages: {
            role: "user" | "assistant" | "system";
            content: string;
          }[] = [];

          // Add system prompt from prompt profile
          if (systemPrompt) {
            decisionMessages.push({ role: "system", content: systemPrompt });
          }

          // Add user message for decision
          decisionMessages.push({ role: "user", content: userMessage });

          // Call decision model
          const decisionRequest: OpenRouterRequest = {
            model: actualModelKey || "openai/gpt-oss-120b:free",
            messages: decisionMessages,
          };

          const decisionResponse =
            await activeClient.chatCompletion(decisionRequest);
          const decisionContent =
            decisionResponse.choices[0]?.message?.content || "";

          // Try to parse JSON response
          try {
            // Remove markdown code blocks if present
            const cleanedContent = decisionContent
              .replace(/```json\s*|\s*```/g, "")
              .trim();
            const parsedDecision = JSON.parse(cleanedContent);

            if (parsedDecision.selected_model && parsedDecision.reasoning) {
              routingInfo = {
                selectedModel: parsedDecision.selected_model,
                reasoning: parsedDecision.reasoning,
              };

              // Update actualModelKey to the selected model's model_key
              // Need to find the model by display name with improved matching
              const allModels = await getAiModels();

              // Try exact match first
              let selectedModel = allModels.find(
                (m: any) => m.display_name === parsedDecision.selected_model,
              );

              // If no exact match, try case-insensitive partial match
              if (!selectedModel) {
                const searchLower = parsedDecision.selected_model.toLowerCase();
                selectedModel = allModels.find((m: any) => {
                  const displayLower = m.display_name.toLowerCase();
                  // Remove " (free)" suffix for better matching
                  const cleanSearch = searchLower
                    .replace(/\s*\(free\)\s*$/i, "")
                    .trim();
                  const cleanDisplay = displayLower
                    .replace(/\s*\(free\)\s*$/i, "")
                    .trim();
                  return (
                    cleanDisplay === cleanSearch ||
                    displayLower.includes(cleanSearch)
                  );
                });
              }

              if (selectedModel) {
                actualModelKey = selectedModel.model_key;
              } else {
                console.warn(
                  `Could not find model for: ${parsedDecision.selected_model}`,
                );
              }
            }
          } catch (parseError) {
            console.error(
              "Failed to parse decision model response:",
              parseError,
            );
            // Continue with original model if parsing fails
          }
        } catch (decisionError) {
          console.error("Error in auto-routing decision:", decisionError);
          // Continue with original model if decision fails
        }
      }

      // Prepare OpenRouter request for actual response
      const openRouterRequest: OpenRouterRequest = {
        model: actualModelKey || "openai/gpt-oss-120b:free",
        messages: openRouterMessages,
      };

      // Add reasoning parameter if provided and not disabled/none
      if (
        options?.reasoningEffort &&
        options.reasoningEffort !== "disabled" &&
        options.reasoningEffort !== "none"
      ) {
        openRouterRequest.reasoning = {
          effort: options.reasoningEffort,
        };
      }

      // Call OpenRouter API for actual response
      const startTime = Date.now();
      const aiResponse = await activeClient.chatCompletion(openRouterRequest);
      const latencyMs = Date.now() - startTime;

      // Extract AI response content
      let aiContent =
        aiResponse.choices[0]?.message?.content || "No response generated";

      // Prepend routing info if available
      if (routingInfo) {
        const routingPrefix = `**Model:** ${routingInfo.selectedModel} (\`${actualModelKey}\`)\n**Reason:** ${routingInfo.reasoning}\n\n---\n\n`;
        aiContent = routingPrefix + aiContent;
      }

      const tokenUsage = aiResponse.usage;
      const finishReason = aiResponse.choices[0]?.finish_reason;

      //* Create chat_ai_respond record
      const chatAiRespond = await ChatQuery.createChatAiRespond({
        ai_content: aiContent,
        model_key: actualModelKey || null,
        token_usage:
          tokenUsage &&
          typeof tokenUsage.prompt_tokens === "number" &&
          typeof tokenUsage.completion_tokens === "number" &&
          typeof tokenUsage.total_tokens === "number"
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

      // Fetch the complete message with joined search_log data
      const completeUserMessage = await ChatQuery.getChatById(
        savedUserMessage.id,
      );

      return {
        userMessage: completeUserMessage || savedUserMessage,
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

      throw error instanceof Error
        ? error
        : new Error("Failed to send message");
    }
  }

  //! Send message with streaming response
  static async sendMessageStream(
    conversationId: string,
    userMessage: string,
    modelKey?: string,
    promptProfileId?: string,
    options?: {
      webSearch?: boolean;
      imageSearch?: boolean;
      steamSearch?: boolean;
      autoRouting?: boolean;
      memoryCount?: number;
      reasoningEffort?: string;
      enhanceSearchMode?: "disabled" | "server-default" | "current-model";
    },
    userId?: number,
    onChunk?: (chunk: string, type?: "content" | "reasoning") => void,
  ): Promise<{
    userMessage: Chat;
    aiResponse?: ChatAiRespond;
  }> {
    let savedUserMessage: Chat | null = null;
    let fullAiContent = "";

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
      const activeClient = userApiKey
        ? new OpenRouterClient(userApiKey)
        : openRouterClient;

      if (!activeClient) {
        throw new Error(
          "OpenRouter API key not configured. Please add your API key in settings.",
        );
      }

      // Get the AI model details if modelKey provided - auto-create if missing
      let actualModelKey = modelKey;
      let modelId: string | null = null;
      if (modelKey) {
        const aiModel = await getOrCreateAiModel(modelKey);
        actualModelKey = aiModel.model_key;
        modelId = aiModel.id;
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

      // Store the decision model (the model used for routing in auto mode)
      const decisionModelKey = actualModelKey;

      // Create user message first
      const userChat: CreateChatRequest = {
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
        model_id: modelId || null,
        prompt_profile_id: promptProfileId || null,
        routing_mode: routingMode,
        respond_error: false,
      };

      savedUserMessage = await this.createChat(userChat);

      //! Enhanced search for streaming: Use AI to optimize search queries if enabled
      let enhancedWebQuery = userMessage;
      let enhancedImageQuery = userMessage;
      let decisionPromptModel: string | null = null;
      let promptWebSearch: string | null = null;
      let promptPictureSearch: string | null = null;

      if (
        options?.enhanceSearchMode &&
        options.enhanceSearchMode !== "disabled" &&
        (options?.webSearch || options?.imageSearch)
      ) {
        try {
          // Determine which model to use for enhanced search
          let enhanceModelKey: string;
          if (options.enhanceSearchMode === "server-default") {
            enhanceModelKey =
              process.env.SERVER_ANON_MODEL || "openai/gpt-oss-120b:free";
          } else {
            // current-model
            enhanceModelKey = actualModelKey || "openai/gpt-oss-120b:free";
          }
          decisionPromptModel = enhanceModelKey;

          // Create prompt for extracting search keywords
          const enhancePrompt = `You are a search query optimizer. Extract the most relevant search keywords from the user's message.
Rules:
- Extract only the key concepts/terms that would be good for searching
- Remove conversational words like "can you", "tell me", "what is", "please", etc.
- Return ONLY the optimized search query, nothing else
- Keep it concise (1-5 words typically)
- If the message is already a good search query, return it as-is

User message: "${userMessage}"

Optimized search query:`;

          const enhanceRequest: OpenRouterRequest = {
            model: enhanceModelKey,
            messages: [{ role: "user", content: enhancePrompt }],
          };

          const enhanceResponse =
            await activeClient.chatCompletion(enhanceRequest);
          const optimizedQuery =
            enhanceResponse.choices[0]?.message?.content?.trim() || userMessage;

          // Use the optimized query for both searches
          enhancedWebQuery = optimizedQuery;
          enhancedImageQuery = optimizedQuery;

          console.log(
            `[EnhancedSearch-Stream] Original: "${userMessage}" -> Optimized: "${optimizedQuery}"`,
          );
        } catch (enhanceError) {
          console.error(
            "Enhanced search optimization failed, using original query:",
            enhanceError,
          );
          // Fall back to original message if enhancement fails
        }
      }

      // Perform web search if enabled
      let searchContextWeb: any = null;
      let searchContextPicture: any = null;

      if (options?.webSearch) {
        try {
          promptWebSearch = enhancedWebQuery;
          const searchResponse = await DuckDuckGoService.search(
            enhancedWebQuery,
            5,
          );

          if (searchResponse.success && searchResponse.results.length > 0) {
            searchContextWeb = {
              query: searchResponse.query,
              results: searchResponse.results,
              abstract: searchResponse.abstract,
              abstractURL: searchResponse.abstractURL,
            };
          }
        } catch (searchError) {
          console.error("SearchError : ", searchError);
        }
      }

      //! Perform Pixabay image search if enabled (streaming version)
      if (options?.imageSearch) {
        try {
          promptPictureSearch = enhancedImageQuery;
          const imageResponse = await PixabayService.search(
            enhancedImageQuery,
            5,
            "photo",
          );
          if (imageResponse.success && imageResponse.results.length > 0) {
            searchContextPicture = {
              query: enhancedImageQuery,
              results: imageResponse.results.map((img: any) => ({
                id: img.id,
                previewURL: img.previewURL,
                webformatURL: img.webformatURL,
                largeImageURL: img.largeImageURL,
                tags: img.tags,
                pageURL: img.pageURL,
                user: img.user,
                likes: img.likes,
                views: img.views,
              })),
            };
          } else {
            searchContextPicture = {
              query: enhancedImageQuery,
              results: [],
            };
          }
        } catch (imageError) {
          console.error("ImageSearchError : ", imageError);
          searchContextPicture = {
            query: enhancedImageQuery,
            results: [],
            error:
              imageError instanceof Error
                ? imageError.message
                : "Image search failed",
          };
        }
      }

      // Create search log record
      const memoryCount = options?.memoryCount ?? 20;

      // Normalize reasoning effort - convert "disabled" to "none" for storage
      const normalizedReasoningEffort =
        options?.reasoningEffort === "disabled"
          ? "none"
          : options?.reasoningEffort || null;

      const searchLog = await ChatQuery.createSearchLog({
        chat_id: savedUserMessage.id,
        memory_chat_include: memoryCount,
        used_web_search: options?.webSearch || false,
        used_image_search: options?.imageSearch || false,
        used_steam: options?.steamSearch || false,
        reasoning_effort: normalizedReasoningEffort,
        decision_prompt_model: decisionPromptModel,
        prompt_web_search: promptWebSearch,
        prompt_picture_search: promptPictureSearch,
        search_context_web: searchContextWeb,
        search_context_picture: searchContextPicture,
      });

      // Update user message with search log UUID
      await ChatQuery.updateChat(savedUserMessage.id, {
        search_log_uuid: searchLog.id_uuid,
      });
      savedUserMessage.search_log_uuid = searchLog.id_uuid;

      // Get conversation history for context
      const previousMessages =
        await ChatQuery.getChatsByConversationId(conversationId);

      // Build messages array for OpenRouter
      const openRouterMessages: {
        role: "user" | "assistant" | "system";
        content: string;
      }[] = [];

      // Add system prompt if available (but NOT in auto-routing mode - routing prompt is only for decision)
      if (systemPrompt && !options?.autoRouting) {
        openRouterMessages.push({ role: "system", content: systemPrompt });
      }

      if (searchContextWeb) {
        const searchFormatted = DuckDuckGoService.formatResultsForAI({
          success: true,
          query: searchContextWeb.query,
          results: searchContextWeb.results,
          abstract: searchContextWeb.abstract,
          abstractURL: searchContextWeb.abstractURL,
        });

        openRouterMessages.push({
          role: "system",
          content: `The following web search results may help answer the user's question:\n\n${searchFormatted}\n\nUse this information to provide accurate and up-to-date responses. Cite sources when relevant.`,
        });
      }

      const recentMessages = previousMessages.slice(-memoryCount);
      for (const msg of recentMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          openRouterMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      //* Auto-routing logic for streaming: Use decision model to select the best model
      let routingInfo: { selectedModel: string; reasoning: string } | null =
        null;

      if (options?.autoRouting && promptProfileId) {
        try {
          // Build decision messages with routing prompt
          const decisionMessages: {
            role: "user" | "assistant" | "system";
            content: string;
          }[] = [];

          // Add system prompt from prompt profile
          if (systemPrompt) {
            decisionMessages.push({ role: "system", content: systemPrompt });
          }

          // Add user message for decision
          decisionMessages.push({ role: "user", content: userMessage });

          // Call decision model (non-streaming)
          const decisionRequest: OpenRouterRequest = {
            model: actualModelKey || "openai/gpt-oss-120b:free",
            messages: decisionMessages,
          };

          const decisionResponse =
            await activeClient.chatCompletion(decisionRequest);
          const decisionContent =
            decisionResponse.choices[0]?.message?.content || "";

          // Try to parse JSON response
          try {
            // Remove markdown code blocks if present
            const cleanedContent = decisionContent
              .replace(/```json\s*|\s*```/g, "")
              .trim();
            const parsedDecision = JSON.parse(cleanedContent);

            if (parsedDecision.selected_model && parsedDecision.reasoning) {
              routingInfo = {
                selectedModel: parsedDecision.selected_model,
                reasoning: parsedDecision.reasoning,
              };

              // Update actualModelKey to the selected model's model_key
              // Need to find the model by display name with improved matching
              const allModels = await getAiModels();

              // Try exact match first
              let selectedModel = allModels.find(
                (m: any) => m.display_name === parsedDecision.selected_model,
              );

              // If no exact match, try case-insensitive partial match
              if (!selectedModel) {
                const searchLower = parsedDecision.selected_model.toLowerCase();
                selectedModel = allModels.find((m: any) => {
                  const displayLower = m.display_name.toLowerCase();
                  // Remove " (free)" suffix for better matching
                  const cleanSearch = searchLower
                    .replace(/\s*\(free\)\s*$/i, "")
                    .trim();
                  const cleanDisplay = displayLower
                    .replace(/\s*\(free\)\s*$/i, "")
                    .trim();
                  return (
                    cleanDisplay === cleanSearch ||
                    displayLower.includes(cleanSearch)
                  );
                });
              }

              if (selectedModel) {
                actualModelKey = selectedModel.model_key;
              } else {
                console.warn(
                  `Could not find model for: ${parsedDecision.selected_model}`,
                );
              }
            }
          } catch (parseError) {
            console.error(
              "Failed to parse decision model response:",
              parseError,
            );
            // Continue with original model if parsing fails
          }
        } catch (decisionError) {
          console.error("Error in auto-routing decision:", decisionError);
          // Continue with original model if decision fails
        }
      }

      // Prepare OpenRouter request for actual streaming response
      const openRouterRequest: OpenRouterRequest = {
        model: actualModelKey || "openai/gpt-oss-120b:free",
        messages: openRouterMessages,
      };

      // Add reasoning parameter if provided and not disabled/none
      if (
        options?.reasoningEffort &&
        options.reasoningEffort !== "disabled" &&
        options.reasoningEffort !== "none"
      ) {
        openRouterRequest.reasoning = {
          effort: options.reasoningEffort,
        };
      }

      // Send routing info first if available
      if (routingInfo && onChunk) {
        const routingPrefix = `**Model:** ${routingInfo.selectedModel} (\`${actualModelKey}\`)\n**Reason:** ${routingInfo.reasoning}\n\n---\n\n`;
        onChunk(routingPrefix, "content");
        fullAiContent += routingPrefix;
      }

      // Stream the response
      const startTime = Date.now();
      let reasoningContent = "";
      let tokenUsage: any = null;
      for await (const chunk of activeClient.streamChatCompletion(
        openRouterRequest,
      )) {
        if (chunk.type === "reasoning") {
          reasoningContent += chunk.data;
          // Send reasoning chunk to frontend for streaming display
          if (onChunk) {
            onChunk(chunk.data, "reasoning");
          }
        } else if (chunk.type === "content") {
          fullAiContent += chunk.data;
          if (onChunk) {
            onChunk(chunk.data, "content");
          }
        } else if (chunk.type === "usage") {
          tokenUsage = chunk.data;
        }
      }
      const latencyMs = Date.now() - startTime;

      // Update search log with reasoning content if available
      if (reasoningContent && searchLog) {
        await ChatQuery.updateSearchLogReasoningContent(
          searchLog.id_uuid,
          reasoningContent,
        );
        console.log(
          `[Chat Service] Saved reasoning content to search log ${searchLog.id_uuid}`,
        );
      }

      // Create chat_ai_respond record
      const chatAiRespond = await ChatQuery.createChatAiRespond({
        ai_content: fullAiContent,
        model_key: actualModelKey || null,
        token_usage:
          tokenUsage &&
          typeof tokenUsage.prompt_tokens === "number" &&
          typeof tokenUsage.completion_tokens === "number" &&
          typeof tokenUsage.total_tokens === "number"
            ? {
                prompt_tokens: tokenUsage.prompt_tokens,
                completion_tokens: tokenUsage.completion_tokens,
                total_tokens: tokenUsage.total_tokens,
              }
            : null,
        latency_ms: latencyMs,
        finish_reason: "stop",
      });

      // Update user message to link to AI response
      await ChatQuery.updateChat(savedUserMessage.id, {
        chat_ai_respond_id: chatAiRespond.id,
        respond_error: false,
      });

      savedUserMessage.chat_ai_respond_id = chatAiRespond.id;

      const completeUserMessage = await ChatQuery.getChatById(
        savedUserMessage.id,
      );

      return {
        userMessage: completeUserMessage || savedUserMessage,
        aiResponse: chatAiRespond,
      };
    } catch (error) {
      console.error("Error sending message with stream:", error);

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

          await ChatQuery.updateChat(savedUserMessage.id, {
            chat_ai_respond_id: errorRespond.id,
            respond_error: true,
          });

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

      throw error instanceof Error
        ? error
        : new Error("Failed to send message");
    }
  }

  // Send anonymous message (no database storage)
  static async sendAnonymousMessage(body: {
    message: string;
    model_key?: string;
  }): Promise<{
    message: Chat;
    response: Chat;
  }> {
    try {
      if (!openRouterClient) {
        throw new Error("AI service not configured");
      }

      const userMessage = body.message;
      const modelKey =
        body.model_key ||
        process.env.SERVER_ANON_MODEL ||
        "openai/gpt-oss-120b:free"; // Default model

      // Get AI response
      const aiContent = await openRouterClient.simpleChat(
        modelKey,
        userMessage,
      );

      // Create Chat objects for response
      const userChat: Chat = {
        id: `anon-user-${Date.now()}`,
        conversation_id: "anonymous",
        role: "user",
        content: userMessage,
        model_id: null,
        prompt_profile_id: null,
        routing_mode: "auto",
        search_log_uuid: null,
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
        search_log_uuid: null,
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
      throw error instanceof Error
        ? error
        : new Error("Failed to send anonymous message");
    }
  }
}
