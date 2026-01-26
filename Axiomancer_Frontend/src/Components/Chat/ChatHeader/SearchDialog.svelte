<script lang="ts">
  import { slide, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { chatStore, authStore, settingsStore } from "@/Store";
  import { chatService } from "@/Service";
  import { getTranslations, type LanguageCode } from "@/Function";
  import type { Chat, Conversation } from "@/Types";

  interface SearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = $bindable(false), onClose }: SearchDialogProps = $props();

  // Reactive translations
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  let searchQuery = $state("");
  let searchResults = $state<Array<{ chat: Chat; conversation: Conversation }>>([]);
  let isSearching = $state(false);
  let allConversationMessages = $state<Map<string, Chat[]>>(new Map());

  // Load all conversation messages when dialog opens
  $effect(() => {
    if (isOpen && authStore.isAuthenticated) {
      loadAllConversationMessages();
    }
  });

  // Load messages for all conversations
  async function loadAllConversationMessages() {
    isSearching = true;
    const messagesMap = new Map<string, Chat[]>();

    // Ensure conversations are loaded
    if (chatStore.conversations.length === 0) {
      await chatStore.loadConversations();
    }

    // Load messages for each conversation
    for (const conversation of chatStore.conversations) {
      try {
        const response = await chatService.getMessages(conversation.id);
        if (response.success && response.data) {
          messagesMap.set(conversation.id, response.data);
        }
      } catch (error) {
        console.error(`Failed to load messages for conversation ${conversation.id}:`, error);
      }
    }

    allConversationMessages = messagesMap;
    isSearching = false;
  }

  // Search function
  function performSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    isSearching = true;
    const query = searchQuery.toLowerCase();
    const results: Array<{ chat: Chat; conversation: Conversation }> = [];

    // Search through all conversations and their messages
    for (const conversation of chatStore.conversations) {
      const conversationMessages = allConversationMessages.get(conversation.id) || [];

      // Search in messages
      for (const chat of conversationMessages) {
        if (
          chat.content.toLowerCase().includes(query) ||
          chat.role.toLowerCase().includes(query)
        ) {
          results.push({ chat, conversation });
        }
      }
    }

    searchResults = results;
    isSearching = false;
  }

  // Handle search input
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    searchQuery = target.value;
    performSearch();
  }

  // Handle result click - navigate to conversation and message
  async function handleResultClick(result: { chat: Chat; conversation: Conversation }) {
    // Load the conversation
    await chatStore.loadConversation(result.conversation.id);
    
    // Close the dialog
    onClose();
    
    // Scroll to the message after a short delay
    setTimeout(() => {
      const messageElement = document.querySelector(`[data-message-id="${result.chat.id}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add a highlight effect
        messageElement.classList.add("highlight-message");
        setTimeout(() => {
          messageElement.classList.remove("highlight-message");
        }, 2000);
      }
    }, 300);
  }

  // Close dialog on escape key
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    }
  }

  // Truncate text for preview
  function truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  // Format timestamp
  function formatTimestamp(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString(settingsStore.language as string, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="search-backdrop" transition:fade={{ duration: 200, easing: cubicOut }} onclick={onClose}></div>

  <!-- Dialog -->
  <div class="search-dialog" transition:slide={{ duration: 300, easing: cubicOut }}>
    <div class="search-header">
      <h2>{t.header.searchHistory}</h2>
      <button class="close-btn" onclick={onClose} title={t.common.close}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="search-input-container">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        class="search-input"
        placeholder={t.header.searchPlaceholder}
        bind:value={searchQuery}
        oninput={handleInput}
        autofocus
      />
    </div>

    <div class="search-results">
      {#if searchQuery && searchResults.length > 0}
        <div class="results-count">
          {searchResults.length} {t.header.searchResultsCount}
        </div>
        {#each searchResults as result}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="result-item" onclick={() => handleResultClick(result)}>
            <div class="result-header">
              <span class="conversation-title">{result.conversation.title}</span>
              <span class="timestamp">{formatTimestamp(result.chat.created_at)}</span>
            </div>
            <div class="result-content">
              <span class="role-badge" class:user={result.chat.role === "user"} class:assistant={result.chat.role === "assistant"}>
                {result.chat.role}
              </span>
              <span class="content-preview">{truncateText(result.chat.content)}</span>
            </div>
          </div>
        {/each}
      {:else if searchQuery && searchResults.length === 0}
        <div class="no-results">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <p>{t.header.noSearchResults}</p>
        </div>
      {:else}
        <div class="search-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <p>{t.header.searchPlaceholder}</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .search-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999;
  }

  .search-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 1000px;
    height: 80vh;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .search-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }

  .search-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .search-input-container {
    position: relative;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .search-icon {
    position: absolute;
    left: 2rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    background: var(--bg-primary);
  }

  .search-input::placeholder {
    color: var(--text-tertiary);
  }

  .search-results {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .results-count {
    padding: 0.5rem 1rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .result-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .result-item:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
    transform: translateX(4px);
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .conversation-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.95rem;
  }

  .timestamp {
    font-size: 0.8rem;
    color: var(--text-tertiary);
  }

  .result-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .role-badge {
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    color: blue;
  }

  .role-badge.user {
    background: var(--accent-primary);
    color: rgb(0, 255, 221);
  }

  .role-badge.assistant {
    background: var(--bg-tertiary);
    color: rgb(21, 255, 0);
  }

  .content-preview {
    flex: 1;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
    word-break: break-word;
  }

  .no-results,
  .search-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-tertiary);
  }

  .no-results svg,
  .search-placeholder svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .no-results p,
  .search-placeholder p {
    margin: 0;
    font-size: 0.95rem;
  }

  /* Highlight animation for found message */
  :global(.highlight-message) {
    animation: highlight 2s ease;
  }

  @keyframes highlight {
    0% {
      background: transparent;
    }
    10% {
      background: var(--accent-primary);
      opacity: 0.2;
    }
    100% {
      background: transparent;
    }
  }
</style>
