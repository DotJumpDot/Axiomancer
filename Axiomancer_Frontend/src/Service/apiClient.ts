// Base API client for all service calls
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:4100";
// In Vite, only env vars with VITE_ prefix are exposed to frontend
// Without VITE_ prefix, the variable would be undefined
// This is a PUBLIC key - do NOT use for secrets!
const DEFAULT_API_KEY = import.meta.env.VITE_DEFAULT_API_KEY;

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  private currentApiKey: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Set default API key from environment if available (for development)
    if (DEFAULT_API_KEY) {
      this.setApiKey(DEFAULT_API_KEY);
    }
  }

  /**
   * Set the JWT Bearer token for authentication
   * This will be sent as: Authorization: Bearer <token>
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders["Authorization"];
    }
  }

  /**
   * Set the API key for authentication
   * This will be sent as: X-API-KEY: <apiKey>
   *
   * For login/register: Only API key is needed (no JWT yet)
   * For protected routes: Both JWT token AND API key are required
   */
  setApiKey(apiKey: string | null) {
    this.currentApiKey = apiKey;
    if (apiKey) {
      this.defaultHeaders["X-API-KEY"] = apiKey;
    } else {
      delete this.defaultHeaders["X-API-KEY"];
    }
  }

  /**
   * Get the current API key
   */
  getApiKey(): string | null {
    return this.currentApiKey;
  }

  /**
   * Set both JWT token and API key at once
   * This is the standard authentication setup for protected routes
   */
  setCredentials(token: string | null, apiKey: string | null) {
    this.setAuthToken(token);
    this.setApiKey(apiKey);
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const text = await response.text();

      // Handle empty responses
      if (!text || text.trim() === "") {
        if (!response.ok) {
          return {
            success: false,
            error: `HTTP Error: ${response.status}`,
          };
        }
        return { success: true, data: undefined as T };
      }

      // Try to parse as JSON
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        // If not valid JSON, return the text as error
        return {
          success: false,
          error: text || `HTTP Error: ${response.status}`,
        };
      }

      if (!response.ok) {
        const errorMsg =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : `HTTP Error: ${response.status}`;
        return {
          success: false,
          error: errorMsg,
        };
      }

      // If backend already returns { success, data, error }, pass through
      if (
        typeof data === "object" &&
        data !== null &&
        Object.prototype.hasOwnProperty.call(data, "success")
      ) {
        return data as ApiResponse<T>;
      }
      // Otherwise, wrap raw payload in ApiResponse format
      return { success: true, data: data as T };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "GET",
      headers: { ...this.defaultHeaders, ...config?.headers },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "POST",
      headers: { ...this.defaultHeaders, ...config?.headers },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "PUT",
      headers: { ...this.defaultHeaders, ...config?.headers },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "DELETE",
      headers: { ...this.defaultHeaders, ...config?.headers },
    });
    return this.handleResponse<T>(response);
  }

  async upload<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = { ...config?.headers };
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (this.defaultHeaders["Authorization"]) {
      headers["Authorization"] = this.defaultHeaders["Authorization"];
    }
    if (this.defaultHeaders["X-API-KEY"]) {
      headers["X-API-KEY"] = this.defaultHeaders["X-API-KEY"];
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
