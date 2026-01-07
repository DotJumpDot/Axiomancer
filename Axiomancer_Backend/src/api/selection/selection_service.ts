import * as selectionQuery from "./selection_query";
import * as aiQuery from "../ai/ai_query";
import { OpenRouterClient } from "../ai/ai_openrouter";
import type {
  UserSelectedModels,
  CreateSelectionRequest,
  UpdateSelectionRequest,
  CreatePresetWithModelsRequest,
} from "./selection_type";
import type { CreateAiModelRequest, OpenRouterModel } from "../ai/ai_type";

export class SelectionService {
  // Get all presets for a user
  static async getSelectionsByUserUUID(user_uuid: string): Promise<UserSelectedModels[]> {
    return await selectionQuery.getSelectionsByUserUUID(user_uuid);
  }

  static async getSelectionByUserUUID(user_uuid: string): Promise<UserSelectedModels | null> {
    return await selectionQuery.getSelectionByUserUUID(user_uuid);
  }

  static async getSelectionByPreset(preset: number): Promise<UserSelectedModels | null> {
    return await selectionQuery.getSelectionByPreset(preset);
  }

  static async getAllSelections(): Promise<UserSelectedModels[]> {
    return await selectionQuery.getAllSelections();
  }

  static async createSelection(data: CreateSelectionRequest): Promise<UserSelectedModels> {
    // Validate data
    if (!data.user_uuid) {
      throw new Error("user_uuid is required");
    }
    if (!Array.isArray(data.ai_model_ids) || data.ai_model_ids.length === 0) {
      throw new Error("ai_model_ids must be a non-empty array");
    }

    return await selectionQuery.createSelection(data);
  }

  // Create preset with automatic model validation and creation
  static async createPresetWithModels(
    data: CreatePresetWithModelsRequest
  ): Promise<UserSelectedModels> {
    // Validate data
    if (!data.user_uuid) {
      throw new Error("user_uuid is required");
    }
    if (!Array.isArray(data.ai_model_ids) || data.ai_model_ids.length === 0) {
      throw new Error("ai_model_ids must be a non-empty array");
    }
    if (!data.openrouter_api_key) {
      throw new Error("openrouter_api_key is required");
    }

    // Validate and create models if needed
    const validatedModelIds = await this.validateAndCreateModels(
      data.ai_model_ids,
      data.openrouter_api_key
    );

    // Create the preset
    return await selectionQuery.createSelection({
      user_uuid: data.user_uuid,
      ai_model_ids: validatedModelIds,
      prompt_id: data.prompt_id,
      preset_name: data.preset_name,
      searchable: data.searchable,
    });
  }

  // Helper method to validate models and create them if they don't exist
  private static async validateAndCreateModels(
    modelIds: string[],
    openrouterApiKey: string
  ): Promise<string[]> {
    const openRouter = new OpenRouterClient(openrouterApiKey);
    const validatedIds: string[] = [];

    // Fetch all models from OpenRouter
    const openRouterModels = await openRouter.getModels();
    const modelMap = new Map<string, OpenRouterModel>();
    openRouterModels.data.forEach((model) => {
      modelMap.set(model.id, model);
    });

    for (const modelId of modelIds) {
      // Check if model exists in database by model_key (not by id)
      const existingModel = await aiQuery.getAiModelByModelKey(modelId);

      if (existingModel) {
        // Model exists - check if data matches OpenRouter
        const openRouterModel = modelMap.get(modelId);
        if (openRouterModel) {
          const needsUpdate = this.shouldUpdateModel(existingModel, openRouterModel);
          if (needsUpdate) {
            // Update existing model instead of creating new one
            const updateData = {
              display_name: openRouterModel.name,
              context_length: openRouterModel.context_length,
              cost_per_1k_token: parseFloat(openRouterModel.pricing.prompt),
              capabilities: {
                reasoning: openRouterModel.architecture.modality.includes("text"),
                coding: openRouterModel.architecture.modality.includes("text"),
                vision: openRouterModel.architecture.modality.includes("image"),
                fast: openRouterModel.top_provider.max_completion_tokens > 0,
              },
            };
            await aiQuery.updateAiModel(existingModel.id, updateData);
          }
          // Use existing model's model_key
          validatedIds.push(modelId);
        } else {
          // Model exists in DB but not in OpenRouter - use existing
          validatedIds.push(modelId);
        }
      } else {
        // Model doesn't exist - fetch from OpenRouter and create
        const openRouterModel = modelMap.get(modelId);
        if (!openRouterModel) {
          throw new Error(`Model ${modelId} not found in OpenRouter`);
        }

        const newModelData = this.mapOpenRouterModelToAiModel(openRouterModel);
        await aiQuery.createAiModel(newModelData);
        validatedIds.push(modelId);
      }
    }

    return validatedIds;
  }

  // Check if model data has changed and needs update
  private static shouldUpdateModel(existingModel: any, openRouterModel: OpenRouterModel): boolean {
    const newCost = parseFloat(openRouterModel.pricing.prompt);
    const newContextLength = openRouterModel.context_length;

    return (
      existingModel.context_length !== newContextLength ||
      Math.abs(existingModel.cost_per_1k_token - newCost) > 0.0001
    );
  }

  // Map OpenRouter model to AiModel format
  private static mapOpenRouterModelToAiModel(
    openRouterModel: OpenRouterModel
  ): CreateAiModelRequest {
    const provider = openRouterModel.id.split("/")[0] || "unknown";
    const model_key = openRouterModel.id;

    return {
      provider,
      model_key,
      display_name: openRouterModel.name,
      context_length: openRouterModel.context_length,
      cost_per_1k_token: parseFloat(openRouterModel.pricing.prompt),
      capabilities: {
        reasoning: openRouterModel.architecture.modality.includes("text"),
        coding: openRouterModel.architecture.modality.includes("text"),
        vision: openRouterModel.architecture.modality.includes("image"),
        fast: openRouterModel.top_provider.max_completion_tokens > 0,
      },
      enabled: true,
    };
  }

  static async updateSelection(
    preset: number,
    data: UpdateSelectionRequest
  ): Promise<UserSelectedModels | null> {
    const existing = await selectionQuery.getSelectionByPreset(preset);
    if (!existing) {
      return null;
    }

    // Validate data
    if (data.ai_model_ids !== undefined) {
      if (!Array.isArray(data.ai_model_ids) || data.ai_model_ids.length === 0) {
        throw new Error("ai_model_ids must be a non-empty array");
      }
    }

    return await selectionQuery.updateSelection(preset, data);
  }

  static async deleteSelection(preset: number): Promise<boolean> {
    return await selectionQuery.deleteSelection(preset);
  }

  static async deleteSelectionByUserUUID(user_uuid: string): Promise<boolean> {
    return await selectionQuery.deleteSelectionByUserUUID(user_uuid);
  }

  // Upsert operation - create if doesn't exist, update if exists
  static async upsertSelection(data: CreateSelectionRequest): Promise<UserSelectedModels> {
    return await selectionQuery.createSelection(data);
  }

  // Update preset with model validation
  static async updatePresetWithModels(
    preset: number,
    data: UpdateSelectionRequest & { openrouter_api_key?: string }
  ): Promise<UserSelectedModels | null> {
    const existing = await selectionQuery.getSelectionByPreset(preset);
    if (!existing) {
      return null;
    }

    // If updating models, validate them
    if (data.ai_model_ids && data.openrouter_api_key) {
      const validatedModelIds = await this.validateAndCreateModels(
        data.ai_model_ids,
        data.openrouter_api_key
      );
      data.ai_model_ids = validatedModelIds;
    }

    return await selectionQuery.updateSelection(preset, data);
  }
}
