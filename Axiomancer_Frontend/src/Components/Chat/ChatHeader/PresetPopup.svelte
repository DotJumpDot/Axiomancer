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
  let sortByPrice = $state<'none' | 'low-to-high' | 'high-to-low'>('none');
  let searchQuery = $state('');

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

  function applyPreset() {
    console.log('PresetPopup applyPreset - selectedPrompt:', selectedPrompt);
    dispatch('apply', {
      models: selectedModels,
      prompt: selectedPrompt
    });
    closePopup();
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

    if (sortByPrice === 'low-to-high') {
      models = models.sort((a, b) => a.cost_per_1k_token - b.cost_per_1k_token);
    } else if (sortByPrice === 'high-to-low') {
      models = models.sort((a, b) => b.cost_per_1k_token - a.cost_per_1k_token);
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
                bind:value={searchQuery}
              />
            </div>
            <div class="model-list">
              {#each filteredModels as model (model.id)}
                <label class="model-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.id)}
                    onchange={() => toggleModel(model.id)}
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
        <button class="cancel-btn" onclick={closePopup}>Cancel</button>
        <button class="apply-btn" onclick={applyPreset}>Apply Preset</button>
      </div>
    </div>
  </div>
{/if}

<style>
  @import './ChatHeader.popup.css';
</style>
