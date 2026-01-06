// Chat Store - Svelte 5 runes for chat and conversation state
import { chatService, searchService } from "@/Service";
import type {
  Chat,
  Conversation,
  ChatMessage,
  SendMessageOptions,
  OpenRouterMessage,
} from "@/Types";
import authStore from "./auth.svelte";

// Reactive state using Svelte 5 runes
let conversations = $state<Conversation[]>([]);
let currentConversation = $state<Conversation | null>(null);
let messages = $state<Chat[]>([]);
let isLoading = $state(false);
let isSending = $state(false);
let error = $state<string | null>(null);

// Chat options state
let webSearchEnabled = $state(false);
let imageSearchEnabled = $state(false);
let currentPromptProfileId = $state<string | null>(null);

// Streaming state
let streamingContent = $state("");
let isStreaming = $state(false);

async function loadConversations() {
  try {
    isLoading = true;
    error = null;

    const response = await chatService.getConversations();
    if (response.success && response.data) {
      conversations = response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load conversations";
  } finally {
    isLoading = false;
  }
}

async function loadConversation(id: string) {
  try {
    isLoading = true;
    error = null;

    const response = await chatService.getConversationById(id);
    if (response.success && response.data) {
      currentConversation = response.data;
      await loadMessages(id);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load conversation";
  } finally {
    isLoading = false;
  }
}

async function loadMessages(conversationId: string) {
  try {
    const response = await chatService.getMessages(conversationId);
    if (response.success && response.data) {
      messages = response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load messages";
  }
}

async function createNewConversation(title?: string, systemPrompt?: string) {
  try {
    isLoading = true;
    error = null;

    const response = await chatService.createConversation({
      title: title || "New Conversation",
      system_prompt_snapshot: systemPrompt,
      auto_routing_enabled: true,
    });

    if (response.success && response.data) {
      currentConversation = response.data;
      conversations = [response.data, ...conversations];
      messages = [];
      return response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to create conversation";
    return null;
  } finally {
    isLoading = false;
  }
}

async function deleteConversation(id: string) {
  try {
    const response = await chatService.deleteConversation(id);
    if (response.success) {
      conversations = conversations.filter((c) => c.id !== id);
      if (currentConversation?.id === id) {
        currentConversation = null;
        messages = [];
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to delete conversation";
  }
}

async function sendMessage(content: string, modelKey: string, options?: SendMessageOptions) {
  // For anonymous users, handle differently
  if (!authStore.isAuthenticated) {
    return await sendAnonymousMessage(content, modelKey, options);
  }

  if (!currentConversation) {
    // Create new conversation first
    const conv = await createNewConversation(chatService.generateTitle(content));
    if (!conv) return null;
  }

  try {
    isSending = true;
    error = null;

    // Add user message to local state immediately
    const userMessage: Chat = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation!.id,
      role: "user",
      content,
      model_id: null,
      prompt_profile_id: null,
      routing_mode: options?.autoRouting ? "auto" : "manual",
      used_web_search: webSearchEnabled,
      used_image_search: imageSearchEnabled,
      search_context: null,
      token_usage: null,
      latency_ms: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    messages = [...messages, userMessage];

    // Perform web search if enabled
    let searchContext = "";
    if (webSearchEnabled) {
      const searchResults = await searchService.quickWebSearch(content);
      searchContext = searchService.formatWebResultsForContext(searchResults);
    }

    // Build messages array for AI
    const aiMessages: OpenRouterMessage[] = chatService.toOpenRouterMessages(messages);
    if (searchContext) {
      aiMessages.push({
        role: "system",
        content: `Here are relevant web search results:\n\n${searchContext}`,
      });
    }

    // Send to AI
    const response = await chatService.sendToAI(currentConversation!.id, aiMessages, modelKey, {
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      useWebSearch: webSearchEnabled,
      useImageSearch: imageSearchEnabled,
      promptProfileId: currentPromptProfileId || undefined,
    });

    if (response.success && response.data) {
      // Replace temp message with actual and add response
      messages = messages.filter((m) => m.id !== userMessage.id);
      messages = [...messages, response.data.message, response.data.response];

      // Update conversation title if it's the first message
      if (messages.length === 2 && currentConversation) {
        const newTitle = chatService.generateTitle(content);
        await chatService.updateConversation(currentConversation.id, { title: newTitle });
        currentConversation = { ...currentConversation, title: newTitle };
        conversations = conversations.map((c) =>
          c.id === currentConversation!.id ? { ...c, title: newTitle } : c
        );
      }

      return response.data.response;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to send message";
    // Remove temp message on error
    messages = messages.filter((m) => !m.id.startsWith("temp-"));
    return null;
  }
}

async function sendAnonymousMessage(
  content: string,
  modelKey: string,
  options?: SendMessageOptions
) {
  try {
    isSending = true;
    error = null;

    // Add user message to local state immediately
    const userMessage: Chat = {
      id: `temp-${Date.now()}`,
      conversation_id: "anonymous",
      role: "user",
      content,
      model_id: null,
      prompt_profile_id: null,
      routing_mode: options?.autoRouting ? "auto" : "manual",
      used_web_search: webSearchEnabled,
      used_image_search: imageSearchEnabled,
      search_context: null,
      token_usage: null,
      latency_ms: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    messages = [...messages, userMessage];

    // Perform web search if enabled
    let searchContext = "";
    if (webSearchEnabled) {
      const searchResults = await searchService.quickWebSearch(content);
      searchContext = searchService.formatWebResultsForContext(searchResults);
    }

    // Build messages array for AI (include conversation history for context)
    const aiMessages: OpenRouterMessage[] = chatService.toOpenRouterMessages(
      messages.filter((m) => m.role !== "system") // Exclude system messages for anonymous chat
    );
    if (searchContext) {
      aiMessages.push({
        role: "system",
        content: `Here are relevant web search results:\n\n${searchContext}`,
      });
    }

    // Send anonymous message to AI
    const response = await chatService.sendAnonymousToAI(aiMessages, modelKey, {
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      useWebSearch: webSearchEnabled,
      useImageSearch: imageSearchEnabled,
    });

    if (response.success && response.data) {
      // Replace temp message with response data
      messages = messages.filter((m) => m.id !== userMessage.id);
      messages = [...messages, response.data.userMessage, response.data.aiResponse];

      return response.data.aiResponse;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to send message";
    // Remove temp message on error
    messages = messages.filter((m) => !m.id.startsWith("temp-"));
    return null;
  } finally {
    isSending = false;
  }
}

function setWebSearchEnabled(enabled: boolean) {
  webSearchEnabled = enabled;
}

function setImageSearchEnabled(enabled: boolean) {
  imageSearchEnabled = enabled;
}

function setPromptProfileId(id: string | null) {
  currentPromptProfileId = id;
}

function clearCurrentConversation() {
  currentConversation = null;
  messages = [];
}

// Export store object with getters for reactive access
export const chatStore = {
  get conversations() {
    return conversations;
  },
  get currentConversation() {
    return currentConversation;
  },
  get messages() {
    return messages;
  },
  get isLoading() {
    return isLoading;
  },
  get isSending() {
    return isSending;
  },
  get error() {
    return error;
  },
  get webSearchEnabled() {
    return webSearchEnabled;
  },
  get imageSearchEnabled() {
    return imageSearchEnabled;
  },
  get currentPromptProfileId() {
    return currentPromptProfileId;
  },
  get streamingContent() {
    return streamingContent;
  },
  get isStreaming() {
    return isStreaming;
  },

  loadConversations,
  loadConversation,
  loadMessages,
  createNewConversation,
  deleteConversation,
  sendMessage,
  setWebSearchEnabled,
  setImageSearchEnabled,
  setPromptProfileId,
  clearCurrentConversation,
};

export default chatStore;
