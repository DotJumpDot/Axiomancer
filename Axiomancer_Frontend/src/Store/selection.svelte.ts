// Selection Store - Svelte 5 runes for user selected models (presets) state
import { selectionService } from "@/Service";
import type { UserSelectedModels, CreatePresetRequest, UpdatePresetRequest } from "@/Types";

// Reactive state using Svelte 5 runes
let selection = $state<UserSelectedModels | null>(null);
let selections = $state<UserSelectedModels[]>([]);
let presets = $state<UserSelectedModels[]>([]); // User's presets
let isLoading = $state(false);
let error = $state<string | null>(null);

async function loadPresetsByUserUUID(userUuid: string) {
  try {
    isLoading = true;
    error = null;
    presets = await selectionService.getPresetsByUserUUID(userUuid);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load presets";
    presets = [];
  } finally {
    isLoading = false;
  }
}

async function loadSelectionByUserUUID(userUuid: string) {
  try {
    isLoading = true;
    error = null;
    selection = await selectionService.getSelectionByUserUUID(userUuid);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load selection";
    selection = null;
  } finally {
    isLoading = false;
  }
}

async function loadSelectionByPreset(preset: number) {
  try {
    isLoading = true;
    error = null;
    selection = await selectionService.getSelectionByPreset(preset);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load selection";
    selection = null;
  } finally {
    isLoading = false;
  }
}

async function loadAllSelections() {
  try {
    isLoading = true;
    error = null;
    selections = await selectionService.getAllSelections();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load selections";
    selections = [];
  } finally {
    isLoading = false;
  }
}

async function createSelection(userUuid: string, aiModelIds: string[], promptId?: string, searchable = true) {
  try {
    isLoading = true;
    error = null;
    selection = await selectionService.createSelection({
      user_uuid: userUuid,
      ai_model_ids: aiModelIds,
      prompt_id: promptId,
      searchable,
    });
    return selection;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to create selection";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function createPreset(data: CreatePresetRequest) {
  try {
    isLoading = true;
    error = null;
    const preset = await selectionService.createPreset(data);
    // Reload presets after creating
    if (data.user_uuid) {
      await loadPresetsByUserUUID(data.user_uuid);
    }
    return preset;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to create preset";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function updateSelection(preset: number, aiModelIds?: string[], promptId?: string, searchable?: boolean) {
  try {
    isLoading = true;
    error = null;
    selection = await selectionService.updateSelection(preset, {
      ai_model_ids: aiModelIds,
      prompt_id: promptId,
      searchable,
    });
    return selection;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to update selection";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function updatePreset(preset: number, data: UpdatePresetRequest, userUuid?: string) {
  try {
    isLoading = true;
    error = null;
    const updatedPreset = await selectionService.updatePreset(preset, data);
    // Reload presets after updating
    if (userUuid) {
      await loadPresetsByUserUUID(userUuid);
    }
    return updatedPreset;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to update preset";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function upsertSelection(userUuid: string, aiModelIds: string[], promptId?: string, searchable = true) {
  try {
    isLoading = true;
    error = null;
    selection = await selectionService.upsertSelection({
      user_uuid: userUuid,
      ai_model_ids: aiModelIds,
      prompt_id: promptId,
      searchable,
    });
    return selection;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to upsert selection";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function deleteSelection(preset: number) {
  try {
    isLoading = true;
    error = null;
    await selectionService.deleteSelection(preset);
    selection = null;
    return true;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to delete selection";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function deleteSelectionByUserUUID(userUuid: string) {
  try {
    isLoading = true;
    error = null;
    await selectionService.deleteSelectionByUserUUID(userUuid);
    selection = null;
    return true;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to delete selection";
    throw e;
  } finally {
    isLoading = false;
  }
}

function clearError() {
  error = null;
}

function resetSelection() {
  selection = null;
  selections = [];
  presets = [];
  error = null;
}

// Export store state and functions
export const selectionStore = {
  // State
  get selection() {
    return selection;
  },
  get selections() {
    return selections;
  },
  get presets() {
    return presets;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  // Methods
  loadPresetsByUserUUID,
  loadSelectionByUserUUID,
  loadSelectionByPreset,
  loadAllSelections,
  createSelection,
  createPreset,
  updateSelection,
  updatePreset,
  upsertSelection,
  deleteSelection,
  deleteSelectionByUserUUID,
  clearError,
  resetSelection,
};
