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

  function calculatePercentages() {
    if (!data.mostUsedModels || data.mostUsedModels.length === 0) {
      return [];
    }

    const total = data.totalTokensUsed || 1;
    return data.mostUsedModels.slice(0, 5).map((model: any) => ({
      name: model.displayName || model.modelKey,
      tokens: model.tokensUsed || 0,
      percentage: ((model.tokensUsed || 0) / total) * 100,
      color: getColorForIndex(model.modelKey)
    }));
  }

  function getColorForIndex(key: string): string {
    const colors = [
      "#6366f1", // Indigo
      "#8b5cf6", // Violet
      "#ec4899", // Pink
      "#f59e0b", // Amber
      "#10b981", // Emerald
    ];
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  let distribution = $derived(calculatePercentages());
  let totalPercentage = $derived(distribution.reduce((sum, item) => sum + item.percentage, 0));
</script>

<div class="token-distribution">
  {#if distribution.length > 0}
    <div class="distribution-chart">
      <svg viewBox="0 0 100 100" class="donut-chart">
        {#each distribution as item, index}
          {@const startAngle = distribution.slice(0, index).reduce((sum, d) => sum + (d.percentage / totalPercentage) * 360, 0)}
          {@const endAngle = startAngle + (item.percentage / totalPercentage) * 360}
          {@const largeArc = endAngle - startAngle > 180 ? 1 : 0}
          {@const startRad = (startAngle - 90) * Math.PI / 180}
          {@const endRad = (endAngle - 90) * Math.PI / 180}
          {@const x1 = 50 + 35 * Math.cos(startRad)}
          {@const y1 = 50 + 35 * Math.sin(startRad)}
          {@const x2 = 50 + 35 * Math.cos(endRad)}
          {@const y2 = 50 + 35 * Math.sin(endRad)}
          <path
            d="M 50 50 L {x1} {y1} A 35 35 0 {largeArc} 1 {x2} {y2} Z"
            fill={item.color}
            stroke="var(--bg-secondary)"
            stroke-width="2"
          />
        {/each}
        <circle cx="50" cy="50" r="20" fill="var(--bg-secondary)" />
        <text x="50" y="48" text-anchor="middle" class="center-label" fill="var(--text-primary)">
          {formatNumber(data.totalTokensUsed)}
        </text>
        <text x="50" y="58" text-anchor="middle" class="center-sublabel" fill="var(--text-tertiary)">
          {t.analytics?.tokens || "Tokens"}
        </text>
      </svg>
    </div>
    
    <div class="distribution-legend">
      {#each distribution as item}
        <div class="legend-item">
          <div class="legend-color" style="background-color: {item.color}"></div>
          <div class="legend-info">
            <span class="legend-name" title={item.name}>{item.name}</span>
            <span class="legend-value">{formatNumber(item.tokens)} ({item.percentage.toFixed(1)}%)</span>
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
  .token-distribution {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }

  .distribution-chart {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    min-height: 150px;
  }

  .donut-chart {
    width: 150px;
    height: 150px;
  }

  .center-label {
    font-size: 10px;
    font-weight: 600;
  }

  .center-sublabel {
    font-size: 6px;
  }

  .distribution-legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--bg-tertiary);
    border-radius: 6px;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .legend-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .legend-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .legend-value {
    font-size: 0.75rem;
    color: var(--text-tertiary);
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
