import { Elysia } from "elysia";
import { PromptService } from "./prompt_service";
import type { CreatePromptProfileRequest, UpdatePromptProfileRequest } from "./prompt_type";

export const promptApi = new Elysia({ prefix: "/api", tags: ["Prompt"] })
  // All routes require dual authentication (JWT + API Key)
  // Auth context is set by global middleware in index.ts

  .get("/prompts", async (context: any) => {
    try {
      const { auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const profiles = await PromptService.getAllPromptProfiles();
      return { success: true, data: profiles };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .get("/prompts/user/:user_uuid", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const profiles = await PromptService.getAllProfiles(params.user_uuid);
      return { success: true, data: profiles };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .get("/prompt/:id", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

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

  .get("/prompt/by-name/:name", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const userUuid = auth?.user?.uuid;
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

  .post("/prompt/create", async (context: any) => {
    try {
      const { body, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const userUuid = auth?.user?.uuid;
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

  .post("/prompts/user/:user_uuid", async (context: any) => {
    try {
      const { params, body, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const profile = await PromptService.createProfile(
        body as CreatePromptProfileRequest,
        params.user_uuid
      );
      return { success: true, data: profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .put("/prompt/:id", async (context: any) => {
    try {
      const { params, body, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const userUuid = auth?.user?.uuid;
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

  .delete("/prompt/:id", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const userUuid = auth?.user?.uuid;
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

  .post("/prompt/:id/validate", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

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
