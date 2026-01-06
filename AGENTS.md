# AGENTS Guidelines for This Repository

## Axiomancer: AI Chat Platform with Auto-Routing

**Axiomancer** is an advanced AI chat platform that implements a multi-model routing system similar to **OpenRouter.ai/chat**.

### Core Features:

1. **Multi-AI Chat Interface** - Interactive text-based chat with support for multiple OpenRouter AI models
2. **Intelligent Auto-Routing System** - Automatically routes conversations to optimal AI models based on:
   - Content type classification and complexity
   - Prompt profile specifications and requirements
   - User-defined routing rules and patterns
3. **Prompt Management** - Create and manage reusable prompt profiles with system prompts
4. **Web Search Integration** - DuckDuckGo API for structured JSON search results
5. **Image Search Integration** - Pixabay API for image retrieval in conversations
6. **Conversation History** - Persistent storage of multi-turn conversations with metadata (tokens, latency, search context)
7. **User Authentication & API Key Management** - Secure user accounts with OpenRouter API key storage

### Technology Stack:

- **Backend**: Elysia (Bun) in `Axiomancer_Backend/`
- **Frontend**: Svelte 5 (TypeScript) in `Axiomancer_Frontend/`
- **Infrastructure**: PostgreSQL database

When working on the project interactively with an agent, please follow the guidelines below
to ensure smooth development with Hot Module Replacement (HMR) and proper service management.

---

## 1. Development Workflow

### Backend (Elysia)

- **Do _not_ run dev** during development
- **Do _not_ run production builds** during development
- **Restart dev server** after dependency changes
- **Never run database migrations blindly** — review schema changes first

### Frontend (Svelte)

- **Do _not_ run dev** during development
- **Do _not_ run `npm run build`** inside agent sessions — this disables HMR
- **Restart dev server** after dependency changes
- **Update languages Folder** after you change any text in the frontend or add new text

### Database

- **PostgreSQL** for development
- **Schema documentation** in `Docs/Schema.MD`
- **Run migrations carefully** — always review SQL before executing

---

## 2. Backend Architecture & Core Entities

### Database Entities

The Axiomancer backend implements the following core entities:

#### **User**

| Purpose                       | Details                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication & Identity** | Stores user credentials, profile information, and account metadata                                                                                    |
| **OpenRouter Integration**    | Each user can store their own OpenRouter API key for personalized AI model access                                                                     |
| **Fields**                    | id, uuid, username, password (hashed), firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at              |
| **Relationships**             | One user can have many conversations                                                                                                                  |
| **API Key Management**        | Users can add/update their OpenRouter API key via the sidebar UI (key icon button). Keys are stored encrypted and used for AI model routing per user. |

#### **Conversation**

| Purpose                 | Details                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| **Session Management**  | Represents a chat session with conversation metadata                                                 |
| **Auto-Routing Config** | Stores system prompt snapshot and auto-routing toggle for conversation                               |
| **Fields**              | id (UUID), user_id (FK), title, system_prompt_snapshot, auto_routing_enabled, created_at, updated_at |
| **Relationships**       | Belongs to User; contains many Chat messages                                                         |

#### **Chat**

| Purpose                       | Details                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Message Storage**           | Stores individual messages (user/assistant/system) within a conversation                                                                                                                                                             |
| **Routing & Search Metadata** | Tracks which AI model was used, routing mode, and search integrations                                                                                                                                                                |
| **Performance Metrics**       | Records token usage and response latency                                                                                                                                                                                             |
| **Fields**                    | id (UUID), conversation_id (FK), role, content, model_id (FK), prompt_profile_id (FK), routing_mode (auto/manual), used_web_search, used_image_search, search_context (JSON), token_usage (JSON), latency_ms, created_at, updated_at |
| **Relationships**             | Belongs to Conversation; references AiModel and PromptProfile; may have many SearchLog entries                                                                                                                                       |

#### **AI Model**

| Purpose            | Details                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model Registry** | Stores available OpenRouter AI models and their capabilities                                                                                                           |
| **Routing Data**   | Model capabilities determine suitability for auto-routing decisions                                                                                                    |
| **Cost Tracking**  | Records token costs for usage analytics                                                                                                                                |
| **Fields**         | id (UUID), provider, model_key, display_name, context_length, cost_per_1k_token, capabilities (JSON: reasoning, coding, vision, fast), enabled, created_at, updated_at |
| **Relationships**  | Referenced by Chat messages for routing decisions                                                                                                                      |

#### **Prompt Profile**

| Purpose                  | Details                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| **Prompt Templates**     | Reusable system prompts that define AI behavior and routing rules   |
| **Conversation Context** | Applied to messages to shape AI responses                           |
| **Fields**               | id (UUID), name, description, system_prompt, created_at, updated_at |
| **Relationships**        | Referenced by Chat messages to apply system prompts                 |

#### **Search Log**

| Purpose             | Details                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| **Search Tracking** | Records all search queries (web/image) performed during conversations                                  |
| **Audit Trail**     | Enables analysis of search patterns and effectiveness                                                  |
| **Fields**          | id (UUID), message_id (FK), provider (duckduckgo/pixabay), query, result_count, created_at, updated_at |
| **Relationships**   | References Chat message; many logs per message for multi-source searches                               |

### Backend File Structure

```
Axiomancer_Backend/src/
├── index.ts                             # Application entry point (Elysia app setup, plugin registration)
├── api/
│   ├── ai/                              # AI model management & OpenRouter integration
│   │   ├── ai_api.ts                    # Routes: GET/POST/PUT/DELETE /ai/models
│   │   ├── ai_service.ts                # Business logic for AI model operations
│   │   ├── ai_query.ts                  # Database queries for AI models
│   │   ├── ai_openrouter.ts             # OpenRouter API client
│   │   └── ai_type.ts                   # TypeScript interfaces (AiModel, CreateAiModelRequest, etc.)
│   ├── auth/                            # User authentication & JWT
│   │   ├── auth_api.ts                  # Routes: POST /login, /register, /validate-token, /api-keys
│   │   ├── auth_service.ts              # JWT generation, password hashing
│   │   ├── auth_query.ts                # Auth-related database queries
│   │   └── auth_type.ts                 # TypeScript interfaces (LoginRequest, AuthResponse, etc.)
│   ├── chat/                            # Chat message management & conversation history
│   │   ├── chat_api.ts                  # Routes: GET/POST /api/conversations/:id/messages
│   │   ├── chat_service.ts              # Chat message logic & routing orchestration
│   │   ├── chat_query.ts                # Database queries for chat messages
│   │   └── chat_type.ts                 # TypeScript interfaces (Chat, CreateChatRequest, etc.)
│   ├── prompt/                          # Prompt profiles for system prompts & routing rules
│   │   ├── prompt_api.ts                # Routes: GET/POST/PUT/DELETE /prompts
│   │   ├── prompt_service.ts            # Prompt profile operations
│   │   ├── prompt_query.ts              # Database queries for prompts
│   │   └── prompt_type.ts               # TypeScript interfaces (PromptProfile, CreatePromptProfileRequest, etc.)
│   ├── search/                          # Search integrations
│   │   ├── search_api.ts                # Main search API orchestrator with exports
│   │   ├── duckduckgo/                  # DuckDuckGo web search
│   │   │   ├── duckduckgo_api.ts        # DuckDuckGo routes (/api/search/duckduckgo/)
│   │   │   ├── duckduckgo_service.ts    # DuckDuckGo business logic
│   │   │   ├── duckduckgo_query.ts      # DuckDuckGo data layer
│   │   │   └── duckduckgo_type.ts       # DuckDuckGo type definitions
│   │   └── pixabay/                     # Pixabay image search
│   │       ├── pixabay_api.ts           # Pixabay routes (/api/search/pixabay/)
│   │       ├── pixabay_service.ts       # Pixabay business logic
│   │       ├── pixabay_query.ts         # Pixabay data layer
│   │       └── pixabay_type.ts          # Pixabay type definitions
│   └── user/                            # User account management
│       ├── user_api.ts                  # Routes: GET/POST/PUT/DELETE /api/users
│       ├── user_service.ts              # User profile operations
│       ├── user_query.ts                # Database queries for users
│       └── user_type.ts                 # TypeScript interfaces (User, CreateUserRequest, etc.)
└── database/
    └── db.ts                            # PostgreSQL connection (using Postgres driver)
```

## 3. Keep Dependencies in Sync

### Backend (Bun)

When adding/updating Bun packages:

```bash
cd Axiomancer_Backend
bun add <package>
# This auto-updates package.json
```

### Frontend (Node)

When adding/updating npm packages:

```bash
cd Axiomancer_Frontend
npm install <package>
# This auto-updates package-lock.json
# Restart dev server after changes
```

---

## 4. File Naming Conventions

### Backend (TypeScript)

Follow these strict naming patterns for consistency:

| Layer      | Pattern                | Example                                      |
| ---------- | ---------------------- | -------------------------------------------- |
| API Routes | `{feature}_api.ts`     | `ai_api.ts`, `chat_api.ts`, `user_api.ts`    |
| Services   | `{feature}_service.ts` | `chat_service.ts`, `user_service.ts`         |
| Queries    | `{feature}_query.ts`   | `chat_query.ts`, `user_query.ts`             |
| Types      | `{feature}_type.ts`    | `ai_type.ts`, `chat_type.ts`, `user_type.ts` |
| Database   | `db.ts`                | Database connection module                   |

**Rules:**

- Use **snake_case** for all TypeScript files
- Feature name should match across all layers (e.g., `chat` appears in `chat_api.ts`, `chat_service.ts`, `chat_query.ts`, `chat_type.ts`)

### Frontend (Svelte/TypeScript)

Follow these naming patterns:

| Layer             | Pattern             | Example                                      |
| ----------------- | ------------------- | -------------------------------------------- |
| Components        | `PascalCase.svelte` | `ChatInterface.svelte`, `MessageList.svelte` |
| Component Folders | `PascalCase/`       | `Auth/`, `Chat/`, `User/`                    |
| Stores            | `lowercase.ts`      | `chat.ts`, `user.ts`                         |
| Types             | `PascalCase.ts`     | `Chat.ts`, `User.ts`                         |
| Utils             | `camelCase.ts`      | `apiClient.ts`, `helpers.ts`                 |

**Rules:**

- Use **PascalCase** for Svelte components and TypeScript type files
- Use **camelCase** for utility files and stores
- Feature names should be consistent across Store and Types layers

---

## 5. Coding Conventions

### Backend (TypeScript)

- **Use modern TypeScript** with type annotations
- **Follow layered architecture**:
  - `api/` → Route handlers (thin layer, delegates to services)
  - `services/` → Business logic (orchestrates queries)
  - `query/` → Database queries
  - `type/` → TypeScript interfaces and types
- **Import patterns**:
  ```typescript
  import { chatService } from "./chat_service";
  import type { ChatType } from "./chat_type";
  ```

### Frontend (Svelte/TypeScript)

- **Prefer TypeScript** (`.ts`/`.svelte`) for all new code
- **Use Svelte 5 runes** for state management (e.g., `$state`, `$derived`)
- **Co-locate component styles** with components when practical
- **Layered architecture**:
  - `lib/` → Svelte components
  - `store/` → State management (if added)
  - `assets/` → Static assets
- **Import patterns**:
  ```typescript
  import ChatComponent from "./lib/ChatComponent.svelte";
  import { chatStore } from "./store/chat";
  ```

---

## 6. Database

### Database

- **SQLite** for development, **PostgreSQL** for production
- **Schema documentation** in `Docs/Schema.MD`
- **Run migrations carefully** — always review SQL before executing

---

## 7. Useful Commands

### Backend

| Command                                | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `cd Axiomancer_Backend && bun run dev` | Start Elysia dev server with hot reload |
| `bun install`                          | Install Bun dependencies                |

### Frontend

| Command                                 | Purpose                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| `cd Axiomancer_Frontend && npm run dev` | Start Vite dev server with HMR                            |
| `npm install`                           | Install Node dependencies                                 |
| `npm run build`                         | **Production build — _do not run during agent sessions_** |

---

## 8. Key Technologies

**Backend Stack:**

- Elysia, Bun 1.x+
- TypeScript 5.x
- OpenRouter API (for AI models)
- DuckDuckGo API (web search)
- Pixabay API (image search)
- SQLite/PostgreSQL

**Frontend Stack:**

- Svelte 5.x, Vite 7.x
- TypeScript 5.x

**DevOps:**

- ESLint (linting)
- TypeScript Compiler (type checking)

---
