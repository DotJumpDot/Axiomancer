<script lang="ts">
  import { onMount } from "svelte";
  import { settingsStore } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  let canvasElement: HTMLCanvasElement;
  let chart: any = null;

  onMount(() => {
    if (canvasElement && data.dailyUsage) {
      drawChart();
    }
  });

  $effect(() => {
    if (canvasElement && data.dailyUsage) {
      drawChart();
    }
  });

  function drawChart() {
    if (!canvasElement) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const width = canvasElement.width = canvasElement.offsetWidth * 2;
    const height = canvasElement.height = canvasElement.offsetHeight * 2;
    ctx.scale(2, 2);

    const padding = { top: 40, right: 20, bottom: 40, left: 60 };
    const chartWidth = canvasElement.offsetWidth - padding.left - padding.right;
    const chartHeight = canvasElement.offsetHeight - padding.top - padding.bottom;

    const dailyUsage = data.dailyUsage;
    if (!dailyUsage || dailyUsage.length === 0) return;

    const maxMessages = Math.max(...dailyUsage.map((d: any) => d.messages), 1);
    const maxTokens = Math.max(...dailyUsage.map((d: any) => d.tokens), 1);

    ctx.clearRect(0, 0, width, height);

    const messageColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#6366f1';
    const tokenColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#8b5cf6';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#3d3d3d';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#888';

    ctx.font = '11px system-ui, sans-serif';

    const xStep = chartWidth / (dailyUsage.length - 1 || 1);

    function drawGrid() {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight * i) / 5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        const value = Math.round(maxMessages - (maxMessages * i) / 5);
        ctx.fillStyle = textColor;
        ctx.textAlign = 'right';
        ctx.fillText(value.toString(), padding.left - 10, y + 4);
      }

      ctx.setLineDash([]);
    }

    function drawLines(type: 'messages' | 'tokens', color: string) {
      const values = dailyUsage.map((d: any) => d[type]);
      const maxValue = type === 'messages' ? maxMessages : maxTokens;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      values.forEach((value, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      values.forEach((value, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawLabels() {
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';

      const labelInterval = Math.ceil(dailyUsage.length / 7);
      dailyUsage.forEach((d: any, i) => {
        if (i % labelInterval === 0 || i === dailyUsage.length - 1) {
          const x = padding.left + i * xStep;
          const date = new Date(d.date);
          const label = date.toLocaleDateString(settingsStore.language as string, { month: 'short', day: 'numeric' });
          ctx.fillText(label, x, canvasElement.offsetHeight - 10);
        }
      });
    }

    drawGrid();
    drawLines('messages', messageColor);
    drawLines('tokens', tokenColor);
    drawLabels();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(`${t.analytics?.messages || 'Messages'}`, padding.left + 10, 20);
    ctx.fillText(`${t.analytics?.tokens || 'Tokens'}`, padding.left + 80, 20);
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat(settingsStore.language as string).format(num);
  }
</script>

<div class="usage-chart">
  <div class="chart-header">
    <h3>{t.analytics?.usageTrends || "Usage Trends"}</h3>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color messages"></div>
        <span>{t.analytics?.messages || "Messages"}</span>
      </div>
      <div class="legend-item">
        <div class="legend-color tokens"></div>
        <span>{t.analytics?.tokens || "Tokens"}</span>
      </div>
    </div>
  </div>
  <div class="chart-container">
    <canvas bind:this={canvasElement} class="chart-canvas"></canvas>
  </div>
</div>

<style>
  .usage-chart {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 1rem;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chart-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .legend {
    display: flex;
    gap: 1.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .legend-color.messages {
    background: var(--accent-primary);
  }

  .legend-color.tokens {
    background: var(--accent-secondary);
  }

  .chart-container {
    flex: 1;
    min-height: 300px;
    position: relative;
  }

  .chart-canvas {
    width: 100%;
    height: 100%;
  }
</style>
