// User Conversation Folder Types

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
}

export interface UpdateFolderRequest {
  folder_name?: string;
  is_collapsed?: boolean;
  position?: number;
}

export interface AddConversationToFolderRequest {
  conversation_id: string;
}

export interface ReorderFoldersRequest {
  folder_ids: string[];
}
