// Base API client for all service calls
const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:4100";
const DEFAULT_API_KEY = import.meta.env.VITE_DEFAULT_API_KEY;

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Set default API key from environment if available (for development)
    if (DEFAULT_API_KEY) {
      this.setApiKey(DEFAULT_API_KEY);
    }
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders["Authorization"];
    }
  }

  setApiKey(apiKey: string | null) {
    if (apiKey) {
      this.defaultHeaders["X-API-KEY"] = apiKey;
    } else {
      delete this.defaultHeaders["X-API-KEY"];
    }
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }
    return response.json();
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "GET",
      headers: { ...this.defaultHeaders, ...config?.headers },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "POST",
      headers: { ...this.defaultHeaders, ...config?.headers },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "PUT",
      headers: { ...this.defaultHeaders, ...config?.headers },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      method: "DELETE",
      headers: { ...this.defaultHeaders, ...config?.headers },
    });
    return this.handleResponse<T>(response);
  }

  async upload<T>(endpoint: string, formData: FormData, config?: RequestConfig): Promise<T> {
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
