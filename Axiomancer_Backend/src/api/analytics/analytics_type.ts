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
  promptUsage: PromptUsage[];
  conversationActivity: ConversationActivity[];
}

export interface ModelUsage {
  modelKey: string;
  displayName: string;
  count: number;
  tokensUsed: number;
  cost: number;
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
