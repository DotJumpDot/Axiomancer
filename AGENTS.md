# AGENTS Guidelines for This Repository

This repository contains **Axiomancer**, a full-stack monorepo with:
- **Backend**: Elysia (Bun) in `Axiomancer_Backend/`
- **Frontend**: Svelte 5 (TypeScript) in `Axiomancer_Frontend/`
- **Infrastructure**: PostgreSQL database

When working on the project interactively with an agent, please follow the guidelines below
to ensure smooth development with Hot Module Replacement (HMR) and proper service management.

---

## 1. Development Workflow

### Backend (Elysia)
* **Do _not_ run dev** during development
* **Do _not_ run production builds** during development
* **Restart dev server** after dependency changes
* **Never run database migrations blindly** — review schema changes first

**Start Backend Dev Server:**
```bash
cd Axiomancer_Backend
bun run dev
```

### Frontend (Svelte)
* **Do _not_ run dev** during development
* **Do _not_ run `npm run build`** inside agent sessions — this disables HMR
* **Restart dev server** after dependency changes
* **Update languages Folder** after you change any text in the frontend or add new text

**Start Frontend Dev Server:**
```bash
cd Axiomancer_Frontend
npm run dev
```

### Database
* **PostgreSQL** for development
* **Schema documentation** in `Docs/Schema.MD`
* **Run migrations carefully** — always review SQL before executing

---

## 2. Project Structure

```
Axiomancer/
├── Axiomancer_Backend/          # Elysia Bun backend
│   ├── src/
│   │   ├── index.ts             # Application entry point
│   │   ├── api/
│   │   │   ├── ai/              # AI model routing & providers
│   │   │   │   ├── ai_api.ts
│   │   │   │   ├── ai_openrouter.ts
│   │   │   │   ├── ai_prompt.ts
│   │   │   │   └── ai_type.ts
│   │   │   ├── chat/            # Chat management
│   │   │   │   ├── chat_api.ts
│   │   │   │   ├── chat_query.ts
│   │   │   │   ├── chat_service.ts
│   │   │   │   └── chat_type.ts
│   │   │   ├── search/          # Search integrations
│   │   │   │   ├── search_duckduckgo.ts
│   │   │   │   └── search_pixabay.ts
│   │   │   └── user/            # User management
│   │   │       ├── user_api.ts
│   │   │       ├── user_query.ts
│   │   │       ├── user_service.ts
│   │   │       └── user_type.ts
│   │   └── database/
│   │       └── db.ts            # Database connection
│   ├── package.json
│   └── tsconfig.json
│
├── Axiomancer_Frontend/         # Svelte frontend
│   ├── src/
│   │   ├── App.svelte           # Main app component
│   │   ├── main.js              # Entry point
│   │   ├── lib/                 # Reusable components
│   │   ├── assets/              # Static assets
│   │   └── store/               # State management (if added)
│   ├── package.json
│   ├── vite.config.js
│   └── svelte.config.js
│
└── Docs/                        # Documentation
    ├── README.md
    └── Schema.MD                # Database schema documentation
```

---

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

| Layer | Pattern | Example |
|-------|---------|---------|
| API Routes | `{feature}_api.ts` | `ai_api.ts`, `chat_api.ts`, `user_api.ts` |
| Services | `{feature}_service.ts` | `chat_service.ts`, `user_service.ts` |
| Queries | `{feature}_query.ts` | `chat_query.ts`, `user_query.ts` |
| Types | `{feature}_type.ts` | `ai_type.ts`, `chat_type.ts`, `user_type.ts` |
| Database | `db.ts` | Database connection module |

**Rules:**
- Use **snake_case** for all TypeScript files
- Feature name should match across all layers (e.g., `chat` appears in `chat_api.ts`, `chat_service.ts`, `chat_query.ts`, `chat_type.ts`)

### Frontend (Svelte/TypeScript)
Follow these naming patterns:

| Layer | Pattern | Example |
|-------|---------|---------|
| Components | `PascalCase.svelte` | `ChatInterface.svelte`, `MessageList.svelte` |
| Component Folders | `PascalCase/` | `Auth/`, `Chat/`, `User/` |
| Stores | `lowercase.ts` | `chat.ts`, `user.ts` |
| Types | `PascalCase.ts` | `Chat.ts`, `User.ts` |
| Utils | `camelCase.ts` | `apiClient.ts`, `helpers.ts` |

**Rules:**
- Use **PascalCase** for Svelte components and TypeScript type files
- Use **camelCase** for utility files and stores
- Feature names should be consistent across Store and Types layers

---

## 5. Coding Conventions

### Backend (TypeScript)
* **Use modern TypeScript** with type annotations
* **Follow layered architecture**:
  - `api/` → Route handlers (thin layer, delegates to services)
  - `services/` → Business logic (orchestrates queries)
  - `query/` → Database queries
  - `type/` → TypeScript interfaces and types
* **Import patterns**:
  ```typescript
  import { chatService } from './chat_service';
  import type { ChatType } from './chat_type';
  ```

### Frontend (Svelte/TypeScript)
* **Prefer TypeScript** (`.ts`/`.svelte`) for all new code
* **Use Svelte 5 runes** for state management (e.g., `$state`, `$derived`)
* **Co-locate component styles** with components when practical
* **Layered architecture**:
  - `lib/` → Svelte components
  - `store/` → State management (if added)
  - `assets/` → Static assets
* **Import patterns**:
  ```typescript
  import ChatComponent from './lib/ChatComponent.svelte';
  import { chatStore } from './store/chat';
  ```

---

## 6. Database

### Database
* **SQLite** for development, **PostgreSQL** for production
* **Schema documentation** in `Docs/Schema.MD`
* **Run migrations carefully** — always review SQL before executing

---

## 7. Useful Commands

### Backend
| Command | Purpose |
|---------|---------|
| `cd Axiomancer_Backend && bun run dev` | Start Elysia dev server with hot reload |
| `bun install` | Install Bun dependencies |

### Frontend
| Command | Purpose |
|---------|---------|
| `cd Axiomancer_Frontend && npm run dev` | Start Vite dev server with HMR |
| `npm install` | Install Node dependencies |
| `npm run build` | **Production build — _do not run during agent sessions_** |

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

Following these practices ensures fast, dependable agent-assisted development. When in doubt:
- **Backend**: Restart `bun run dev`
- **Frontend**: Restart `npm run dev`