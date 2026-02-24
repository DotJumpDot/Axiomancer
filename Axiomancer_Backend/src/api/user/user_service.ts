import * as userQuery from "./user_query";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  AuthResponse,
  UploadResponse,
} from "./user_type";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "..",
  "Axiomancer_Frontend",
  "public",
  "Picture",
  "Profile"
);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// ============ Encryption Configuration ============
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
// const SALT_LENGTH = 64;
// const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
// Get encryption salt from environment
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT!;

if (!process.env.ENCRYPTION_SALT) {
  throw new Error("ENCRYPTION_SALT environment variable is required");
}

/**
 * Derives an encryption key from the salt using PBKDF2
 */
function deriveKey(salt: string): Buffer {
  return crypto.pbkdf2Sync(salt, ENCRYPTION_SALT, ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypts API key with AES-256-GCM
 * @param apiKey - The API key to encrypt
 * @returns Encrypted data in format: iv:authTag:encryptedData (base64)
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) {
    throw new Error("API key cannot be empty");
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from salt
  const key = deriveKey(ENCRYPTION_SALT);

  // Create cipher
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  // Encrypt
  let encrypted = cipher.update(apiKey, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts API key
 * @param encryptedData - Encrypted data in format: iv:authTag:encryptedData (base64)
 * @returns Decrypted API key
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error("Encrypted data cannot be empty");
  }

  try {
    // Check if data is already in plain text (for backward compatibility)
    // Encrypted format has exactly 3 parts separated by ':'
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      // Assume it's plain text (unencrypted legacy key)
      // If it looks like a valid API key, return it as-is
      if (encryptedData.startsWith("sk-") || encryptedData.length > 20) {
        console.warn("Warning: Found unencrypted API key. It will be encrypted on next update.");
        return encryptedData;
      }
      throw new Error("Invalid encrypted data format");
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    // Derive key from salt
    const key = deriveKey(ENCRYPTION_SALT);

    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // If decryption fails, check if it's a plain text key
    if (encryptedData.startsWith("sk-") || encryptedData.length > 20) {
      console.warn(
        "Warning: Decryption failed, treating as plain text. Key will be encrypted on next update."
      );
      return encryptedData;
    }
    throw new Error(
      "Failed to decrypt API key: " + (error instanceof Error ? error.message : "Unknown error")
    );
  }
}

/**
 * Hashes an API key for storage (one-way)
 * @param apiKey - The API key to hash
 * @returns Hashed API key
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHmac("sha256", ENCRYPTION_SALT).update(apiKey).digest("hex");
}

// ============ User Service Class ============

export class UserService {
  static async getAllUsers(): Promise<User[]> {
    return await userQuery.getUsers();
  }

  static async getUserById(id: number): Promise<User | null> {
    return await userQuery.getUserById(id);
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    return await userQuery.getUserByUsername(username);
  }

  static async getUserByUUID(uuid: string): Promise<User | null> {
    return await userQuery.getUserByUUID(uuid);
  }

  static async createUser(data: CreateUserRequest): Promise<User> {
    // Validate data
    if (!data.username || !data.password) {
      throw new Error("Username and password are required");
    }
    if (data.username.length < 3) {
      throw new Error("Username must be at least 3 characters long");
    }
    if (data.password.length < 4) {
      throw new Error("Password must be at least 4 characters long");
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("Valid email is required");
    }

    // Check if username already exists
    const existingUser = await userQuery.getUserByUsername(data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    return await userQuery.createUser(data);
  }

  static async updateUser(id: number, data: UpdateUserRequest): Promise<User | null> {
    const existing = await userQuery.getUserById(id);
    if (!existing) {
      return null;
    }

    // Validate data
    if (data.password && data.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }
    if (data.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("Invalid email format");
    }

    // Encrypt OpenRouter API key if provided
    if (data.openrouter_api_key) {
      data.openrouter_api_key = encryptApiKey(data.openrouter_api_key);
    }

    return await userQuery.updateUser(id, data);
  }

  static async deleteUser(id: number): Promise<boolean> {
    return await userQuery.deleteUser(id);
  }

  static async authenticateUser(credentials: LoginRequest): Promise<User | null> {
    const user = await userQuery.getUserByUsername(credentials.username);
    if (!user) {
      return null;
    }

    const isValidPassword = await userQuery.verifyPassword(credentials.password, user.password);
    return isValidPassword ? user : null;
  }

  static async uploadProfilePicture(userId: number, file: File): Promise<UploadResponse> {
    try {
      // Validate file
      if (!file) {
        return { success: false, error: "No file provided" };
      }

      if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: "File size too large (max 5MB)" };
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return {
          success: false,
          error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
        };
      }

      // Ensure upload directory exists
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Generate unique filename
      const fileExtension = path.extname(file.name) || ".jpg";
      const filename = `${userId}_${Date.now()}_${crypto
        .randomBytes(8)
        .toString("hex")}${fileExtension}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Convert file to buffer and save
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filepath, buffer);

      // Update user record with just the filename (frontend will construct full path)
      const updatedUser = await userQuery.updateUserPicture(userId, filename);

      if (!updatedUser) {
        // Clean up file if update failed
        await fs.unlink(filepath).catch(() => {});
        return { success: false, error: "Failed to update user profile" };
      }

      return {
        success: true,
        filename,
        url: `/Picture/Profile/${filename}`,
      };
    } catch (error) {
      console.error("File upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  static getPublicUser(user: User): Omit<User, "password"> {
    const { password, ...publicUser } = user;

    // Decrypt API key if it exists
    if (publicUser.openrouter_api_key) {
      try {
        publicUser.openrouter_api_key = decryptApiKey(publicUser.openrouter_api_key);
      } catch (error) {
        console.error("Failed to decrypt API key for user:", user.username, error);
        // Keep the key as-is if decryption fails (might be already plain text)
        // Don't set to null - let the caller handle it
      }
    }

    return publicUser;
  }

  static async validateUser(user: User): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation logic
    if (!user.username || user.username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push("Valid email is required");
    }
    // Add more validations as needed

    return { valid: errors.length === 0, errors };
  }
}
