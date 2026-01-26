import { Elysia, t } from "elysia";
import * as folderService from "./folder_service";

export const folderApi = new Elysia({
  prefix: "/api/folders",
  tags: ["Folder"],
})
  // * Get all folders for a user
  .get("/:userUuid", async ({ params: { userUuid }, set }) => {
    try {
      const folders = await folderService.getFolders(userUuid);
      return folders;
    } catch (error) {
      console.error("Error loading folders:", error);
      set.status = 500;
      return {
        error:
          error instanceof Error ? error.message : "Failed to load folders",
      };
    }
  })

  // * Create a new folder
  .post(
    "/:userUuid",
    async ({ params: { userUuid }, body }) => {
      const folder = await folderService.createFolder(userUuid, body);
      return folder;
    },
    {
      body: t.Object({
        folder_name: t.String(),
        conversation_ids: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // * Update a folder
  .put(
    "/:userUuid/:folderId",
    async ({ params: { userUuid, folderId }, body }) => {
      const folder = await folderService.updateFolder(folderId, userUuid, body);
      return folder;
    },
    {
      body: t.Object({
        folder_name: t.Optional(t.String()),
        is_collapsed: t.Optional(t.Boolean()),
        position: t.Optional(t.Number()),
      }),
    },
  )

  // * Delete a folder
  .delete(
    "/:userUuid/:folderId",
    async ({ params: { userUuid, folderId } }) => {
      await folderService.deleteFolder(folderId, userUuid);
      return { message: "Folder deleted successfully" };
    },
  )

  // * Add conversation to folder
  .post(
    "/:userUuid/:folderId/conversations",
    async ({ params: { userUuid, folderId }, body }) => {
      const folder = await folderService.addConversationToFolder(
        folderId,
        userUuid,
        body.conversation_id,
      );
      return folder;
    },
    {
      body: t.Object({
        conversation_id: t.String(),
      }),
    },
  )

  // * Remove conversation from folder
  .delete(
    "/:userUuid/:folderId/conversations/:conversationId",
    async ({ params: { userUuid, folderId, conversationId } }) => {
      const folder = await folderService.removeConversationFromFolder(
        folderId,
        userUuid,
        conversationId,
      );
      return folder;
    },
  )

  // * Remove conversation from all folders
  .delete(
    "/:userUuid/conversations/:conversationId",
    async ({ params: { userUuid, conversationId } }) => {
      await folderService.removeConversationFromAllFolders(
        userUuid,
        conversationId,
      );
      return { message: "Conversation removed from all folders" };
    },
  )

  // * Reorder folders
  .put(
    "/:userUuid/reorder",
    async ({ params: { userUuid }, body }) => {
      const folders = await folderService.reorderFolders(
        userUuid,
        body.folder_ids,
      );
      return folders;
    },
    {
      body: t.Object({
        folder_ids: t.Array(t.String()),
      }),
    },
  )

  // * Toggle folder collapsed state
  .post(
    "/:userUuid/:folderId/toggle",
    async ({ params: { userUuid, folderId } }) => {
      const folder = await folderService.toggleFolderCollapsed(
        folderId,
        userUuid,
      );
      return folder;
    },
  );
