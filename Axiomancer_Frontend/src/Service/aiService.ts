// AI Model Service - handles AI model management
import apiClient from "./apiClient";
import type { AiModel, CreateAiModelRequest, UpdateAiModelRequest } from "../Types";

const AI_ENDPOINTS = {
  models: "/api/ai/models",
  enabledModels: "/api/ai/models/enabled",
};

export const aiService = {
  async getAllModels() {
    return apiClient.get<AiModel[]>(AI_ENDPOINTS.models);
  },

  async getEnabledModels() {
    return apiClient.get<AiModel[]>(AI_ENDPOINTS.enabledModels);
  },

  async getModelById(id: string) {
    return apiClient.get<AiModel>(`${AI_ENDPOINTS.models}/${id}`);
  },

  async createModel(data: CreateAiModelRequest) {
    return apiClient.post<AiModel>(AI_ENDPOINTS.models, data);
  },

  async updateModel(id: string, data: UpdateAiModelRequest) {
    return apiClient.put<AiModel>(`${AI_ENDPOINTS.models}/${id}`, data);
  },

  async deleteModel(id: string) {
    return apiClient.delete<boolean>(`${AI_ENDPOINTS.models}/${id}`);
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
