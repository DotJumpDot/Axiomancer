import { Elysia } from "elysia";
import { AiService } from "./ai_service";
import type { CreateAiModelRequest, UpdateAiModelRequest } from "./ai_type";

export const aiApi = new Elysia({ prefix: "/api", tags: ["AI"] })
  // AI Models routes
  .get("/ai/models", async () => {
    try {
      const models = await AiService.getAllModels();
      return { success: true, data: models };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .get("/ai/models/enabled", async () => {
    try {
      const models = await AiService.getEnabledModels();
      return { success: true, data: models };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .get("/ai/models/:id", async ({ params }) => {
    try {
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
  .post("/ai/models", async ({ body }) => {
    try {
      const model = await AiService.createModel(body as CreateAiModelRequest);
      return { success: true, data: model };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .put("/ai/models/:id", async ({ params, body }) => {
    try {
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
  .delete("/ai/models/:id", async ({ params }) => {
    try {
      const deleted = await AiService.deleteModel(params.id);
      return { success: true, deleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
