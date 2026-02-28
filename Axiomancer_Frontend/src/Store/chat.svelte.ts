// Chat Store - Svelte 5 runes for chat and conversation state
import { chatService, searchService } from "@/Service";
import type {
  Chat,
  Conversation,
  ChatMessage,
  SendMessageOptions,
  OpenRouterMessage,
  ChatAiRespond,
} from "@/Types";
import { playNotificationSound, getTranslations, type LanguageCode } from "@/Function";
import { navigate } from "svelte-routing";

import authStore from "./auth.svelte";
import settingsStore from "./settings.svelte";

// Helper to show rate limit notification
function showRateLimitNotification(retryAfter?: number, lang: LanguageCode = "en") {
  const t = getTranslations(lang);
  const notification = (window as any).notification;
  if (notification) {
    if (retryAfter && retryAfter > 0) {
      const minutes = Math.ceil(retryAfter / 60);
      const message = t.errors.rateLimitMessage
        .replace("{count}", "500")
        .replace("{minutes}", minutes.toString());
      notification.warning(t.errors.rateLimit, message, { duration: 8000 });
    } else {
      notification.warning(t.errors.rateLimit, t.errors.rateLimitRetry, { duration: 5000 });
    }
  }
}

// Helper function to navigate to conversation without adding to history
function navigateToConversation(id: string) {
  if (typeof window !== "undefined") {
    window.history.replaceState({}, "", `/conversation/${id}`);
  }
}

// Reactive state using Svelte 5 runes
let conversations = $state<Conversation[]>([]);
let currentConversation = $state<Conversation | null>(null);
let messages = $state<Chat[]>([]);
let isLoading = $state(false);
let isLoadingConversation = $state(false);
let isSending = $state(false);
let error = $state<string | null>(null);

// Chat options state
let webSearchEnabled = $state(false);
let imageSearchEnabled = $state(false);
let steamSearchEnabled = $state(false);
let currentPromptProfileId = $state<string | null>(null);
let currentModelKey = $state<string | null>(null);
let memoryCount = $state(8); // Default to 2 messages
let reasoningEffort = $state<string>("disabled"); // Default reasoning effort

// Streaming state
let streamingContent = $state("");
let isStreaming = $state(true);
let streamAbortController = $state<AbortController | null>(null);

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

async function loadConversation(id: string, updateUrl: boolean = true) {
  try {
    isLoadingConversation = true;
    error = null;

    const response = await chatService.getConversationById(id);
    if (response.success && response.data) {
      currentConversation = response.data;
      await loadMessages(id);

      // Update URL when loading conversation using replaceState to avoid adding to history
      if (updateUrl && typeof window !== "undefined") {
        navigateToConversation(id);
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load conversation";
  } finally {
    isLoadingConversation = false;
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
            // Preserve both model_id (decision model) and ai_model_key (active model)
            model_id: chat.model_id,
            ai_model_key: chat.ai_model_key,
            search_log: chat.search_log, // Preserve search_log data
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

      // Navigate to new conversation URL using replaceState
      if (typeof window !== "undefined") {
        navigateToConversation(response.data.id);
      }

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
    const conv = await createNewConversation(generateConversationTitle(content));
    if (!conv) {
      console.error("[ChatStore] Failed to create conversation");
      error = "Failed to create conversation";
      return null;
    }
    currentConversation = conv;
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
      search_log_uuid: null,
      chat_ai_respond_id: null,
      respond_error: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    messages = [...messages, userMessage];

    // Play send sound notification
    if (settingsStore.soundEnabled) {
      playNotificationSound("send", settingsStore.soundVolume);
    }

    // Check if streaming is enabled
    const useStreaming = settingsStore.streamResponses;

    if (useStreaming) {
      // Use streaming mode
      let streamingAiMessage: Chat | null = null;
      let streamingReasoningContent = "";
      let streamingAnswerContent = "";

      // Create AbortController for this stream
      streamAbortController = new AbortController();

      await chatService.sendMessageStream(
        currentConversation!.id,
        {
          message: content,
          model_key: modelKey,
          prompt_profile_id: options?.promptProfileId,
          autoRouting: options?.autoRouting,
          webSearch: webSearchEnabled,
          imageSearch: imageSearchEnabled,
          steamSearch: steamSearchEnabled,
          memoryCount: options?.memoryCount ?? memoryCount,
          reasoningEffort: options?.reasoningEffort || reasoningEffort,
          enhanceSearchMode: options?.enhanceSearchMode || settingsStore.enhanceSearchMode,
          enhanceSearchModel:
            settingsStore.enhanceSearchMode === "user-selected"
              ? settingsStore.enhanceSearchModel
              : undefined,
        },
        streamAbortController.signal,
        // onChunk
        (chunk: string, type?: "content" | "reasoning") => {
          if (!streamingAiMessage) {
            // Extract ai_model_key from routing prefix if present (format: **Model:** Name (`model_key`))
            let extractedAiModelKey: string | null = null;
            const routingMatch = chunk.match(/\*\*Model:\*\*[^`]*`([^`]+)`/);
            if (routingMatch) {
              extractedAiModelKey = routingMatch[1];
            }

            // Create streaming message on first chunk
            streamingAiMessage = {
              id: `streaming-${Date.now()}`,
              conversation_id: currentConversation!.id,
              role: "assistant",
              content: "", // Keep content empty during reasoning phase
              model_id: modelKey || null,
              ai_model_key: extractedAiModelKey,
              prompt_profile_id: options?.promptProfileId || null,
              routing_mode: options?.autoRouting ? "auto" : "manual",
              search_log_uuid: null,
              chat_ai_respond_id: null,
              respond_error: false,
              created_at: new Date(),
              updated_at: new Date(),
              search_log: {
                memory_chat_include: options?.memoryCount ?? memoryCount,
                used_web_search: webSearchEnabled,
                used_image_search: imageSearchEnabled,
                used_steam: steamSearchEnabled,
                reasoning_effort: options?.reasoningEffort || reasoningEffort,
                reasoning_content: type === "reasoning" ? chunk : null,
                search_context_web: null,
                search_context_picture: null,
                decision_prompt_model: null,
                prompt_web_search: null,
                prompt_picture_search: null,
              },
            };
            // Initialize streaming content based on type
            if (type === "reasoning") {
              streamingReasoningContent = chunk;
            } else {
              streamingAnswerContent = chunk;
            }
            messages = [...messages, streamingAiMessage];
          } else {
            // Update streaming message based on chunk type
            if (type === "reasoning") {
              streamingReasoningContent += chunk;
              streamingAiMessage = {
                ...streamingAiMessage,
                content: "", // Keep content empty during reasoning phase
                search_log: {
                  ...streamingAiMessage.search_log!,
                  reasoning_content: streamingReasoningContent,
                },
                updated_at: new Date(),
              };
            } else {
              // Content chunk - only update answer content
              streamingAnswerContent += chunk;
              streamingAiMessage = {
                ...streamingAiMessage,
                content: streamingAnswerContent, // Only answer content, not reasoning
                search_log: {
                  ...streamingAiMessage.search_log!,
                  reasoning_content: streamingReasoningContent, // Keep completed reasoning in search_log
                },
                updated_at: new Date(),
              };
            }
            // Replace the streaming message in the array with the new object
            messages = messages.map((m) =>
              m.id === streamingAiMessage.id ? streamingAiMessage : m
            );
          }
        },
        // onDone
        (result: { userMessage: Chat; aiResponse?: ChatAiRespond }) => {
          streamAbortController = null;
          isSending = false;

          // Replace temp user message with actual saved message
          messages = messages.filter((m) => m.id !== userMessage.id);
          messages = [...messages, result.userMessage];

          // Replace streaming message with actual AI response (or add it if not started)
          if (result.aiResponse) {
            if (streamingAiMessage) {
              messages = messages.filter((m) => m.id !== streamingAiMessage!.id);
            }

            const aiMessage: Chat = {
              id: result.aiResponse.id,
              conversation_id: currentConversation!.id,
              role: "assistant",
              content: result.aiResponse.ai_content,
              model_id: result.userMessage.model_id,
              ai_model_key: result.aiResponse.model_key,
              prompt_profile_id: result.userMessage.prompt_profile_id,
              routing_mode: result.userMessage.routing_mode,
              search_log_uuid: result.userMessage.search_log_uuid,
              chat_ai_respond_id: null,
              respond_error: result.userMessage.respond_error,
              created_at: new Date(result.aiResponse.created_at),
              updated_at: new Date(result.aiResponse.updated_at),
              ai_token_usage: result.aiResponse.token_usage,
              ai_latency_ms: result.aiResponse.latency_ms,
              ai_finish_reason: result.aiResponse.finish_reason,
              search_log: result.userMessage.search_log,
            };
            messages = [...messages, aiMessage];
          }

          // Play receive sound notification
          if (settingsStore.soundEnabled) {
            playNotificationSound("receive", settingsStore.soundVolume);
          }

          // Update conversation title if it's the first message
          if (messages.filter((m) => m.role === "user").length === 1 && currentConversation) {
            const newTitle = generateConversationTitle(content);
            chatService.updateConversation(currentConversation.id, { title: newTitle }).then(() => {
              currentConversation = {
                ...currentConversation!,
                title: newTitle,
              };
              conversations = conversations.map((c) =>
                c.id === currentConversation!.id ? { ...c, title: newTitle } : c
              );
            });
          }
        },
        // onError
        (errorMessage: string) => {
          streamAbortController = null;
          isSending = false;
          error = errorMessage;
          // Play error sound notification
          if (settingsStore.soundEnabled) {
            playNotificationSound("error", settingsStore.soundVolume);
          }

          // Check if it's a rate limit error
          if (errorMessage.includes("Rate limit exceeded") || errorMessage.includes("429")) {
            showRateLimitNotification(undefined, settingsStore.language as LanguageCode);
          }

          // Note: We don't remove temp user messages here anymore
          // to prevent the "disappearing message" issue.
          // If the backend saved it, it will be updated via onDone.
          // If not, the user can still see what they sent.

          if (streamingAiMessage) {
            messages = messages.filter((m) => m.id !== streamingAiMessage!.id);
          }
        }
      );

      return userMessage;
    } else {
      // Use non-streaming mode (original behavior)
      const response = await chatService.sendMessage(currentConversation!.id, {
        message: content,
        model_key: modelKey,
        prompt_profile_id: options?.promptProfileId,
        autoRouting: options?.autoRouting,
        webSearch: webSearchEnabled,
        imageSearch: imageSearchEnabled,
        steamSearch: steamSearchEnabled,
        memoryCount: options?.memoryCount ?? memoryCount,
        reasoningEffort: options?.reasoningEffort || reasoningEffort,
        enhanceSearchMode: options?.enhanceSearchMode || settingsStore.enhanceSearchMode,
        enhanceSearchModel:
          settingsStore.enhanceSearchMode === "user-selected"
            ? settingsStore.enhanceSearchModel
            : undefined,
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
            model_id: response.data.userMessage.model_id,
            ai_model_key: response.data.aiResponse.model_key,
            prompt_profile_id: response.data.userMessage.prompt_profile_id,
            routing_mode: response.data.userMessage.routing_mode,
            search_log_uuid: response.data.userMessage.search_log_uuid,
            chat_ai_respond_id: null,
            respond_error: response.data.userMessage.respond_error,
            created_at: new Date(response.data.aiResponse.created_at),
            updated_at: new Date(response.data.aiResponse.updated_at),
            ai_token_usage: response.data.aiResponse.token_usage,
            ai_latency_ms: response.data.aiResponse.latency_ms,
            ai_finish_reason: response.data.aiResponse.finish_reason,
            search_log: response.data.userMessage.search_log, // Include search_log from user message
          };
          messages = [...messages, aiMessage];
        }

        // Play receive sound notification for non-streaming
        if (settingsStore.soundEnabled) {
          playNotificationSound("receive", settingsStore.soundVolume);
        }

        // Update conversation title if it's the first message
        if (messages.filter((m) => m.role === "user").length === 1 && currentConversation) {
          const newTitle = generateConversationTitle(content);
          chatService.updateConversation(currentConversation.id, {
            title: newTitle,
          });
          currentConversation = { ...currentConversation, title: newTitle };
          conversations = conversations.map((c) =>
            c.id === currentConversation!.id ? { ...c, title: newTitle } : c
          );
        }

        return response.data.userMessage;
      } else {
        // Handle error response from API
        error = response.error || "Failed to send message";

        // Check if it's a rate limit error from API response
        if (response.error?.includes("Rate limit exceeded") || response.error?.includes("429")) {
          // Extract retryAfter from error message if available
          const retryMatch = response.error?.match(/retryAfter["\s:]+(\d+)/);
          const retryAfter = retryMatch ? parseInt(retryMatch[1]) : undefined;
          showRateLimitNotification(retryAfter, settingsStore.language as LanguageCode);
        }

        // Play error sound notification
        if (settingsStore.soundEnabled) {
          playNotificationSound("error", settingsStore.soundVolume);
        }
        // Remove temp message on error
        messages = messages.filter((m) => !m.id.startsWith("temp-"));
        return null;
      }
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Failed to send message";
    error = errorMessage;

    // Check if it's a rate limit error
    const isRateLimit =
      (e as any)?.isRateLimit === true ||
      errorMessage.includes("Rate limit exceeded") ||
      errorMessage.includes("429");

    if (isRateLimit) {
      const retryAfter = (e as any)?.retryAfter as number | undefined;
      showRateLimitNotification(retryAfter, settingsStore.language as LanguageCode);
    }

    // Play error sound notification
    if (settingsStore.soundEnabled) {
      playNotificationSound("error", settingsStore.soundVolume);
    }
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
      search_log_uuid: null,
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
    const errorMessage = e instanceof Error ? e.message : "Failed to send message";
    error = errorMessage;

    // Check if it's a rate limit error
    const isRateLimit =
      (e as any)?.isRateLimit === true ||
      errorMessage.includes("Rate limit exceeded") ||
      errorMessage.includes("429");

    if (isRateLimit) {
      const retryAfter = (e as any)?.retryAfter as number | undefined;
      showRateLimitNotification(retryAfter, settingsStore.language as LanguageCode);
    }

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

function setSteamSearchEnabled(enabled: boolean) {
  steamSearchEnabled = enabled;
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

//! Stop streaming AI response
async function stopStreaming() {
  if (streamAbortController) {
    streamAbortController.abort();
    streamAbortController = null;
    isSending = false;

    // Reload messages from database to show saved user message and partial AI response
    if (currentConversation) {
      await loadMessages(currentConversation.id);
    }
  }
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
  get isLoadingConversation() {
    return isLoadingConversation;
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
  set webSearchEnabled(value: boolean) {
    webSearchEnabled = value;
  },
  get imageSearchEnabled() {
    return imageSearchEnabled;
  },
  set imageSearchEnabled(value: boolean) {
    imageSearchEnabled = value;
  },
  get steamSearchEnabled() {
    return steamSearchEnabled;
  },
  set steamSearchEnabled(value: boolean) {
    steamSearchEnabled = value;
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
  get memoryCount() {
    return memoryCount;
  },
  set memoryCount(value: number) {
    memoryCount = value;
  },
  get reasoningEffort() {
    return reasoningEffort;
  },
  set reasoningEffort(value: string) {
    reasoningEffort = value;
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
  setSteamSearchEnabled,
  setPromptProfileId,
  setModelKey,
  clearCurrentConversation,
  initializeSingleMode,
  stopStreaming,
};

export default chatStore;
