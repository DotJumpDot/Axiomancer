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

- **Interactive Conversations** - Real-time chat with multiple OpenRouter AI models
- **Streaming Responses** - Word-by-word AI responses with configurable streaming
- **Rich Markdown Support** - Full markdown rendering with syntax-highlighted code blocks
- **Code Block Features** - Copy buttons, language detection, and code safety reminders
- **Persistent History** - Automatic conversation saving with full metadata tracking
- **Message Management** - Copy messages, edit conversation titles, archive/unarchive chats

### 🧠 **Dual-Mode AI Selection**

#### **Auto-Routing Mode**

- **Intelligent Model Selection** - Automatically routes to optimal AI models per message
- **Preset-Based Routing** - Create custom model pools (presets) for different use cases
- **Context-Aware** - Analyzes prompt complexity, content type, and required capabilities
- **Default Router Prompt** - Pre-configured decision tree for visual, technical, long, or short queries
- **Flexible Configuration** - Combine multiple models in presets for specialized workflows

#### **Single Model Mode**

- **Direct Model Selection** - Choose any enabled AI model for consistent responses
- **Model Filtering** - Filter by capabilities (fast, reasoning, coding, vision), cost, or provider
- **Favorites Support** - Quick access to your most-used models
- **Detailed Model Info** - View pricing, context length, and capabilities before selection

### 📝 **Advanced Prompt Management**

- **Prompt Profiles** - Create, edit, and manage reusable system prompts
- **Rich Prompt Editor** - Full-featured editor with markdown preview
- **Prompt-Preset Integration** - Link prompts to model presets for consistent behavior
- **Default Templates** - Built-in routing prompt template for custom modifications
- **Favorites & Search** - Organize prompts with favorites and searchable library
- **Per-Conversation Prompts** - Apply different prompts to different conversations
- **System Prompt Preview** - View formatted system prompts with markdown rendering

### 🔧 **Model Presets & Configuration**

- **Custom Preset Creation** - Build model pools for specific tasks or workflows
- **Multi-Model Selection** - Choose multiple models per preset with visual selection
- **Preset Naming** - Descriptive names for easy identification (e.g., "Coding Team", "Research Agents")
- **Prompt Association** - Link prompts to presets for complete workflow configurations
- **Preset Management** - Save, load, edit, and delete presets with persistent storage
- **Current Preset Tracking** - Visual indicator of active preset in auto-routing mode
- **Searchable Models** - Toggle model searchability within presets

### 🔍 **Integrated Search Capabilities**

- **Web Search** - DuckDuckGo API integration for real-time web results
- **Image Search** - Pixabay API for high-quality royalty-free images
- **Configurable Memory** - Adjust conversation context (1-1000 previous messages)
- **Search Context Injection** - Results automatically integrated into AI context
- **Search Logging** - Dedicated tracking of all search queries and results
- **Toggle Controls** - Enable/disable search per message with intuitive UI
- **Performance Metrics** - Track search usage and impact on responses

### 🧠 **Reasoning Effort Control**

- **4 Reasoning Levels** - Minimal, Low, Medium, High for supported models
- **Model-Aware UI** - Reasoning selector only shows for capable models
- **Reasoning Content Tracking** - Store AI reasoning process when available
- **Auto-Disable** - Automatically disables when switching to non-reasoning models
- **Cost/Quality Balance** - Choose between speed and depth of analysis
- **Visual Indicators** - Color-coded buttons show current reasoning level

### 🔐 **Authentication & Security**

- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Personal API Keys** - Store OpenRouter API keys per user (encrypted)
- **Profile Management** - Update profile info, avatar, contact details
- **Guest Mode** - Chat without account (limited features)
- **Account Controls** - Secure account deletion and data management
- **Session Persistence** - Auto-login with stored credentials

### 📊 **Performance Analytics & Tracking**

- **Token Usage** - Track prompt and completion tokens per message
- **Response Latency** - Monitor AI response times in milliseconds
- **Model Performance** - Compare performance across different models
- **Search Analytics** - Track web and image search usage patterns
- **Memory Consumption** - Monitor conversation context size
- **Cost Tracking** - Calculate token costs per conversation (per 1K tokens)
- **Reasoning Tracking** - Monitor reasoning effort usage and AI thinking process

### ⭐ **Favorites System**

- **Multi-Entity Favorites** - Favorite models, prompts, presets, and conversations
- **Quick Access** - Prioritized display of favorites in all selection interfaces
- **Persistent Storage** - Favorites synced across sessions per user
- **Visual Indicators** - Star icons with hover states for easy identification
- **Inline Management** - Add/remove favorites directly from selection lists
- **Personalized UX** - Tailored experience based on user preferences

### 🌐 **Bilingual Interface (i18n)**

- **Full Thai & English Support** - Complete translations for all UI components
- **Real-Time Switching** - Change language without page reload
- **Organized Translation Files** - JSON-based structure (`chat.json`, `auth.json`)
- **Reactive Updates** - UI instantly reflects language changes
- **Translation Helper** - `getTranslations()` and `t()` utility functions
- **Persistent Preference** - Language choice saved per user
- **Extensible System** - Easy addition of new languages

### 🎨 **Advanced Theme System**

- **7 Theme Variants** - Classic, Monokai, Dracula, Nord, Gruvbox, Solarized, GitHub
- **Light & Dark Modes** - Each variant supports both modes (14 total themes)
- **Independent Controls** - Separate theme variant and mode selection
- **Quick Toggle** - Header button for instant light/dark mode switching
- **System Detection** - Optional OS theme preference detection
- **Consistent Styling** - Unified theming across all components and dialogs
- **Instant Updates** - No page reload required for theme changes
- **Persistent Preference** - Theme and mode saved per user
- **CSS Variables** - Scalable system using CSS custom properties

### 💬 **Conversation Management**

- **Archive System** - Archive completed conversations, view/restore from archive
- **Conversation Settings** - Configure auto-scroll, typing indicators, max response length
- **Title Editing** - Rename conversations for better organization
- **Conversation Deletion** - Permanent deletion with confirmation
- **Auto-Routing Toggle** - Enable/disable auto-routing per conversation
- **Chronological Log** - `chat_log` array tracks message order
- **Favorites Integration** - Mark important conversations as favorites

### ⚙️ **Customization & Settings**

- **Font Size Control** - Small, medium, large text options
- **Send on Enter** - Toggle Enter key behavior (send vs. new line)
- **Streaming Control** - Enable/disable word-by-word AI responses
- **Sidebar Toggle** - Show/hide sidebar for more screen space
- **Auto-Scroll** - Automatic scrolling to new messages
- **Memory Configuration** - Adjust conversation context per message (1-1000)
- **Reasoning Effort** - Configure AI thinking depth per message
- **Persistent Settings** - All preferences saved to localStorage

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

4. Reasoning Effort Integration
   - Reasoning level passed to final selected model
   - Not applied to decision/routing model
```

### **Reasoning Effort System**

Configure how deeply the AI analyzes your queries:

```typescript
// Reasoning Levels:
- Disabled: Standard responses, fastest processing
- Minimal: Light reasoning with basic logic
- Low: Some problem decomposition
- Medium: Thorough analysis (recommended for complex tasks)
- High: Extensive reasoning for research/debugging
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
- User asks factual questions → Web search (DuckDuckGo)
- User requests images → Image search (Pixabay)
- Results injected into conversation context
- AI provides informed, up-to-date responses

// Memory Control (1-1000 messages):
- Configure how many previous messages AI remembers
- Balance between context richness and token usage
- Per-message configuration available
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
