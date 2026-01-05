// Prompt Service - handles prompt profile management
import apiClient from "./apiClient";
import type {
  PromptProfile,
  CreatePromptProfileRequest,
  UpdatePromptProfileRequest,
  ApiResponse,
} from "../Types";

const PROMPT_ENDPOINTS = {
  profiles: "/api/prompts",
};

export const promptService = {
  async getAllProfiles(): Promise<ApiResponse<PromptProfile[]>> {
    return apiClient.get(PROMPT_ENDPOINTS.profiles);
  },

  async getProfileById(id: string): Promise<ApiResponse<PromptProfile>> {
    return apiClient.get(`${PROMPT_ENDPOINTS.profiles}/${id}`);
  },

  async createProfile(data: CreatePromptProfileRequest): Promise<ApiResponse<PromptProfile>> {
    return apiClient.post(PROMPT_ENDPOINTS.profiles, data);
  },

  async updateProfile(
    id: string,
    data: UpdatePromptProfileRequest
  ): Promise<ApiResponse<PromptProfile>> {
    return apiClient.put(`${PROMPT_ENDPOINTS.profiles}/${id}`, data);
  },

  async deleteProfile(id: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`${PROMPT_ENDPOINTS.profiles}/${id}`);
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
