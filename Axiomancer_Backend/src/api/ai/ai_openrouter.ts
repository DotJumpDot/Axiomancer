import type { OpenRouterRequest, OpenRouterResponse, OpenRouterModelsResponse } from "./ai_type";

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": process.env.SITE_URL || "", // Optional. Site URL for rankings on openrouter.ai.
        "X-Title": process.env.SITE_NAME || "", // Optional. Site title for rankings on openrouter.ai.
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: OpenRouterResponse = await response.json();
    return data;
  }

  //! Stream chat completion with Server-Sent Events
  async *streamChatCompletion(
    request: OpenRouterRequest
  ): AsyncGenerator<{ type: "content" | "reasoning" | "usage"; data?: any }, void, void> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": process.env.SITE_URL || "",
        "X-Title": process.env.SITE_NAME || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let usage: any = undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));

              // Check for reasoning delta (Responses API format)
              if (data.type === "response.reasoning.delta" && data.delta) {
                yield { type: "reasoning", data: data.delta };
              }

              // Check for reasoning in chat completions format (some models include it)
              if (data.choices?.[0]?.delta?.reasoning) {
                yield { type: "reasoning", data: data.choices[0].delta.reasoning };
              }

              // Check for regular content
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield { type: "content", data: content };
              }

              // Capture usage information from final chunk
              if (data.usage) {
                usage = data.usage;
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn("Failed to parse SSE line:", trimmed);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Yield usage information as final chunk if available
    if (usage) {
      yield { type: "usage", data: usage };
    }
  }

  // Helper method to create a simple chat completion
  async simpleChat(model: string, userMessage: string, systemMessage?: string): Promise<string> {
    const messages: { role: "user" | "system"; content: string }[] = [];
    if (systemMessage) {
      messages.push({ role: "system", content: systemMessage });
    }
    messages.push({ role: "user", content: userMessage });

    const request: OpenRouterRequest = {
      model,
      messages,
    };

    const response = await this.chatCompletion(request);
    return response.choices[0]?.message?.content || "";
  }

  async getModels(): Promise<OpenRouterModelsResponse> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: OpenRouterModelsResponse = await response.json();
    return data;
  }
}

// Export a default instance if API key is available
let defaultClient: OpenRouterClient | null = null;
if (process.env.SERVER_OPENROUTER_API_KEY) {
  defaultClient = new OpenRouterClient(process.env.SERVER_OPENROUTER_API_KEY);
}

export { defaultClient as openRouterClient };
