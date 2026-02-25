<script lang="ts">
  import { onMount } from "svelte";
  import { slide, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { settingsStore, authStore } from "@/Store";
  import { analyticsService } from "@/Service/analyticsService";
  import type { AnalyticsData } from "@/Service/analyticsService";
  import { getTranslations, type LanguageCode } from "@/Function";
  import StatsCard from "./widgets/StatsCard.svelte";
  import UsageChart from "./widgets/UsageChart.svelte";
  import ModelUsageTable from "./widgets/ModelUsageTable.svelte";
  import SearchUsageWidget from "./widgets/SearchUsageWidget.svelte";
  import ReasoningUsageWidget from "./widgets/ReasoningUsageWidget.svelte";
  import PromptUsageWidget from "./widgets/PromptUsageWidget.svelte";
  import ConversationActivityWidget from "./widgets/ConversationActivityWidget.svelte";

  interface AnalyticsDialogProps {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = $bindable(false), onClose }: AnalyticsDialogProps = $props();

  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  let analyticsData = $state<AnalyticsData | null>(null);
  let isLoading = $state(false);
  let days = $state(30);
  let draggedWidgetId = $state<string | null>(null);
  let dragOverWidgetId = $state<string | null>(null);
  let hasAttemptedLoad = $state(false);

  let widgets = $state<WidgetConfig[]>([
    { id: "stats-overview", component: StatsCard, x: 0, y: 0, width: 2, height: 1 },
    { id: "usage-chart", component: UsageChart, x: 0, y: 1, width: 2, height: 2 },
    { id: "model-usage", component: ModelUsageTable, x: 0, y: 3, width: 2, height: 2 },
    { id: "search-usage", component: SearchUsageWidget, x: 0, y: 5, width: 1, height: 1 },
    { id: "reasoning-usage", component: ReasoningUsageWidget, x: 1, y: 5, width: 1, height: 1 },
    { id: "prompt-usage", component: PromptUsageWidget, x: 0, y: 6, width: 1, height: 1 },
    { id: "conversation-activity", component: ConversationActivityWidget, x: 1, y: 6, width: 1, height: 1 },
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
      "prompt-usage": t.analytics?.promptUsage || "Prompt Usage",
      "conversation-activity": t.analytics?.conversationActivity || "Recent Activity"
    };
    return titles[id] || id;
  }

  onMount(async () => {
    loadWidgetLayout();
  });

  $effect(() => {
    if (isOpen && authStore.isAuthenticated && !analyticsData && !isLoading && !hasAttemptedLoad) {
      loadAnalytics();
    }
  });

  $effect(() => {
    if (!isOpen) {
      hasAttemptedLoad = false;
    }
  });

  async function loadAnalytics() {
    isLoading = true;
    hasAttemptedLoad = true;
    try {
      const response = await analyticsService.getAnalytics(days);
      console.log("Analytics response:", $state.snapshot(response));
      if (response.success && response.data) {
        analyticsData = response.data;
        console.log("Analytics data loaded:", $state.snapshot(analyticsData));
        console.log("Most used models:", $state.snapshot(analyticsData.mostUsedModels));
        console.log("Daily usage:", $state.snapshot(analyticsData.dailyUsage));
      } else {
        console.error("Invalid response:", response);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      isLoading = false;
    }
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
    localStorage.setItem("axiomancer_analytics_layout", JSON.stringify(layout));
  }

  function loadWidgetLayout() {
    const saved = localStorage.getItem("axiomancer_analytics_layout");
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

  function handleDaysChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    days = parseInt(target.value);
    loadAnalytics();
  }

  function openInNewTab() {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("analytics", "true");
    url.searchParams.set("days", days.toString());
    window.open(url.toString(), "_blank");
  }

  function closeDialog() {
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeDialog();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (backdrop click-to-close) -->
  <div class="analytics-backdrop" transition:fade={{ duration: 200, easing: cubicOut }} onclick={closeDialog}></div>
  <div class="analytics-dialog" transition:slide={{ duration: 300, easing: cubicOut }}>
    <div class="analytics-header">
      <h2>{t.analytics?.title || "Analytics"}</h2>
      <div class="header-actions">
        <select class="days-selector" onchange={handleDaysChange} value={days}>
          <option value={7}>7 {t.common?.days || "days"}</option>
          <option value={30}>30 {t.common?.days || "days"}</option>
          <option value={90}>90 {t.common?.days || "days"}</option>
          <option value={365}>365 {t.common?.days || "days"}</option>
        </select>
        <button class="new-tab-btn" onclick={openInNewTab} title={t.analytics?.openInNewTab || "Open in new tab"}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
        <button class="close-btn" onclick={closeDialog} title={t.common?.close || "Close"}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    {#if isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{t.common?.loading || "Loading..."}</p>
      </div>
    {:else if analyticsData}
      <div class="analytics-content">
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
  </div>
{/if}

<style>
  .analytics-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 999;
  }

  .analytics-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 95%;
    max-width: 1400px;
    height: 90vh;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .analytics-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }

  .analytics-header h2 {
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

  .new-tab-btn {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .new-tab-btn:hover {
    background: var(--bg-hover);
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .analytics-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .widgets-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    grid-auto-rows: minmax(280px, auto);
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
  }

  .widget-wrapper.height-2 {
    grid-row: span 2;
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
    transition: all 0.15s ease-out;
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
    height: 100%;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-tertiary);
    gap: 1rem;
  }

  .empty-state svg {
    opacity: 0.3;
  }

  .empty-state p {
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    .widgets-grid {
      grid-template-columns: 1fr;
    }

    .widget-wrapper.width-2 {
      grid-column: span 1;
    }

    .analytics-dialog {
      width: 100%;
      height: 100%;
      border-radius: 0;
    }
  }
</style>
