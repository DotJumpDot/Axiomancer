<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { aiStore, favoriteStore, authStore } from "@/Store";
  import { formatModelName, formatProviderName, formatContextLength } from "@/Function";

  let { 
    isOpen = false, 
    onClose
  }: { 
    isOpen?: boolean; 
    onClose?: () => void;
  } = $props();

  const dispatch = createEventDispatcher();

  let searchQuery = $state('');
  let showOnlyFree = $state(false);
  let showOnlyPricing = $state(false);
  let selectedCapability: 'none' | 'fast' | 'reasoning' | 'coding' | 'vision' = $state('none');
  let sortBy = $state<'none' | 'price-low-to-high' | 'price-high-to-low' | 'name-a-z' | 'name-z-a' | 'provider-a-z' | 'provider-z-a'>('none');

  // Derived value for filtered models - reactive to favorites
  let filteredModels = $derived.by(() => {
    // Force reactivity with favorite store
    const favorites = favoriteStore.favorites;
    
    let models = aiStore.enabledModels.filter(model =>
      model.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.model_key.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  function selectModel(modelId: string) {
    dispatch('select', modelId);
    closePopup();
  }

  function closePopup() {
    if (onClose) onClose();
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="model-selector-backdrop" onmousedown={closePopup}>
    <div class="model-selector-popup" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()}>
      <div class="model-selector-header">
        <h3 class="model-selector-title">Select Model</h3>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button class="close-btn" onclick={closePopup}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="model-selector-content">
        <!-- Search and Filters -->
        <div class="search-section">
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

          <div class="filters">
            <label class="filter-checkbox">
              <input type="checkbox" bind:checked={showOnlyFree} />
              <span>Free models only</span>
            </label>
            <label class="filter-checkbox">
              <input type="checkbox" bind:checked={showOnlyPricing} />
              <span>Priced models only</span>
            </label>

            <select class="filter-select" bind:value={selectedCapability}>
              <option value="none">All capabilities</option>
              <option value="fast">Fast</option>
              <option value="reasoning">Reasoning</option>
              <option value="coding">Coding</option>
              <option value="vision">Vision</option>
            </select>

            <select class="filter-select" bind:value={sortBy}>
              <option value="none">No sorting</option>
              <option value="price-low-to-high">Price: Low to High</option>
              <option value="price-high-to-low">Price: High to Low</option>
              <option value="name-a-z">Name: A-Z</option>
              <option value="name-z-a">Name: Z-A</option>
              <option value="provider-a-z">Provider: A-Z</option>
              <option value="provider-z-a">Provider: Z-A</option>
            </select>
          </div>
        </div>

        <!-- Model List -->
        <div class="model-list">
          {#each filteredModels as model (model.id)}
            <div
              class="model-grid"
              class:selected={aiStore.selectedModel?.id === model.id}
              onclick={() => selectModel(model.id)}
            >
              <!-- Left: Model Name -->
              <div class="grid-item-left">
                <div class="item-left">
                  <span class="item-provider">{formatProviderName(model.provider)}</span>
                  <span class="item-name">
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

              <!-- Center: Capability Icons -->
              <div class="grid-item capabilities">
                <div class="capability-icon fast" class:active={model.capabilities.fast} title="Fast processing">
                  {#if model.capabilities.fast}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
                    </svg>
                  {/if}
                </div>
                <div class="capability-icon reasoning" class:active={model.capabilities.reasoning} title="Advanced reasoning">
                  {#if model.capabilities.reasoning}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  {/if}
                </div>
                <div class="capability-icon coding" class:active={model.capabilities.coding} title="Code generation">
                  {#if model.capabilities.coding}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="16,18 22,12 16,6"></polyline>
                      <polyline points="8,6 2,12 8,18"></polyline>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                      <polyline points="16,18 22,12 16,6"></polyline>
                      <polyline points="8,6 2,12 8,18"></polyline>
                    </svg>
                  {/if}
                </div>
                <div class="capability-icon vision" class:active={model.capabilities.vision} title="Image understanding">
                  {#if model.capabilities.vision}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  {/if}
                </div>
              </div>

              <!-- Right: Context Length & Price -->
              <div class="grid-item right-section">
                <span class="item-context">{formatContextLength(model.context_length)}</span>
                <span class="item-price">${model.cost_per_1k_token.toFixed(5)}/1K</span>
              </div>
            </div>
          {/each}
          {#if filteredModels.length === 0}
            <div class="no-models">No models found</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .model-selector-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .model-selector-popup {
    background: var(--bg-primary, #1a1a1a);
    border: 1px solid var(--border-color, #2d2d2d);
    border-radius: 12px;
    width: 1200px;
    height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideIn 0.2s ease-out;
  }

  .model-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color, #2d2d2d);
  }

  .model-selector-title {
    margin: 0;
    color: var(--text-primary, #fff);
    font-size: 20px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--hover-bg, #3d3d3d);
    color: var(--text-primary, #fff);
  }

  .model-selector-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    overflow: hidden;
    padding: 20px 24px;
  }

  /* Search and Filters Section */
  .search-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
  }

  .search-input svg {
    color: var(--text-secondary, #888);
    flex-shrink: 0;
  }

  .search-input input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary, #fff);
    font-size: 16px;
    outline: none;
  }

  .search-input input::placeholder {
    color: var(--text-secondary, #888);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .filter-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    transition: color 0.2s;
  }

  .filter-checkbox:hover {
    color: var(--text-primary, #fff);
  }

  .filter-checkbox input {
    margin: 0;
    accent-color: var(--primary-color, #6366f1);
    cursor: pointer;
  }

  .filter-select {
    padding: 6px 12px;
    background: var(--input-bg, #2a2a2a);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-select:hover {
    border-color: var(--primary-color, #6366f1);
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }

  /* Model List */
  .model-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    flex: 1;
    padding-right: 8px;
  }

  .model-list::-webkit-scrollbar {
    width: 6px;
  }

  .model-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .model-list::-webkit-scrollbar-thumb {
    background: var(--border-color, #3d3d3d);
    border-radius: 3px;
  }

  /* Grid based model display */
  .model-grid {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    align-items: center;
    padding: 12px 16px;
    background: #141414;
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .model-grid:hover {
    background: #141414;
    border-color: var(--primary-color, #6366f1);
  }

  .model-grid.selected {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--primary-color, #6366f1);
  }

  /* Left grid item */
  .grid-item-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0;
  }

  .item-provider {
    font-size: 12px;
    color: var(--text-secondary, #888);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .item-name {
    color: var(--text-primary, #fff);
    font-size: 16px;
    font-weight: 500;
  }

  .item-context {
    font-size: 14px;
    color: var(--text-primary, #fff);
  }

  /* Capability Icons */
  .capabilities {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }

  .right-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .capability-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-secondary, #888);
  }

  .capability-icon.active {
    color: currentColor;
  }

  .capability-icon.fast {
    color: #888;
  }

  .capability-icon.fast.active {
    color: #22c55e;
  }

  .capability-icon.reasoning {
    color: #888;
  }

  .capability-icon.reasoning.active {
    color: #6366f1;
  }

  .capability-icon.coding {
    color: #888;
  }

  .capability-icon.coding.active {
    color: #a855f7;
  }

  .capability-icon.vision {
    color: #888;
  }

  .capability-icon.vision.active {
    color: #ec4899;
  }

  .grid-item {
    text-align: right;
    font-size: 12px;
    color: var(--text-secondary, #888);
  }

  .item-price {
    font-size: 14px;
    color: var(--text-primary, #fff);
  }

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
 .model-grid:hover .inline-favorite-btn {
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


  .no-models {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-secondary, #888);
    font-size: 18px;
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

</style>
