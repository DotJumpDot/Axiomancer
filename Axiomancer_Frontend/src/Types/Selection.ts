// Selection types for user selected models (presets)
export interface UserSelectedModels {
  preset: number;
  user_uuid: string;
  ai_model_ids: string[];
  prompt_id?: string;
  preset_name?: string;
  searchable: boolean;
  created_at: string;
  updated_at: string;
  name?: string; // legacy UI-only fallback
}

export interface CreateSelectionRequest {
  user_uuid: string;
  ai_model_ids: string[];
  prompt_id?: string;
  searchable?: boolean;
}

export interface UpdateSelectionRequest {
  ai_model_ids?: string[];
  prompt_id?: string;
  searchable?: boolean;
}

export interface CreatePresetRequest {
  user_uuid: string;
  ai_model_ids: string[];
  prompt_id?: string;
  preset_name?: string;
  searchable?: boolean;
  openrouter_api_key: string;
}

export interface UpdatePresetRequest {
  ai_model_ids?: string[];
  prompt_id?: string;
  preset_name?: string;
  searchable?: boolean;
  openrouter_api_key?: string;
}
