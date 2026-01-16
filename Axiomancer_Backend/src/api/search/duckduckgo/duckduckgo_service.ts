import type {
  DuckDuckGoResult,
  DuckDuckGoResponse,
  DuckDuckGoApiResponse,
} from "./duckduckgo_type";

const DUCKDUCKGO_API = "https://api.duckduckgo.com/";

/**
 * DuckDuckGo Search Service
 * Fetches instant answers and search results from DuckDuckGo Instant Answer API
 */
export class DuckDuckGoService {
  //* Search using DuckDuckGo Instant Answer API
  static async search(query: string, limit: number = 10): Promise<DuckDuckGoResponse> {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error("Search query cannot be empty");
      }

      // Build API URL with proper parameters
      const url = new URL(DUCKDUCKGO_API);
      url.searchParams.append("q", query.trim());
      url.searchParams.append("format", "json");
      url.searchParams.append("no_html", "1");
      url.searchParams.append("no_redirect", "1");
      url.searchParams.append("skip_disambig", "1");
      url.searchParams.append("t", "axiomancer");

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Axiomancer/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `DuckDuckGo API returned status ${response.status}: ${response.statusText}`
        );
      }

      const data: DuckDuckGoApiResponse = await response.json();

      // Parse DuckDuckGo Instant Answer response
      const results: DuckDuckGoResult[] = [];
      let abstract = "";
      let abstractURL = "";

      // Check for instant answer
      if (data.Answer && data.AnswerType) {
        results.push({
          title: `Answer: ${query}`,
          url: data.AbstractURL || "",
          description: data.Answer,
        });
      }

      // Check for definition
      if (data.Definition && data.DefinitionURL) {
        results.push({
          title: `Definition: ${data.Heading || query}`,
          url: data.DefinitionURL,
          description: `${data.Definition} (Source: ${data.DefinitionSource || "Unknown"})`,
        });
      }

      // Check for abstract/topic summary
      if (data.AbstractText && data.AbstractURL) {
        abstract = data.AbstractText;
        abstractURL = data.AbstractURL;
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          description: data.AbstractText,
        });
      }

      // Process Results array (direct answers)
      if (data.Results && Array.isArray(data.Results)) {
        data.Results.slice(0, 3).forEach((result) => {
          if (result.FirstURL && result.Text) {
            results.push({
              title: result.Text.split(" - ")[0] || result.Text.substring(0, 60),
              url: result.FirstURL,
              description: result.Text,
            });
          }
        });
      }

      // Process RelatedTopics for more context
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, limit).forEach((topic) => {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Name || topic.Text.split(" - ")[0] || topic.Text.substring(0, 60),
              url: topic.FirstURL,
              description: topic.Text,
            });
          } else if (topic.Topics && Array.isArray(topic.Topics)) {
            // Handle nested topics (categories)
            topic.Topics.slice(0, 3).forEach((subtopic) => {
              if (subtopic.FirstURL && subtopic.Text && results.length < limit) {
                results.push({
                  title: subtopic.Text.split(" - ")[0] || subtopic.Text.substring(0, 60),
                  url: subtopic.FirstURL,
                  description: subtopic.Text,
                });
              }
            });
          }
        });
      }

      // Check for redirect (bang commands)
      if (data.Redirect) {
        results.push({
          title: "Redirect",
          url: data.Redirect,
          description: `DuckDuckGo redirect: ${data.Redirect}`,
        });
      }

      // Limit results to requested amount
      const finalResults = results.slice(0, limit);

      return {
        success: true,
        query,
        results: finalResults,
        abstract: abstract || undefined,
        abstractURL: abstractURL || undefined,
        error: finalResults.length === 0 ? "No results found" : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("[DuckDuckGo] Search error:", errorMessage);
      return {
        success: false,
        query,
        results: [],
        error: `DuckDuckGo search failed: ${errorMessage}`,
      };
    }
  }

  //* Format search results for AI context
  static formatResultsForAI(response: DuckDuckGoResponse): string {
    if (!response.success || response.results.length === 0) {
      return "No web search results found.";
    }

    let formatted = `Web Search Results for "${response.query}":\n\n`;

    // Add abstract if available
    if (response.abstract) {
      formatted += `Summary: ${response.abstract}\n`;
      if (response.abstractURL) {
        formatted += `Source: ${response.abstractURL}\n`;
      }
      formatted += "\n";
    }

    // Add search results
    response.results.forEach((result, index) => {
      formatted += `[${index + 1}] ${result.title}\n`;
      formatted += `URL: ${result.url}\n`;
      if (result.description) {
        formatted += `Description: ${result.description}\n`;
      }
      formatted += "\n";
    });

    return formatted;
  }
}
