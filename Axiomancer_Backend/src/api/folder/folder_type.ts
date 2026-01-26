// TypeScript interfaces for user conversation folders

export interface UserConversationFolder {
  id: string;
  user_uuid: string;
  folder_name: string;
  conversation_ids: string[];
  is_collapsed: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFolderRequest {
  folder_name: string;
  conversation_ids?: string[];
  is_collapsed?: boolean;
  position?: number;
}

export interface UpdateFolderRequest {
  folder_name?: string;
  conversation_ids?: string[];
  is_collapsed?: boolean;
  position?: number;
}

export interface AddConversationToFolderRequest {
  conversation_id: string;
}

export interface RemoveConversationFromFolderRequest {
  conversation_id: string;
}

export interface ReorderFoldersRequest {
  folder_ids: string[]; // Array of folder IDs in desired order
}
