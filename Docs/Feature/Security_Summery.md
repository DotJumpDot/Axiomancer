# Security Improvements Summary

## Overview

This document summarizes all security improvements made to the Axiomancer project, including JWT Bearer token authentication, rate limiting implementation, and retry logic for external API calls.

---

## 1. Dual Authentication System (JWT + API Key)

### Problem

The original system only required either JWT token OR API key, creating a security vulnerability where either credential alone could access protected endpoints.

### Solution

Implemented a proper dual-authentication system that requires BOTH:

- **JWT Bearer Token** (`Authorization: Bearer <token>`) - Identifies the authenticated user
- **API Key** (`X-API-KEY: <key>`) - Identifies the client application

### Implementation

#### Backend Changes

**1. Created `auth_middleware.ts`**

- `requireDualAuth()` - Validates both JWT token AND API key
- `requireApiKeyOnly()` - Validates only API key (for login/register)

**2. Updated `index.ts`**

- Applied global dual-auth middleware to all protected routes
- Excluded public routes (login, register, health checks)

**3. Fixed All API Routes**
Every protected endpoint now checks both credentials:

- `ai_api.ts` - AI model management
- `user_api.ts` - User operations
- `chat_api.ts` - Chat messages and conversations
- `prompt_api.ts` - Prompt profiles
- `favorite_api.ts` - User favorites
- `folder_api.ts` - Conversation folders
- `selection_api.ts` - Model selections
- `analytics_api.ts` - Analytics data
- `search_api.ts` - Search operations

**4. Login/Register Exception**
Login and register only require API key (to get JWT token)

#### Frontend Changes

**1. Updated `apiClient.ts`**

```typescript
// Every API request now includes both headers
headers: {
  "Authorization": `Bearer ${this.getToken()}`,
  "X-API-KEY": this.getApiKey(),
  "Content-Type": "application/json",
}
```

**2. Updated `authService.ts`**

- Stores and retrieves API key alongside JWT token
- API key persists in `localStorage`

**3. Updated `chatService.ts`**

- Fixed `sendMessageStream()` to include API key header
- Added rate limit error detection (429 status)

---

## 2. Security Vulnerability Fixes

### API Key Exposure (FIXED)

**Issue**: `getPublicUser()` was decrypting and returning the OpenRouter API key to frontend.

**Solution**: Modified to exclude sensitive fields:

```typescript
static getPublicUser(user: User): Omit<User, "password" | "openrouter_api_key"> {
  const { password, openrouter_api_key, ...publicUser } = user;
  return publicUser; // Key stays backend-only
}
```

### Hardcoded Secrets (FIXED)

**Issue**: `API_KEY_SALT_ROUNDS` was hardcoded in `auth_query.ts`.

**Solution**: Moved to environment variable:

```bash
# .env
API_KEY_SALT_ROUNDS=12
```

### OpenRouter API Key Encryption

**Status**: Already implemented correctly

- Uses AES-256-GCM encryption
- Keys encrypted before storage, decrypted only when needed

---

## 3. Rate Limiting Implementation

### Created `rateLimit.ts` Middleware

Simple in-memory rate limiting with the following configuration:

| Endpoint     | Limit         | Window            |
| ------------ | ------------- | ----------------- |
| Login        | 20 attempts   | 10 minutes per IP |
| Register     | 20 attempts   | 1 hour per IP     |
| Send Message | 500 requests  | 1 hour per user   |
| Send Stream  | 500 requests  | 1 hour per user   |
| Search       | 200 requests  | 1 hour per user   |
| General API  | 1000 requests | 1 hour per IP     |

### Implementation Pattern

**Auth Routes** (IP-based with inline checks):

```typescript
.post("/login", async ({ body, request }) => {
  // Check rate limit first
  const rateLimitResult = await loginRateLimit(request);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Rate limit exceeded...",
        retryAfter: rateLimitResult.retryAfter,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  // ... continue with login logic
})
```

**Protected Routes** (User-based):

```typescript
// Inside route handler
const rateLimitFn = createSendMessageRateLimit(auth.user.uuid);
const rateLimitResult = await rateLimitFn(request);
if (!rateLimitResult.allowed) {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Rate limit exceeded. You can send 500 messages per hour.",
      retryAfter: rateLimitResult.retryAfter,
    }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}
```

### Frontend Rate Limit Handling

**Translations Added** (`languages/en/chat.json` and `languages/th/chat.json`):

```json
{
  "errors": {
    "rateLimit": "Rate limit exceeded",
    "rateLimitMessage": "You can send {count} messages per hour. Please try again in {minutes} minutes.",
    "rateLimitRetry": "Too many requests. Please wait a moment before sending another message."
  }
}
```

**Store Integration** (`chat.svelte.ts`):

```typescript
function showRateLimitNotification(retryAfter?: number, lang: LanguageCode = "en") {
  const t = getTranslations(lang);
  const notification = (window as any).notification;
  if (notification) {
    if (retryAfter && retryAfter > 0) {
      const minutes = Math.ceil(retryAfter / 60);
      const message = t.errors.rateLimitMessage
        .replace("{count}", "500")
        .replace("{minutes}", minutes.toString());
      notification.warning(t.errors.rateLimit, message, { duration: 8000 });
    } else {
      notification.warning(t.errors.rateLimit, t.errors.rateLimitRetry, { duration: 5000 });
    }
  }
}
```

### Features

- Returns `429 Too Many Requests` when limit exceeded
- Includes `retryAfter` seconds in response
- Auto-cleans expired entries every 5 minutes
- In-memory storage (consider Redis for production)
- Frontend shows bilingual notification with retry time

---

## 4. Retry Logic for OpenRouter API

### Implementation (`ai_openrouter.ts`)

Added automatic retry logic with exponential backoff for all OpenRouter API calls:

```typescript
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;

function getRetryDelay(attempt: number): number {
  const exponentialDelay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}
```

### Retry Behavior

- **3 retry attempts** for failed requests
- **Exponential backoff**: 1s → 2s → 4s delays
- **Jitter**: Random 0-30% variation prevents thundering herd
- **Smart error detection**:
  - ✅ Retries on: 5xx server errors, 429 rate limits, network failures
  - ❌ No retry on: 4xx client errors (bad requests, auth failures)

### Applied to All API Methods

- `chatCompletion()` - Non-streaming requests
- `streamChatCompletion()` - Streaming with SSE
- `getModels()` - Model list fetching

---

## 5. Other Security Checks

### SQL Injection Prevention ✓

- Uses parameterized queries throughout
- No string concatenation in SQL

### XSS Protection ✓

- No direct HTML insertion
- Proper content-type headers

### CORS Configuration ✓

- Configured in `index.ts`
- Proper origin restrictions

### Password Hashing ✓

- bcrypt with 10 salt rounds
- Properly implemented in `auth_service.ts`

### File Upload Security ✓

- Type validation (image files only)
- Size limits (5MB)
- Secure filename generation with UUID
- Stored outside web root

### Error Handling ✓

- No stack traces leaked to client
- Generic error messages for security failures

---

## 6. Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_NAME=Axiomancer

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=24h

# API Keys
SERVER_OPENROUTER_API_KEY=your-openrouter-api-key
DUCKDUCKGO_API_KEY=your-duckduckgo-key
PIXABAY_API_KEY=your-pixabay-key

# Security
API_KEY_SALT_ROUNDS=12
ENCRYPTION_KEY=your-32-character-encryption-key

# Server
SERVER_PORT=4100
SERVER_CORS_ORIGIN=http://localhost:5173

# Frontend (Vite)
VITE_BACKEND_BASE_URL=http://localhost:4100
VITE_API_KEY=your-frontend-api-key
```

---

## 7. Security Checklist

| Item                     | Status         | Notes                         |
| ------------------------ | -------------- | ----------------------------- |
| Dual Authentication      | ✅ Fixed       | JWT + API Key required        |
| API Key Encryption       | ✅ Working     | AES-256-GCM                   |
| Password Hashing         | ✅ Working     | bcrypt 10 rounds              |
| Rate Limiting            | ✅ Implemented | In-memory, per IP/user        |
| Retry Logic              | ✅ Implemented | 3 retries with backoff        |
| SQL Injection Prevention | ✅ Working     | Parameterized queries         |
| XSS Protection           | ✅ Working     | No unsafe HTML                |
| CORS Configuration       | ✅ Working     | Proper origins set            |
| File Upload Security     | ✅ Working     | Type/size validation          |
| Error Handling           | ✅ Working     | No sensitive leaks            |
| API Key Exposure         | ✅ Fixed       | Not returned in responses     |
| Hardcoded Secrets        | ✅ Fixed       | Moved to env vars             |
| Frontend Notifications   | ✅ Implemented | Bilingual rate limit warnings |

---

## 8. Recommendations for Production

1. **Redis for Rate Limiting**: Replace in-memory store with Redis for distributed systems
2. **HTTPS Only**: Ensure all traffic uses HTTPS in production
3. **Secret Rotation**: Implement regular rotation for JWT_SECRET and ENCRYPTION_KEY
4. **Monitoring**: Add security event logging and alerting
5. **API Key Rotation**: Support API key expiration and rotation
6. **Rate Limit Headers**: Add X-RateLimit-Remaining headers for client awareness
7. **Queue System**: Consider adding a job queue for high-load scenarios (100+ concurrent users)

---

## 9. Files Modified

### Backend

- `src/index.ts` - Global auth middleware
- `src/api/auth/auth_middleware.ts` - Dual auth implementation
- `src/api/auth/auth_api.ts` - Rate limiting for login/register (inline checks)
- `src/api/auth/auth_query.ts` - Salt rounds from env
- `src/api/ai/ai_openrouter.ts` - Retry logic with exponential backoff
- `src/api/user/user_service.ts` - Fixed getPublicUser
- `src/api/chat/chat_api.ts` - Rate limiting for messages
- `src/api/search/search_api.ts` - Rate limiting for search
- `src/middleware/rateLimit.ts` - Rate limiting implementation

### Frontend

- `src/Service/apiClient.ts` - Dual headers
- `src/Service/authService.ts` - API key persistence
- `src/Service/chatService.ts` - Fixed streaming auth, rate limit error detection
- `src/Store/chat.svelte.ts` - Rate limit notification handling
- `src/languages/en/chat.json` - Rate limit translations
- `src/languages/th/chat.json` - Rate limit translations

### Environment

- `.env` - Added API_KEY_SALT_ROUNDS
- `env.example` - Updated with all required vars

---

## Summary

The Axiomancer project now implements a robust security model:

1. **Dual Authentication**: Both JWT and API key required for protected endpoints
2. **Rate Limiting**: Protects against brute force and abuse with frontend notifications
3. **Retry Logic**: Automatic retries with exponential backoff for external API failures
4. **Encryption**: OpenRouter API keys encrypted at rest
5. **Proper Secrets Management**: No hardcoded credentials
6. **Standard Security Practices**: XSS, SQL injection, and CORS protection

The system is now production-ready from an authentication, rate limiting, and reliability perspective.
