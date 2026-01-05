<script lang="ts">
  import { chatStore } from "../../Store";
  import ChatMessage from "./ChatMessage.svelte";
  import { scrollToBottom } from "../../Function";
  import { onMount } from "svelte";

  let messagesContainer: HTMLDivElement | undefined = $state();

  // Auto-scroll when new messages arrive
  $effect(() => {
    if (chatStore.messages.length > 0) {
      setTimeout(() => scrollToBottom(messagesContainer), 100);
    }
  });

  onMount(() => {
    scrollToBottom(messagesContainer);
  });
</script>

<div class="messages-container" bind:this={messagesContainer}>
  {#if chatStore.messages.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h2>Start a new conversation</h2>
      <p>Select a model and type your message below to begin</p>
      <div class="quick-actions">
        <button class="quick-action">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          Help me code
        </button>
        <button class="quick-action">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Explain a concept
        </button>
        <button class="quick-action">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Write content
        </button>
        <button class="quick-action">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Research a topic
        </button>
      </div>
    </div>
  {:else}
    <div class="messages-list">
      {#each chatStore.messages as message (message.id)}
        <ChatMessage {message} />
      {/each}

      {#if chatStore.isSending}
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .messages-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    text-align: center;
    padding: 48px 24px;
  }

  .empty-icon {
    margin-bottom: 24px;
    color: var(--text-secondary, #666);
    opacity: 0.5;
  }

  .empty-state h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary, #fff);
    margin-bottom: 8px;
  }

  .empty-state p {
    font-size: 15px;
    color: var(--text-secondary, #888);
    margin-bottom: 32px;
  }

  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    max-width: 600px;
  }

  .quick-action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .quick-action:hover {
    background: var(--hover-bg, #3d3d3d);
    border-color: var(--primary-color, #6366f1);
  }

  .messages-list {
    max-width: 800px;
    margin: 0 auto;
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 16px 20px;
    background: var(--assistant-message-bg, #1a1a1a);
    border: 1px solid var(--border-color, #2d2d2d);
    border-radius: 12px;
    width: fit-content;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    background: var(--text-secondary, #666);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
</style>
