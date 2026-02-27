import { AuthService } from "./auth_service";
import type { ValidateTokenResponse, ValidateApiKeyResponse } from "./auth_type";

/**
 * Middleware to extract and validate JWT token from Authorization header
 * Returns user data if valid, null if no token provided
 * Throws error if token is invalid
 */
export const authMiddleware = async (request: Request) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const validation = await AuthService.validateToken(token);

  if (!validation.valid) {
    throw new Error("Invalid token");
  }

  return validation.user;
};

/**
 * Middleware to extract and validate API key from X-API-KEY header
 * Returns validation result if valid, null if no API key provided
 * Throws error if API key is invalid
 */
export const apiKeyMiddleware = async (request: Request) => {
  const apiKey = request.headers.get("X-API-KEY");
  if (!apiKey) {
    return null;
  }

  const validation = await AuthService.validateApiKey(apiKey);

  if (!validation.valid) {
    throw new Error("Invalid API key");
  }

  return validation;
};

/**
 * Combined middleware that validates BOTH JWT token AND API key
 * For protected routes that require dual authentication
 *
 * Usage in Elysia:
 * .derive(async ({ request }) => {
 *   return await requireDualAuth(request);
 * })
 */
export const requireDualAuth = async (request: Request) => {
  // Validate JWT token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      auth: null,
      error: "Authorization header required (Bearer token)",
      status: 401,
    };
  }

  const token = authHeader.substring(7);
  const tokenValidation = await AuthService.validateToken(token);

  if (!tokenValidation.valid) {
    return {
      auth: null,
      error: "Invalid or expired JWT token",
      status: 401,
    };
  }

  // Validate API key
  const apiKey = request.headers.get("X-API-KEY");
  if (!apiKey) {
    return {
      auth: null,
      error: "X-API-KEY header required",
      status: 401,
    };
  }

  const apiKeyValidation = await AuthService.validateApiKey(apiKey);

  if (!apiKeyValidation.valid) {
    return {
      auth: null,
      error: "Invalid API key",
      status: 401,
    };
  }

  // Both validations passed
  return {
    auth: {
      user: tokenValidation.user,
      authMethod: "dual" as const,
      apiKeyPermissions: apiKeyValidation.permissions,
    },
    error: null,
    status: 200,
  };
};

/**
 * Middleware that validates ONLY API key
 * For login/register routes that need API key verification before issuing JWT
 *
 * Usage in Elysia:
 * .derive(async ({ request }) => {
 *   return await requireApiKeyOnly(request);
 * })
 */
export const requireApiKeyOnly = async (request: Request) => {
  const apiKey = request.headers.get("X-API-KEY");
  if (!apiKey) {
    return {
      auth: null,
      error: "X-API-KEY header required",
      status: 401,
    };
  }

  const validation = await AuthService.validateApiKey(apiKey);

  if (!validation.valid) {
    return {
      auth: null,
      error: "Invalid API key",
      status: 401,
    };
  }

  return {
    auth: {
      user: validation.user,
      authMethod: "apikey" as const,
      permissions: validation.permissions,
    },
    error: null,
    status: 200,
  };
};

/**
 * Helper function to check if user is authenticated with dual auth
 * Returns auth context or throws unauthorized error
 */
export const checkDualAuth = (auth: any, set: any) => {
  if (!auth?.user) {
    set.status = 401;
    return {
      success: false,
      error: "Authentication required. Please provide both JWT token and API key.",
    };
  }
  return null; // No error, auth is valid
};
