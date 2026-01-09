import { sql } from "@/database/db";
import type {
  Chat,
  CreateChatRequest,
  UpdateChatRequest,
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
} from "./chat_type";

export class ChatQuery {
  // Conversation queries
  static async getAllConversations(userId?: number): Promise<Conversation[]> {
    let query = `SELECT * FROM conversation`;
    const params = [];

    if (userId) {
      query += ` WHERE user_id = $1`;
      params.push(userId);
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await sql.unsafe(query, params);
    return result.map((row) => row as unknown as Conversation);
  }

  static async getConversationById(id: string): Promise<Conversation | null> {
    const result = await sql`
      SELECT * FROM conversation
      WHERE id = ${id}
    `;
    return result.length > 0 ? (result[0] as unknown as Conversation) : null;
  }

  static async createConversation(
    conversation: CreateConversationRequest,
    userId?: number
  ): Promise<Conversation> {
    const id = crypto.randomUUID();
    const now = new Date();

    const result = await sql`
      INSERT INTO conversation (
        id, user_id, title, system_prompt_snapshot, auto_routing_enabled, archived, created_at, updated_at
      ) VALUES (
        ${id}, ${userId || null}, ${conversation.title},
        ${conversation.system_prompt_snapshot || null},
        ${conversation.auto_routing_enabled ?? true}, ${
      conversation.archived ?? false
    }, ${now}, ${now}
      )
      RETURNING *
    `;

    return result[0] as unknown as Conversation;
  }

  static async updateConversation(
    id: string,
    updates: UpdateConversationRequest
  ): Promise<Conversation | null> {
    const now = new Date();
    const setClause = [];
    const values = [];

    if (updates.title !== undefined) {
      setClause.push(`title = $${setClause.length + 1}`);
      values.push(updates.title);
    }
    if (updates.system_prompt_snapshot !== undefined) {
      setClause.push(`system_prompt_snapshot = $${setClause.length + 1}`);
      values.push(updates.system_prompt_snapshot);
    }
    if (updates.auto_routing_enabled !== undefined) {
      setClause.push(`auto_routing_enabled = $${setClause.length + 1}`);
      values.push(updates.auto_routing_enabled);
    }
    if (updates.archived !== undefined) {
      setClause.push(`archived = $${setClause.length + 1}`);
      values.push(updates.archived);
    }

    if (setClause.length === 0) {
      return null;
    }

    setClause.push(`updated_at = $${setClause.length + 1}`);
    values.push(now);

    const query = `
      UPDATE conversation
      SET ${setClause.join(", ")}
      WHERE id = $${setClause.length + 1}
      RETURNING *
    `;
    values.push(id);

    const result = await sql.unsafe(query, values);
    return result.length > 0 ? (result[0] as unknown as Conversation) : null;
  }

  static async deleteConversation(id: string): Promise<boolean> {
    // First delete all chats in this conversation
    await this.deleteChatsByConversationId(id);

    // Then delete the conversation
    const result = await sql`
      DELETE FROM conversation
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Chat queries
  static async getChatsByConversationId(conversationId: string): Promise<Chat[]> {
    const result = await sql`
      SELECT * FROM chat
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `;
    return result.map((row) => row as unknown as Chat);
  }

  // Get chat by ID
  static async getChatById(id: string): Promise<Chat | null> {
    const result = await sql`
      SELECT * FROM chat
      WHERE id = ${id}
    `;
    return result.length > 0 ? (result[0] as unknown as Chat) : null;
  }

  // Create new chat message
  static async createChat(chat: CreateChatRequest): Promise<Chat> {
    const id = crypto.randomUUID();
    const now = new Date();

    const result = await sql`
      INSERT INTO chat (
        id, conversation_id, role, content, model_id, prompt_profile_id,
        routing_mode, used_web_search, used_image_search, search_context,
        token_usage, latency_ms, created_at, updated_at
      ) VALUES (
        ${id}, ${chat.conversation_id}, ${chat.role}, ${chat.content},
        ${chat.model_id || null}, ${chat.prompt_profile_id || null},
        ${chat.routing_mode}, ${chat.used_web_search || false},
        ${chat.used_image_search || false}, ${JSON.stringify(chat.search_context) || null},
        ${JSON.stringify(chat.token_usage) || null}, ${chat.latency_ms || null},
        ${now}, ${now}
      )
      RETURNING *
    `;

    return result[0] as unknown as Chat;
  }

  // Update chat message
  static async updateChat(id: string, updates: UpdateChatRequest): Promise<Chat | null> {
    const now = new Date();
    const setClause = [];
    const values = [];

    if (updates.role !== undefined) {
      setClause.push(`role = $${setClause.length + 1}`);
      values.push(updates.role);
    }
    if (updates.content !== undefined) {
      setClause.push(`content = $${setClause.length + 1}`);
      values.push(updates.content);
    }
    if (updates.model_id !== undefined) {
      setClause.push(`model_id = $${setClause.length + 1}`);
      values.push(updates.model_id);
    }
    if (updates.prompt_profile_id !== undefined) {
      setClause.push(`prompt_profile_id = $${setClause.length + 1}`);
      values.push(updates.prompt_profile_id);
    }
    if (updates.routing_mode !== undefined) {
      setClause.push(`routing_mode = $${setClause.length + 1}`);
      values.push(updates.routing_mode);
    }
    if (updates.used_web_search !== undefined) {
      setClause.push(`used_web_search = $${setClause.length + 1}`);
      values.push(updates.used_web_search);
    }
    if (updates.used_image_search !== undefined) {
      setClause.push(`used_image_search = $${setClause.length + 1}`);
      values.push(updates.used_image_search);
    }
    if (updates.search_context !== undefined) {
      setClause.push(`search_context = $${setClause.length + 1}`);
      values.push(JSON.stringify(updates.search_context));
    }
    if (updates.token_usage !== undefined) {
      setClause.push(`token_usage = $${setClause.length + 1}`);
      values.push(JSON.stringify(updates.token_usage));
    }
    if (updates.latency_ms !== undefined) {
      setClause.push(`latency_ms = $${setClause.length + 1}`);
      values.push(updates.latency_ms);
    }

    if (setClause.length === 0) {
      return null;
    }

    setClause.push(`updated_at = $${setClause.length + 1}`);
    values.push(now);

    const query = `
      UPDATE chat
      SET ${setClause.join(", ")}
      WHERE id = $${setClause.length + 1}
      RETURNING *
    `;
    values.push(id);

    const result = await sql.unsafe(query, values);
    return result.length > 0 ? (result[0] as unknown as Chat) : null;
  }

  // Delete chat message
  static async deleteChat(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM chat
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Delete all chats for a conversation
  static async deleteChatsByConversationId(conversationId: string): Promise<number> {
    const result = await sql`
      DELETE FROM chat
      WHERE conversation_id = ${conversationId}
    `;
    return result.count;
  }
}
