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
