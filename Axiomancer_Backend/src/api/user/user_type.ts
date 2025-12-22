export interface User {
  id: number;
  uuid: string;
  username: string;
  password: string; // hashed
  firstname: string | null;
  lastname: string | null;
  nickname: string | null;
  role: string;
  tel: string | null;
  picture_url: string;
  created_at: Date;
  updated_at: Date | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  role?: string;
  tel?: string;
}

export interface UpdateUserRequest {
  firstname?: string | null;
  lastname?: string | null;
  nickname?: string | null;
  role?: string;
  tel?: string | null;
  password?: string; // for password changes
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
}

export interface UploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
}
