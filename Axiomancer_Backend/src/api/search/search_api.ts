// DuckDuckGo Search Integration
// This file is maintained by duckduckgo/ subfolder
// See duckduckgo/duckduckgo_service.ts for the DuckDuckGoService implementation

// Pixabay Image Search Integration
// This file is maintained by pixabay/ subfolder
// See pixabay/pixabay_service.ts for the PixabayService implementation

export { DuckDuckGoService } from "./duckduckgo/duckduckgo_service";
export type { DuckDuckGoResult, DuckDuckGoResponse } from "./duckduckgo/duckduckgo_type";

export { PixabayService } from "./pixabay/pixabay_service";
export type { PixabayImage, PixabayResponse } from "./pixabay/pixabay_type";

import { Elysia, t } from "elysia";
import { duckduckgoApi } from "./duckduckgo/duckduckgo_api";
import { pixabayApi } from "./pixabay/pixabay_api";
import { DuckDuckGoService } from "./duckduckgo/duckduckgo_service";
import { PixabayService } from "./pixabay/pixabay_service";

export const searchApi = new Elysia({ prefix: "/api/search", tags: ["Search"] })
  // Register sub-APIs
  .use(duckduckgoApi)
  .use(pixabayApi)
  // Batch Search (both DuckDuckGo and Pixabay)
  .post(
    "/batch",
    async ({ body }) => {
      try {
        const query = body.query as string;
        const includeDuckDuckGo = body.includeDuckDuckGo !== false;
        const includePixabay = body.includePixabay || false;
        const duckduckgoLimit = (body.duckduckgoLimit || 10) as number;
        const pixabayLimit = (body.pixabayLimit || 20) as number;

        if (!query || query.trim().length === 0) {
          return {
            success: false,
            error: "Search query is required",
          };
        }

        const results: {
          duckduckgo?: any;
          pixabay?: {
            success: boolean;
            results: any[];
            count: number;
            error?: string;
          };
        } = {};

        // Execute searches in parallel
        const promises = [];

        if (includeDuckDuckGo) {
          promises.push(
            DuckDuckGoService.search(query, Math.min(duckduckgoLimit, 50)).then((res) => {
              results.duckduckgo = res;
            })
          );
        }

        if (includePixabay) {
          promises.push(
            PixabayService.search(query, Math.min(pixabayLimit, 200)).then((res) => {
              results.pixabay = {
                success: res.success,
                results: res.results,
                count: res.results.length,
                error: res.error,
              };
            })
          );
        }

        await Promise.all(promises);

        return {
          success: true,
          query,
          results,
        };
      } catch (error) {
        return {
          success: false,
          query: (body.query || "") as string,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        query: t.String(),
        includeDuckDuckGo: t.Optional(t.Boolean()),
        includePixabay: t.Optional(t.Boolean()),
        duckduckgoLimit: t.Optional(t.Number()),
        pixabayLimit: t.Optional(t.Number()),
      }),
    }
  );
