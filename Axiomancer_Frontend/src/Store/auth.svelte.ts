// Auth Store - Svelte 5 runes for authentication state
import { authService, userService } from "../Service";
import { apiClient } from "../Service";
import type { AuthUser, User, LoginRequest, RegisterRequest } from "../Types";

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

        // Create a new API key for this session
        createSessionApiKey();
      }
      if (loginData.user) {
        // If we have user UUID, try to load user data
        loadUserData(loginData.user);
      }
    } catch (error) {
      console.error("Failed to load stored auth data:", error);
      logout();
    }
  }
}

async function createSessionApiKey() {
  try {
    const createResponse = await authService.createApiKey({
      name: "Session Key",
      permissions: ["read", "write"],
    });

    if (createResponse.success && createResponse.api_key) {
      const apiKey = createResponse.api_key.key;
      currentApiKey = apiKey;
      apiClient.setApiKey(apiKey);
    } else {
      console.error("Failed to create session API key");
      // Don't logout here, just log the error
    }
  } catch (error) {
    console.error("Failed to create session API key:", error);
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
      };
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
}

async function login(credentials: LoginRequest) {
  try {
    isLoading = true;
    error = null;

    const response = await authService.login(credentials);
    if (response.success && response.user) {
      currentUser = response.user;
      isAuthenticated = true;

      // Get or create API key for the user
      try {
        // Always create a new API key on login for security
        const createResponse = await authService.createApiKey({
          name: "Login Session Key",
          permissions: ["read", "write"],
        });

        if (createResponse.success && createResponse.api_key) {
          const apiKey = createResponse.api_key.key;
          currentApiKey = apiKey;
          apiClient.setApiKey(apiKey);

          // Store only user UUID and token (not API key for security)
          localStorage.setItem(
            "AxmLogin",
            JSON.stringify({
              user: currentUser.uuid,
              token: response.token,
            })
          );
        } else {
          throw new Error("Failed to create API key");
        }
      } catch (apiKeyError) {
        console.error("Failed to setup API key:", apiKeyError);
        // Continue with login even if API key setup fails
      }

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
    apiClient.setApiKey(null); // Clear API key from client
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
      currentUser = {
        id: response.data.id,
        uuid: response.data.uuid,
        username: response.data.username,
        nickname: response.data.nickname,
        email: response.data.email,
        role: response.data.role,
        picture_url: response.data.picture_url,
      };
    }
  } catch (e) {
    console.error("Failed to refresh profile:", e);
  }
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
};

export default authStore;
