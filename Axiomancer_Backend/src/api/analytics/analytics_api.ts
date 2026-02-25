import { Elysia } from "elysia";
import { AnalyticsService } from "./analytics_service";

export const analyticsApi = new Elysia({ prefix: "/api", tags: ["Analytics"] })
  .get("/analytics", async (context: any) => {
    const { auth, query } = context;

    try {
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authentication required",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const days = parseInt(query.days) || 30;
      const analytics = await AnalyticsService.getAnalytics(auth.user.uuid, days);

      return new Response(JSON.stringify({ success: true, data: analytics }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[Analytics API] GET /api/analytics: Error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Failed to get analytics",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })
  .get("/analytics/models/count", async (context: any) => {
    const { auth } = context;

    try {
      if (!auth?.user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authentication required",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const count = await AnalyticsService.countUniqueModelsUsed(auth.user.uuid);

      return new Response(JSON.stringify({ success: true, count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[Analytics API] GET /api/analytics/models/count: Error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Failed to count models",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
