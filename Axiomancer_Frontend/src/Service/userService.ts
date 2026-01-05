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
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get(USER_ENDPOINTS.users);
  },

  async getUserById(id: number): Promise<ApiResponse<User>> {
    return apiClient.get(`${USER_ENDPOINTS.users}/${id}`);
  },

  async getUserByUUID(uuid: string): Promise<ApiResponse<User>> {
    return apiClient.get(`${USER_ENDPOINTS.users}/uuid/${uuid}`);
  },

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post(USER_ENDPOINTS.createUser, data);
  },

  async updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put(`${USER_ENDPOINTS.user}/${id}`, data);
  },

  async deleteUser(id: number): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`${USER_ENDPOINTS.user}/${id}`);
  },

  async uploadProfilePicture(userId: number, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("profile_picture", file);
    return apiClient.upload(USER_ENDPOINTS.uploadPicture(userId), formData);
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
