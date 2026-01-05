// User Service - handles user management
import apiClient from "./apiClient";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UploadResponse,
  ApiResponse,
} from "../Types";

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

  // Get current user profile (uses auth API)
  async getCurrentProfile(): Promise<ApiResponse<User>> {
    const { authService } = await import("./authService");
    // Use auth service to get current user profile
    const response = await authService.getCurrentUser();
    return response;
  },

  // Update current user profile - TODO: implement in backend if needed
  // async updateCurrentProfile(data: UpdateUserRequest): Promise<ApiResponse<User>> {
  //   // This endpoint doesn't exist in backend yet
  //   return apiClient.put("/api/auth/me", data);
  // },

  // Get profile picture URL
  getProfilePictureUrl(pictureUrl: string): string {
    if (pictureUrl.startsWith("http")) return pictureUrl;
    return `/Picture/Profile/${pictureUrl}`;
  },
};

export default userService;
