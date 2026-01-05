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
  async searchWeb(request: SearchDuckDuckGoRequest) {
    const response = await apiClient.post<DuckDuckGoResponse>(SEARCH_ENDPOINTS.duckduckgo, request);
    return response.success
      ? response.data!
      : { success: false, query: request.query, results: [], error: response.error };
  },

  // Pixabay image search
  async searchImages(request: SearchPixabayRequest) {
    const response = await apiClient.post<PixabayResponse>(SEARCH_ENDPOINTS.pixabay, request);
    return response.success
      ? response.data!
      : { success: false, query: request.query, hits: [], error: response.error };
  },

  // Batch search (both web and images)
  async batchSearch(request: BatchSearchRequest) {
    const response = await apiClient.post<BatchSearchResponse>(SEARCH_ENDPOINTS.batch, request);
    return response.success
      ? response.data!
      : { success: false, web: null, images: null, error: response.error };
  },

  // Quick web search with default limit
  async quickWebSearch(query: string, limit: number = 5) {
    return this.searchWeb({ query, limit });
  },

  // Quick image search with default limit
  async quickImageSearch(query: string, limit: number = 10) {
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
