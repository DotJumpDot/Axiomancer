import * as promptQuery from "./prompt_query";
import type {
  PromptProfile,
  CreatePromptProfileRequest,
  UpdatePromptProfileRequest,
} from "./prompt_type";

export class PromptService {
  static async getAllProfiles(userUuid?: string): Promise<PromptProfile[]> {
    return await promptQuery.getPromptProfiles(userUuid);
  }

  static async getProfileById(id: string): Promise<PromptProfile | null> {
    return await promptQuery.getPromptProfileById(id);
  }

  static async createProfile(
    data: CreatePromptProfileRequest,
    userUuid?: string
  ): Promise<PromptProfile> {
    // Validate data
    if (!data.name || !data.system_prompt) {
      throw new Error("Name and system_prompt are required");
    }
    if (!data.name.trim()) {
      throw new Error("Name cannot be empty");
    }
    if (!data.system_prompt.trim()) {
      throw new Error("System prompt cannot be empty");
    }

    return await promptQuery.createPromptProfile(data, userUuid);
  }

  static async updateProfile(
    id: string,
    data: UpdatePromptProfileRequest
  ): Promise<PromptProfile | null> {
    const existing = await promptQuery.getPromptProfileById(id);
    if (!existing) {
      return null;
    }

    // Validate data
    if (data.name !== undefined && !data.name.trim()) {
      throw new Error("Name cannot be empty");
    }
    if (data.system_prompt !== undefined && !data.system_prompt.trim()) {
      throw new Error("System prompt cannot be empty");
    }

    return await promptQuery.updatePromptProfile(id, data);
  }

  static async deleteProfile(id: string): Promise<boolean> {
    return await promptQuery.deletePromptProfile(id);
  }

  // Additional utility methods
  static async getProfileByName(name: string, userUuid?: string): Promise<PromptProfile | null> {
    const profiles = await promptQuery.getPromptProfiles(userUuid);
    return profiles.find((profile) => profile.name === name) || null;
  }

  static async validatePromptProfile(
    profile: PromptProfile
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!profile.name || !profile.name.trim()) {
      errors.push("Name is required");
    }
    if (!profile.system_prompt || !profile.system_prompt.trim()) {
      errors.push("System prompt is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
