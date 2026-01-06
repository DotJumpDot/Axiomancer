<script lang="ts">
  import type { Chat } from "@/Types";
  import { markdownToHtml, formatRole, formatLatency, formatTokens, copyToClipboard } from "@/Function";
  import { settingsStore } from "@/Store";

  let { message }: { message: Chat } = $props();

  let copied = $state(false);

  async function handleCopy() {
    await copyToClipboard(message.content);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  const isUser = $derived(message.role === "user");
  const htmlContent = $derived(markdownToHtml(message.content));
</script>

<div class="message" class:user={isUser} class:assistant={!isUser}>
  <div class="message-header">
    <span class="role">{formatRole(message.role)}</span>
    {#if message.model_id && !isUser}
      <span class="model-badge">{message.model_id}</span>
    {/if}
    <div class="message-actions">
      <button class="action-btn" onclick={handleCopy} title="Copy">
        {#if copied}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <div class="message-content">
    {@html htmlContent}
  </div>

  {#if !isUser && (settingsStore.showTokenUsage || settingsStore.showLatency)}
    <div class="message-meta">
      {#if settingsStore.showTokenUsage && message.token_usage}
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          {formatTokens(message.token_usage.total_tokens || 0)} tokens
        </span>
      {/if}
      {#if settingsStore.showLatency && message.latency_ms}
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {formatLatency(message.latency_ms)}
        </span>
      {/if}
      {#if message.used_web_search}
        <span class="meta-item search">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
          Web
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .message {
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .message.user {
    background: var(--user-message-bg, #2d2d2d);
    margin-left: 48px;
  }

  .message.assistant {
    background: var(--assistant-message-bg, #1a1a1a);
    border: 1px solid var(--border-color, #2d2d2d);
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .role {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .model-badge {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--badge-bg, #3d3d3d);
    border-radius: 4px;
    color: var(--text-secondary, #888);
  }

  .message-actions {
    margin-left: auto;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .message:hover .message-actions {
    opacity: 1;
  }

  .action-btn {
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: var(--hover-bg, #3d3d3d);
    color: var(--text-primary, #fff);
  }

  .message-content {
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-primary, #fff);
  }

  .message-content :global(p) {
    margin: 0 0 12px;
  }

  .message-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .message-content :global(pre.code-block) {
    background: var(--code-bg, #0d0d0d);
    padding: 12px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .message-content :global(code.inline-code) {
    background: var(--code-bg, #0d0d0d);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "Fira Code", "Consolas", monospace;
    font-size: 13px;
  }

  .message-content :global(a) {
    color: var(--primary-color, #6366f1);
    text-decoration: none;
  }

  .message-content :global(a:hover) {
    text-decoration: underline;
  }

  .message-content :global(ul),
  .message-content :global(ol) {
    margin: 12px 0;
    padding-left: 24px;
  }

  .message-content :global(li) {
    margin-bottom: 4px;
  }

  .message-content :global(blockquote) {
    border-left: 3px solid var(--primary-color, #6366f1);
    padding-left: 16px;
    margin: 12px 0;
    color: var(--text-secondary, #888);
  }

  .message-meta {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color, #2d2d2d);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-secondary, #666);
  }

  .meta-item.search {
    color: var(--primary-color, #6366f1);
  }
</style>
