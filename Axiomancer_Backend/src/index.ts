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
import { favoriteApi } from "./api/favorite/favorite_api";
import { folderApi } from "./api/folder/folder_api";
import { analyticsApi } from "./api/analytics/analytics_api";
import { requireDualAuth } from "./api/auth/auth_middleware";

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
  // Auth API (no authentication required for login/register - they need API key only)
  .use(authApi)
  // Health check (public)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  // Protected APIs - require BOTH JWT token AND API key
  .derive(async ({ request }) => {
    // Apply dual authentication middleware
    const result = await requireDualAuth(request);
    return { auth: result.auth };
  })
  .use(chatApi)
  .use(aiApi)
  .use(promptApi)
  .use(userApi)
  .use(searchApi)
  .use(selectionApi)
  .use(favoriteApi)
  .use(folderApi)
  .use(analyticsApi)
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
console.log(`🦊 Elysia hosting for ${FRONTEND_BASE_URL}`);
console.log(`🦊 Elysia swagger at http://localhost:${app.server?.port}/w`);
