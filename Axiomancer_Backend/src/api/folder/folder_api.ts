import { Elysia, t } from "elysia";
import * as folderService from "./folder_service";

export const folderApi = new Elysia({
  prefix: "/api/folders",
  tags: ["Folder"],
})
  // All routes require dual authentication (JWT + API Key)
  // Auth context is set by global middleware in index.ts

  // * Get all folders for a user
  .get("/:userUuid", async (context: any) => {
    const { params, auth, set } = context;
    if (!auth?.user) {
      set.status = 401;
      return {
        error: "Authentication required. Please provide both JWT token and API key.",
      };
    }

    // Verify user can only access their own folders
    if (auth.user.uuid !== params.userUuid) {
      set.status = 403;
      return {
        error: "Unauthorized. You can only access your own folders.",
      };
    }

    try {
      const folders = await folderService.getFolders(params.userUuid);
      return folders;
    } catch (error) {
      console.error("Error loading folders:", error);
      set.status = 500;
      return {
        error: error instanceof Error ? error.message : "Failed to load folders",
      };
    }
  })

  // * Create a new folder
  .post(
    "/:userUuid",
    async (context: any) => {
      const { params, body, auth, set } = context;
      if (!auth?.user) {
        set.status = 401;
        return {
          error: "Authentication required. Please provide both JWT token and API key.",
        };
      }

      // Verify user can only create folders for themselves
      if (auth.user.uuid !== params.userUuid) {
        set.status = 403;
        return {
          error: "Unauthorized. You can only create folders for yourself.",
        };
      }

      const folder = await folderService.createFolder(params.userUuid, body);
      return folder;
    },
    {
      body: t.Object({
        folder_name: t.String(),
        conversation_ids: t.Optional(t.Array(t.String())),
      }),
    }
  )

  // * Update a folder
  .put(
    "/:userUuid/:folderId",
    async (context: any) => {
      const { params, body, auth, set } = context;
      if (!auth?.user) {
        set.status = 401;
        return {
          error: "Authentication required. Please provide both JWT token and API key.",
        };
      }

      // Verify user can only update their own folders
      if (auth.user.uuid !== params.userUuid) {
        set.status = 403;
        return {
          error: "Unauthorized. You can only update your own folders.",
        };
      }

      const folder = await folderService.updateFolder(params.folderId, params.userUuid, body);
      return folder;
    },
    {
      body: t.Object({
        folder_name: t.Optional(t.String()),
        is_collapsed: t.Optional(t.Boolean()),
        position: t.Optional(t.Number()),
      }),
    }
  )

  // * Delete a folder
  .delete("/:userUuid/:folderId", async (context: any) => {
    const { params, auth, set } = context;
    if (!auth?.user) {
      set.status = 401;
      return {
        error: "Authentication required. Please provide both JWT token and API key.",
      };
    }

    // Verify user can only delete their own folders
    if (auth.user.uuid !== params.userUuid) {
      set.status = 403;
      return {
        error: "Unauthorized. You can only delete your own folders.",
      };
    }

    await folderService.deleteFolder(params.folderId, params.userUuid);
    return { message: "Folder deleted successfully" };
  })

  // * Add conversation to folder
  .post(
    "/:userUuid/:folderId/conversations",
    async (context: any) => {
      const { params, body, auth, set } = context;
      if (!auth?.user) {
        set.status = 401;
        return {
          error: "Authentication required. Please provide both JWT token and API key.",
        };
      }

      // Verify user can only modify their own folders
      if (auth.user.uuid !== params.userUuid) {
        set.status = 403;
        return {
          error: "Unauthorized. You can only modify your own folders.",
        };
      }

      const folder = await folderService.addConversationToFolder(
        params.folderId,
        params.userUuid,
        body.conversation_id
      );
      return folder;
    },
    {
      body: t.Object({
        conversation_id: t.String(),
      }),
    }
  )

  // * Remove conversation from folder
  .delete("/:userUuid/:folderId/conversations/:conversationId", async (context: any) => {
    const { params, auth, set } = context;
    if (!auth?.user) {
      set.status = 401;
      return {
        error: "Authentication required. Please provide both JWT token and API key.",
      };
    }

    // Verify user can only modify their own folders
    if (auth.user.uuid !== params.userUuid) {
      set.status = 403;
      return {
        error: "Unauthorized. You can only modify your own folders.",
      };
    }

    const folder = await folderService.removeConversationFromFolder(
      params.folderId,
      params.userUuid,
      params.conversationId
    );
    return folder;
  })

  // * Remove conversation from all folders
  .delete("/:userUuid/conversations/:conversationId", async (context: any) => {
    const { params, auth, set } = context;
    if (!auth?.user) {
      set.status = 401;
      return {
        error: "Authentication required. Please provide both JWT token and API key.",
      };
    }

    // Verify user can only modify their own folders
    if (auth.user.uuid !== params.userUuid) {
      set.status = 403;
      return {
        error: "Unauthorized. You can only modify your own folders.",
      };
    }

    await folderService.removeConversationFromAllFolders(params.userUuid, params.conversationId);
    return { message: "Conversation removed from all folders" };
  })

  // * Reorder folders
  .put(
    "/:userUuid/reorder",
    async (context: any) => {
      const { params, body, auth, set } = context;
      if (!auth?.user) {
        set.status = 401;
        return {
          error: "Authentication required. Please provide both JWT token and API key.",
        };
      }

      // Verify user can only reorder their own folders
      if (auth.user.uuid !== params.userUuid) {
        set.status = 403;
        return {
          error: "Unauthorized. You can only reorder your own folders.",
        };
      }

      const folders = await folderService.reorderFolders(params.userUuid, body.folder_ids);
      return folders;
    },
    {
      body: t.Object({
        folder_ids: t.Array(t.String()),
      }),
    }
  )

  // * Toggle folder collapsed state
  .post("/:userUuid/:folderId/toggle", async (context: any) => {
    const { params, auth, set } = context;
    if (!auth?.user) {
      set.status = 401;
      return {
        error: "Authentication required. Please provide both JWT token and API key.",
      };
    }

    // Verify user can only toggle their own folders
    if (auth.user.uuid !== params.userUuid) {
      set.status = 403;
      return {
        error: "Unauthorized. You can only toggle your own folders.",
      };
    }

    const folder = await folderService.toggleFolderCollapsed(params.folderId, params.userUuid);
    return folder;
  });
