// Selection Service - handles user selected models management (presets)
import apiClient from "./apiClient";
import type {
  UserSelectedModels,
  CreateSelectionRequest,
  UpdateSelectionRequest,
  CreatePresetRequest,
  UpdatePresetRequest,
} from "@/Types";

const SELECTION_ENDPOINTS = {
  selection: "/api/selection",
  selectionByUser: (userUuid: string) => `/api/selection/user/${userUuid}`,
  selectionByPreset: (preset: number) => `/api/selection/${preset}`,
  selections: "/api/selections",
  upsert: "/api/selection/upsert",
  presets: "/api/preset",
  presetsByUser: (userUuid: string) => `/api/presets/user/${userUuid}`,
  presetById: (preset: number) => `/api/preset/${preset}`,
};

export const selectionService = {
  // Get all presets for a user
  async getPresetsByUserUUID(userUuid: string): Promise<UserSelectedModels[]> {
    const response = await apiClient.get<{ presets: UserSelectedModels[] }>(
      SELECTION_ENDPOINTS.presetsByUser(userUuid)
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch presets");
    }
    return response.data.presets;
  },

  async getSelectionByUserUUID(userUuid: string): Promise<UserSelectedModels> {
    const response = await apiClient.get<{ selection: UserSelectedModels }>(
      SELECTION_ENDPOINTS.selectionByUser(userUuid)
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch selection");
    }
    return response.data.selection;
  },

  async getSelectionByPreset(preset: number): Promise<UserSelectedModels> {
    const response = await apiClient.get<{ selection: UserSelectedModels }>(
      SELECTION_ENDPOINTS.selectionByPreset(preset)
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch selection");
    }
    return response.data.selection;
  },

  async getAllSelections(): Promise<UserSelectedModels[]> {
    const response = await apiClient.get<{ selections: UserSelectedModels[] }>(
      SELECTION_ENDPOINTS.selections
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch selections");
    }
    return response.data.selections;
  },

  async createSelection(data: CreateSelectionRequest): Promise<UserSelectedModels> {
    const response = await apiClient.post<{ selection: UserSelectedModels }>(
      SELECTION_ENDPOINTS.selection,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create selection");
    }
    return response.data.selection;
  },

  // Create preset with model validation
  async createPreset(data: CreatePresetRequest): Promise<UserSelectedModels> {
    const response = await apiClient.post<{ preset: UserSelectedModels }>(
      SELECTION_ENDPOINTS.presets,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create preset");
    }
    return response.data.preset;
  },

  async updateSelection(preset: number, data: UpdateSelectionRequest): Promise<UserSelectedModels> {
    const response = await apiClient.put<{ selection: UserSelectedModels }>(
      SELECTION_ENDPOINTS.selectionByPreset(preset),
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update selection");
    }
    return response.data.selection;
  },

  // Update preset with model validation
  async updatePreset(preset: number, data: UpdatePresetRequest): Promise<UserSelectedModels> {
    const response = await apiClient.put<{ preset: UserSelectedModels }>(
      SELECTION_ENDPOINTS.presetById(preset),
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update preset");
    }
    return response.data.preset;
  },

  async upsertSelection(data: CreateSelectionRequest): Promise<UserSelectedModels> {
    const response = await apiClient.post<{ selection: UserSelectedModels }>(
      SELECTION_ENDPOINTS.upsert,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to upsert selection");
    }
    return response.data.selection;
  },

  async deleteSelection(preset: number): Promise<void> {
    const response = await apiClient.delete<{ success: boolean }>(
      SELECTION_ENDPOINTS.selectionByPreset(preset)
    );
    if (!response.success) {
      throw new Error(response.error || "Failed to delete selection");
    }
  },

  async deleteSelectionByUserUUID(userUuid: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean }>(
      SELECTION_ENDPOINTS.selectionByUser(userUuid)
    );
    if (!response.success) {
      throw new Error(response.error || "Failed to delete selection");
    }
  },
};
