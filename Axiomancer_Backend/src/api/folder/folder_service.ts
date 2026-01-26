import * as folderQuery from "./folder_query";
import type {
  UserConversationFolder,
  CreateFolderRequest,
  UpdateFolderRequest,
} from "./folder_type";

// * Get all folders for a user
export async function getFolders(
  userUuid: string,
): Promise<UserConversationFolder[]> {
  return await folderQuery.getFoldersByUserUUID(userUuid);
}

// * Get a single folder by ID
export async function getFolderById(
  folderId: string,
): Promise<UserConversationFolder | null> {
  return await folderQuery.getFolderById(folderId);
}

// * Create new folder
export async function createFolder(
  userUuid: string,
  data: CreateFolderRequest,
): Promise<UserConversationFolder> {
  return await folderQuery.createFolder(userUuid, data);
}

// * Update folder
export async function updateFolder(
  folderId: string,
  userUuid: string,
  data: UpdateFolderRequest,
): Promise<UserConversationFolder> {
  // Verify folder belongs to user
  const folder = await folderQuery.getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found");
  }
  if (folder.user_uuid !== userUuid) {
    throw new Error("Unauthorized: Folder does not belong to user");
  }

  return await folderQuery.updateFolder(folderId, data);
}

// * Delete folder
export async function deleteFolder(
  folderId: string,
  userUuid: string,
): Promise<void> {
  // Verify folder belongs to user
  const folder = await folderQuery.getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found");
  }
  if (folder.user_uuid !== userUuid) {
    throw new Error("Unauthorized: Folder does not belong to user");
  }

  await folderQuery.deleteFolder(folderId);
}

// * Add conversation to folder
export async function addConversationToFolder(
  folderId: string,
  userUuid: string,
  conversationId: string,
): Promise<UserConversationFolder> {
  // Verify folder belongs to user
  const folder = await folderQuery.getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found");
  }
  if (folder.user_uuid !== userUuid) {
    throw new Error("Unauthorized: Folder does not belong to user");
  }

  // First remove from any other folders
  await folderQuery.removeConversationFromAllFolders(userUuid, conversationId);

  // Then add to the target folder
  return await folderQuery.addConversationToFolder(folderId, conversationId);
}

// * Remove conversation from folder
export async function removeConversationFromFolder(
  folderId: string,
  userUuid: string,
  conversationId: string,
): Promise<UserConversationFolder> {
  // Verify folder belongs to user
  const folder = await folderQuery.getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found");
  }
  if (folder.user_uuid !== userUuid) {
    throw new Error("Unauthorized: Folder does not belong to user");
  }

  return await folderQuery.removeConversationFromFolder(
    folderId,
    conversationId,
  );
}

// * Remove conversation from all folders
export async function removeConversationFromAllFolders(
  userUuid: string,
  conversationId: string,
): Promise<void> {
  await folderQuery.removeConversationFromAllFolders(userUuid, conversationId);
}

// * Reorder folders
export async function reorderFolders(
  userUuid: string,
  folderIds: string[],
): Promise<UserConversationFolder[]> {
  return await folderQuery.reorderFolders(userUuid, folderIds);
}

// * Toggle folder collapsed state
export async function toggleFolderCollapsed(
  folderId: string,
  userUuid: string,
): Promise<UserConversationFolder> {
  // Verify folder belongs to user
  const folder = await folderQuery.getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found");
  }
  if (folder.user_uuid !== userUuid) {
    throw new Error("Unauthorized: Folder does not belong to user");
  }

  return await folderQuery.toggleFolderCollapsed(folderId);
}

// Export as FolderService object for consistency
export const FolderService = {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  addConversationToFolder,
  removeConversationFromFolder,
  removeConversationFromAllFolders,
  reorderFolders,
  toggleFolderCollapsed,
};
