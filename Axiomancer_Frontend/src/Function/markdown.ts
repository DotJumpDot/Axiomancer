// Markdown processing utilities
import { extractCodeBlocks } from "./formatters";

// Simple markdown to HTML converter (basic subset)
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities first
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Code blocks (triple backticks)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || "text";
    return `<pre class="code-block" data-language="${language}"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
  );

  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/(<li class="md-li">.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li-ordered">$1</li>');
  html = html.replace(/(<li class="md-li-ordered">.*<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="md-hr" />');

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br />");

  // Wrap in paragraph
  if (!html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }

  return html;
}

// Check if text contains code blocks
export function hasCodeBlocks(text: string): boolean {
  return /```[\s\S]*?```/.test(text);
}

// Get code block languages from text
export function getCodeLanguages(text: string): string[] {
  const blocks = extractCodeBlocks(text);
  return [...new Set(blocks.map((b) => b.language))];
}

// Strip markdown formatting
export function stripMarkdown(markdown: string): string {
  let text = markdown;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "");

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove bold/italic
  text = text.replace(/\*\*(.+?)\*\*/g, "$1");
  text = text.replace(/__(.+?)__/g, "$1");
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text.replace(/_(.+?)_/g, "$1");

  // Remove links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove headers
  text = text.replace(/^#+\s/gm, "");

  // Remove list markers
  text = text.replace(/^[*-]\s/gm, "");
  text = text.replace(/^\d+\.\s/gm, "");

  // Remove blockquotes
  text = text.replace(/^>\s/gm, "");

  return text.trim();
}

// Detect content type from message
export function detectContentType(
  content: string
): "code" | "reasoning" | "creative" | "vision" | "general" {
  const lowerContent = content.toLowerCase();

  // Check for code indicators
  if (
    hasCodeBlocks(content) ||
    /\b(function|class|const|let|var|import|export|def |async|await)\b/.test(content) ||
    /\b(write|create|fix|debug|implement|refactor)\s+(code|function|class|program|script)\b/.test(
      lowerContent
    )
  ) {
    return "code";
  }

  // Check for reasoning/analysis indicators
  if (
    /\b(analyze|explain|why|how|compare|evaluate|reason|logic|proof|calculate|solve)\b/.test(
      lowerContent
    )
  ) {
    return "reasoning";
  }

  // Check for creative indicators
  if (
    /\b(write|create|compose|story|poem|creative|imagine|fiction|narrative)\b/.test(lowerContent)
  ) {
    return "creative";
  }

  // Check for image/vision indicators
  if (
    /\b(image|picture|photo|visual|look at|describe this|what is in|show me)\b/.test(lowerContent)
  ) {
    return "vision";
  }

  return "general";
}
