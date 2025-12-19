# Axiomancer Database Schema

## Table of Contents

- [Axiomancer Database Schema](#axiomancer-database-schema)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Core Entities](#core-entities)
    - [User](#user)
    - [Conversation](#conversation)
    - [AI Model](#ai-model)
    - [Prompt Profile](#prompt-profile)
    - [Chat](#chat)
    - [Search Log](#search-log)
  - [Entity Relationships](#entity-relationships)
  - [SQL Schema](#sql-schema)
    - [Create Tables](#create-tables)
  - [Sample Data](#sample-data)
    - [PostgreSQL Sample Data](#postgresql-sample-data)
  - [Data Types Notes](#data-types-notes)
  - [Migration Notes](#migration-notes)

---

## Overview

This document describes the complete database schema for the Axiomancer AI chat platform, including all entities, relationships, and sample data.

---

## Core Entities

### User
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | int | No | Primary key, auto-incremented user ID |
| uuid | string | No | Unique user identifier |
| username | str | No | Unique username for login |
| password | str | No | Hashed password for authentication |
| firstname | str | Yes | User's first name |
| lastname | str | Yes | User's last name |
| nickname | str | Yes | User's nickname/display name |
| role | str | No | User role (default: "user") |
| tel | str | Yes | Telephone number |
| picture_url | str | No | Profile picture filename (default: "unidentified.jpg") |
| created_at | datetime | No | Record creation timestamp (UTC) |
| updated_at | datetime | Yes | Record last update timestamp (UTC) |

### Conversation
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key, conversation ID |
| user_id | int | Yes | Foreign key to user.id (nullable for anonymous) |
| title | str | No | Conversation title |
| system_prompt_snapshot | text | Yes | Snapshot of system prompt at creation |
| auto_routing_enabled | boolean | No | Whether auto model routing is enabled |
| created_at | datetime | No | Record creation timestamp |
| updated_at | datetime | No | Record last update timestamp |

### AI Model
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key, model ID |
| provider | str | No | AI provider (e.g., openrouter) |
| model_key | str | No | Model identifier (e.g., mistral, gpt-4.1) |
| display_name | str | No | Human-readable model name |
| context_length | int | No | Maximum context length in tokens |
| cost_per_1k_token | decimal | No | Cost per 1000 tokens |
| capabilities | json | No | Model capabilities (reasoning, coding, vision, fast) |
| enabled | boolean | No | Whether model is enabled for use |
| created_at | datetime | No | Record creation timestamp |
| updated_at | datetime | No | Record last update timestamp |

### Prompt Profile
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key, profile ID |
| name | str | No | Profile name |
| description | str | Yes | Profile description |
| system_prompt | text | No | System prompt text |
| created_at | datetime | No | Record creation timestamp |
| updated_at | datetime | No | Record last update timestamp |

### Chat
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key, message ID |
| conversation_id | uuid | No | Foreign key to conversation.id |
| role | str | No | Message role (user/assistant/system) |
| content | text | No | Message content |
| model_id | uuid | Yes | Foreign key to ai_model.id |
| prompt_profile_id | uuid | Yes | Foreign key to prompt_profile.id |
| routing_mode | str | No | Routing mode (auto/manual) |
| used_web_search | boolean | No | Whether web search was used |
| used_image_search | boolean | No | Whether image search was used |
| search_context | json | Yes | Search results context |
| token_usage | json | Yes | Token usage statistics |
| latency_ms | int | Yes | Response latency in milliseconds |
| created_at | datetime | No | Record creation timestamp |
| updated_at | datetime | No | Record last update timestamp |

### Search Log
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key, log ID |
| message_id | uuid | No | Foreign key to chat.id |
| provider | str | No | Search provider (duckduckgo/pixabay) |
| query | str | No | Search query |
| result_count | int | No | Number of results returned |
| created_at | datetime | No | Record creation timestamp |

---

## Entity Relationships

```
user (1) ──── (many) conversation
conversation (1) ──── (many) chat
chat (many) ──── (1) ai_model
chat (many) ──── (1) prompt_profile
chat (1) ──── (many) search_log
```

---

## SQL Schema

### Create Tables

For PostgreSQL deployment, use the following adapted schema:

```sql
-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS search_log;
DROP TABLE IF EXISTS chat;
DROP TABLE IF EXISTS prompt_profile;
DROP TABLE IF EXISTS ai_model;
DROP TABLE IF EXISTS conversation;
DROP TABLE IF EXISTS "user";

-- User table
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    firstname TEXT,
    lastname TEXT,
    nickname TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    tel TEXT,
    picture_url TEXT NOT NULL DEFAULT 'unidentified.jpg',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Conversation table
CREATE TABLE conversation (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    system_prompt_snapshot TEXT,
    auto_routing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id)
);

-- AI Model table
CREATE TABLE ai_model (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_key TEXT NOT NULL,
    display_name TEXT NOT NULL,
    context_length INTEGER NOT NULL,
    cost_per_1k_token DECIMAL(10,4) NOT NULL,
    capabilities JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Prompt Profile table
CREATE TABLE prompt_profile (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chat table
CREATE TABLE chat (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model_id TEXT,
    prompt_profile_id TEXT,
    routing_mode TEXT NOT NULL CHECK (routing_mode IN ('auto', 'manual')),
    used_web_search BOOLEAN NOT NULL DEFAULT FALSE,
    used_image_search BOOLEAN NOT NULL DEFAULT FALSE,
    search_context JSONB,
    token_usage JSONB,
    latency_ms INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversation(id),
    FOREIGN KEY (model_id) REFERENCES ai_model(id),
    FOREIGN KEY (prompt_profile_id) REFERENCES prompt_profile(id)
);

-- Search Log table
CREATE TABLE search_log (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('duckduckgo', 'pixabay')),
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat(id)
);

-- Performance indexes
CREATE INDEX idx_conversation_user_id ON conversation(user_id);
CREATE INDEX idx_chat_conversation_id ON chat(conversation_id);
CREATE INDEX idx_chat_model_id ON chat(model_id);
CREATE INDEX idx_chat_created_at ON chat(created_at);
CREATE INDEX idx_search_log_message_id ON search_log(message_id);
CREATE INDEX idx_user_username ON "user"(username);
```

## Sample Data

### PostgreSQL Sample Data

```sql
-- Insert sample user
INSERT INTO "user" (uuid, username, password, firstname, lastname, nickname, role, tel, picture_url, created_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin', '1234', 'John', 'Doe', 'Johnny', 'user', '+1234567890', 'john.jpg', CURRENT_TIMESTAMP);

-- Insert sample AI models
INSERT INTO ai_model (id, provider, model_key, display_name, context_length, cost_per_1k_token, capabilities, enabled, created_at) VALUES
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'openrouter', 'mistral-7b', 'Mistral 7B', 4096, 0.0001, '{"reasoning": true, "coding": true, "vision": false, "fast": true}', TRUE, CURRENT_TIMESTAMP),
('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'openrouter', 'gpt-4', 'GPT-4', 8192, 0.0300, '{"reasoning": true, "coding": true, "vision": true, "fast": false}', TRUE, CURRENT_TIMESTAMP),
('6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'openrouter', 'deepseek-coder', 'DeepSeek Coder', 32768, 0.0014, '{"reasoning": true, "coding": true, "vision": false, "fast": false}', TRUE, CURRENT_TIMESTAMP);

-- Insert sample prompt profiles
INSERT INTO prompt_profile (id, name, description, system_prompt, created_at) VALUES
('7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'General Assistant', 'General purpose AI assistant', 'You are a helpful AI assistant.', CURRENT_TIMESTAMP),
('7ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Code Expert', 'Specialized in programming and coding', 'You are an expert programmer. Provide clear, efficient code solutions.', CURRENT_TIMESTAMP);

-- Insert sample conversation
INSERT INTO conversation (id, user_id, title, system_prompt_snapshot, auto_routing_enabled, created_at, updated_at) 
VALUES ('8ba7b810-9dad-11d1-80b4-00c04fd430c8', 1, 'First Conversation', 'You are a helpful assistant.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample chat messages
INSERT INTO chat (id, conversation_id, role, content, model_id, prompt_profile_id, routing_mode, used_web_search, used_image_search, token_usage, latency_ms, created_at, updated_at) VALUES
('9ba7b810-9dad-11d1-80b4-00c04fd430c8', '8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'user', 'Hello, how are you?', NULL, NULL, 'auto', FALSE, FALSE, '{"prompt": 4, "completion": 0, "total": 4}', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('9ba7b811-9dad-11d1-80b4-00c04fd430c8', '8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'assistant', 'I am doing well, thank you for asking! How can I help you today?', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', '7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'auto', FALSE, FALSE, '{"prompt": 4, "completion": 15, "total": 19}', 1200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

---

## Data Types Notes

- **UUID**: Stored as TEXT in SQLite for simplicity
- **JSON**: Stored as TEXT and parsed in application code
- **Boolean**: Stored as INTEGER (0/1) in SQLite
- **Decimal**: Stored as DECIMAL for cost calculations
- **Datetime**: Stored as DATETIME with CURRENT_TIMESTAMP defaults

---

## Migration Notes

When deploying to production:
1. Consider using PostgreSQL for better JSON support and performance
2. Add proper UUID generation in application code
3. Implement database migrations for schema changes
4. Add database constraints and triggers as needed
