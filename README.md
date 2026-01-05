# � Axiomancer

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

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Documentation](#-documentation)

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
- Search results automatically integrated into conversation context

### 🔐 **User Authentication & API Keys**

- Secure JWT-based authentication with refresh tokens
- Personal OpenRouter API key management per user
- Profile customization with avatars and preferences

### 📊 **Performance Analytics**

- Token usage tracking per conversation and model
- Response latency monitoring
- Search integration metrics

---

## 🏗️ Architecture

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
│   │   │   ├── ai/         # AI model management
│   │   │   ├── auth/       # Authentication & JWT
│   │   │   ├── chat/       # Message & conversation handling
│   │   │   ├── prompt/     # Prompt profile management
│   │   │   ├── search/     # DuckDuckGo & Pixabay integration
│   │   │   ├── selection/  # Model selection management
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

## 🚀 Getting Started

### **Prerequisites**

- [Bun](https://bun.sh/) 1.x or higher
- [Node.js](https://nodejs.org/) 18.x or higher
- [PostgreSQL](https://www.postgresql.org/) 15 or higher
- [OpenRouter API Key](https://openrouter.ai/) (for AI models)

### **Installation**

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/axiomancer.git
cd Axiomancer
```

2. **Setup Backend**

```bash
cd Axiomancer_Backend

# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run database migrations
bun run migrate

# Start dev server
bun run dev
```

3. **Setup Frontend**

```bash
cd ../Axiomancer_Frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with backend API URL

# Start dev server
npm run dev
```

4. **Access the application**

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### **Environment Variables**

#### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/axiomancer

# JWT Authentication
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# API Keys (optional - users can provide their own)
OPENROUTER_API_KEY=your-openrouter-key
DUCKDUCKGO_API_KEY=your-duckduckgo-key (if required)
PIXABAY_API_KEY=your-pixabay-key

# Server
PORT=3000
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## 📖 Documentation

### **Database Schema**

See [Docs/Schema.md](Docs/Schema.md) for detailed database structure and relationships.

### **Agent Guidelines**

See [AGENTS.md](AGENTS.md) for AI-assisted development guidelines and conventions.

### **API Documentation**

Backend API endpoints are documented via Swagger at `http://localhost:3000/swagger`

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

## 🛠️ Development

### **Backend Development**

```bash
cd Axiomancer_Backend
bun run dev          # Start dev server with hot reload
bun run lint         # Run ESLint
bun run type-check   # TypeScript type checking
```

### **Frontend Development**

```bash
cd Axiomancer_Frontend
npm run dev          # Start Vite dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build
```

### **Database Migrations**

```bash
# Create new migration
cd Axiomancer_Backend/migrations
touch 002_your_migration.sql

# Apply migrations
bun run migrate
```

### **Code Conventions**

- **Backend**: snake_case for files, PascalCase for types
- **Frontend**: PascalCase for components, camelCase for utilities
- **Imports**: Use relative paths within features, absolute for cross-feature
- **Types**: Co-locate types with features in `*_type.ts` files

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

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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

[Report Bug](https://github.com/yourusername/axiomancer/issues) • [Request Feature](https://github.com/yourusername/axiomancer/issues)

</div>
