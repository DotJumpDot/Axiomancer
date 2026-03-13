<script lang="ts">
  import { chatStore } from "@/Store";

  let isOpen = $state(false);

  const totalCost = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_used_price !== null && message.ai_used_price !== undefined) {
        const price = typeof message.ai_used_price === "string" ? parseFloat(message.ai_used_price) : message.ai_used_price;
        if (!isNaN(price)) {
          total += price;
        }
      }
    }
    return total;
  });

  const aiCallCount = $derived.by(() => {
    return chatStore.messages.filter((m) => m.role === "assistant").length;
  });

  const totalPromptTokens = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_token_usage) {
        total += message.ai_token_usage.prompt_tokens || 0;
      }
    }
    return total;
  });

  const totalCompletionTokens = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_token_usage) {
        total += message.ai_token_usage.completion_tokens || 0;
      }
    }
    return total;
  });

  const totalTokens = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_token_usage) {
        total += message.ai_token_usage.total_tokens || 0;
      }
    }
    return total;
  });

  const totalInputCost = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_used_token_detail) {
        total += message.ai_used_token_detail.inputCost || 0;
      }
    }
    return total;
  });

  const totalOutputCost = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_used_token_detail) {
        total += message.ai_used_token_detail.outputCost || 0;
      }
    }
    return total;
  });

  const totalRequestCost = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_used_token_detail) {
        total += message.ai_used_token_detail.requestCost || 0;
      }
    }
    return total;
  });

  const totalImageCost = $derived.by(() => {
    let total = 0;
    for (const message of chatStore.messages) {
      if (message.role === "assistant" && message.ai_used_token_detail) {
        total += message.ai_used_token_detail.imageCost || 0;
      }
    }
    return total;
  });

  function formatCost(value: number): string {
    if (typeof value !== 'number' || isNaN(value)) return "0";
    if (value === 0) return "0";
    return value.toFixed(6).replace(/\.?0+$/, "");
  }

  function formatNumber(num: number): string {
    if (typeof num !== 'number' || isNaN(num)) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }
</script>

<div class="conversation-stats-wrapper">
  <button class="stats-toggle" onclick={() => isOpen = !isOpen} title="Conversation Stats">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
    <span class="cost-display">${formatCost(totalCost)}</span>
  </button>

  {#if isOpen}
    <div class="stats-tooltip">
      <div class="stats-header">
        <h3>Conversation Stats</h3>
        <button class="close-btn" onclick={() => isOpen = false} aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="stats-content">
        <div class="stat-item total">
          <div class="stat-label">Total Cost</div>
          <div class="stat-value">${formatCost(totalCost)}</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">AI Calls</div>
          <div class="stat-value">{aiCallCount}</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">Total Tokens</div>
          <div class="stat-value">{formatNumber(totalTokens)}</div>
        </div>

        <div class="stats-divider"></div>

        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-label">Prompt Tokens</div>
            <div class="stat-value">{formatNumber(totalPromptTokens)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Completion Tokens</div>
            <div class="stat-value">{formatNumber(totalCompletionTokens)}</div>
          </div>
        </div>

        <div class="stats-divider"></div>

        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-label">Input Cost</div>
            <div class="stat-value">${formatCost(totalInputCost)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Output Cost</div>
            <div class="stat-value">${formatCost(totalOutputCost)}</div>
          </div>
        </div>

        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-label">Request Cost</div>
            <div class="stat-value">${formatCost(totalRequestCost)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Image Cost</div>
            <div class="stat-value">${formatCost(totalImageCost)}</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .conversation-stats-wrapper {
    position: fixed;
    bottom: 140px;
    right: 15px;
    z-index: 1000;
  }

  .stats-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--bg-secondary, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 24px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .stats-toggle:hover {
    background: var(--hover-bg, #3d3d3d);
    border-color: var(--primary-color, #6366f1);
    transform: translateY(-2px);
  }

  .cost-display {
    font-size: 14px;
    font-weight: 600;
    color: #fbbf24;
  }

  .stats-tooltip {
    position: absolute;
    bottom: 60px;
    right: 0;
    width: 350px;
    background: var(--bg-secondary, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, #3d3d3d);
  }

  .stats-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #fff);
  }

  .stats-content {
    padding: 16px 20px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .stat-item.total {
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color, #3d3d3d);
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-secondary, #888);
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .stat-item.total .stat-value {
    font-size: 18px;
    color: #fbbf24;
  }

  .stats-divider {
    height: 1px;
    background: var(--border-color, #3d3d3d);
    margin: 12px 0;
  }

  .stat-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
</style>
