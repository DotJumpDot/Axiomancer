export interface PromptProfile {
  id: string;
  user_uuid: string | null;
  name: string;
  description: string | null;
  system_prompt: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePromptProfileRequest {
  name: string;
  description?: string;
  system_prompt: string;
}

export interface UpdatePromptProfileRequest {
  name?: string;
  description?: string | null;
  system_prompt?: string;
}
