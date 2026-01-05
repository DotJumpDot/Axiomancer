import type { DuckDuckGoResult } from "./duckduckgo_type";

/**
 * DuckDuckGo Query Layer
 * Handles caching and persistence of DuckDuckGo search results
 */
export async function getDuckDuckGoResults(
  query: string,
  limit: number = 10
): Promise<DuckDuckGoResult[]> {
  // This function can be extended to:
  // - Cache results in database
  // - Track search history
  // - Return historical results if needed
  // For now, returns empty (data is fetched directly in service)
  return [];
}
