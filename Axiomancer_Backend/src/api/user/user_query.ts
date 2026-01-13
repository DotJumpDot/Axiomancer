import { sql } from "@/database/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import type { User, CreateUserRequest, UpdateUserRequest } from "./user_type";

const SALT_ROUNDS = 10;

export async function getUsers(): Promise<User[]> {
  const result = await sql`
    SELECT id, uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at
    FROM "user"
    ORDER BY created_at DESC
  `;
  return result as unknown as User[];
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await sql`
    SELECT id, uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at
    FROM "user"
    WHERE id = ${id}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as User;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await sql`
    SELECT id, uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at
    FROM "user"
    WHERE username = ${username}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as User;
}

export async function getUserByUUID(uuid: string): Promise<User | null> {
  const result = await sql`
    SELECT id, uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at
    FROM "user"
    WHERE uuid = ${uuid}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as User;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const uuid = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const result = await sql`
    INSERT INTO "user" (uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at)
    VALUES (${uuid}, ${data.username}, ${hashedPassword}, ${data.email}, ${
    data.firstname ?? null
  }, ${data.lastname ?? null}, ${data.nickname ?? null}, ${data.role ?? "user"}, ${
    data.tel ?? null
  }, 'userUnidentified.png', ${
    data.openrouter_api_key ?? null
  }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at
  `;
  return result[0] as unknown as User;
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<User | null> {
  const setParts = [];
  const values = [];

  if (data.email !== undefined) {
    setParts.push("email = $" + (values.length + 1));
    values.push(data.email);
  }
  if (data.firstname !== undefined) {
    setParts.push("firstname = $" + (values.length + 1));
    values.push(data.firstname);
  }
  if (data.lastname !== undefined) {
    setParts.push("lastname = $" + (values.length + 1));
    values.push(data.lastname);
  }
  if (data.nickname !== undefined) {
    setParts.push("nickname = $" + (values.length + 1));
    values.push(data.nickname);
  }
  if (data.role !== undefined) {
    setParts.push("role = $" + (values.length + 1));
    values.push(data.role);
  }
  if (data.tel !== undefined) {
    setParts.push("tel = $" + (values.length + 1));
    values.push(data.tel);
  }
  if (data.password !== undefined) {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    setParts.push("password = $" + (values.length + 1));
    values.push(hashedPassword);
  }
  if (data.openrouter_api_key !== undefined) {
    setParts.push("openrouter_api_key = $" + (values.length + 1));
    values.push(data.openrouter_api_key);
  }

  if (setParts.length === 0) return getUserById(id);

  setParts.push("updated_at = CURRENT_TIMESTAMP");
  const query = `UPDATE "user" SET ${setParts.join(", ")} WHERE id = $${
    values.length + 1
  } RETURNING id, uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at`;
  values.push(id);
  const result = await sql.unsafe(query, values);
  if (result.length === 0) return null;
  return result[0] as unknown as User;
}

export async function updateUserPicture(id: number, pictureUrl: string): Promise<User | null> {
  const result = await sql`
    UPDATE "user"
    SET picture_url = ${pictureUrl}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, uuid, username, password, email, firstname, lastname, nickname, role, tel, picture_url, openrouter_api_key, created_at, updated_at
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as User;
}

export async function deleteUser(id: number): Promise<boolean> {
  // First get the user's UUID
  const user = await getUserById(id);
  if (!user) return false;

  // Delete related records in correct order to avoid foreign key violations
  // 1. Delete user_favorite records
  await sql`
    DELETE FROM user_favorite WHERE user_uuid = ${user.uuid}
  `;

  // 2. Delete user_selected_models records
  await sql`
    DELETE FROM user_selected_models WHERE user_uuid = ${user.uuid}
  `;

  // 3. Delete chat messages in conversations owned by this user
  await sql`
    DELETE FROM chat WHERE conversation_id IN (
      SELECT id FROM conversation WHERE user_uuid = ${user.uuid}
    )
  `;

  // 4. Delete conversations owned by this user
  await sql`
    DELETE FROM conversation WHERE user_uuid = ${user.uuid}
  `;

  // 5. Delete prompt profiles owned by this user
  await sql`
    DELETE FROM prompt_profile WHERE user_uuid = ${user.uuid}
  `;

  // 6. Finally delete the user
  const result = await sql`
    DELETE FROM "user" WHERE id = ${id}
  `;
  return result.count > 0;
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
