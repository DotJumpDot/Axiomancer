import { Elysia, t } from "elysia";
import * as favoriteService from "./favorite_service";

export const favoriteApi = new Elysia({ prefix: "/api/favorites" })
  // Get user favorites
  .get("/:userUuid", async ({ params: { userUuid } }) => {
    const favorites = await favoriteService.getOrCreateFavorites(userUuid);
    return favorites;
  })

  // Update user favorites (full replace)
  .put(
    "/:userUuid",
    async ({ params: { userUuid }, body }) => {
      const favorites = await favoriteService.updateFavorites(userUuid, body as any);
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
    async ({ params: { userUuid }, body }) => {
      const favorites = await favoriteService.addToFavorite(userUuid, body as any);
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
    async ({ params: { userUuid }, body }) => {
      const favorites = await favoriteService.removeFromFavorite(userUuid, body as any);
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
  .delete("/:userUuid", async ({ params: { userUuid } }) => {
    await favoriteService.deleteFavorites(userUuid);
    return { message: "Favorites deleted successfully" };
  });
