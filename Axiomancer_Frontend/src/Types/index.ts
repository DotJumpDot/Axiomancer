// Re-export all types from a single entry point
export * from "./User";
export * from "./Auth";
export * from "./AiModel";
export * from "./Chat";
export * from "./Prompt";
export * from "./Search";

// Common API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
