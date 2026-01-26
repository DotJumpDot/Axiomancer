// Settings Store - Svelte 5 runes for app settings

// Available theme options
export const THEME_VARIANTS = [
  { value: "classic", label: "Classic" },
  { value: "monokai", label: "Monokai" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "gruvbox", label: "Gruvbox" },
  { value: "solarized", label: "Solarized" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "matrix", label: "Matrix" },
  { value: "arcade", label: "Arcade" },
  { value: "arcade-neon", label: "Arcade Neon" },
  { value: "retro", label: "Retro" },
  { value: "vaporwave", label: "Vaporwave" },
  { value: "vaporwave-synth", label: "Vaporwave Synth" },
  { value: "vaporwave-retro", label: "Vaporwave Retro" },
  { value: "rainbow", label: "Rainbow" },
  { value: "terminal", label: "Terminal" },
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

export const FAVORITE_ICONS = [
  { value: "star", label: "⭐ Star" },
  { value: "heart", label: "❤️ Heart" },
  { value: "bookmark", label: "🔖 Bookmark" },
  { value: "pin", label: "📌 Pin" },
] as const;

export const FAVORITE_COLORS = [
  { value: "gold", label: "Gold", color: "#fbbf24" },
  { value: "red", label: "Red", color: "#ef4444" },
  { value: "pink", label: "Pink", color: "#ec4899" },
  { value: "purple", label: "Purple", color: "#a855f7" },
  { value: "blue", label: "Blue", color: "#3b82f6" },
  { value: "green", label: "Green", color: "#22c55e" },
] as const;

// Font size CSS mapping
const FONT_SIZE_MAP = {
  small: "13px",
  medium: "15px",
  large: "17px",
} as const;

// Reactive state using Svelte 5 runes
let themeVariant = $state<
  | "classic"
  | "monokai"
  | "dracula"
  | "nord"
  | "gruvbox"
  | "solarized"
  | "cyberpunk"
  | "matrix"
  | "arcade"
  | "arcade-neon"
  | "arcade-retro"
  | "retro"
  | "vaporwave"
  | "vaporwave-synth"
  | "vaporwave-retro"
  | "rainbow"
  | "terminal"
  | "github"
>("classic");
let themeMode = $state<"dark" | "light">("dark");
let sidebarOpen = $state(true);
let fontSize = $state<"small" | "medium" | "large">("medium");
let sendOnEnter = $state(true);
let streamResponses = $state(true);
let language = $state<"en" | "th">("en");

// New settings - General
let spellCheck = $state(true);

// New settings - Conversation tab
let doubleClickFavorite = $state(true);
let disableClickRename = $state(false);
let favoriteIcon = $state<"star" | "heart" | "bookmark" | "pin">("star");
let favoriteColor = $state<"gold" | "red" | "pink" | "purple" | "blue" | "green">("gold");
let showRelativeTime = $state(true);

// New settings - Chat tab
let userDisplayName = $state("You");
let aiDisplayName = $state("AI");
let userDisplayNameColor = $state("#3b82f6"); // Blue
let aiDisplayNameColor = $state("#a855f7"); // Purple
let showMessageTimestamps = $state(true);
let autoScrollToBottom = $state(true);
let autoSaveDrafts = $state(true);

// Sound notification settings
let soundEnabled = $state(false);
let soundVolume = $state(50); // 0-100

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
    spellCheck,
    doubleClickFavorite,
    disableClickRename,
    favoriteIcon,
    favoriteColor,
    showRelativeTime,
    userDisplayName,
    aiDisplayName,
    userDisplayNameColor,
    aiDisplayNameColor,
    showMessageTimestamps,
    autoScrollToBottom,
    autoSaveDrafts,
    soundEnabled,
    soundVolume,
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
      // Load new settings
      spellCheck = settings.spellCheck ?? true;
      doubleClickFavorite = settings.doubleClickFavorite ?? true;
      disableClickRename = settings.disableClickRename ?? false;
      favoriteIcon = settings.favoriteIcon ?? "star";
      favoriteColor = settings.favoriteColor ?? "gold";
      showRelativeTime = settings.showRelativeTime ?? true;
      userDisplayName = settings.userDisplayName ?? "You";
      aiDisplayName = settings.aiDisplayName ?? "AI";
      userDisplayNameColor = settings.userDisplayNameColor ?? "#3b82f6";
      aiDisplayNameColor = settings.aiDisplayNameColor ?? "#a855f7";
      showMessageTimestamps = settings.showMessageTimestamps ?? true;
      autoScrollToBottom = settings.autoScrollToBottom ?? true;
      autoSaveDrafts = settings.autoSaveDrafts ?? true;
      soundEnabled = settings.soundEnabled ?? false;
      soundVolume = settings.soundVolume ?? 50;
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }
  applyTheme();
  applyFontSize();
}

function setThemeVariant(
  variant:
    | "classic"
    | "monokai"
    | "dracula"
    | "nord"
    | "gruvbox"
    | "solarized"
    | "cyberpunk"
    | "matrix"
    | "arcade"
    | "arcade-neon"
    | "arcade-retro"
    | "retro"
    | "vaporwave"
    | "vaporwave-synth"
    | "vaporwave-retro"
    | "rainbow"
    | "terminal"
    | "github"
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

// * Apply font size to CSS custom property
function applyFontSize() {
  const root = document.documentElement;
  root.style.setProperty("--chat-font-size", FONT_SIZE_MAP[fontSize]);
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
  applyFontSize();
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

// * New setters for additional settings
function setSpellCheck(enabled: boolean) {
  spellCheck = enabled;
  saveSettings();
}

function setDoubleClickFavorite(enabled: boolean) {
  doubleClickFavorite = enabled;
  saveSettings();
}

function setDisableClickRename(disabled: boolean) {
  disableClickRename = disabled;
  saveSettings();
}

function setFavoriteIcon(icon: "star" | "heart" | "bookmark" | "pin") {
  favoriteIcon = icon;
  saveSettings();
}

function setFavoriteColor(color: "gold" | "red" | "pink" | "purple" | "blue" | "green") {
  favoriteColor = color;
  saveSettings();
}

function setShowRelativeTime(show: boolean) {
  showRelativeTime = show;
  saveSettings();
}

function setUserDisplayName(name: string) {
  userDisplayName = name.trim() || "You";
  saveSettings();
}

function setAiDisplayName(name: string) {
  aiDisplayName = name.trim() || "AI";
  saveSettings();
}

function setUserDisplayNameColor(color: string) {
  userDisplayNameColor = color;
  saveSettings();
}

function setAiDisplayNameColor(color: string) {
  aiDisplayNameColor = color;
  saveSettings();
}

function setShowMessageTimestamps(show: boolean) {
  showMessageTimestamps = show;
  saveSettings();
}

function setAutoScrollToBottom(enabled: boolean) {
  autoScrollToBottom = enabled;
  saveSettings();
}

function setAutoSaveDrafts(enabled: boolean) {
  autoSaveDrafts = enabled;
  saveSettings();
}

function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  saveSettings();
}

function setSoundVolume(volume: number) {
  soundVolume = Math.max(0, Math.min(100, volume));
  saveSettings();
}

// * Reset functions for each tab
function resetGeneralSettings() {
  themeVariant = "classic";
  themeMode = "dark";
  language = "en";
  sendOnEnter = true;
  spellCheck = true;
  soundEnabled = false;
  soundVolume = 50;
  applyTheme();
  saveSettings();
}

function resetChatSettings() {
  streamResponses = true;
  fontSize = "medium";
  userDisplayName = "You";
  aiDisplayName = "AI";
  userDisplayNameColor = "#3b82f6";
  aiDisplayNameColor = "#a855f7";
  showMessageTimestamps = true;
  autoScrollToBottom = true;
  autoSaveDrafts = true;
  applyFontSize();
  saveSettings();
}

function resetConversationSettings() {
  doubleClickFavorite = true;
  disableClickRename = false;
  favoriteIcon = "star";
  favoriteColor = "gold";
  showRelativeTime = true;
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
  get spellCheck() {
    return spellCheck;
  },
  get doubleClickFavorite() {
    return doubleClickFavorite;
  },
  get disableClickRename() {
    return disableClickRename;
  },
  get favoriteIcon() {
    return favoriteIcon;
  },
  get favoriteColor() {
    return favoriteColor;
  },
  get showRelativeTime() {
    return showRelativeTime;
  },
  get userDisplayName() {
    return userDisplayName;
  },
  get aiDisplayName() {
    return aiDisplayName;
  },
  get userDisplayNameColor() {
    return userDisplayNameColor;
  },
  get aiDisplayNameColor() {
    return aiDisplayNameColor;
  },
  get showMessageTimestamps() {
    return showMessageTimestamps;
  },
  get autoScrollToBottom() {
    return autoScrollToBottom;
  },
  get autoSaveDrafts() {
    return autoSaveDrafts;
  },
  get soundEnabled() {
    return soundEnabled;
  },
  get soundVolume() {
    return soundVolume;
  },

  loadSettings,
  saveSettings,
  setThemeVariant,
  setThemeMode,
  toggleThemeMode,
  THEME_VARIANTS,
  THEME_MODES,
  LANGUAGES,
  FAVORITE_ICONS,
  FAVORITE_COLORS,
  toggleSidebar,
  setSidebarOpen,
  setFontSize,
  setSendOnEnter,
  setStreamResponses,
  setLanguage,
  setSpellCheck,
  setDoubleClickFavorite,
  setDisableClickRename,
  setFavoriteIcon,
  setFavoriteColor,
  setShowRelativeTime,
  setUserDisplayName,
  setAiDisplayName,
  setUserDisplayNameColor,
  setAiDisplayNameColor,
  setShowMessageTimestamps,
  setAutoScrollToBottom,
  setAutoSaveDrafts,
  setSoundEnabled,
  setSoundVolume,
  resetGeneralSettings,
  resetChatSettings,
  resetConversationSettings,
};

export default settingsStore;
