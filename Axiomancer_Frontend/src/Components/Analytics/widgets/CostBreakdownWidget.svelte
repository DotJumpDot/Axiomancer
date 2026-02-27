<script lang="ts">
  import { settingsStore } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  function formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat(settingsStore.language as string).format(num);
  }

  function calculateCostBreakdown() {
    if (!data.mostUsedModels || data.mostUsedModels.length === 0) {
      return [];
    }

    const total = data.totalCost || 1;
    return data.mostUsedModels.slice(0, 5).map((model: any) => ({
      name: model.displayName || model.modelKey,
      cost: model.cost || 0,
      percentage: ((model.cost || 0) / total) * 100,
      color: getColorForIndex(model.modelKey)
    }));
  }

  function getColorForIndex(key: string): string {
    const colors = [
      "#10b981", // Emerald
      "#3b82f6", // Blue
      "#f59e0b", // Amber
      "#ec4899", // Pink
      "#8b5cf6", // Violet
    ];
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  let breakdown = $derived(calculateCostBreakdown());
  let totalCost = $derived(data.totalCost || 0);
  let averageCostPerMessage = $derived(data.totalMessages > 0 ? totalCost / data.totalMessages : 0);
  let averageCostPerToken = $derived(data.totalTokensUsed > 0 ? totalCost / data.totalTokensUsed : 0);
</script>

<div class="cost-breakdown">
  <div class="cost-summary">
    <div class="summary-item total">
      <span class="summary-label">{t.analytics?.totalCost || "Total Cost"}</span>
      <span class="summary-value">{formatCost(totalCost)}</span>
    </div>
    <div class="summary-row">
      <div class="summary-item">
        <span class="summary-label">{t.analytics?.costPerMessage || "Per Message"}</span>
        <span class="summary-value small">{formatCost(averageCostPerMessage)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{t.analytics?.costPer1kTokens || "Per 1K Tokens"}</span>
        <span class="summary-value small">{formatCost(averageCostPerToken * 1000)}</span>
      </div>
    </div>
  </div>

  {#if breakdown.length > 0}
    <div class="breakdown-list">
      {#each breakdown as item}
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="model-name" title={item.name}>{item.name}</span>
            <span class="cost-value">{formatCost(item.cost)}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              style="width: {item.percentage}%; background-color: {item.color}"
            ></div>
          </div>
          <span class="percentage">{item.percentage.toFixed(1)}%</span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-data">
      <p>{t.analytics?.noData || "No data available"}</p>
    </div>
  {/if}
</div>

<style>
  .cost-breakdown {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }

  .cost-summary {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
    border-radius: 10px;
    border: 1px solid var(--border-color);
  }

  .summary-item.total {
    text-align: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }

  .summary-item.total .summary-value {
    font-size: 1.75rem;
    color: var(--accent-primary);
  }

  .summary-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .summary-label {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .summary-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .summary-value.small {
    font-size: 0.9rem;
  }

  .breakdown-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    overflow-y: auto;
  }

  .breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
  }

  .breakdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .model-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .cost-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent-primary);
    flex-shrink: 0;
  }

  .progress-bar {
    height: 6px;
    background: var(--bg-secondary);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .percentage {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    text-align: right;
  }

  .no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }
</style>
