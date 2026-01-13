// User Service - handles user management
import apiClient from "./apiClient";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UploadResponse,
  ApiResponse,
} from "@/Types";

const USER_ENDPOINTS = {
  users: "/api/users",
  user: "/api/user",
  createUser: "/api/user/create",
  uploadPicture: (userId: number) => `/api/user/${userId}/upload-profile`,
  profilePicture: (userId: number) => `/api/user/${userId}/profile-picture`,
};

export const userService = {
  async getAllUsers() {
    return apiClient.get<User[]>("/api/users");
  },

  async getUserById(id: number) {
    return apiClient.get<User>(`/api/users/${id}`);
  },

  async getUserByUUID(uuid: string) {
    return apiClient.get<User>(`/api/user/uuid/${uuid}`);
  },

  async createUser(data: CreateUserRequest) {
    return apiClient.post<User>("/api/user/create", data);
  },

  async updateUser(id: number, data: UpdateUserRequest) {
    return apiClient.put<User>(`/api/user/${id}`, data);
  },

  async deleteUser(id: number) {
    return apiClient.delete<boolean>(`/api/user/${id}`);
  },

  async uploadProfilePicture(userId: number, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("profile_picture", file);
    return apiClient.upload<UploadResponse>(`/api/user/${userId}/upload-profile`, formData);
  },

  // Get current user profile
  async getCurrentProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>("/api/user/me");
  },

  // Update current user profile
  async updateCurrentProfile(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>("/api/user/me", data);
  },

  // Delete current user account
  async deleteCurrentProfile(): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>("/api/user/me");
  },

  // Upload profile picture for current user
  async uploadCurrentProfilePicture(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append("profile_picture", file);
    return apiClient.upload<UploadResponse>("/api/user/me/upload-profile", formData);
  },

  // Get profile picture URL
  getProfilePictureUrl(pictureUrl: string): string {
    if (pictureUrl.startsWith("http")) return pictureUrl;
    return `/Picture/Profile/${pictureUrl}`;
  },
};

export default userService;
