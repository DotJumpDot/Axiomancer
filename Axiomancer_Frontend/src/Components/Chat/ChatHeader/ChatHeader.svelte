<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { aiStore, chatStore, promptStore, settingsStore, authStore, selectionStore } from "@/Store";
  import { userService, selectionService } from "@/Service";
  import { formatModelName, formatProviderName, getTranslations, type LanguageCode } from "@/Function";
  import LoginDialog from "@/Components/Auth/LoginDialog.svelte";
  import { ApiKeyDialog } from "@/Components/Auth";
  import PresetPopup from "./PresetPopup.svelte";
  import ModelSelector from "./ModelSelector.svelte";
  import PromptEdit from "./PromptEdit.svelte";
  import UserSetting from "./UserSetting.svelte";
  import type { User, AiModel } from "@/Types";

  // Reactive translations
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  let showModelDropdown = $state(false);
  let showPromptDropdown = $state(false);
  let showPresetPopup = $state(false);
  let showSystemPrompt = $state(false);
  let showModelSelector = $state(false);
  let showPromptEditor = $state(false);
  let showLanguageDropdown = $state(false);
  let storedUser = $state<User | null>(null);
  let currentMode = $state<'auto' | 'single'>('auto');
  let currentPresetName = $state<string | null>(null);
  let currentPresetId = $state<number | null>(null);

  // Single mode selections
  let selectedModelKey = $state<string | null>(null);
  let selectedModelName = $state<string>("");
  let selectedPromptId = $state<string | null>(null);
  let selectedPromptName = $state<string>("");

  // Auto mode selections
  let autoDecidingModelKey = $state<string | null>(null);
  let autoDecidingModelName = $state<string>("");
  let showAutoModelSelector = $state(false);

  let loginDialog: any;
  let apiKeyDialog: any;
  let userSettingDialog: any;
  let languageDropdownRef: HTMLElement;
  // svelte-ignore non_reactive_update
    let modeDropdownRef: HTMLElement;
  // svelte-ignore non_reactive_update
    let promptDropdownRef: HTMLElement;
  let isInitializing = $state(true);
  let hasLoadedPreset = $state(false);

  // Derived state for API key status - defaults to true until we know otherwise
  let hasApiKey = $derived(authStore.currentUser ? !!authStore.currentUser.openrouter_api_key : true);

  onMount(async () => {
    // Initialize single mode selections from localStorage
    chatStore.initializeSingleMode();
    selectedModelKey = chatStore.currentModelKey;
    selectedPromptId = chatStore.currentPromptProfileId;
    
    // Initialize auto mode deciding model from aiStore
    if (aiStore.selectedModel) {
      autoDecidingModelKey = aiStore.selectedModel.model_key;
      autoDecidingModelName = aiStore.selectedModel.display_name;
    }
    
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
    
    // Load preset and decision model if authenticated and in auto mode on initial mount
    if (authStore.isAuthenticated && authStore.getMode() === 'auto') {
      await loadAndApplyPreset();
      hasLoadedPreset = true;
    }
    
    // Mark initialization as complete
    isInitializing = false;
    
    // Update model and prompt names after a short delay to ensure stores are loaded
    // This handles the case where stores need time to fetch data
    setTimeout(() => {
      updateModelAndPromptNames();
    }, 100);

    // Click outside handler for dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef && !modeDropdownRef.contains(event.target as Node)) {
        showModelDropdown = false;
      }
      if (languageDropdownRef && !languageDropdownRef.contains(event.target as Node)) {
        showLanguageDropdown = false;
      }
      if (promptDropdownRef && !promptDropdownRef.contains(event.target as Node)) {
        showPromptDropdown = false;
        showSystemPrompt = false;
      }
    };

    document.addEventListener('click', handleClickOutside);

    onDestroy(() => {
      document.removeEventListener('click', handleClickOutside);
    });
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
      const t = getTranslations(settingsStore.language as LanguageCode);
      selectedPromptName = prompt?.name || t.header.selectPrompt;
    } else {
      const t = getTranslations(settingsStore.language as LanguageCode);
      selectedPromptName = t.header.selectPrompt;
    }
    
    // Update auto mode deciding model name
    if (autoDecidingModelKey) {
      const model = aiStore.enabledModels.find(m => m.model_key === autoDecidingModelKey);
      autoDecidingModelName = model?.display_name || autoDecidingModelKey;
    }
  }

  // Initialize mode when user becomes authenticated
  $effect(() => {
    if (authStore.isAuthenticated && authStore.currentUser) {
      // Get saved mode from localStorage
      const savedMode = authStore.getMode();
      
      // Only update if different to avoid infinite loops
      if (currentMode !== savedMode) {
        const previousMode = currentMode;
        currentMode = savedMode;
        
        // Only load preset when actually switching to auto mode (not during initialization)
        if (previousMode !== 'auto' && savedMode === 'auto' && !isInitializing) {
          loadAndApplyPreset();
          hasLoadedPreset = true;
        }
      }
      
      // If we're in auto mode and haven't loaded preset yet, load it now
      // This handles the case where auth completes after initialization
      if (savedMode === 'auto' && !hasLoadedPreset) {
        loadAndApplyPreset();
      }
      
      // Apply to aiStore
      if (currentMode === 'auto') {
        aiStore.enableAutoRouting();
      } else {
        aiStore.disableAutoRouting();
      }
    }
  });

  //* Load and apply preset from localStorage
  async function loadAndApplyPreset() {
    if (!authStore.currentUser) return;
    
    // Prevent duplicate loading
    if (hasLoadedPreset) return;
    
    const savedPreset = authStore.getPreset();
    
    // Store current preset ID for passing to PresetPopup
    currentPresetId = savedPreset;
    
    if (savedPreset !== null) {
      try {
        // Get preset data from backend
        const presetData = await selectionService.getSelectionByPreset(savedPreset);
        
        // Only apply if the preset belongs to the current user
        if (presetData && presetData.user_uuid === authStore.currentUser.uuid) {
          currentPresetName = presetData.preset_name || `Preset ${savedPreset}`;
          
          // Save to selection store
          selectionStore.setCurrentPreset(
            currentPresetName,
            presetData.prompt_id || null
          );
          
          hasLoadedPreset = true;
        }
      } catch (error) {
        console.error("Failed to load preset data:", error);
      }
    }
  }

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
    const newMode = currentMode === 'auto' ? 'single' : 'auto';
    currentMode = newMode;
    
    // Save mode to localStorage
    if (authStore.isAuthenticated) {
      authStore.saveMode(newMode);
    }
    
    // Update aiStore state
    if (newMode === 'auto') {
      aiStore.enableAutoRouting();
      // Reset loaded flag to allow loading preset
      hasLoadedPreset = false;
      // Load and apply preset when switching to auto mode
      loadAndApplyPreset();
    } else {
      aiStore.disableAutoRouting();
      // Clear preset state when switching to single mode
      currentPresetName = null;
      currentPresetId = null;
      hasLoadedPreset = false;
      // When switching to single mode, ensure selections are initialized
      chatStore.initializeSingleMode();
      selectedModelKey = chatStore.currentModelKey;
      selectedPromptId = chatStore.currentPromptProfileId;
      updateModelAndPromptNames();
      
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

  function handleAutoModelSelect(event: any) {
    const modelKey = event.detail;
    autoDecidingModelKey = modelKey;
    const model = aiStore.enabledModels.find(m => m.model_key === modelKey);
    if (model) {
      autoDecidingModelName = model.display_name;
      aiStore.selectModelByKey(modelKey);
    }
    // Update selection store to enable input (keep existing prompt ID)
    selectionStore.setCurrentPreset(currentPresetName, selectionStore.currentPromptId);
    showAutoModelSelector = false;
  }

  function handlePresetApply(event: any) {
    const { models, prompt, presetName, presetId } = event.detail;
    console.log('Applying preset:', { models, prompt, presetName, presetId });
    currentPresetName = presetName;
    
    // Save preset to localStorage if presetId is provided
    if (presetId !== undefined && presetId !== null) {
      authStore.savePreset(presetId);
    }
    
    // Save to selection store for global access (include prompt ID)
    selectionStore.setCurrentPreset(presetName, prompt);
    
    closePresetPopup();
  }

  function handlePresetSelected(event: any) {
    const { presetName, presetId } = event.detail;
    console.log('Preset selected:', presetName, 'Preset ID:', presetId);
    currentPresetName = presetName;
    
    // Save preset to localStorage if presetId is provided
    if (presetId !== undefined && presetId !== null) {
      authStore.savePreset(presetId);
    }
    
    // Save to selection store for global access (prompt ID will be set when preset is applied)
    selectionStore.setCurrentPreset(presetName, null);
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

  function selectLanguage(language: "en" | "th") {
    settingsStore.setLanguage(language);
    showLanguageDropdown = false;
  }

  function toggleTheme() {
    settingsStore.toggleThemeMode();
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
      <div class="dropdown mode-selector" bind:this={modeDropdownRef}>
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
            {t.header.auto}
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
            </svg>
            {t.header.single}
          {/if}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {#if showModelDropdown}
          <div class="dropdown-menu" transition:slide={{ duration: 200, easing: cubicOut }}>
            <button class="dropdown-item" class:active-mode={currentMode === 'auto'} onclick={toggleMode}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              <span class="item-name">{t.header.autoRouting}</span>
              <span class="item-desc">{t.header.autoRoutingDesc}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" class:active-mode={currentMode === 'single'} class:single={currentMode === 'single'} onclick={toggleMode}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
              </svg>
              <span class="item-name">{t.header.singleModel}</span>
              <span class="item-desc">{t.header.singleModelDesc}</span>
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="mode-selector-placeholder">
        <span class="placeholder-text">{t.header.loginToSelectMode}</span>
      </div>
    {/if}

    <!-- Auto Mode Deciding Model Selector (only show in auto mode) -->
    {#if authStore.isAuthenticated && currentMode === 'auto'}
      <div class="dropdown model-selector">
        <button
          class="dropdown-trigger deciding-model"
          onclick={() => (showAutoModelSelector = true)}
          disabled={!currentPresetName}
          title={!currentPresetName ? (t.header.selectPresetFirst || "Select a preset first") : (t.header.decidingModel || "Deciding Model")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
          </svg>
          {#if autoDecidingModelName && autoDecidingModelName !== autoDecidingModelKey}
            <span class="model-name">{autoDecidingModelName}</span>
          {:else if autoDecidingModelKey}
            <span class="model-name">{formatModelName(autoDecidingModelKey)}</span>
          {:else}
            {t.header.selectDecidingModel || "Select Deciding Model"}
          {/if}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
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
            {t.header.selectModel}
          {/if}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    {/if}

    <!-- Prompt Profile Selector (only show in single mode) -->
    {#if authStore.isAuthenticated && currentMode === 'single'}
      <div class="dropdown prompt-selector" bind:this={promptDropdownRef}>
        <button
          class="dropdown-trigger2"
          onclick={() => (showPromptDropdown = !showPromptDropdown)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          {selectedPromptName || t.header.selectPrompt}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {#if showPromptDropdown}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div class="dropdown-menu" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 200, easing: cubicOut }}>
            <button
              class="dropdown-item"
              class:selected={!promptStore.selectedProfile}
              onclick={() => selectPrompt(null)}
            >
              <span class="item-name">{t.header.defaultPrompt}</span>
              <span class="item-desc">{t.header.defaultPromptDesc}</span>
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
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div class="system-prompt-display" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 200, easing: cubicOut }}>
            <div class="system-prompt-header">
              <h4>{t.header.systemPrompt}</h4>
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
      <button class="prompt-edit-btn" onclick={openPromptEditor} title={t.header.managePrompts}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        {t.header.managePrompts}
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
        {currentPresetName || t.header.preset}
      </button>
    {/if}

    <!-- Sidebar Collapse Button -->
    <button 
      class="collapse-btn"
      onclick={() => settingsStore.toggleSidebar()}
      title={settingsStore.sidebarOpen ? t.header.collapseSidebar : t.header.expandSidebar}
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
    <!-- Theme Toggle Button -->
    <button class="theme-toggle-btn" onclick={toggleTheme} title={settingsStore.themeMode === 'light' ? t.header.switchToDark : t.header.switchToLight}>
      {#if settingsStore.themeMode === 'light'}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      {/if}
    </button>

    <!-- Language Selector -->
    <div class="dropdown language-selector" bind:this={languageDropdownRef}>
      <button
        class="dropdown-trigger language-btn"
        onclick={() => (showLanguageDropdown = !showLanguageDropdown)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        {settingsStore.language.toUpperCase()}
        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      {#if showLanguageDropdown}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="dropdown-menu2" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 200, easing: cubicOut }}>
          <button class="dropdown-item" class:active-language={settingsStore.language === 'en'} onclick={() => selectLanguage('en')}>
            <span class="item-name">English</span>
            <span class="item-desc">EN</span>
          </button>
          <button class="dropdown-item" class:active-language={settingsStore.language === 'th'} onclick={() => selectLanguage('th')}>
            <span class="item-name">ภาษาไทย</span>
            <span class="item-desc">TH</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- API Key Button -->
    {#if authStore.isAuthenticated}
      <div class="api-key-container">
        <button 
          class="api-key-btn" 
          class:needs-api-key={!hasApiKey}
          onclick={openApiKeyDialog} 
          title={hasApiKey ? t.header.manageApiKey : ""}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
        </button>
        {#if !hasApiKey}
          <div class="api-key-tooltip">
            {t.header.addApiKeyRequired}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Settings Button (in old API key position) -->
    {#if authStore.isAuthenticated}
      <button class="settings-btn" onclick={openUserSettingDialog} title={t.header.userSettings}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
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
          <span class="user-name">{t.common.loading}</span>
        </div>
      {/if}
    {:else}
      <button class="login-btn" onclick={handleLogin}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        {t.common.login}
      </button>
    {/if}
  </div>
</header>
  
  <!-- Preset Popup Component -->
  <PresetPopup
    isOpen={showPresetPopup}
    onClose={closePresetPopup}
    currentPresetId={currentPresetId}
    on:apply={handlePresetApply}
    on:presetSelected={handlePresetSelected}
  />
  <PromptEdit
    isOpen={showPromptEditor}
    onClose={closePromptEditor}
    on:select={handlePromptSelect}
  />
  <!-- Model Selector Modal (Single Mode) -->
  <ModelSelector
    isOpen={showModelSelector}
    onClose={() => showModelSelector = false}
    on:select={handleModelSelect}
  />
  <!-- Model Selector Modal (Auto Mode - Deciding Model) -->
  <ModelSelector
    isOpen={showAutoModelSelector}
    onClose={() => showAutoModelSelector = false}
    on:select={handleAutoModelSelect}
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
