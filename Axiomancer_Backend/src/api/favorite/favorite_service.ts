import * as favoriteQuery from "./favorite_query";
import type {
  UserFavorite,
  CreateUserFavoriteRequest,
  UpdateUserFavoriteRequest,
  AddToFavoriteRequest,
  RemoveFromFavoriteRequest,
} from "./favorite_type";

// * Get or create user favorites
export async function getOrCreateFavorites(userUuid: string): Promise<UserFavorite> {
  let favorites = await favoriteQuery.getFavoriteByUserUUID(userUuid);

  if (!favorites) {
    // Create default favorites for new user
    favorites = await favoriteQuery.createFavorite({
      user_uuid: userUuid,
      favorite_models: [],
      favorite_prompts: [],
      favorite_conversation: [],
    });
  }

  return favorites;
}

// * Get user favorites
export async function getFavorites(userUuid: string): Promise<UserFavorite | null> {
  return await favoriteQuery.getFavoriteByUserUUID(userUuid);
}

// * Update user favorites
export async function updateFavorites(
  userUuid: string,
  data: UpdateUserFavoriteRequest
): Promise<UserFavorite> {
  // Ensure favorite record exists
  await getOrCreateFavorites(userUuid);

  return await favoriteQuery.updateFavorite(userUuid, data);
}

// * Add item to favorites
export async function addToFavorite(
  userUuid: string,
  data: AddToFavoriteRequest
): Promise<UserFavorite> {
  const favorites = await getOrCreateFavorites(userUuid);

  const updates: UpdateUserFavoriteRequest = {};

  if (data.model_key) {
    if (!favorites.favorite_models.includes(data.model_key)) {
      updates.favorite_models = [...favorites.favorite_models, data.model_key];
    } else {
      // Already favorited, return current state
      return favorites;
    }
  }

  if (data.prompt_id) {
    if (!favorites.favorite_prompts.includes(data.prompt_id)) {
      updates.favorite_prompts = [...favorites.favorite_prompts, data.prompt_id];
    } else {
      return favorites;
    }
  }

  if (data.conversation_id) {
    if (!favorites.favorite_conversation.includes(data.conversation_id)) {
      updates.favorite_conversation = [...favorites.favorite_conversation, data.conversation_id];
    } else {
      return favorites;
    }
  }

  if (Object.keys(updates).length === 0) {
    return favorites;
  }

  return await favoriteQuery.updateFavorite(userUuid, updates);
}

// * Remove item from favorites
export async function removeFromFavorite(
  userUuid: string,
  data: RemoveFromFavoriteRequest
): Promise<UserFavorite> {
  const favorites = await getOrCreateFavorites(userUuid);

  const updates: UpdateUserFavoriteRequest = {};

  if (data.model_key) {
    updates.favorite_models = favorites.favorite_models.filter((m) => m !== data.model_key);
  }

  if (data.prompt_id) {
    updates.favorite_prompts = favorites.favorite_prompts.filter((p) => p !== data.prompt_id);
  }

  if (data.conversation_id) {
    updates.favorite_conversation = favorites.favorite_conversation.filter(
      (c) => c !== data.conversation_id
    );
  }

  if (Object.keys(updates).length === 0) {
    return favorites;
  }

  return await favoriteQuery.updateFavorite(userUuid, updates);
}

// * Delete user favorites
export async function deleteFavorites(userUuid: string): Promise<void> {
  await favoriteQuery.deleteFavorite(userUuid);
}
