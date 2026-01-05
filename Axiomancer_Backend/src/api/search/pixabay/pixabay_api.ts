import { Elysia, t } from "elysia";
import { PixabayService } from "./pixabay_service";

export const pixabayApi = new Elysia({
  prefix: "/api/search/pixabay",
  tags: ["Search - Pixabay"],
})
  // Pixabay Image Search
  .post(
    "/",
    async ({ body }) => {
      try {
        const query = body.query as string;
        const limit = (body.limit || 20) as number;
        const imageType = (body.imageType || "photo") as "photo" | "illustration" | "vector";

        if (!query || query.trim().length === 0) {
          return {
            success: false,
            error: "Search query is required",
          };
        }

        const results = await PixabayService.search(query, Math.min(limit, 200), imageType);

        return {
          success: results.success,
          query,
          results: results.results,
          count: results.results.length,
          error: results.error,
        };
      } catch (error) {
        return {
          success: false,
          query: (body.query || "") as string,
          results: [],
          count: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        query: t.String(),
        limit: t.Optional(t.Number()),
        imageType: t.Optional(
          t.Union([t.Literal("photo"), t.Literal("illustration"), t.Literal("vector")])
        ),
      }),
    }
  );
