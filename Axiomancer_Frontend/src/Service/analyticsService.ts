import apiClient from "./apiClient";

export interface AnalyticsData {
  totalMessages: number;
  totalConversations: number;
  totalTokensUsed: number;
  totalCost: number;
  averageResponseTime: number;
  mostUsedModels: ModelUsage[];
  dailyUsage: DailyUsage[];
  searchUsage: SearchUsageStats;
  reasoningUsage: ReasoningUsageStats;
  enhanceUsage: EnhanceUsageStats;
  promptUsage: PromptUsage[];
  conversationActivity: ConversationActivity[];
}

export interface ModelUsage {
  modelKey: string;
  displayName: string;
  count: number;
  tokensUsed: number;
  cost: number;
  inputCost: number;
  outputCost: number;
}

export interface DailyUsage {
  date: string;
  messages: number;
  tokens: number;
  conversations: number;
  cost: number;
}

export interface SearchUsageStats {
  webSearches: number;
  imageSearches: number;
  steamSearches: number;
  totalSearches: number;
}

export interface ReasoningUsageStats {
  minimal: number;
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface EnhanceUsageStats {
  totalEnhances: number;
  webSearchEnhances: number;
  imageSearchEnhances: number;
  freeModelEnhances: number;
  paidModelEnhances: number;
  totalTokensUsed: number;
  totalCost: number;
  averageLatency: number;
  topModels: EnhanceModelUsage[];
}

export interface EnhanceModelUsage {
  modelKey: string;
  displayName: string;
  count: number;
  tokensUsed: number;
  cost: number;
  isFree: boolean;
}

export interface PromptUsage {
  promptId: string;
  name: string;
  count: number;
}

export interface ConversationActivity {
  conversationId: string;
  title: string;
  messageCount: number;
  lastActive: string;
}

export const analyticsService = {
  async getAnalytics(days: number = 30) {
    return apiClient.get<AnalyticsData>("/api/analytics", { params: { days } });
  },

  async countUniqueModelsUsed() {
    return apiClient.get<{ success: boolean; count: number }>("/api/analytics/models/count");
  },
};
