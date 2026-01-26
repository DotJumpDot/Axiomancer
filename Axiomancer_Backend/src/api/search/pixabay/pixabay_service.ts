import type { PixabayImage } from "./pixabay_type";

const PIXABAY_API = "https://pixabay.com/api/";

/**
 * Pixabay Image Search Service
 * Fetches images from Pixabay API
 */
export class PixabayService {
  private static customApiKey: string = "";

  // * Get API key - reads from env at runtime to ensure dotenv has loaded
  private static getApiKey(): string {
    return this.customApiKey || process.env.PIXABAY_API_KEY || "";
  }

  static setApiKey(key: string) {
    this.customApiKey = key;
  }

  static async search(
    query: string,
    limit: number = 20,
    imageType: "photo" | "illustration" | "vector" = "photo"
  ): Promise<{ success: boolean; results: PixabayImage[]; error?: string }> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.error("[PixabayService] API key not configured");
      return {
        success: false,
        results: [],
        error: "Pixabay API key not configured",
      };
    }

    try {
      const url = new URL(PIXABAY_API);
      url.searchParams.append("key", apiKey);
      url.searchParams.append("q", encodeURIComponent(query));
      url.searchParams.append("per_page", Math.min(limit, 200).toString());
      url.searchParams.append("image_type", imageType);
      url.searchParams.append("safesearch", "true");
      url.searchParams.append("order", "popular");

      console.log(`[PixabayService] Searching for: "${query}" (limit: ${limit})`);

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PixabayService] API error: ${response.status} - ${errorText}`);
        throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();

      console.log(
        `[PixabayService] Found ${data.totalHits || 0} total hits, returning ${data.hits?.length || 0} results`
      );

      return {
        success: true,
        results: data.hits || [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`[PixabayService] Search failed: ${errorMessage}`);
      return {
        success: false,
        results: [],
        error: `Pixabay search failed: ${errorMessage}`,
      };
    }
  }
}
