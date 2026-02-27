import { Elysia, t } from "elysia";
import * as favoriteService from "./favorite_service";

export const favoriteApi = new Elysia({ prefix: "/api/favorites", tags: ["Favorite"] })
  // All routes require dual authentication (JWT + API Key)
  // Auth context is set by global middleware in index.ts

  // Get user favorites
  .get("/:userUuid", async (context: any) => {
    const { params, auth } = context;
    if (!auth?.user) {
      return {
        error: "Authentication required. Please provide both JWT token and API key.",
        status: 401,
      };
    }

    // Verify user can only access their own favorites
    if (auth.user.uuid !== params.userUuid) {
      return {
        error: "Unauthorized. You can only access your own favorites.",
        status: 403,
      };
    }

    const favorites = await favoriteService.getOrCreateFavorites(params.userUuid);
    return favorites;
  })

  // Update user favorites (full replace)
  .put(
    "/:userUuid",
    async (context: any) => {
      const { params, body, auth } = context;
      if (!auth?.user) {
        return {
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      // Verify user can only update their own favorites
      if (auth.user.uuid !== params.userUuid) {
        return {
          error: "Unauthorized. You can only update your own favorites.",
          status: 403,
        };
      }

      const favorites = await favoriteService.updateFavorites(params.userUuid, body);
      return favorites;
    },
    {
      body: t.Object({
        favorite_models: t.Optional(t.Array(t.String())),
        favorite_prompts: t.Optional(t.Array(t.String())),
        favorite_conversation: t.Optional(t.Array(t.String())),
      }),
    }
  )

  // Add to favorites
  .post(
    "/:userUuid/add",
    async (context: any) => {
      const { params, body, auth } = context;
      if (!auth?.user) {
        return {
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      // Verify user can only modify their own favorites
      if (auth.user.uuid !== params.userUuid) {
        return {
          error: "Unauthorized. You can only modify your own favorites.",
          status: 403,
        };
      }

      const favorites = await favoriteService.addToFavorite(params.userUuid, body);
      return favorites;
    },
    {
      body: t.Object({
        model_key: t.Optional(t.String()),
        prompt_id: t.Optional(t.String()),
        conversation_id: t.Optional(t.String()),
      }),
    }
  )

  // Remove from favorites
  .post(
    "/:userUuid/remove",
    async (context: any) => {
      const { params, body, auth } = context;
      if (!auth?.user) {
        return {
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      // Verify user can only modify their own favorites
      if (auth.user.uuid !== params.userUuid) {
        return {
          error: "Unauthorized. You can only modify your own favorites.",
          status: 403,
        };
      }

      const favorites = await favoriteService.removeFromFavorite(params.userUuid, body);
      return favorites;
    },
    {
      body: t.Object({
        model_key: t.Optional(t.String()),
        prompt_id: t.Optional(t.String()),
        conversation_id: t.Optional(t.String()),
      }),
    }
  )

  // Delete user favorites
  .delete("/:userUuid", async (context: any) => {
    const { params, auth } = context;
    if (!auth?.user) {
      return {
        error: "Authentication required. Please provide both JWT token and API key.",
        status: 401,
      };
    }

    // Verify user can only delete their own favorites
    if (auth.user.uuid !== params.userUuid) {
      return {
        error: "Unauthorized. You can only delete your own favorites.",
        status: 403,
      };
    }

    await favoriteService.deleteFavorites(params.userUuid);
    return { message: "Favorites deleted successfully" };
  });
