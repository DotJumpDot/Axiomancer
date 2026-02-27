// Auth Service - handles authentication API calls
import apiClient from "./apiClient";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ValidateTokenResponse,
  CreateApiKeyRequest,
  ApiKeyResponse,
  ApiKey,
  User,
  ApiResponse,
} from "@/Types";

const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  validateToken: "/api/auth/validate-token",
  refreshToken: "/api/auth/refresh-token",
  logout: "/api/auth/logout",
  apiKeys: "/api/auth/api-keys",
};

/**
 * Auth Service - handles authentication API calls
 *
 * Authentication flow:
 * 1. Login/Register: Only API key is required (X-API-KEY header)
 *    - Server validates API key and returns JWT token + refresh token
 * 2. Protected routes: Both JWT token (Authorization: Bearer) AND API key (X-API-KEY) are required
 *    - Server validates both credentials
 */
export const authService = {
  /**
   * Login with username and password
   * Requires API key in header (set by apiClient)
   * Returns JWT token on success
   */
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.login, credentials);
    if (response.success && response.data?.token) {
      // Set JWT token for future requests
      apiClient.setAuthToken(response.data.token);
      // API key is already set in apiClient from env or previous session
    }
    return response;
  },

  /**
   * Register new user
   * Requires API key in header (set by apiClient)
   * Returns JWT token on success
   */
  async register(data: RegisterRequest) {
    return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.register, data);
  },

  /**
   * Validate current JWT token
   * Requires both JWT token and API key
   */
  async validateToken() {
    return apiClient.post<ValidateTokenResponse>(AUTH_ENDPOINTS.validateToken);
  },

  /**
   * Refresh JWT token using refresh token
   * Requires API key in header
   */
  async refreshToken(refreshToken: string) {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.refreshToken, {
      refresh_token: refreshToken,
    });
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token);
      localStorage.setItem("auth_token", response.data.token);
    }
    return response;
  },

  /**
   * Logout user
   * Requires both JWT token and API key
   */
  async logout(): Promise<void> {
    try {
      const axmLogin = localStorage.getItem("AxmLogin");
      if (axmLogin) {
        const loginData = JSON.parse(axmLogin);
        if (loginData.refresh_token) {
          await apiClient.post(AUTH_ENDPOINTS.logout, { refresh_token: loginData.refresh_token });
        } else {
          await apiClient.post(AUTH_ENDPOINTS.logout);
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      apiClient.setAuthToken(null);
      // Don't clear API key - it can be reused for login
      localStorage.removeItem("AxmLogin");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    }
  },

  // API Key management
  async getApiKeys() {
    return apiClient.get<ApiKey[]>(AUTH_ENDPOINTS.apiKeys);
  },

  async createApiKey(data: CreateApiKeyRequest) {
    return apiClient.post<ApiKeyResponse>(AUTH_ENDPOINTS.apiKeys, data);
  },

  async deleteApiKey(keyId: string) {
    return apiClient.delete(`${AUTH_ENDPOINTS.apiKeys}/${keyId}`);
  },

  // Get current user profile
  async getCurrentUser() {
    return apiClient.get<User>("/api/auth/me");
  },

  /**
   * Initialize auth from stored token
   * Sets both JWT token and API key from localStorage
   */
  initializeAuth(): { token: string | null; apiKey: string | null } {
    const axmLogin = localStorage.getItem("AxmLogin");
    let token: string | null = null;
    let apiKey: string | null = null;

    if (axmLogin) {
      try {
        const loginData = JSON.parse(axmLogin);
        if (loginData.token) {
          apiClient.setAuthToken(loginData.token);
          token = loginData.token;
        }
        // Restore API key if saved
        if (loginData.api_key) {
          apiClient.setApiKey(loginData.api_key);
          apiKey = loginData.api_key;
        }
      } catch (error) {
        console.error("Failed to parse stored auth data:", error);
      }
    }

    return { token, apiKey };
  },

  /**
   * Save API key to localStorage for persistence
   */
  saveApiKey(apiKey: string) {
    const axmLogin = localStorage.getItem("AxmLogin");
    if (axmLogin) {
      try {
        const loginData = JSON.parse(axmLogin);
        loginData.api_key = apiKey;
        localStorage.setItem("AxmLogin", JSON.stringify(loginData));
      } catch (error) {
        console.error("Failed to save API key:", error);
      }
    }
    apiClient.setApiKey(apiKey);
  },

  /**
   * Get stored API key from localStorage
   */
  getStoredApiKey(): string | null {
    const axmLogin = localStorage.getItem("AxmLogin");
    if (axmLogin) {
      try {
        const loginData = JSON.parse(axmLogin);
        return loginData.api_key || null;
      } catch (error) {
        console.error("Failed to get stored API key:", error);
      }
    }
    return null;
  },
};

export default authService;
