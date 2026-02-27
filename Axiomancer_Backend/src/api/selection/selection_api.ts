import { Elysia, t } from "elysia";
import { SelectionService } from "./selection_service";
import type {
  CreateSelectionRequest,
  UpdateSelectionRequest,
  CreatePresetWithModelsRequest,
} from "./selection_type";

export const selectionApi = new Elysia({ prefix: "/api", tags: ["Selection"] })
  // All routes require dual authentication (JWT + API Key)
  // Auth context is set by global middleware in index.ts

  // Get all presets for a user
  .get("/presets/user/:user_uuid", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            error: "Authentication required. Please provide both JWT token and API key.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Verify user can only access their own presets
      if (auth.user.uuid !== params.user_uuid) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized. You can only access your own presets.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const presets = await SelectionService.getSelectionsByUserUUID(params.user_uuid);
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
  .get("/selection/user/:user_uuid", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            error: "Authentication required. Please provide both JWT token and API key.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Verify user can only access their own selection
      if (auth.user.uuid !== params.user_uuid) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized. You can only access your own selection.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const selection = await SelectionService.getSelectionByUserUUID(params.user_uuid);
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
  .get("/selection/:preset", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            error: "Authentication required. Please provide both JWT token and API key.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const presetId = parseInt(params.preset);
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

      // Verify user owns this selection
      if (selection.user_uuid !== auth.user.uuid) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized. You can only access your own selections.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
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
  .get("/selections", async (context: any) => {
    try {
      const { auth } = context;
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            error: "Authentication required. Please provide both JWT token and API key.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

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
    async (context: any) => {
      try {
        const { body, auth } = context;
        if (!auth?.user) {
          return new Response(
            JSON.stringify({
              error: "Authentication required. Please provide both JWT token and API key.",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verify user can only create selections for themselves
        if (body.user_uuid !== auth.user.uuid) {
          return new Response(
            JSON.stringify({
              error: "Unauthorized. You can only create selections for yourself.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

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
    async (context: any) => {
      try {
        const { body, auth } = context;
        if (!auth?.user) {
          return new Response(
            JSON.stringify({
              error: "Authentication required. Please provide both JWT token and API key.",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verify user can only create presets for themselves
        if (body.user_uuid !== auth.user.uuid) {
          return new Response(
            JSON.stringify({
              error: "Unauthorized. You can only create presets for yourself.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

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
    async (context: any) => {
      try {
        const { params, body, auth } = context;
        if (!auth?.user) {
          return new Response(
            JSON.stringify({
              error: "Authentication required. Please provide both JWT token and API key.",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        const presetId = parseInt(params.preset);
        if (isNaN(presetId)) {
          return new Response(JSON.stringify({ error: "Invalid preset ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if user owns this selection
        const existingSelection = await SelectionService.getSelectionByPreset(presetId);
        if (!existingSelection) {
          return new Response(JSON.stringify({ error: "Selection not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (existingSelection.user_uuid !== auth.user.uuid) {
          return new Response(
            JSON.stringify({
              error: "Unauthorized. You can only update your own selections.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const selection = await SelectionService.updateSelection(presetId, body);
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
    async (context: any) => {
      try {
        const { params, body, auth } = context;
        if (!auth?.user) {
          return new Response(
            JSON.stringify({
              error: "Authentication required. Please provide both JWT token and API key.",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        const presetId = parseInt(params.preset);
        if (isNaN(presetId)) {
          return new Response(JSON.stringify({ error: "Invalid preset ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if user owns this preset
        const existingPreset = await SelectionService.getSelectionByPreset(presetId);
        if (!existingPreset) {
          return new Response(JSON.stringify({ error: "Preset not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (existingPreset.user_uuid !== auth.user.uuid) {
          return new Response(
            JSON.stringify({
              error: "Unauthorized. You can only update your own presets.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const preset_result = await SelectionService.updatePresetWithModels(presetId, body);
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
    async (context: any) => {
      try {
        const { body, auth } = context;
        if (!auth?.user) {
          return new Response(
            JSON.stringify({
              error: "Authentication required. Please provide both JWT token and API key.",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verify user can only upsert selections for themselves
        if (body.user_uuid !== auth.user.uuid) {
          return new Response(
            JSON.stringify({
              error: "Unauthorized. You can only upsert selections for yourself.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

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
  .delete("/selection/:preset", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            error: "Authentication required. Please provide both JWT token and API key.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const presetId = parseInt(params.preset);
      if (isNaN(presetId)) {
        return new Response(JSON.stringify({ error: "Invalid preset ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user owns this selection
      const existingSelection = await SelectionService.getSelectionByPreset(presetId);
      if (!existingSelection) {
        return new Response(JSON.stringify({ error: "Selection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (existingSelection.user_uuid !== auth.user.uuid) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized. You can only delete your own selections.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const success = await SelectionService.deleteSelection(presetId);
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
  .delete("/selection/user/:user_uuid", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            error: "Authentication required. Please provide both JWT token and API key.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Verify user can only delete their own selections
      if (params.user_uuid !== auth.user.uuid) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized. You can only delete your own selections.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const success = await SelectionService.deleteSelectionByUserUUID(params.user_uuid);
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
