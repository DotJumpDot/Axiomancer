import { sql } from "../../database/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import type { ApiKey, Session, CreateApiKeyRequest } from "./auth_type";

const API_KEY_SALT_ROUNDS = 10;
const SESSION_SALT_ROUNDS = 10;

// API Key operations
export async function createApiKey(
  userId: number,
  data: CreateApiKeyRequest
): Promise<{ apiKey: ApiKey; plainKey: string }> {
  const keyId = crypto.randomUUID();
  const plainKey = `ak_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = await bcrypt.hash(plainKey, API_KEY_SALT_ROUNDS);

  const expiresAt = data.expires_in_days
    ? new Date(Date.now() + data.expires_in_days * 24 * 60 * 60 * 1000)
    : null;

  const result = await sql`
    INSERT INTO api_key (id, user_id, name, key_hash, permissions, expires_at, created_at, updated_at)
    VALUES (${keyId}, ${userId}, ${data.name}, ${keyHash}, ${JSON.stringify(
    data.permissions
  )}, ${expiresAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, user_id, name, key_hash, permissions, expires_at, last_used_at, created_at, updated_at
  `;

  return {
    apiKey: result[0] as unknown as ApiKey,
    plainKey,
  };
}

export async function getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
  const result = await sql`
    SELECT id, user_id, name, key_hash, permissions, expires_at, last_used_at, created_at, updated_at
    FROM api_key
    WHERE key_hash = ${keyHash}
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `;

  if (result.length === 0) return null;
  return result[0] as unknown as ApiKey;
}

export async function getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
  const result = await sql`
    SELECT id, user_id, name, key_hash, permissions, expires_at, last_used_at, created_at, updated_at
    FROM api_key
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return result as unknown as ApiKey[];
}

export async function updateApiKeyLastUsed(keyId: string): Promise<void> {
  await sql`
    UPDATE api_key
    SET last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${keyId}
  `;
}

export async function deleteApiKey(
  keyId: string,
  userId: number
): Promise<boolean> {
  const result = await sql`
    DELETE FROM api_key
    WHERE id = ${keyId} AND user_id = ${userId}
  `;

  return result.count > 0;
}

export async function verifyApiKey(plainKey: string): Promise<ApiKey | null> {
  // Extract the key part after 'ak_'
  if (!plainKey.startsWith("ak_")) {
    return null;
  }

  const keyPart = plainKey.substring(3);

  // Get all active API keys and check against them
  const result = await sql`
    SELECT id, user_id, name, key_hash, permissions, expires_at, last_used_at, created_at, updated_at
    FROM api_key
    WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP
  `;

  const apiKeys = result as unknown as ApiKey[];

  for (const apiKey of apiKeys) {
    const isValid = await bcrypt.compare(keyPart, apiKey.key_hash);
    if (isValid) {
      // Update last used timestamp
      await updateApiKeyLastUsed(apiKey.id);
      return apiKey;
    }
  }

  return null;
}

// Session operations
export async function createSession(
  userId: number,
  refreshToken: string
): Promise<Session> {
  const sessionId = crypto.randomUUID();
  const refreshTokenHash = await bcrypt.hash(refreshToken, SESSION_SALT_ROUNDS);

  // Set refresh token to expire in 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const result = await sql`
    INSERT INTO user_session (id, user_id, refresh_token_hash, expires_at, created_at, updated_at)
    VALUES (${sessionId}, ${userId}, ${refreshTokenHash}, ${expiresAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, user_id, refresh_token_hash, expires_at, created_at, updated_at
  `;

  return result[0] as unknown as Session;
}

export async function getSessionById(
  sessionId: string
): Promise<Session | null> {
  const result = await sql`
    SELECT id, user_id, refresh_token_hash, expires_at, created_at, updated_at
    FROM user_session
    WHERE id = ${sessionId}
    AND expires_at > CURRENT_TIMESTAMP
  `;

  if (result.length === 0) return null;
  return result[0] as unknown as Session;
}

export async function verifyRefreshToken(
  sessionId: string,
  refreshToken: string
): Promise<Session | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const isValid = await bcrypt.compare(
    refreshToken,
    session.refresh_token_hash
  );
  return isValid ? session : null;
}

export async function deleteSession(
  sessionId: string,
  userId: number
): Promise<boolean> {
  const result = await sql`
    DELETE FROM user_session
    WHERE id = ${sessionId} AND user_id = ${userId}
  `;

  return result.count > 0;
}

export async function deleteExpiredSessions(): Promise<void> {
  await sql`
    DELETE FROM user_session
    WHERE expires_at <= CURRENT_TIMESTAMP
  `;
}

export async function deleteAllUserSessions(userId: number): Promise<void> {
  await sql`
    DELETE FROM user_session
    WHERE user_id = ${userId}
  `;
}
