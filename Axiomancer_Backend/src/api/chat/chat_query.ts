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
  SearchLog,
  CreateSearchLogRequest,
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
        id, ai_content, model_key, token_usage, latency_ms, finish_reason, used_price, created_at, updated_at
      ) VALUES (
        ${id}, ${respond.ai_content}, ${respond.model_key || null},
        ${respond.token_usage ? sql.json(respond.token_usage) : null},
        ${respond.latency_ms || null}, ${respond.finish_reason || null},
        ${respond.used_price ?? null}, ${now}, ${now}
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
        car.finish_reason as ai_finish_reason,
        car.used_price as ai_used_price,
        am.model_key as decision_model_key,
        sl.memory_chat_include,
        sl.used_web_search,
        sl.used_image_search,
        sl.used_steam,
        sl.reasoning_effort,
        sl.reasoning_content,
        sl.decision_prompt_model,
        sl.prompt_web_search,
        sl.prompt_picture_search,
        sl.search_context_web,
        sl.search_context_picture
      FROM chat c
      LEFT JOIN chat_ai_respond car ON c.chat_ai_respond_id = car.id
      LEFT JOIN ai_model am ON c.model_id = am.id
      LEFT JOIN search_log sl ON c.search_log_uuid = sl.id_uuid
      WHERE c.conversation_id = ${conversationId}
      ORDER BY c.created_at ASC
    `;

    return result.map((row) => {
      const chat: any = { ...row };
      // Include AI response data in the Chat object
      if (row.memory_chat_include !== null) {
        chat.search_log = {
          memory_chat_include: row.memory_chat_include,
          used_web_search: row.used_web_search,
          used_image_search: row.used_image_search,
          used_steam: row.used_steam,
          reasoning_effort: row.reasoning_effort,
          reasoning_content: row.reasoning_content,
          decision_prompt_model: row.decision_prompt_model,
          prompt_web_search: row.prompt_web_search,
          prompt_picture_search: row.prompt_picture_search,
          search_context_web: row.search_context_web,
          search_context_picture: row.search_context_picture,
        };
      }
      // Clean up direct properties
      delete chat.memory_chat_include;
      delete chat.used_web_search;
      delete chat.used_image_search;
      delete chat.used_steam;
      delete chat.reasoning_effort;
      delete chat.reasoning_content;
      delete chat.decision_prompt_model;
      delete chat.prompt_web_search;
      delete chat.prompt_picture_search;
      delete chat.search_context_web;
      delete chat.search_context_picture;
      return chat as Chat;
    });
  }

  // Get chat by ID
  static async getChatById(id: string): Promise<Chat | null> {
    const result = await sql`
      SELECT
        c.*,
        car.ai_content,
        car.model_key as ai_model_key,
        car.token_usage as ai_token_usage,
        car.latency_ms as ai_latency_ms,
        car.finish_reason as ai_finish_reason,
        car.used_price as ai_used_price,
        am.model_key as decision_model_key,
        sl.memory_chat_include,
        sl.used_web_search,
        sl.used_image_search,
        sl.used_steam,
        sl.reasoning_effort,
        sl.reasoning_content,
        sl.decision_prompt_model,
        sl.prompt_web_search,
        sl.prompt_picture_search,
        sl.search_context_web,
        sl.search_context_picture
      FROM chat c
      LEFT JOIN chat_ai_respond car ON c.chat_ai_respond_id = car.id
      LEFT JOIN ai_model am ON c.model_id = am.id
      LEFT JOIN search_log sl ON c.search_log_uuid = sl.id_uuid
      WHERE c.id = ${id}
    `;

    if (result.length === 0) return null;

    const row = result[0];
    const chat: any = { ...row };

    // Include search_log data if available
    if (row.memory_chat_include !== null) {
      chat.search_log = {
        memory_chat_include: row.memory_chat_include,
        used_web_search: row.used_web_search,
        used_image_search: row.used_image_search,
        used_steam: row.used_steam,
        reasoning_effort: row.reasoning_effort,
        reasoning_content: row.reasoning_content,
        decision_prompt_model: row.decision_prompt_model,
        prompt_web_search: row.prompt_web_search,
        prompt_picture_search: row.prompt_picture_search,
        search_context_web: row.search_context_web,
        search_context_picture: row.search_context_picture,
      };
    }

    // Clean up direct properties
    delete chat.memory_chat_include;
    delete chat.used_web_search;
    delete chat.used_image_search;
    delete chat.used_steam;
    delete chat.reasoning_effort;
    delete chat.reasoning_content;
    delete chat.decision_prompt_model;
    delete chat.prompt_web_search;
    delete chat.prompt_picture_search;
    delete chat.search_context_web;
    delete chat.search_context_picture;

    return chat as Chat;
  }

  // Create new chat message
  static async createChat(chat: CreateChatRequest): Promise<Chat> {
    const id = crypto.randomUUID();
    const now = new Date();

    const result = await sql`
      INSERT INTO chat (
        id, conversation_id, role, content, model_id, prompt_profile_id,
        routing_mode, search_log_uuid, chat_ai_respond_id, respond_error, created_at, updated_at
      ) VALUES (
        ${id}, ${chat.conversation_id}, ${chat.role}, ${chat.content},
        ${chat.model_id || null}, ${chat.prompt_profile_id || null},
        ${chat.routing_mode}, ${chat.search_log_uuid || null},
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
    if (updates.search_log_uuid !== undefined) {
      setClause.push(`search_log_uuid = $${setClause.length + 1}`);
      values.push(updates.search_log_uuid);
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

  // ===========================
  // Search Log queries
  // ===========================

  //* Create search log record
  static async createSearchLog(log: CreateSearchLogRequest): Promise<SearchLog> {
    const id_uuid = crypto.randomUUID();
    const now = new Date();

    const result = await sql`
      INSERT INTO search_log (
        id_uuid, chat_id, memory_chat_include, used_web_search, used_image_search, used_steam,
        reasoning_effort, reasoning_content, decision_prompt_model, prompt_web_search, prompt_picture_search,
        search_context_web, search_context_picture, decision_info, created_at
      ) VALUES (
        ${id_uuid}, ${log.chat_id}, ${log.memory_chat_include},
        ${log.used_web_search}, ${log.used_image_search}, ${log.used_steam},
        ${log.reasoning_effort || null}, ${log.reasoning_content || null},
        ${log.decision_prompt_model || null}, ${log.prompt_web_search || null}, ${log.prompt_picture_search || null},
        ${log.search_context_web ? sql.json(log.search_context_web) : null},
        ${log.search_context_picture ? sql.json(log.search_context_picture) : null},
        ${log.decision_info ? sql.json(log.decision_info as any) : null},
        ${now}
      )
      RETURNING *
    `;

    return result[0] as unknown as SearchLog;
  }

  //* Get search log by UUID
  static async getSearchLogByUuid(id_uuid: string): Promise<SearchLog | null> {
    const result = await sql`
      SELECT * FROM search_log
      WHERE id_uuid = ${id_uuid}
    `;
    return result.length > 0 ? (result[0] as unknown as SearchLog) : null;
  }

  //* Get search log by chat ID
  static async getSearchLogByChatId(chatId: string): Promise<SearchLog | null> {
    const result = await sql`
      SELECT * FROM search_log
      WHERE chat_id = ${chatId}
    `;
    return result.length > 0 ? (result[0] as unknown as SearchLog) : null;
  }

  //* Update search log reasoning content
  static async updateSearchLogReasoningContent(
    id_uuid: string,
    reasoningContent: string
  ): Promise<void> {
    await sql`
      UPDATE search_log
      SET reasoning_content = ${reasoningContent}
      WHERE id_uuid = ${id_uuid}
    `;
  }
}
