# Useful SQL Queries for Axiomancer

A collection of useful SQL queries for managing and analyzing data in the Axiomancer database.

## Table of Contents

- [Chat and AI Response Queries](#chat-and-ai-response-queries)
- [Conversation Queries](#conversation-queries)
- [User and Model Queries](#user-and-model-queries)
- [Search Log Queries](#search-log-queries)
- [User Favorites Queries](#user-favorites-queries)
- [Analytics Queries](#analytics-queries)
- [Maintenance Queries](#maintenance-queries)
- [Folder Queries](#folder-queries)

---

## Chat and AI Response Queries

### Get Chat Messages with AI Responses

```sql
SELECT
    c.id,
    c.conversation_id,
    c.role,
    c.content,
    c.created_at as message_time,
    car.ai_content,
    car.model_key,
    car.token_usage,
    car.latency_ms,
    car.finish_reason,
    car.created_at as response_time
FROM public.chat c
LEFT JOIN public.chat_ai_respond car ON c.chat_ai_respond_id = car.id
WHERE c.conversation_id = 'your-conversation-id'
ORDER BY c.created_at ASC;
```

### Get Recent Chat Messages with Search Context

```sql
SELECT
    c.id,
    c.conversation_id,
    c.role,
    c.content,
    c.created_at,
    sl.used_web_search,
    sl.used_image_search,
    sl.memory_chat_include,
    sl.search_context_web,
    sl.search_context_picture
FROM public.chat c
INNER JOIN public.search_log sl ON c.search_log_uuid = sl.id_uuid
ORDER BY c.updated_at DESC
LIMIT 100;
```

### Get Chat Messages with Model Information

```sql
SELECT
    c.id,
    c.conversation_id,
    c.role,
    c.content,
    c.created_at,
    am.display_name as model_name,
    am.provider,
    am.cost_per_1k_token,
    car.token_usage
FROM public.chat c
LEFT JOIN public.ai_model am ON c.model_id = am.id
LEFT JOIN public.chat_ai_respond car ON c.chat_ai_respond_id = car.id
WHERE c.conversation_id = 'your-conversation-id'
ORDER BY c.created_at ASC;
```

## Conversation Queries

### Get Conversations with Message Counts

```sql
SELECT
    conv.id,
    conv.title,
    conv.created_at,
    conv.updated_at,
    conv.archived,
    COUNT(c.id) as message_count,
    MAX(c.created_at) as last_message_time
FROM public.conversation conv
LEFT JOIN public.chat c ON conv.id = c.conversation_id
GROUP BY conv.id, conv.title, conv.created_at, conv.updated_at, conv.archived
ORDER BY last_message_time DESC NULLS LAST;
```

### Get Conversation with Latest Message Preview

```sql
SELECT
    conv.id,
    conv.title,
    conv.created_at,
    conv.archived,
    latest_msg.content as last_message,
    latest_msg.created_at as last_message_time,
    COUNT(all_msg.id) as total_messages
FROM public.conversation conv
LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM public.chat
    WHERE conversation_id = conv.id
    ORDER BY created_at DESC
    LIMIT 1
) latest_msg ON true
LEFT JOIN public.chat all_msg ON conv.id = all_msg.conversation_id
GROUP BY conv.id, conv.title, conv.created_at, conv.archived, latest_msg.content, latest_msg.created_at
ORDER BY last_message_time DESC NULLS LAST;
```

### Get Conversations with User Information

```sql
SELECT
    conv.id,
    conv.title,
    conv.created_at,
    conv.archived,
    u.username,
    u.firstname,
    u.lastname,
    u.nickname,
    COUNT(c.id) as message_count
FROM public.conversation conv
LEFT JOIN public."user" u ON conv.user_uuid = u.uuid
LEFT JOIN public.chat c ON conv.id = c.conversation_id
GROUP BY conv.id, conv.title, conv.created_at, conv.archived, u.username, u.firstname, u.lastname, u.nickname
ORDER BY conv.created_at DESC;
```

## User Queries

### Get Users with Their Favorites

```sql
SELECT
    u.id,
    u.uuid,
    u.username,
    u.firstname,
    u.lastname,
    u.email,
    u.created_at,
    uf.favorite_models,
    uf.favorite_prompts,
    uf.favorite_conversation,
    ARRAY_LENGTH(uf.favorite_models, 1) as favorite_models_count,
    ARRAY_LENGTH(uf.favorite_prompts, 1) as favorite_prompts_count,
    ARRAY_LENGTH(uf.favorite_conversation, 1) as favorite_conversations_count
FROM public."user" u
LEFT JOIN public.user_favorite uf ON u.uuid = uf.user_uuid
ORDER BY u.created_at DESC;
```

### Get Users with Selected Models and Prompts

```sql
SELECT
    u.username,
    u.firstname,
    u.lastname,
    usm.preset,
    usm.preset_name,
    usm.ai_model_ids,
    usm.searchable,
    pp.name as prompt_name,
    pp.description as prompt_description,
    ARRAY_LENGTH(usm.ai_model_ids, 1) as selected_models_count
FROM public."user" u
LEFT JOIN public.user_selected_models usm ON u.uuid = usm.user_uuid
LEFT JOIN public.prompt_profile pp ON usm.prompt_id = pp.id
ORDER BY u.username, usm.preset;
```

### Get User Activity Summary

```sql
SELECT
    u.username,
    u.firstname,
    u.lastname,
    COUNT(DISTINCT conv.id) as total_conversations,
    COUNT(c.id) as total_messages,
    COUNT(DISTINCT am.id) as unique_models_used,
    SUM((car.token_usage->>'total')::int) as total_tokens_used,
    AVG(car.latency_ms) as avg_response_time_ms,
    MAX(c.created_at) as last_activity
FROM public."user" u
LEFT JOIN public.conversation conv ON u.uuid = conv.user_uuid
LEFT JOIN public.chat c ON conv.id = c.conversation_id
LEFT JOIN public.chat_ai_respond car ON c.chat_ai_respond_id = car.id
LEFT JOIN public.ai_model am ON c.model_id = am.id
GROUP BY u.id, u.username, u.firstname, u.lastname
ORDER BY last_activity DESC NULLS LAST;
```

## Prompt Profile Queries

### Get Prompt Profiles with Usage Statistics

```sql
SELECT
    pp.id,
    pp.name,
    pp.description,
    pp.system_prompt,
    pp.created_at,
    u.username as creator,
    COUNT(c.id) as usage_count,
    MAX(c.created_at) as last_used
FROM public.prompt_profile pp
LEFT JOIN public."user" u ON pp.user_uuid = u.uuid
LEFT JOIN public.chat c ON pp.id = c.prompt_profile_id
GROUP BY pp.id, pp.name, pp.description, pp.system_prompt, pp.created_at, u.username
ORDER BY usage_count DESC, last_used DESC NULLS LAST;
```

## AI Model Queries

### Get AI Models with Usage Statistics

```sql
SELECT
    am.id,
    am.provider,
    am.model_key,
    am.display_name,
    am.context_length,
    am.cost_per_1k_token,
    am.capabilities,
    am.enabled,
    COUNT(c.id) as usage_count,
    SUM((car.token_usage->>'total')::int) as total_tokens_used,
    AVG(car.latency_ms) as avg_latency_ms,
    MAX(c.created_at) as last_used
FROM public.ai_model am
LEFT JOIN public.chat c ON am.id = c.model_id
LEFT JOIN public.chat_ai_respond car ON c.chat_ai_respond_id = car.id
GROUP BY am.id, am.provider, am.model_key, am.display_name, am.context_length, am.cost_per_1k_token, am.capabilities, am.enabled
ORDER BY usage_count DESC, last_used DESC NULLS LAST;
```

### Get AI Models with Cost Analysis

```sql
SELECT
    am.display_name,
    am.provider,
    am.cost_per_1k_token,
    COUNT(c.id) as total_requests,
    SUM((car.token_usage->>'total')::int) as total_tokens,
    SUM((car.token_usage->>'total')::int * am.cost_per_1k_token / 1000) as estimated_cost,
    AVG(car.latency_ms) as avg_response_time
FROM public.ai_model am
LEFT JOIN public.chat c ON am.id = c.model_id
LEFT JOIN public.chat_ai_respond car ON c.chat_ai_respond_id = car.id
WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY am.id, am.display_name, am.provider, am.cost_per_1k_token
ORDER BY estimated_cost DESC;
```

## Search Analytics Queries

### Get Search Usage Statistics

```sql
SELECT
    COUNT(*) as total_searches,
    COUNT(CASE WHEN used_web_search THEN 1 END) as web_searches,
    COUNT(CASE WHEN used_image_search THEN 1 END) as image_searches,
    COUNT(CASE WHEN used_web_search AND used_image_search THEN 1 END) as combined_searches,
    AVG(memory_chat_include) as avg_memory_used,
    SUM(ARRAY_LENGTH(search_context_web->'results', 1)) as total_web_results,
    MAX(created_at) as latest_search
FROM public.search_log
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

### Get Popular Search Queries

```sql
SELECT
    search_context_web->>'query' as search_query,
    COUNT(*) as search_count,
    AVG(ARRAY_LENGTH(search_context_web->'results', 1)) as avg_results_count,
    MAX(sl.created_at) as last_searched
FROM public.search_log sl
WHERE sl.used_web_search = true
  AND search_context_web IS NOT NULL
  AND search_context_web->>'query' IS NOT NULL
GROUP BY search_context_web->>'query'
ORDER BY search_count DESC
LIMIT 20;
```

## Performance and Analytics Queries

### Get System Performance Metrics (Last 24 hours)

```sql
SELECT
    DATE_TRUNC('hour', c.created_at) as hour,
    COUNT(c.id) as messages_per_hour,
    AVG(car.latency_ms) as avg_latency_ms,
    SUM((car.token_usage->>'total')::int) as total_tokens,
    COUNT(CASE WHEN car.latency_ms > 5000 THEN 1 END) as slow_responses,
    COUNT(CASE WHEN c.respond_error THEN 1 END) as errors
FROM public.chat c
LEFT JOIN public.chat_ai_respond car ON c.chat_ai_respond_id = car.id
WHERE c.created_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE_TRUNC('hour', c.created_at)
ORDER BY hour DESC;
```

### Get Conversation Thread Analysis

```sql
WITH conversation_threads AS (
    SELECT
        conversation_id,
        COUNT(*) as message_count,
        MIN(created_at) as started_at,
        MAX(created_at) as last_message_at,
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60 as duration_minutes,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
        COUNT(CASE WHEN role = 'assistant' THEN 1 END) as assistant_messages
    FROM public.chat
    GROUP BY conversation_id
)
SELECT
    ct.*,
    conv.title,
    u.username
FROM conversation_threads ct
JOIN public.conversation conv ON ct.conversation_id = conv.id
LEFT JOIN public."user" u ON conv.user_uuid = u.uuid
WHERE ct.message_count > 1
ORDER BY ct.last_message_at DESC;
```

## Maintenance Queries

### Find Orphaned Records

```sql
-- Find chats without conversations
SELECT c.id, c.conversation_id, c.content
FROM public.chat c
LEFT JOIN public.conversation conv ON c.conversation_id = conv.id
WHERE conv.id IS NULL;

-- Find search logs without chats
SELECT sl.id_uuid, sl.chat_id
FROM public.search_log sl
LEFT JOIN public.chat c ON sl.chat_id = c.id
WHERE c.id IS NULL;

-- Find AI responses without chats
SELECT car.id, car.ai_content
FROM public.chat_ai_respond car
LEFT JOIN public.chat c ON car.id = c.chat_ai_respond_id
WHERE c.id IS NULL;
```

### Clean Up Old Data (Example - be careful!)

```sql
-- Archive conversations older than 1 year
UPDATE public.conversation
SET archived = true
WHERE created_at < CURRENT_DATE - INTERVAL '1 year'
  AND archived = false;

-- Delete orphaned AI responses (after verifying)
DELETE FROM public.chat_ai_respond
WHERE id NOT IN (
    SELECT DISTINCT chat_ai_respond_id
    FROM public.chat
    WHERE chat_ai_respond_id IS NOT NULL
);
```

## Folder Queries

### Get User Folders with Conversation Counts

```sql
SELECT
    ucf.id,
    ucf.folder_name,
    ucf.position,
    ucf.is_collapsed,
    ucf.created_at,
    ARRAY_LENGTH(ucf.conversation_ids, 1) as conversation_count
FROM public.user_conversation_folder ucf
WHERE ucf.user_uuid = 'your-user-uuid'
ORDER BY ucf.position ASC;
```

### Get Folder Contents with Conversation Details

```sql
SELECT
    ucf.id as folder_id,
    ucf.folder_name,
    conv.id as conversation_id,
    conv.title as conversation_title,
    conv.updated_at as conversation_updated
FROM public.user_conversation_folder ucf
CROSS JOIN LATERAL unnest(ucf.conversation_ids) as cid
INNER JOIN public.conversation conv ON conv.id = cid::uuid
WHERE ucf.user_uuid = 'your-user-uuid'
ORDER BY ucf.position ASC, conv.updated_at DESC;
```

### Find Conversations Not in Any Folder

```sql
WITH folder_conversations AS (
    SELECT DISTINCT unnest(conversation_ids)::uuid as conv_id
    FROM public.user_conversation_folder
    WHERE user_uuid = 'your-user-uuid'
)
SELECT conv.id, conv.title, conv.updated_at
FROM public.conversation conv
WHERE conv.user_id = 'your-user-uuid'
  AND conv.archived = false
  AND conv.id NOT IN (SELECT conv_id FROM folder_conversations)
ORDER BY conv.updated_at DESC;
```

### Create User Conversation Folder Table

```sql
CREATE TABLE IF NOT EXISTS public.user_conversation_folder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid UUID NOT NULL REFERENCES public.user(uuid) ON DELETE CASCADE,
    folder_name VARCHAR(100) NOT NULL,
    conversation_ids TEXT[] DEFAULT '{}',
    is_collapsed BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_conversation_folder_user
    ON public.user_conversation_folder(user_uuid);
```
