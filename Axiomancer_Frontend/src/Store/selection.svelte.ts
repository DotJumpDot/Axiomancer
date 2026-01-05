// Selection Store - Svelte 5 runes for user selected models state
import { selectionService } from "../Service";
import type { UserSelectedModels } from "../Types";

// Reactive state using Svelte 5 runes
let selection = $state<UserSelectedModels | null>(null);
let selections = $state<UserSelectedModels[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

async function loadSelectionByUserUUID(userUuid: string) {
  try {
    isLoading = true;
    error = null;

    const response = await selectionService.getSelectionByUserUUID(userUuid);
    if (response.success && response.data) {
      selection = response.data;
    } else {
      selection = null;
    }
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

    const response = await selectionService.getSelectionByPreset(preset);
    if (response.success && response.data) {
      selection = response.data;
    } else {
      selection = null;
    }
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

    const response = await selectionService.getAllSelections();
    if (response.success && response.data) {
      selections = response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load selections";
  } finally {
    isLoading = false;
  }
}

async function createSelection(userUuid: string, aiModelIds: string[], searchable = true) {
  try {
    isLoading = true;
    error = null;

    const response = await selectionService.createSelection({
      user_uuid: userUuid,
      ai_model_ids: aiModelIds,
      searchable,
    });

    if (response.success && response.data) {
      selection = response.data;
      return response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to create selection";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function updateSelection(preset: number, aiModelIds?: string[], searchable?: boolean) {
  try {
    isLoading = true;
    error = null;

    const response = await selectionService.updateSelection(preset, {
      ai_model_ids: aiModelIds,
      searchable,
    });

    if (response.success && response.data) {
      selection = response.data;
      return response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to update selection";
    throw e;
  } finally {
    isLoading = false;
  }
}

async function upsertSelection(userUuid: string, aiModelIds: string[], searchable = true) {
  try {
    isLoading = true;
    error = null;

    const response = await selectionService.upsertSelection({
      user_uuid: userUuid,
      ai_model_ids: aiModelIds,
      searchable,
    });

    if (response.success && response.data) {
      selection = response.data;
      return response.data;
    }
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

    const response = await selectionService.deleteSelection(preset);
    if (response.success) {
      selection = null;
      return true;
    }
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

    const response = await selectionService.deleteSelectionByUserUUID(userUuid);
    if (response.success) {
      selection = null;
      return true;
    }
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
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  // Methods
  loadSelectionByUserUUID,
  loadSelectionByPreset,
  loadAllSelections,
  createSelection,
  updateSelection,
  upsertSelection,
  deleteSelection,
  deleteSelectionByUserUUID,
  clearError,
  resetSelection,
};
