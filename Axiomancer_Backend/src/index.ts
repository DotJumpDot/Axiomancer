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
  // Protected APIs (require API key, JWT optional for anonymous chat)
  .guard(
    {
      beforeHandle: async ({ request, set, path }) => {
        try {
          // Check API key from X-API-KEY header (always required)
          const apiKey = request.headers.get("X-API-KEY");
          if (!apiKey) {
            set.status = 401;
            return { error: "Missing X-API-KEY header" };
          }

          const apiKeyValidation = await AuthService.validateApiKey(apiKey);

          if (!apiKeyValidation.valid) {
            set.status = 401;
            return { error: "Invalid API key" };
          }

          // Check JWT token from Authorization header (optional for anonymous chat)
          const authHeader = request.headers.get("Authorization");
          let auth = null;

          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const tokenValidation = await AuthService.validateToken(token);

            if (tokenValidation.valid) {
              auth = {
                tokenUser: tokenValidation.user,
                apiKeyUser: apiKeyValidation.user,
              };
            }
          }

          // Add auth data to context (may be null for anonymous users)
          return { auth };
        } catch (error) {
          set.status = 401;
          return { error: error instanceof Error ? error.message : "Authentication failed" };
        }
      },
    },
    (app) => app.use(chatApi).use(aiApi).use(promptApi).use(userApi).use(searchApi)
  )
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
