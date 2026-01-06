<script lang="ts">
  import { onMount } from "svelte";
  import { aiStore, chatStore, promptStore, settingsStore, authStore } from "../../../Store";
  import { userService } from "../../../Service";
  import { formatModelName, formatProviderName, formatContextLength } from "../../../Function";
  import LoginDialog from "../../Auth/LoginDialog.svelte";
  import { ApiKeyDialog } from "../../Auth";
  import type { User, AiModel } from "../../../Types";

  let showModelDropdown = $state(false);
  let showPromptDropdown = $state(false);
  let showSingleModelDropdown = $state(false);
  let showLoginDialog = $state(false);
  let showPresetPopup = $state(false);
  let showSystemPrompt = $state(false);
  let storedUser = $state<User | null>(null);
  let currentMode = $state<'auto' | 'single'>('auto');
  let searchQuery = $state('');
  let selectedPresetModels = $state<string[]>([]);
  let selectedPresetPrompt = $state<string | null>(null);
  let currentPresetTab = $state<'models' | 'prompt'>('models');
  let showPromptSystemPrompt = $state<string | null>(null);
  let showOnlySelected = $state(false);
  let showOnlyFree = $state(false);
  let sortByPrice = $state<'none' | 'low-to-high' | 'high-to-low'>('none');

  let apiKeyDialog: any;

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
    showSingleModelDropdown = false;
  }

  function selectPrompt(profileId: string | null) {
    promptStore.selectProfile(profileId);
    if (profileId) {
      chatStore.setPromptProfileId(profileId);
    }
    showPromptDropdown = false;
    showSystemPrompt = false; // Close system prompt when selecting new prompt
  }

  function toggleMode() {
    currentMode = currentMode === 'auto' ? 'single' : 'auto';
    if (currentMode === 'auto') {
      aiStore.enableAutoRouting();
    } else {
      aiStore.disableAutoRouting();
    }
    showModelDropdown = false;
  }

  function toggleAutoRouting() {
    if (aiStore.autoRoutingEnabled) {
      aiStore.disableAutoRouting();
    } else {
      aiStore.enableAutoRouting();
    }
  }

  function openPresetPopup() {
    showPresetPopup = true;
  }

  function closePresetPopup() {
    showPresetPopup = false;
    showSystemPrompt = false; // Close system prompt when closing popup
    showPromptSystemPrompt = null; // Close individual prompt system prompts
  }

  function togglePresetModel(modelId: string) {
    if (selectedPresetModels.includes(modelId)) {
      selectedPresetModels = selectedPresetModels.filter(id => id !== modelId);
    } else {
      selectedPresetModels = [...selectedPresetModels, modelId];
    }
  }

  function selectPresetPrompt(profileId: string | null) {
    selectedPresetPrompt = profileId;
  }

  function applyPreset() {
    // Apply selected models and prompt to the preset
    // This would typically save to backend or apply to current session
    console.log('Applying preset:', { models: selectedPresetModels, prompt: selectedPresetPrompt });
    closePresetPopup();
  }

  function switchPresetTab(tab: 'models' | 'prompt') {
    currentPresetTab = tab;
    showSystemPrompt = false; // Close system prompt when switching tabs
    showPromptSystemPrompt = null; // Close individual prompt system prompts
  }

  function toggleSystemPrompt() {
    showSystemPrompt = !showSystemPrompt;
    showPromptDropdown = false; // Close dropdown when opening system prompt
    showPromptSystemPrompt = null; // Close individual prompts when opening main one
  }

  function togglePromptSystemPrompt(promptId: string | null) {
    showPromptSystemPrompt = showPromptSystemPrompt === promptId ? null : promptId;
  }

  let filteredModels = $derived(aiStore.enabledModels.filter(model =>
    model.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.model_key.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  let presetSearchQuery = $state('');
  let filteredPresetModels = $derived.by(() => {
    let models = aiStore.enabledModels.filter(model =>
      model.display_name.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(presetSearchQuery.toLowerCase()) ||
      model.model_key.toLowerCase().includes(presetSearchQuery.toLowerCase())
    );

    // Apply filters
    if (showOnlySelected) {
      models = models.filter(model => selectedPresetModels.includes(model.id));
    }
    if (showOnlyFree) {
      models = models.filter(model => model.id.endsWith(':free'));
    }

    // Apply sorting
    if (sortByPrice === 'low-to-high') {
      models = models.sort((a, b) => a.cost_per_1k_token - b.cost_per_1k_token);
    } else if (sortByPrice === 'high-to-low') {
      models = models.sort((a, b) => b.cost_per_1k_token - a.cost_per_1k_token);
    }

    return models;
  });

  function handleLogin() {
    showLoginDialog = true;
  }

  function handleLogout() {
    authStore.logout();
  }

  function openApiKeyDialog() {
    if (authStore.isAuthenticated) {
      apiKeyDialog?.open();
    }
  }
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
            <button class="dropdown-item" onclick={toggleMode}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span class="item-name">Auto-Routing</span>
              <span class="item-desc">Automatically select best model</span>
              {#if currentMode === 'auto'}
                <svg class="check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {/if}
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" onclick={toggleMode}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
              </svg>
              <span class="item-name">Single Model</span>
              <span class="item-desc">Select a specific model</span>
              {#if currentMode === 'single'}
                <svg class="check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {/if}
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
          onclick={() => (showSingleModelDropdown = !showSingleModelDropdown)}
        >
          {#if aiStore.selectedModel}
            <span class="model-provider">{formatProviderName(aiStore.selectedModel.provider)}</span>
            <span class="model-name">{formatModelName(aiStore.selectedModel.model_key)}</span>
          {:else}
            Select Model
          {/if}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {#if showSingleModelDropdown}
          <div class="dropdown-menu searchable">
            <div class="search-input">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search models..."
                bind:value={searchQuery}
              />
            </div>
            <div class="dropdown-divider"></div>
            {#each filteredModels as model (model.id)}
              <button
                class="dropdown-item"
                class:selected={aiStore.selectedModel?.id === model.id}
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
            {#if filteredModels.length === 0}
              <div class="no-results">No models found</div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Prompt Profile Selector (only show in single mode) -->
    {#if authStore.isAuthenticated && currentMode === 'single'}
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

    <!-- Preset Button (only show in auto mode) -->
    {#if authStore.isAuthenticated && currentMode === 'auto'}
      <button class="preset-btn" onclick={openPresetPopup}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      <button class="api-key-btn" onclick={openApiKeyDialog} title="Manage OpenRouter API Key">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
        </svg>
      </button>
    {/if}

    <!-- User Section -->
    {#if authStore.isAuthenticated}
      {#if authStore.currentUser}
        <div class="user-section">
          <img 
            src={`/Picture/Profile/${authStore.currentUser.picture_url || "userUnidentified.png"}`} 
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
            src={`/Picture/Profile/${storedUser.picture_url || "userUnidentified.png"}`} 
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

  <!-- Preset Popup -->
  {#if showPresetPopup}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="preset-popup-backdrop" onmousedown={() => closePresetPopup()}>
      <div class="preset-popup" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()}>
        <div class="preset-popup-header">
          <h3>Configure Preset</h3>
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button class="close-btn" onclick={closePresetPopup}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="preset-popup-content">
          <!-- Tab Buttons -->
          <div class="preset-tabs">
            <button 
              class="tab-btn" 
              class:active={currentPresetTab === 'models'} 
              onclick={() => switchPresetTab('models')}
            >
              Models
            </button>
            <button 
              class="tab-btn" 
              class:active={currentPresetTab === 'prompt'} 
              onclick={() => switchPresetTab('prompt')}
            >
              Prompt
            </button>
          </div>

          <!-- Tab Content -->
          {#if currentPresetTab === 'models'}
            <!-- Model Selection Panel -->
            <div class="preset-panel">
              <div class="preset-panel-header">
                <div class="header-left">
                  <h4>Select Models</h4>
                  <span class="model-count">{selectedPresetModels.length} selected</span>
                </div>
                <div class="header-filters">
                  <label class="filter-toggle">
                    <input type="checkbox" bind:checked={showOnlySelected} />
                    <span>Selected only</span>
                  </label>
                  <label class="filter-toggle">
                    <input type="checkbox" bind:checked={showOnlyFree} />
                    <span>Free only</span>
                  </label>
                  <select class="sort-select" bind:value={sortByPrice}>
                    <option value="none">Sort by...</option>
                    <option value="low-to-high">Price: Low to High</option>
                    <option value="high-to-low">Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div class="preset-search">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search models..."
                  bind:value={presetSearchQuery}
                />
              </div>
              <div class="model-list">
                {#each filteredPresetModels as model (model.id)}
                  <label class="model-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedPresetModels.includes(model.id)}
                      onchange={() => togglePresetModel(model.id)}
                    />
                    <div class="model-info">
                      <div class="model-header">
                        <span class="item-provider">{formatProviderName(model.provider)}</span>
                        {#if model.id.endsWith(':free')}
                          <span class="capability-badge free">Free</span>
                        {/if}
                        <span class="item-price">${model.cost_per_1k_token.toFixed(4)}/1K</span>
                      </div>
                      <div class="model-details">
                        <span class="item-name">{formatModelName(model.model_key)}</span>
                        <span class="item-context">{formatContextLength(model.context_length)}</span>
                      </div>
                      <div class="model-badges">
                        {#if model.capabilities.fast}
                          <span class="capability-badge fast">Fast</span>
                        {/if}
                        {#if model.capabilities.reasoning}
                          <span class="capability-badge reasoning">Reasoning</span>
                        {/if}
                      </div>
                    </div>
                  </label>
                {/each}
                {#if filteredPresetModels.length === 0}
                  <div class="no-results">No models found</div>
                {/if}
              </div>
            </div>
          {:else}
            <!-- Prompt Selection Panel -->
            <div class="preset-panel">
              <div class="preset-panel-header">
                <h4>Select Prompt</h4>
                <span class="prompt-status">{selectedPresetPrompt === null ? 'Default' : 'Custom'}</span>
              </div>
              <div class="prompt-list">
                <label class="prompt-radio-item">
                  <input
                    type="radio"
                    name="preset-prompt"
                    checked={selectedPresetPrompt === null}
                    onchange={() => selectPresetPrompt(null)}
                  />
                  <div class="prompt-info">
                    <span class="item-name">Default</span>
                    <span class="item-desc">Standard helpful assistant</span>
                  </div>
                  <button class="show-prompt-label" onclick={() => togglePromptSystemPrompt(null)} title="Show System Prompt">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </label>
                {#if showPromptSystemPrompt === 'default'}
                  <div class="individual-system-prompt">
                    <div class="system-prompt-content">
                      <pre>You are a helpful assistant.</pre>
                    </div>
                  </div>
                {/if}
                {#each promptStore.profiles as profile (profile.id)}
                  <label class="prompt-radio-item">
                    <input
                      type="radio"
                      name="preset-prompt"
                      checked={selectedPresetPrompt === profile.id}
                      onchange={() => selectPresetPrompt(profile.id)}
                    />
                    <div class="prompt-info">
                      <span class="item-name">{profile.name}</span>
                      {#if profile.description}
                        <span class="item-desc">{profile.description}</span>
                      {/if}
                    </div>
                    <button class="show-prompt-label" onclick={() => togglePromptSystemPrompt(profile.id)} title="Show System Prompt">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </label>
                  {#if showPromptSystemPrompt === profile.id}
                    <div class="individual-system-prompt">
                      <div class="system-prompt-content">
                        <pre>{profile.system_prompt}</pre>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="preset-popup-footer">
          <button class="cancel-btn" onclick={closePresetPopup}>Cancel</button>
          <button class="apply-btn" onclick={applyPreset}>Apply Preset</button>
        </div>
      </div>
    </div>
  {/if}
</header>

<!-- Login Dialog -->
{#if showLoginDialog}
  <LoginDialog bind:open={showLoginDialog} />
{/if}

<ApiKeyDialog bind:this={apiKeyDialog} />

<style>
  /* Import split CSS files */
  @import './ChatHeader.base.css';
  @import './ChatHeader.dropdown.css';
  @import './ChatHeader.buttons.css';
  @import './ChatHeader.user.css';
  @import './ChatHeader.mode.css';
  @import './ChatHeader.popup.css';
  @import './ChatHeader.placeholders.css';
</style>

<ApiKeyDialog bind:this={apiKeyDialog} />
