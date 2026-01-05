// AI Model Service - handles AI model management
import apiClient from "./apiClient";
import type { AiModel, CreateAiModelRequest, UpdateAiModelRequest, ApiResponse } from "../Types";

const AI_ENDPOINTS = {
  models: "/api/ai/models",
  enabledModels: "/api/ai/models/enabled",
};

export const aiService = {
  async getAllModels(): Promise<ApiResponse<AiModel[]>> {
    return apiClient.get(AI_ENDPOINTS.models);
  },

  async getEnabledModels(): Promise<ApiResponse<AiModel[]>> {
    return apiClient.get(AI_ENDPOINTS.enabledModels);
  },

  async getModelById(id: string): Promise<ApiResponse<AiModel>> {
    return apiClient.get(`${AI_ENDPOINTS.models}/${id}`);
  },

  async createModel(data: CreateAiModelRequest): Promise<ApiResponse<AiModel>> {
    return apiClient.post(AI_ENDPOINTS.models, data);
  },

  async updateModel(id: string, data: UpdateAiModelRequest): Promise<ApiResponse<AiModel>> {
    return apiClient.put(`${AI_ENDPOINTS.models}/${id}`, data);
  },

  async deleteModel(id: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`${AI_ENDPOINTS.models}/${id}`);
  },

  // Helper to find model by key
  findModelByKey(models: AiModel[], modelKey: string): AiModel | undefined {
    return models.find((m) => m.model_key === modelKey);
  },

  // Helper to filter models by capability
  filterByCapability(models: AiModel[], capability: keyof AiModel["capabilities"]): AiModel[] {
    return models.filter((m) => m.capabilities[capability]);
  },
};

export default aiService;
