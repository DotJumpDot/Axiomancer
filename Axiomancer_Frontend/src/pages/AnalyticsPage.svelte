<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { navigate } from "svelte-routing";
  import { fade, slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { settingsStore, authStore } from "@/Store";
  import { analyticsService } from "@/Service/analyticsService";
  import type { AnalyticsData } from "@/Service/analyticsService";
  import { getTranslations, type LanguageCode } from "@/Function";
  import StatsCard from "@/Components/Analytics/widgets/StatsCard.svelte";
  import UsageChart from "@/Components/Analytics/widgets/UsageChart.svelte";
  import ModelUsageTable from "@/Components/Analytics/widgets/ModelUsageTable.svelte";
  import SearchUsageWidget from "@/Components/Analytics/widgets/SearchUsageWidget.svelte";
  import ReasoningUsageWidget from "@/Components/Analytics/widgets/ReasoningUsageWidget.svelte";
  import EnhanceUsageWidget from "@/Components/Analytics/widgets/EnhanceUsageWidget.svelte";
  import PromptUsageWidget from "@/Components/Analytics/widgets/PromptUsageWidget.svelte";
  import ConversationActivityWidget from "@/Components/Analytics/widgets/ConversationActivityWidget.svelte";
  import TokenDistributionWidget from "@/Components/Analytics/widgets/TokenDistributionWidget.svelte";
  import CostBreakdownWidget from "@/Components/Analytics/widgets/CostBreakdownWidget.svelte";
  import HourlyUsageWidget from "@/Components/Analytics/widgets/HourlyUsageWidget.svelte";
  import ModelPerformanceWidget from "@/Components/Analytics/widgets/ModelPerformanceWidget.svelte";

  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  let analyticsData = $state<AnalyticsData | null>(null);
  let isLoading = $state(false);
  let days = $state(30);
  let autoRefresh = $state(false);
  let autoRefreshInterval = $state<number | null>(null);
  let lastUpdated = $state<Date | null>(null);
  let draggedWidgetId = $state<string | null>(null);
  let dragOverWidgetId = $state<string | null>(null);

  let widgets = $state<WidgetConfig[]>([
    { id: "stats-overview", component: StatsCard, x: 0, y: 0, width: 2, height: 1 },
    { id: "usage-chart", component: UsageChart, x: 0, y: 1, width: 2, height: 2 },
    { id: "model-usage", component: ModelUsageTable, x: 0, y: 3, width: 2, height: 2 },
    { id: "token-distribution", component: TokenDistributionWidget, x: 0, y: 5, width: 1, height: 1 },
    { id: "cost-breakdown", component: CostBreakdownWidget, x: 1, y: 5, width: 1, height: 1 },
    { id: "search-usage", component: SearchUsageWidget, x: 0, y: 6, width: 1, height: 1 },
    { id: "reasoning-usage", component: ReasoningUsageWidget, x: 1, y: 6, width: 1, height: 1 },
    { id: "enhance-usage", component: EnhanceUsageWidget, x: 0, y: 7, width: 1, height: 1 },
    { id: "hourly-usage", component: HourlyUsageWidget, x: 1, y: 7, width: 1, height: 1 },
    { id: "model-performance", component: ModelPerformanceWidget, x: 0, y: 8, width: 1, height: 1 },
    { id: "prompt-usage", component: PromptUsageWidget, x: 1, y: 8, width: 1, height: 1 },
    { id: "conversation-activity", component: ConversationActivityWidget, x: 0, y: 9, width: 2, height: 1 },
  ]);

  interface WidgetConfig {
    id: string;
    component: any;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  function getWidgetTitle(id: string): string {
    const titles: Record<string, string> = {
      "stats-overview": t.analytics?.statsOverview || "Overview",
      "usage-chart": t.analytics?.usageChart || "Usage Trends",
      "model-usage": t.analytics?.modelUsage || "Model Usage",
      "search-usage": t.analytics?.searchUsage || "Search Usage",
      "reasoning-usage": t.analytics?.reasoningUsage || "Reasoning Usage",
      "enhance-usage": t.analytics?.enhanceUsage || "Enhance Usage",
      "prompt-usage": t.analytics?.promptUsage || "Prompt Usage",
      "conversation-activity": t.analytics?.conversationActivity || "Recent Activity",
      "token-distribution": t.analytics?.tokenDistribution || "Token Distribution",
      "cost-breakdown": t.analytics?.costBreakdown || "Cost Breakdown",
      "hourly-usage": t.analytics?.hourlyUsage || "Hourly Usage",
      "model-performance": t.analytics?.modelPerformance || "Model Performance"
    };
    return titles[id] || id;
  }

  onMount(async () => {
    // Check authentication
    if (!authStore.isAuthenticated) {
      navigate("/");
      return;
    }

    // Load settings from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const daysParam = urlParams.get("days");
    if (daysParam) {
      days = parseInt(daysParam);
    }

    loadWidgetLayout();
    await loadAnalytics();
  });

  onDestroy(() => {
    stopAutoRefresh();
  });

  async function loadAnalytics() {
    isLoading = true;
    try {
      const response = await analyticsService.getAnalytics(days);
      if (response.success && response.data) {
        analyticsData = response.data;
        lastUpdated = new Date();
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      isLoading = false;
    }
  }

  function handleDaysChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    days = parseInt(target.value);
    
    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set("days", days.toString());
    window.history.replaceState({}, "", url.toString());
    
    loadAnalytics();
  }

  function handleRefresh() {
    loadAnalytics();
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  function startAutoRefresh() {
    if (autoRefreshInterval) return;
    autoRefreshInterval = window.setInterval(() => {
      loadAnalytics();
    }, 60000); // Refresh every 60 seconds
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }

  function goBack() {
    navigate("/");
  }

  function formatLastUpdated(date: Date): string {
    return new Intl.DateTimeFormat(settingsStore.language as string, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  function handleDragStart(event: DragEvent, widgetId: string) {
    draggedWidgetId = widgetId;
    event.dataTransfer?.setData("text/plain", widgetId);
    event.dataTransfer!.effectAllowed = "move";
  }

  function handleDragOver(event: DragEvent, targetWidgetId: string) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
    if (draggedWidgetId && draggedWidgetId !== targetWidgetId) {
      dragOverWidgetId = targetWidgetId;
    }
  }

  function handleDragLeave() {
    dragOverWidgetId = null;
  }

  function handleDrop(event: DragEvent, targetWidgetId: string) {
    event.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetWidgetId) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidgetId);
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedWidget] = widgets.splice(draggedIndex, 1);
      widgets.splice(targetIndex, 0, draggedWidget);
      saveWidgetLayout();
    }

    draggedWidgetId = null;
    dragOverWidgetId = null;
  }

  function handleDragEnd() {
    draggedWidgetId = null;
    dragOverWidgetId = null;
  }

  function handleKeyDown(event: KeyboardEvent, widgetId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
    }
  }

  function saveWidgetLayout() {
    const layout = widgets.map(w => ({
      id: w.id,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height
    }));
    localStorage.setItem("axiomancer_analytics_page_layout", JSON.stringify(layout));
  }

  function loadWidgetLayout() {
    const saved = localStorage.getItem("axiomancer_analytics_page_layout");
    if (saved) {
      try {
        const layout = JSON.parse(saved);
        widgets = widgets.map(w => {
          const savedLayout = layout.find((l: any) => l.id === w.id);
          return savedLayout ? { ...w, ...savedLayout } : w;
        });
      } catch (error) {
        console.error("Failed to load widget layout:", error);
      }
    }
  }
</script>

<div class="analytics-page" in:fade={{ duration: 300, easing: cubicOut }}>
  <header class="analytics-header">
    <div class="header-left">
      <button class="back-btn" onclick={goBack} title={t.common?.back || "Back"}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <h1>{t.analytics?.title || "Analytics Dashboard"}</h1>
    </div>
    
    <div class="header-actions">
      {#if lastUpdated}
        <span class="last-updated">
          {t.analytics?.lastUpdated || "Last updated"}: {formatLastUpdated(lastUpdated)}
        </span>
      {/if}
      
      <select class="days-selector" onchange={handleDaysChange} value={days}>
        <option value={7}>7 {t.common?.days || "days"}</option>
        <option value={30}>30 {t.common?.days || "days"}</option>
        <option value={90}>90 {t.common?.days || "days"}</option>
        <option value={365}>365 {t.common?.days || "days"}</option>
      </select>
      
      <label class="auto-refresh-toggle" title={t.analytics?.autoRefresh || "Auto refresh"}>
        <input type="checkbox" checked={autoRefresh} onchange={toggleAutoRefresh} />
        <span class="toggle-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </span>
      </label>
      
      <button class="refresh-btn" onclick={handleRefresh} disabled={isLoading} title={t.common?.refresh || "Refresh"}>
        <svg class:spinning={isLoading} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
      </button>
    </div>
  </header>

  <main class="analytics-content">
    {#if isLoading && !analyticsData}
      <div class="loading-state" transition:fade>
        <div class="spinner"></div>
        <p>{t.common?.loading || "Loading..."}</p>
      </div>
    {:else if analyticsData}
      <div class="widgets-grid">
        {#each widgets as widget}
          {@const Component = widget.component}
          <div
            class="widget-wrapper"
            class:width-1={widget.width === 1}
            class:width-2={widget.width === 2}
            class:height-1={widget.height === 1}
            class:height-2={widget.height === 2}
            class:dragging={draggedWidgetId === widget.id}
            class:drag-over={dragOverWidgetId === widget.id && draggedWidgetId !== widget.id}
            draggable="true"
            ondragstart={(e) => handleDragStart(e, widget.id)}
            ondragend={handleDragEnd}
            ondragover={(e) => handleDragOver(e, widget.id)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, widget.id)}
            onkeydown={(e) => handleKeyDown(e, widget.id)}
            data-widget-id={widget.id}
            role="button"
            tabindex="0"
            aria-label="Widget: {getWidgetTitle(widget.id)}"
          >
            <div class="widget-header">
              <div class="widget-title">
                <svg class="drag-handle" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                {getWidgetTitle(widget.id)}
              </div>
            </div>
            <div class="widget-content">
              <Component data={analyticsData} />
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M3 3v18h18"></path>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
        </svg>
        <p>{t.analytics?.noData || "No data available"}</p>
      </div>
    {/if}
  </main>
</div>

<style>
  .analytics-page {
    min-height: 100vh;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
  }

  .analytics-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: var(--bg-hover);
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .analytics-header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .last-updated {
    font-size: 0.85rem;
    color: var(--text-tertiary);
    margin-right: 0.5rem;
  }

  .days-selector {
    padding: 0.5rem 1rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .days-selector option {
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 0.5rem;
  }

  .days-selector:hover,
  .days-selector:focus {
    border-color: var(--accent-primary);
    outline: none;
  }

  .auto-refresh-toggle {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem;
    background: var(--bg-tertiary);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .auto-refresh-toggle:hover {
    border-color: var(--accent-primary);
    background: var(--bg-hover);
  }

  .auto-refresh-toggle:has(input:checked) {
    border-color: var(--math-color);
    background: var(--accent-primary);
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
  }

  .auto-refresh-toggle input {
    display: none;
  }

  .auto-refresh-toggle input:checked + .toggle-label {
    color: white;
  }

  .auto-refresh-toggle:not(:has(input:checked)) .toggle-label {
    color: var(--text-secondary);
  }

  .toggle-label {
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }

  .refresh-btn {
    padding: 0.5rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-btn svg.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .analytics-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .widgets-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .widget-wrapper {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
  }

  .widget-wrapper.width-1 {
    grid-column: span 1;
  }

  .widget-wrapper.width-2 {
    grid-column: span 2;
  }

  .widget-wrapper.height-1 {
    grid-row: span 1;
    min-height: 280px;
  }

  .widget-wrapper.height-2 {
    grid-row: span 2;
    min-height: 400px;
  }

  .widget-wrapper:hover {
    border-color: var(--accent-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .widget-wrapper.dragging {
    opacity: 0.5;
    transform: scale(0.98);
    border: 2px dashed var(--accent-primary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .widget-wrapper.drag-over {
    border: 2px dashed var(--accent-primary);
    background: var(--bg-hover);
    transform: scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }

  .widget-header {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .widget-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .drag-handle {
    color: var(--text-tertiary);
    cursor: grab;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .widget-content {
    flex: 1;
    padding: 1rem;
    overflow: auto;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-state p {
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
    color: var(--text-tertiary);
  }

  .empty-state p {
    font-size: 1.1rem;
  }

  @media (max-width: 1024px) {
    .widgets-grid {
      grid-template-columns: 1fr;
    }

    .widget-wrapper.width-2 {
      grid-column: span 1;
    }

    .analytics-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .last-updated {
      width: 100%;
      margin-bottom: 0.5rem;
    }
  }

  @media (max-width: 640px) {
    .analytics-content {
      padding: 1rem;
    }

    .analytics-header h1 {
      font-size: 1.25rem;
    }

    .header-actions {
      gap: 0.5rem;
    }

    .days-selector {
      font-size: 0.85rem;
      padding: 0.4rem 0.75rem;
    }
  }
</style>
