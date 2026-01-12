<script lang="ts">
  interface Props {
    code: string;
    language?: string;
  }

  let { code, language = "text" }: Props = $props();
  let copied = $state(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<div class="code-block-wrapper">
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px;">
    <span class="language-label">{language}</span>
    <button class="action-btn" onclick={handleCopy} title="Copy code">
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
  <pre class="code-block"><code>{code}</code></pre>
</div>

<style>
  .code-block-wrapper {
    margin: 8px 0;
    border-radius: 6px;
    overflow: hidden;
    background: #f5f5f5; /* Grey background by default */
    border: 1px solid var(--border-color, #3d3d3d);
    transition: background 0.2s ease;
  }

  .code-block-wrapper:hover {
    background: var(--code-bg, #1e1e1e); /* Dark background on hover */
  }

  /* .code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--code-header-bg, #2d2d2d);
    border-bottom: 1px solid var(--border-color, #3d3d3d);
  } */

  .code-block-wrapper {
    margin: 8px 0;
    border-radius: 6px;
    overflow: hidden;
    background: #141414; /* Grey background by default */
    /* border: 1px solid var(--border-color, #3d3d3d); */
    transition: background 0.2s ease;
  }

  .code-block-wrapper:hover {
    background: var(--code-bg, #1e1e1e); /* Dark background on hover */
  }

  .language-label {
    font-size: 12px;
    font-weight: 500;
    color: #666; /* Dark grey for grey background */
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.2s ease;
  }

  .code-block-wrapper:hover .language-label {
    color: var(--text-secondary, #888); /* Light for dark background */
  }

  .action-btn {
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #666; /* Dark grey for grey background */
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--hover-bg, #3d3d3d);
    color: var(--text-primary, #fff);
  }

  .code-block-wrapper:hover .action-btn {
    color: var(--text-secondary, #888); /* Light for dark background */
  }

  .code-block {
    margin: 0;
    padding: 12px;
    overflow-x: auto;
    font-family: "Consolas", "Monaco", "Courier New", monospace;
    font-size: 13px;
    line-height: 1.5;
    background: transparent; /* Let wrapper handle background */
    color: #333; /* Dark text for grey background */
    transition: color 0.2s ease;
  }

  .code-block-wrapper:hover .code-block {
    color: var(--code-text, #d4d4d4); /* Light text for dark background */
  }

  .code-block code {
    font-family: inherit;
    font-size: inherit;
    background: transparent;
    padding: 0;
    border: none;
  }
</style>
