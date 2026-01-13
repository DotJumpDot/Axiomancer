<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { aiStore, promptStore, favoriteStore, authStore } from "@/Store";
  import { selectionService } from "@/Service";
  import { formatModelName, formatProviderName, formatContextLength } from "@/Function";
  import type { AiModel, UserSelectedModels } from "@/Types";

  // Focus input action
  function focusInput(node: HTMLInputElement | HTMLTextAreaElement) {
    node.focus();
    if (node instanceof HTMLInputElement) {
      node.select();
    }
  }

  let { 
    isOpen = false, 
    onClose
  }: { 
    isOpen?: boolean; 
    onClose?: () => void;
  } = $props();

  const dispatch = createEventDispatcher();

  let selectedModels = $state<string[]>([]);
  let selectedPrompt = $state<string | null>(null);
  let currentTab = $state<'models' | 'prompt'>('models');
  let showPromptSystemPrompt = $state<string | null>(null);
  let showOnlySelected = $state(false);
  let showOnlyFree = $state(false);
  let showOnlyPricing = $state(false);
  let sortBy = $state<'none' | 'price-low-to-high' | 'price-high-to-low' | 'name-a-z' | 'name-z-a' | 'provider-a-z' | 'provider-z-a'>('none');
  let selectedCapability: 'none' | 'fast' | 'reasoning' | 'coding' | 'vision' = $state('none');
  let searchQuery = $state('');
  let hoveredCapability = $state<string | null>(null);
  
  // Prompt editing state
  let editingPromptId = $state<string | null>(null);
  let editingPromptName = $state('');
  let editingPromptDescription = $state('');
  let editingSystemPrompt = $state<string | null>(null);
  let editingSystemPromptValue = $state('');
  
  // Preset management
  let userPresets = $state<UserSelectedModels[]>([]);
  let selectedPresetId = $state<number | null>(null);
  let isLoadingPresets = $state(false);
  let isRenaming = $state(false);
  let renameValue = $state('');
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let showDeleteConfirmation = $state<'normal' | 'confirm'>('normal');

  function getPresetDisplayName(preset: UserSelectedModels | null | undefined) {
    if (!preset) return null;
    return preset.preset_name || preset.name || `Preset ${preset.preset}`;
  }

  function getNextAvailablePresetName(): string {
    const existingNames = userPresets.map(p => p.preset_name).filter(Boolean);
    let counter = 1;
    while (existingNames.includes(`Preset ${counter}`)) {
      counter++;
    }
    return `Preset ${counter}`;
  }

  // Load user presets on mount
  onMount(async () => {
    await loadUserPresets(true);
  });

  // Clear API key error when API key becomes available
  $effect(() => {
    if (authStore.currentUser?.openrouter_api_key && errorMessage?.includes("API key")) {
      errorMessage = null;
    }
  });

  // Load presets when popup opens and user is authenticated
  $effect(() => {
    if (isOpen && authStore.currentUser?.uuid && userPresets.length === 0) {
      loadUserPresets(true);
    }
  });

  async function loadUserPresets(autoSelectFirst = true) {
    if (!authStore.currentUser?.uuid) return;

    const previousSelectedId = selectedPresetId;
    isLoadingPresets = true;
    try {
      const presets = await selectionService.getPresetsByUserUUID(authStore.currentUser.uuid);
      userPresets = presets;

      // Preserve current selection if it still exists, otherwise default to first preset
      let presetToSelect: UserSelectedModels | null = null;
      if (previousSelectedId !== null) {
        presetToSelect = presets.find((p) => p.preset === previousSelectedId) || null;
      }
      if (!presetToSelect && presets.length > 0 && autoSelectFirst) {
        presetToSelect = presets[0];
      }
      if (presetToSelect) {
        selectPreset(presetToSelect);
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    } finally {
      isLoadingPresets = false;
    }
  }

  function selectPreset(preset: UserSelectedModels | null) {
    if (preset) {
      selectedPresetId = preset.preset;
      selectedModels = [...preset.ai_model_ids];
      selectedPrompt = preset.prompt_id || null;
    } else {
      // New preset
      selectedPresetId = null;
      selectedModels = [];
      selectedPrompt = null;
    }
  }

  function toggleModel(modelId: string) {
    if (selectedModels.includes(modelId)) {
      selectedModels = selectedModels.filter(id => id !== modelId);
    } else {
      selectedModels = [...selectedModels, modelId];
    }
  }

  function switchTab(tab: 'models' | 'prompt') {
    currentTab = tab;
    showPromptSystemPrompt = null;
  }

  function togglePromptSystemPrompt(promptId: string | null) {
    showPromptSystemPrompt = showPromptSystemPrompt === promptId ? null : promptId;
  }

  function closePopup() {
    if (onClose) onClose();
  }

  async function savePreset() {
    errorMessage = null;
    successMessage = null;

    if (!authStore.currentUser?.uuid) {
      errorMessage = "⚠️ User not authenticated. Please log in to save presets.";
      console.error("User not authenticated");
      return;
    }

    if (!authStore.currentUser?.openrouter_api_key) {
      errorMessage = "⚠️ OpenRouter API key is missing. Please add your API key in the sidebar (key icon 🔑) before saving presets.";
      console.error("Missing API key");
      return;
    }

    if (selectedModels.length === 0) {
      errorMessage = "⚠️ Please select at least one model to save the preset.";
      return;
    }

    try {
      if (selectedPresetId !== null) {
        // Update existing preset
        await selectionService.updatePreset(selectedPresetId, {
          ai_model_ids: selectedModels,
          prompt_id: selectedPrompt || undefined,
          openrouter_api_key: authStore.currentUser.openrouter_api_key,
        });
        successMessage = "✓ Preset updated successfully!";
        await loadUserPresets(true);
      } else {
        // Create new preset
        const newPreset = await selectionService.createPreset({
          user_uuid: authStore.currentUser.uuid,
          preset_name: getNextAvailablePresetName(),
          ai_model_ids: selectedModels,
          prompt_id: selectedPrompt || undefined,
          openrouter_api_key: authStore.currentUser.openrouter_api_key,
        });
        successMessage = "✓ Preset created successfully!";
        await loadUserPresets(false);
        selectedPresetId = newPreset.preset; // Select the newly created preset
        selectPreset(newPreset); // Update UI state
      }
      
      // Clear messages after 3 seconds
      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (error) {
      console.error("Failed to save preset:", error);
      errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to save preset. Please try again.");
    }
  }

  function applyPreset() {
    dispatch('apply', {
      models: selectedModels,
      prompt: selectedPrompt
    });
    closePopup();
  }
  
  function createNewPreset() {
    selectPreset(null);
  }

  function startRename() {
    if (selectedPresetId === null) return;
    const currentPreset = userPresets.find(p => p.preset === selectedPresetId);
    isRenaming = true;
    renameValue = getPresetDisplayName(currentPreset) || `Preset ${selectedPresetId}`;
  }

  function cancelRename() {
    isRenaming = false;
    renameValue = '';
  }

  async function confirmRename() {
    if (selectedPresetId === null || !renameValue.trim()) {
      cancelRename();
      return;
    }

    errorMessage = null;
    successMessage = null;

    try {
      await selectionService.updatePreset(selectedPresetId, {
        preset_name: renameValue.trim(),
      });
      await loadUserPresets(true);
      successMessage = "✓ Preset name updated";
      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (error) {
      console.error("Failed to rename preset:", error);
      errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to rename preset.");
    } finally {
      isRenaming = false;
      renameValue = '';
    }
  }

  async function deletePreset() {
    if (selectedPresetId === null) return;
    
    errorMessage = null;
    successMessage = null;

    if (!confirm(`Are you sure you want to delete Preset ${selectedPresetId}?`)) {
      return;
    }

    try {
      await selectionService.deleteSelection(selectedPresetId);
      successMessage = "✓ Preset deleted successfully!";
    } catch (error) {
      if (error.message && error.message.includes("Selection not found")) {
        // Already deleted, treat as success
        successMessage = "✓ Preset deleted successfully!";
      } else {
        console.error("Failed to delete preset:", error);
        errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to delete preset. Please try again.");
        return; // Don't proceed if there was a real error
      }
    }
    
    await loadUserPresets(false);
    selectPreset(null);
    setTimeout(() => {
      successMessage = null;
    }, 3000);
  }



  async function confirmDeletePreset() {
    if (selectedPresetId === null) return;
    
    errorMessage = null;
    successMessage = null;

    try {
      await selectionService.deleteSelection(selectedPresetId);
      successMessage = "✓ Preset deleted successfully!";
    } catch (error) {
      if (error.message && error.message.includes("Selection not found")) {
        // Already deleted, treat as success
        successMessage = "✓ Preset deleted successfully!";
      } else {
        console.error("Failed to delete preset:", error);
        errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to delete preset. Please try again.");
        return; // Don't proceed if there was a real error
      }
    }
    
    await loadUserPresets(false);
    selectPreset(null);
    setTimeout(() => {
      successMessage = null;
    }, 3000);
    showDeleteConfirmation = 'normal';
  }

  // Prompt management functions
  function getNextAvailablePromptName(): string {
    const existingNames = promptStore.profiles.map(p => p.name);
    let counter = 1;
    while (existingNames.includes(`New Prompt ${counter}`)) {
      counter++;
    }
    return `New Prompt ${counter}`;
  }

  async function createNewPrompt() {
    if (!authStore.currentUser?.uuid) {
      errorMessage = "⚠️ Please log in to create prompts";
      return;
    }

    errorMessage = null;
    successMessage = null;

    try {
      const newPrompt = await promptStore.createProfile({
        name: getNextAvailablePromptName(),
        description: "Description for explain prompt title",
        system_prompt: "You are an expert programmer. Provide clear, efficient code solutions.",
      });
      
      if (newPrompt) {
        successMessage = "✓ Prompt created successfully!";
        setTimeout(() => {
          successMessage = null;
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to create prompt:", error);
      errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to create prompt.");
    }
  }

  function startEditPromptInfo(promptId: string) {
    const profile = promptStore.profiles.find(p => p.id === promptId);
    if (profile) {
      editingPromptId = promptId;
      editingPromptName = profile.name;
      editingPromptDescription = profile.description || '';
    }
  }

  function cancelEditPromptInfo() {
    editingPromptId = null;
    editingPromptName = '';
    editingPromptDescription = '';
  }

  async function saveEditPromptInfo() {
    if (!editingPromptId || !editingPromptName.trim()) {
      cancelEditPromptInfo();
      return;
    }

    errorMessage = null;
    successMessage = null;

    try {
      await promptStore.updateProfile(editingPromptId, {
        name: editingPromptName.trim(),
        description: editingPromptDescription.trim() || undefined,
      });
      successMessage = "✓ Prompt updated";
      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (error) {
      console.error("Failed to update prompt:", error);
      errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to update prompt.");
    } finally {
      cancelEditPromptInfo();
    }
  }

  function startEditSystemPrompt(promptId: string) {
    const profile = promptStore.profiles.find(p => p.id === promptId);
    if (profile) {
      editingSystemPrompt = promptId;
      editingSystemPromptValue = profile.system_prompt;
    }
  }

  function cancelEditSystemPrompt() {
    editingSystemPrompt = null;
    editingSystemPromptValue = '';
  }

  async function saveEditSystemPrompt() {
    if (!editingSystemPrompt || !editingSystemPromptValue.trim()) {
      cancelEditSystemPrompt();
      return;
    }

    errorMessage = null;
    successMessage = null;

    try {
      await promptStore.updateProfile(editingSystemPrompt, {
        system_prompt: editingSystemPromptValue.trim(),
      });
      successMessage = "✓ System prompt updated";
      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (error) {
      console.error("Failed to update system prompt:", error);
      errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to update system prompt.");
    } finally {
      cancelEditSystemPrompt();
    }
  }

  async function deletePrompt(promptId: string) {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    errorMessage = null;
    successMessage = null;

    try {
      await promptStore.deleteProfile(promptId);
      if (selectedPrompt === promptId) {
        selectedPrompt = null;
      }
      successMessage = "✓ Prompt deleted";
      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      errorMessage = "❌ " + (error instanceof Error ? error.message : "Failed to delete prompt.");
    }
    
    showDeleteConfirmation = 'normal';
    await loadUserPresets(false);
    selectPreset(null);
    setTimeout(() => {
      successMessage = null;
    }, 3000);
  }

  async function toggleModelFavorite(e: Event, modelId: string) {
    e.stopPropagation();
    if (!authStore.currentUser?.uuid) return;
    
    const isFav = favoriteStore.isFavorite('model', modelId);
    try {
      if (isFav) {
        await favoriteStore.removeFromFavorite(authStore.currentUser.uuid, 'model', modelId);
      } else {
        await favoriteStore.addToFavorite(authStore.currentUser.uuid, 'model', modelId);
      }
      // Force reactivity by triggering a small delay
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.error("Failed to toggle model favorite:", error);
    }
  }

  async function togglePromptFavorite(e: Event, promptId: string) {
    e.stopPropagation();
    if (!authStore.currentUser?.uuid) return;
    
    const isFav = favoriteStore.isFavorite('prompt', promptId);
    try {
      if (isFav) {
        await favoriteStore.removeFromFavorite(authStore.currentUser.uuid, 'prompt', promptId);
      } else {
        await favoriteStore.addToFavorite(authStore.currentUser.uuid, 'prompt', promptId);
      }
      // Force reactivity by triggering a small delay
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.error("Failed to toggle prompt favorite:", error);
    }
  }

  // Derived value for filtered models - reactive to favorites
  let filteredModels = $derived.by(() => {
    // Force reactivity with favorite store
    const favorites = favoriteStore.favorites;
    
    let models = aiStore.enabledModels.filter(model =>
      model.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.model_key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (showOnlySelected) {
      models = models.filter(model => selectedModels.includes(model.id));
    }
    if (showOnlyFree) {
      models = models.filter(model => model.id.endsWith(':free'));
    }

    if (showOnlyPricing) {
      models = models.filter(model => !model.id.endsWith(':free'))
    }

    if (selectedCapability !== 'none') {
      models = models.filter(model => model.capabilities[selectedCapability]);
    }

    // Apply sorting
    if (sortBy === 'price-low-to-high') {
      models = models.sort((a, b) => a.cost_per_1k_token - b.cost_per_1k_token);
    } else if (sortBy === 'price-high-to-low') {
      models = models.sort((a, b) => b.cost_per_1k_token - a.cost_per_1k_token);
    } else if (sortBy === 'name-a-z') {
      models = models.sort((a, b) => a.display_name.localeCompare(b.display_name));
    } else if (sortBy === 'name-z-a') {
      models = models.sort((a, b) => b.display_name.localeCompare(a.display_name));
    } else if (sortBy === 'provider-a-z') {
      models = models.sort((a, b) => a.provider.localeCompare(b.provider));
    } else if (sortBy === 'provider-z-a') {
      models = models.sort((a, b) => b.provider.localeCompare(a.provider));
    } else {
      // No sort applied - use favorite sorting
      models = models.sort((a, b) => {
        const aIsFavorite = favoriteStore.isFavorite('model', a.id);
        const bIsFavorite = favoriteStore.isFavorite('model', b.id);
        
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
      });
    }

    return models;
  });

  // Derived value for filtered prompts - reactive to favorites
  let filteredPrompts = $derived.by(() => {
    // Force reactivity with favorite store
    const favorites = favoriteStore.favorites;
    
    const profiles = [...promptStore.profiles];
    
    // Sort prompts with favorites first
    return profiles.sort((a, b) => {
      const aIsFavorite = favoriteStore.isFavorite('prompt', a.id);
      const bIsFavorite = favoriteStore.isFavorite('prompt', b.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return 0;
    });
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="preset-popup-backdrop" onmousedown={closePopup}>
    <div class="preset-popup" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()}>
      <div class="preset-popup-header">
        <div>
          {#if isRenaming}
            <input
              type="text"
              class="preset-name-input"
              bind:value={renameValue}
              onkeydown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') cancelRename();
              }}
              use:focusInput
            />
          {:else}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <h3 
              class="preset-title" 
              onclick={selectedPresetId !== null ? startRename : undefined}
              style={selectedPresetId !== null ? "cursor: pointer; text-decoration: underline;" : ""}
            >
              {selectedPresetId !== null 
                ? (getPresetDisplayName(userPresets.find(p => p.preset === selectedPresetId)) || `Preset ${selectedPresetId}`) 
                : 'Configure Preset'}
            </h3>
          {/if}
          <div class="header-controls">
            {#if selectedPresetId !== null}
              {#if showDeleteConfirmation === 'confirm'}
                <div class="delete-buttons">
                  <button class="delete-preset-btn cancel" onclick={() => showDeleteConfirmation = 'normal'} title="Cancel Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <button class="delete-preset-btn confirm" onclick={confirmDeletePreset} title="Confirm Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                </div>
              {:else}
                <button class="delete-preset-btn normal" onclick={() => showDeleteConfirmation = 'confirm'} title="Delete Preset">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              {/if}
            {/if}
            <button class="new-preset-btn" onclick={createNewPreset} title="Create New Preset">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:black">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <select class="preset-selector" bind:value={selectedPresetId} onchange={(e) => {
              const presetId = parseInt(e.currentTarget.value);
              const preset = userPresets.find(p => p.preset === presetId);
              selectPreset(preset || null);
            }}>
              <option value={null}>New Preset</option>
              {#each userPresets as preset (preset.preset)}
                <option value={preset.preset}>
                  {getPresetDisplayName(preset) || `Preset ${preset.preset}`} ({preset.ai_model_ids.length} models)
                </option>
              {/each}
            </select>
          </div>
        </div>
        {#if errorMessage}
          <div class="message error-message">{errorMessage}</div>
        {/if}
        {#if successMessage}
          <div class="message success-message">{successMessage}</div>
        {/if}
      </div>

      <div class="preset-popup-content">
        <!-- Tab Buttons -->
        <div class="preset-tabs">
          <button 
            class="tab-btn" 
            class:active={currentTab === 'models'} 
            onclick={() => switchTab('models')}
          >
            Models
          </button>
          <button 
            class="tab-btn" 
            class:active={currentTab === 'prompt'} 
            onclick={() => switchTab('prompt')}
          >
            Prompt
          </button>
        </div>

        <!-- Tab Content -->
        {#if currentTab === 'models'}
          <!-- Model Selection Panel -->
          <div class="preset-panel">
            <div class="preset-panel-header">
              <div class="header-left">
                <h4>Select Models</h4>
                <span class="model-count">{selectedModels.length} selected</span>
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
                <label class="filter-toggle">
                  <input type="checkbox" bind:checked={showOnlyPricing} />
                  <span>Pricing only</span>
                </label>
                
                <select class="sort-select" bind:value={selectedCapability}>
                  <option value="none">All</option>
                  <option value="fast">Fast</option>
                  <option value="reasoning">Reasoning</option>
                  <option value="coding">Coding</option>
                  <option value="vision">Vision</option>
                </select>

                <select class="sort-select" bind:value={sortBy}>
                  <option value="none">Sort by...</option>
                  <option value="name-a-z">Model Name: A-Z</option>
                  <option value="name-z-a">Model Name: Z-A</option>
                  <option value="provider-a-z">Provider: A-Z</option>
                  <option value="provider-z-a">Provider: Z-A</option>
                  <option value="price-low-to-high">Price: Low to High</option>
                  <option value="price-high-to-low">Price: High to Low</option>
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
                bind:value={searchQuery}
              />
            </div>
            <div class="model-list">
              {#each filteredModels as model (model.id)}
                <div 
                  class="model-grid {selectedModels.includes(model.id) ? 'selected' : ''}" 
                  onclick={() => toggleModel(model.id)}
                >
                  <!-- Grid 1: Provider and Model Display Name -->
                  <div class="grid-itemLeft">
                    <div class="item-left">
                      <!-- <span class="item-provider">{formatProviderName(model.provider)}</span> -->
                      <span class="item-name" style="padding: 20px;">
                        {formatModelName(model.display_name)}
                        <button
                          class="inline-favorite-btn {favoriteStore.isFavorite('model', model.id) ? 'favorited' : ''}"
                          onclick={(e) => toggleModelFavorite(e, model.id)}
                          title={favoriteStore.isFavorite('model', model.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={favoriteStore.isFavorite('model', model.id) ? "#ffc107" : "none"} stroke="#ffc107" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </button>
                      </span>
                    </div>
                  </div>

                  <!-- Grid 2: Capabilities -->
                  <div class="grid-item capabilities">
                    <div class="capability-icon fast" class:active={model.capabilities.fast} title="Fast processing and quick responses">
                      {#if model.capabilities.fast}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                        </svg>
                      {:else}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6">
                          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                        </svg>
                      {/if}
                    </div>
                    <div class="capability-icon reasoning" class:active={model.capabilities.reasoning} title="Advanced reasoning and problem-solving">
                      {#if model.capabilities.reasoning}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                          <path d="M12 17h.01"></path>
                        </svg>
                      {:else}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                          <path d="M12 17h.01"></path>
                        </svg>
                      {/if}
                    </div>
                    <div class="capability-icon coding" class:active={model.capabilities.coding} title="Code generation and programming assistance">
                      {#if model.capabilities.coding}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="16,18 22,12 16,6"></polyline>
                          <polyline points="8,6 2,12 8,18"></polyline>
                        </svg>
                      {:else}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6">
                          <polyline points="16,18 22,12 16,6"></polyline>
                          <polyline points="8,6 2,12 8,18"></polyline>
                        </svg>
                      {/if}
                    </div>
                    <div class="capability-icon vision" class:active={model.capabilities.vision} title="Image understanding and visual analysis">
                      {#if model.capabilities.vision}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      {:else}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      {/if}
                    </div>
                  </div>

                  <!-- Grid 3: Context Length -->
                  <div class="grid-item">
                    <span class="item-context">{formatContextLength(model.context_length)}</span>
                  </div>

                  <!-- Grid 4: Price -->
                  <div class="grid-item">
                    <span class="item-price">${model.cost_per_1k_token.toFixed(5)}/1K</span>
                  </div>
                </div>
              {/each}
              {#if filteredModels.length === 0}
                <div class="no-results">No models found</div>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Prompt Selection Panel -->
          <div class="preset-panel">
            <div class="preset-panel-header">
              <h4>Select Prompt</h4>
              <button class="add-prompt-btn" onclick={createNewPrompt} title="Add New Prompt">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Prompt
              </button>
            </div>
            <div class="prompt-list">
              <label class="prompt-radio-item {selectedPrompt === null ? 'selected' : ''}">
                <input
                  type="radio"
                  name="preset-prompt"
                  bind:group={selectedPrompt}
                  value={null}
                />
                <div class="prompt-info">
                  <span class="item-name">Default</span><br>
                  <span class="item-desc">Standard helpful assistant</span>
                </div>
                <button class="show-prompt-label" onclick={() => togglePromptSystemPrompt('default')} title="Show System Prompt">
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
              {#each filteredPrompts as profile (profile.id)}
                <label class="prompt-radio-item {selectedPrompt === profile.id ? 'selected' : ''}">
                  <input
                    type="radio"
                    name="preset-prompt"
                    bind:group={selectedPrompt}
                    value={profile.id}
                  />
                  <div class="prompt-info">
                    {#if editingPromptId === profile.id}
                      <div class="edit-prompt-form">
                        <input
                          type="text"
                          class="edit-input"
                          bind:value={editingPromptName}
                          placeholder="Prompt name"
                          use:focusInput
                        />
                        <input
                          type="text"
                          class="edit-input"
                          bind:value={editingPromptDescription}
                          placeholder="Description"
                        />
                        <div class="edit-actions">
                          <!-- svelte-ignore a11y_consider_explicit_label -->
                          <button class="save-edit-btn" onclick={saveEditPromptInfo}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <!-- svelte-ignore a11y_consider_explicit_label -->
                          <button class="cancel-edit-btn" onclick={cancelEditPromptInfo}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    {:else}
                      <span class="item-name">
                        {profile.name}
                        <button
                          class="inline-favorite-btn {favoriteStore.isFavorite('prompt', profile.id) ? 'favorited' : ''}"
                          onclick={(e) => togglePromptFavorite(e, profile.id)}
                          title={favoriteStore.isFavorite('prompt', profile.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={favoriteStore.isFavorite('prompt', profile.id) ? "#ffc107" : "none"} stroke="#ffc107" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </button>
                      </span>
                      <button class="edit-prompt-btn" style="margin-left: 10px;" onclick={(e) => { e.preventDefault(); startEditPromptInfo(profile.id); }} title="Edit Name & Description">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button class="delete-prompt-btn" style="margin-left: 2px;" onclick={(e) => { e.preventDefault(); deletePrompt(profile.id); }} title="Delete Prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                      {#if profile.description}
                      <br>
                        <span class="item-desc">{profile.description}</span>
                      {/if}
                    {/if}
                  </div>
                  {#if editingPromptId !== profile.id}
                    <button class="show-prompt-label" onclick={() => togglePromptSystemPrompt(profile.id)} title="Show System Prompt">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  {/if}
                </label>
                {#if showPromptSystemPrompt === profile.id}
                  <div class="individual-system-prompt">
                    {#if editingSystemPrompt === profile.id}
                      <div class="edit-system-prompt-form">
                        <textarea
                          class="edit-textarea"
                          bind:value={editingSystemPromptValue}
                          rows="6"
                          use:focusInput
                        ></textarea>
                        <div class="edit-actions">
                          <button class="save-edit-btn" onclick={saveEditSystemPrompt}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Save
                          </button>
                          <button class="cancel-edit-btn" onclick={cancelEditSystemPrompt}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </div>
                    {:else}
                      <div class="system-prompt-header">
                        <h5>System Prompt</h5>
                        <button class="edit-system-prompt-btn" onclick={() => startEditSystemPrompt(profile.id)} title="Edit System Prompt">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                      </div>
                      <div class="system-prompt-content">
                        <pre>{profile.system_prompt}</pre>
                      </div>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <div class="preset-popup-footer"> 
        <button class="cancel-btn" onclick={closePopup}>Cancel</button>
        <button class="save-btn" onclick={savePreset}>Save Preset</button>
        <button class="apply-btn" onclick={applyPreset}>Apply Preset</button>
      </div>
    </div>
  </div>
{/if}

<style>
  @import './ChatHeader.popup.css';

  .inline-favorite-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    margin-left: 6px;
    border-radius: 3px;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
  }

  .inline-favorite-btn:hover {
    background: rgba(255, 193, 7, 0.2);
  }

  /* Show favorite button on hover of the parent item */
  .model-grid:hover .inline-favorite-btn,
  .prompt-radio-item:hover .inline-favorite-btn {
    opacity: 1;
    visibility: visible;
  }

  /* Always show favorite button if it's already favorited */
  .inline-favorite-btn.favorited {
    opacity: 1;
    visibility: visible;
  }

  /* Ensure the item-name span can contain the button properly */
  .item-name {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
  }
</style>
