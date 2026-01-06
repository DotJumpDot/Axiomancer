// Prompt Service - handles prompt profile management
import apiClient from "./apiClient";
import type {
  PromptProfile,
  CreatePromptProfileRequest,
  UpdatePromptProfileRequest,
} from "@/Types";

const PROMPT_ENDPOINTS = {
  profiles: "/api/prompts",
  profilesByUser: "/api/prompts/user",
  create: "/api/prompt/create",
  createByUserUuid: "/api/prompts/user",
};

export const promptService = {
  async getAllProfiles() {
    // Fetch all profiles in the system
    return apiClient.get<PromptProfile[]>(PROMPT_ENDPOINTS.profiles);
  },

  async getProfilesByUserUuid(userUuid: string) {
    // Fetch profiles for a specific user
    return apiClient.get<PromptProfile[]>(`${PROMPT_ENDPOINTS.profilesByUser}/${userUuid}`);
  },

  async getProfileById(id: string) {
    return apiClient.get<PromptProfile>(`${PROMPT_ENDPOINTS.profiles}/${id}`);
  },

  async createProfile(data: CreatePromptProfileRequest) {
    // Backend automatically associates with user_uuid if authenticated
    return apiClient.post<PromptProfile>(PROMPT_ENDPOINTS.create, data);
  },

  async createProfileByUserUuid(userUuid: string, data: CreatePromptProfileRequest) {
    // Create profile for a specific user
    return apiClient.post<PromptProfile>(`${PROMPT_ENDPOINTS.createByUserUuid}/${userUuid}`, data);
  },

  async updateProfile(id: string, data: UpdatePromptProfileRequest) {
    // Backend verifies user ownership before updating
    return apiClient.put<PromptProfile>(`${PROMPT_ENDPOINTS.profiles}/${id}`, data);
  },

  async deleteProfile(id: string) {
    // Backend verifies user ownership before deleting
    return apiClient.delete<boolean>(`${PROMPT_ENDPOINTS.profiles}/${id}`);
  },

  // Default system prompts
  getDefaultSystemPrompt(): string {
    return "You are a helpful AI assistant. Provide clear, accurate, and concise responses.";
  },

  getCodingSystemPrompt(): string {
    return "You are an expert programmer. Provide clear, efficient code solutions with explanations. Follow best practices and include comments where helpful.";
  },

  getCreativeSystemPrompt(): string {
    return "You are a creative writing assistant. Help with brainstorming, writing, and editing content with imagination and style.";
  },
};

export default promptService;
