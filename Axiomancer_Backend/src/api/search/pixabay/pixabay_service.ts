import type { PixabayImage } from "./pixabay_type";

const PIXABAY_API = "https://pixabay.com/api";

/**
 * Pixabay Image Search Service
 * Fetches images from Pixabay API
 */
export class PixabayService {
  private static apiKey: string = process.env.PIXABAY_API_KEY || "";

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static async search(
    query: string,
    limit: number = 20,
    imageType: "photo" | "illustration" | "vector" = "photo"
  ): Promise<{ success: boolean; results: PixabayImage[]; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        results: [],
        error: "Pixabay API key not configured",
      };
    }

    try {
      const url = new URL(PIXABAY_API);
      url.searchParams.append("key", this.apiKey);
      url.searchParams.append("q", query);
      url.searchParams.append("per_page", Math.min(limit, 200).toString());
      url.searchParams.append("image_type", imageType);
      url.searchParams.append("safesearch", "true");
      url.searchParams.append("order", "popular");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.statusText}`);
      }

      const data: any = await response.json();

      return {
        success: true,
        results: data.hits || [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        results: [],
        error: `Pixabay search failed: ${errorMessage}`,
      };
    }
  }
}
