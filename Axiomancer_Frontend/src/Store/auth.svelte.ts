// Auth Store - Svelte 5 runes for authentication state
import { authService, userService } from "@/Service";
import { apiClient } from "@/Service";
import type { AuthUser, User, LoginRequest, RegisterRequest } from "@/Types";
import { chatStore } from "./chat.svelte";

// Reactive state using Svelte 5 runes
let isAuthenticated = $state(false);
let currentUser = $state<AuthUser | null>(null);
let currentApiKey = $state<string | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

//* Parse JWT token to extract payload
function parseJWT(token: string): { exp?: number; iat?: number; [key: string]: any } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

//* Check if a JWT token is expired
function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  // Add 30 seconds buffer before actual expiration
  return Date.now() >= expirationTime - 30000;
}

//* Check token validity and auto-logout if expired
function checkTokenValidity(): boolean {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (!axmLogin) return false;

  try {
    const loginData = JSON.parse(axmLogin);

    // Check access token expiry
    if (loginData.token && isTokenExpired(loginData.token)) {
      // Check if refresh_token exists and is still valid
      if (loginData.refresh_token && !isTokenExpired(loginData.refresh_token)) {
        // TODO: Implement token refresh flow
        console.log("[Auth] Access token expired, refresh token still valid - needs refresh");
        // For now, logout if access token expired
        console.warn("[Auth] Auto-logout: Access token expired");
        logout();
        return false;
      } else {
        console.warn("[Auth] Auto-logout: All tokens expired");
        logout();
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

// Initialize from stored token
function initialize() {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);

      // Check token validity before initializing
      if (loginData.token) {
        if (isTokenExpired(loginData.token)) {
          // Check refresh token
          if (loginData.refresh_token && !isTokenExpired(loginData.refresh_token)) {
            // TODO: Implement refresh token flow
            console.warn("[Auth] Access token expired on init, logging out");
            logout();
            return;
          }
          console.warn("[Auth] All tokens expired on init, logging out");
          logout();
          return;
        }

        // Token is valid, set it
        apiClient.setAuthToken(loginData.token);
        isAuthenticated = true;
      }

      if (loginData.user) {
        // Load user data from backend using JWT token
        loadUserData(loginData.user);
      }

      // Set up periodic token validity check (every 60 seconds)
      setupTokenValidityCheck();
    } catch (error) {
      console.error("Failed to load stored auth data:", error);
      logout();
    }
  }
}

//* Set up periodic token validity check
let tokenCheckInterval: ReturnType<typeof setInterval> | null = null;

function setupTokenValidityCheck() {
  // Clear any existing interval
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
  }

  // Check every 60 seconds
  tokenCheckInterval = setInterval(() => {
    if (isAuthenticated && !checkTokenValidity()) {
      console.log("[Auth] Token validation failed, user logged out");
    }
  }, 60000);
}

function clearTokenValidityCheck() {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
    tokenCheckInterval = null;
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

      // Set auth token for API requests
      if (response.data.token) {
        apiClient.setAuthToken(response.data.token);
      }

      // Store login data with token and optional refresh_token
      const loginData: any = {
        user: currentUser.uuid,
        token: response.data.token,
      };

      if (response.data.refresh_token) {
        loginData.refresh_token = response.data.refresh_token;
      }

      localStorage.setItem("AxmLogin", JSON.stringify(loginData));

      // Set up periodic token validity check
      setupTokenValidityCheck();

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
    // Clear token validity check interval
    clearTokenValidityCheck();

    currentUser = null;
    currentApiKey = null;
    apiClient.setAuthToken(null);
    isAuthenticated = false;
    error = null;
    localStorage.removeItem("AxmLogin");

    chatStore.clearCurrentConversation();
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
function saveMode(mode: "auto" | "single") {
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
function getMode(): "auto" | "single" {
  const axmLogin = localStorage.getItem("AxmLogin");
  if (axmLogin) {
    try {
      const loginData = JSON.parse(axmLogin);
      return loginData.mode_last_selected || "auto";
    } catch (error) {
      console.error("Failed to get mode from AxmLogin:", error);
    }
  }
  return "auto";
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
};

export default authStore;
