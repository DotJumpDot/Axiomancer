import { Elysia, t } from "elysia";
import { AuthService } from "./auth_service";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CreateApiKeyRequest,
  ApiKeyResponse,
  ValidateTokenResponse,
  ValidateApiKeyResponse,
} from "./auth_type";

// Middleware to extract token from Authorization header
const authMiddleware = async (request: Request) => {
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

// Middleware to extract API key from X-API-KEY header
const apiKeyMiddleware = async (request: Request) => {
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

export const authApi = new Elysia({ prefix: "/api/auth", tags: ["Auth"] })
  // Login
  .post(
    "/login",
    async ({ body }: { body: LoginRequest }) => {
      const result = await AuthService.login(body);
      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error || "Login failed",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )

  // Register
  .post(
    "/register",
    async ({ body }: { body: RegisterRequest }) => {
      const result = await AuthService.register(body);
      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error || "Registration failed",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 4 }),
        email: t.String(),
        firstname: t.Optional(t.String()),
        lastname: t.Optional(t.String()),
        nickname: t.Optional(t.String()),
      }),
    }
  )

  // Refresh token
  .post(
    "/refresh",
    async ({ body }: { body: { refresh_token: string } }) => {
      const result = await AuthService.refreshToken(body.refresh_token);
      if (!result.success) {
        return {
          error: result.error,
          status: 401,
        };
      }
      return { success: true, data: result };
    },
    {
      body: t.Object({
        refresh_token: t.String(),
      }),
    }
  )

  // Logout
  .post(
    "/logout",
    async ({ body, request }) => {
      const user = await authMiddleware(request);
      if (!user) {
        return { error: "Unauthorized", status: 401 };
      }

      const result = await AuthService.logout(user.id, body?.refresh_token);
      if (!result.success) {
        return {
          error: result.error,
          status: 500,
        };
      }
      return { success: true, data: { message: "Logged out successfully" } };
    },
    {
      body: t.Optional(
        t.Object({
          refresh_token: t.Optional(t.String()),
        })
      ),
    }
  )

  // Validate token
  .get("/validate-token", async ({ request }) => {
    const user = await authMiddleware(request);
    if (!user) {
      return { valid: false, error: "Invalid token", status: 401 };
    }
    return { success: true, data: { valid: true, user } };
  })

  // Validate API key
  .get("/validate-api-key", async ({ request }) => {
    const validation = await apiKeyMiddleware(request);
    if (!validation) {
      return { valid: false, error: "Invalid API key", status: 401 };
    }
    return { success: true, data: validation };
  })

  // Create API key (requires authentication)
  .post(
    "/api-keys",
    async ({ body, request }) => {
      const user = await authMiddleware(request);
      if (!user) {
        return { error: "Unauthorized", status: 401 };
      }

      const result = await AuthService.createApiKey(user.id, body);
      if (!result.success) {
        return {
          error: result.error,
          status: 500,
        };
      }
      return { success: true, data: result };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        permissions: t.Array(t.String()),
        expires_in_days: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
      }),
    }
  )

  // Get user's API keys (requires authentication)
  .get("/api-keys", async ({ request }) => {
    const user = await authMiddleware(request);
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const apiKeys = await AuthService.getUserApiKeys(user.id);
    return { success: true, data: apiKeys };
  })

  // Delete API key (requires authentication)
  .delete("/api-keys/:keyId", async ({ params: { keyId }, request }) => {
    const user = await authMiddleware(request);
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const result = await AuthService.deleteApiKey(keyId, user.id);
    if (!result.success) {
      return {
        error: result.error,
        status: 404,
      };
    }
    return { success: true, message: "API key deleted successfully" };
  })

  // Get current user profile (requires authentication)
  .get("/me", async ({ request }) => {
    const user = await authMiddleware(request);
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    // Get full user details
    const { UserService } = await import("../user/user_service");
    const fullUser = await UserService.getUserById(user.id);

    if (!fullUser) {
      return { error: "User not found", status: 404 };
    }

    return { user: UserService.getPublicUser(fullUser) };
  })

  // Health check endpoint
  .get("/health", () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });
