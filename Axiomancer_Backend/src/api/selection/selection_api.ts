import { Elysia, t } from "elysia";
import { SelectionService } from "./selection_service";
import type {
  CreateSelectionRequest,
  UpdateSelectionRequest,
  CreatePresetWithModelsRequest,
} from "./selection_type";

export const selectionApi = new Elysia({ prefix: "/api", tags: ["Selection"] })
  // Get all presets for a user
  .get("/presets/user/:user_uuid", async ({ params: { user_uuid } }) => {
    try {
      const presets = await SelectionService.getSelectionsByUserUUID(user_uuid);
      return { presets };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to get presets",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  // Get selection by user UUID (backwards compatibility - returns first preset)
  .get("/selection/user/:user_uuid", async ({ params: { user_uuid } }) => {
    try {
      const selection = await SelectionService.getSelectionByUserUUID(user_uuid);
      if (!selection) {
        return new Response(JSON.stringify({ error: "Selection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return { selection };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to get selection",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  // Get selection by preset ID
  .get("/selection/:preset", async ({ params: { preset } }) => {
    try {
      const presetId = parseInt(preset);
      if (isNaN(presetId)) {
        return new Response(JSON.stringify({ error: "Invalid preset ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const selection = await SelectionService.getSelectionByPreset(presetId);
      if (!selection) {
        return new Response(JSON.stringify({ error: "Selection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return { selection };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to get selection",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  // Get all selections
  .get("/selections", async () => {
    try {
      const selections = await SelectionService.getAllSelections();
      return { selections };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to get selections",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  // Create selection
  .post(
    "/selection",
    async ({ body }: { body: CreateSelectionRequest }) => {
      try {
        const selection = await SelectionService.createSelection(body);
        return { selection, status: 201 };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to create selection",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        user_uuid: t.String(),
        ai_model_ids: t.Array(t.String()),
        prompt_id: t.Optional(t.String()),
        preset_name: t.Optional(t.String()),
        searchable: t.Optional(t.Boolean()),
      }),
    }
  )

  // Create preset with model validation
  .post(
    "/preset",
    async ({ body }: { body: CreatePresetWithModelsRequest }) => {
      try {
        const preset = await SelectionService.createPresetWithModels(body);
        return { preset, status: 201 };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to create preset",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        user_uuid: t.String(),
        ai_model_ids: t.Array(t.String()),
        prompt_id: t.Optional(t.String()),
        preset_name: t.Optional(t.String()),
        searchable: t.Optional(t.Boolean()),
        openrouter_api_key: t.String(),
      }),
    }
  )

  // Update selection
  .put(
    "/selection/:preset",
    async ({
      params: { preset },
      body,
    }: {
      params: { preset: string };
      body: UpdateSelectionRequest;
    }) => {
      try {
        const presetId = parseInt(preset);
        if (isNaN(presetId)) {
          return new Response(JSON.stringify({ error: "Invalid preset ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const selection = await SelectionService.updateSelection(presetId, body);
        if (!selection) {
          return new Response(JSON.stringify({ error: "Selection not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return { selection };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to update selection",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        ai_model_ids: t.Optional(t.Array(t.String())),
        prompt_id: t.Optional(t.String()),
        preset_name: t.Optional(t.String()),
        searchable: t.Optional(t.Boolean()),
      }),
    }
  )

  // Update preset with model validation
  .put(
    "/preset/:preset",
    async ({
      params: { preset },
      body,
    }: {
      params: { preset: string };
      body: UpdateSelectionRequest & { openrouter_api_key?: string };
    }) => {
      try {
        const presetId = parseInt(preset);
        if (isNaN(presetId)) {
          return new Response(JSON.stringify({ error: "Invalid preset ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const preset_result = await SelectionService.updatePresetWithModels(presetId, body);
        if (!preset_result) {
          return new Response(JSON.stringify({ error: "Preset not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return { preset: preset_result };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to update preset",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        ai_model_ids: t.Optional(t.Array(t.String())),
        prompt_id: t.Optional(t.String()),
        preset_name: t.Optional(t.String()),
        searchable: t.Optional(t.Boolean()),
        openrouter_api_key: t.Optional(t.String()),
      }),
    }
  )

  // Upsert selection (create or update)
  .post(
    "/selection/upsert",
    async ({ body }: { body: CreateSelectionRequest }) => {
      try {
        const selection = await SelectionService.upsertSelection(body);
        return { selection };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to upsert selection",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        user_uuid: t.String(),
        ai_model_ids: t.Array(t.String()),
        prompt_id: t.Optional(t.String()),
        preset_name: t.Optional(t.String()),
        searchable: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete selection by preset
  .delete("/selection/:preset", async ({ params: { preset } }) => {
    try {
      const presetId = parseInt(preset);
      if (isNaN(presetId)) {
        return new Response(JSON.stringify({ error: "Invalid preset ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const success = await SelectionService.deleteSelection(presetId);
      if (!success) {
        return new Response(JSON.stringify({ error: "Selection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return { success: true };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to delete selection",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  // Delete selection by user UUID
  .delete("/selection/user/:user_uuid", async ({ params: { user_uuid } }) => {
    try {
      const success = await SelectionService.deleteSelectionByUserUUID(user_uuid);
      if (!success) {
        return new Response(JSON.stringify({ error: "Selection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return { success: true };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to delete selection",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
