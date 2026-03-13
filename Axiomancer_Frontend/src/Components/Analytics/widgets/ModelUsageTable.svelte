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

  function formatCost(cost: number): string {
    return `$${cost.toFixed(6).replace(/\.?0+$/, '')}`;
  }

  function getPercentage(count: number, total: number): string {
    if (total === 0) return '0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  }

  let totalUsage = $derived(data.mostUsedModels?.reduce((sum: number, m: any) => sum + m.count, 0) || 0);
</script>

<div class="model-usage-table">
  <table>
    <thead>
      <tr>
        <th>{t.analytics?.rank || "Rank"}</th>
        <th>{t.analytics?.model || "Model"}</th>
        <th>{t.analytics?.usage || "Usage"}</th>
        <th>{t.analytics?.tokens || "Tokens"}</th>
        <th>Input Cost</th>
        <th>Output Cost</th>
        <th>{t.analytics?.cost || "Total Cost"}</th>
      </tr>
    </thead>
    <tbody>
      {#each data.mostUsedModels || [] as model, index (model.modelKey)}
        <tr>
          <td class="rank">#{index + 1}</td>
          <td class="model-name">
            <div class="name">{model.displayName}</div>
            <div class="key">{model.modelKey}</div>
          </td>
          <td>
            <div class="usage-bar">
              <div class="usage-fill" style="width: {getPercentage(model.count, totalUsage)}"></div>
            </div>
            <div class="usage-text">
              <span class="count">{formatNumber(model.count)}</span>
              <span class="percent">{getPercentage(model.count, totalUsage)}</span>
            </div>
          </td>
          <td>{formatNumber(model.tokensUsed)}</td>
          <td class="cost-cell input-cost">{formatCost(model.inputCost || 0)}</td>
          <td class="cost-cell output-cost">{formatCost(model.outputCost || 0)}</td>
          <td class="cost-cell total-cost">{formatCost(model.cost)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .model-usage-table {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border-color);
    background: var(--bg-tertiary);
  }

  tbody tr {
    border-bottom: 1px solid var(--border-color);
    transition: background 0.2s;
  }

  tbody tr:hover {
    background: var(--bg-hover);
  }

  td {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .rank {
    font-weight: 600;
    color: var(--accent-primary);
    width: 60px;
  }

  .model-name {
    min-width: 200px;
  }

  .model-name .name {
    font-weight: 500;
  }

  .model-name .key {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    margin-top: 0.125rem;
  }

  .usage-bar {
    width: 100%;
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .usage-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .usage-text {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .usage-text .count {
    font-weight: 600;
    font-size: 1rem;
  }

  .usage-text .percent {
    font-size: 0.8rem;
    color: var(--text-tertiary);
  }

  .cost-cell {
    font-weight: 600;
  }

  .input-cost {
    color: var(--accent-color, #ffc107);
  }

  .output-cost {
    color: var(--success-color, #4ade80);
  }

  .total-cost {
    color: var(--accent-primary);
  }

  @media (max-width: 640px) {
    .model-name {
      min-width: 150px;
    }
  }
</style>
