<script lang="ts">
  import { onMount } from "svelte";
  import { aiStore, chatStore, promptStore, settingsStore, authStore } from "@/Store";
  import { userService } from "@/Service";
  import { formatModelName, formatProviderName } from "@/Function";
  import LoginDialog from "@/Components/Auth/LoginDialog.svelte";
  import { ApiKeyDialog } from "@/Components/Auth";
  import PresetPopup from "./PresetPopup.svelte";
  import ModelSelector from "./ModelSelector.svelte";
  import PromptEdit from "./PromptEdit.svelte";
  import UserSetting from "./UserSetting.svelte";
  import type { User, AiModel } from "@/Types";

  let showModelDropdown = $state(false);
  let showPromptDropdown = $state(false);
  let showPresetPopup = $state(false);
  let showSystemPrompt = $state(false);
  let showModelSelector = $state(false);
  let showPromptEditor = $state(false);
  let storedUser = $state<User | null>(null);
  let currentMode = $state<'auto' | 'single'>('auto');
  
  // Single mode selections
  let selectedModelKey = $state<string | null>(null);
  let selectedModelName = $state<string>("");
  let selectedPromptId = $state<string | null>(null);
  let selectedPromptName = $state<string>("");

  let loginDialog: any;
  let apiKeyDialog: any;
  let userSettingDialog: any;
  let isInitializing = $state(true);

  // Derived state for API key status - defaults to true until we know otherwise
  let hasApiKey = $derived(authStore.currentUser ? !!authStore.currentUser.openrouter_api_key : true);

  onMount(async () => {
    // Initialize single mode selections from localStorage
    chatStore.initializeSingleMode();
    selectedModelKey = chatStore.currentModelKey;
    selectedPromptId = chatStore.currentPromptProfileId;
    
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
    
    // Mark initialization as complete
    isInitializing = false;
    
    // Update model and prompt names after a short delay to ensure stores are loaded
    // This handles the case where stores need time to fetch data
    setTimeout(() => {
      updateModelAndPromptNames();
    }, 100);
  });

  //* Sync local state with chatStore changes
  $effect(() => {
    const newModelKey = chatStore.currentModelKey;
    const newPromptId = chatStore.currentPromptProfileId;
    if (newModelKey !== selectedModelKey || newPromptId !== selectedPromptId) {
      selectedModelKey = newModelKey;
      selectedPromptId = newPromptId;
      updateModelAndPromptNames();
    }
  });


  function updateModelAndPromptNames() {
    if (selectedModelKey) {
      const model = aiStore.enabledModels.find(m => m.model_key === selectedModelKey);
      selectedModelName = model?.display_name || selectedModelKey;
    } else {
      selectedModelName = "";
    }
    
    if (selectedPromptId) {
      const prompt = promptStore.profiles.find(p => p.id === selectedPromptId);
      selectedPromptName = prompt?.name || "Select Prompt";
    } else {
      selectedPromptName = "Select Prompt";
    }
  }

  // Initialize mode when user becomes authenticated
  $effect(() => {
    if (authStore.isAuthenticated && authStore.currentUser) {
      // Get saved mode from localStorage
      const savedMode = authStore.getMode();
      
      // Only update if different to avoid infinite loops
      if (currentMode !== savedMode) {
        currentMode = savedMode;
      }
      
      // Apply to aiStore
      if (savedMode === 'auto') {
        aiStore.enableAutoRouting();
      } else {
        aiStore.disableAutoRouting();
      }
    }
  });

  // Keep currentMode in sync with aiStore (but don't override localStorage)
  $effect(() => {
    // Skip during initialization to prevent overriding localStorage
    if (isInitializing) return;
    
    // This effect runs when aiStore.autoRoutingEnabled changes
    // We use it to update currentMode, but we don't save to localStorage here
    // to avoid circular updates
    const aiMode = aiStore.autoRoutingEnabled ? 'auto' : 'single';
    
    // Only update if different (this handles external changes to aiStore)
    if (currentMode !== aiMode) {
      currentMode = aiMode;
    }
  });

  // Update model and prompt names when stores are populated
  $effect(() => {
    // This effect runs when aiStore.enabledModels or promptStore.profiles change
    // This ensures names are updated once data is loaded from backend
    if (aiStore.enabledModels.length > 0 || promptStore.profiles.length > 0) {
      updateModelAndPromptNames();
    }
  });

  function selectModel(modelKey: string | null) {
    selectedModelKey = modelKey;
    chatStore.setModelKey(modelKey);
    updateModelAndPromptNames();
    showModelSelector = false;
  }

  function selectPrompt(profileId: string | null) {
    selectedPromptId = profileId;
    chatStore.setPromptProfileId(profileId);
    updateModelAndPromptNames();
    showPromptDropdown = false;
    showSystemPrompt = false;
  }

  function toggleMode() {
    currentMode = currentMode === 'auto' ? 'single' : 'auto';
    
    // Save mode to localStorage
    if (authStore.isAuthenticated) {
      authStore.saveMode(currentMode);
    }
    
    // Update aiStore state
    if (currentMode === 'auto') {
      aiStore.enableAutoRouting();
    } else {
      aiStore.disableAutoRouting();
      // When switching to single mode, ensure selections are initialized
      chatStore.initializeSingleMode();
      selectedModelKey = chatStore.currentModelKey;
      selectedPromptId = chatStore.currentPromptProfileId;
      updateModelAndPromptNames();
      
      // If no model is selected, open model selector
      if (!selectedModelKey) {
        showModelSelector = true;
      }
      // If no prompt is selected, it defaults to null (default prompt) - no need to open dropdown
    }
    showModelDropdown = false;
  }

  function toggleAutoRouting() {
    if (aiStore.autoRoutingEnabled) {
      aiStore.disableAutoRouting();
      currentMode = 'single';
    } else {
      aiStore.enableAutoRouting();
      currentMode = 'auto';
    }
    
    // Save mode to localStorage
    if (authStore.isAuthenticated) {
      authStore.saveMode(currentMode);
    }
  }

  function openPresetPopup() {
    showPresetPopup = true;
  }

  function closePresetPopup() {
    showPresetPopup = false;
    showSystemPrompt = false;
  }

  function toggleSystemPrompt() {
    showSystemPrompt = !showSystemPrompt;
    showPromptDropdown = false;
  }

  function handleModelSelect(event: any) {
    selectModel(event.detail);
    showModelSelector = false;
  }

  function handlePresetApply(event: any) {
    const { models, prompt } = event.detail;
    console.log('Applying preset:', { models, prompt });
    closePresetPopup();
  }

  function openPromptEditor() {
    showPromptEditor = true;
    showPromptDropdown = false;
    showSystemPrompt = false;
  }

  function closePromptEditor() {
    showPromptEditor = false;
  }

  function handlePromptSelect(event: CustomEvent<{ promptId: string | null }>) {
    selectPrompt(event.detail.promptId);
    closePromptEditor();
  }

  function handleLogin() {
    loginDialog?.open();
  }

  function handleLogout() {
    authStore.logout();
  }

  function openApiKeyDialog() {
    if (authStore.isAuthenticated) {
      apiKeyDialog?.open();
    }
  }

    function openUserSettingDialog() {
    if (authStore.isAuthenticated) {
      userSettingDialog?.open();
    }
  }

  // Ensure reactivity to API key changes
  $effect(() => {
    // This effect ensures the component reacts to API key changes
    const hasApiKey = !!authStore.currentUser?.openrouter_api_key;
    // Force reactivity by accessing the value
    if (hasApiKey) {
      // API key is available
    }
  });
</script>

<header class="chat-header">
  <div class="header-left">
    <!-- Mode Selector -->
    {#if authStore.isAuthenticated}
      <div class="dropdown mode-selector">
        <button
          class="dropdown-trigger"
          onclick={() => (showModelDropdown = !showModelDropdown)}
          class:auto={currentMode === 'auto'}
          class:single={currentMode === 'single'}
        >
          {#if currentMode === 'auto'}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Auto
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
            </svg>
            Single
          {/if}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {#if showModelDropdown}
          <div class="dropdown-menu">
            <button class="dropdown-item" class:active-mode={currentMode === 'auto'} onclick={toggleMode}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span class="item-name">Auto-Routing</span>
              <span class="item-desc">Automatically select best model</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" class:active-mode={currentMode === 'single'} class:single={currentMode === 'single'} onclick={toggleMode}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
              </svg>
              <span class="item-name">Single Model</span>
              <span class="item-desc">Select a specific model</span>
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="mode-selector-placeholder">
        <span class="placeholder-text">Login to select mode</span>
      </div>
    {/if}

    <!-- Single Model Selector (only show in single mode) -->
    {#if authStore.isAuthenticated && currentMode === 'single'}
      <div class="dropdown model-selector">
        <button
          class="dropdown-trigger"
          onclick={() => (showModelSelector = true)}
        >
          {#if selectedModelName && selectedModelName !== selectedModelKey}
            <span class="model-name">{selectedModelName}</span>
          {:else if selectedModelKey}
            <span class="model-name">{formatModelName(selectedModelKey)}</span>
          {:else}
            Select Model
          {/if}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    {/if}

    <!-- Prompt Profile Selector (only show in single mode) -->
    {#if authStore.isAuthenticated && currentMode === 'single'}
      <div class="dropdown prompt-selector">
        <button
          class="dropdown-trigger2"
          onclick={() => (showPromptDropdown = !showPromptDropdown)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          {selectedPromptName || "Select Prompt"}
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

        {#if showSystemPrompt}
          <div class="system-prompt-display">
            <div class="system-prompt-header">
              <h4>System Prompt</h4>
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button class="close-prompt-btn" onclick={toggleSystemPrompt}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="system-prompt-content">
              <pre>{promptStore.selectedProfile?.system_prompt || "You are a helpful assistant."}</pre>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if authStore.isAuthenticated && currentMode === 'single'}
      <button class="prompt-edit-btn" onclick={openPromptEditor} title="Manage prompts">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Manage Prompts
      </button>
    {/if}

    <!-- Preset Button (only show in auto mode) -->
    {#if authStore.isAuthenticated && currentMode === 'auto'}
      <button class="preset-btn" onclick={openPresetPopup}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Preset
      </button>
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
    <!-- API Key Button -->
    {#if authStore.isAuthenticated}
      <div class="api-key-container">
        <button 
          class="api-key-btn" 
          class:needs-api-key={!hasApiKey}
          onclick={openApiKeyDialog} 
          title={hasApiKey ? "Manage OpenRouter API Key" : ""}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
        </button>
        {#if !hasApiKey}
          <div class="api-key-tooltip">
            Add OpenRouter API Key (Required)
          </div>
        {/if}
      </div>
    {/if}

    <!-- Settings Button (in old API key position) -->
    {#if authStore.isAuthenticated}
      <button class="settings-btn" onclick={openUserSettingDialog} title="User Settings">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    {/if}

    <!-- User Section -->
    {#if authStore.isAuthenticated}
      {#if authStore.currentUser}
        <div class="user-section">
          <img
            src={`/Picture/Profile/${authStore.currentUser.picture_url || "userUnidentified.png"}?v=${Date.now()}`}
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
            src={`/Picture/Profile/${storedUser.picture_url || "userUnidentified.png"}?v=${Date.now()}`}
            alt="User avatar"
            class="user-avatar"
          />
          <span class="user-name">{storedUser.nickname || storedUser.username}</span>
        </div>
      {:else}
        <div class="user-section loading">
          <div class="user-avatar-placeholder"></div>
          <span class="user-name">Loading...</span>
        </div>
      {/if}
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
</header>
  
  <!-- Preset Popup Component -->
  <PresetPopup
    isOpen={showPresetPopup}
    onClose={closePresetPopup}
    on:apply={handlePresetApply}
  />
  <PromptEdit
    isOpen={showPromptEditor}
    onClose={closePromptEditor}
    on:select={handlePromptSelect}
  />
  <!-- Model Selector Modal -->
  <ModelSelector
    isOpen={showModelSelector}
    onClose={() => showModelSelector = false}
    on:select={handleModelSelect}
  />
  <!-- Login Dialog -->
  <LoginDialog bind:this={loginDialog} />
  <!-- Apikey Dialog -->
  <ApiKeyDialog bind:this={apiKeyDialog} />
  <!-- User Setting Dialog -->
  <UserSetting bind:this={userSettingDialog} />

  <style>
    /* Import split CSS files */
    @import './ChatHeader.base.css';
    @import './ChatHeader.dropdown.css';
    @import './ChatHeader.buttons.css';
    @import './ChatHeader.user.css';
    @import './ChatHeader.mode.css';
    @import './ChatHeader.placeholders.css';
  </style>
