// Settings Store - Svelte 5 runes for app settings
// Reactive state using Svelte 5 runes
let theme = $state<"light" | "dark" | "system">("system");
let sidebarOpen = $state(true);
let fontSize = $state<"small" | "medium" | "large">("medium");
let sendOnEnter = $state(true);
let streamResponses = $state(true);

// Persist settings to localStorage
function saveSettings() {
  const settings = {
    theme,
    sidebarOpen,
    fontSize,
    sendOnEnter,
    streamResponses,
  };
  localStorage.setItem("axiomancer_settings", JSON.stringify(settings));
}

function loadSettings() {
  const stored = localStorage.getItem("axiomancer_settings");
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      theme = settings.theme ?? "system";
      sidebarOpen = settings.sidebarOpen ?? true;
      fontSize = settings.fontSize ?? "medium";
      sendOnEnter = settings.sendOnEnter ?? true;
      streamResponses = settings.streamResponses ?? true;
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }
  applyTheme();
}

function setTheme(newTheme: "light" | "dark" | "system") {
  theme = newTheme;
  applyTheme();
  saveSettings();
}

function applyTheme() {
  const root = document.documentElement;
  let effectiveTheme = theme;

  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  root.setAttribute("data-theme", effectiveTheme);
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  saveSettings();
}

function setSidebarOpen(open: boolean) {
  sidebarOpen = open;
  saveSettings();
}

function setFontSize(size: "small" | "medium" | "large") {
  fontSize = size;
  saveSettings();
}

function setSendOnEnter(enabled: boolean) {
  sendOnEnter = enabled;
  saveSettings();
}

function setStreamResponses(enabled: boolean) {
  streamResponses = enabled;
  saveSettings();
}

// Export store object with getters for reactive access
export const settingsStore = {
  get theme() {
    return theme;
  },
  get sidebarOpen() {
    return sidebarOpen;
  },
  get fontSize() {
    return fontSize;
  },
  get sendOnEnter() {
    return sendOnEnter;
  },
  get streamResponses() {
    return streamResponses;
  },

  loadSettings,
  saveSettings,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setFontSize,
  setSendOnEnter,
  setStreamResponses,
};

export default settingsStore;
