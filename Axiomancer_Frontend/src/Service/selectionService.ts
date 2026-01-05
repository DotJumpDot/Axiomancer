// Selection Service - handles user selected models management
import apiClient from "./apiClient";
import type { UserSelectedModels, CreateSelectionRequest, UpdateSelectionRequest } from "../Types";

const SELECTION_ENDPOINTS = {
  selection: "/api/selection",
  selectionByUser: (userUuid: string) => `/api/selection/user/${userUuid}`,
  selectionByPreset: (preset: number) => `/api/selection/${preset}`,
  selections: "/api/selections",
  upsert: "/api/selection/upsert",
};

export const selectionService = {
  async getSelectionByUserUUID(userUuid: string) {
    return apiClient.get<UserSelectedModels>(SELECTION_ENDPOINTS.selectionByUser(userUuid));
  },

  async getSelectionByPreset(preset: number) {
    return apiClient.get<UserSelectedModels>(SELECTION_ENDPOINTS.selectionByPreset(preset));
  },

  async getAllSelections() {
    return apiClient.get<UserSelectedModels[]>(SELECTION_ENDPOINTS.selections);
  },

  async createSelection(data: CreateSelectionRequest) {
    return apiClient.post<UserSelectedModels>(SELECTION_ENDPOINTS.selection, data);
  },

  async updateSelection(preset: number, data: UpdateSelectionRequest) {
    return apiClient.put<UserSelectedModels>(SELECTION_ENDPOINTS.selectionByPreset(preset), data);
  },

  async upsertSelection(data: CreateSelectionRequest) {
    return apiClient.post<UserSelectedModels>(SELECTION_ENDPOINTS.upsert, data);
  },

  async deleteSelection(preset: number) {
    return apiClient.delete<{ success: boolean }>(SELECTION_ENDPOINTS.selectionByPreset(preset));
  },

  async deleteSelectionByUserUUID(userUuid: string) {
    return apiClient.delete<{ success: boolean }>(SELECTION_ENDPOINTS.selectionByUser(userUuid));
  },
};
