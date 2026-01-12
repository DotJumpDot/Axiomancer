import { sql } from "@/database/db";
import type {
  Chat,
  CreateChatRequest,
  UpdateChatRequest,
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
  ChatAiRespond,
  CreateChatAiRespondRequest,
} from "./chat_type";

export class ChatQuery {
  // ===========================
  // Chat AI Respond queries
  // ===========================

  //* Create AI respond record
  static async createChatAiRespond(respond: CreateChatAiRespondRequest): Promise<ChatAiRespond> {
    const id = crypto.randomUUID();
    const now = new Date();

    const result = await sql`
      INSERT INTO chat_ai_respond (
        id, ai_content, model_key, token_usage, latency_ms, finish_reason, created_at, updated_at
      ) VALUES (
        ${id}, ${respond.ai_content}, ${respond.model_key || null},
        ${respond.token_usage ? JSON.stringify(respond.token_usage) : null},
        ${respond.latency_ms || null}, ${respond.finish_reason || null},
        ${now}, ${now}
      )
      RETURNING *
    `;

    return result[0] as unknown as ChatAiRespond;
  }

  //* Get AI respond by ID
  static async getChatAiRespondById(id: string): Promise<ChatAiRespond | null> {
    const result = await sql`
      SELECT * FROM chat_ai_respond
      WHERE id = ${id}
    `;
    return result.length > 0 ? (result[0] as unknown as ChatAiRespond) : null;
  }

  // ===========================
  // Conversation queries
  // ===========================

  static async getAllConversations(userUuid?: string): Promise<Conversation[]> {
    let query = `SELECT * FROM conversation`;
    const params = [];

    if (userUuid) {
      query += ` WHERE user_uuid = $1`;
      params.push(userUuid);
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

  //* Create conversation with user_uuid and auto_routing based on mode
  static async createConversation(
    conversation: CreateConversationRequest,
    userUuid?: string,
    autoRouting?: boolean
  ): Promise<Conversation> {
    const id = crypto.randomUUID();
    const now = new Date();

    const result = await sql`
      INSERT INTO conversation (
        id, user_uuid, title, auto_routing_enabled, chat_log, archived, created_at, updated_at
      ) VALUES (
        ${id}, ${userUuid || null}, ${conversation.title},
        ${autoRouting ?? false}, ${sql.array([])},
        ${conversation.archived ?? false}, ${now}, ${now}
      )
      RETURNING *
    `;

    return result[0] as unknown as Conversation;
  }

  //* Update conversation including chat_log
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
    if (updates.auto_routing_enabled !== undefined) {
      setClause.push(`auto_routing_enabled = $${setClause.length + 1}`);
      values.push(updates.auto_routing_enabled);
    }
    if (updates.chat_log !== undefined) {
      setClause.push(`chat_log = $${setClause.length + 1}`);
      values.push(updates.chat_log);
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

  //* Append chat ID to conversation's chat_log
  static async appendToChatLog(conversationId: string, chatId: string): Promise<void> {
    await sql`
      UPDATE conversation
      SET chat_log = array_append(chat_log, ${chatId}),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId}
    `;
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
      SELECT 
        c.*,
        car.ai_content,
        car.model_key as ai_model_key,
        car.token_usage as ai_token_usage,
        car.latency_ms as ai_latency_ms,
        car.finish_reason as ai_finish_reason
      FROM chat c
      LEFT JOIN chat_ai_respond car ON c.chat_ai_respond_id = car.id
      WHERE c.conversation_id = ${conversationId}
      ORDER BY c.created_at ASC
    `;
    return result.map((row) => {
      const chat = row as unknown as Chat & {
        ai_content?: string;
        ai_model_key?: string;
        ai_token_usage?: any;
        ai_latency_ms?: number;
        ai_finish_reason?: string;
      };
      // Include AI response data in the Chat object
      return chat as Chat;
    });
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
        chat_ai_respond_id, respond_error, created_at, updated_at
      ) VALUES (
        ${id}, ${chat.conversation_id}, ${chat.role}, ${chat.content},
        ${chat.model_id || null}, ${chat.prompt_profile_id || null},
        ${chat.routing_mode}, ${chat.used_web_search || false},
        ${chat.used_image_search || false}, ${JSON.stringify(chat.search_context) || null},
        ${chat.chat_ai_respond_id || null}, ${chat.respond_error || false},
        ${now}, ${now}
      )
      RETURNING *
    `;

    // Append chat ID to conversation's chat_log
    await this.appendToChatLog(chat.conversation_id, id);

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
    if (updates.chat_ai_respond_id !== undefined) {
      setClause.push(`chat_ai_respond_id = $${setClause.length + 1}`);
      values.push(updates.chat_ai_respond_id);
    }
    if (updates.respond_error !== undefined) {
      setClause.push(`respond_error = $${setClause.length + 1}`);
      values.push(updates.respond_error);
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
