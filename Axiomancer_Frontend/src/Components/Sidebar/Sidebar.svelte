<script lang="ts">
  import { chatStore, settingsStore, authStore, favoriteStore } from "@/Store";
  import type { Conversation } from "@/Types";
  import { formatRelativeTime, truncate } from "@/Function";
  import ConversationSetting from "./ConversationSetting.svelte";

  let { onSelectConversation }: { onSelectConversation?: (id: string) => void } = $props();
  let showArchiveModal = $state(false);
  let editingConversationId = $state<string | null>(null);
  let editingTitle = $state('');
  
  let archivedConversations = $derived(
    Array.isArray(chatStore.conversations) ? chatStore.conversations.filter(c => c.archived) : []
  );
  
  // Sort conversations: favorites first, then by updated_at
  let activeConversations = $derived.by(() => {
    const active = Array.isArray(chatStore.conversations) 
      ? chatStore.conversations.filter(c => !c.archived) 
      : [];
    
    return active.sort((a, b) => {
      const aIsFavorite = favoriteStore.isFavorite('conversation', a.id);
      const bIsFavorite = favoriteStore.isFavorite('conversation', b.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  });

  function handleSelect(conversation: Conversation) {
    if (onSelectConversation) {
      onSelectConversation(conversation.id);
    }
    chatStore.loadConversation(conversation.id);
  }

  async function handleDelete(e: Event, id: string) {
    e.stopPropagation();
    if (!authStore.currentUser?.uuid) return;

    if (confirm("Delete this conversation permanently?")) {
      await chatStore.deleteConversation(id);
    }
  }

  async function handleFavorite(e: Event, id: string) {
    e.stopPropagation();
    if (!authStore.currentUser?.uuid) return;
    
    const isFav = favoriteStore.isFavorite('conversation', id);
    try {
      if (isFav) {
        await favoriteStore.removeFromFavorite(authStore.currentUser.uuid, 'conversation', id);
      } else {
        await favoriteStore.addToFavorite(authStore.currentUser.uuid, 'conversation', id);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }

  async function handleArchive(e: Event, id: string) {
    e.stopPropagation();
    if (!authStore.currentUser?.uuid) return;

    await chatStore.archiveConversation(id, true);
  }

  async function handleUnarchive(id: string) {
    if (!authStore.currentUser?.uuid) return;

    await chatStore.archiveConversation(id, false);
  }

  function handleNewChat() {
    chatStore.clearCurrentConversation();
  }

  function openArchiveModal() {
    showArchiveModal = true;
  }

  function closeArchiveModal() {
    showArchiveModal = false;
  }

  function startEditingTitle(conversation: Conversation) {
    editingConversationId = conversation.id;
    editingTitle = conversation.title;
  }

  function cancelEditingTitle() {
    editingConversationId = null;
    editingTitle = '';
  }

  async function saveTitle(conversationId: string) {
    if (editingTitle.trim()) {
      await chatStore.updateConversation(conversationId, { title: editingTitle.trim() });
    }
    editingConversationId = null;
    editingTitle = '';
  }

  function handleTitleKeydown(e: KeyboardEvent, conversationId: string) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle(conversationId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingTitle();
    }
  }

  function focusInput(node: HTMLInputElement) {
    node.focus();
    node.select();
  }
</script>

<aside class="sidebar" class:collapsed={!settingsStore.sidebarOpen}>
  <div class="sidebar-header">
    <button class="new-chat-btn" onclick={handleNewChat}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      New Chat
    </button>
    <button class="toggle-btn" onclick={() => settingsStore.toggleSidebar()}>
      {#if settingsStore.sidebarOpen}
        <!-- Collapse icon (chevron left) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      {:else}
        <!-- Expand icon (chevron right) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      {/if}
    </button>
  </div>

  <div class="conversations-list">
    {#if !authStore.isAuthenticated}
      <div class="auth-prompt">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <p class="auth-message">Login to save and manage your conversations</p>
        <p class="auth-submessage">You can still chat without an account</p>
      </div>
    {:else if chatStore.isLoading}
      <div class="loading">Loading conversations...</div>
    {:else if activeConversations.length === 0}
      <div class="empty">No conversations yet</div>
    {:else}
      {#each activeConversations as conversation (conversation.id)}
        <div
          class="conversation-item"
          class:active={chatStore.currentConversation?.id === conversation.id}
          onclick={() => handleSelect(conversation)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect(conversation);
            }
          }}
          role="button"
          tabindex="0"
          aria-label={`Select conversation: ${conversation.title}`}
        >
          <span class="conversation-title">
            {#if favoriteStore.isFavorite('conversation', conversation.id)}
              <button
                class="title-favorite-btn"
                onclick={(e) => handleFavorite(e, conversation.id)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFavorite(e, conversation.id);
                  }
                }}
                aria-label="Remove from favorites"
                title="Remove from favorites"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
            {/if}
            {#if editingConversationId === conversation.id}
              <input
                type="text"
                class="title-input"
                bind:value={editingTitle}
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => handleTitleKeydown(e, conversation.id)}
                onblur={() => saveTitle(conversation.id)}
                use:focusInput
              />
            {:else}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span 
                class="title-text"
                class:clickable={chatStore.currentConversation?.id === conversation.id}
                onclick={(e) => {
                  e.stopPropagation();
                  if (chatStore.currentConversation?.id === conversation.id) {
                    startEditingTitle(conversation);
                  }
                }}
              >
                {truncate(conversation.title, 25)}
              </span>
            {/if}
          </span>
          <span class="conversation-date">{formatRelativeTime(conversation.updated_at)}</span>
          <div class="conversation-actions">
            {#if !favoriteStore.isFavorite('conversation', conversation.id)}
              <button
                class="action-btn favorite-btn"
                onclick={(e) => handleFavorite(e, conversation.id)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFavorite(e, conversation.id);
                  }
                }}
                aria-label="Add to favorites"
                title="Add to favorites"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
            {/if}
            <button
              class="action-btn archive-btn"
              onclick={(e) => handleArchive(e, conversation.id)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleArchive(e, conversation.id);
                }
              }}
              aria-label="Archive conversation"
              title="Archive conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <line x1="1" y1="3" x2="23" y2="3"></line>
                <path d="M10 12v6"></path>
                <path d="M14 12v6"></path>
              </svg>
            </button>
            <button
              class="action-btn delete-btn"
              onclick={(e) => handleDelete(e, conversation.id)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDelete(e, conversation.id);
                }
              }}
              aria-label="Delete conversation"
              title="Delete conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    {/if}
    
    <!-- {#if authStore.isAuthenticated && archivedConversations.length > 0}
      <button class="view-archive-btn" onclick={openArchiveModal}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <line x1="1" y1="3" x2="23" y2="3"></line>
          <path d="M10 12v6"></path>
          <path d="M14 12v6"></path>
        </svg>
        View Archive ({archivedConversations.length})
      </button>
    {/if} -->
  </div>

  <div class="sidebar-footer">
    <button class="settings-btn" onclick={openArchiveModal}>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="21 8 21 21 3 21 3 8"></polyline>
        <line x1="1" y1="3" x2="23" y2="3"></line>
        <path d="M10 12v6"></path>
        <path d="M14 12v6"></path>
      </svg>
      Archive
    </button>
  </div>
</aside>

<!-- Archive Modal -->
<ConversationSetting
  isOpen={showArchiveModal}
  archivedConversations={archivedConversations}
  onClose={closeArchiveModal}
/>

<style>
  .sidebar {
    width: 260px;
    height: 100%;
    background: var(--sidebar-bg, #1a1a1a);
    border-right: 1px solid var(--border-color, #2d2d2d);
    display: flex;
    flex-direction: column;
    transition: width 0.2s ease;
    overflow: hidden;
  }

  .sidebar.collapsed {
    width: 0px;
    border-right: none;
  }

  .sidebar.collapsed .sidebar-header {
    display: none;
  }

  .sidebar.collapsed .new-chat-btn {
    display: none;
  }

  .sidebar.collapsed .toggle-btn {
    display: none;
  }

  .sidebar.collapsed .conversations-list {
    display: none;
  }

  .sidebar.collapsed .sidebar-footer {
    display: none;
  }

  .sidebar-header {
    padding: 12px;
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--border-color, #2d2d2d);
  }

  .new-chat-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--primary-color, #6366f1);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  }

  .new-chat-btn:hover {
    background: var(--primary-hover, #5558e6);
  }

  .toggle-btn {
    padding: 10px;
    background: transparent;
    border: 1px solid var(--border-color, #2d2d2d);
    border-radius: 8px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-btn:hover {
    background: var(--hover-bg, #2d2d2d);
    color: var(--text-primary, #fff);
  }

  .conversations-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .loading,
  .empty {
    text-align: center;
    padding: 24px 16px;
    color: var(--text-secondary, #888);
    font-size: 14px;
    margin: auto;
  }

  .conversation-item {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    margin-bottom: 4px;
    transition: background 0.2s;
    position: relative;
  }

  .conversation-item:hover {
    background: var(--hover-bg, #2d2d2d);
  }

  .conversation-item.active {
    background: var(--active-bg, #3d3d3d);
  }

  .conversation-title {
    flex: 1;
    font-size: 14px;
    color: var(--text-primary, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .title-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: default;
  }

  .title-text.clickable {
    cursor: pointer;
  }

  .title-text.clickable:hover {
    text-decoration: underline;
  }

  .title-input {
    width: auto;
    max-width: 200px;
    background: var(--input-bg, #1a1a1a);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 4px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    padding: 2px 6px;
    outline: none;
  }

  .title-input:focus {
    border-color: var(--primary-color, #6366f1);
  }

  .conversation-date {
    font-size: 11px;
    color: var(--text-secondary, #888);
    width: 100%;
  }

  .conversation-actions {
    display: flex;
    gap: 4px;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
  }

  .conversation-item:hover .conversation-actions {
    opacity: 1;
  }

  .action-btn {
    padding: 4px;
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
    background: var(--hover-bg, #3d3d3d);
  }

  .title-favorite-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: 5px;
    margin-right: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    transition: all 0.2s;
  }

  .title-favorite-btn:hover {
    transform: scale(1.1);
  }

  .favorite-btn {
    color: #888;
  }

  .favorite-btn:hover {
    background: rgba(255, 193, 7, 0.2);
    color: #ffc107;
  }

  .archive-btn:hover {
    background: var(--warning-bg, rgba(59, 130, 246, 0.2));
    color: var(--warning-color, #3b82f6);
  }

  .delete-btn:hover {
    background: var(--danger-bg, rgba(239, 68, 68, 0.2));
    color: var(--danger-color, #ef4444);
  }

  .view-archive-btn {
    width: calc(100% - 16px);
    margin: 8px 8px 0 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--hover-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .view-archive-btn:hover {
    background: var(--primary-color, #6366f1);
    color: white;
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid var(--border-color, #2d2d2d);
  }

  .settings-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: transparent;
    border: 1px solid var(--border-color, #2d2d2d);
    border-radius: 8px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .settings-btn:hover {
    background: var(--hover-bg, #2d2d2d);
    color: var(--text-primary, #fff);
  }

  .auth-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-muted, #888);
  }

  .auth-prompt svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .auth-message {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--text-secondary, #aaa);
  }

  .auth-submessage {
    font-size: 12px;
    opacity: 0.7;
  }
</style>
