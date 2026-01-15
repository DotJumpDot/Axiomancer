<script lang="ts">
  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();
  let activeTab = $state('general');

  function setActiveTab(tab: string) {
    activeTab = tab;
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
          <h3>Conversation Settings</h3>
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
            General
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'chat'}
            onclick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'conversation'}
            onclick={() => setActiveTab('conversation')}
          >
            Conversation
          </button>
        </div>

        <div class="tab-content">
          {#if activeTab === 'general'}
            <div class="tab-pane">
              <!-- General Application Settings -->
              <div class="settings-section">
                <h3>Application</h3>

                <div class="setting-item">
                  <label for="app-theme">Application Theme</label>
                  <select id="app-theme">
                    <option value="dark">Dark</option>
                    <option value="darker">Darker</option>
                    <option value="auto">Auto (System)</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label for="language">Language</label>
                  <select id="language">
                    <option value="en" selected>English</option>
                    <option value="th">ไทย (Thai)</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="auto-save" checked>
                    Auto-save conversations
                  </label>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="sound-effects">
                    Enable sound effects
                  </label>
                </div>
              </div>

              <!-- Performance Settings -->
              <div class="settings-section">
                <h3>Performance</h3>

                <div class="setting-item">
                  <label for="max-conversations">Max Conversations in Memory</label>
                  <select id="max-conversations">
                    <option value="50">50</option>
                    <option value="100" selected>100</option>
                    <option value="200">200</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="lazy-load">
                    Lazy load conversation history
                  </label>
                </div>
              </div>

              <!-- Privacy Settings -->
              <div class="settings-section">
                <h3>Privacy</h3>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="analytics">
                    Send anonymous usage analytics
                  </label>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="error-reporting" checked>
                    Automatic error reporting
                  </label>
                </div>
              </div>
            </div>
          {:else if activeTab === 'chat'}
            <div class="tab-pane">
              <!-- Chat Interface Settings -->
              <div class="settings-section">
                <h3>Interface</h3>

                <div class="setting-item">
                  <label for="chat-font-size">Chat Font Size</label>
                  <select id="chat-font-size">
                    <option value="12">Small</option>
                    <option value="14" selected>Medium</option>
                    <option value="16">Large</option>
                    <option value="18">Extra Large</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label for="message-spacing">Message Spacing</label>
                  <select id="message-spacing">
                    <option value="compact">Compact</option>
                    <option value="normal" selected>Normal</option>
                    <option value="comfortable">Comfortable</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="show-avatars" checked>
                    Show user avatars
                  </label>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="markdown-preview">
                    Live markdown preview
                  </label>
                </div>
              </div>

              <!-- Model Settings -->
              <div class="settings-section">
                <h3>AI Models</h3>

                <div class="setting-item">
                  <label for="default-model">Default Model</label>
                  <select id="default-model">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo" selected>GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="model-switching">
                    Allow automatic model switching
                  </label>
                </div>
              </div>

              <!-- Behavior Settings -->
              <div class="settings-section">
                <h3>Behavior</h3>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="auto-scroll" checked>
                    Auto-scroll to new messages
                  </label>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="typing-indicators">
                    Show typing indicators
                  </label>
                </div>

                <div class="setting-item">
                  <label for="max-tokens">Max Response Length</label>
                  <select id="max-tokens">
                    <option value="500">Short (500 tokens)</option>
                    <option value="1000" selected>Medium (1000 tokens)</option>
                    <option value="2000">Long (2000 tokens)</option>
                    <option value="4000">Very Long (4000 tokens)</option>
                  </select>
                </div>
              </div>
            </div>
          {:else if activeTab === 'conversation'}
            <div class="tab-pane">
              <!-- Conversation Appearance Settings -->
              <div class="settings-section">
                <h3>Appearance</h3>

                <div class="setting-item">
                  <label for="fav-title-color">Favorite Title Color</label>
                  <input type="color" id="fav-title-color" value="#ffc107">
                </div>

                <div class="setting-item">
                  <label for="conversation-bg-color">Conversation Background Color</label>
                  <input type="color" id="conversation-bg-color" value="#1a1a1a">
                </div>

                <div class="setting-item">
                  <label for="fontsize">Font Size</label>
                  <select id="fontsize">
                    <option value="12">Small (12px)</option>
                    <option value="14" selected>Medium (14px)</option>
                    <option value="16">Large (16px)</option>
                    <option value="18">Extra Large (18px)</option>
                  </select>
                </div>
              </div>

              <!-- Favorite Settings -->
              <div class="settings-section">
                <h3>Favorites</h3>

                <div class="setting-item">
                  <label for="fav-icon">Favorite Icon Style</label>
                  <select id="fav-icon">
                    <option value="star">⭐ Star</option>
                    <option value="heart">❤️ Heart</option>
                    <option value="bookmark">🔖 Bookmark</option>
                    <option value="thumb">👍 Thumb Up</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="show-fav-badge">
                    Show Favorite Badge on Conversations
                  </label>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="auto-fav" checked>
                    Auto-favorite new conversations
                  </label>
                </div>
              </div>

              <!-- Interaction Settings -->
              <div class="settings-section">
                <h3>Interactions</h3>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="double-click-fav" checked>
                    Double-click to favorite/unfavorite
                  </label>
                </div>

                <div class="setting-item">
                  <label class="checkbox-label">
                    <input type="checkbox" id="show-timestamps">
                    Show conversation timestamps
                  </label>
                </div>

                <div class="setting-item">
                  <label for="max-title-length">Max Title Length</label>
                  <input type="number" id="max-title-length" value="25" min="10" max="50">
                </div>
              </div>

              <!-- Theme Settings -->
              <div class="settings-section">
                <h3>Theme</h3>

                <div class="setting-item">
                  <label for="sidebar-theme">Sidebar Theme</label>
                  <select id="sidebar-theme">
                    <option value="dark">Dark</option>
                    <option value="darker">Darker</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label for="accent-color">Accent Color</label>
                  <input type="color" id="accent-color" value="#6366f1">
                </div>
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--bg-primary, #1a1a1a);
    border: 1px solid var(--border-color, #2d2d2d);
    border-radius: 12px;
    width: 1200px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .preset-popup-header {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color, #2d2d2d);
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
    font-size: 18px;
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
    border-radius: 6px;
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
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
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
  }

  .tab-btn {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
  }

  .tab-btn:hover {
    color: var(--text-primary, #fff);
  }

  .tab-btn.active {
    color: var(--primary-color, #6366f1);
    border-bottom-color: var(--primary-color, #6366f1);
  }

  .tab-content {
    flex: 1;
  }

  .tab-pane {
    padding: 16px 0;
    color: var(--text-primary, #fff);
  }

  .tab-pane p {
    margin: 0;
    color: var(--text-secondary, #888);
  }

  .settings-section {
    margin-bottom: 32px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .settings-section:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .settings-section h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary, #fff);
    background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.025em;
    position: relative;
  }

  .settings-section h3::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 30px;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color, #6366f1), transparent);
    border-radius: 1px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .setting-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .setting-item:last-child {
    margin-bottom: 0;
  }

  .setting-item label {
    flex: 1;
    font-size: 14px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  .setting-item:hover label {
    color: rgba(255, 255, 255, 0.9);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    margin: 0;
  }

  .setting-item input[type="color"] {
    width: 48px;
    height: 36px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  .setting-item input[type="color"]:hover {
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .setting-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary-color, #6366f1);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .setting-item input[type="checkbox"]:hover {
    transform: scale(1.1);
  }

  .setting-item input[type="number"] {
    width: 80px;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  .setting-item input[type="number"]:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(255, 255, 255, 0.02));
  }

  .setting-item input[type="number"]:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .setting-item select {
    min-width: 140px;
    padding: 10px 14px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 40px;
  }

  .setting-item select:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(255, 255, 255, 0.02));
  }

  .setting-item select:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .setting-item select option {
    background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
    color: var(--text-primary, #fff);
    padding: 8px;
  }
</style>