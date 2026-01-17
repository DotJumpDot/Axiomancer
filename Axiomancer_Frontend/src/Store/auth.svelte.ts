// Auth Store - Svelte 5 runes for authentication state
import { authService, userService } from "@/Service";
import { apiClient } from "@/Service";
import type { AuthUser, User, LoginRequest, RegisterRequest } from "@/Types";

// Reactive state using Svelte 5 runes
let isAuthenticated = $state(false);
let currentUser = $state<AuthUser | null>(null);
let currentApiKey = $state<string | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Initialize from stored token
function initialize() {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      if (loginData.token) {
        apiClient.setAuthToken(loginData.token);
        isAuthenticated = true;
      }
      if (loginData.user) {
        // Load user data from backend using JWT token
        loadUserData(loginData.user);
      }
    } catch (error) {
      console.error("Failed to load stored auth data:", error);
      logout();
    }
  }
}

async function loadUserData(userUuid: string) {
  try {
    const response = await userService.getUserByUUID(userUuid);
    if (response.success && response.data) {
      currentUser = {
        id: response.data.id,
        uuid: response.data.uuid,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
        nickname: response.data.nickname,
        picture_url: response.data.picture_url || "",
        openrouter_api_key: response.data.openrouter_api_key || null,
      };
    } else {
      console.error("Failed to load user data:", response.error);
      // If user data loading fails, we should still be authenticated
      // but we'll show a fallback user display
      currentUser = {
        id: 0,
        uuid: userUuid,
        username: "User",
        email: "",
        role: "user",
        nickname: "User",
        picture_url: "",
      };
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
    // If user data loading fails, we should still be authenticated
    // but we'll show a fallback user display
    currentUser = {
      id: 0,
      uuid: userUuid,
      username: "User",
      email: "",
      role: "user",
      nickname: "User",
      picture_url: "",
    };
  }
}

async function login(credentials: LoginRequest) {
  try {
    isLoading = true;
    error = null;

    const response = await authService.login(credentials);
    if (response.success && response.data) {
      currentUser = response.data.user!;
      isAuthenticated = true;

      // Store login data with token and optional refresh_token
      const loginData: any = {
        user: currentUser.uuid,
        token: response.data.token,
      };

      if (response.data.refresh_token) {
        loginData.refresh_token = response.data.refresh_token;
      }

      localStorage.setItem("AxmLogin", JSON.stringify(loginData));

      return { success: true };
    } else {
      error = response.error || "Login failed";
      return { success: false, error: error };
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Login failed";
    return { success: false, error: error };
  } finally {
    isLoading = false;
  }
}

async function register(data: RegisterRequest) {
  try {
    isLoading = true;
    error = null;

    const response = await authService.register(data);
    if (response.success) {
      return { success: true };
    } else {
      error = response.error || "Registration failed";
      return { success: false, error: error };
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Registration failed";
    return { success: false, error: error };
  } finally {
    isLoading = false;
  }
}

async function logout() {
  try {
    await authService.logout();
  } finally {
    currentUser = null;
    currentApiKey = null;
    apiClient.setAuthToken(null); // Clear JWT token from client
    isAuthenticated = false;
    error = null;
    localStorage.removeItem("AxmLogin");
  }
}

async function refreshProfile() {
  if (!isAuthenticated) return;

  try {
    const response = await userService.getCurrentProfile();
    if (response.success && response.data) {
      const userData = response.data;
      currentUser = {
        id: userData.id,
        uuid: userData.uuid,
        username: userData.username,
        nickname: userData.nickname,
        email: userData.email,
        role: userData.role,
        picture_url: userData.picture_url,
        openrouter_api_key: (userData as any).openrouter_api_key || "",
      };
    }
  } catch (e) {
    console.error("Failed to refresh profile:", e);
  }
}

function updateCurrentUser(updates: Partial<AuthUser>) {
  if (currentUser) {
    currentUser = {
      ...currentUser,
      ...updates,
    };
  }
}

//* Save model and prompt selections to AxmLogin
function saveSelections(modelKey: string | null, promptId: string | null) {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      loginData.latest_select_model = modelKey;
      loginData.latest_select_prompt = promptId;
      localStorage.setItem("AxmLogin", JSON.stringify(loginData));
    } catch (error) {
      console.error("Failed to save selections to AxmLogin:", error);
    }
  }
}

//* Get model and prompt selections from AxmLogin
function getSelections(): { modelKey: string | null; promptId: string | null } {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      return {
        modelKey: loginData.latest_select_model || null,
        promptId: loginData.latest_select_prompt || null,
      };
    } catch (error) {
      console.error("Failed to get selections from AxmLogin:", error);
    }
  }
  return { modelKey: null, promptId: null };
}

//* Save mode selection to AxmLogin
function saveMode(mode: 'auto' | 'single') {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      loginData.mode_last_selected = mode;
      localStorage.setItem("AxmLogin", JSON.stringify(loginData));
    } catch (error) {
      console.error("Failed to save mode to AxmLogin:", error);
    }
  }
}

//* Get mode selection from AxmLogin
function getMode(): 'auto' | 'single' {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      return loginData.mode_last_selected || 'auto';
    } catch (error) {
      console.error("Failed to get mode from AxmLogin:", error);
    }
  }
  return 'auto';
}

//* Save preset selection to AxmLogin
function savePreset(preset: number | null) {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      loginData.latest_preset = preset;
      localStorage.setItem("AxmLogin", JSON.stringify(loginData));
    } catch (error) {
      console.error("Failed to save preset to AxmLogin:", error);
    }
  }
}

//* Get preset selection from AxmLogin
function getPreset(): number | null {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      return loginData.latest_preset || null;
    } catch (error) {
      console.error("Failed to get preset from AxmLogin:", error);
    }
  }
  return null;
}

//* Save decision model selection to AxmLogin
function saveDecisionModel(modelId: string | null) {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      loginData.latest_decision_model = modelId;
      localStorage.setItem("AxmLogin", JSON.stringify(loginData));
    } catch (error) {
      console.error("Failed to save decision model to AxmLogin:", error);
    }
  }
}

//* Get decision model selection from AxmLogin
function getDecisionModel(): string | null {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      return loginData.latest_decision_model || null;
    } catch (error) {
      console.error("Failed to get decision model from AxmLogin:", error);
    }
  }
  return null;
}

// Export store object with getters for reactive access
export const authStore = {
  get isAuthenticated() {
    return isAuthenticated;
  },
  get currentUser() {
    return currentUser;
  },
  get currentApiKey() {
    return currentApiKey;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  initialize,
  login,
  register,
  logout,
  refreshProfile,
  updateCurrentUser,
  saveSelections,
  getSelections,
  saveMode,
  getMode,
  savePreset,
  getPreset,
  saveDecisionModel,
  getDecisionModel,
};

export default authStore;
