// Settings Store - Svelte 5 runes for app settings

// Available theme options
export const THEME_VARIANTS = [
  { value: "classic", label: "Classic" },
  { value: "monokai", label: "Monokai" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "gruvbox", label: "Gruvbox" },
  { value: "solarized", label: "Solarized" },
  { value: "github", label: "GitHub" },
] as const;

export const THEME_MODES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "th", label: "ไทย (Thai)" },
] as const;

// Reactive state using Svelte 5 runes
let themeVariant = $state<
  "classic" | "monokai" | "dracula" | "nord" | "gruvbox" | "solarized" | "github"
>("classic");
let themeMode = $state<"dark" | "light">("dark");
let sidebarOpen = $state(true);
let fontSize = $state<"small" | "medium" | "large">("medium");
let sendOnEnter = $state(true);
let streamResponses = $state(true);
let language = $state<"en" | "th">("en");

// Persist settings to localStorage
function saveSettings() {
  const settings = {
    themeVariant,
    themeMode,
    sidebarOpen,
    fontSize,
    sendOnEnter,
    streamResponses,
    language,
  };
  localStorage.setItem("axiomancer_settings", JSON.stringify(settings));
}

function loadSettings() {
  const stored = localStorage.getItem("axiomancer_settings");
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      // Handle backward compatibility with old combined theme values
      if (settings.theme) {
        const oldTheme = settings.theme;
        if (oldTheme.includes("-")) {
          const [variant, mode] = oldTheme.split("-");
          themeVariant = variant;
          themeMode = mode;
        } else if (oldTheme === "dark" || oldTheme === "system") {
          themeVariant = "classic";
          themeMode = "dark";
        } else if (oldTheme === "light") {
          themeVariant = "classic";
          themeMode = "light";
        }
      } else {
        themeVariant = settings.themeVariant ?? "classic";
        themeMode = settings.themeMode ?? "dark";
      }
      sidebarOpen = settings.sidebarOpen ?? true;
      fontSize = settings.fontSize ?? "medium";
      sendOnEnter = settings.sendOnEnter ?? true;
      streamResponses = settings.streamResponses ?? true;
      language = settings.language ?? "en";
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }
  applyTheme();
}

function setThemeVariant(
  variant: "classic" | "monokai" | "dracula" | "nord" | "gruvbox" | "solarized" | "github"
) {
  themeVariant = variant;
  applyTheme();
  saveSettings();
}

function setThemeMode(mode: "dark" | "light") {
  themeMode = mode;
  applyTheme();
  saveSettings();
}

function toggleThemeMode() {
  themeMode = themeMode === "dark" ? "light" : "dark";
  applyTheme();
  saveSettings();
}

function applyTheme() {
  const root = document.documentElement;

  // Set data-theme for light/dark
  root.setAttribute("data-theme", themeMode);

  // Set data-theme-variant for theme style
  root.setAttribute("data-theme-variant", themeVariant);
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

function setLanguage(newLanguage: "en" | "th") {
  language = newLanguage;
  saveSettings();
}

// Export store object with getters for reactive access
export const settingsStore = {
  get themeVariant() {
    return themeVariant;
  },
  get themeMode() {
    return themeMode;
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
  get language() {
    return language;
  },

  loadSettings,
  saveSettings,
  setThemeVariant,
  setThemeMode,
  toggleThemeMode,
  THEME_VARIANTS,
  THEME_MODES,
  LANGUAGES,
  toggleSidebar,
  setSidebarOpen,
  setFontSize,
  setSendOnEnter,
  setStreamResponses,
  setLanguage,
};

export default settingsStore;
