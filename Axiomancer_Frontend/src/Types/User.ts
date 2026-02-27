// User types matching backend
export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  nickname: string | null;
  role: string;
  tel: string | null;
  picture_url: string;
  has_api_key: boolean;
  created_at: Date;
  updated_at: Date | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  role?: string;
  tel?: string;
  openrouter_api_key?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstname?: string | null;
  lastname?: string | null;
  nickname?: string | null;
  role?: string;
  tel?: string | null;
  password?: string;
  openrouter_api_key?: string | null;
}

export interface UploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
}
