<script lang="ts">
  import { chatStore } from "@/Store";
  import { formatRelativeTime, truncate } from "@/Function";
  import type { Conversation } from "@/Types";

  interface Props {
    isOpen: boolean;
    archivedConversations: Conversation[];
    onClose: () => void;
  }

  let { isOpen, archivedConversations, onClose }: Props = $props();

  async function handleUnarchive(id: string) {
    const conversation = chatStore.conversations.find(c => c.id === id);
    if (conversation) {
      await chatStore.updateConversation(id, { archived: false });
    }
  }

  async function handleDeleteArchived(id: string) {
    if (confirm("Permanently delete this archived conversation?")) {
      await chatStore.deleteConversation(id);
    }
  }

  function handleSelectArchived(conversation: Conversation) {
    // First unarchive it
    chatStore.updateConversation(conversation.id, { archived: false });
    // Then load it
    chatStore.loadConversation(conversation.id);
    onClose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <div class="modal-header">
        <h2>Archived Conversations</h2>
        <button class="close-btn" onclick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        {#if archivedConversations.length === 0}
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <line x1="1" y1="3" x2="23" y2="3"></line>
              <path d="M10 12v6"></path>
              <path d="M14 12v6"></path>
            </svg>
            <p>No archived conversations</p>
          </div>
        {:else}
          <div class="archived-list">
            {#each archivedConversations as conversation (conversation.id)}
              <div class="archived-item">
                <div class="item-info" onclick={() => handleSelectArchived(conversation)}>
                  <div class="item-title">{truncate(conversation.title, 40)}</div>
                  <div class="item-date">{formatRelativeTime(conversation.updated_at)}</div>
                </div>
                <div class="item-actions">
                  <button
                    class="action-btn unarchive-btn"
                    onclick={() => handleUnarchive(conversation.id)}
                    title="Restore conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="21 15 16 10 21 5"></polyline>
                      <path d="M4 20c.5-1 2-7 2-10 0-5 1.58-8 8-8h9"></path>
                    </svg>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    onclick={() => handleDeleteArchived(conversation.id)}
                    title="Delete archived conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--modal-bg, #2d2d2d);
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 500px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color, #3d3d3d);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--text-primary, #fff);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: var(--text-primary, #fff);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary, #888);
  }

  .empty-state svg {
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
  }

  .archived-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .archived-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--hover-bg, #3d3d3d);
    border-radius: 8px;
    transition: background 0.2s;
  }

  .archived-item:hover {
    background: var(--active-bg, #4d4d4d);
  }

  .item-info {
    flex: 1;
    cursor: pointer;
    min-width: 0;
  }

  .item-title {
    font-size: 14px;
    color: var(--text-primary, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }

  .item-date {
    font-size: 12px;
    color: var(--text-secondary, #888);
  }

  .item-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .action-btn {
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: var(--hover-bg, #5d5d5d);
  }

  .unarchive-btn:hover {
    background: var(--success-bg, rgba(34, 197, 94, 0.2));
    color: var(--success-color, #22c55e);
  }

  .delete-btn:hover {
    background: var(--danger-bg, rgba(239, 68, 68, 0.2));
    color: var(--danger-color, #ef4444);
  }
</style>
