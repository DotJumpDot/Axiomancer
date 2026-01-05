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
} from "../Types";

const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  validateToken: "/api/auth/validate-token",
  refreshToken: "/api/auth/refresh-token",
  logout: "/api/auth/logout",
  apiKeys: "/api/auth/api-keys",
};

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.login, credentials);
    if (response.success && response.token) {
      apiClient.setAuthToken(response.token);
      localStorage.setItem("auth_token", response.token);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }
    }
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.register, data);
  },

  async validateToken(): Promise<ValidateTokenResponse> {
    return apiClient.post<ValidateTokenResponse>(AUTH_ENDPOINTS.validateToken);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.refreshToken, {
      refresh_token: refreshToken,
    });
    if (response.success && response.token) {
      apiClient.setAuthToken(response.token);
      localStorage.setItem("auth_token", response.token);
    }
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(AUTH_ENDPOINTS.logout);
    } finally {
      apiClient.setAuthToken(null);
      apiClient.setApiKey(null);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    }
  },

  // API Key management
  async getApiKeys(): Promise<{ success: boolean; data: ApiKey[] }> {
    return apiClient.get(AUTH_ENDPOINTS.apiKeys);
  },

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    return apiClient.post<ApiKeyResponse>(AUTH_ENDPOINTS.apiKeys, data);
  },

  async deleteApiKey(keyId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`${AUTH_ENDPOINTS.apiKeys}/${keyId}`);
  },

  // Get current user profile
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get("/api/auth/me");
  },

  // Initialize auth from stored token
  initializeAuth(): string | null {
    // Try new AxmLogin format first
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
      }
    }

    // Fallback to old format
    const token = localStorage.getItem("auth_token");
    if (token) {
      apiClient.setAuthToken(token);
    }
    return token;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  },
};

export default authService;
