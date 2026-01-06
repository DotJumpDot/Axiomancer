<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { aiStore, promptStore } from "@/Store";
  import { formatModelName, formatProviderName, formatContextLength } from "@/Function";
  import type { AiModel } from "@/Types";

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
  let selectedCapability = $state<'none' | 'fast' | 'reasoning' | 'coding' | 'vision'>('none');
  let searchQuery = $state('');
  let hoveredCapability = $state<string | null>(null);

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

  function savePreset() {
    console.log('PresetPopup savePreset - selectedPrompt:', selectedPrompt);
  }

    function applyPreset() {
    console.log('PresetPopup applyPreset - selectedPrompt:', selectedPrompt);
    dispatch('apply', {
      models: selectedModels,
      prompt: selectedPrompt
    });
    closePopup();
  }
  
  function saveNewPreset() {
    console.log('PresetPopup savePreset - selectedPrompt:', selectedPrompt);
  }

  let filteredModels = $derived.by(() => {
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
    }

    return models;
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="preset-popup-backdrop" onmousedown={closePopup}>
    <div class="preset-popup" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()}>
      <div class="preset-popup-header">
        <h3>Configure Preset</h3>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button class="close-btn" onclick={closePopup}>
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
                      <span class="item-name"style="padding: 20px;">{formatModelName(model.display_name)}</span>
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
              <span class="prompt-status">{selectedPrompt === null ? 'Default' : 'Custom'}</span>
            </div>
            <div class="prompt-list">
              <label class="prompt-radio-item">
                <input
                  type="radio"
                  name="preset-prompt"
                  bind:group={selectedPrompt}
                  value={null}
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
                    bind:group={selectedPrompt}
                    value={profile.id}
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
        <button class="new-preset-btn" onclick={saveNewPreset}>New Preset</button>
        <button class="cancel-btn" onclick={closePopup}>Cancel</button>
        <button class="save-btn" onclick={savePreset}>Save Preset</button>
        <button class="apply-btn" onclick={applyPreset}>Apply Preset</button>
      </div>
    </div>
  </div>
{/if}

<style>
  @import './ChatHeader.popup.css';
</style>
