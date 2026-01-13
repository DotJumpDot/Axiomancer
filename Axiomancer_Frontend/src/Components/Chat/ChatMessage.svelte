<script lang="ts">
  import type { Chat } from "@/Types";
  import { processMarkdown, formatRole, formatLatency, formatTokens, copyToClipboard } from "@/Function";
  import { settingsStore } from "@/Store";
  import CodeBlock from "./MessageMarkdown/CodeBlock.svelte";

  let { message }: { message: Chat } = $props();

  let copied = $state(false);

  // Check if message has an error
  const hasError = $derived(message.respond_error === true);

  // Get the appropriate content based on message type
  const displayContent = $derived(
    message.role === "user"
      ? message.content
      : (message.ai_content || message.content || "")
  );

  // Simplified content for error messages
  const displayContentForError = $derived(
    hasError && message.role !== "user"
      ? "Failed to send AI response"
      : displayContent
  );

  async function handleCopy() {
    await copyToClipboard(displayContentForError);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  const isUser = $derived(message.role === "user");
  const markdownData = $derived(processMarkdown(displayContentForError));

  // Show reminder for AI messages with code blocks
  const hasCodeInContent = $derived(markdownData.codeBlocks.length > 0);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="message" class:user={isUser} class:assistant={!isUser} class:error={hasError}>
  <div class="message-header">
    <span class="role">{formatRole(message.role)}</span>
    {#if !isUser && (message.ai_model_key || message.model_id)}
      <span class="model-badge">{message.ai_model_key || message.model_id}</span>
    {/if}
    <div class="message-actions">
      <button class="action-btn" onclick={handleCopy} title="Copy message">
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
    {#each markdownData.parts as part}
      {#if part.type === 'html'}
        {@html part.content}
      {:else if part.type === 'code'}
        {#each markdownData.codeBlocks.filter(cb => cb.id === part.id) as codeBlock}
          <CodeBlock code={codeBlock.code} language={codeBlock.language} />
        {/each}
      {/if}
    {/each}
  </div>

  {#if !isUser && hasError}
    <div class="message-reminder error">
      <span class="reminder-text" title={displayContent.replace(/^Error:\s*/, '')}>
        ⚠️ {displayContent.replace(/^Error:\s*/, '')}
      </span>
    </div>
  {:else if !isUser && hasCodeInContent}
    <div class="message-reminder">
      <span class="reminder-text">💡 Code blocks include a copy button in the top-right corner</span>
    </div>
  {/if}

  {#if !isUser && (message.used_web_search || message.used_image_search)}
    <div class="message-meta">
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
    display: flex;
    flex-direction: column;
    max-width: 70%;
  }

  .message.user {
    background: var(--user-message-bg, #2d2d2d);
    align-self: flex-end;
    margin-left: auto;
  }

  .message.assistant {
    background: var(--assistant-message-bg, #1a1a1a);
    border: 1px solid var(--border-color, #2d2d2d);
    align-self: flex-start;
    margin-right: auto;
  }

  .message.assistant.error {
    border: 1px solid #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .role {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .model-badge {
    font-size: 13px;
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

  .message-content :global(.code-block-wrapper) {
    border-radius: 8px;
    margin: 12px 0;
    overflow: hidden;
    border: 1px solid var(--border-color, #2d2d2d);
  }

  .message-content :global(.code-block-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid var(--border-color, #2d2d2d);
  }

  .message-content :global(.code-language) {
    font-size: 11px;
    color: var(--text-secondary, #888);
    text-transform: uppercase;
    font-weight: 600;
    font-family: "Fira Code", "Consolas", monospace;
  }

  .message-content :global(pre.code-block) {
    padding: 12px 16px;
    margin: 0;
    overflow-x: auto;
    font-family: "Fira Code", "Consolas", monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  .message-content :global(pre.code-block code) {
    color: var(--text-primary, #fff);
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

  .message-reminder {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    padding: 6px 12px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 6px;
    border-left: 2px solid var(--primary-color, #6366f1);
  }

  .message-reminder.error {
    background: rgba(239, 68, 68, 0.1);
    border-left: 2px solid #ef4444;
    justify-content: flex-start;
  }

  .reminder-text {
    font-size: 11px;
    color: var(--primary-color, #6366f1);
    font-weight: 500;
  }

  .message-reminder.error .reminder-text {
    color: #ef4444;
    font-weight: 600;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
