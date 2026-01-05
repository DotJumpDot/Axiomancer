// AI Store - Svelte 5 runes for AI model state
import { aiService } from "../Service";
import type { AiModel } from "../Types";

// Reactive state using Svelte 5 runes
let models = $state<AiModel[]>([]);
let enabledModels = $state<AiModel[]>([]);
let selectedModel = $state<AiModel | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Auto-routing state
let autoRoutingEnabled = $state(true);
let routingPreferences = $state<{
  preferFast: boolean;
  preferCoding: boolean;
  preferReasoning: boolean;
  preferVision: boolean;
}>({
  preferFast: false,
  preferCoding: false,
  preferReasoning: false,
  preferVision: false,
});

async function loadModels() {
  try {
    isLoading = true;
    error = null;

    const response = await aiService.getAllModels();
    if (response.success && response.data) {
      models = response.data;
      enabledModels = models.filter((m) => m.enabled);

      // Select first enabled model if none selected
      if (!selectedModel && enabledModels.length > 0) {
        selectedModel = enabledModels[0];
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load models";
  } finally {
    isLoading = false;
  }
}

async function loadEnabledModels() {
  try {
    isLoading = true;
    error = null;

    const response = await aiService.getEnabledModels();
    if (response.success && response.data) {
      enabledModels = response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load enabled models";
  } finally {
    isLoading = false;
  }
}

function selectModel(modelId: string) {
  const model = models.find((m) => m.id === modelId) || enabledModels.find((m) => m.id === modelId);
  if (model) {
    selectedModel = model;
    autoRoutingEnabled = false; // Disable auto-routing when manually selecting
  }
}

function selectModelByKey(modelKey: string) {
  const model =
    models.find((m) => m.model_key === modelKey) ||
    enabledModels.find((m) => m.model_key === modelKey);
  if (model) {
    selectedModel = model;
    autoRoutingEnabled = false;
  }
}

function enableAutoRouting() {
  autoRoutingEnabled = true;
}

function disableAutoRouting() {
  autoRoutingEnabled = false;
}

function setRoutingPreferences(prefs: Partial<typeof routingPreferences>) {
  routingPreferences = { ...routingPreferences, ...prefs };
}

// Auto-select best model based on content type
function autoSelectModel(contentType: "code" | "reasoning" | "creative" | "vision" | "general") {
  if (!autoRoutingEnabled) return selectedModel;

  let candidates = enabledModels;

  switch (contentType) {
    case "code":
      candidates = aiService.filterByCapability(enabledModels, "coding");
      break;
    case "reasoning":
      candidates = aiService.filterByCapability(enabledModels, "reasoning");
      break;
    case "vision":
      candidates = aiService.filterByCapability(enabledModels, "vision");
      break;
    case "creative":
    case "general":
    default:
      // Use all enabled models
      break;
  }

  if (candidates.length > 0) {
    // Prefer models matching routing preferences
    if (routingPreferences.preferFast) {
      const fastModels = candidates.filter((m) => m.capabilities.fast);
      if (fastModels.length > 0) candidates = fastModels;
    }

    selectedModel = candidates[0];
  }

  return selectedModel;
}

// Export store object with getters for reactive access
export const aiStore = {
  get models() {
    return models;
  },
  get enabledModels() {
    return enabledModels;
  },
  get selectedModel() {
    return selectedModel;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },
  get autoRoutingEnabled() {
    return autoRoutingEnabled;
  },
  get routingPreferences() {
    return routingPreferences;
  },

  loadModels,
  loadEnabledModels,
  selectModel,
  selectModelByKey,
  enableAutoRouting,
  disableAutoRouting,
  setRoutingPreferences,
  autoSelectModel,
};

export default aiStore;
