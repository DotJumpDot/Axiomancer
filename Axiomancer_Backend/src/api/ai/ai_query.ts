import { sql } from "@/database/db";
import type { AiModel, CreateAiModelRequest, UpdateAiModelRequest } from "./ai_type";

export async function getAiModels(): Promise<AiModel[]> {
  const result = await sql`
    SELECT id, provider, model_key, display_name, context_length, cost_per_1k_token, capabilities, enabled, created_at, updated_at
    FROM ai_model
    ORDER BY created_at DESC
  `;
  return result as unknown as AiModel[];
}

export async function getAiModelById(id: string): Promise<AiModel | null> {
  const result = await sql`
    SELECT id, provider, model_key, display_name, context_length, cost_per_1k_token, capabilities, enabled, created_at, updated_at
    FROM ai_model
    WHERE id = ${id}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as AiModel;
}

export async function createAiModel(data: CreateAiModelRequest): Promise<AiModel> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO ai_model (id, provider, model_key, display_name, context_length, cost_per_1k_token, capabilities, enabled, created_at, updated_at)
    VALUES (${id}, ${data.provider}, ${data.model_key}, ${data.display_name}, ${
    data.context_length
  }, ${data.cost_per_1k_token}, ${JSON.stringify(data.capabilities)}, ${
    data.enabled ?? true
  }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, provider, model_key, display_name, context_length, cost_per_1k_token, capabilities, enabled, created_at, updated_at
  `;
  return result[0] as unknown as AiModel;
}

export async function updateAiModel(
  id: string,
  data: UpdateAiModelRequest
): Promise<AiModel | null> {
  const setParts = [];
  const values = [];
  if (data.provider !== undefined) {
    setParts.push("provider = $" + (values.length + 1));
    values.push(data.provider);
  }
  if (data.model_key !== undefined) {
    setParts.push("model_key = $" + (values.length + 1));
    values.push(data.model_key);
  }
  if (data.display_name !== undefined) {
    setParts.push("display_name = $" + (values.length + 1));
    values.push(data.display_name);
  }
  if (data.context_length !== undefined) {
    setParts.push("context_length = $" + (values.length + 1));
    values.push(data.context_length);
  }
  if (data.cost_per_1k_token !== undefined) {
    setParts.push("cost_per_1k_token = $" + (values.length + 1));
    values.push(data.cost_per_1k_token);
  }
  if (data.capabilities !== undefined) {
    setParts.push("capabilities = $" + (values.length + 1));
    values.push(JSON.stringify(data.capabilities));
  }
  if (data.enabled !== undefined) {
    setParts.push("enabled = $" + (values.length + 1));
    values.push(data.enabled);
  }
  if (setParts.length === 0) return getAiModelById(id);

  setParts.push("updated_at = CURRENT_TIMESTAMP");
  const query = `UPDATE ai_model SET ${setParts.join(", ")} WHERE id = $${
    values.length + 1
  } RETURNING id, provider, model_key, display_name, context_length, cost_per_1k_token, capabilities, enabled, created_at, updated_at`;
  values.push(id);
  const result = await sql.unsafe(query, values);
  if (result.length === 0) return null;
  return result[0] as unknown as AiModel;
}

export async function deleteAiModel(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM ai_model WHERE id = ${id}
  `;
  return result.count > 0;
}
