import type { DuckDuckGoResult, DuckDuckGoResponse } from "./duckduckgo_type";

const DUCKDUCKGO_API = "https://api.duckduckgo.com";

/**
 * DuckDuckGo Search Service
 * Fetches structured JSON search results from DuckDuckGo
 */
export class DuckDuckGoService {
  static async search(query: string, limit: number = 10): Promise<DuckDuckGoResponse> {
    try {
      // DuckDuckGo API endpoint with JSON format
      const url = new URL(DUCKDUCKGO_API);
      url.searchParams.append("q", query);
      url.searchParams.append("format", "json");
      url.searchParams.append("no_html", "1");
      url.searchParams.append("t", "axiomancer");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse DuckDuckGo response (AbstractResult + RelatedTopics)
      const results: DuckDuckGoResult[] = [];

      // Add abstract result if available
      if (data.AbstractURL && data.AbstractText) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          description: data.AbstractText,
        });
      }

      // Add related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, limit - 1).forEach(
          (topic: {
            FirstURL?: string;
            Text?: string;
            Name?: string;
            Topics?: Array<{ FirstURL?: string; Text?: string }>;
          }) => {
            if (topic.FirstURL && topic.Text) {
              results.push({
                title: topic.Name || topic.Text.split("\n")[0],
                url: topic.FirstURL,
                description: topic.Text,
              });
            } else if (topic.Topics && Array.isArray(topic.Topics)) {
              topic.Topics.slice(0, 2).forEach((subtopic) => {
                if (subtopic.FirstURL && subtopic.Text && results.length < limit) {
                  results.push({
                    title: subtopic.Text.split("\n")[0],
                    url: subtopic.FirstURL,
                    description: subtopic.Text,
                  });
                }
              });
            }
          }
        );
      }

      return {
        success: true,
        query,
        results: results.slice(0, limit),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        query,
        results: [],
        error: `DuckDuckGo search failed: ${errorMessage}`,
      };
    }
  }
}
