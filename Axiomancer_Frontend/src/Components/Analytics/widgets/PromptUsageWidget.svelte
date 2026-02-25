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
</script>

<div class="prompt-usage">
  {#if data.promptUsage && data.promptUsage.length > 0}
    <div class="prompt-list">
      {#each data.promptUsage as prompt, index}
        <div class="prompt-item">
          <div class="rank">#{index + 1}</div>
          <div class="info">
            <span class="name">{prompt.name}</span>
          </div>
          <div class="count-badge">
            {formatNumber(prompt.count)}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty">
      <p>{t.analytics?.noPromptData || "No prompt usage data"}</p>
    </div>
  {/if}
</div>

<style>
  .prompt-usage {
    height: 100%;
  }

  .prompt-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .prompt-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .prompt-item:hover {
    border-color: var(--accent-primary);
    transform: translateX(4px);
  }

  .rank {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--accent-primary);
    width: 24px;
  }

  .info {
    flex: 1;
  }

  .name {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .count-badge {
    background: var(--bg-primary);
    color: var(--text-secondary);
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid var(--border-color);
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }
</style>
