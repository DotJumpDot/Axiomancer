<script lang="ts">
  import { userService } from "@/Service";
  import { authStore } from "@/Store";
  
  let isOpen = $state(false);
  let apiKey = $state("");
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  export function open() {
    isOpen = true;
    apiKey = authStore.currentUser?.openrouter_api_key || "";
  }

  function close() {
    isOpen = false;
    error = null;
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      close();
    }
  }

  async function saveApiKey() {
    if (!authStore.currentUser) return;
    
    isLoading = true;
    error = null;

    try {
      const response = await userService.updateUser(authStore.currentUser.id, {
        openrouter_api_key: apiKey || null
      });

      if (response.success) {
        // Update current user in store
        await authStore.refreshProfile();
        close();
      } else {
        error = response.error || "Failed to save API key";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to save API key";
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="api-key-overlay"
    onmousedown={handleMouseDown}
    role="dialog"
    aria-modal="true"
  >
    <div class="api-key-dialog">
      <h2>OpenRouter API Key</h2>
      <p class="description">
        Enter your personal OpenRouter API key to use AI models. 
        Get your key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a>
      </p>

      <input
        type="password"
        bind:value={apiKey}
        placeholder="sk-or-v1-..."
        class="api-key-input"
      />

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <div class="dialog-actions">
        <button onclick={close} class="btn-secondary">Cancel</button>
        <button 
          onclick={saveApiKey} 
          class="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .api-key-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .api-key-dialog {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  h2 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
  }

  .description {
    color: var(--text-secondary);
    margin-bottom: 16px;
    font-size: 14px;
  }

  .description a {
    color: var(--accent-primary);
    text-decoration: none;
  }

  .description a:hover {
    text-decoration: underline;
  }

  .api-key-input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: monospace;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .error-message {
    color: var(--error-color);
    font-size: 14px;
    margin-bottom: 16px;
  }

  .dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn-secondary,
  .btn-primary {
    padding: 10px 20px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: var(--bg-hover);
  }

  .btn-primary {
    background: var(--accent-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary:hover,
  .btn-primary:hover {
    transform: scale(1.05);
  }

  .btn-secondary:active,
  .btn-primary:active {
    transform: scale(0.95);
  }
</style>
