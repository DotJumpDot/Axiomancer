export interface DuckDuckGoResult {
  title: string;
  url: string;
  description?: string;
}

export interface DuckDuckGoResponse {
  success: boolean;
  query: string;
  results: DuckDuckGoResult[];
  abstract?: string;
  abstractURL?: string;
  error?: string;
}

export interface SearchDuckDuckGoRequest {
  query: string;
  limit?: number;
}

// DuckDuckGo Instant Answer API raw response
export interface DuckDuckGoApiResponse {
  Abstract?: string;
  AbstractText?: string;
  AbstractSource?: string;
  AbstractURL?: string;
  Image?: string;
  Heading?: string;
  Answer?: string;
  AnswerType?: string;
  Definition?: string;
  DefinitionSource?: string;
  DefinitionURL?: string;
  RelatedTopics?: Array<{
    FirstURL?: string;
    Icon?: { URL?: string; Height?: string; Width?: string };
    Result?: string;
    Text?: string;
    Name?: string;
    Topics?: Array<{
      FirstURL?: string;
      Icon?: { URL?: string; Height?: string; Width?: string };
      Result?: string;
      Text?: string;
    }>;
  }>;
  Results?: Array<{
    FirstURL?: string;
    Icon?: { URL?: string; Height?: string; Width?: string };
    Result?: string;
    Text?: string;
  }>;
  Type?: string;
  Redirect?: string;
}
