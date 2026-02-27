import type { OpenRouterRequest, OpenRouterResponse, OpenRouterModelsResponse } from "./ai_type";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 10000; // 10 seconds max

/**
 * Sleep helper for delay between retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s
  const exponentialDelay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
  // Add jitter (random 0-30%) to prevent thundering herd
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

/**
 * Check if error is retryable (5xx errors, network errors, rate limits)
 */
function isRetryableError(error: Error, statusCode?: number): boolean {
  // Retry on 5xx server errors
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true;
  }
  // Retry on rate limit (429) - OpenRouter might ask to retry
  if (statusCode === 429) {
    return true;
  }
  // Retry on network errors (no status code)
  if (!statusCode) {
    return true;
  }
  return false;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    let lastError: Error | null = null;
    let lastStatusCode: number | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": process.env.SITE_URL || "",
            "X-Title": process.env.SITE_NAME || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (response.ok) {
          const data: OpenRouterResponse = await response.json();
          return data;
        }

        // Handle error response
        const errorText = await response.text();
        lastStatusCode = response.status;
        lastError = new Error(
          `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
        );

        // Don't retry on 4xx client errors (except 429 rate limit)
        if (!isRetryableError(lastError, lastStatusCode)) {
          throw lastError;
        }

        // If this is the last attempt, throw the error
        if (attempt === MAX_RETRIES) {
          throw lastError;
        }

        // Log retry attempt
        console.warn(
          `[OpenRouterClient] Attempt ${attempt}/${MAX_RETRIES} failed with ${response.status}. Retrying in ${Math.round(getRetryDelay(attempt))}ms...`
        );

        // Wait before retrying
        await sleep(getRetryDelay(attempt));
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a network error (no response received)
        if (!lastStatusCode && isRetryableError(lastError)) {
          if (attempt === MAX_RETRIES) {
            throw new Error(
              `OpenRouter API failed after ${MAX_RETRIES} attempts: ${lastError.message}`
            );
          }

          console.warn(
            `[OpenRouterClient] Attempt ${attempt}/${MAX_RETRIES} failed (network error). Retrying in ${Math.round(getRetryDelay(attempt))}ms...`
          );

          await sleep(getRetryDelay(attempt));
          continue;
        }

        // Re-throw non-retryable errors immediately
        throw lastError;
      }
    }

    // Should never reach here, but just in case
    throw lastError || new Error("Unknown error in chatCompletion");
  }

  //! Stream chat completion with Server-Sent Events
  async *streamChatCompletion(
    request: OpenRouterRequest
  ): AsyncGenerator<{ type: "content" | "reasoning" | "usage"; data?: any }, void, void> {
    let lastError: Error | null = null;
    let lastStatusCode: number | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
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
          lastStatusCode = response.status;
          lastError = new Error(
            `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
          );

          // Don't retry on 4xx client errors (except 429 rate limit)
          if (!isRetryableError(lastError, lastStatusCode)) {
            throw lastError;
          }

          // If this is the last attempt, throw the error
          if (attempt === MAX_RETRIES) {
            throw lastError;
          }

          console.warn(
            `[OpenRouterClient] Stream attempt ${attempt}/${MAX_RETRIES} failed with ${response.status}. Retrying in ${Math.round(getRetryDelay(attempt))}ms...`
          );

          await sleep(getRetryDelay(attempt));
          continue;
        }

        // Success - process the stream
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

        // Stream completed successfully - exit retry loop
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a network error (no response received)
        if (!lastStatusCode && isRetryableError(lastError)) {
          if (attempt === MAX_RETRIES) {
            throw new Error(
              `OpenRouter API streaming failed after ${MAX_RETRIES} attempts: ${lastError.message}`
            );
          }

          console.warn(
            `[OpenRouterClient] Stream attempt ${attempt}/${MAX_RETRIES} failed (network error). Retrying in ${Math.round(getRetryDelay(attempt))}ms...`
          );

          await sleep(getRetryDelay(attempt));
          continue;
        }

        // Re-throw non-retryable errors immediately
        throw lastError;
      }
    }

    // Should never reach here, but just in case
    throw lastError || new Error("Unknown error in streamChatCompletion");
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
    let lastError: Error | null = null;
    let lastStatusCode: number | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/models`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data: OpenRouterModelsResponse = await response.json();
          return data;
        }

        const errorText = await response.text();
        lastStatusCode = response.status;
        lastError = new Error(
          `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
        );

        if (!isRetryableError(lastError, lastStatusCode)) {
          throw lastError;
        }

        if (attempt === MAX_RETRIES) {
          throw lastError;
        }

        console.warn(
          `[OpenRouterClient] GetModels attempt ${attempt}/${MAX_RETRIES} failed with ${response.status}. Retrying in ${Math.round(getRetryDelay(attempt))}ms...`
        );

        await sleep(getRetryDelay(attempt));
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!lastStatusCode && isRetryableError(lastError)) {
          if (attempt === MAX_RETRIES) {
            throw new Error(
              `OpenRouter API getModels failed after ${MAX_RETRIES} attempts: ${lastError.message}`
            );
          }

          console.warn(
            `[OpenRouterClient] GetModels attempt ${attempt}/${MAX_RETRIES} failed (network error). Retrying in ${Math.round(getRetryDelay(attempt))}ms...`
          );

          await sleep(getRetryDelay(attempt));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error("Unknown error in getModels");
  }
}

// Export a default instance if API key is available
let defaultClient: OpenRouterClient | null = null;
if (process.env.SERVER_OPENROUTER_API_KEY) {
  defaultClient = new OpenRouterClient(process.env.SERVER_OPENROUTER_API_KEY);
}

export { defaultClient as openRouterClient };
