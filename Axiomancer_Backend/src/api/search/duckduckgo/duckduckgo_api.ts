import { Elysia, t } from "elysia";
import { DuckDuckGoService } from "./duckduckgo_service";

export const duckduckgoApi = new Elysia({
  prefix: "/api/search/duckduckgo",
  tags: ["Search - DuckDuckGo"],
})
  // DuckDuckGo Web Search
  .post(
    "/",
    async ({ body }) => {
      try {
        const query = body.query as string;
        const limit = (body.limit || 10) as number;

        if (!query || query.trim().length === 0) {
          return {
            success: false,
            error: "Search query is required",
          };
        }

        const results = await DuckDuckGoService.search(query, Math.min(limit, 50));

        return results;
      } catch (error) {
        return {
          success: false,
          query: (body.query || "") as string,
          results: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        query: t.String(),
        limit: t.Optional(t.Number()),
      }),
    }
  );
