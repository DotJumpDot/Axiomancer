// User Favorite Types

export interface UserFavorite {
  id: number;
  user_uuid: string;
  favorite_models: string[];
  favorite_prompts: string[];
  favorite_conversation: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserFavoriteRequest {
  user_uuid: string;
  favorite_models?: string[];
  favorite_prompts?: string[];
  favorite_conversation?: string[];
}

export interface UpdateUserFavoriteRequest {
  favorite_models?: string[];
  favorite_prompts?: string[];
  favorite_conversation?: string[];
}

export interface AddToFavoriteRequest {
  model_key?: string;
  prompt_id?: string;
  conversation_id?: string;
}

export interface RemoveFromFavoriteRequest {
  model_key?: string;
  prompt_id?: string;
  conversation_id?: string;
}
