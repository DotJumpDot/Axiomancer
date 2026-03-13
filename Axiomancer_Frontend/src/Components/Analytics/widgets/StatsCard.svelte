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

  function formatTime(ms: number): string {
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = seconds / 60;
    return `${minutes.toFixed(1)}m`;
  }
</script>

<div class="stats-card">
  <div class="stat-item">
    <div class="stat-icon messages">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
    <div class="stat-info">
      <span class="stat-label">{t.analytics?.totalMessages || "Total Messages"}</span>
      <span class="stat-value">{formatNumber(data.totalMessages)}</span>
    </div>
  </div>

  <div class="stat-item">
    <div class="stat-icon conversations">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    </div>
    <div class="stat-info">
      <span class="stat-label">{t.analytics?.totalConversations || "Conversations"}</span>
      <span class="stat-value">{formatNumber(data.totalConversations)}</span>
    </div>
  </div>

  <div class="stat-item">
    <div class="stat-icon tokens">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    </div>
    <div class="stat-info">
      <span class="stat-label">{t.analytics?.totalTokens || "Total Tokens"}</span>
      <span class="stat-value">{formatNumber(data.totalTokensUsed)}</span>
    </div>
  </div>

  <div class="stat-item">
    <div class="stat-icon cost">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7"></path>
      </svg>
    </div>
    <div class="stat-info">
      <span class="stat-label">{t.analytics?.totalCost || "Total Cost"}</span>
      <span class="stat-value">{formatCost(data.totalCost)}</span>
    </div>
  </div>

  <div class="stat-item">
    <div class="stat-icon response-time">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    </div>
    <div class="stat-info">
      <span class="stat-label">{t.analytics?.avgResponseTime || "Avg Response Time"}</span>
      <span class="stat-value">{formatTime(data.averageResponseTime)}</span>
    </div>
  </div>
</div>

<style>
  .stats-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .stat-item:hover {
    transform: translateY(-2px);
    border-color: var(--accent-primary);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon.messages {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
  }

  .stat-icon.conversations {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
  }

  .stat-icon.tokens {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: white;
  }

  .stat-icon.cost {
    background: linear-gradient(135deg, #10b981, #22c55e);
    color: white;
  }

  .stat-icon.response-time {
    background: linear-gradient(135deg, #f97316, #fb923c);
    color: white;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  @media (max-width: 640px) {
    .stats-card {
      grid-template-columns: 1fr;
    }
  }
</style>
