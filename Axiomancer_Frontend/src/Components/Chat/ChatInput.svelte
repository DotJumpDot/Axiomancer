<script lang="ts">
  import { chatStore, aiStore, settingsStore } from "../../Store";

  let textareaRef: HTMLTextAreaElement | undefined = $state();
  let inputValue = $state("");
  let isComposing = $state(false);

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
    const content = inputValue.trim();
    if (!content || chatStore.isSending) return;

    const modelKey = aiStore.selectedModel?.model_key;
    if (!modelKey && !aiStore.autoRoutingEnabled) {
      alert("Please select a model or enable auto-routing");
      return;
    }

    inputValue = "";
    if (textareaRef) {
      textareaRef.style.height = "auto";
    }

    await chatStore.sendMessage(content, modelKey || "auto", {
      autoRouting: aiStore.autoRoutingEnabled,
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
      placeholder="Send a message..."
      rows="1"
      disabled={chatStore.isSending}
    ></textarea>

    <div class="input-actions">
      <label class="action-btn upload-btn" title="Upload image">
        <input
          type="file"
          accept="image/*"
          onchange={handleFileSelect}
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
        onclick={handleSend}
        disabled={!inputValue.trim() || chatStore.isSending}
        title="Send message"
      >
        {#if chatStore.isSending}
          <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
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
        <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
      {:else}
        <kbd>Ctrl+Enter</kbd> to send
      {/if}
    </span>
    {#if chatStore.webSearchEnabled}
      <span class="hint active">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
        Web search enabled
      </span>
    {/if}
  </div>
</div>

<style>
  .chat-input-container {
    padding: 16px;
    background: var(--input-container-bg, #1a1a1a);
    border-top: 1px solid var(--border-color, #2d2d2d);
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
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

  .upload-btn {
    cursor: pointer;
  }

  .spinner {
    animation: spin 1s linear infinite;
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
    gap: 16px;
    margin-top: 8px;
    padding: 0 4px;
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-secondary, #666);
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
</style>
