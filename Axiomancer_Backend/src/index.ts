import { Elysia, t } from "elysia";
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

// Define security schemes for Swagger
const swaggerConfig = {
  path: "/w",
  documentation: {
    info: {
      title: "Axiomancer API",
      version: "1.0.0",
      description: `
## Authentication

Axiomancer API uses **dual authentication** for protected endpoints:

### Step 1: Get Your API Key
Add your OpenRouter API key to your account via frontend or directly to database.

### Step 2: Login
Call \`POST /api/auth/login\` with your username/password (or just API key) to receive a JWT token.

### Step 3: Use in Swagger
1. Click on **Authorize** button (🔒) in Swagger UI
2. Enter your **API Key** as: \`your-api-key-here\`
3. The JWT token will be automatically included in Authorization header after login

### Headers Required for Protected Routes:
- \`X-API-KEY: your-openrouter-api-key\`
- \`Authorization: Bearer your-jwt-token\`
      `,
    },
    security: [
      {
        BearerAuth: [],
        ApiKeyAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http" as const,
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token received from /api/auth/login. Format: Bearer {token}",
        },
        ApiKeyAuth: {
          type: "apiKey" as const,
          in: "header",
          name: "X-API-KEY",
          description:
            "Your OpenRouter API key. Enter just the key value (without 'X-API-KEY:' prefix)",
        },
      },
    },
  },
};

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
  .use(swagger(swaggerConfig))
  // Swagger auth helper endpoint
  .get("/w/swagger-config", () => ({
    title: "Axiomancer API - Authentication Guide",
    message: "Use the /api/auth/login endpoint to get your JWT token, then use it here.",
    loginUrl: "/api/auth/login",
    instructions: `
Step 1: Call POST /api/auth/login with your credentials
Step 2: Copy the 'token' from response
Step 3: Click Authorize button in Swagger (🔒)
Step 4: Enter 'Bearer YOUR_TOKEN' (include 'Bearer ' prefix)
Step 5: Also add your API key in the same authorize dialog:
      - Key: X-API-KEY
      - Value: your-openrouter-api-key
    `,
  }))
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
