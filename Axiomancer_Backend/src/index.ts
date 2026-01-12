import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import * as dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { sql } from "./database/db";
import { aiApi } from "./api/ai/ai_api";
import { promptApi } from "./api/prompt/prompt_api";
import { userApi } from "./api/user/user_api";
import { authApi } from "./api/auth/auth_api";
import { chatApi } from "./api/chat/chat_api";
import { searchApi } from "./api/search/search_api";
import { selectionApi } from "./api/selection/selection_api";
import { AuthService } from "./api/auth/auth_service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../../.env") });

const { FRONTEND_BASE_URL } = process.env;

const app = new Elysia()
  .use(
    cors({
      origin: FRONTEND_BASE_URL
        ? [FRONTEND_BASE_URL]
        : ["http://localhost:4200", "http://localhost:5173"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-KEY"],
      credentials: true,
    })
  )
  .use(swagger({ path: "/w" }))
  // Auth API (no authentication required - used to get tokens/API keys)
  .use(authApi)
  // Optional authentication middleware - sets auth context if valid credentials provided
  .derive(async ({ request }) => {
    let auth = null;

    // Check JWT token from Authorization header (primary auth method)
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const tokenValidation = await AuthService.validateToken(token);
        if (tokenValidation.valid) {
          auth = {
            user: tokenValidation.user,
            authMethod: "jwt",
          };
        }
      } catch (error) {
        console.error("JWT validation error:", error);
        // Continue without auth - let route handlers decide if auth is required
      }
    }

    // Fallback to API key from X-API-KEY header
    if (!auth) {
      const apiKey = request.headers.get("X-API-KEY");
      if (apiKey) {
        try {
          const apiKeyValidation = await AuthService.validateApiKey(apiKey);
          if (apiKeyValidation.valid) {
            auth = {
              user: apiKeyValidation.user,
              authMethod: "apikey",
            };
          }
        } catch (error) {
          console.error("API key validation error:", error);
          // Continue without auth - let route handlers decide if auth is required
        }
      }
    }

    // Return auth context (null if no valid authentication provided)
    return { auth };
  })
  .use(chatApi)
  .use(aiApi)
  .use(promptApi)
  .use(userApi)
  .use(searchApi)
  .use(selectionApi)
  .get("/", () => "Hello Elysia")
  .get("/test-db", async () => {
    try {
      const result = await sql`SELECT 1 as test`;
      return { message: "Database connected", result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: "Database connection failed", details: message };
    }
  })
  .listen(4100);

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`);
console.log(`🦊 Elysia swagger at http://localhost:${app.server?.port}/w`);
