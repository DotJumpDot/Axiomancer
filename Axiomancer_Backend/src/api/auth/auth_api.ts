import { Elysia, t } from "elysia";
import { AuthService } from "./auth_service";
import { requireDualAuth } from "./auth_middleware";
import { loginRateLimit, registerRateLimit } from "../../middleware/rateLimit";
import type { LoginRequest, RegisterRequest } from "./auth_type";

export const authApi = new Elysia({ prefix: "/api/auth", tags: ["Auth"] })
  // ========== PUBLIC ROUTES (with API Key only) ==========

  // Login - requires API key only (to get JWT token)
  // Login rate limiting: 20 attempts per 10 minutes per IP
  .post(
    "/login",
    async ({ body, request }) => {
      // Check rate limit first
      const rateLimitResult = await loginRateLimit(request);
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limit exceeded. You can try 20 login attempts per 10 minutes.",
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check API key
      const apiKey = request.headers.get("X-API-KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "X-API-KEY header required",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const validation = await AuthService.validateApiKey(apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid API key",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

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

  // Register - requires API key only
  // Register rate limiting: 20 attempts per hour per IP
  .post(
    "/register",
    async ({ body, request }) => {
      // Check rate limit first
      const rateLimitResult = await registerRateLimit(request);
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limit exceeded. You can try 20 registrations per hour.",
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check API key
      const apiKey = request.headers.get("X-API-KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "X-API-KEY header required",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const validation = await AuthService.validateApiKey(apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid API key",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

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

  // Refresh token - requires API key only
  .post(
    "/refresh",
    async ({ body, request }) => {
      // Check API key
      const apiKey = request.headers.get("X-API-KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "X-API-KEY header required",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const validation = await AuthService.validateApiKey(apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid API key",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const result = await AuthService.refreshToken(body.refresh_token);
      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error,
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
    {
      body: t.Object({
        refresh_token: t.String(),
      }),
    }
  )

  // ========== PROTECTED ROUTES (JWT + API Key required) ==========

  // Use dual auth for protected routes
  .derive(async ({ request }) => {
    const result = await requireDualAuth(request);
    return { auth: result.auth, authError: result.error };
  })

  // Logout - requires both JWT and API key
  .post(
    "/logout",
    async ({ body, auth, authError }: { body: any; auth: any; authError: string | null }) => {
      if (authError) {
        return new Response(JSON.stringify({ error: authError }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!auth?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await AuthService.logout(auth.user.id, body?.refresh_token);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ success: true, data: { message: "Logged out successfully" } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    },
    {
      body: t.Optional(
        t.Object({
          refresh_token: t.Optional(t.String()),
        })
      ),
    }
  )

  // Validate token - requires both JWT and API key
  .get("/validate-token", async ({ auth, authError }: { auth: any; authError: string | null }) => {
    if (authError) {
      return new Response(JSON.stringify({ valid: false, error: authError }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!auth?.user) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true, data: { valid: true, user: auth.user } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  })

  // Validate API key - requires both JWT and API key
  .get(
    "/validate-api-key",
    async ({
      request,
      auth,
      authError,
    }: {
      request: Request;
      auth: any;
      authError: string | null;
    }) => {
      if (authError) {
        return new Response(JSON.stringify({ valid: false, error: authError }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!auth?.user) {
        return new Response(JSON.stringify({ valid: false, error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const apiKey = request.headers.get("X-API-KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ valid: false, error: "X-API-KEY header required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await AuthService.validateApiKey(apiKey);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            valid: result.valid,
            user: result.user,
            permissions: result.permissions,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  );
