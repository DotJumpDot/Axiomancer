import { analyticsQuery } from "./analytics_query";
import type {
  AnalyticsData,
  ModelUsage,
  DailyUsage,
  SearchUsageStats,
  ReasoningUsageStats,
  PromptUsage,
  ConversationActivity,
} from "./analytics_type";

export class AnalyticsService {
  static async getAnalytics(userUuid: string, days: number = 30): Promise<AnalyticsData> {
    const messages = await analyticsQuery.getUserAnalytics(userUuid, days);
    const conversations = await analyticsQuery.getUserConversations(userUuid);

    const totalMessages = messages.length;
    const totalConversations = conversations.length;
    const totalTokensUsed = messages.reduce((sum, msg) => {
      if (msg.token_usage) {
        const tokenUsage =
          typeof msg.token_usage === "string" ? JSON.parse(msg.token_usage) : msg.token_usage;
        return sum + (tokenUsage.total || 0);
      }
      return sum;
    }, 0);

    const totalCost = messages.reduce((sum, msg) => {
      // All messages have AI responses (chat_ai_respond_id is not null)
      // model_key and token_usage come from chat_ai_respond table
      if (msg.model_key && msg.token_usage) {
        const tokenUsage =
          typeof msg.token_usage === "string" ? JSON.parse(msg.token_usage) : msg.token_usage;
        const tokens = tokenUsage.total || 0;
        const costPer1k = msg.cost_per_1k_token || 0.001;
        return sum + (tokens / 1000) * costPer1k;
      }
      return sum;
    }, 0);

    const latencies = messages.filter((m) => m.latency_ms !== null).map((m) => m.latency_ms);
    const averageResponseTime =
      latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    const mostUsedModels = this.calculateModelUsage(messages);
    const dailyUsage = this.calculateDailyUsage(messages, days);
    const searchUsage = this.calculateSearchUsage(messages);
    const reasoningUsage = this.calculateReasoningUsage(messages);
    const promptUsage = this.calculatePromptUsage(messages);
    const conversationActivity = this.calculateConversationActivity(conversations, messages);

    return {
      totalMessages,
      totalConversations,
      totalTokensUsed,
      totalCost,
      averageResponseTime,
      mostUsedModels,
      dailyUsage,
      searchUsage,
      reasoningUsage,
      promptUsage,
      conversationActivity,
    };
  }

  private static calculateModelUsage(messages: any[]): ModelUsage[] {
    const modelMap = new Map<string, ModelUsage>();

    // All messages in the result have chat_ai_respond_id (AI responses)
    // model_key comes from chat_ai_respond table
    messages.forEach((msg) => {
      if (msg.model_key) {
        const key = msg.model_key;
        const existing = modelMap.get(key);

        const tokens = msg.token_usage
          ? (typeof msg.token_usage === "string" ? JSON.parse(msg.token_usage) : msg.token_usage)
              .total || 0
          : 0;
        const costPer1k = msg.cost_per_1k_token || 0.001;
        const cost = (tokens / 1000) * costPer1k;

        if (existing) {
          existing.count++;
          existing.tokensUsed += tokens;
          existing.cost += cost;
        } else {
          const displayName = msg.model_display_name || key;
          modelMap.set(key, {
            modelKey: key,
            displayName: displayName,
            count: 1,
            tokensUsed: tokens,
            cost: cost,
          });
        }
      }
    });

    return Array.from(modelMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static calculateDailyUsage(messages: any[], days: number): DailyUsage[] {
    interface InternalDailyUsage {
      date: string;
      messages: number;
      tokens: number;
      conversations: Set<string>;
      cost: number;
    }

    const dailyMap: Map<string, InternalDailyUsage> = new Map<string, InternalDailyUsage>();

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const entry: InternalDailyUsage = {
        date: dateStr,
        messages: 0,
        tokens: 0,
        conversations: new Set<string>(),
        cost: 0,
      };
      dailyMap.set(dateStr, entry);
    }

    messages.forEach((msg) => {
      const dateStr = msg.created_at.toISOString().split("T")[0];
      const daily = dailyMap.get(dateStr);

      if (daily) {
        daily.messages++;
        if (msg.token_usage) {
          const tokenUsage =
            typeof msg.token_usage === "string" ? JSON.parse(msg.token_usage) : msg.token_usage;
          daily.tokens += tokenUsage.total || 0;
        }
        if (msg.model_key) {
          const costPer1k = msg.cost_per_1k_token || 0.001;
          const tokens = msg.token_usage
            ? (typeof msg.token_usage === "string" ? JSON.parse(msg.token_usage) : msg.token_usage)
                .total || 0
            : 0;
          daily.cost += (tokens / 1000) * costPer1k;
        }
        daily.conversations.add(msg.conversation_id);
      }
    });

    return Array.from(dailyMap.values()).map(
      (d): DailyUsage => ({
        date: d.date,
        messages: d.messages,
        tokens: d.tokens,
        conversations: d.conversations.size,
        cost: d.cost,
      })
    );
  }

  private static calculateSearchUsage(messages: any[]): SearchUsageStats {
    let webSearches = 0;
    let imageSearches = 0;
    let steamSearches = 0;

    messages.forEach((msg) => {
      if (msg.used_web_search) webSearches++;
      if (msg.used_image_search) imageSearches++;
      if (msg.used_steam) steamSearches++;
    });

    return {
      webSearches,
      imageSearches,
      steamSearches,
      totalSearches: webSearches + imageSearches + steamSearches,
    };
  }

  private static calculateReasoningUsage(messages: any[]): ReasoningUsageStats {
    let minimal = 0;
    let low = 0;
    let medium = 0;
    let high = 0;

    messages.forEach((msg) => {
      if (msg.reasoning_effort) {
        switch (msg.reasoning_effort.toLowerCase()) {
          case "minimal":
            minimal++;
            break;
          case "low":
            low++;
            break;
          case "medium":
            medium++;
            break;
          case "high":
            high++;
            break;
        }
      }
    });

    return {
      minimal,
      low,
      medium,
      high,
      total: minimal + low + medium + high,
    };
  }

  private static calculatePromptUsage(messages: any[]): PromptUsage[] {
    const promptMap = new Map<string, PromptUsage>();

    messages.forEach((msg) => {
      if (msg.prompt_id && msg.prompt_name) {
        const existing = promptMap.get(msg.prompt_id);

        if (existing) {
          existing.count++;
        } else {
          promptMap.set(msg.prompt_id, {
            promptId: msg.prompt_id,
            name: msg.prompt_name,
            count: 1,
          });
        }
      }
    });

    return Array.from(promptMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static calculateConversationActivity(
    conversations: any[],
    messages: any[]
  ): ConversationActivity[] {
    const activityMap = new Map<string, ConversationActivity>();

    messages.forEach((msg) => {
      const existing = activityMap.get(msg.conversation_id);

      if (existing) {
        existing.messageCount++;
        existing.lastActive =
          msg.created_at > existing.lastActive ? msg.created_at : existing.lastActive;
      } else {
        activityMap.set(msg.conversation_id, {
          conversationId: msg.conversation_id,
          title: msg.title || "Untitled",
          messageCount: 1,
          lastActive: msg.created_at,
        });
      }
    });

    return Array.from(activityMap.values())
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
      .slice(0, 10);
  }

  /**
   * Count unique AI models used by a user
   * @param userUuid - User UUID
   * @returns Number of unique AI models used
   */
  static async countUniqueModelsUsed(userUuid: string): Promise<number> {
    return await analyticsQuery.countUniqueModelsUsed(userUuid);
  }
}
