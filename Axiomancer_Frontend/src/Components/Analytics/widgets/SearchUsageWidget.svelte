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

  let total = $derived(data.searchUsage?.totalSearches || 0);
</script>

<div class="search-usage">
  <div class="total-searches">
    <span class="value">{total}</span>
    <span class="label">{t.analytics?.totalSearches || "Total Searches"}</span>
  </div>

  <div class="search-breakdown">
    <div class="breakdown-item">
      <div class="item-header">
        <span>{t.analytics?.webSearch || "Web Search"}</span>
        <span class="count">{data.searchUsage?.webSearches || 0}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill web" style="width: {getPercentage(data.searchUsage?.webSearches, total)}"></div>
      </div>
    </div>

    <div class="breakdown-item">
      <div class="item-header">
        <span>{t.analytics?.imageSearch || "Image Search"}</span>
        <span class="count">{data.searchUsage?.imageSearches || 0}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill image" style="width: {getPercentage(data.searchUsage?.imageSearches, total)}"></div>
      </div>
    </div>

    <div class="breakdown-item">
      <div class="item-header">
        <span>{t.analytics?.steamSearch || "Steam Search"}</span>
        <span class="count">{data.searchUsage?.steamSearches || 0}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill steam" style="width: {getPercentage(data.searchUsage?.steamSearches, total)}"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .search-usage {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100%;
    justify-content: center;
  }

  .total-searches {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .total-searches .value {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--accent-primary);
    line-height: 1;
  }

  .total-searches .label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }

  .search-breakdown {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  .item-header .count {
    font-weight: 600;
    color: var(--text-secondary);
  }

  .progress-bar {
    height: 6px;
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
  .progress-fill.steam { background: #10b981; }
</style>
