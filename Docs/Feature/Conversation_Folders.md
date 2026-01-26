# Conversation Folders Feature

## Overview

Axiomancer supports **Conversation Folders** to help users organize their conversations into custom categories. Users can create folders like "Work", "Personal", "Research", and drag conversations between them for better organization.

---

## How It Works

### 1. **User Interface (Frontend)**

The sidebar includes folder management capabilities:

- **Location**: `Sidebar.svelte` - conversation list area
- **States**: Managed by `folderStore`
- **Visual Features**:
  - Collapsible folder sections with chevron indicators
  - Drag-and-drop support for moving conversations
  - Special "Favorites" folder at top (optional)
  - Inline folder renaming (double-click)
  - Create/delete folder buttons
- **Translation Support**: Full English/Thai localization

### 2. **Frontend Flow**

```typescript
// Sidebar.svelte - Create folder
async function createFolder(name: string) {
  await folderStore.createFolder(authStore.currentUser.uuid, {
    folder_name: name,
    conversation_ids: []
  });
}

// Sidebar.svelte - Drag conversation to folder
async function handleDrop(conversationId: string, folderId: string) {
  await folderStore.addConversationToFolder(
    authStore.currentUser.uuid,
    folderId,
    conversationId
  );
}

// folder.svelte.ts - Store operations
folderStore.loadFolders(userUuid)
folderStore.createFolder(userUuid, { folder_name, conversation_ids? })
folderStore.updateFolder(userUuid, folderId, { folder_name?, is_collapsed?, position? })
folderStore.deleteFolder(userUuid, folderId)
folderStore.addConversationToFolder(userUuid, folderId, conversationId)
folderStore.removeConversationFromFolder(userUuid, folderId, conversationId)
folderStore.toggleFolderCollapsed(userUuid, folderId)
```

### 3. **Backend Processing**

**File**: `folder_api.ts`

```typescript
// API Endpoints
GET    /api/folders/:userUuid                              // Get all folders
POST   /api/folders/:userUuid                              // Create folder
PUT    /api/folders/:userUuid/:folderId                    // Update folder
DELETE /api/folders/:userUuid/:folderId                    // Delete folder
POST   /api/folders/:userUuid/:folderId/conversations      // Add conversation
DELETE /api/folders/:userUuid/:folderId/conversations/:id  // Remove conversation
DELETE /api/folders/:userUuid/conversations/:id            // Remove from all folders
PUT    /api/folders/:userUuid/reorder                      // Reorder folders
```

---

## Database Schema

### User Conversation Folder Table

```sql
CREATE TABLE IF NOT EXISTS public.user_conversation_folder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid UUID NOT NULL REFERENCES public.user(uuid) ON DELETE CASCADE,
    folder_name VARCHAR(100) NOT NULL,
    conversation_ids TEXT[] DEFAULT '{}',
    is_collapsed BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_conversation_folder_user
    ON public.user_conversation_folder(user_uuid);
```

### Field Descriptions

| Field            | Type      | Description                                      |
| ---------------- | --------- | ------------------------------------------------ |
| id               | UUID      | Unique folder identifier                         |
| user_uuid        | UUID      | Owner of the folder (foreign key to user)        |
| folder_name      | VARCHAR   | Display name (e.g., "Work", "Personal")          |
| conversation_ids | TEXT[]    | Ordered array of conversation IDs in this folder |
| is_collapsed     | BOOLEAN   | Whether folder is collapsed in sidebar UI        |
| position         | INTEGER   | Display order (lower = higher in list)           |
| created_at       | TIMESTAMP | When folder was created                          |
| updated_at       | TIMESTAMP | When folder was last modified                    |

---

## TypeScript Types

### Frontend Types (`Types/Folder.ts`)

```typescript
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
```

---

## Settings Integration

### Folder-Related Settings (`settings.svelte.ts`)

```typescript
// Auto-expand collapsed folders when selecting a conversation inside
let autoOpenCollapse = $state(true);

// Show special "Favorites" folder at top of sidebar
let favoriteFolderEnabled = $state(true);

// Disable double-click to rename folders (prevents accidental renames)
let disableFolderClickRename = $state(true);
```

### Settings UI (`ConversationSetting.svelte`)

Located in the **Conversation** tab:

1. **Auto Expand Folder** - Toggle to auto-open collapsed folders
2. **Show Favorites Folder** - Toggle to show/hide favorites folder section

---

## UI Components

### Folder Display Structure

```
📁 Favorites (special folder, optional)
    └── ⭐ Favorited Conversation 1
    └── ⭐ Favorited Conversation 2

📁 Work (user folder)
    └── Conversation A
    └── Conversation B

📁 Personal (user folder)
    └── Conversation C

📄 Unfiled Conversations
    └── Conversation D
    └── Conversation E
```

### Visual States

- **Collapsed folder**: Chevron right (▶)
- **Expanded folder**: Chevron down (▼)
- **Drag over folder**: Highlighted background
- **Empty folder**: "No conversations" message (italic)

### Drag-and-Drop

1. Drag a conversation item
2. Hover over a folder (folder highlights)
3. Drop to add conversation to folder
4. Drop on "unfiled" area to remove from folder

---

## Translations

### English (`languages/en/chat.json`)

```json
{
  "sidebar": {
    "newFolder": "New Folder",
    "folderName": "Folder name",
    "renameFolder": "Rename folder",
    "deleteFolder": "Delete folder",
    "deleteFolderConfirm": "Delete this folder? Conversations inside will be moved out.",
    "moveToFolder": "Move to folder",
    "removeFromFolder": "Remove from folder",
    "favorites": "Favorites",
    "noFolder": "No Folder"
  },
  "conversationSettings": {
    "folders": "Folders",
    "autoExpandFolder": "Auto Expand Folder",
    "autoExpandFolderDesc": "Auto-expand collapsed folders when selecting a conversation inside",
    "showFavoritesFolder": "Show Favorites Folder",
    "showFavoritesFolderDesc": "Group favorited conversations in a special folder at the top"
  }
}
```

### Thai (`languages/th/chat.json`)

```json
{
  "sidebar": {
    "newFolder": "โฟลเดอร์ใหม่",
    "folderName": "ชื่อโฟลเดอร์",
    "renameFolder": "เปลี่ยนชื่อโฟลเดอร์",
    "deleteFolder": "ลบโฟลเดอร์",
    "deleteFolderConfirm": "ต้องการลบโฟลเดอร์นี้? การสนทนาภายในจะถูกย้ายออก",
    "moveToFolder": "ย้ายไปโฟลเดอร์",
    "removeFromFolder": "นำออกจากโฟลเดอร์",
    "favorites": "รายการโปรด",
    "noFolder": "ไม่มีโฟลเดอร์"
  },
  "conversationSettings": {
    "folders": "โฟลเดอร์",
    "autoExpandFolder": "เปิดโฟลเดอร์อัตโนมัติ",
    "autoExpandFolderDesc": "เปิดโฟลเดอร์ที่ปิดอยู่อัตโนมัติเมื่อเลือกการสนทนาภายใน",
    "showFavoritesFolder": "แสดงโฟลเดอร์รายการโปรด",
    "showFavoritesFolderDesc": "จัดกลุ่มรายการโปรดไว้ในโฟลเดอร์พิเศษด้านบน"
  }
}
```

---

## File Structure

### Backend

```
Axiomancer_Backend/src/api/folder/
├── folder_api.ts      # API route handlers
├── folder_service.ts  # Business logic
├── folder_query.ts    # Database queries
└── folder_type.ts     # TypeScript types
```

### Frontend

```
Axiomancer_Frontend/src/
├── Service/folderService.ts    # API client
├── Store/folder.svelte.ts      # State management
├── Types/Folder.ts             # TypeScript interfaces
└── Components/Sidebar/
    └── Sidebar.svelte          # UI implementation
```

---

## Error Handling

### Graceful Degradation

The folder system is designed to fail gracefully:

```typescript
// folder.svelte.ts - loadFolders()
async loadFolders(userUuid: string) {
  try {
    folders = await folderService.getFolders(userUuid);
  } catch (err) {
    // Silently handle errors - folders are optional
    // App works even if folder table doesn't exist
    folders = [];
    if (!errorMessage.includes("does not exist")) {
      console.warn("Folders unavailable:", errorMessage);
    }
  }
}
```

### Favorite Integration

When adding a conversation to favorites, it's automatically removed from any folder:

```typescript
async function handleFavorite(id: string) {
  if (folderStore.isConversationInFolder(id)) {
    await folderStore.removeConversationFromAllFolders(userUuid, id);
  }
  await favoriteStore.addToFavorite(userUuid, "conversation", id);
}
```

---

## Future Enhancements

1. **Folder Sharing** - Share folders between users
2. **Folder Colors** - Custom color coding for folders
3. **Nested Folders** - Sub-folder support
4. **Folder Templates** - Pre-defined folder structures
5. **Bulk Actions** - Move multiple conversations at once

---

**Last Updated**: January 26, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

**Features Included**:

- Full CRUD operations for folders
- Drag-and-drop conversation management
- Collapsible folder state persistence
- Optional Favorites folder section
- Auto-expand on conversation selection
- Bilingual support (EN/TH)
