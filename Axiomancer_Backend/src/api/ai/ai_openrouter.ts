import type { OpenRouterRequest, OpenRouterResponse } from "./ai_type";

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(
    request: OpenRouterRequest
  ): Promise<OpenRouterResponse> {
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

  // Helper method to create a simple chat completion
  async simpleChat(
    model: string,
    userMessage: string,
    systemMessage?: string
  ): Promise<string> {
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
}

// Export a default instance if API key is available
let defaultClient: OpenRouterClient | null = null;
if (process.env.OPENROUTER_API_KEY) {
  defaultClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY);
}

export { defaultClient as openRouterClient };
