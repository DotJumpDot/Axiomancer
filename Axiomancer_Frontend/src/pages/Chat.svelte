<script lang="ts">
  import { onMount } from "svelte";
  import { Sidebar, ChatHeader, MessageList, ChatInput } from "../Components";
  import { authStore, chatStore, aiStore, promptStore, settingsStore } from "../Store";

  // Initialize stores on mount
  onMount(() => {
    // Initialize auth from stored token
    authStore.initialize();
    
    // Load settings
    settingsStore.loadSettings();
  });

  // Load authenticated data when user logs in
  $effect(() => {
    if (authStore.isAuthenticated) {
      aiStore.loadEnabledModels();
      promptStore.loadProfiles();
      chatStore.loadConversations();
    }
  });

  function handleSelectConversation(id: string) {
    chatStore.loadConversation(id);
  }
</script>

<div class="chat-layout" data-theme={settingsStore.theme}>
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
