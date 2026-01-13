import { sql } from "@/database/db";
import type {
  UserFavorite,
  CreateUserFavoriteRequest,
  UpdateUserFavoriteRequest,
} from "./favorite_type";

// * Get user favorites by user UUID
export async function getFavoriteByUserUUID(userUuid: string): Promise<UserFavorite | null> {
  const result = await sql`SELECT * FROM user_favorite WHERE user_uuid = ${userUuid}`;

  if (result.length === 0) {
    return null;
  }

  return result[0] as UserFavorite;
}

// * Create new user favorite record
export async function createFavorite(data: CreateUserFavoriteRequest): Promise<UserFavorite> {
  const result = await sql`
    INSERT INTO user_favorite (user_uuid, favorite_models, favorite_prompts, favorite_conversation, created_at, updated_at)
    VALUES (
      ${data.user_uuid},
      ${data.favorite_models || []},
      ${data.favorite_prompts || []},
      ${data.favorite_conversation || []},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `;

  return result[0] as UserFavorite;
}

// * Update user favorites
export async function updateFavorite(
  userUuid: string,
  data: UpdateUserFavoriteRequest
): Promise<UserFavorite> {
  const updates: any = { updated_at: sql`CURRENT_TIMESTAMP` };

  if (data.favorite_models !== undefined) {
    updates.favorite_models = data.favorite_models;
  }

  if (data.favorite_prompts !== undefined) {
    updates.favorite_prompts = data.favorite_prompts;
  }

  if (data.favorite_conversation !== undefined) {
    updates.favorite_conversation = data.favorite_conversation;
  }

  const result = await sql`
    UPDATE user_favorite 
    SET ${sql(updates)}
    WHERE user_uuid = ${userUuid}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new Error("Favorite record not found");
  }

  return result[0] as UserFavorite;
}

// * Delete user favorite record
export async function deleteFavorite(userUuid: string): Promise<void> {
  await sql`DELETE FROM user_favorite WHERE user_uuid = ${userUuid}`;
}
