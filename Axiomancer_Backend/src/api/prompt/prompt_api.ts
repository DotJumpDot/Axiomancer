import { Elysia } from "elysia";
import { PromptService } from "./prompt_service";
import type { CreatePromptProfileRequest, UpdatePromptProfileRequest } from "./prompt_type";

export const promptApi = new Elysia({ prefix: "/api", tags: ["Prompt"] })
  .get("/prompts", async (context: any) => {
    const { auth } = context;
    try {
      const userUuid = auth?.tokenUser?.uuid;
      const profiles = await PromptService.getAllProfiles(userUuid);
      return { success: true, data: profiles };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .get("/prompt/:id", async ({ params }) => {
    try {
      const profile = await PromptService.getProfileById(params.id);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }
      return { success: true, data: profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .get("/prompt/by-name/:name", async ({ params, ...context }: any) => {
    const { auth } = context;
    try {
      const userUuid = auth?.tokenUser?.uuid;
      const profile = await PromptService.getProfileByName(
        decodeURIComponent(params.name),
        userUuid
      );
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }
      return { success: true, data: profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .post("/prompt/create", async ({ body, ...context }: any) => {
    const { auth } = context;
    try {
      const userUuid = auth?.tokenUser?.uuid;
      const profile = await PromptService.createProfile(
        body as CreatePromptProfileRequest,
        userUuid
      );
      return { success: true, data: profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .put("/prompt/:id", async ({ params, body, ...context }: any) => {
    const { auth } = context;
    try {
      const userUuid = auth?.tokenUser?.uuid;
      const existing = await PromptService.getProfileById(params.id);

      // Check if user owns this profile (unless they're fetching global profile)
      if (existing && existing.user_uuid && existing.user_uuid !== userUuid) {
        return { success: false, error: "Unauthorized" };
      }

      const profile = await PromptService.updateProfile(
        params.id,
        body as UpdatePromptProfileRequest
      );
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }
      return { success: true, data: profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .delete("/prompt/:id", async ({ params, ...context }: any) => {
    const { auth } = context;
    try {
      const userUuid = auth?.tokenUser?.uuid;
      const existing = await PromptService.getProfileById(params.id);

      // Check if user owns this profile (unless they're deleting global profile)
      if (existing && existing.user_uuid && existing.user_uuid !== userUuid) {
        return { success: false, error: "Unauthorized" };
      }

      const deleted = await PromptService.deleteProfile(params.id);
      return { success: true, deleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .post("/prompt/:id/validate", async ({ params }) => {
    try {
      const profile = await PromptService.getProfileById(params.id);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }
      const validation = await PromptService.validatePromptProfile(profile);
      return { success: true, data: validation };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
