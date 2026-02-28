<script lang="ts">
  import { settingsStore } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  function getPercentage(count: number, total: number): string {
    if (total === 0) return '0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  }

  function formatCost(cost: number): string {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return `<$0.01`;
    return `$${cost.toFixed(2)}`;
  }

  function formatLatency(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  function truncateModelName(name: string, maxLength: number = 25): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  }

  let enhanceUsage = $derived(data.enhanceUsage || {
    totalEnhances: 0,
    webSearchEnhances: 0,
    imageSearchEnhances: 0,
    freeModelEnhances: 0,
    paidModelEnhances: 0,
    totalTokensUsed: 0,
    totalCost: 0,
    averageLatency: 0,
    topModels: []
  });

  let total = $derived(enhanceUsage.totalEnhances || 0);
</script>

<div class="enhance-usage">
  {#if total === 0}
    <div class="no-data">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span>{t.analytics?.noEnhanceData || "No enhance usage yet"}</span>
      <p>{t.analytics?.enableEnhanceSearch || "Enable enhance search in settings to see statistics"}</p>
    </div>
  {:else}
    <div class="stats-grid">
      <div class="stat-card total">
        <span class="stat-value">{total}</span>
        <span class="stat-label">{t.analytics?.totalEnhances || "Total Enhances"}</span>
      </div>
      
      <div class="stat-card tokens">
        <span class="stat-value">{enhanceUsage.totalTokensUsed?.toLocaleString() || 0}</span>
        <span class="stat-label">{t.analytics?.tokensUsed || "Tokens Used"}</span>
      </div>
      
      <div class="stat-card cost">
        <span class="stat-value">{formatCost(enhanceUsage.totalCost || 0)}</span>
        <span class="stat-label">{t.analytics?.totalCost || "Total Cost"}</span>
      </div>
      
      <div class="stat-card latency">
        <span class="stat-value">{formatLatency(enhanceUsage.averageLatency || 0)}</span>
        <span class="stat-label">{t.analytics?.avgLatency || "Avg Latency"}</span>
      </div>
    </div>

    <div class="breakdown-section">
      <h4>{t.analytics?.enhanceBreakdown || "Enhance Breakdown"}</h4>
      
      <div class="breakdown-grid">
        <div class="breakdown-item">
          <div class="item-header">
            <span class="item-label">{t.analytics?.webSearch || "Web Search"}</span>
            <span class="item-value">{enhanceUsage.webSearchEnhances || 0}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill web" style="width: {getPercentage(enhanceUsage.webSearchEnhances, total)}"></div>
          </div>
        </div>

        <div class="breakdown-item">
          <div class="item-header">
            <span class="item-label">{t.analytics?.imageSearch || "Image Search"}</span>
            <span class="item-value">{enhanceUsage.imageSearchEnhances || 0}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill image" style="width: {getPercentage(enhanceUsage.imageSearchEnhances, total)}"></div>
          </div>
        </div>

        <div class="breakdown-item">
          <div class="item-header">
            <span class="item-label">{t.analytics?.freeModels || "Free Models"}</span>
            <span class="item-value">{enhanceUsage.freeModelEnhances || 0}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill free" style="width: {getPercentage(enhanceUsage.freeModelEnhances, total)}"></div>
          </div>
        </div>

        <div class="breakdown-item">
          <div class="item-header">
            <span class="item-label">{t.analytics?.paidModels || "Paid Models"}</span>
            <span class="item-value">{enhanceUsage.paidModelEnhances || 0}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill paid" style="width: {getPercentage(enhanceUsage.paidModelEnhances, total)}"></div>
          </div>
        </div>
      </div>
    </div>

    {#if enhanceUsage.topModels && enhanceUsage.topModels.length > 0}
      <div class="top-models-section">
        <h4>{t.analytics?.topEnhanceModels || "Top Models"}</h4>
        <div class="models-list">
          {#each enhanceUsage.topModels as model}
            <div class="model-item">
              <div class="model-info">
                <span class="model-name" title={model.modelKey}>
                  {truncateModelName(model.displayName || model.modelKey)}
                </span>
                {#if model.isFree}
                  <span class="free-badge">FREE</span>
                {/if}
              </div>
              <div class="model-stats">
                <span class="model-count">{model.count}×</span>
                <span class="model-tokens">{model.tokensUsed?.toLocaleString() || 0} tokens</span>
                <span class="model-cost">{formatCost(model.cost || 0)}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .enhance-usage {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    height: 100%;
    overflow-y: auto;
  }

  .no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.75rem;
    color: var(--text-secondary);
    text-align: center;
    padding: 1rem;
  }

  .no-data svg {
    opacity: 0.5;
  }

  .no-data span {
    font-size: 1rem;
    font-weight: 600;
  }

  .no-data p {
    font-size: 0.85rem;
    opacity: 0.7;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent-primary);
    line-height: 1.2;
  }

  .stat-card.tokens .stat-value {
    color: #3b82f6;
  }

  .stat-card.cost .stat-value {
    color: #22c55e;
  }

  .stat-card.latency .stat-value {
    color: #f59e0b;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .breakdown-section,
  .top-models-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .breakdown-section h4,
  .top-models-section h4 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .breakdown-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }

  .item-label {
    color: var(--text-secondary);
  }

  .item-value {
    font-weight: 600;
    color: var(--text-primary);
  }

  .progress-bar {
    height: 5px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-fill.web { background: #3b82f6; }
  .progress-fill.image { background: #ec4899; }
  .progress-fill.free { background: #22c55e; }
  .progress-fill.paid { background: #f59e0b; }

  .models-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .model-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 6px;
    font-size: 0.8rem;
  }

  .model-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .model-name {
    color: var(--text-primary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .free-badge {
    font-size: 0.65rem;
    font-weight: 700;
    color: #22c55e;
    background: rgba(34, 197, 94, 0.15);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .model-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .model-count {
    font-weight: 600;
    color: var(--accent-primary);
  }

  .model-tokens {
    font-size: 0.75rem;
  }

  .model-cost {
    font-weight: 600;
    color: #22c55e;
    min-width: 50px;
    text-align: right;
  }
</style>