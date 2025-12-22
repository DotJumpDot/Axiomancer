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
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Check if username already exists
    const existingUser = await userQuery.getUserByUsername(data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    return await userQuery.createUser(data);
  }

  static async updateUser(
    id: number,
    data: UpdateUserRequest
  ): Promise<User | null> {
    const existing = await userQuery.getUserById(id);
    if (!existing) {
      return null;
    }

    // Validate data
    if (data.password && data.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    return await userQuery.updateUser(id, data);
  }

  static async deleteUser(id: number): Promise<boolean> {
    return await userQuery.deleteUser(id);
  }

  static async authenticateUser(
    credentials: LoginRequest
  ): Promise<User | null> {
    const user = await userQuery.getUserByUsername(credentials.username);
    if (!user) {
      return null;
    }

    const isValidPassword = await userQuery.verifyPassword(
      credentials.password,
      user.password
    );
    return isValidPassword ? user : null;
  }

  static async uploadProfilePicture(
    userId: number,
    file: File
  ): Promise<UploadResponse> {
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

      // Update user record
      const pictureUrl = `/uploads/profiles/${filename}`;
      const updatedUser = await userQuery.updateUserPicture(userId, pictureUrl);

      if (!updatedUser) {
        // Clean up file if update failed
        await fs.unlink(filepath).catch(() => {});
        return { success: false, error: "Failed to update user profile" };
      }

      return {
        success: true,
        filename,
        url: pictureUrl,
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
    return publicUser;
  }

  static async validateUser(
    user: User
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!user.username || user.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }
    if (!user.uuid) {
      errors.push("UUID is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
