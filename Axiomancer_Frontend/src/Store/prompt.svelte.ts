// Prompt Store - Svelte 5 runes for prompt profile state
import { promptService } from "../Service";
import type {
  PromptProfile,
  CreatePromptProfileRequest,
  UpdatePromptProfileRequest,
} from "../Types";

// Reactive state using Svelte 5 runes
let profiles = $state<PromptProfile[]>([]);
let selectedProfile = $state<PromptProfile | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

async function loadProfiles() {
  try {
    isLoading = true;
    error = null;

    const response = await promptService.getAllProfiles();
    if (response.success && response.data) {
      profiles = response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load profiles";
  } finally {
    isLoading = false;
  }
}

async function createProfile(data: CreatePromptProfileRequest) {
  try {
    isLoading = true;
    error = null;

    const response = await promptService.createProfile(data);
    if (response.success && response.data) {
      profiles = [...profiles, response.data];
      return response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to create profile";
    return null;
  } finally {
    isLoading = false;
  }
}

async function updateProfile(id: string, data: UpdatePromptProfileRequest) {
  try {
    isLoading = true;
    error = null;

    const response = await promptService.updateProfile(id, data);
    if (response.success && response.data) {
      profiles = profiles.map((p) => (p.id === id ? response.data! : p));
      if (selectedProfile?.id === id) {
        selectedProfile = response.data;
      }
      return response.data;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to update profile";
    return null;
  } finally {
    isLoading = false;
  }
}

async function deleteProfile(id: string) {
  try {
    isLoading = true;
    error = null;

    const response = await promptService.deleteProfile(id);
    if (response.success) {
      profiles = profiles.filter((p) => p.id !== id);
      if (selectedProfile?.id === id) {
        selectedProfile = null;
      }
      return true;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to delete profile";
    return false;
  } finally {
    isLoading = false;
  }
}

function selectProfile(profileId: string | null) {
  if (!profileId) {
    selectedProfile = null;
    return;
  }
  const profile = profiles.find((p) => p.id === profileId);
  if (profile) {
    selectedProfile = profile;
  }
}

function getSystemPrompt(): string {
  return selectedProfile?.system_prompt || promptService.getDefaultSystemPrompt();
}

// Export store object with getters for reactive access
export const promptStore = {
  get profiles() {
    return profiles;
  },
  get selectedProfile() {
    return selectedProfile;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  loadProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  selectProfile,
  getSystemPrompt,
};

export default promptStore;
