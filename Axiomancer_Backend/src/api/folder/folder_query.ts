import { sql } from "@/database/db";
import type {
  UserConversationFolder,
  CreateFolderRequest,
  UpdateFolderRequest,
} from "./folder_type";
import { v4 as uuidv4 } from "uuid";

// * Helper to convert postgres row to plain object
function toFolder(row: Record<string, unknown>): UserConversationFolder {
  return {
    id: row.id as string,
    user_uuid: row.user_uuid as string,
    folder_name: row.folder_name as string,
    conversation_ids: (row.conversation_ids as string[]) || [],
    is_collapsed: row.is_collapsed as boolean,
    position: row.position as number,
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
  };
}

// * Get all folders for a user
export async function getFoldersByUserUUID(
  userUuid: string,
): Promise<UserConversationFolder[]> {
  const result = await sql`
    SELECT 
      id,
      user_uuid,
      folder_name,
      conversation_ids,
      is_collapsed,
      position,
      created_at,
      updated_at
    FROM user_conversation_folder 
    WHERE user_uuid = ${userUuid}
    ORDER BY position ASC, created_at ASC
  `;

  return result.map(toFolder);
}

// * Get a single folder by ID
export async function getFolderById(
  folderId: string,
): Promise<UserConversationFolder | null> {
  const result =
    await sql`SELECT * FROM user_conversation_folder WHERE id = ${folderId}`;

  if (result.length === 0) {
    return null;
  }

  return toFolder(result[0]);
}

// * Create new folder
export async function createFolder(
  userUuid: string,
  data: CreateFolderRequest,
): Promise<UserConversationFolder> {
  const id = uuidv4();

  // Get max position for this user
  const maxPosResult = await sql`
    SELECT COALESCE(MAX(position), -1) + 1 as next_position 
    FROM user_conversation_folder 
    WHERE user_uuid = ${userUuid}
  `;
  const nextPosition = data.position ?? maxPosResult[0].next_position;

  const result = await sql`
    INSERT INTO user_conversation_folder (id, user_uuid, folder_name, conversation_ids, is_collapsed, position, created_at, updated_at)
    VALUES (
      ${id},
      ${userUuid},
      ${data.folder_name},
      ${data.conversation_ids || []},
      ${data.is_collapsed ?? false},
      ${nextPosition},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `;

  return toFolder(result[0]);
}

// * Update folder
export async function updateFolder(
  folderId: string,
  data: UpdateFolderRequest,
): Promise<UserConversationFolder> {
  const updates: Record<string, unknown> = {
    updated_at: sql`CURRENT_TIMESTAMP`,
  };

  if (data.folder_name !== undefined) {
    updates.folder_name = data.folder_name;
  }

  if (data.conversation_ids !== undefined) {
    updates.conversation_ids = data.conversation_ids;
  }

  if (data.is_collapsed !== undefined) {
    updates.is_collapsed = data.is_collapsed;
  }

  if (data.position !== undefined) {
    updates.position = data.position;
  }

  const result = await sql`
    UPDATE user_conversation_folder 
    SET ${sql(updates)}
    WHERE id = ${folderId}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new Error("Folder not found");
  }

  return toFolder(result[0]);
}

// * Delete folder
export async function deleteFolder(folderId: string): Promise<void> {
  await sql`DELETE FROM user_conversation_folder WHERE id = ${folderId}`;
}

// * Add conversation to folder
export async function addConversationToFolder(
  folderId: string,
  conversationId: string,
): Promise<UserConversationFolder> {
  const result = await sql`
    UPDATE user_conversation_folder 
    SET conversation_ids = array_append(conversation_ids, ${conversationId}),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${folderId}
    AND NOT (${conversationId} = ANY(conversation_ids))
    RETURNING *
  `;

  if (result.length === 0) {
    // Conversation might already be in folder, get current state
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }
    return folder;
  }

  return toFolder(result[0]);
}

// * Remove conversation from folder
export async function removeConversationFromFolder(
  folderId: string,
  conversationId: string,
): Promise<UserConversationFolder> {
  const result = await sql`
    UPDATE user_conversation_folder 
    SET conversation_ids = array_remove(conversation_ids, ${conversationId}),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${folderId}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new Error("Folder not found");
  }

  return toFolder(result[0]);
}

// * Remove conversation from all folders (when moving to a new folder or unfavoriting)
export async function removeConversationFromAllFolders(
  userUuid: string,
  conversationId: string,
): Promise<void> {
  await sql`
    UPDATE user_conversation_folder 
    SET conversation_ids = array_remove(conversation_ids, ${conversationId}),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_uuid = ${userUuid}
    AND ${conversationId} = ANY(conversation_ids)
  `;
}

// * Reorder folders (update positions)
export async function reorderFolders(
  userUuid: string,
  folderIds: string[],
): Promise<UserConversationFolder[]> {
  // Update each folder's position based on its index in the array
  for (let i = 0; i < folderIds.length; i++) {
    await sql`
      UPDATE user_conversation_folder 
      SET position = ${i}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${folderIds[i]} AND user_uuid = ${userUuid}
    `;
  }

  return getFoldersByUserUUID(userUuid);
}

// * Toggle folder collapsed state
export async function toggleFolderCollapsed(
  folderId: string,
): Promise<UserConversationFolder> {
  const result = await sql`
    UPDATE user_conversation_folder 
    SET is_collapsed = NOT is_collapsed,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${folderId}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new Error("Folder not found");
  }

  return toFolder(result[0]);
}
