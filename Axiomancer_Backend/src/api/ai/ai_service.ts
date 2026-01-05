import * as aiQuery from "./ai_query";
import { openRouterClient } from "./ai_openrouter";
import type {
  AiModel,
  CreateAiModelRequest,
  UpdateAiModelRequest,
  OpenRouterModel,
} from "./ai_type";

export class AiService {
  // AI Model methods
  static async getAllModels(): Promise<AiModel[]> {
    if (!openRouterClient) {
      throw new Error("OpenRouter API key not configured");
    }

    try {
      const response = await openRouterClient.getModels();
      return response.data.map(this.mapOpenRouterModelToAiModel);
    } catch (error) {
      console.error("Failed to fetch models from OpenRouter:", error);
      // Fallback to database if OpenRouter fails
      return await aiQuery.getAiModels();
    }
  }

  static async getModelById(id: string): Promise<AiModel | null> {
    const models = await this.getAllModels();
    return models.find((model) => model.id === id) || null;
  }

  static async getEnabledModels(): Promise<AiModel[]> {
    const models = await this.getAllModels();
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

  static async updateModel(id: string, data: UpdateAiModelRequest): Promise<AiModel | null> {
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

  // Helper method to map OpenRouter model to our AiModel format
  private static mapOpenRouterModelToAiModel(openRouterModel: OpenRouterModel): AiModel {
    // Extract provider from model ID (e.g., "anthropic/claude-3-haiku" -> "anthropic")
    const provider = openRouterModel.id.split("/")[0] || "unknown";

    // Calculate cost per 1k tokens (convert from pricing strings)
    const promptCost = parseFloat(openRouterModel.pricing.prompt) || 0;
    const completionCost = parseFloat(openRouterModel.pricing.completion) || 0;
    const avgCostPer1k = ((promptCost + completionCost) / 2) * 1000; // Convert to per 1k tokens

    // Determine capabilities based on model name and description
    const modelName = openRouterModel.id.toLowerCase();
    const description = openRouterModel.description.toLowerCase();

    const capabilities = {
      reasoning:
        description.includes("reasoning") ||
        modelName.includes("claude") ||
        modelName.includes("gpt-4"),
      coding:
        description.includes("code") ||
        description.includes("programming") ||
        modelName.includes("codellama") ||
        modelName.includes("starcoder"),
      vision:
        description.includes("vision") ||
        description.includes("image") ||
        modelName.includes("vision") ||
        modelName.includes("gpt-4v"),
      fast:
        description.includes("fast") ||
        modelName.includes("haiku") ||
        modelName.includes("3.5") ||
        openRouterModel.context_length < 8000,
    };

    return {
      id: openRouterModel.id,
      provider,
      model_key: openRouterModel.id,
      display_name: openRouterModel.name || openRouterModel.id,
      context_length: openRouterModel.context_length,
      cost_per_1k_token: avgCostPer1k,
      capabilities,
      enabled: true, // All OpenRouter models are enabled by default
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}
