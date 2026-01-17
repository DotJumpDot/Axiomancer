// Selection types for user selected models
export interface UserSelectedModels {
  preset: number;
  user_uuid: string;
  ai_model_ids: string[]; // Array of AI model IDs
  prompt_id?: string; // Optional prompt profile ID
  preset_name?: string;
  searchable: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSelectionRequest {
  user_uuid: string;
  ai_model_ids: string[];
  prompt_id?: string;
  preset_name?: string;
  searchable?: boolean;
}

export interface UpdateSelectionRequest {
  ai_model_ids?: string[];
  prompt_id?: string;
  preset_name?: string;
  searchable?: boolean;
}

export interface SelectionResponse {
  preset: number;
  user_uuid: string;
  ai_model_ids: string[];
  prompt_id?: string;
  preset_name?: string;
  searchable: boolean;
  created_at: string;
  updated_at: string;
}

// Request for creating preset with automatic model validation
export interface CreatePresetWithModelsRequest {
  user_uuid: string;
  ai_model_ids: string[]; // OpenRouter model IDs
  prompt_id?: string;
  preset_name?: string;
  searchable?: boolean;
  openrouter_api_key: string; // API key for fetching model data
}
