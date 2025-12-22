import * as aiQuery from "./ai_query";
import type {
  AiModel,
  CreateAiModelRequest,
  UpdateAiModelRequest,
} from "./ai_type";

export class AiService {
  // AI Model methods
  static async getAllModels(): Promise<AiModel[]> {
    return await aiQuery.getAiModels();
  }

  static async getModelById(id: string): Promise<AiModel | null> {
    return await aiQuery.getAiModelById(id);
  }

  static async getEnabledModels(): Promise<AiModel[]> {
    const models = await aiQuery.getAiModels();
    return models.filter((model) => model.enabled);
  }

  static async createModel(data: CreateAiModelRequest): Promise<AiModel> {
    // Validate data
    if (!data.provider || !data.model_key || !data.display_name) {
      throw new Error("Provider, model_key, and display_name are required");
    }
    if (data.context_length <= 0) {
      throw new Error("Context length must be positive");
    }
    if (data.cost_per_1k_token < 0) {
      throw new Error("Cost per 1k token cannot be negative");
    }

    return await aiQuery.createAiModel(data);
  }

  static async updateModel(
    id: string,
    data: UpdateAiModelRequest
  ): Promise<AiModel | null> {
    const existing = await aiQuery.getAiModelById(id);
    if (!existing) {
      return null;
    }

    // Validate data
    if (data.context_length !== undefined && data.context_length <= 0) {
      throw new Error("Context length must be positive");
    }
    if (data.cost_per_1k_token !== undefined && data.cost_per_1k_token < 0) {
      throw new Error("Cost per 1k token cannot be negative");
    }

    return await aiQuery.updateAiModel(id, data);
  }

  static async deleteModel(id: string): Promise<boolean> {
    return await aiQuery.deleteAiModel(id);
  }
}
