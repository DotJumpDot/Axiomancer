<script lang="ts">
  import { settingsStore } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(settingsStore.language as string, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="conversation-activity">
  {#if data.conversationActivity && data.conversationActivity.length > 0}
    <div class="activity-list">
      {#each data.conversationActivity as conv}
        <div class="activity-item">
          <div class="activity-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="activity-info">
            <span class="title">{conv.title}</span>
            <span class="meta">{conv.messageCount} {t.analytics?.messages || "messages"} • {formatDate(conv.lastActive)}</span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty">
      <p>{t.analytics?.noActivityData || "No recent activity"}</p>
    </div>
  {/if}
</div>

<style>
  .conversation-activity {
    height: 100%;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .activity-item:hover {
    border-color: var(--accent-primary);
    background: var(--bg-hover);
  }

  .activity-icon {
    margin-top: 0.125rem;
    color: var(--accent-primary);
    background: var(--bg-primary);
    padding: 0.4rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .activity-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    overflow: hidden;
  }

  .title {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta {
    font-size: 0.75rem;
    color: var(--text-tertiary);
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
