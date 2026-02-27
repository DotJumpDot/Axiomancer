// Auth types matching backend
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
}

export interface AuthUser {
  id: number;
  uuid: string;
  username: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  role: string;
  picture_url: string;
  has_api_key: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refresh_token?: string;
  error?: string;
}

export interface TokenPayload {
  userId: number;
  uuid: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface ApiKey {
  id: string;
  user_uuid: string;
  name: string;
  permissions: string[];
  expires_at: Date | null;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expires_in_days?: number;
}

export interface ApiKeyResponse {
  success: boolean;
  api_key?: {
    id: string;
    name: string;
    key: string;
    permissions: string[];
    expires_at: Date | null;
    created_at: Date;
  };
  error?: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: number;
    uuid: string;
    username: string;
    email?: string;
    role: string;
    nickname?: string;
    picture_url?: string;
    has_api_key: boolean;
  };
  error?: string;
}
