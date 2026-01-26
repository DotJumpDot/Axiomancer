<script lang="ts">
  import { slide, scale } from "svelte/transition";
  import { cubicOut, elasticOut } from "svelte/easing";
  import { settingsStore, THEME_VARIANTS, THEME_MODES, LANGUAGES, FAVORITE_ICONS, FAVORITE_COLORS } from "@/Store";
  import { getTranslations, type LanguageCode } from "@/Function";

  // Display name color options
  const DISPLAY_NAME_COLORS = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#ef4444", label: "Red" },
    { value: "#22c55e", label: "Green" },
    { value: "#a855f7", label: "Purple" },
    { value: "#f97316", label: "Orange" },
    { value: "#ec4899", label: "Pink" },
    { value: "#14b8a6", label: "Teal" },
    { value: "#fbbf24", label: "Gold" },
  ];

  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();
  let activeTab = $state('general');
  
  // Reset confirmation state for each tab
  let resetConfirmTab = $state<string | null>(null);

  function setActiveTab(tab: string) {
    activeTab = tab;
    resetConfirmTab = null; // Clear reset confirmation when switching tabs
  }

  function handleResetClick(tab: string) {
    if (resetConfirmTab === tab) {
      // Already in confirm mode, do nothing (user should click Confirm or Cancel)
      return;
    }
    resetConfirmTab = tab;
  }

  function handleResetConfirm(tab: string) {
    if (tab === 'general') {
      settingsStore.resetGeneralSettings();
    } else if (tab === 'chat') {
      settingsStore.resetChatSettings();
    } else if (tab === 'conversation') {
      settingsStore.resetConversationSettings();
    }
    resetConfirmTab = null;
  }

  function handleResetCancel() {
    resetConfirmTab = null;
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <div class="preset-popup-header">
        <div>
          <h3>{t.conversationSettings.title}</h3>
          <div class="header-controls">
            <button class="close-btn" onclick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="tabs">
          <button
            class="tab-btn"
            class:active={activeTab === 'general'}
            onclick={() => setActiveTab('general')}
          >
            {t.conversationSettings.general}
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'chat'}
            onclick={() => setActiveTab('chat')}
          >
            {t.conversationSettings.chat}
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'conversation'}
            onclick={() => setActiveTab('conversation')}
          >
            {t.conversationSettings.conversation}
          </button>
        </div>

        <div class="tab-content">
          {#if activeTab === 'general'}
            <div class="tab-pane">
              <!-- Theme Settings -->
              <div class="settings-section">
                <h3>🎨 Theme</h3>

                <div class="setting-item theme-mode-row">
                  <!-- svelte-ignore a11y_label_has_associated_control -->
                  <label>Theme Style & Mode</label>
                  <div class="theme-mode-selectors">
                    <select 
                      id="theme-variant" 
                      bind:value={settingsStore.themeVariant}
                      onchange={(e) => settingsStore.setThemeVariant(e.currentTarget.value as any)}
                      title="Select theme style"
                    >
                      {#each THEME_VARIANTS as theme}
                        <option value={theme.value}>{theme.label}</option>
                      {/each}
                    </select>
                    <select 
                      id="theme-mode" 
                      bind:value={settingsStore.themeMode}
                      onchange={(e) => settingsStore.setThemeMode(e.currentTarget.value as any)}
                      title="Select light or dark mode"
                    >
                      {#each THEME_MODES as mode}
                        <option value={mode.value}>{mode.label}</option>
                      {/each}
                    </select>
                  </div>
                </div>
              </div>

              <!-- Language Settings -->
              <div class="settings-section">
                <h3>🌐 Language</h3>

                <div class="setting-item">
                  <label for="language">Interface Language</label>
                  <select 
                    id="language"
                    bind:value={settingsStore.language}
                    onchange={(e) => settingsStore.setLanguage(e.currentTarget.value as any)}
                  >
                    {#each LANGUAGES as lang}
                      <option value={lang.value}>{lang.label}</option>
                    {/each}
                  </select>
                </div>
              </div>

              <!-- Input Behavior -->
              <div class="settings-section">
                <h3>⌨️ Input Behavior</h3>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Send on Enter</span>
                    <span class="setting-desc">Press Enter to send, Shift+Enter for new line</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.sendOnEnter}
                      onchange={(e) => settingsStore.setSendOnEnter((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Spell Check</span>
                    <span class="setting-desc">Enable browser spell checking in input fields</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.spellCheck}
                      onchange={(e) => settingsStore.setSpellCheck((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Sound Notifications -->
              <div class="settings-section">
                <h3>🔔 Sound Notifications</h3>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Enable Sound Effects</span>
                    <span class="setting-desc">Play sounds on message send/receive</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.soundEnabled}
                      onchange={(e) => settingsStore.setSoundEnabled((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item" class:disabled={!settingsStore.soundEnabled}>
                  <div class="setting-info">
                    <span class="setting-label">Volume</span>
                    <span class="setting-desc">Adjust sound volume ({settingsStore.soundVolume}%)</span>
                  </div>
                  <div class="volume-slider-wrapper">
                    <input
                      type="range"
                      class="volume-slider"
                      min="0"
                      max="100"
                      value={settingsStore.soundVolume}
                      disabled={!settingsStore.soundEnabled}
                      oninput={(e) => settingsStore.setSoundVolume(parseInt((e.target as HTMLInputElement).value))}
                    >
                  </div>
                </div>
              </div>

              <!-- Reset Button -->
              <div class="reset-section">
                {#if resetConfirmTab === 'general'}
                  <div class="reset-confirm" transition:slide={{ duration: 200, easing: cubicOut }}>
                    <span>Reset all General settings to default?</span>
                    <div class="reset-buttons">
                      <button class="reset-cancel-btn" transition:scale={{ duration: 150, easing: cubicOut }} onclick={handleResetCancel}>Cancel</button>
                      <button class="reset-confirm-btn" transition:scale={{ duration: 150, delay: 50, easing: elasticOut }} onclick={() => handleResetConfirm('general')}>Confirm</button>
                    </div>
                  </div>
                {:else}
                  <button class="reset-btn" transition:scale={{ duration: 200, easing: cubicOut }} onclick={() => handleResetClick('general')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                    Reset to Default
                  </button>
                {/if}
              </div>
            </div>
          {:else if activeTab === 'chat'}
            <div class="tab-pane">
              <!-- AI Response Settings -->
              <div class="settings-section">
                <h3>🤖 AI Responses</h3>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">{t.conversationSettings.streamResponses}</span>
                    <span class="setting-desc">Show AI response word-by-word as it generates</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.streamResponses}
                      onchange={(e) => settingsStore.setStreamResponses((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Interface Settings -->
              <div class="settings-section">
                <h3>💬 Chat Interface</h3>

                <div class="setting-item">
                  <label for="font-size">Font Size</label>
                  <select 
                    id="font-size"
                    bind:value={settingsStore.fontSize}
                    onchange={(e) => settingsStore.setFontSize(e.currentTarget.value as any)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Show Message Timestamps</span>
                    <span class="setting-desc">Display time on each message (e.g., 2:34 PM)</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.showMessageTimestamps}
                      onchange={(e) => settingsStore.setShowMessageTimestamps((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Auto-Scroll to Bottom</span>
                    <span class="setting-desc">Automatically scroll to new messages</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.autoScrollToBottom}
                      onchange={(e) => settingsStore.setAutoScrollToBottom((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Auto-Save Drafts</span>
                    <span class="setting-desc">Save message drafts automatically per conversation</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.autoSaveDrafts}
                      onchange={(e) => settingsStore.setAutoSaveDrafts((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Display Names -->
              <div class="settings-section">
                <h3>🏷️ Display Names</h3>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Your Name</span>
                    <span class="setting-desc">How your messages are labeled in chat</span>
                  </div>
                  <div class="name-input-group">
                    <input
                      type="text"
                      class="text-input"
                      value={settingsStore.userDisplayName}
                      placeholder="You"
                      maxlength="20"
                      onchange={(e) => settingsStore.setUserDisplayName((e.target as HTMLInputElement).value)}
                    >
                    <div class="color-picker-wrapper">
                      <input
                        type="color"
                        class="color-picker"
                        value={settingsStore.userDisplayNameColor}
                        onchange={(e) => settingsStore.setUserDisplayNameColor((e.target as HTMLInputElement).value)}
                        title="Your name color"
                      >
                    </div>
                  </div>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">AI Name</span>
                    <span class="setting-desc">How AI messages are labeled in chat</span>
                  </div>
                  <div class="name-input-group">
                    <input
                      type="text"
                      class="text-input"
                      value={settingsStore.aiDisplayName}
                      placeholder="AI"
                      maxlength="20"
                      onchange={(e) => settingsStore.setAiDisplayName((e.target as HTMLInputElement).value)}
                    >
                    <div class="color-picker-wrapper">
                      <input
                        type="color"
                        class="color-picker"
                        value={settingsStore.aiDisplayNameColor}
                        onchange={(e) => settingsStore.setAiDisplayNameColor((e.target as HTMLInputElement).value)}
                        title="AI name color"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Reset Button -->
              <div class="reset-section">
                {#if resetConfirmTab === 'chat'}
                  <div class="reset-confirm" transition:slide={{ duration: 200, easing: cubicOut }}>
                    <span>Reset all Chat settings to default?</span>
                    <div class="reset-buttons">
                      <button class="reset-cancel-btn" transition:scale={{ duration: 150, easing: cubicOut }} onclick={handleResetCancel}>Cancel</button>
                      <button class="reset-confirm-btn" transition:scale={{ duration: 150, delay: 50, easing: elasticOut }} onclick={() => handleResetConfirm('chat')}>Confirm</button>
                    </div>
                  </div>
                {:else}
                  <button class="reset-btn" transition:scale={{ duration: 200, easing: cubicOut }} onclick={() => handleResetClick('chat')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                    Reset to Default
                  </button>
                {/if}
              </div>
            </div>
          {:else if activeTab === 'conversation'}
            <div class="tab-pane">
              <!-- Favorite Settings -->
              <div class="settings-section">
                <h3>⭐ Favorites</h3>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Double-Click to Favorite</span>
                    <span class="setting-desc">Double-click a conversation to toggle favorite status</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.doubleClickFavorite}
                      onchange={(e) => settingsStore.setDoubleClickFavorite((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="setting-item">
                  <label for="favorite-icon">Favorite Icon</label>
                  <select 
                    id="favorite-icon"
                    bind:value={settingsStore.favoriteIcon}
                    onchange={(e) => settingsStore.setFavoriteIcon(e.currentTarget.value as any)}
                  >
                    {#each FAVORITE_ICONS as icon}
                      <option value={icon.value}>{icon.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="setting-item">
                  <label for="favorite-color">Favorite Color</label>
                  <div class="color-select-wrapper">
                    <select 
                      id="favorite-color"
                      bind:value={settingsStore.favoriteColor}
                      onchange={(e) => settingsStore.setFavoriteColor(e.currentTarget.value as any)}
                    >
                      {#each FAVORITE_COLORS as color}
                        <option value={color.value}>{color.label}</option>
                      {/each}
                    </select>
                    <span class="color-preview" style="background-color: {FAVORITE_COLORS.find(c => c.value === settingsStore.favoriteColor)?.color || '#fbbf24'}"></span>
                  </div>
                </div>
              </div>

              <!-- Conversation Behavior -->
              <div class="settings-section">
                <h3>📝 Behavior</h3>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Disable Click-to-Rename</span>
                    <span class="setting-desc">Prevent accidental renaming when clicking conversation titles</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.disableClickRename}
                      onchange={(e) => settingsStore.setDisableClickRename((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Date Display -->
              <div class="settings-section">
                <h3>📅 Date Display</h3>

                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Show Relative Time</span>
                    <span class="setting-desc">Show "5d ago" instead of full date</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settingsStore.showRelativeTime}
                      onchange={(e) => settingsStore.setShowRelativeTime((e.target as HTMLInputElement).checked)}
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Reset Button -->
              <div class="reset-section">
                {#if resetConfirmTab === 'conversation'}
                  <div class="reset-confirm" transition:slide={{ duration: 200, easing: cubicOut }}>
                    <span>Reset all Conversation settings to default?</span>
                    <div class="reset-buttons">
                      <button class="reset-cancel-btn" transition:scale={{ duration: 150, easing: cubicOut }} onclick={handleResetCancel}>Cancel</button>
                      <button class="reset-confirm-btn" transition:scale={{ duration: 150, delay: 50, easing: elasticOut }} onclick={() => handleResetConfirm('conversation')}>Confirm</button>
                    </div>
                  </div>
                {:else}
                  <button class="reset-btn" transition:scale={{ duration: 200, easing: cubicOut }} onclick={() => handleResetClick('conversation')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                    Reset to Default
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--bg-primary, #1a1a1a);
    border: 1px solid var(--border-color, #2d2d2d);
    border-radius: 16px;
    width: 1000px;
    height: 90vh;
    max-width: 95vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideIn 0.25s ease-out;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px) scale(0.98);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  .preset-popup-header {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color, #2d2d2d);
    background: var(--bg-secondary, #1f1f1f);
  }

  .preset-popup-header > div:first-child {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .preset-popup-header h3 {
    margin: 0;
    color: var(--text-primary, #fff);
    font-size: 20px;
    font-weight: 600;
  }

  .preset-popup-header .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .preset-popup-header .close-btn {
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 8px;
    color: #ff6666;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .preset-popup-header .close-btn:hover {
    background: rgba(255, 68, 68, 0.2);
    border-color: rgba(255, 68, 68, 0.5);
    color: #ff4444;
    transform: scale(1.05);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .modal-body::-webkit-scrollbar {
    width: 6px;
  }

  .modal-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .modal-body::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border-color, #2d2d2d);
    background: var(--bg-secondary, #1f1f1f);
  }

  .tab-btn {
    flex: 1;
    padding: 14px 20px;
    background: transparent;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
    position: relative;
  }

  .tab-btn:hover {
    color: var(--text-primary, #fff);
    background: rgba(255, 255, 255, 0.03);
  }

  .tab-btn.active {
    color: var(--primary-color, #6366f1);
    border-bottom-color: var(--primary-color, #6366f1);
    background: rgba(99, 102, 241, 0.05);
  }

  .tab-content {
    flex: 1;
    padding: 24px;
  }

  .tab-pane {
    color: var(--text-primary, #fff);
  }

  .settings-section {
    margin-bottom: 28px;
    padding: 20px;
    background: var(--input-bg, rgba(255, 255, 255, 0.02));
    border-radius: 12px;
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    transition: all 0.3s ease;
  }

  .settings-section:last-child {
    margin-bottom: 0;
  }

  .settings-section:hover {
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .settings-section h3 {
    margin: 0 0 16px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary, #fff);
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    gap: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .setting-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .setting-item:first-child {
    padding-top: 0;
  }

  .setting-item label {
    font-size: 14px;
    color: var(--text-primary, #fff);
    font-weight: 500;
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .setting-label {
    font-size: 14px;
    color: var(--text-primary, #fff);
    font-weight: 500;
  }

  .setting-desc {
    font-size: 12px;
    color: var(--text-secondary, #888);
    font-weight: 400;
  }

  /* Toggle Switch Styles */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 26px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: #fff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch input:checked + .toggle-slider {
    background: linear-gradient(135deg, var(--primary-color, #6366f1), var(--primary-color-hover, #818cf8));
    border-color: var(--primary-color, #6366f1);
  }

  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }

  .toggle-switch input:focus + .toggle-slider {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  .toggle-switch:hover .toggle-slider {
    border-color: rgba(255, 255, 255, 0.3);
  }

  .toggle-switch input:checked:hover + .toggle-slider {
    border-color: var(--primary-color-hover, #818cf8);
  }

  .setting-item select {
    min-width: 140px;
    padding: 10px 14px;
    background: var(--input-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 14px;
    padding-right: 36px;
  }

  .setting-item select:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .setting-item select:hover {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .setting-item select option {
    background: var(--bg-secondary, #2d2d2d);
    color: var(--text-primary, #fff);
    padding: 10px;
  }

  /* Theme and Mode Row */
  .theme-mode-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .theme-mode-row label {
    margin-bottom: 4px;
  }

  .theme-mode-selectors {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .theme-mode-selectors select {
    flex: 1;
    min-width: 0;
  }

  /* Text Input Styles */
  .text-input {
    min-width: 140px;
    max-width: 160px;
    padding: 10px 14px;
    background: var(--input-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .text-input:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .text-input:hover {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .text-input::placeholder {
    color: var(--text-secondary, #888);
  }

  /* Name Input Group with Color Picker */
  .name-input-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .color-picker-wrapper {
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
  }

  .color-picker {
    width: 100%;
    height: 100%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    background: transparent;
    transition: all 0.2s ease;
  }

  .color-picker::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  .color-picker::-webkit-color-swatch {
    border-radius: 4px;
    border: none;
  }

  .color-picker::-moz-color-swatch {
    border-radius: 4px;
    border: none;
  }

  .color-picker:hover {
    border-color: var(--primary-color, #6366f1);
    transform: scale(1.05);
  }

  .color-picker:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  /* Color Select with Preview */
  .color-select-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .color-preview {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  /* Reset Button Styles */
  .reset-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    display: flex;
    justify-content: flex-end;
    min-height: 50px;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    color: var(--text-secondary, #888);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.25);
    color: var(--text-primary, #fff);
  }

  .reset-confirm {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    justify-content: flex-end;
  }

  .reset-confirm span {
    color: var(--text-secondary, #888);
    font-size: 13px;
  }

  .reset-buttons {
    display: flex;
    gap: 8px;
  }

  .reset-cancel-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
    border-radius: 6px;
    color: var(--text-secondary, #888);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-cancel-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-primary, #fff);
  }

  .reset-confirm-btn {
    padding: 8px 16px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    color: #f87171;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-confirm-btn:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    color: #ef4444;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .modal-content {
      width: 100%;
      height: 100%;
      max-height: 100vh;
      border-radius: 0;
    }

    .theme-mode-selectors {
      flex-direction: column;
    }

    .reset-confirm {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .reset-confirm span {
      text-align: center;
    }

    .reset-buttons {
      justify-content: center;
    }
  }
</style>