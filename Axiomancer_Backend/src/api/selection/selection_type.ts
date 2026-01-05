// Selection types for user selected models
export interface UserSelectedModels {
  preset: number;
  user_uuid: string;
  ai_model_ids: string[]; // Array of AI model IDs
  searchable: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSelectionRequest {
  user_uuid: string;
  ai_model_ids: string[];
  searchable?: boolean;
}

export interface UpdateSelectionRequest {
  ai_model_ids?: string[];
  searchable?: boolean;
}

export interface SelectionResponse {
  preset: number;
  user_uuid: string;
  ai_model_ids: string[];
  searchable: boolean;
  created_at: string;
  updated_at: string;
}
