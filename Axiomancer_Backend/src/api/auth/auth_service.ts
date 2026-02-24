import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as authQuery from "./auth_query";
import * as userQuery from "@/api/user/user_query";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenPayload,
  RefreshTokenPayload,
  CreateApiKeyRequest,
  ApiKeyResponse,
  ValidateTokenResponse,
  ValidateApiKeyResponse,
  ApiKey,
} from "./auth_type";
import type { User } from "@/api/user/user_type";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

const parseTime = (timeStr: string): number => {
  const value = parseInt(timeStr, 10);
  const unit = timeStr.slice(-1).toLowerCase();
  switch (unit) {
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return value;
  }
};

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is required");
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Get user by username
      const user = await userQuery.getUserByUsername(credentials.username);
      if (!user) {
        return { success: false, error: "Invalid credentials" };
      }

      // Verify password
      const isValidPassword = await userQuery.verifyPassword(credentials.password, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Invalid credentials" };
      }

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          firstname: user.firstname || undefined,
          lastname: user.lastname || undefined,
          nickname: user.nickname || undefined,
          role: user.role,
          picture_url: user.picture_url,
          openrouter_api_key: user.openrouter_api_key,
        },
        token,
        refresh_token: refreshToken,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if username already exists
      const existingUser = await userQuery.getUserByUsername(data.username);
      if (existingUser) {
        return { success: false, error: "Username already exists" };
      }

      // Create user
      const user = await userQuery.createUser({
        username: data.username,
        password: data.password,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        nickname: data.nickname,
        role: "user",
      });

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          firstname: user.firstname || undefined,
          lastname: user.lastname || undefined,
          nickname: user.nickname || undefined,
          role: user.role,
          picture_url: user.picture_url,
          openrouter_api_key: user.openrouter_api_key,
        },
        token,
        refresh_token: refreshToken,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Registration failed" };
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as RefreshTokenPayload;

      // Get user
      const user = await userQuery.getUserById(decoded.userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Generate new access token
      const newToken = this.generateAccessToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          firstname: user.firstname || undefined,
          lastname: user.lastname || undefined,
          nickname: user.nickname || undefined,
          role: user.role,
          picture_url: user.picture_url,
          openrouter_api_key: user.openrouter_api_key,
        },
        token: newToken,
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      return { success: false, error: "Invalid refresh token" };
    }
  }

  static async logout(
    userId: number,
    refreshToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Since we're not using sessions, logout is just a success response
      // The client should remove tokens from localStorage
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Logout failed" };
    }
  }

  static async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      // Get user to include current email
      const user = await userQuery.getUserById(decoded.userId);
      if (!user) {
        return { valid: false, error: "User not found" };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          role: user.role,
          nickname: user.nickname,
          picture_url: user.picture_url,
          openrouter_api_key: user.openrouter_api_key,
        },
      };
    } catch (error) {
      return { valid: false, error: "Invalid token" };
    }
  }

  static async validateApiKey(apiKey: string): Promise<ValidateApiKeyResponse> {
    try {
      // Allow default API key for anonymous access
      const defaultApiKey = process.env.X_API_KEY!;
      if (!process.env.X_API_KEY) {
        throw new Error("X_API_KEY environment variable is required");
      }
      if (defaultApiKey && apiKey === defaultApiKey) {
        return {
          valid: true,
          user: undefined, // No associated user for anonymous access
          permissions: ["read"], // Limited permissions
        };
      }

      const keyRecord = await authQuery.verifyApiKey(apiKey);
      if (!keyRecord) {
        return { valid: false, error: "Invalid API key" };
      }

      // Get user
      const user = await userQuery.getUserById(keyRecord.user_id);
      if (!user) {
        return { valid: false, error: "User not found" };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          role: user.role,
        },
        permissions: keyRecord.permissions,
      };
    } catch (error) {
      console.error("API key validation error:", error);
      return { valid: false, error: "API key validation failed" };
    }
  }

  static async createApiKey(userId: number, data: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    try {
      const result = await authQuery.createApiKey(userId, data);

      return {
        success: true,
        api_key: {
          id: result.apiKey.id,
          name: result.apiKey.name,
          key: `ak_${result.plainKey}`,
          permissions: result.apiKey.permissions,
          expires_at: result.apiKey.expires_at,
          created_at: result.apiKey.created_at,
        },
      };
    } catch (error) {
      console.error("Create API key error:", error);
      return { success: false, error: "Failed to create API key" };
    }
  }

  static async getUserApiKeys(userId: number): Promise<ApiKey[]> {
    return await authQuery.getApiKeysByUserId(userId);
  }

  static async deleteApiKey(
    keyId: string,
    userId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = await authQuery.deleteApiKey(keyId, userId);
      if (!deleted) {
        return { success: false, error: "API key not found or access denied" };
      }

      return { success: true };
    } catch (error) {
      console.error("Delete API key error:", error);
      return { success: false, error: "Failed to delete API key" };
    }
  }

  private static generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      uuid: user.uuid,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + parseInt(JWT_EXPIRES_IN.replace("h", "")) * 3600,
    };

    return jwt.sign(payload, JWT_SECRET);
  }

  private static generateRefreshToken(user: User): string {
    const tokenId = crypto.randomUUID();
    const payload: RefreshTokenPayload = {
      userId: user.id,
      tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp:
        Math.floor(Date.now() / 1000) +
        parseInt(JWT_REFRESH_EXPIRES_IN.replace("d", "")) * 24 * 3600,
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET);
  }

  static async cleanupExpiredSessions(): Promise<void> {
    // Since we're not using sessions anymore, this is a no-op
    // Previously this would clean up expired user_session records
  }
}
