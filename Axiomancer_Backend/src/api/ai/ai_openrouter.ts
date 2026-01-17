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
  async *streamChatCompletion(request: OpenRouterRequest): AsyncGenerator<string, void, unknown> {
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
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
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
