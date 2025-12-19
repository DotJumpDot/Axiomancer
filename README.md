# � Axiomancer

[![Svelte](https://img.shields.io/badge/Svelte-5.x-FF3E00?logo=svelte)](https://svelte.dev/)
[![Elysia](https://img.shields.io/badge/Elysia-1.x+-FF6B35)](https://elysiajs.com/)
[![Bun](https://img.shields.io/badge/Bun-1.x+-FBF0DF?logo=bun)](https://bun.sh/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-FF6B35)](https://openrouter.ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

> 🌐 **[Complete API Documentation](Docs/)**  🌐 **[Complete Schema Documentation](Docs/Schema)** 

**Axiomancer** is a lightweight AI chat platform designed to dynamically select and route AI models based on conversation context and user intent, without using complex agent frameworks.

The system emphasizes model flexibility, prompt control, and extensible search augmentation, while remaining simple and production-friendly.

---

## Table of Contents

- [Project Goals](#project-goals)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Database Schema](Docs/Schema.MD)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Project Goals

- Build an AI chat backend that can automatically choose the most suitable AI model per message
- Allow users to manually switch models and prompts
- Support optional web and image search augmentation
- Store chat history and metadata in a database
- Keep the system simple (no agent frameworks) and easy to maintain

---

## 🧩 Core Features

### 1. Dynamic AI Model Routing

A lightweight AI Router evaluates:

- User prompt
- Conversation history
- System rules

Selects the most appropriate model (e.g. fast, cheap, reasoning-focused)

**Example use cases:**
- Short Q&A → fast / cheap-free model
- Technical or coding questions → reasoning / coding model
- Long context chats → larger context window model

### 2. Manual Model & Prompt Switching

Users can:

- Override auto-selected models
- Switch between predefined prompt profiles

**Useful for:**
- Testing models
- Cost control
- Prompt experimentation

### 3. Optional Web & Image Search

Search is explicitly controlled (on/off toggle)

Backend integrates:

- **DuckDuckGo** for web search
- **Pixabay** for image search

Search results are injected into prompts as additional context

No tool-calling dependency — the backend controls when and how search is used.

### 4. Chat History & Persistence

Stores:

- Messages
- Selected model
- Prompt profile
- Search usage flags

Enables:

- Chat replay
- Analytics
- Model performance comparison

### 5. Streaming Chat Responses

Supports streaming responses from AI providers

Frontend displays messages progressively for better UX

---

## 🧩 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Svelte** | 5.x | Reactive UI framework |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Vite** | 7.x | Fast build tool and dev server |
| **TailwindCSS** | - | Utility-first CSS (if used) |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.x+ | JavaScript runtime |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Elysia** | - | Backend framework |
| **OpenRouter** | - | AI model API provider |
| **DuckDuckGo API** | - | Web search integration |
| **Pixabay API** | - | Image search integration |
| **PostgreSQL** | - | Database for chat history |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization (optional) |
| **ESLint** | Code linting |
| **TypeScript Compiler** | Type checking |

---

## 🏗️ Architecture

```
Axiomancer/
├── Axiomancer_Frontend/         # Svelte Frontend
│   ├── src/
│   │   ├── App.svelte           # Main app component
│   │   ├── main.js              # Entry point
│   │   ├── lib/                 # Reusable components
│   │   ├── assets/              # Static assets
│   │   └── store/               # State management
│   ├── package.json
│   ├── vite.config.js
│   └── svelte.config.js
│
├── Axiomancer_Backend/          # Elysia Backend
│   ├── src/
│   │   ├── index.ts             # Application entry point
│   │   ├── api/
│   │   │   ├── ai/              # AI model routing & providers
│   │   │   │   ├── ai_api.ts
│   │   │   │   ├── ai_openrouter.ts
│   │   │   │   ├── ai_prompt.ts
│   │   │   │   └── ai_type.ts
│   │   │   ├── auth/            # Authentication
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
└── Docs/                        # Documentation
```

---

## ⚙️ Installation

### Prerequisites
- Bun 1.x+
- npm or yarn (for frontend)

### Setup

**Backend:**
```bash
cd Axiomancer_Backend
bun install
bun run dev
```

**Frontend:**
```bash
cd Axiomancer_Frontend
npm install
npm run dev
```

### Environment Variables
```env
# AI Provider
OPENROUTER_API_KEY=your-openrouter-key

# Search APIs
DUCKDUCKGO_API_KEY=your-duckduckgo-key
PIXABAY_API_KEY=your-pixabay-key

# Database
DATABASE_URL=sqlite://./database.db  # or PostgreSQL URL

# Other
JWT_SECRET=your-secret-key
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send chat message with auto model selection |
| `GET` | `/api/chat/history` | Get chat history |
| `POST` | `/api/auth/login` | User authentication |
| `GET` | `/api/models` | List available AI models |
| `POST` | `/api/search/web` | Perform web search |
| `POST` | `/api/search/image` | Perform image search |

---

## 🛠️ Development

```bash
# Frontend
npm run dev

# Backend
bun run dev

# Build for production
npm run build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**DotJumpDot**

- GitHub: [@DotJumpDot](https://github.com/DotJumpDot)

---

<p align="center">Made with ❤️ using Svelte & Elysia</p>
