// Selection types for user selected models
export interface UserSelectedModels {
  preset: number;
  user_uuid: string;
  ai_model_ids: string[];
  prompt_id?: string;
  searchable: boolean;
  created_at: string;
  updated_at: string;
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
