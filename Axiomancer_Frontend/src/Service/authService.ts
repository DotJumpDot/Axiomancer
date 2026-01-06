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

export const authService = {
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.login, credentials);
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token);
    }
    return response;
  },

  async register(data: RegisterRequest) {
    return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.register, data);
  },

  async validateToken() {
    return apiClient.post<ValidateTokenResponse>(AUTH_ENDPOINTS.validateToken);
  },

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

  // Initialize auth from stored token
  initializeAuth(): string | null {
    const axmLogin = localStorage.getItem("AxmLogin");
    if (axmLogin) {
      try {
        const loginData = JSON.parse(axmLogin);
        if (loginData.token) {
          apiClient.setAuthToken(loginData.token);
          return loginData.token;
        }
      } catch (error) {
        console.error("Failed to parse AxmLogin data:", error);
        localStorage.removeItem("AxmLogin");
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  },
};

export default authService;
