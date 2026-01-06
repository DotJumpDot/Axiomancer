import { sql } from "@/database/db";
import type {
  PromptProfile,
  CreatePromptProfileRequest,
  UpdatePromptProfileRequest,
} from "./prompt_type";

export async function getPromptProfiles(userUuid?: string): Promise<PromptProfile[]> {
  if (userUuid) {
    const result = await sql`
      SELECT id, user_uuid, name, description, system_prompt, created_at, updated_at
      FROM prompt_profile
      WHERE user_uuid = ${userUuid}
      ORDER BY created_at DESC
    `;
    return result as unknown as PromptProfile[];
  } else {
    const result = await sql`
      SELECT id, user_uuid, name, description, system_prompt, created_at, updated_at
      FROM prompt_profile
      WHERE user_uuid IS NULL
      ORDER BY created_at DESC
    `;
    return result as unknown as PromptProfile[];
  }
}

export async function getPromptProfileById(id: string): Promise<PromptProfile | null> {
  const result = await sql`
    SELECT id, user_uuid, name, description, system_prompt, created_at, updated_at
    FROM prompt_profile
    WHERE id = ${id}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as PromptProfile;
}

export async function createPromptProfile(
  data: CreatePromptProfileRequest,
  userUuid?: string
): Promise<PromptProfile> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO prompt_profile (id, user_uuid, name, description, system_prompt, created_at, updated_at)
    VALUES (${id}, ${userUuid ?? null}, ${data.name}, ${data.description ?? null}, ${
    data.system_prompt
  }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, user_uuid, name, description, system_prompt, created_at, updated_at
  `;
  return result[0] as unknown as PromptProfile;
}

export async function updatePromptProfile(
  id: string,
  data: UpdatePromptProfileRequest
): Promise<PromptProfile | null> {
  const setParts = [];
  const values = [];
  if (data.name !== undefined) {
    setParts.push("name = $" + (values.length + 1));
    values.push(data.name);
  }
  if (data.description !== undefined) {
    setParts.push("description = $" + (values.length + 1));
    values.push(data.description);
  }
  if (data.system_prompt !== undefined) {
    setParts.push("system_prompt = $" + (values.length + 1));
    values.push(data.system_prompt);
  }
  if (setParts.length === 0) return getPromptProfileById(id);

  setParts.push("updated_at = CURRENT_TIMESTAMP");
  const query = `UPDATE prompt_profile SET ${setParts.join(", ")} WHERE id = $${
    values.length + 1
  } RETURNING id, user_uuid, name, description, system_prompt, created_at, updated_at`;
  values.push(id);
  const result = await sql.unsafe(query, values);
  if (result.length === 0) return null;
  return result[0] as unknown as PromptProfile;
}

export async function deletePromptProfile(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM prompt_profile WHERE id = ${id}
  `;
  return result.count > 0;
}

export async function getAllPromptProfiles(): Promise<PromptProfile[]> {
  const result = await sql`
    SELECT id, user_uuid, name, description, system_prompt, created_at, updated_at
    FROM prompt_profile
    ORDER BY created_at DESC
  `;
  return result as unknown as PromptProfile[];
}
