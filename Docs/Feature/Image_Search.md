# Image Search Integration - Pixabay API

## Overview

Axiomancer integrates the **Pixabay API** to provide image search capabilities during AI conversations. When enabled, users can search for royalty-free images that can be referenced in AI responses.

---

## How It Works

### 1. **User Interface (Frontend)**

The chat input includes an **Image Search** toggle switch:

- **Location**: `ChatInput.svelte` - bottom area of input section
- **State**: Managed by `chatStore.imageSearchEnabled`
- **Visual Indicator**: Toggle switch with image icon
- **Translation Support**: Full English/Thai localization

### 2. **Frontend Flow**

```typescript
// ChatInput.svelte
handleSend() → chatStore.sendMessage(content, modelKey, {
  autoRouting: isAutoRouting,
  promptProfileId: currentPromptProfileId,
  webSearch: webSearchEnabled,
  imageSearch: imageSearchEnabled,  // ← Toggle state passed here
})

// chat.svelte.ts
chatStore.sendMessage() → chatService.sendMessage(conversationId, {
  message: content,
  model_key: modelKey,
  imageSearch: imageSearchEnabled,  // ← Sent to backend
})
```

### 3. **Backend Processing**

**File**: `chat_service.ts`

```typescript
// Step 1: Save user message to database
const savedUserMessage = await this.createChat(userChat);

// Step 2: Perform image search if enabled
let searchContextPicture: any = null;

if (options?.imageSearch) {
  try {
    const imageResponse = await PixabayService.search(userMessage, 5);
    if (imageResponse.success && imageResponse.results.length > 0) {
      searchContextPicture = imageResponse;
    }
  } catch (error) {
    console.error("ImageSearchError : ", error);
  }
}

// Step 3: Create search log record
const searchLog = await ChatQuery.createSearchLog({
  chat_id: savedUserMessage.id,
  used_image_search: options?.imageSearch || false,
  search_context_picture: searchContextPicture,
});
```

---

## Pixabay API

### API Endpoint

```
https://pixabay.com/api
```

### Request Parameters

| Parameter    | Value   | Description                               |
| ------------ | ------- | ----------------------------------------- |
| `key`        | API_KEY | Your Pixabay API key                      |
| `q`          | query   | Search query string (URL encoded)         |
| `per_page`   | number  | Number of results (default: 20, max: 200) |
| `image_type` | string  | "photo", "illustration", or "vector"      |
| `safesearch` | true    | Enable safe search filter                 |
| `order`      | popular | Order by popularity                       |

### Example Request

```bash
curl "https://pixabay.com/api/?key=YOUR_API_KEY&q=sunset&per_page=5&image_type=photo&safesearch=true"
```

### Example Response

```json
{
  "total": 45678,
  "totalHits": 500,
  "hits": [
    {
      "id": 123456,
      "pageURL": "https://pixabay.com/photos/sunset-beach-ocean-123456/",
      "type": "photo",
      "tags": "sunset, beach, ocean",
      "previewURL": "https://cdn.pixabay.com/photo/2024/01/01/sunset_150.jpg",
      "webformatURL": "https://cdn.pixabay.com/photo/2024/01/01/sunset_640.jpg",
      "largeImageURL": "https://pixabay.com/get/...",
      "imageWidth": 4000,
      "imageHeight": 2667,
      "views": 50000,
      "downloads": 12000,
      "likes": 500,
      "user": "photographer_name",
      "userImageURL": "https://cdn.pixabay.com/user/..."
    }
  ]
}
```

---

## Implementation Details

### Backend Files

| File                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| `pixabay_service.ts` | Pixabay API client and result handling  |
| `pixabay_type.ts`    | TypeScript interfaces for API responses |
| `pixabay_api.ts`     | Express routes for search endpoints     |
| `chat_service.ts`    | Integration logic in chat flow          |

### Key Functions

#### `PixabayService.search(query, limit, imageType)`

Performs image search and returns structured results.

**Parameters:**

- `query`: Search term
- `limit`: Max results (default: 20, max: 200)
- `imageType`: "photo" | "illustration" | "vector"

**Returns:**

```typescript
{
  success: boolean;
  results: PixabayImage[];
  error?: string;
}
```

### PixabayImage Interface

```typescript
interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  views: number;
  downloads: number;
  likes: number;
  user: string;
  userImageURL: string;
}
```

---

## Database Schema

### Search Log - Image Context

```sql
CREATE TABLE search_log (
  id_no SERIAL PRIMARY KEY,
  id_uuid TEXT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,

  -- Image search fields
  used_image_search BOOLEAN NOT NULL DEFAULT FALSE,
  search_context_picture JSONB,  -- Pixabay results context

  -- Other fields...
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Search Context Picture JSON Structure

```json
{
  "success": true,
  "results": [
    {
      "id": 123456,
      "pageURL": "https://pixabay.com/photos/...",
      "previewURL": "https://cdn.pixabay.com/..._150.jpg",
      "webformatURL": "https://cdn.pixabay.com/..._640.jpg",
      "tags": "sunset, beach, ocean",
      "user": "photographer_name"
    }
  ]
}
```

---

## Configuration

### API Key Setup

The Pixabay API key is configured via environment variable:

```bash
# .env
PIXABAY_API_KEY=your_pixabay_api_key_here
```

### Service Configuration

```typescript
// pixabay_service.ts
export class PixabayService {
  private static apiKey: string = process.env.PIXABAY_API_KEY || "";

  static setApiKey(key: string) {
    this.apiKey = key;
  }
}
```

---

## Usage Guide

### For Users

1. **Enable Image Search**:
   - Toggle the "Image Search" switch in the chat input area
   - The toggle shows an image icon indicator

2. **Send Message**:
   - Type a query that would benefit from images
   - Press Enter to send
   - AI will search for relevant images

3. **View Results**:
   - Images may be referenced in AI responses
   - Search results stored in message metadata

### For Developers

#### Test Image Search Manually

```bash
# Backend endpoint
curl -X POST http://localhost:3000/api/search/pixabay/ \
  -H "Content-Type: application/json" \
  -d '{"query":"sunset","limit":5}'
```

#### Example Integration

```typescript
// Send message with image search enabled
await chatStore.sendMessage("Show me beautiful sunset photos", modelKey, {
  autoRouting: false,
  promptProfileId: promptId,
  webSearch: false,
  imageSearch: true, // ← Enable image search
});
```

---

## Translations

### English (`en/chat.json`)

```json
{
  "input": {
    "imageSearchEnabled": "Image search enabled"
  },
  "messages": {
    "usedImageSearch": "Used image search"
  }
}
```

### Thai (`th/chat.json`)

```json
{
  "input": {
    "imageSearchEnabled": "เปิดใช้งานการค้นหารูปภาพ"
  },
  "messages": {
    "usedImageSearch": "ใช้การค้นหารูปภาพ"
  }
}
```

---

## Error Handling

### Graceful Degradation

If image search fails, the system continues without image results:

```typescript
try {
  const imageResponse = await PixabayService.search(userMessage, 5);
  if (imageResponse.success) {
    searchContextPicture = imageResponse;
  }
} catch (error) {
  console.error("ImageSearchError:", error);
  // Continue without image results - AI still responds normally
}
```

### Common Issues

1. **API Key Not Configured**
   - Returns error: "Pixabay API key not configured"
   - Solution: Set `PIXABAY_API_KEY` environment variable

2. **Rate Limiting**
   - Pixabay has rate limits per API key
   - Free tier: 5,000 requests/hour
   - Implement caching for frequent queries

3. **No Results Found**
   - Returns empty results array
   - AI continues without image context

---

## Performance Considerations

### Search Limits

- Default: **5-20 images** per query
- Maximum: **200 images** (API limit)
- Recommended: **5-10 images** for optimal AI context

### Response Times

- Pixabay API: ~100-300ms
- Total overhead: ~150-400ms (including parsing)

### Token Usage

- Each image result: ~50-100 tokens (metadata only)
- 5 results: ~250-500 tokens in context

---

## Future Enhancements

### Planned Features

1. **Image Display in Chat**
   - Show image thumbnails in conversation
   - Expandable image gallery
   - Download links for images

2. **Image Type Selection**
   - UI toggle for photo/illustration/vector
   - Filter by orientation (horizontal/vertical)

3. **Image Attribution**
   - Automatic photographer credits
   - License information display

4. **Smart Image Search**
   - AI analyzes query intent
   - Automatically enables image search when relevant

---

## API Limitations

### Pixabay Free Tier

- 5,000 requests per hour
- Must display "Image from Pixabay" attribution
- Commercial use allowed with attribution
- No redistribution of full-size images

### Workarounds

- Cache common image searches
- Use preview URLs for display
- Link to Pixabay page for full images

---

## Security Considerations

### API Key Protection

- Store API key in environment variables
- Never expose key in frontend code
- Use backend proxy for all API calls

### Content Safety

- `safesearch=true` parameter enabled by default
- Pixabay has content moderation
- Review results before displaying to users

---

**Last Updated**: January 26, 2026  
**Version**: 1.0.0  
**Status**: 🚧 Partially Implemented (Backend ready, UI display pending)
