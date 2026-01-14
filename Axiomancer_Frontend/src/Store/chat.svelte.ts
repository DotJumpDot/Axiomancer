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
let currentModelKey = $state<string | null>(null);

// Streaming state
let streamingContent = $state("");
let isStreaming = $state(false);

//* Initialize from AxmLogin for single mode
function initializeSingleMode() {
  if (typeof window !== "undefined") {
    // Clean up old localStorage keys if they exist
    localStorage.removeItem("latest_select_model");
    localStorage.removeItem("latest_select_prompt");

    // Load from AxmLogin
    const selections = authStore.getSelections();
    currentModelKey = selections.modelKey;
    currentPromptProfileId = selections.promptId;
  }
}

//* Save single mode selections to AxmLogin
function saveSingleModeSelections() {
  if (typeof window !== "undefined") {
    authStore.saveSelections(currentModelKey, currentPromptProfileId);
  }
}

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
      // Transform user messages into display format: user message + AI response
      const displayMessages: Chat[] = [];
      for (const chat of response.data) {
        // Add user message
        displayMessages.push(chat);

        // If has AI response, create assistant message for display
        if (chat.chat_ai_respond_id && chat.ai_content) {
          displayMessages.push({
            ...chat,
            id: chat.chat_ai_respond_id,
            role: "assistant",
            content: chat.ai_content,
            model_id: chat.ai_model_key || chat.model_id,
          });
        }
      }
      messages = displayMessages;
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

async function updateConversation(id: string, updates: any) {
  try {
    const response = await chatService.updateConversation(id, updates);
    if (response.success && response.data) {
      conversations = conversations.map((c) => (c.id === id ? response.data : c));
      if (currentConversation?.id === id) {
        currentConversation = response.data;
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to update conversation";
  }
}

async function archiveConversation(id: string, archived: boolean) {
  try {
    const response = await chatService.archiveConversation(id, archived);
    if (response.success && response.data) {
      conversations = conversations.map((c) => (c.id === id ? response.data : c));
      if (currentConversation?.id === id) {
        currentConversation = response.data;
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to archive conversation";
  }
}

async function sendMessage(content: string, modelKey: string, options?: SendMessageOptions) {
  // For anonymous users, handle differently
  if (!authStore.isAuthenticated) {
    return await sendAnonymousMessage(content, modelKey, options);
  }

  // Ensure conversation exists before sending message
  if (!currentConversation) {
    console.log("[ChatStore] No current conversation, creating new one...");
    const conv = await createNewConversation(generateConversationTitle(content));
    if (!conv) {
      console.error("[ChatStore] Failed to create conversation");
      error = "Failed to create conversation";
      return null;
    }
    currentConversation = conv;
    console.log("[ChatStore] Created conversation:", conv.id);
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
      model_id: modelKey || null,
      prompt_profile_id: options?.promptProfileId || null,
      routing_mode: options?.autoRouting ? "auto" : "manual",
      used_web_search: webSearchEnabled,
      used_image_search: imageSearchEnabled,
      search_context: null,
      chat_ai_respond_id: null,
      respond_error: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    messages = [...messages, userMessage];

    // Send message to backend API
    const response = await chatService.sendMessage(currentConversation!.id, {
      message: content,
      model_key: modelKey,
      prompt_profile_id: options?.promptProfileId,
      autoRouting: options?.autoRouting,
      webSearch: webSearchEnabled,
      imageSearch: imageSearchEnabled,
    });

    if (response.success && response.data) {
      // Replace temp message with actual saved message
      messages = messages.filter((m) => m.id !== userMessage.id);
      messages = [...messages, response.data.userMessage];

      // Add AI response if available (ChatAiRespond type)
      if (response.data.aiResponse) {
        const aiMessage: Chat = {
          id: response.data.aiResponse.id,
          conversation_id: currentConversation!.id,
          role: "assistant",
          content: response.data.aiResponse.ai_content,
          model_id: response.data.aiResponse.model_key,
          prompt_profile_id: response.data.userMessage.prompt_profile_id,
          routing_mode: response.data.userMessage.routing_mode,
          used_web_search: response.data.userMessage.used_web_search,
          used_image_search: response.data.userMessage.used_image_search,
          search_context: response.data.userMessage.search_context,
          chat_ai_respond_id: null,
          respond_error: response.data.userMessage.respond_error,
          created_at: new Date(response.data.aiResponse.created_at),
          updated_at: new Date(response.data.aiResponse.updated_at),
          ai_token_usage: response.data.aiResponse.token_usage,
          ai_latency_ms: response.data.aiResponse.latency_ms,
          ai_finish_reason: response.data.aiResponse.finish_reason,
        };
        messages = [...messages, aiMessage];
      }

      // Update conversation title if it's the first message
      if (messages.filter((m) => m.role === "user").length === 1 && currentConversation) {
        const newTitle = generateConversationTitle(content);
        await chatService.updateConversation(currentConversation.id, { title: newTitle });
        currentConversation = { ...currentConversation, title: newTitle };
        conversations = conversations.map((c) =>
          c.id === currentConversation!.id ? { ...c, title: newTitle } : c
        );
      }

      return response.data.userMessage;
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

function generateConversationTitle(content: string): string {
  return content.length > 50 ? content.substring(0, 50) + "..." : content;
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
      chat_ai_respond_id: null,
      respond_error: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    messages = [...messages, userMessage];

    // For anonymous users, just show the message locally
    // In a real implementation, you would call chatService.sendAnonymousMessage()

    return userMessage;
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
  saveSingleModeSelections();
}

function setModelKey(key: string | null) {
  currentModelKey = key;
  saveSingleModeSelections();
}

function clearCurrentConversation() {
  currentConversation = null;
  messages = [];
}

// Export store object with getters for reactive access
export const chatStore = {
  get conversations() {
    return Array.isArray(conversations) ? conversations : [];
  },
  get currentConversation() {
    return currentConversation;
  },
  get messages() {
    return Array.isArray(messages) ? messages : [];
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
  get currentModelKey() {
    return currentModelKey;
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
  updateConversation,
  archiveConversation,
  sendMessage,
  setWebSearchEnabled,
  setImageSearchEnabled,
  setPromptProfileId,
  setModelKey,
  clearCurrentConversation,
  initializeSingleMode,
};

export default chatStore;
