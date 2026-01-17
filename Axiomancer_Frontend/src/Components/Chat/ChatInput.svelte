<script lang="ts">
  import { chatStore, aiStore, settingsStore, selectionStore } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  // Reactive translations
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  let textareaRef: HTMLTextAreaElement | undefined = $state();
  let inputValue = $state("");
  let isComposing = $state(false);
  let showMemoryTooltip = $state(false);
  let memoryTooltipRef: HTMLDivElement | undefined = $state();
  let showReasoningTooltip = $state(false);
  let reasoningTooltipRef: HTMLDivElement | undefined = $state();

  // Get selected model for capabilities display (single mode only)
  let selectedModelForCap = $derived.by(() => {
    if (aiStore.autoRoutingEnabled) return null;
    return aiStore.enabledModels.find(m => m.model_key === chatStore.currentModelKey) || null;
  });

  // Check if current model has reasoning capability
  let hasReasoningCapability = $derived.by(() => {
    return selectedModelForCap?.capabilities.reasoning || false;
  });

  // Check if input should be disabled
  let isInputDisabled = $derived.by(() => {
    if (chatStore.isSending) return true;
    if (aiStore.autoRoutingEnabled) {
      // In auto mode, require preset name and selected model
      return !selectionStore.currentPresetName || !aiStore.selectedModel;
    }
    return false;
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    inputValue = target.value;
    autoResize();
  }

  function autoResize() {
    if (textareaRef) {
      textareaRef.style.height = "auto";
      textareaRef.style.height = Math.min(textareaRef.scrollHeight, 200) + "px";
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && settingsStore.sendOnEnter && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSend() {
    // If currently sending, stop the stream
    if (chatStore.isSending) {
      chatStore.stopStreaming();
      return;
    }

    const content = inputValue.trim();
    if (!content) return;

    // Check if in single mode and model/prompt are selected
    const isAutoRouting = aiStore.autoRoutingEnabled;
    const t = getTranslations(settingsStore.language as LanguageCode);
    
    if (!isAutoRouting) {
      // Single mode - must have both model and prompt
      if (!chatStore.currentModelKey) {
        alert(t.input.selectModelAlert);
        return;
      }
      if (!chatStore.currentPromptProfileId) {
        alert(t.input.selectPromptAlert);
        return;
      }
    } else {
      // Auto mode - must have model selection
      if (!aiStore.selectedModel) {
        alert(t.input.selectModelOrAutoAlert);
        return;
      }
    }

    inputValue = "";
    if (textareaRef) {
      textareaRef.style.height = "auto";
    }

    // Get model key based on mode:
    // - Single mode: use chatStore.currentModelKey
    // - Auto mode: use aiStore.selectedModel (the currently selected model)
    const modelKey = !isAutoRouting 
      ? chatStore.currentModelKey 
      : aiStore.selectedModel?.model_key || null;
    
    // Get prompt ID based on mode
    const promptId = !isAutoRouting 
      ? chatStore.currentPromptProfileId 
      : selectionStore.currentPromptId;
    
    await chatStore.sendMessage(content, modelKey || "auto", {
      autoRouting: isAutoRouting,
      promptProfileId: promptId || undefined,
      webSearch: chatStore.webSearchEnabled,
      imageSearch: chatStore.imageSearchEnabled,
      steamSearch: chatStore.steamSearchEnabled,
      memoryCount: chatStore.memoryCount,
      reasoningEffort: hasReasoningCapability && chatStore.reasoningEffort !== "disabled" ? chatStore.reasoningEffort : undefined,
    });
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      // Handle file upload (for image input)
      console.log("Files selected:", files);
      // TODO: Implement image upload
    }
  }

  function toggleMemoryTooltip() {
    showMemoryTooltip = !showMemoryTooltip;
    if (showMemoryTooltip) showReasoningTooltip = false; // Close reasoning when opening memory
  }

  function toggleReasoningTooltip() {
    showReasoningTooltip = !showReasoningTooltip;
    if (showReasoningTooltip) showMemoryTooltip = false; // Close memory when opening reasoning
  }

  let isMouseDownInside = $state(false);

  function handleMouseDown(e: MouseEvent) {
    if (memoryTooltipRef && memoryTooltipRef.contains(e.target as Node)) {
      isMouseDownInside = true;
    } else {
      isMouseDownInside = false;
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (!isMouseDownInside && memoryTooltipRef && !memoryTooltipRef.contains(e.target as Node)) {
      showMemoryTooltip = false;
    }
  }

  $effect(() => {
    if (showMemoryTooltip) {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  let isReasoningMouseDownInside = $state(false);

  function handleReasoningMouseDown(e: MouseEvent) {
    if (reasoningTooltipRef && reasoningTooltipRef.contains(e.target as Node)) {
      isReasoningMouseDownInside = true;
    } else {
      isReasoningMouseDownInside = false;
    }
  }

  function handleReasoningMouseUp(e: MouseEvent) {
    if (!isReasoningMouseDownInside && reasoningTooltipRef && !reasoningTooltipRef.contains(e.target as Node)) {
      showReasoningTooltip = false;
    }
  }

  $effect(() => {
    if (showReasoningTooltip) {
      document.addEventListener('mousedown', handleReasoningMouseDown);
      document.addEventListener('mouseup', handleReasoningMouseUp);
      return () => {
        document.removeEventListener('mousedown', handleReasoningMouseDown);
        document.removeEventListener('mouseup', handleReasoningMouseUp);
      };
    }
  });

</script>

<div class="chat-input-container">
  <div class="input-wrapper">
    <textarea
      bind:this={textareaRef}
      value={inputValue}
      oninput={handleInput}
      onkeydown={handleKeydown}
      oncompositionstart={() => (isComposing = true)}
      oncompositionend={() => (isComposing = false)}
      placeholder={isInputDisabled && aiStore.autoRoutingEnabled ? (t.input.selectPresetAndModelFirst || "Select preset and decision model first") : t.input.placeholder}
      rows="1"
      disabled={isInputDisabled}
    ></textarea>

    <div class="input-actions">
      <label class="action-btn upload-btn" title={t.input.uploadImage}>
        <input
          type="file"
          accept="image/*"
          onchange={handleFileSelect}
          disabled={!selectedModelForCap?.capabilities.vision}
          hidden
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </label>

      <button
        class="action-btn send-btn"
        class:cancel-btn={chatStore.isSending}
        onclick={handleSend}
        disabled={!chatStore.isSending && !inputValue.trim()}
        title={chatStore.isSending ? t.input.stopGeneration || "Stop generation" : t.input.sendMessage}
      >
        {#if chatStore.isSending}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <div class="input-hints">
    <span class="hint">
      {#if settingsStore.sendOnEnter}
        <kbd>Enter</kbd> {t.input.enterToSend} <kbd>Shift+Enter</kbd> {t.input.shiftEnterNewLine}
      {:else}
        <kbd>Ctrl+Enter</kbd> {t.input.ctrlEnterToSend}
      {/if}
    </span>

    

    <label class="toggle-switch" title="Web Search" style="display: inline-flex; align-items: center; gap: 12px; width: auto;">
      <input 
        type="checkbox" 
        checked={chatStore.webSearchEnabled}
        onchange={(e) => chatStore.webSearchEnabled = (e.target as HTMLInputElement).checked}
      />
      <span class="slider" style="flex-shrink: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </span>
      <span class="hint" class:active={chatStore.webSearchEnabled} style="white-space: nowrap;">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
        {t.input.webSearchEnabled}
      </span>
    </label>

    <label class="toggle-switch" title="Image Search" style="display: inline-flex; align-items: center; gap: 12px; width: auto; margin-left: 0 px;">
      <input 
        type="checkbox" 
        checked={chatStore.imageSearchEnabled}
        onchange={(e) => chatStore.imageSearchEnabled = (e.target as HTMLInputElement).checked}
      />
      <span class="slider" style="flex-shrink: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </span>
      <span class="hint" class:active={chatStore.imageSearchEnabled} style="white-space: nowrap;">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        {t.input.imageSearchEnabled}
      </span>
    </label>
    
    <div class="memory-selector-wrapper" bind:this={memoryTooltipRef}>
      <button 
        class="memory-button"
        onclick={(e) => { e.stopPropagation(); toggleMemoryTooltip(); }}
        title={t.input.chatMemory || "Chat Memory"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <span>{chatStore.memoryCount}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      {#if showMemoryTooltip}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="memory-tooltip" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 200, easing: cubicOut }}>
          <div class="tooltip-header">
            <span class="tooltip-title">{t.input.chatMemory || "Chat memory"}</span>
            <input 
              type="number" 
              min="1" 
              max="1000" 
              value={chatStore.memoryCount}
              oninput={(e) => chatStore.memoryCount = parseInt((e.target as HTMLInputElement).value) || 1}
              class="memory-value-input"
            />
          </div>
          <input 
            type="range" 
            min="1" 
            max="1000" 
            value={chatStore.memoryCount}
            oninput={(e) => chatStore.memoryCount = parseInt((e.target as HTMLInputElement).value)}
            class="memory-slider"
          />
          <p class="tooltip-description">
            {#if settingsStore.language === "th"}
              ส่งข้อความ {chatStore.memoryCount} ข้อความล่าสุดจากการสนทนาของคุณในแต่ละคำขอ
            {:else}
              Sends the last {chatStore.memoryCount} messages from your conversation each request.
            {/if}
          </p>
        </div>
      {/if}
    </div>

    {#if selectedModelForCap}
      <div class="reasoning-selector-wrapper" bind:this={reasoningTooltipRef} style="margin-left: auto;">
        <button 
          class="reasoning-button"
          onclick={(e) => { e.stopPropagation(); toggleReasoningTooltip(); }}
          title={t.input.reasoningEffort || "Reasoning Effort"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
          <span>{chatStore.reasoningEffort === "disabled" ? t.input.reasoningDisabled : chatStore.reasoningEffort}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <!-- svelte-ignore a11y_no_static_element_interactions -->
        {#if showReasoningTooltip}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div class="reasoning-tooltip" onclick={(e) => e.stopPropagation()} transition:slide={{ duration: 200, easing: cubicOut }}>
            <div class="tooltip-header">
              <span class="tooltip-title">{t.input.reasoningEffort || "Reasoning Effort"}</span>
            </div>
            <div class="reasoning-options">
              {#if !hasReasoningCapability}
                <button 
                  class="reasoning-option disabled" 
                  class:active={chatStore.reasoningEffort === "disabled"}
                  onclick={() => { chatStore.reasoningEffort = "disabled"; showReasoningTooltip = false; }}
                >
                  <span class="option-label">{t.input.reasoningDisabled}</span>
                  <span class="option-description">Model does not support reasoning</span>
                </button>
              {:else}
                <button 
                  class="reasoning-option" 
                  class:active={chatStore.reasoningEffort === "minimal"}
                  onclick={() => { chatStore.reasoningEffort = "minimal"; showReasoningTooltip = false; }}
                >
                  <span class="option-label">{t.input.reasoningMinimal}</span>
                  <span class="option-description">Basic reasoning with minimal effort</span>
                </button>
                <button 
                  class="reasoning-option" 
                  class:active={chatStore.reasoningEffort === "low"}
                  onclick={() => { chatStore.reasoningEffort = "low"; showReasoningTooltip = false; }}
                >
                  <span class="option-label">{t.input.reasoningLow}</span>
                  <span class="option-description">Light reasoning for simple problems</span>
                </button>
                <button 
                  class="reasoning-option" 
                  class:active={chatStore.reasoningEffort === "medium"}
                  onclick={() => { chatStore.reasoningEffort = "medium"; showReasoningTooltip = false; }}
                >
                  <span class="option-label">{t.input.reasoningMedium}</span>
                  <span class="option-description">Balanced reasoning for moderate complexity</span>
                </button>
                <button 
                  class="reasoning-option" 
                  class:active={chatStore.reasoningEffort === "high"}
                  onclick={() => { chatStore.reasoningEffort = "high"; showReasoningTooltip = false; }}
                >
                  <span class="option-label">{t.input.reasoningHigh}</span>
                  <span class="option-description">Deep reasoning for complex problems</span>
                </button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if selectedModelForCap}
      <div class="capabilities">
        <div class="capability-icon fast" class:active={selectedModelForCap.capabilities.fast} title="Fast processing">
          {#if selectedModelForCap.capabilities.fast}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
            </svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
            </svg>
          {/if}
        </div>
        <div class="capability-icon reasoning" class:active={selectedModelForCap.capabilities.reasoning} title="Advanced reasoning">
          {#if selectedModelForCap.capabilities.reasoning}
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
        <div class="capability-icon coding" class:active={selectedModelForCap.capabilities.coding} title="Code generation">
          {#if selectedModelForCap.capabilities.coding}
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
        <div class="capability-icon vision" class:active={selectedModelForCap.capabilities.vision} title="Image understanding">
          {#if selectedModelForCap.capabilities.vision}
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
    {/if}

    
  </div>
</div>

<style>
  :root {
    --slider-bg-light: rgba(0, 0, 0, 0.15);
    --slider-bg-dark: rgba(255, 255, 255, 0.3);
  }

  .chat-input-container {
    padding: 16px;
    background: var(--input-container-bg, #1a1a1a);
    border-top: 1px solid var(--border-color, #2d2d2d);
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 12px;
    padding: 12px 16px;
    transition: border-color 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: var(--primary-color, #6366f1);
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-primary, #fff);
    font-family: inherit;
    max-height: 200px;
  }

  textarea::placeholder {
    color: var(--text-secondary, #888);
  }

  textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .input-actions {
    display: flex;
    gap: 4px;
  }

  .action-btn {
    padding: 8px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--hover-bg, #3d3d3d);
    color: var(--text-primary, #fff);
  }

  .send-btn {
    background: var(--primary-color, #6366f1);
    color: white;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--primary-hover, #5558e6);
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
.cancel-btn {
    background: #ef4444 !important;
    color: white !important;
  }

  .cancel-btn:hover:not(:disabled) {
    background: #dc2626 !important;
  }

  
  .upload-btn {
    cursor: pointer;
  }

  .toggle-switch {
    position: relative;
    width: 60px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px; /* Reduced gap between switch and text */
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: relative;
    width: 60px;
    height: 23px; /* Reduced height */
    background-color: var(--border-color, #ccc);
    transition: .4s;
    border-radius: 23px; /* Match reduced height */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    user-select: none;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 19px; /* Reduced circle height */
    width: 19px; /* Reduced circle width */
    left: 2px; /* Adjusted for reduced size */
    bottom: 2px; /* Adjusted for reduced size */
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  .toggle-switch input:checked + .slider {
    background-color: var(--hint-color, #6366f1);
  }

  .toggle-switch input:checked + .slider:before {
    transform: translateX(37px); /* Adjusted for reduced size */
  }

  .hint {
    margin-left: 0; /* Removed extra margin */
    color: var(--text-secondary, #666); /* Default color */
  }

  .hint.active {
    color: var(--hint-color, #4dc8f8); /* Light blue when active */
  }

  .toggle-switch input:checked + .slider + .hint {
    color: var(--hint-color, #4dc8f8); /* Ensure hint changes to light blue when switch is enabled */
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .input-hints {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    padding: 0 4px;
    align-items: center;
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-secondary, #666);
    user-select: none;
  }

  .hint.active {
    color: var(--primary-color, #6366f1);
  }

  kbd {
    padding: 2px 6px;
    background: var(--kbd-bg, #3d3d3d);
    border-radius: 4px;
    font-family: inherit;
    font-size: 10px;
  }

  .slider svg {
    stroke: grey; /* Default stroke color */
  }

  .toggle-switch input:checked + .slider svg {
    stroke: rgb(99, 99, 99); /* Stroke color when active */
  }

  .memory-selector-wrapper {
    position: relative;
    display: inline-flex;
  }

  .memory-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }

  .memory-button:hover {
    background: var(--hover-bg, #3d3d3d);
    border-color: var(--primary-color, #6366f1);
  }

  .memory-button svg {
    color: var(--text-secondary, #888);
    flex-shrink: 0;
  }

  .memory-button span {
    font-weight: 500;
    min-width: 20px;
    text-align: center;
  }

  .memory-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    min-width: 280px;
    padding: 16px;
    background: var(--bg-secondary, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 1000;
  }

  .tooltip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .tooltip-title {
    font-size: 13px;
    font-weight: 600;
    color: currentColor;
    opacity: 0.9;
  }

  .memory-value-input {
    font-size: 16px;
    font-weight: 700;
    color: var(--primary-color, #6366f1);
    background: transparent;
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 6px;
    padding: 4px 8px;
    width: 60px;
    text-align: center;
    outline: none;
    transition: all 0.2s;
    appearance: textfield;
    -webkit-appearance: textfield;
    -moz-appearance: textfield;
  }

  .memory-value-input:hover {
    border-color: var(--primary-color, #6366f1);
  }

  .memory-value-input:focus {
    border-color: var(--primary-color, #6366f1);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .memory-value-input::-webkit-outer-spin-button,
  .memory-value-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .memory-value-input::-moz-number-spin-box {
    -moz-appearance: none;
  }

  .memory-slider {
    width: 100%;
    height: 6px;
    background: var(--slider-bg-dark); /* Default to dark mode */
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    margin-bottom: 12px;
    cursor: pointer;
    position: relative;
  }

  :global([data-theme="light"] .memory-slider) {
    background: var(--slider-bg-light); /* Use light mode background */
  }

  .memory-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: inherit; /* Inherit from parent */
    border-radius: 3px;
  }

  .memory-slider::-moz-range-track {
    width: 100%;
    height: 6px;
    background: inherit; /* Inherit from parent */
    border-radius: 3px;
  }

  .memory-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: var(--primary-color, #6366f1);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    top: -5px; /* Adjusted to center the circle */
  }

  .memory-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .memory-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--primary-color, #6366f1);
    border-radius: 50%;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    top: -5px; /* Adjusted to center the circle */
  }

  .memory-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
  }

  .tooltip-description {
    font-size: 11px;
    line-height: 1.4;
    color: var(--text-secondary, #888);
    margin: 0;
  }

  .reasoning-selector-wrapper {
    position: relative;
    display: inline-flex;
  }

  .reasoning-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    text-transform: capitalize;
  }

  .reasoning-button:hover {
    background: var(--hover-bg, #3d3d3d);
    border-color: var(--primary-color, #6366f1);
  }

  .reasoning-button svg {
    color: var(--text-secondary, #888);
    flex-shrink: 0;
  }

  .reasoning-button span {
    font-weight: 500;
    min-width: 50px;
    text-align: center;
  }

  .reasoning-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    min-width: 320px;
    padding: 12px;
    background: var(--bg-secondary, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 1000;
  }

  .reasoning-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }

  .reasoning-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 12px;
    background: var(--input-bg, #1a1a1a);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 8px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .reasoning-option:hover {
    background: var(--hover-bg, #3d3d3d);
    border-color: var(--primary-color, #6366f1);
  }

  .reasoning-option.active {
    background: var(--primary-color, #6366f1);
    border-color: var(--primary-color, #6366f1);
  }

  .reasoning-option.disabled {
    opacity: 0.7;
    cursor: default;
  }

  .reasoning-option.disabled:hover {
    background: var(--input-bg, #1a1a1a);
    border-color: var(--border-color, #3d3d3d);
  }

  .reasoning-option.disabled.active {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
  }

  .option-label {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
    text-transform: capitalize;
  }

  .option-description {
    font-size: 11px;
    color: var(--text-secondary, #aaa);
    line-height: 1.3;
  }

  .reasoning-option.active .option-description {
    color: rgba(255, 255, 255, 0.9);
  }

  .capabilities {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }

  .capability-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    cursor: default;
    transition: all 0.2s;
    color: var(--text-secondary, #888);
  }

  .capability-icon.active {
    color: currentColor;
  }

  .capability-icon.fast.active {
    color: #22c55e;
  }

  .capability-icon.reasoning.active {
    color: #6366f1;
  }

  .capability-icon.coding.active {
    color: #a855f7;
  }

  .capability-icon.vision.active {
    color: #ec4899;
  }

  .upload-btn:has(input:disabled) {
    pointer-events: none;
  }

  .upload-btn:has(input:disabled) svg {
    color: #f06666;
  }
</style>