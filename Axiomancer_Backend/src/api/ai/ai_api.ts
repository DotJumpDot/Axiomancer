import { Elysia } from "elysia";
import { AiService } from "./ai_service";
import type { CreateAiModelRequest, UpdateAiModelRequest } from "./ai_type";

export const aiApi = new Elysia({ prefix: "/api", tags: ["AI"] })
  // AI Models routes - all require dual authentication (JWT + API Key)
  // Auth context is set by global middleware in index.ts

  .get("/ai/models", async (context: any) => {
    try {
      const { auth } = context;
      // Check authentication
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const models = await AiService.getAllModels();
      return { success: true, data: models };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .get("/ai/models/enabled", async (context: any) => {
    try {
      const { auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const models = await AiService.getEnabledModels();
      return { success: true, data: models };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .get("/ai/models/:id", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const model = await AiService.getModelById(params.id);
      if (!model) {
        return { success: false, error: "Model not found" };
      }
      return { success: true, data: model };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .post("/ai/models", async (context: any) => {
    try {
      const { body, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const model = await AiService.createModel(body as CreateAiModelRequest);
      return { success: true, data: model };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .put("/ai/models/:id", async (context: any) => {
    try {
      const { params, body, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const model = await AiService.updateModel(params.id, body as UpdateAiModelRequest);
      if (!model) {
        return { success: false, error: "Model not found" };
      }
      return { success: true, data: model };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  .delete("/ai/models/:id", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const deleted = await AiService.deleteModel(params.id);
      return { success: true, deleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
