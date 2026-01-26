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
    - [Chat AI Respond](#chat-ai-respond)
    - [User Selected Models](#user-selected-models)
    - [User Favorite](#user-favorite)
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

| Column             | Type     | Nullable | Description                                                |
| ------------------ | -------- | -------- | ---------------------------------------------------------- |
| id                 | int      | No       | Primary key, auto-incremented user ID                      |
| uuid               | string   | No       | Unique user identifier                                     |
| username           | str      | No       | Unique username for login                                  |
| password           | str      | No       | Hashed password for authentication                         |
| email              | str      | No       | User's email address                                       |
| firstname          | str      | Yes      | User's first name                                          |
| lastname           | str      | Yes      | User's last name                                           |
| nickname           | str      | Yes      | User's nickname/display name                               |
| role               | str      | No       | User role (default: "user")                                |
| tel                | str      | Yes      | Telephone number                                           |
| picture_url        | str      | No       | Profile picture filename (default: "userUnidentified.png") |
| openrouter_api_key | text     | Yes      | User's personal OpenRouter API key                         |
| created_at         | datetime | No       | Record creation timestamp (UTC)                            |
| updated_at         | datetime | Yes      | Record last update timestamp (UTC)                         |

### Conversation

| Column               | Type     | Nullable | Description                                       |
| -------------------- | -------- | -------- | ------------------------------------------------- |
| id                   | uuid     | No       | Primary key, conversation ID                      |
| user_uuid            | str      | Yes      | Foreign key to user.uuid (nullable for anonymous) |
| title                | str      | No       | Conversation title                                |
| auto_routing_enabled | boolean  | No       | Whether auto model routing is enabled             |
| chat_log             | text[]   | No       | Array of chat IDs in chronological order          |
| archived             | boolean  | No       | Whether conversation is archived (default false)  |
| created_at           | datetime | No       | Record creation timestamp                         |
| updated_at           | datetime | No       | Record last update timestamp                      |

### AI Model

| Column            | Type     | Nullable | Description                                          |
| ----------------- | -------- | -------- | ---------------------------------------------------- |
| id                | uuid     | No       | Primary key, model ID                                |
| provider          | str      | No       | AI provider (e.g., openrouter)                       |
| model_key         | str      | No       | Model identifier (e.g., mistral, gpt-4.1)            |
| display_name      | str      | No       | Human-readable model name                            |
| context_length    | int      | No       | Maximum context length in tokens                     |
| cost_per_1k_token | decimal  | No       | Cost per 1000 tokens                                 |
| capabilities      | json     | No       | Model capabilities (reasoning, coding, vision, fast) |
| enabled           | boolean  | No       | Whether model is enabled for use                     |
| created_at        | datetime | No       | Record creation timestamp                            |
| updated_at        | datetime | No       | Record last update timestamp                         |

### Prompt Profile

| Column        | Type     | Nullable | Description                  |
| ------------- | -------- | -------- | ---------------------------- |
| id            | uuid     | No       | Primary key, profile ID      |
| user_uuid     | str      | Yes      | Foreign key to user.uuid     |
| name          | str      | No       | Profile name                 |
| description   | str      | Yes      | Profile description          |
| system_prompt | text     | No       | System prompt text           |
| created_at    | datetime | No       | Record creation timestamp    |
| updated_at    | datetime | No       | Record last update timestamp |

### Chat

| Column             | Type     | Nullable | Description                                |
| ------------------ | -------- | -------- | ------------------------------------------ |
| id                 | uuid     | No       | Primary key, message ID                    |
| conversation_id    | uuid     | No       | Foreign key to conversation.id             |
| role               | str      | No       | Message role (user/assistant/system)       |
| content            | text     | No       | User message content (empty for assistant) |
| model_id           | uuid     | Yes      | Foreign key to ai_model.id                 |
| prompt_profile_id  | uuid     | Yes      | Foreign key to prompt_profile.id           |
| routing_mode       | str      | No       | Routing mode (auto/manual)                 |
| search_log_uuid    | uuid     | Yes      | Foreign key to search_log.id_uuid          |
| chat_ai_respond_id | uuid     | Yes      | Foreign key to chat_ai_respond.id          |
| respond_error      | boolean  | No       | Whether AI response failed (default false) |
| created_at         | datetime | No       | Record creation timestamp                  |
| updated_at         | datetime | No       | Record last update timestamp               |

### Search Log

| Column                 | Type     | Nullable | Description                                                  |
| ---------------------- | -------- | -------- | ------------------------------------------------------------ |
| id_no                  | int      | No       | Primary key, auto-incremented log ID (unique)                |
| id_uuid                | uuid     | No       | Unique UUID identifier for the log                           |
| chat_id                | uuid     | No       | Foreign key to chat.id                                       |
| memory_chat_include    | int      | No       | Number of previous messages included in context (default 20) |
| used_web_search        | boolean  | No       | Whether web search was used (default false)                  |
| used_image_search      | boolean  | No       | Whether image search was used (default false)                |
| used_steam             | boolean  | No       | Whether Steam search was used (default false)                |
| reasoning_effort       | text     | Yes      | Reasoning effort level (minimal/low/medium/high)             |
| reasoning_content      | text     | Yes      | Reasoning process content from AI models                     |
| decision_prompt_model  | text     | Yes      | Model key for AI that creates optimized search prompts       |
| prompt_web_search      | text     | Yes      | AI-optimized prompt used for web search query                |
| prompt_picture_search  | text     | Yes      | AI-optimized prompt used for picture/image search query      |
| search_context_web     | json     | Yes      | Web search results context (DuckDuckGo)                      |
| search_context_picture | json     | Yes      | Image search results context (Pixabay)                       |
| created_at             | datetime | No       | Record creation timestamp                                    |

### Chat AI Respond

| Column        | Type     | Nullable | Description                                  |
| ------------- | -------- | -------- | -------------------------------------------- |
| id            | uuid     | No       | Primary key, AI response ID                  |
| ai_content    | text     | No       | AI response text content                     |
| model_key     | str      | Yes      | Model that generated the response            |
| token_usage   | json     | Yes      | Token usage (prompt, completion, total)      |
| latency_ms    | int      | Yes      | Response generation latency in milliseconds  |
| finish_reason | str      | Yes      | Completion finish reason (stop, length, etc) |
| created_at    | datetime | No       | Record creation timestamp                    |
| updated_at    | datetime | No       | Record last update timestamp                 |

### User Selected Models

| Column       | Type     | Nullable | Description                                |
| ------------ | -------- | -------- | ------------------------------------------ |
| preset       | int      | No       | Auto-incrementing preset number (reusable) |
| user_uuid    | str      | No       | Foreign key to user.uuid                   |
| ai_model_ids | text[]   | No       | Array of AI model IDs                      |
| prompt_id    | uuid     | Yes      | Foreign key to prompt_profile.id           |
| searchable   | boolean  | No       | Whether this preset is searchable          |
| created_at   | datetime | No       | Record creation timestamp                  |
| updated_at   | datetime | No       | Record last update timestamp               |

### User Favorite

| Column                | Type     | Nullable | Description                               |
| --------------------- | -------- | -------- | ----------------------------------------- |
| id                    | int      | No       | Primary key, auto-incremented favorite ID |
| user_uuid             | str      | No       | Foreign key to user.uuid                  |
| favorite_models       | text[]   | No       | Array of favorite model keys              |
| favorite_prompts      | text[]   | No       | Array of favorite prompt profile IDs      |
| favorite_conversation | text[]   | No       | Array of favorite conversation IDs        |
| created_at            | datetime | No       | Record creation timestamp                 |
| updated_at            | datetime | No       | Record last update timestamp              |

### User Conversation Folder

| Column           | Type     | Nullable | Description                                        |
| ---------------- | -------- | -------- | -------------------------------------------------- |
| id               | uuid     | No       | Primary key, folder ID                             |
| user_uuid        | str      | No       | Foreign key to user.uuid                           |
| folder_name      | str      | No       | Display name of the folder                         |
| conversation_ids | text[]   | No       | Array of conversation IDs in this folder (ordered) |
| is_collapsed     | boolean  | No       | Whether folder is collapsed in UI (default false)  |
| position         | int      | No       | Display order position (lower = higher in list)    |
| created_at       | datetime | No       | Record creation timestamp                          |
| updated_at       | datetime | No       | Record last update timestamp                       |

---

## Entity Relationships

```
user (1) ──── (many) conversation
user (1) ──── (many) user_selected_models
user (1) ──── (many) prompt_profile
user (1) ──── (1) user_favorite
user (1) ──── (many) user_conversation_folder
conversation (1) ──── (many) chat
chat (many) ──── (1) ai_model
chat (many) ──── (1) prompt_profile
chat (1) ──── (many) search_log
chat (1) ──── (1) chat_ai_respond
user_selected_models (many) ──── (many) ai_model
user_selected_models (many) ──── (1) prompt_profile
user_favorite (many) ──── (many) ai_model
user_favorite (many) ──── (many) prompt_profile
user_favorite (many) ──── (many) conversation
user_conversation_folder (many) ──── (many) conversation
```

---

## SQL Schema

### Create Tables

For PostgreSQL deployment, use the following adapted schema:

```sql
-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS search_log;
DROP TABLE IF EXISTS chat;
DROP TABLE IF EXISTS chat_ai_respond;
DROP TABLE IF EXISTS prompt_profile;
DROP TABLE IF EXISTS ai_model;
DROP TABLE IF EXISTS conversation;
DROP TABLE IF EXISTS user_selected_models;
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS user_favorite;

-- User table
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    firstname TEXT,
    lastname TEXT,
    nickname TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    tel TEXT,
    picture_url TEXT NOT NULL DEFAULT 'userUnidentified.png',
    openrouter_api_key TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Conversation table
CREATE TABLE conversation (
    id TEXT PRIMARY KEY,
    user_uuid TEXT,
    title TEXT NOT NULL,
    auto_routing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    chat_log TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES "user"(uuid)
);

-- AI Model table
CREATE TABLE ai_model (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_key TEXT NOT NULL,
    display_name TEXT NOT NULL,
    context_length INTEGER NOT NULL,
    cost_per_1k_token DECIMAL(14,10) NOT NULL,
    capabilities JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Prompt Profile table
CREATE TABLE prompt_profile (
    id TEXT PRIMARY KEY,
    user_uuid TEXT,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES "user"(uuid)
);

-- Chat AI Respond table
CREATE TABLE chat_ai_respond (
    id TEXT PRIMARY KEY,
    ai_content TEXT NOT NULL,
    model_key TEXT,
    token_usage JSONB,
    latency_ms INTEGER,
    finish_reason TEXT,
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
    search_log_uuid TEXT,
    chat_ai_respond_id TEXT,
    respond_error BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversation(id),
    FOREIGN KEY (model_id) REFERENCES ai_model(id),
    FOREIGN KEY (prompt_profile_id) REFERENCES prompt_profile(id),
    FOREIGN KEY (chat_ai_respond_id) REFERENCES chat_ai_respond(id)
);

-- Search Log table
CREATE TABLE search_log (
    id_no SERIAL PRIMARY KEY,
    id_uuid TEXT NOT NULL UNIQUE,
    chat_id TEXT NOT NULL,
    memory_chat_include INTEGER NOT NULL DEFAULT 20,
    used_web_search BOOLEAN NOT NULL DEFAULT FALSE,
    used_image_search BOOLEAN NOT NULL DEFAULT FALSE,
    used_steam BOOLEAN NOT NULL DEFAULT FALSE,
    reasoning_effort TEXT,
    reasoning_content TEXT,
    search_context_web JSONB,
    search_context_picture JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chat(id)
);

-- User Selected Models table
CREATE TABLE user_selected_models (
    preset SERIAL PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    preset_name TEXT,
    ai_model_ids TEXT[] NOT NULL,
    prompt_id TEXT,
    searchable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES "user"(uuid),
    FOREIGN KEY (prompt_id) REFERENCES prompt_profile(id)

);

-- User Favorite table
CREATE TABLE user_favorite (
    id SERIAL PRIMARY KEY,
    user_uuid TEXT NOT NULL UNIQUE,
    favorite_models TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    favorite_prompts TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    favorite_conversation TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES "user"(uuid)
);

-- User Conversation Folder table
CREATE TABLE user_conversation_folder (
    id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    folder_name TEXT NOT NULL,
    conversation_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES "user"(uuid)
);


-- Add foreign key constraint for chat to search_log after both tables are created
ALTER TABLE chat ADD CONSTRAINT fk_chat_search_log FOREIGN KEY (search_log_uuid) REFERENCES search_log(id_uuid);


-- Performance indexes
CREATE INDEX idx_conversation_user_uuid ON conversation(user_uuid);
CREATE INDEX idx_chat_conversation_id ON chat(conversation_id);
CREATE INDEX idx_chat_model_id ON chat(model_id);
CREATE INDEX idx_chat_ai_respond_id ON chat(chat_ai_respond_id);
CREATE INDEX idx_chat_created_at ON chat(created_at);
CREATE INDEX idx_chat_ai_respond_created_at ON chat_ai_respond(created_at);
CREATE INDEX idx_search_log_chat_id ON search_log(chat_id);
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_selected_models_user_uuid ON user_selected_models(user_uuid);
CREATE INDEX idx_user_favorite_user_uuid ON user_favorite(user_uuid);
CREATE INDEX idx_user_conversation_folder_user_uuid ON user_conversation_folder(user_uuid);
```

## Sample Data

### PostgreSQL Sample Data

```sql
-- Insert sample user
INSERT INTO "user" (uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin', '1234', 'admin@example.com', 'John', 'Doe', 'Johnny', 'user', '+1234567890', 'john.jpg', NULL, CURRENT_TIMESTAMP);

-- Insert sample AI models
INSERT INTO ai_model (id, provider, model_key, display_name, context_length, cost_per_1k_token, capabilities, enabled, created_at) VALUES
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'openrouter', 'mistral-7b', 'Mistral 7B', 4096, 0.000100, '{"reasoning": true, "coding": true, "vision": false, "fast": true}', TRUE, CURRENT_TIMESTAMP),
('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'openrouter', 'gpt-4', 'GPT-4', 8192, 0.030000, '{"reasoning": true, "coding": true, "vision": true, "fast": false}', TRUE, CURRENT_TIMESTAMP),
('6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'openrouter', 'deepseek-coder', 'DeepSeek Coder', 32768, 0.001400, '{"reasoning": true, "coding": true, "vision": false, "fast": false}', TRUE, CURRENT_TIMESTAMP);

-- Insert sample prompt profiles
INSERT INTO prompt_profile (id, user_uuid, name, description, system_prompt, created_at) VALUES
('7ba7b810-9dad-11d1-80b4-00c04fd430c8', '550e8400-e29b-41d4-a716-446655440000', 'General Assistant', 'General purpose AI assistant', 'You are a helpful AI assistant.', CURRENT_TIMESTAMP),
('7ba7b811-9dad-11d1-80b4-00c04fd430c8', '550e8400-e29b-41d4-a716-446655440000', 'Code Expert', 'Specialized in programming and coding', 'You are an expert programmer. Provide clear, efficient code solutions.', CURRENT_TIMESTAMP);

-- Insert sample conversation
INSERT INTO conversation (id, user_uuid, title, auto_routing_enabled, created_at, updated_at)
VALUES ('8ba7b810-9dad-11d1-80b4-00c04fd430c8', '550e8400-e29b-41d4-a716-446655440000', 'First Conversation', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample chat messages
INSERT INTO chat (id, conversation_id, role, content, model_id, prompt_profile_id, routing_mode, search_log_uuid, chat_ai_respond_id, respond_error, created_at, updated_at) VALUES
('9ba7b810-9dad-11d1-80b4-00c04fd430c8', '8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'user', 'Hello, how are you?', NULL, NULL, 'auto', NULL, NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('9ba7b811-9dad-11d1-80b4-00c04fd430c8', '8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'assistant', 'I am doing well, thank you for asking! How can I help you today?', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', '7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'auto', NULL, NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample user selected models
INSERT INTO user_selected_models (preset, user_uuid, ai_model_ids, prompt_id, searchable, created_at, updated_at) VALUES
(1, '550e8400-e29b-41d4-a716-446655440000', ARRAY['6ba7b810-9dad-11d1-80b4-00c04fd430c8', '6ba7b811-9dad-11d1-80b4-00c04fd430c8'], '7ba7b810-9dad-11d1-80b4-00c04fd430c8', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '550e8400-e29b-41d4-a716-446655440000', ARRAY['6ba7b812-9dad-11d1-80b4-00c04fd430c8'], NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

---

## Data Types Notes

- **UUID**: Stored as TEXT in SQLite for simplicity
- **Arrays**: Stored as native PostgreSQL arrays (e.g., text[])
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
5. For the `prompt_id` addition to `user_selected_models`: Run `ALTER TABLE user_selected_models ADD COLUMN prompt_id TEXT REFERENCES prompt_profile(id);`
