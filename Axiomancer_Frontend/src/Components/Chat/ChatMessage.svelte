<script lang="ts">
  import type { Chat } from "@/Types";
  import { processMarkdown, formatLatency, formatTokens, copyToClipboard, getTranslations, type LanguageCode, type MarkdownResult, formatMessageTime } from "@/Function";
  import { settingsStore } from "@/Store";
  import CodeBlock from "./MessageMarkdown/CodeBlock.svelte";
  import MathBlock from "./MessageMarkdown/MathBlock.svelte";

  let { message }: { message: Chat } = $props();

  // Reactive translations
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  let copied = $state(false);
  let showReasoning = $state(false);

  // Check if message is streaming (has temporary ID starting with "streaming-")
  const isStreaming = $derived(message.id.startsWith("streaming-"));

  // Check if message has an error
  const hasError = $derived(message.respond_error === true);

  // Check if this message is currently streaming reasoning content
  const isStreamingReasoning = $derived(
    isStreaming &&
    !!message.search_log?.reasoning_content && // Has reasoning content
    (!message.content || message.content.length === 0) // But no answer content yet
  );

  // Check if this message is currently streaming answer content (after reasoning is complete)
  const isStreamingAnswer = $derived(
    isStreaming &&
    !!message.search_log?.reasoning_content &&
    !!message.content && message.content.length > 0 // Has answer content now
  );

  // * Custom role formatter using settings store
  function getDisplayRole(role: string): string {
    if (role === "user") return settingsStore.userDisplayName;
    if (role === "assistant") return settingsStore.aiDisplayName;
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  // * Get display role color based on settings
  function getDisplayRoleColor(role: string): string {
    if (role === "user") return settingsStore.userDisplayNameColor;
    if (role === "assistant") return settingsStore.aiDisplayNameColor;
    return "var(--text-secondary)";
  }

  // Auto-open reasoning during streaming (or if only reasoning exists), auto-close when answer starts
  $effect(() => {
    // If we have reasoning content but no answer content yet, keep it open
    // This works even if isStreaming is flaky initially, or for interrupted states
    if (message.search_log?.reasoning_content && (!message.content || message.content.length === 0)) {
      showReasoning = true;
    } 
    // If we are definitely streaming and have moved to answer phase, close it
    else if (isStreamingAnswer) {
      showReasoning = false;
    }
  });

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
  const markdownData: MarkdownResult = $derived.by(() => {
    // During reasoning phase, don't process markdown (reasoning goes to reasoning box only)
    if (isStreamingReasoning) {
      return { parts: [], codeBlocks: [], mathBlocks: [] };
    }
    return processMarkdown(displayContentForError);
  });

  // Process reasoning content with streaming cursor
  const processedReasoningContent = $derived.by(() => {
    // If streaming reasoning, use the reasoning_content from search_log
    if (isStreamingReasoning) {
      const reasoning = message.search_log?.reasoning_content || "";
      return reasoning + '<span class="streaming-cursor-blink"> ▋</span>';
    }
    
    // If streaming answer, show the completed reasoning content from search_log
    if (isStreamingAnswer) {
      const reasoning = message.search_log?.reasoning_content || "";
      return reasoning;
    }
    
    // Otherwise use the stored reasoning_content
    if (!message.search_log?.reasoning_content) return "";
    
    const content = message.search_log.reasoning_content;
    
    return content;
  });

  // Process content with streaming cursor injected (only if not streaming reasoning)
  const processedMarkdownData: MarkdownResult = $derived.by(() => {
    // If currently streaming reasoning, don't show any content in main area
    if (isStreamingReasoning) {
      return { ...markdownData, parts: [] };
    }
    
    // If streaming answer, add cursor to main content
    if (isStreamingAnswer) {
      // Only show answer content (not reasoning)
      const answerOnlyMarkdown = processMarkdown(displayContent);
      
      if (answerOnlyMarkdown.parts.length === 0) {
        return answerOnlyMarkdown;
      }

      // Clone the parts array
      const parts = [...answerOnlyMarkdown.parts];
      const lastPart = parts[parts.length - 1];

      // If the last part is HTML, inject the cursor before closing tags
      if (lastPart.type === 'html') {
        let content = lastPart.content;
        // Find the last closing tag (</p>, </div>, etc.) and inject cursor before it
        const lastClosingTagMatch = content.match(/(<\/[^>]+>)(\s*)$/);
        if (lastClosingTagMatch) {
          const beforeClosing = content.substring(0, lastClosingTagMatch.index);
          const closingTag = lastClosingTagMatch[1];
          const trailing = lastClosingTagMatch[2];
          content = beforeClosing + '<span class="streaming-cursor-blink"> ▋</span>' + closingTag + trailing;
        } else {
          // No closing tag found, just append
          content += '<span class="streaming-cursor-blink"> ▋</span>';
        }
        parts[parts.length - 1] = { ...lastPart, content };
      }

      return { ...answerOnlyMarkdown, parts };
    }
    
    // Not streaming, return markdown as-is
    return markdownData;
  });

  // Show reminder for AI messages with code blocks or math blocks
  const hasCodeInContent = $derived(markdownData.codeBlocks.length > 0);
  const hasMathInContent = $derived(markdownData.mathBlocks.length > 0);

  // Parse search context (handle both object and string)
  const webResultsCount = $derived.by(() => {
    if (!message.search_log?.search_context_web) return 0;
    
    const context = message.search_log.search_context_web;
    let parsed = null;
    
    if (typeof context === 'string') {
      try {
        parsed = JSON.parse(context);
      } catch {
        return 0;
      }
    } else {
      parsed = context;
    }
    
    return parsed?.results?.length || 0;
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="message" class:user={isUser} class:assistant={!isUser} class:error={hasError} class:streaming={isStreaming}>
  <div class="message-header">
    <span class="role" style="color: {getDisplayRoleColor(message.role)}">{getDisplayRole(message.role)}</span>
    {#if settingsStore.showMessageTimestamps && message.created_at}
      <span class="message-timestamp">{formatMessageTime(message.created_at)}</span>
    {/if}
    {#if !isUser && message.routing_mode === "auto" && message.model_id && message.ai_model_key}
      <span class="model-badge decision" title="Decision model used for routing">
        Decision: {message.model_id}
      </span>
      <span class="model-badge active" title="Active model responding">
        Active: {message.ai_model_key}
      </span>
    {:else if !isUser && (message.ai_model_key || message.model_id)}
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
    {#if !isUser && (message.search_log?.reasoning_content || isStreamingReasoning)}
      <div class="reasoning-toggle">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <button type="button" class="reasoning-toggle-btn" onclick={() => showReasoning = !showReasoning}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <span>Reasoning</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate({showReasoning ? '180deg' : '0deg'}); transition: transform 0.2s;">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {#if (showReasoning || isStreamingReasoning) && processedReasoningContent}
          <div class="reasoning-content-inline">
            <div class="reasoning-text">
              {@html processedReasoningContent}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    {#each processedMarkdownData.parts as part, index (part.id || index)}
      {#if part.type === 'html'}
        {@html part.content}
      {:else if part.type === 'code'}
        {#each processedMarkdownData.codeBlocks.filter(cb => cb.id === part.id) as codeBlock}
          <CodeBlock code={codeBlock.code} language={codeBlock.language} />
        {/each}
      {:else if part.type === 'math'}
        {#each processedMarkdownData.mathBlocks.filter(mb => mb.id === part.id) as mathBlock}
          <MathBlock math={mathBlock.math} />
        {/each}
      {/if}
    {/each}
    {#if isStreamingAnswer && processedMarkdownData.parts.length === 0}
      <span class="streaming-cursor-blink"> ▋</span>
    {/if}
  </div>

  {#if !isUser && hasError}
    <div class="message-reminder error">
      <span class="reminder-text" title={displayContent.replace(/^Error:\s*/, '')}>
        ⚠️ {displayContent.replace(/^Error:\s*/, '')}
      </span>
    </div>
  {:else if !isUser && hasCodeInContent && hasMathInContent}
    <div class="message-reminder">
      <span class="reminder-text">💡 Code and math blocks include a copy button in the top-right corner</span>
    </div>
  {:else if !isUser && hasCodeInContent}
    <div class="message-reminder">
      <span class="reminder-text">💡 Code blocks include a copy button in the top-right corner</span>
    </div>
  {:else if !isUser && hasMathInContent}
    <div class="message-reminder math">
      <span class="reminder-text">🧮 Math blocks include a copy button in the top-right corner</span>
    </div>
  {/if}

  {#if !isUser && message.search_log}
    <div class="message-meta">
      {#if message.search_log.used_web_search}
        {#if webResultsCount > 0}
          <span class="meta-item search">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            Web ({webResultsCount} results)
          </span>
        {:else}
          <span class="meta-item search no-results">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            Web - No results
          </span>
        {/if}
      {/if}
      {#if message.search_log.used_image_search}
        <span class="meta-item search">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Image search
        </span>
      {/if}
      {#if message.search_log.reasoning_effort && message.search_log.reasoning_effort !== "disabled"}
        <span class="meta-item reasoning">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          Reasoning: {message.search_log.reasoning_effort}
        </span>
      {/if}
      {#if message.search_log.memory_chat_include !== 1000}
        <span class="meta-item memory">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          {message.search_log.memory_chat_include} msgs
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
    /* min-width: 700px; */
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

  .message-timestamp {
    font-size: 11px;
    color: var(--text-secondary, #888);
    opacity: 0.7;
  }

  .model-badge {
    font-size: 13px;
    padding: 2px 8px;
    background: var(--badge-bg, #3d3d3d);
    border-radius: 4px;
    color: var(--text-secondary, #888);
  }

  .model-badge.decision {
    background: rgba(99, 102, 241, 0.15);
    color: var(--primary-color, #6366f1);
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .model-badge.active {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
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
    font-size: var(--chat-font-size, 15px);
    line-height: 1.6;
    color: var(--text-primary, #fff);
  }

  .message-content:not(.streaming-content) :global(p) {
    display: block;
    margin: 0 0 12px;
  }

  .message-content:not(.streaming-content) :global(p:last-child) {
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

  .message-content :global(.math-block-wrapper) {
    border-radius: 8px;
    margin: 12px 0;
    overflow: hidden;
    border: 1px solid rgba(31, 240, 240, 0.2);
  }

  .message-content :global(.math-content) {
    padding: 12px 16px;
    overflow-x: auto;
    color: var(--text-primary, #fff);
    font-size: 16px;
    line-height: 1.6;
  }

  /* KaTeX styling overrides */
  .message-content :global(.math-content .katex) {
    font-size: 1.1em;
    color: var(--text-primary, #fff);
  }

  .message-content :global(.math-content .katex-display) {
    margin: 0;
    overflow-x: auto;
    overflow-y: hidden;
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

  .message-reminder.math {
    background: rgba(31, 240, 240, 0.1);
    border-left: 2px solid #1ff0f0;
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

  .message-reminder.math .reminder-text {
    color: #1ff0f0;
  }

  .message-meta {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color, #2d2d2d);
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-secondary, #666);
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
  }

  .meta-item.search {
    color: var(--primary-color, #6366f1);
    background: rgba(99, 102, 241, 0.1);
  }

  .meta-item.search.no-results {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .meta-item.memory {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  .meta-item.reasoning {
    color: #a855f7;
    background: rgba(168, 85, 247, 0.1);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .reasoning-toggle {
    margin-bottom: 12px;
  }

  .reasoning-toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(168, 85, 247, 0.1);
    border: 1px solid rgba(168, 85, 247, 0.2);
    border-radius: 6px;
    color: #a855f7;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .reasoning-toggle-btn:hover {
    background: rgba(168, 85, 247, 0.2);
    border-color: rgba(168, 85, 247, 0.3);
  }

  .reasoning-content-inline {
    margin-top: 8px;
    padding: 12px;
    background: rgba(168, 85, 247, 0.05);
    border: 1px solid rgba(168, 85, 247, 0.2);
    border-radius: 0 0 8px 8px;
    border-top: none;
    margin-top: 0;
  }

  .reasoning-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-primary, #fff);
    white-space: pre-wrap;
    font-family: "Fira Code", "Consolas", monospace;
  }

  .message.streaming {
    border-left: 3px solid var(--primary-color, #6366f1);
  }


  :global(.streaming-cursor-blink) {
    display: inline;
    animation: blink 1s step-end infinite;
    color: #6366f1 !important;
    font-weight: bold;
    line-height: inherit;
  }

  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
