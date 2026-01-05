<script lang="ts">
  import { onMount } from "svelte";
  import { aiStore, chatStore, promptStore, settingsStore, authStore } from "../../Store";
  import { userService } from "../../Service";
  import { formatModelName, formatProviderName, formatContextLength } from "../../Function";
  import LoginDialog from "../Auth/LoginDialog.svelte";
  import type { User } from "../../Types";

  let showModelDropdown = $state(false);
  let showPromptDropdown = $state(false);
  let showLoginDialog = $state(false);
  let storedUser = $state<User | null>(null);

  onMount(async () => {
    const axmLogin = localStorage.getItem("AxmLogin");
    if (axmLogin) {
      try {
        const loginData = JSON.parse(axmLogin);
        if (loginData.user && loginData.user.uuid) {
          const response = await userService.getUserByUUID(loginData.user.uuid);
          if (response.success && response.data) {
            storedUser = response.data;
          }
        }
      } catch (error) {
        console.error("Failed to load stored user:", error);
      }
    }
  });

  function selectModel(modelId: string) {
    aiStore.selectModel(modelId);
    showModelDropdown = false;
  }

  function selectPrompt(profileId: string | null) {
    promptStore.selectProfile(profileId);
    if (profileId) {
      chatStore.setPromptProfileId(profileId);
    }
    showPromptDropdown = false;
  }

  function toggleAutoRouting() {
    if (aiStore.autoRoutingEnabled) {
      aiStore.disableAutoRouting();
    } else {
      aiStore.enableAutoRouting();
    }
  }

  function handleLogin() {
    showLoginDialog = true;
  }

  function handleLogout() {
    authStore.logout();
  }
</script>

<header class="chat-header">
  <div class="header-left">
    <!-- Model Selector -->
    {#if authStore.isAuthenticated}
      <div class="dropdown model-selector">
        <button
          class="dropdown-trigger"
          onclick={() => (showModelDropdown = !showModelDropdown)}
          class:auto={aiStore.autoRoutingEnabled}
        >
          {#if aiStore.autoRoutingEnabled}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Auto
          {:else if aiStore.selectedModel}
            <span class="model-provider">{formatProviderName(aiStore.selectedModel.provider)}</span>
            <span class="model-name">{formatModelName(aiStore.selectedModel.model_key)}</span>
          {:else}
            Select Model
          {/if}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {#if showModelDropdown}
          <div class="dropdown-menu">
            <button class="dropdown-item auto-option" onclick={toggleAutoRouting}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span class="item-name">Auto-Routing</span>
              <span class="item-desc">Automatically select best model</span>
              {#if aiStore.autoRoutingEnabled}
                <svg class="check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {/if}
            </button>
            <div class="dropdown-divider"></div>
          {#each aiStore.enabledModels as model (model.id)}
            <button
              class="dropdown-item"
              class:selected={aiStore.selectedModel?.id === model.id && !aiStore.autoRoutingEnabled}
              onclick={() => selectModel(model.id)}
            >
              <span class="item-provider">{formatProviderName(model.provider)}</span>
              <span class="item-name">{formatModelName(model.model_key)}</span>
              <span class="item-context">{formatContextLength(model.context_length)}</span>
              {#if model.capabilities.fast}
                <span class="capability-badge fast">Fast</span>
              {/if}
              {#if model.capabilities.reasoning}
                <span class="capability-badge reasoning">Reasoning</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    {:else}
      <div class="model-selector-placeholder">
        <span class="placeholder-text">Login to select models</span>
      </div>
    {/if}

    <!-- Prompt Profile Selector -->
    {#if authStore.isAuthenticated}
      <div class="dropdown prompt-selector">
        <button
          class="dropdown-trigger secondary"
          onclick={() => (showPromptDropdown = !showPromptDropdown)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        {promptStore.selectedProfile?.name || "Default"}
        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {#if showPromptDropdown}
        <div class="dropdown-menu">
          <button
            class="dropdown-item"
            class:selected={!promptStore.selectedProfile}
            onclick={() => selectPrompt(null)}
          >
            <span class="item-name">Default</span>
            <span class="item-desc">Standard helpful assistant</span>
          </button>
          <div class="dropdown-divider"></div>
          {#each promptStore.profiles as profile (profile.id)}
            <button
              class="dropdown-item"
              class:selected={promptStore.selectedProfile?.id === profile.id}
              onclick={() => selectPrompt(profile.id)}
            >
              <span class="item-name">{profile.name}</span>
              {#if profile.description}
                <span class="item-desc">{profile.description}</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    {:else}
      <div class="prompt-selector-placeholder">
        <span class="placeholder-text">Login to select prompts</span>
      </div>
    {/if}

    <!-- Sidebar Collapse Button -->
    <button 
      class="collapse-btn"
      onclick={() => settingsStore.toggleSidebar()}
      title={settingsStore.sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
    >
      {#if settingsStore.sidebarOpen}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      {/if}
    </button>
  </div>

  <div class="header-right">
    <!-- Search Toggles -->
    <button
      class="toggle-btn"
      class:active={chatStore.webSearchEnabled}
      onclick={() => chatStore.setWebSearchEnabled(!chatStore.webSearchEnabled)}
      title="Web Search"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    </button>

    <button
      class="toggle-btn"
      class:active={chatStore.imageSearchEnabled}
      onclick={() => chatStore.setImageSearchEnabled(!chatStore.imageSearchEnabled)}
      title="Image Search"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    </button>

    <!-- User Section -->
    {#if authStore.currentUser}
      <div class="user-section">
        <img 
          src={authStore.currentUser.picture_url || "/Picture/Profile/userUnidentified.png"} 
          alt="User avatar" 
          class="user-avatar"
        />
        <span class="user-name">{authStore.currentUser.nickname || authStore.currentUser.username}</span>
        <button class="logout-btn" onclick={handleLogout} title="Logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    {:else if storedUser}
      <div class="user-section">
        <img 
          src={storedUser.picture_url || "/Picture/Profile/userUnidentified.png"} 
          alt="User avatar" 
          class="user-avatar"
        />
        <span class="user-name">{storedUser.nickname || storedUser.username}</span>
      </div>
    {:else}
      <button class="login-btn" onclick={handleLogin}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Login
      </button>
    {/if}
  </div>

  <!-- Login Dialog -->
  {#if showLoginDialog}
    <LoginDialog bind:open={showLoginDialog} />
  {/if}
</header>

<style>
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--header-bg, #1a1a1a);
    border-bottom: 1px solid var(--border-color, #2d2d2d);
    flex-shrink: 0;
    height: auto;
    min-height: 56px;
  }

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dropdown {
    position: relative;
  }

  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .dropdown-trigger:hover {
    background: var(--hover-bg, #3d3d3d);
  }

  .dropdown-trigger.auto {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: transparent;
  }

  .dropdown-trigger.secondary {
    background: transparent;
    border-color: var(--border-color, #3d3d3d);
  }

  .model-provider {
    font-size: 12px;
    color: var(--text-secondary, #888);
  }

  .model-name {
    font-weight: 500;
  }

  .chevron {
    margin-left: 4px;
    opacity: 0.6;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    min-width: 280px;
    background: var(--dropdown-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 100;
    overflow: hidden;
  }

  .dropdown-item {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .dropdown-item:hover {
    background: var(--hover-bg, #3d3d3d);
  }

  .dropdown-item.selected {
    background: var(--active-bg, #4d4d4d);
  }

  .auto-option {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  }

  .item-provider {
    font-size: 11px;
    color: var(--text-secondary, #888);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .item-name {
    color: var(--text-primary, #fff);
    font-size: 14px;
  }

  .item-desc {
    width: 100%;
    font-size: 12px;
    color: var(--text-secondary, #888);
  }

  .item-context {
    font-size: 11px;
    color: var(--text-secondary, #888);
    margin-left: auto;
  }

  .capability-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
  }

  .capability-badge.fast {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .capability-badge.reasoning {
    background: rgba(99, 102, 241, 0.2);
    color: #6366f1;
  }

  .check {
    margin-left: auto;
    color: var(--primary-color, #6366f1);
  }

  .dropdown-divider {
    height: 1px;
    background: var(--border-color, #3d3d3d);
    margin: 4px 0;
  }

  .toggle-btn {
    padding: 8px;
    background: transparent;
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: var(--hover-bg, #2d2d2d);
    color: var(--text-primary, #fff);
  }

  .toggle-btn.active {
    background: var(--primary-color, #6366f1);
    border-color: var(--primary-color, #6366f1);
    color: white;
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition: all 0.2s;
  }

  .collapse-btn:hover {
    background: var(--hover-bg, #3d3d3d);
    border-color: var(--border-color-hover, #4d4d4d);
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
  }

  .user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-name {
    font-size: 14px;
    color: var(--text-primary, #fff);
    font-weight: 500;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: var(--hover-bg, #3d3d3d);
    color: var(--text-primary, #fff);
  }

  .login-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--primary-color, #6366f1);
    border: 1px solid var(--primary-color, #6366f1);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .login-btn:hover {
    background: var(--primary-color-hover, #5855eb);
    border-color: var(--primary-color-hover, #5855eb);
  }

  /* Placeholder styles for non-authenticated users */
  .model-selector-placeholder,
  .prompt-selector-placeholder {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    color: var(--text-muted, #888);
    font-size: 14px;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .placeholder-text {
    font-style: italic;
  }
</style>
