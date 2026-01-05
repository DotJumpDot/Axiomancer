// Formatters for displaying data in the UI

// Format date relative to now
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}

// Format date to locale string
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString(undefined, options);
}

// Format date and time
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}

// Format token count
export function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(2)}M`;
}

// Format latency in milliseconds
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Format cost in USD
export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Format model name for display
export function formatModelName(modelKey: string): string {
  // Extract model name from key like "openai/gpt-4" or "anthropic/claude-3"
  const parts = modelKey.split("/");
  return parts[parts.length - 1];
}

// Format provider name
export function formatProviderName(provider: string): string {
  const providerNames: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    meta: "Meta",
    mistral: "Mistral AI",
    cohere: "Cohere",
    perplexity: "Perplexity",
  };
  return providerNames[provider.toLowerCase()] || provider;
}

// Format context length
export function formatContextLength(length: number): string {
  if (length < 1000) return `${length} tokens`;
  return `${(length / 1000).toFixed(0)}k context`;
}

// Format role for display
export function formatRole(role: string): string {
  const roleNames: Record<string, string> = {
    user: "You",
    assistant: "AI",
    system: "System",
  };
  return roleNames[role.toLowerCase()] || role;
}

// Format routing mode
export function formatRoutingMode(mode: string): string {
  return mode === "auto" ? "Auto-routed" : "Manual";
}

// Extract code blocks from markdown
export function extractCodeBlocks(text: string): { language: string; code: string }[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string }[] = [];

  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    });
  }

  return blocks;
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
