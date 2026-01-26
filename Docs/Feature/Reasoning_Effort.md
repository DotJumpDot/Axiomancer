# Reasoning Effort Feature

## Overview

Axiomancer supports **Reasoning Effort** configuration for AI models that have reasoning capabilities. This feature allows users to control how much "thinking" or reasoning the AI model applies when generating responses, affecting both response quality and processing time/cost.

---

## How It Works

### 1. **User Interface (Frontend)**

The chat input includes a **Reasoning Effort** selector that appears only when the selected model has reasoning capabilities:

- **Location**: `ChatInput.svelte` - right side of input area (visible in single mode with reasoning-capable models)
- **State**: Managed by `chatStore.reasoningEffort`
- **Visual Indicators**: Color-coded button with effort level label
- **Translation Support**: Full English/Thai localization

### 2. **Reasoning Effort Levels**

| Level    | Description                                        | Use Case                                      |
| -------- | -------------------------------------------------- | --------------------------------------------- |
| Disabled | No reasoning applied (standard response)           | Quick answers, simple queries                 |
| Minimal  | Light reasoning with basic logical steps           | Straightforward questions                     |
| Low      | Some reasoning with simple problem decomposition   | Moderate complexity tasks                     |
| Medium   | Balanced reasoning with thorough analysis          | Complex questions, coding tasks               |
| High     | Deep reasoning with extensive analysis and thought | Research, complex debugging, multi-step logic |

### 3. **Frontend Flow**

```typescript
// ChatInput.svelte
handleSend() → chatStore.sendMessage(content, modelKey, {
  autoRouting: isAutoRouting,
  promptProfileId: currentPromptProfileId,
  webSearch: webSearchEnabled,
  imageSearch: imageSearchEnabled,
  reasoningEffort: hasReasoningCapability && chatStore.reasoningEffort !== "disabled"
    ? chatStore.reasoningEffort
    : undefined,
})

// chat.svelte.ts
chatStore.sendMessage() → chatService.sendMessage(conversationId, {
  message: content,
  model_key: modelKey,
  reasoningEffort: reasoningEffort,  // ← Sent to backend
})
```

### 4. **Backend Processing**

**File**: `chat_service.ts`

```typescript
// Prepare OpenRouter request
const openRouterRequest: OpenRouterRequest = {
  model: actualModelKey || "anthropic/claude-3-haiku",
  messages: openRouterMessages,
};

// Add reasoning parameter if provided
if (options?.reasoningEffort && options.reasoningEffort !== "disabled") {
  openRouterRequest.reasoning = {
    effort: options.reasoningEffort,
  };
}

// Call OpenRouter API
const aiResponse = await activeClient.chatCompletion(openRouterRequest);
```

---

## Database Schema

### Search Log Table - Reasoning Fields

```sql
CREATE TABLE search_log (
  id_no SERIAL PRIMARY KEY,
  id_uuid TEXT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,

  -- Reasoning fields
  reasoning_effort TEXT,        -- 'minimal', 'low', 'medium', 'high', or NULL
  reasoning_content TEXT,       -- AI's reasoning process (if returned)

  -- Other fields...
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Reasoning Content Storage

The `reasoning_content` field stores the AI model's internal reasoning process when available. Some models return their thinking steps separately from the final response.

---

## Model Capability Detection

Only models with `capabilities.reasoning = true` show the reasoning effort selector:

```typescript
// ChatInput.svelte
let hasReasoningCapability = $derived.by(() => {
  return selectedModelForCap?.capabilities.reasoning || false;
});

// Auto-disable reasoning effort when model doesn't support reasoning
$effect(() => {
  if (!hasReasoningCapability && chatStore.reasoningEffort !== "disabled") {
    chatStore.reasoningEffort = "disabled";
  }
});
```

---

## UI Components

### Reasoning Button States

The reasoning button has visual states based on the current effort level:

| State    | Class                | Visual Effect             |
| -------- | -------------------- | ------------------------- |
| Disabled | `reasoning-disabled` | Gray/muted appearance     |
| Minimal  | `reasoning-minimal`  | Light blue tint           |
| Low      | `reasoning-low`      | Blue accent               |
| Medium   | `reasoning-medium`   | Purple/violet accent      |
| High     | `reasoning-high`     | Deep purple/high-contrast |

### Tooltip Panel

Clicking the reasoning button opens a tooltip with:

- Current effort level display
- Radio buttons for each level
- Description of the selected level

---

## Translations

### English (`en/chat.json`)

```json
{
  "input": {
    "reasoningEffort": "Reasoning Effort",
    "reasoningMinimal": "Minimal",
    "reasoningLow": "Low",
    "reasoningMedium": "Medium",
    "reasoningHigh": "High",
    "reasoningDisabled": "Disabled"
  }
}
```

### Thai (`th/chat.json`)

```json
{
  "input": {
    "reasoningEffort": "ระดับการใช้เหตุผล",
    "reasoningMinimal": "น้อยที่สุด",
    "reasoningLow": "ต่ำ",
    "reasoningMedium": "ปานกลาง",
    "reasoningHigh": "สูง",
    "reasoningDisabled": "ปิดใช้งาน"
  }
}
```

---

## Performance Considerations

### Impact by Effort Level

| Level    | Response Time | Token Usage | Quality   |
| -------- | ------------- | ----------- | --------- |
| Disabled | Fast          | Lower       | Standard  |
| Minimal  | Fast          | Low         | Improved  |
| Low      | Moderate      | Medium-Low  | Better    |
| Medium   | Moderate      | Medium      | Good      |
| High     | Slower        | Higher      | Excellent |

### Cost Implications

Higher reasoning effort levels may:

- Use more prompt tokens (for reasoning context)
- Use more completion tokens (for detailed responses)
- Increase API costs for paid models

---

## Best Practices

### When to Use High Reasoning

- Complex debugging tasks
- Multi-step mathematical problems
- Code architecture decisions
- Research and analysis questions
- Legal or technical document analysis

### When to Use Low/Minimal Reasoning

- Simple Q&A
- Quick code snippets
- Translation tasks
- Format conversion
- Basic explanations

### When to Disable Reasoning

- Casual conversation
- Time-sensitive responses
- Cost-sensitive operations
- Simple factual lookups

---

## Integration with Other Features

### With Web Search

Reasoning effort works alongside web search. When both are enabled:

1. Web search results are fetched
2. Results are added to AI context
3. AI applies reasoning effort to analyze search results
4. Response includes reasoned analysis of search data

### With Memory Count

Higher memory counts + high reasoning effort may:

- Significantly increase processing time
- Use more tokens
- Provide more contextually aware responses

### With Auto-Routing

In auto-routing mode:

- Reasoning effort is passed to the final selected model
- Not applied to the decision model (routing prompt)

---

## Error Handling

### Model Doesn't Support Reasoning

If a model is selected that doesn't support reasoning:

```typescript
// Auto-disable reasoning effort
$effect(() => {
  if (!hasReasoningCapability && chatStore.reasoningEffort !== "disabled") {
    chatStore.reasoningEffort = "disabled";
  }
});
```

### Invalid Reasoning Effort Value

Backend validates reasoning effort:

```typescript
if (options?.reasoningEffort && options.reasoningEffort !== "disabled") {
  // Only add reasoning parameter if valid and not disabled
  openRouterRequest.reasoning = {
    effort: options.reasoningEffort,
  };
}
```

---

## Future Enhancements

### Planned Features

1. **Reasoning Visualization**
   - Display AI's reasoning steps in UI
   - Collapsible reasoning process section
   - Step-by-step thought breakdown

2. **Auto Reasoning Level**
   - AI analyzes query complexity
   - Automatically selects appropriate effort level
   - User can override auto-selection

3. **Reasoning Presets**
   - Save reasoning preferences per prompt profile
   - Quick-switch between reasoning configurations

4. **Reasoning Analytics**
   - Track reasoning usage patterns
   - Compare response quality by effort level
   - Cost analysis per reasoning level

---

**Last Updated**: January 26, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
