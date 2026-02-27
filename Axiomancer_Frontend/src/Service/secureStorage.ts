// Secure storage utility for auth credentials
// In development: Uses localStorage for convenience
// In production: Should use httpOnly cookies instead

const STORAGE_KEY = "AxmLogin";

/**
 * Store auth credentials
 * For dev: localStorage (acceptable for development)
 * For prod: Should implement httpOnly cookie API
 */
export function storeCredentials(data: {
  user: string;
  token: string;
  refresh_token?: string;
  api_key?: string;
}): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Retrieve auth credentials
 */
export function getCredentials(): {
  user?: string;
  token?: string;
  refresh_token?: string;
  api_key?: string;
} | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Clear all auth credentials
 */
export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get API key (from env or storage)
 * API key for dev is not sensitive (default: 1234)
 */
export function getApiKey(): string {
  // First check env variable
  const envKey = (import.meta as any).env?.VITE_DEFAULT_API_KEY;
  if (envKey) return envKey;

  // Then check storage
  const creds = getCredentials();
  if (creds?.api_key) return creds.api_key;

  // Fallback to hardcoded dev key
  return "1234";
}

/**
 * Security recommendations:
 *
 * FOR DEVELOPMENT (current setup):
 * - localStorage is acceptable for convenience
 * - Short-lived JWT tokens (60 min) limit exposure
 * - Default API key is already public in .env
 *
 * FOR PRODUCTION:
 * - Use httpOnly cookies for JWT token (prevents XSS theft)
 * - Store API key server-side, not in localStorage
 * - Implement refresh token rotation
 * - Use HTTPS only (secure context)
 * - Add CSP headers to prevent XSS
 * - Consider using a proper auth library like Auth.js
 *
 * XSS PROTECTION:
 * - Sanitize all user input
 * - Use Content-Security-Policy headers
 * - Avoid innerHTML, use textContent
 * - Validate all data from localStorage before use
 */
