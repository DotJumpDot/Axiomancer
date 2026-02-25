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

  let total = $derived(data.reasoningUsage?.total || 0);
</script>

<div class="reasoning-usage">
  <div class="chart-box">
    <svg viewBox="0 0 36 36" class="circular-chart">
      <path class="circle-bg"
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      
      {#if total > 0}
        {@const minimalPerc = (data.reasoningUsage.minimal / total) * 100}
        {@const lowPerc = (data.reasoningUsage.low / total) * 100}
        {@const mediumPerc = (data.reasoningUsage.medium / total) * 100}
        {@const highPerc = (data.reasoningUsage.high / total) * 100}

        <!-- Minimal -->
        <path class="circle minimal"
          stroke-dasharray="{minimalPerc}, 100"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- Low -->
        <path class="circle low"
          stroke-dasharray="{lowPerc}, 100"
          stroke-dashoffset="-{minimalPerc}"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- Medium -->
        <path class="circle medium"
          stroke-dasharray="{mediumPerc}, 100"
          stroke-dashoffset="-{minimalPerc + lowPerc}"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- High -->
        <path class="circle high"
          stroke-dasharray="{highPerc}, 100"
          stroke-dashoffset="-{minimalPerc + lowPerc + mediumPerc}"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      {/if}
      <text x="18" y="20.35" class="percentage">{total}</text>
    </svg>
  </div>

  <div class="legend">
    <div class="legend-item">
      <div class="dot minimal"></div>
      <span class="label">{t.analytics?.minimal || "Minimal"}</span>
      <span class="value">{data.reasoningUsage?.minimal || 0}</span>
    </div>
    <div class="legend-item">
      <div class="dot low"></div>
      <span class="label">{t.analytics?.low || "Low"}</span>
      <span class="value">{data.reasoningUsage?.low || 0}</span>
    </div>
    <div class="legend-item">
      <div class="dot medium"></div>
      <span class="label">{t.analytics?.medium || "Medium"}</span>
      <span class="value">{data.reasoningUsage?.medium || 0}</span>
    </div>
    <div class="legend-item">
      <div class="dot high"></div>
      <span class="label">{t.analytics?.high || "High"}</span>
      <span class="value">{data.reasoningUsage?.high || 0}</span>
    </div>
  </div>
</div>

<style>
  .reasoning-usage {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    height: 100%;
    justify-content: center;
  }

  .chart-box {
    width: 140px;
    height: 140px;
  }

  .circular-chart {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 100%;
  }

  .circle-bg {
    fill: none;
    stroke: var(--bg-tertiary);
    stroke-width: 3.8;
  }

  .circle {
    fill: none;
    stroke-width: 3.8;
    stroke-linecap: round;
    transition: stroke-dasharray 0.3s ease;
  }

  .circle.minimal { stroke: #94a3b8; }
  .circle.low { stroke: #3b82f6; }
  .circle.medium { stroke: #8b5cf6; }
  .circle.high { stroke: #f43f5e; }

  .percentage {
    fill: var(--text-primary);
    font-family: sans-serif;
    font-size: 0.5rem;
    font-weight: 700;
    text-anchor: middle;
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .dot.minimal { background: #94a3b8; }
  .dot.low { background: #3b82f6; }
  .dot.medium { background: #8b5cf6; }
  .dot.high { background: #f43f5e; }

  .label {
    color: var(--text-secondary);
    flex: 1;
  }

  .value {
    font-weight: 600;
    color: var(--text-primary);
  }

  @media (max-width: 640px) {
    .reasoning-usage {
      flex-direction: column;
    }
  }
</style>
