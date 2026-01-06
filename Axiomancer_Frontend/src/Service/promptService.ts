// Prompt Service - handles prompt profile management
import apiClient from "./apiClient";
import type {
  PromptProfile,
  CreatePromptProfileRequest,
  UpdatePromptProfileRequest,
} from "@/Types";

const PROMPT_ENDPOINTS = {
  profiles: "/api/prompts",
  create: "/api/prompt/create",
};

export const promptService = {
  async getAllProfiles() {
    // Fetch all profiles (backend filters by user if authenticated)
    return apiClient.get<PromptProfile[]>(PROMPT_ENDPOINTS.profiles);
  },

  async getProfileById(id: string) {
    return apiClient.get<PromptProfile>(`${PROMPT_ENDPOINTS.profiles}/${id}`);
  },

  async createProfile(data: CreatePromptProfileRequest) {
    // Backend automatically associates with user_uuid if authenticated
    return apiClient.post<PromptProfile>(PROMPT_ENDPOINTS.create, data);
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
