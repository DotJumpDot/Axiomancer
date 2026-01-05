// Search Service - handles web and image search
import apiClient from "./apiClient";
import type {
  DuckDuckGoResponse,
  PixabayResponse,
  SearchDuckDuckGoRequest,
  SearchPixabayRequest,
  BatchSearchRequest,
  BatchSearchResponse,
} from "../Types";

const SEARCH_ENDPOINTS = {
  duckduckgo: "/api/search/duckduckgo",
  pixabay: "/api/search/pixabay",
  batch: "/api/search/batch",
};

export const searchService = {
  // DuckDuckGo web search
  async searchWeb(request: SearchDuckDuckGoRequest): Promise<DuckDuckGoResponse> {
    return apiClient.post(SEARCH_ENDPOINTS.duckduckgo, request);
  },

  // Pixabay image search
  async searchImages(request: SearchPixabayRequest): Promise<PixabayResponse> {
    return apiClient.post(SEARCH_ENDPOINTS.pixabay, request);
  },

  // Batch search (both web and images)
  async batchSearch(request: BatchSearchRequest): Promise<BatchSearchResponse> {
    return apiClient.post(SEARCH_ENDPOINTS.batch, request);
  },

  // Quick web search with default limit
  async quickWebSearch(query: string, limit: number = 5): Promise<DuckDuckGoResponse> {
    return this.searchWeb({ query, limit });
  },

  // Quick image search with default limit
  async quickImageSearch(query: string, limit: number = 10): Promise<PixabayResponse> {
    return this.searchImages({ query, limit, imageType: "photo" });
  },

  // Format search results for AI context
  formatWebResultsForContext(results: DuckDuckGoResponse): string {
    if (!results.success || results.results.length === 0) {
      return "No web search results found.";
    }

    return results.results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.description || ""}\nURL: ${r.url}`)
      .join("\n\n");
  },

  // Format image results for display
  formatImageResultsForDisplay(
    results: PixabayResponse
  ): { url: string; preview: string; tags: string }[] {
    if (!results.success || results.results.length === 0) {
      return [];
    }

    return results.results.map((img) => ({
      url: img.largeImageURL,
      preview: img.previewURL,
      tags: img.tags,
    }));
  },
};

export default searchService;
