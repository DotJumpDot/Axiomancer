# 🧭 Axiomancer

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Bun](https://img.shields.io/badge/Bun-1.x+-purple.svg?logo=bun)
![Svelte](https://img.shields.io/badge/Svelte-5.x-orange.svg?logo=svelte)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)
![Elysia](https://img.shields.io/badge/Elysia-1.x+-FF6B35)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)

**An intelligent AI chat platform with multi-model auto-routing**

[Features](#-features) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 🌟 Features

### 🤖 **Multi-AI Chat Interface**

- Interactive text-based conversations with multiple OpenRouter AI models
- Real-time streaming responses with markdown rendering
- Persistent conversation history with metadata tracking

### 🧠 **Intelligent Auto-Routing System**

Automatically routes conversations to optimal AI models based on:

- **Content Classification** - Analyzes prompt complexity and type
- **Prompt Profiles** - User-defined system prompts and routing rules
- **Model Capabilities** - Reasoning, coding, vision, and speed optimization
- **Cost Optimization** - Balances performance with token costs

### 📝 **Prompt Management**

- Create reusable prompt profiles with custom system prompts
- Define routing rules and model preferences per profile
- Apply profiles to conversations for consistent AI behavior

### 🔍 **Integrated Search**

- **Web Search** - DuckDuckGo API for real-time web results
- **Image Search** - Pixabay API for high-quality image retrieval
- **Configurable Memory** - Control conversation context (1-100 messages)
- Search results automatically integrated into conversation context
- Dedicated search log table for analytics and tracking

### 🔐 **User Authentication & API Keys**

- Secure JWT-based authentication with refresh tokens
- Personal OpenRouter API key management per user
- Profile customization with avatars and preferences

### 📊 **Performance Analytics**

- Token usage tracking per conversation and model
- Response latency monitoring
- Search integration metrics

### ⭐ **Favorites System**

- Favorite AI models, prompt profiles, and conversations for quick access
- Prioritized display of favorite items in selection interfaces
- Personalized user experience with saved preferences

### 🌐 **Bilingual Interface**

- Full Thai (TH) and English (EN) language support
- Real-time language switching without page reload
- Comprehensive translations for all UI components
- Persistent language preference per user

### 🎨 **Theme System**

- **7 Theme Variants** - Classic, Monokai, Dracula, Nord, Gruvbox, Solarized, GitHub
- **Light & Dark Mode** - Each theme variant supports both light and dark modes
- **Separate Theme & Mode Controls** - Independent theme style and mode selection
- **System Theme Detection** - Automatically matches OS theme preference (optional)
- **Theme Toggle Button** - Quick mode switching (light/dark) from header
- Consistent theming across all components and dialogs
- Real-time theme switching without page reload
- Persistent theme preference per user
- Scalable theme system for easy addition of new themes

---

## 🔐 Architecture

### **Technology Stack**

#### Backend

- **Framework**: [Elysia](https://elysiajs.com/) - Fast Bun web framework
- **Runtime**: [Bun](https://bun.sh/) 1.x+ - All-in-one JavaScript runtime
- **Database**: [PostgreSQL](https://www.postgresql.org/) 15 - Relational data storage
- **Language**: TypeScript 5.x - Type-safe development

#### Frontend

- **Framework**: [Svelte 5](https://svelte.dev/) - Modern reactive UI framework
- **Build Tool**: [Vite](https://vitejs.dev/) 7.x - Lightning-fast HMR
- **Language**: TypeScript 5.x - Type-safe components

#### External APIs

- **OpenRouter** - Multi-model AI routing platform
- **DuckDuckGo** - Privacy-focused web search
- **Pixabay** - Royalty-free image search

### **Project Structure**

```
Axiomancer/
├── Axiomancer_Backend/     # Elysia API server
│   ├── src/
│   │   ├── api/            # Feature modules (auth, chat, ai, search)
│   │   │   ├── ai/         # AI model management & OpenRouter
│   │   │   ├── auth/       # Authentication & JWT
│   │   │   ├── chat/       # Message & conversation handling
│   │   │   ├── favorite/   # User favorites management
│   │   │   ├── prompt/     # Prompt profile management
│   │   │   ├── search/     # DuckDuckGo & Pixabay integration
│   │   │   ├── selection/  # User model selection & presets
│   │   │   └── user/       # User account management
│   │   ├── database/       # PostgreSQL connection
│   │   └── index.ts        # Application entry point
│   └── migrations/         # Database schema migrations
│
├── Axiomancer_Frontend/    # Svelte UI application
│   ├── src/
│   │   ├── Components/     # Reusable UI components
│   │   │   ├── Auth/       # Login & API key dialogs
│   │   │   ├── Chat/       # Message list, input, headers
│   │   │   └── Sidebar/    # Navigation & conversations
│   │   ├── Service/        # API client services
│   │   ├── Store/          # Svelte 5 state management (runes)
│   │   ├── Types/          # TypeScript interfaces
│   │   ├── Function/       # Utilities & helpers
│   │   ├── languages/      # i18n translations (en/, th/)
│   │   └── pages/          # Main application pages
│   └── public/             # Static assets
│
└── Docs/                   # Documentation & schema
```

### **Layered Backend Architecture**

Each feature follows a clean layered pattern:

```
api/{feature}/
├── {feature}_api.ts      # Route handlers (thin layer)
├── {feature}_service.ts  # Business logic & orchestration
├── {feature}_query.ts    # Database queries
└── {feature}_type.ts     # TypeScript interfaces
```

**Example Flow**:

```
HTTP Request → API Layer → Service Layer → Query Layer → PostgreSQL
            ←           ←               ←             ← Response
```

---

## 📖 Documentation

### **Database Schema**

See [Docs/Schema.md](Docs/Schema.md) for detailed database structure and relationships.

### **Agent Guidelines**

See [AGENTS.md](AGENTS.md) for AI-assisted development guidelines and conventions.

### **API Documentation**

Backend API endpoints are documented via Swagger at `http://localhost:4100/w`

---

## 🔑 Key Features Deep Dive

### **Auto-Routing System**

The intelligent routing engine analyzes each user message and selects the optimal AI model:

```typescript
// Routing Decision Factors:
1. Content Type Classification
   - Code generation → Coding-optimized models
   - Reasoning tasks → High-reasoning models
   - Visual tasks → Vision-capable models
   - Quick queries → Fast, cost-effective models

2. Prompt Profile Rules
   - User-defined model preferences
   - System prompt requirements
   - Performance thresholds

3. Cost-Performance Balance
   - Token usage limits
   - Response time requirements
   - Model availability
```

### **Prompt Profiles**

Create reusable configurations for different use cases:

- **Developer Assistant** - Code-focused with syntax highlighting
- **Research Helper** - Web search enabled, citation formatting
- **Creative Writer** - Longer context, creative models
- **Quick Answers** - Fast models, concise responses

### **Search Integration**

Seamlessly augment AI responses with real-time data:

```typescript
// Automatic Search Triggering:
- User asks factual questions → Web search
- User requests images → Image search
- Results injected into conversation context
- AI provides informed, up-to-date responses
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code conventions in [AGENTS.md](AGENTS.md)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) - Multi-model AI routing platform
- [Elysia](https://elysiajs.com/) - Fast Bun web framework
- [Svelte](https://svelte.dev/) - Reactive UI framework
- [DuckDuckGo](https://duckduckgo.com/) - Privacy-focused search
- [Pixabay](https://pixabay.com/) - Free stock images

---

<div align="center">

**Made with ❤️ by the Axiomancer Team**

[Report Bug](https://github.com/DotJumpDot/axiomancer/issues) • [Request Feature](https://github.com/DotJumpDot/axiomancer/issues)

</div>
