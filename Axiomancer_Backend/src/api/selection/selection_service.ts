import * as selectionQuery from "./selection_query";
import type {
  UserSelectedModels,
  CreateSelectionRequest,
  UpdateSelectionRequest,
} from "./selection_type";

export class SelectionService {
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

    // Check if selection already exists for this user
    const existing = await selectionQuery.getSelectionByUserUUID(data.user_uuid);
    if (existing) {
      throw new Error("Selection already exists for this user. Use update instead.");
    }

    return await selectionQuery.createSelection(data);
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
    const existing = await selectionQuery.getSelectionByUserUUID(data.user_uuid);

    if (existing) {
      const updated = await selectionQuery.updateSelection(existing.preset, {
        ai_model_ids: data.ai_model_ids,
        searchable: data.searchable,
      });
      if (!updated) {
        throw new Error("Failed to update selection");
      }
      return updated;
    }

    return await selectionQuery.createSelection(data);
  }
}
