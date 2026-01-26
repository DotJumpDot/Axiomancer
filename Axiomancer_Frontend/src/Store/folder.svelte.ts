import type {
  UserConversationFolder,
  CreateFolderRequest,
  UpdateFolderRequest,
} from "@/Types";
import { folderService } from "@/Service";

interface FolderStore {
  folders: UserConversationFolder[];
  isLoading: boolean;
  error: string | null;

  // Methods
  loadFolders: (userUuid: string) => Promise<void>;
  createFolder: (
    userUuid: string,
    data: CreateFolderRequest,
  ) => Promise<UserConversationFolder>;
  updateFolder: (
    userUuid: string,
    folderId: string,
    data: UpdateFolderRequest,
  ) => Promise<UserConversationFolder>;
  deleteFolder: (userUuid: string, folderId: string) => Promise<void>;
  addConversationToFolder: (
    userUuid: string,
    folderId: string,
    conversationId: string,
  ) => Promise<void>;
  removeConversationFromFolder: (
    userUuid: string,
    folderId: string,
    conversationId: string,
  ) => Promise<void>;
  removeConversationFromAllFolders: (
    userUuid: string,
    conversationId: string,
  ) => Promise<void>;
  reorderFolders: (userUuid: string, folderIds: string[]) => Promise<void>;
  toggleFolderCollapsed: (userUuid: string, folderId: string) => Promise<void>;
  getFolderForConversation: (
    conversationId: string,
  ) => UserConversationFolder | null;
  isConversationInFolder: (conversationId: string) => boolean;
  reset: () => void;
}

function createFolderStore(): FolderStore {
  let folders = $state<UserConversationFolder[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  return {
    get folders() {
      return folders;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },

    // * Load all folders for user
    async loadFolders(userUuid: string) {
      isLoading = true;
      error = null;
      try {
        folders = await folderService.getFolders(userUuid);
      } catch (err) {
        // Silently handle errors - folders are optional
        // This allows the app to work even if the folder table doesn't exist
        folders = [];
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load folders";
        // Only log if it's not a "table doesn't exist" type error
        if (
          !errorMessage.includes("does not exist") &&
          !errorMessage.includes("relation")
        ) {
          console.warn("Folders unavailable:", errorMessage);
        }
      } finally {
        isLoading = false;
      }
    },

    // * Create a new folder
    async createFolder(userUuid: string, data: CreateFolderRequest) {
      error = null;
      try {
        const newFolder = await folderService.createFolder(userUuid, data);
        folders = [...folders, newFolder];
        return newFolder;
      } catch (err) {
        error = err instanceof Error ? err.message : "Failed to create folder";
        console.error("Failed to create folder:", err);
        throw err;
      }
    },

    // * Update a folder
    async updateFolder(
      userUuid: string,
      folderId: string,
      data: UpdateFolderRequest,
    ) {
      error = null;
      try {
        const updatedFolder = await folderService.updateFolder(
          userUuid,
          folderId,
          data,
        );
        folders = folders.map((f) => (f.id === folderId ? updatedFolder : f));
        return updatedFolder;
      } catch (err) {
        error = err instanceof Error ? err.message : "Failed to update folder";
        console.error("Failed to update folder:", err);
        throw err;
      }
    },

    // * Delete a folder
    async deleteFolder(userUuid: string, folderId: string) {
      error = null;
      try {
        await folderService.deleteFolder(userUuid, folderId);
        folders = folders.filter((f) => f.id !== folderId);
      } catch (err) {
        error = err instanceof Error ? err.message : "Failed to delete folder";
        console.error("Failed to delete folder:", err);
        throw err;
      }
    },

    // * Add conversation to a folder
    async addConversationToFolder(
      userUuid: string,
      folderId: string,
      conversationId: string,
    ) {
      error = null;
      try {
        const updatedFolder = await folderService.addConversationToFolder(
          userUuid,
          folderId,
          {
            conversation_id: conversationId,
          },
        );
        // Update all folders (remove from others, add to target)
        folders = folders.map((f) => {
          if (f.id === folderId) {
            return updatedFolder;
          }
          // Remove from other folders
          if (f.conversation_ids.includes(conversationId)) {
            return {
              ...f,
              conversation_ids: f.conversation_ids.filter(
                (id) => id !== conversationId,
              ),
            };
          }
          return f;
        });
      } catch (err) {
        error =
          err instanceof Error
            ? err.message
            : "Failed to add conversation to folder";
        console.error("Failed to add conversation to folder:", err);
        throw err;
      }
    },

    // * Remove conversation from a folder
    async removeConversationFromFolder(
      userUuid: string,
      folderId: string,
      conversationId: string,
    ) {
      error = null;
      try {
        const updatedFolder = await folderService.removeConversationFromFolder(
          userUuid,
          folderId,
          conversationId,
        );
        folders = folders.map((f) => (f.id === folderId ? updatedFolder : f));
      } catch (err) {
        error =
          err instanceof Error
            ? err.message
            : "Failed to remove conversation from folder";
        console.error("Failed to remove conversation from folder:", err);
        throw err;
      }
    },

    // * Remove conversation from all folders
    async removeConversationFromAllFolders(
      userUuid: string,
      conversationId: string,
    ) {
      error = null;
      try {
        await folderService.removeConversationFromAllFolders(
          userUuid,
          conversationId,
        );
        // Update local state - remove from all folders
        folders = folders.map((f) => ({
          ...f,
          conversation_ids: f.conversation_ids.filter(
            (id) => id !== conversationId,
          ),
        }));
      } catch (err) {
        error =
          err instanceof Error
            ? err.message
            : "Failed to remove conversation from all folders";
        console.error("Failed to remove conversation from all folders:", err);
        throw err;
      }
    },

    // * Reorder folders
    async reorderFolders(userUuid: string, folderIds: string[]) {
      error = null;
      try {
        const reorderedFolders = await folderService.reorderFolders(userUuid, {
          folder_ids: folderIds,
        });
        folders = reorderedFolders;
      } catch (err) {
        error =
          err instanceof Error ? err.message : "Failed to reorder folders";
        console.error("Failed to reorder folders:", err);
        throw err;
      }
    },

    // * Toggle folder collapsed state
    async toggleFolderCollapsed(userUuid: string, folderId: string) {
      error = null;
      try {
        const updatedFolder = await folderService.toggleFolderCollapsed(
          userUuid,
          folderId,
        );
        folders = folders.map((f) => (f.id === folderId ? updatedFolder : f));
      } catch (err) {
        error =
          err instanceof Error
            ? err.message
            : "Failed to toggle folder collapsed";
        console.error("Failed to toggle folder collapsed:", err);
        throw err;
      }
    },

    // * Get folder that contains a conversation
    getFolderForConversation(
      conversationId: string,
    ): UserConversationFolder | null {
      return (
        folders.find((f) => f.conversation_ids.includes(conversationId)) || null
      );
    },

    // * Check if conversation is in any folder
    isConversationInFolder(conversationId: string): boolean {
      return folders.some((f) => f.conversation_ids.includes(conversationId));
    },

    // * Reset store
    reset() {
      folders = [];
      isLoading = false;
      error = null;
    },
  };
}

export const folderStore = createFolderStore();
