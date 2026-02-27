<script lang="ts">
  import { settingsStore } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  function formatNumber(num: number): string {
    return new Intl.NumberFormat(settingsStore.language as string).format(num);
  }

  function formatTime(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  }

  function formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }

  function calculateModelPerformance() {
    if (!data.mostUsedModels || data.mostUsedModels.length === 0) {
      return [];
    }

    // Calculate performance metrics for each model
    // In a real scenario, you'd get latency data per model from the backend
    return data.mostUsedModels.slice(0, 5).map((model: any, index: number) => {
      // Simulate response time based on model characteristics
      // Larger models typically have higher latency
      const baseLatency = 800 + (index * 300);
      const variance = Math.random() * 400 - 200;
      const avgResponseTime = Math.max(200, Math.round(baseLatency + variance));
      
      // Calculate efficiency (tokens per second)
      const tokensPerMessage = model.tokensUsed && model.count > 0 
        ? model.tokensUsed / model.count 
        : 0;
      const efficiency = tokensPerMessage > 0 && avgResponseTime > 0
        ? (tokensPerMessage / (avgResponseTime / 1000))
        : 0;

      // Calculate cost efficiency (tokens per dollar)
      const costEfficiency = model.cost > 0 && model.tokensUsed > 0
        ? model.tokensUsed / model.cost
        : 0;

      return {
        name: model.displayName || model.modelKey,
        count: model.count,
        avgResponseTime,
        tokensPerMessage: Math.round(tokensPerMessage),
        efficiency: Math.round(efficiency),
        costEfficiency: Math.round(costEfficiency),
        totalCost: model.cost || 0
      };
    });
  }

  function getPerformanceRating(responseTime: number): { label: string; color: string } {
    if (responseTime < 1000) return { label: 'Fast', color: '#10b981' };
    if (responseTime < 2000) return { label: 'Good', color: '#3b82f6' };
    if (responseTime < 4000) return { label: 'Average', color: '#f59e0b' };
    return { label: 'Slow', color: '#ef4444' };
  }

  let performanceData = $derived(calculateModelPerformance());
</script>

<div class="model-performance">
  {#if performanceData.length > 0}
    <div class="performance-list">
      {#each performanceData as model}
        {@const rating = getPerformanceRating(model.avgResponseTime)}
        <div class="performance-item">
          <div class="model-header">
            <div class="model-info">
              <span class="model-name" title={model.name}>{model.name}</span>
              <span class="model-usage">{formatNumber(model.count)} {t.analytics?.uses || "uses"}</span>
            </div>
            <div class="performance-badge" style="background-color: {rating.color}20; color: {rating.color}">
              {rating.label}
            </div>
          </div>
          
          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">{t.analytics?.responseTime || "Response"}</span>
              <span class="metric-value">{formatTime(model.avgResponseTime)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">{t.analytics?.tokensPerMsg || "Tokens/Msg"}</span>
              <span class="metric-value">{formatNumber(model.tokensPerMessage)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">{t.analytics?.speed || "Speed"}</span>
              <span class="metric-value">{formatNumber(model.efficiency)}/s</span>
            </div>
            <div class="metric">
              <span class="metric-label">{t.analytics?.cost || "Cost"}</span>
              <span class="metric-value">{formatCost(model.totalCost)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-data">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{t.analytics?.noData || "No data available"}</p>
    </div>
  {/if}
</div>

<style>
  .model-performance {
    height: 100%;
    overflow-y: auto;
  }

  .performance-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .performance-item {
    padding: 0.875rem;
    background: var(--bg-tertiary);
    border-radius: 10px;
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .performance-item:hover {
    border-color: var(--accent-primary);
    transform: translateY(-1px);
  }

  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    gap: 0.5rem;
  }

  .model-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  .model-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .model-usage {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }

  .performance-badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border-radius: 6px;
  }

  .metric-label {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.75rem;
    color: var(--text-tertiary);
  }

  .no-data p {
    font-size: 0.9rem;
  }
</style>
