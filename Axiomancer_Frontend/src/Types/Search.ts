// Search types matching backend
export interface DuckDuckGoResult {
  title: string;
  url: string;
  description?: string;
}

export interface DuckDuckGoResponse {
  success: boolean;
  query: string;
  results: DuckDuckGoResult[];
  error?: string;
}

export interface SearchDuckDuckGoRequest {
  query: string;
  limit?: number;
}

export interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  collections: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

export interface PixabayResponse {
  success: boolean;
  query: string;
  results: PixabayImage[];
  count: number;
  error?: string;
}

export interface SearchPixabayRequest {
  query: string;
  limit?: number;
  imageType?: "photo" | "illustration" | "vector";
}

export interface BatchSearchRequest {
  query: string;
  includeDuckDuckGo?: boolean;
  includePixabay?: boolean;
  duckduckgoLimit?: number;
  pixabayLimit?: number;
}

export interface BatchSearchResponse {
  success: boolean;
  query: string;
  results: {
    duckduckgo?: DuckDuckGoResponse;
    pixabay?: PixabayResponse;
  };
  error?: string;
}

// Enhanced search settings - AI-optimized search query generation
export type EnhanceSearchMode = "disabled" | "server-default" | "current-model";

export interface EnhancedSearchPrompts {
  decision_prompt_model?: string; // Model key used to generate optimized search prompts
  prompt_web_search?: string; // AI-optimized prompt for web search
  prompt_picture_search?: string; // AI-optimized prompt for picture/image search
}
