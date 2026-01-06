import { sql } from "@/database/db";
import type {
  UserSelectedModels,
  CreateSelectionRequest,
  UpdateSelectionRequest,
} from "./selection_type";

export async function getSelectionByUserUUID(
  user_uuid: string
): Promise<UserSelectedModels | null> {
  const result = await sql`
    SELECT preset, user_uuid, ai_model_ids, prompt_id, searchable, created_at, updated_at
    FROM user_selected_models
    WHERE user_uuid = ${user_uuid}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as UserSelectedModels;
}

export async function getSelectionByPreset(preset: number): Promise<UserSelectedModels | null> {
  const result = await sql`
    SELECT preset, user_uuid, ai_model_ids, prompt_id, searchable, created_at, updated_at
    FROM user_selected_models
    WHERE preset = ${preset}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as UserSelectedModels;
}

export async function getAllSelections(): Promise<UserSelectedModels[]> {
  const result = await sql`
    SELECT preset, user_uuid, ai_model_ids, prompt_id, searchable, created_at, updated_at
    FROM user_selected_models
    ORDER BY created_at DESC
  `;
  return result as unknown as UserSelectedModels[];
}

export async function createSelection(data: CreateSelectionRequest): Promise<UserSelectedModels> {
  const result = await sql`
    INSERT INTO user_selected_models (user_uuid, ai_model_ids, prompt_id, searchable, created_at, updated_at)
    VALUES (${data.user_uuid}, ${JSON.stringify(data.ai_model_ids)}, ${data.prompt_id || null}, ${
    data.searchable ?? true
  }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING preset, user_uuid, ai_model_ids, prompt_id, searchable, created_at, updated_at
  `;
  return result[0] as unknown as UserSelectedModels;
}

export async function updateSelection(
  preset: number,
  data: UpdateSelectionRequest
): Promise<UserSelectedModels | null> {
  const setParts = [];
  const values = [];

  if (data.ai_model_ids !== undefined) {
    setParts.push(`ai_model_ids = $${values.length + 1}`);
    values.push(JSON.stringify(data.ai_model_ids));
  }
  if (data.prompt_id !== undefined) {
    setParts.push(`prompt_id = $${values.length + 1}`);
    values.push(data.prompt_id);
  }
  if (data.searchable !== undefined) {
    setParts.push(`searchable = $${values.length + 1}`);
    values.push(data.searchable);
  }

  if (setParts.length === 0) return getSelectionByPreset(preset);

  setParts.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `UPDATE user_selected_models SET ${setParts.join(", ")} WHERE preset = $${
    values.length + 1
  } RETURNING preset, user_uuid, ai_model_ids, prompt_id, searchable, created_at, updated_at`;

  const result = await sql.unsafe(query, [...values, preset]);

  if (result.length === 0) return null;
  return result[0] as unknown as UserSelectedModels;
}

export async function deleteSelection(preset: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM user_selected_models
    WHERE preset = ${preset}
  `;
  return (result as any).rowCount > 0;
}

export async function deleteSelectionByUserUUID(user_uuid: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM user_selected_models
    WHERE user_uuid = ${user_uuid}
  `;
  return (result as any).rowCount > 0;
}
