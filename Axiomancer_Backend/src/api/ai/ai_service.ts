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
    if (!data.pricing) {
      throw new Error("Pricing information is required");
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

    return await aiQuery.updateAiModel(id, data);
  }

  static async deleteModel(id: string): Promise<boolean> {
    return await aiQuery.deleteAiModel(id);
  }

  // Helper method to map OpenRouter model to our AiModel format
  private static mapOpenRouterModelToAiModel(openRouterModel: OpenRouterModel): AiModel {
    // Extract provider from model ID (e.g., "anthropic/claude-3-haiku" -> "anthropic")
    const provider = openRouterModel.id.split("/")[0] || "unknown";

    // Use pricing directly from OpenRouter
    const pricing = {
      prompt: openRouterModel.pricing.prompt || "0",
      completion: openRouterModel.pricing.completion || "0",
      request: openRouterModel.pricing.request || "0",
      image: openRouterModel.pricing.image || "0",
    };

    // Use capabilities from OpenRouter API response if available, otherwise calculate locally
    const modelName = openRouterModel.id.toLowerCase();
    const description = openRouterModel.description.toLowerCase();
    const supportedParams = openRouterModel.supported_parameters || [];
    const inputModalities = openRouterModel.architecture?.input_modalities || [];

    const capabilities = openRouterModel.capabilities || {
      reasoning:
        supportedParams.includes("reasoning") || supportedParams.includes("include_reasoning"),
      coding:
        description.includes("code") ||
        description.includes("programming") ||
        modelName.includes("codellama") ||
        modelName.includes("starcoder"),
      vision: inputModalities.includes("image"),
      fast:
        description.includes("fast") ||
        modelName.includes("haiku") ||
        modelName.includes("mini") ||
        openRouterModel.context_length < 8000,
    };

    return {
      id: openRouterModel.id,
      provider,
      model_key: openRouterModel.id,
      display_name: openRouterModel.name || openRouterModel.id,
      description: openRouterModel.description || "",
      context_length: openRouterModel.context_length,
      pricing,
      capabilities,
      enabled: true,
      chat_type_to_type: openRouterModel.architecture?.modality || "unknown",
      created: openRouterModel.created || 0,
      expiration_date: openRouterModel.expiration_date || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}
