import { apiClient } from "./apiClient";
import type {
  UserConversationFolder,
  CreateFolderRequest,
  UpdateFolderRequest,
  AddConversationToFolderRequest,
  ReorderFoldersRequest,
} from "@/Types";

class FolderService {
  // * Helper to extract error message
  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "string") return error;
    if (error === null || error === undefined) return fallback;
    if (typeof error === "object") {
      if (
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        return (error as { message: string }).message;
      }
      try {
        return JSON.stringify(error);
      } catch {
        return fallback;
      }
    }
    return String(error);
  }

  // * Get all folders for a user
  async getFolders(userUuid: string): Promise<UserConversationFolder[]> {
    const response = await apiClient.get<UserConversationFolder[]>(
      `/api/folders/${userUuid}`,
    );
    if (!response.success) {
      throw new Error(
        this.getErrorMessage(response.error, "Failed to fetch folders"),
      );
    }
    return response.data || [];
  }

  // * Create a new folder
  async createFolder(
    userUuid: string,
    data: CreateFolderRequest,
  ): Promise<UserConversationFolder> {
    const response = await apiClient.post<UserConversationFolder>(
      `/api/folders/${userUuid}`,
      data,
    );
    if (!response.success || !response.data) {
      throw new Error(
        this.getErrorMessage(response.error, "Failed to create folder"),
      );
    }
    return response.data;
  }

  // * Update a folder
  async updateFolder(
    userUuid: string,
    folderId: string,
    data: UpdateFolderRequest,
  ): Promise<UserConversationFolder> {
    const response = await apiClient.put<UserConversationFolder>(
      `/api/folders/${userUuid}/${folderId}`,
      data,
    );
    if (!response.success || !response.data) {
      throw new Error(
        this.getErrorMessage(response.error, "Failed to update folder"),
      );
    }
    return response.data;
  }

  // * Delete a folder
  async deleteFolder(userUuid: string, folderId: string): Promise<void> {
    const response = await apiClient.delete(
      `/api/folders/${userUuid}/${folderId}`,
    );
    if (!response.success) {
      throw new Error(
        this.getErrorMessage(response.error, "Failed to delete folder"),
      );
    }
  }

  // * Add conversation to folder
  async addConversationToFolder(
    userUuid: string,
    folderId: string,
    data: AddConversationToFolderRequest,
  ): Promise<UserConversationFolder> {
    const response = await apiClient.post<UserConversationFolder>(
      `/api/folders/${userUuid}/${folderId}/conversations`,
      data,
    );
    if (!response.success || !response.data) {
      throw new Error(
        this.getErrorMessage(
          response.error,
          "Failed to add conversation to folder",
        ),
      );
    }
    return response.data;
  }

  // * Remove conversation from folder
  async removeConversationFromFolder(
    userUuid: string,
    folderId: string,
    conversationId: string,
  ): Promise<UserConversationFolder> {
    const response = await apiClient.delete<UserConversationFolder>(
      `/api/folders/${userUuid}/${folderId}/conversations/${conversationId}`,
    );
    if (!response.success || !response.data) {
      throw new Error(
        this.getErrorMessage(
          response.error,
          "Failed to remove conversation from folder",
        ),
      );
    }
    return response.data;
  }

  // * Remove conversation from all folders
  async removeConversationFromAllFolders(
    userUuid: string,
    conversationId: string,
  ): Promise<void> {
    const response = await apiClient.delete(
      `/api/folders/${userUuid}/conversations/${conversationId}`,
    );
    if (!response.success) {
      throw new Error(
        this.getErrorMessage(
          response.error,
          "Failed to remove conversation from all folders",
        ),
      );
    }
  }

  // * Reorder folders
  async reorderFolders(
    userUuid: string,
    data: ReorderFoldersRequest,
  ): Promise<UserConversationFolder[]> {
    const response = await apiClient.put<UserConversationFolder[]>(
      `/api/folders/${userUuid}/reorder`,
      data,
    );
    if (!response.success || !response.data) {
      throw new Error(
        this.getErrorMessage(response.error, "Failed to reorder folders"),
      );
    }
    return response.data;
  }

  // * Toggle folder collapsed state
  async toggleFolderCollapsed(
    userUuid: string,
    folderId: string,
  ): Promise<UserConversationFolder> {
    const response = await apiClient.post<UserConversationFolder>(
      `/api/folders/${userUuid}/${folderId}/toggle`,
    );
    if (!response.success || !response.data) {
      throw new Error(
        this.getErrorMessage(
          response.error,
          "Failed to toggle folder collapsed state",
        ),
      );
    }
    return response.data;
  }
}

export const folderService = new FolderService();
