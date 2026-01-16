# Web Search Integration - DuckDuckGo Instant Answer API

## Overview

Axiomancer now integrates the **DuckDuckGo Instant Answer API** to provide real-time web search capabilities during AI conversations. When enabled, the AI can search the web for up-to-date information it doesn't have in its training data.

---

## How It Works

### 1. **User Interface (Frontend)**

The chat input includes a **Web Search** toggle switch:

- **Location**: `ChatInput.svelte` - bottom left of input area
- **State**: Managed by `chatStore.webSearchEnabled`
- **Visual Indicator**: Blue dot + "Web search enabled" text when active
- **Translation Support**: Full English/Thai localization

### 2. **Frontend Flow**

```typescript
// ChatInput.svelte
handleSend() → chatStore.sendMessage(content, modelKey, {
  autoRouting: isAutoRouting,
  promptProfileId: currentPromptProfileId,
  webSearch: webSearchEnabled,  // ← Toggle state passed here
  imageSearch: imageSearchEnabled
})

// chat.svelte.ts
chatStore.sendMessage() → chatService.sendMessage(conversationId, {
  message: content,
  model_key: modelKey,
  prompt_profile_id: promptProfileId,
  webSearch: webSearchEnabled,  // ← Sent to backend
  imageSearch: imageSearchEnabled
})
```

### 3. **Backend Processing**

**File**: `chat_service.ts`

```typescript
// Step 1: Save user message to database
const savedUserMessage = await this.createChat(userChat);

// Step 2: Perform web search if enabled
if (options?.webSearch) {
  const searchResponse = await DuckDuckGoService.search(userMessage, 5);

  if (searchResponse.success && searchResponse.results.length > 0) {
    searchContext = {
      web_search: {
        query: searchResponse.query,
        results: searchResponse.results,
        abstract: searchResponse.abstract,
        abstractURL: searchResponse.abstractURL,
      },
    };

    // Update message with search context
    await ChatQuery.updateChat(savedUserMessage.id, { search_context: searchContext });
  }
}

// Step 3: Add search results to AI prompt
if (searchContext?.web_search) {
  const searchFormatted = DuckDuckGoService.formatResultsForAI(searchResponse);

  openRouterMessages.push({
    role: "system",
    content: `The following web search results may help answer the user's question:

${searchFormatted}

Use this information to provide accurate and up-to-date responses. Cite sources when relevant.`,
  });
}

// Step 4: Send enriched context to OpenRouter AI
const aiResponse = await activeClient.chatCompletion(openRouterRequest);
```

---

## DuckDuckGo Instant Answer API

### API Endpoint

```
https://api.duckduckgo.com/
```

### Request Parameters

| Parameter       | Value | Description                                 |
| --------------- | ----- | ------------------------------------------- |
| `q`             | query | Search query string                         |
| `format`        | json  | Response format                             |
| `no_html`       | 1     | Remove HTML formatting                      |
| `no_redirect`   | 1     | Skip !bang redirects                        |
| `skip_disambig` | 1     | Skip disambiguation pages                   |
| `t`             | app   | Application identifier (e.g., "axiomancer") |

### Response Types

The API returns **instant answers** in various forms:

1. **Abstract** - Topic summaries from Wikipedia/other sources
2. **Answer** - Direct instant answers (e.g., calculations, definitions)
3. **Definition** - Dictionary definitions
4. **RelatedTopics** - Related articles and topics
5. **Results** - Direct search results

### Example Request

```bash
curl "https://api.duckduckgo.com/?q=Eiffel%20Tower&format=json&no_html=1&skip_disambig=1"
```

### Example Response

```json
{
  "Abstract": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris...",
  "AbstractText": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris...",
  "AbstractURL": "https://en.wikipedia.org/wiki/Eiffel_Tower",
  "Heading": "Eiffel Tower",
  "RelatedTopics": [
    {
      "FirstURL": "https://en.wikipedia.org/wiki/Gustave_Eiffel",
      "Text": "Gustave Eiffel - French civil engineer and architect..."
    }
  ]
}
```

---

## Implementation Details

### Backend Files

| File                    | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `duckduckgo_service.ts` | DuckDuckGo API client and result formatting   |
| `duckduckgo_type.ts`    | TypeScript interfaces for API responses       |
| `duckduckgo_api.ts`     | Express routes for search endpoints           |
| `chat_service.ts`       | Integration logic for web search in chat flow |

### Key Functions

#### `DuckDuckGoService.search(query, limit)`

Performs search and parses API response into structured results.

**Returns:**

```typescript
{
  success: boolean;
  query: string;
  results: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  abstract?: string;
  abstractURL?: string;
  error?: string;
}
```

#### `DuckDuckGoService.formatResultsForAI(response)`

Formats search results into a readable text format for AI context.

**Example Output:**

```
Web Search Results for "Eiffel Tower":

Summary: The Eiffel Tower is a wrought-iron lattice tower...
Source: https://en.wikipedia.org/wiki/Eiffel_Tower

[1] Eiffel Tower
URL: https://en.wikipedia.org/wiki/Eiffel_Tower
Description: The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris...

[2] Gustave Eiffel
URL: https://en.wikipedia.org/wiki/Gustave_Eiffel
Description: Gustave Eiffel - French civil engineer and architect...
```

---

## Database Schema

### Chat Table - Search Metadata

```sql
CREATE TABLE chat (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Search integration fields
  used_web_search BOOLEAN DEFAULT FALSE,
  used_image_search BOOLEAN DEFAULT FALSE,
  search_context JSONB,  -- Stores search results and metadata

  -- Other fields...
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Search Context JSON Structure

```json
{
  "web_search": {
    "query": "Eiffel Tower height",
    "abstract": "The Eiffel Tower is 330 meters tall...",
    "abstractURL": "https://en.wikipedia.org/wiki/Eiffel_Tower",
    "results": [
      {
        "title": "Eiffel Tower",
        "url": "https://en.wikipedia.org/wiki/Eiffel_Tower",
        "description": "The Eiffel Tower is a wrought-iron lattice tower..."
      }
    ]
  }
}
```

---

## Usage Guide

### For Users

1. **Enable Web Search**:

   - Toggle the "Web Search" switch in the chat input area
   - The switch turns blue when active
   - Blue dot indicator shows "Web search enabled"

2. **Send Message**:

   - Type your question
   - Press Enter to send
   - If web search is enabled, the AI will automatically search for relevant information

3. **View Search Indicators**:
   - AI messages that used web search display a "Web" badge
   - Search results are integrated into the AI's response
   - Sources may be cited in the response

### For Developers

#### Test Web Search Manually

```bash
# Backend endpoint
curl -X POST http://localhost:3000/api/search/duckduckgo/ \
  -H "Content-Type: application/json" \
  -d '{"query":"Eiffel Tower","limit":5}'
```

#### Example Integration

```typescript
// Send message with web search enabled
await chatStore.sendMessage("What is the height of the Eiffel Tower?", "anthropic/claude-3-haiku", {
  autoRouting: false,
  promptProfileId: "default-prompt-id",
  webSearch: true, // ← Enable web search
  imageSearch: false,
});
```

---

## Translations

### English (`en/chat.json`)

```json
{
  "input": {
    "webSearchEnabled": "Web search enabled"
  },
  "messages": {
    "usedWebSearch": "Used web search"
  }
}
```

### Thai (`th/chat.json`)

```json
{
  "input": {
    "webSearchEnabled": "เปิดใช้งานการค้นหาเว็บ"
  },
  "messages": {
    "usedWebSearch": "ใช้การค้นหาเว็บ"
  }
}
```

---

## Error Handling

### Graceful Degradation

If web search fails, the system continues without search results:

```typescript
try {
  const searchResponse = await DuckDuckGoService.search(userMessage, 5);
  if (searchResponse.success) {
    // Add search context
  }
} catch (searchError) {
  console.error("[ChatService] Web search error:", searchError);
  // Continue without search results - AI still responds normally
}
```

### Common Issues

1. **No Results Found**

   - API returns empty results array
   - System continues without search context
   - No error shown to user

2. **API Rate Limiting**

   - DuckDuckGo may throttle requests
   - Implement exponential backoff if needed
   - Consider caching frequent queries

3. **Network Errors**
   - Timeout after 10 seconds
   - Fallback to AI response without search
   - Error logged to console

---

## Performance Considerations

### Search Limits

- Default: **5 results** per query
- Maximum: **50 results** (API limit)
- Recommended: **3-10 results** for optimal AI context

### Response Times

- DuckDuckGo API: ~200-500ms
- Total overhead: ~300-700ms (including parsing)
- Asynchronous: Search doesn't block user input

### Context Window Usage

- Each search result: ~100-200 tokens
- 5 results: ~500-1000 tokens
- Consider token budget when increasing result count

---

## Future Enhancements

### Planned Features

1. **Smart Search Detection**

   - Automatically enable search for factual questions
   - Use AI to determine when search is needed
   - Keyword-based search triggers

2. **Search Result Caching**

   - Cache common queries (e.g., "current date", "weather")
   - Redis integration for distributed caching
   - TTL-based expiration

3. **Multi-Source Search**

   - Combine DuckDuckGo with other search APIs
   - Wikipedia API integration
   - News API for current events

4. **Search Result Display**

   - Show search results as cards in UI
   - Expandable search context panel
   - Source citation links

5. **Image Search Integration**
   - Pixabay API already implemented
   - Display images inline in responses
   - Image source attribution

---

## API Limitations

### DuckDuckGo Instant Answer API

- **No Authentication**: Public API, no API key required
- **Rate Limiting**: Soft limits, no strict quotas documented
- **No Full Search**: Only instant answers, not full search results
- **No Ranking**: Results are not ranked by relevance
- **No Pagination**: Fixed result set per query

### Workarounds

- Use multiple specific queries instead of broad searches
- Combine with other APIs for comprehensive results
- Cache popular queries to reduce API calls

---

## Security Considerations

### User Privacy

- **No Search Logging**: DuckDuckGo doesn't track users
- **No Personal Data**: Queries don't include user identifiers
- **HTTPS Only**: All API calls encrypted

### API Security

- **No Sensitive Data**: Don't send passwords or API keys in queries
- **Input Sanitization**: Validate and sanitize user queries
- **Rate Limiting**: Implement client-side throttling

---

## Testing

### Manual Testing

1. **Enable Web Search Toggle**

   ```
   - Open Axiomancer chat
   - Enable "Web Search" toggle
   - Send: "What is the capital of France?"
   - Verify AI response includes up-to-date information
   ```

2. **Check Search Metadata**

   ```sql
   SELECT
     id,
     content,
     used_web_search,
     search_context
   FROM chat
   WHERE used_web_search = TRUE
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Test API Directly**
   ```bash
   curl "https://api.duckduckgo.com/?q=TypeScript&format=json&no_html=1"
   ```

### Automated Testing

```typescript
// Unit test for DuckDuckGoService
describe("DuckDuckGoService", () => {
  it("should search and return results", async () => {
    const response = await DuckDuckGoService.search("Eiffel Tower", 5);

    expect(response.success).toBe(true);
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0]).toHaveProperty("title");
    expect(response.results[0]).toHaveProperty("url");
  });

  it("should format results for AI context", () => {
    const mockResponse = {
      success: true,
      query: "Test query",
      results: [
        {
          title: "Test Result",
          url: "https://example.com",
          description: "Test description",
        },
      ],
    };

    const formatted = DuckDuckGoService.formatResultsForAI(mockResponse);

    expect(formatted).toContain("Web Search Results");
    expect(formatted).toContain("Test Result");
    expect(formatted).toContain("https://example.com");
  });
});
```

---

## Support & Resources

### Official Documentation

- [DuckDuckGo Instant Answer API](https://duckduckgo.com/api)
- [DuckDuckGo API Docs (Archive)](https://web.archive.org/web/20220528052148/https://duckduckgo.com/api)

### Internal Resources

- Backend: `/api/search/duckduckgo/`
- Types: `duckduckgo_type.ts`
- Service: `duckduckgo_service.ts`
- Integration: `chat_service.ts` (lines 289-320)

### Contact

For questions or issues, refer to the AGENTS.md guidelines or check the Docs/ folder.

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
