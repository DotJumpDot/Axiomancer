<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  interface Props {
    math: string;
  }

  let { math }: Props = $props();
  let copied = $state(false);
  let renderedMath = $state('');
  let mathElement: HTMLElement;

  function handleCopy() {
    navigator.clipboard.writeText(math);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  // Render math using KaTeX on mount
  onMount(() => {
    try {
      renderedMath = katex.renderToString(math, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
    } catch (error) {
      // If rendering fails, show the raw LaTeX
      renderedMath = math;
    }
  });

  // Re-render when math prop changes
  $effect(() => {
    try {
      renderedMath = katex.renderToString(math, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
    } catch (error) {
      // If rendering fails, show the raw LaTeX
      renderedMath = math;
    }
  });
</script>

<div class="math-block-wrapper">
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px;">
    <span class="math-label">Math</span>
    <button class="action-btn" onclick={handleCopy} title="Copy math">
      {#if copied}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      {/if}
    </button>
  </div>
  <div class="math-content" bind:this={mathElement}>
    {@html renderedMath}
  </div>
</div>

<style>
  .math-block-wrapper {
    margin: 8px 0;
    border-radius: 6px;
    overflow: hidden;
    background: var(--math-bg, rgba(31, 240, 240, 0.05));
    border: 1px solid var(--math-border, rgba(31, 240, 240, 0.2));
    transition: background 0.2s ease;
  }

  .math-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--math-color, #1ff0f0);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .action-btn {
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-secondary, #888);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--math-bg-hover, rgba(31, 240, 240, 0.1));
    color: var(--math-color, #1ff0f0);
  }

  .math-content {
    padding: 16px;
    overflow-x: auto;
    color: var(--text-primary, #fff);
    font-size: 16px;
    line-height: 1.6;
  }

  /* KaTeX styling overrides */
  :global(.math-content .katex) {
    font-size: 1.1em;
    color: var(--text-primary, #fff);
  }

  :global(.math-content .katex-display) {
    margin: 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
</style>
