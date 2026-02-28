import { sql } from "../../database/db";

export const analyticsQuery = {
  async getUserAnalytics(userUuid: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query user messages that have AI responses (chat_ai_respond_id is not null)
    // The model_key is stored in chat_ai_respond table
    const messages = await sql`
      SELECT
        c.id,
        c.conversation_id,
        c.role,
        c.created_at,
        c.model_id,
        c.routing_mode,
        c.prompt_profile_id,
        c.chat_ai_respond_id,
        car.model_key,
        car.ai_content,
        car.token_usage,
        car.latency_ms,
        am.display_name as model_display_name,
        am.cost_per_1k_token,
        pp.name as prompt_name,
        pp.id as prompt_id,
        sl.used_web_search,
        sl.used_image_search,
        sl.used_steam,
        sl.reasoning_effort,
        sl.decision_info,
        conv.title,
        conv.created_at as conversation_created_at
      FROM chat c
      INNER JOIN conversation conv ON c.conversation_id = conv.id
      LEFT JOIN chat_ai_respond car ON c.chat_ai_respond_id = car.id
      LEFT JOIN ai_model am ON car.model_key = am.model_key
      LEFT JOIN prompt_profile pp ON c.prompt_profile_id = pp.id
      LEFT JOIN search_log sl ON c.search_log_uuid = sl.id_uuid
      WHERE conv.user_uuid = ${userUuid}
        AND c.created_at >= ${startDate}
        AND c.chat_ai_respond_id IS NOT NULL
      ORDER BY c.created_at DESC
    `;

    return messages;
  },

  async getUserConversations(userUuid: string) {
    const conversations = await sql`
      SELECT
        c.id,
        c.title,
        c.chat_log,
        c.created_at,
        c.updated_at
      FROM conversation c
      WHERE c.user_uuid = ${userUuid}
        AND c.archived = false
      ORDER BY c.updated_at DESC
    `;

    return conversations;
  },

  /**
   * Count unique AI models used by a user
   * @param userUuid - User UUID
   * @returns Number of unique AI models used
   */
  async countUniqueModelsUsed(userUuid: string): Promise<number> {
    const result = await sql`
      SELECT COUNT(DISTINCT car.model_key) as count
      FROM chat c
      INNER JOIN chat_ai_respond car ON c.chat_ai_respond_id = car.id
      INNER JOIN conversation conv ON c.conversation_id = conv.id
      WHERE conv.user_uuid = ${userUuid}
        AND car.model_key IS NOT NULL
    `;

    return result[0]?.count || 0;
  },
};
