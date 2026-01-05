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

export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    uuid: string;
    username: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    nickname?: string;
    role: string;
    picture_url: string;
  };
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

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
  iat: number;
  exp: number;
}

export interface ApiKey {
  id: string;
  user_id: number;
  name: string;
  key_hash: string;
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
    key: string; // Only shown once during creation
    permissions: string[];
    expires_at: Date | null;
    created_at: Date;
  };
  error?: string;
}

export interface Session {
  id: string;
  user_id: number;
  refresh_token_hash: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: number;
    uuid: string;
    username: string;
    email?: string;
    role: string;
    nickname?: string | null;
    picture_url: string;
  };
  error?: string;
}

export interface ValidateApiKeyResponse {
  valid: boolean;
  user?: {
    id: number;
    uuid: string;
    username: string;
    role: string;
  };
  permissions?: string[];
  error?: string;
}
