import type { PixabayImage } from "./pixabay_type";

/**
 * Pixabay Query Layer
 * Handles caching and persistence of Pixabay search results
 */
export async function getPixabayResults(
  query: string,
  limit: number = 20
): Promise<PixabayImage[]> {
  // This function can be extended to:
  // - Cache results in database
  // - Track search history
  // - Return historical results if needed
  // For now, returns empty (data is fetched directly in service)
  return [];
}
