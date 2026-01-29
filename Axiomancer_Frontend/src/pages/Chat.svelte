<script lang="ts">
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import { Sidebar, ChatHeader, MessageList, ChatInput } from "@/Components";
  import { authStore, chatStore, aiStore, promptStore, settingsStore, favoriteStore } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";

  interface Props {
    conversationId?: string;
  }

  let { conversationId }: Props = $props();

  // Reactive translations based on current language
  let translations = $derived(getTranslations(settingsStore.language as LanguageCode));

  // Track last conversation ID to detect actual navigation
  let lastConversationId = $state<string | null>(null);

  // Initialize stores on mount
  onMount(() => {
    // Initialize auth from stored token
    authStore.initialize();
    
    // Load settings
    settingsStore.loadSettings();
    
    // Initialize single mode from localStorage
    chatStore.initializeSingleMode();

    // Load conversation if ID is provided in URL (don't update URL since we're already on it)
    if (conversationId) {
      chatStore.loadConversation(conversationId, false);
      lastConversationId = conversationId;
    }

    // Listen for back/forward browser navigation
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/" && lastConversationId) {
        // Back button pressed - clear current conversation
        chatStore.clearCurrentConversation();
        lastConversationId = null;
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  });

  // Load authenticated data when user logs in
  $effect(() => {
    if (authStore.isAuthenticated && authStore.currentUser?.uuid) {
      aiStore.loadEnabledModels();
      promptStore.loadProfiles();
      chatStore.loadConversations();
      favoriteStore.loadFavorites(authStore.currentUser.uuid);
    }
  });

  function handleSelectConversation(id: string) {
    chatStore.loadConversation(id);
    
    // Only navigate if it's a different conversation
    if (lastConversationId !== id) {
      lastConversationId = id;
      navigate(`/conversation/${id}`);
    }
  }
</script>

<div class="chat-layout">
  <!-- Sidebar -->
  <Sidebar onSelectConversation={handleSelectConversation} />

  <!-- Main Chat Area -->
  <main class="chat-main">
    <ChatHeader />
    <MessageList />
    <ChatInput />
  </main>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .chat-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
    background: var(--bg-primary);
    overflow: hidden;
  }

  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .chat-layout {
      flex-direction: column;
    }
  }
</style>
