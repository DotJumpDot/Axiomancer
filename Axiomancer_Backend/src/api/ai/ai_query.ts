import { sql } from "@/database/db";
import type { AiModel, CreateAiModelRequest, UpdateAiModelRequest } from "./ai_type";

export async function getAiModels(): Promise<AiModel[]> {
  const result = await sql`
    SELECT id, provider, model_key, display_name, description, context_length, pricing, capabilities, enabled, chat_type_to_type, created, expiration_date, created_at, updated_at
    FROM ai_model
    ORDER BY created_at DESC
  `;
  return result as unknown as AiModel[];
}

export async function getAiModelById(id: string): Promise<AiModel | null> {
  const result = await sql`
    SELECT id, provider, model_key, display_name, description, context_length, pricing, capabilities, enabled, chat_type_to_type, created, expiration_date, created_at, updated_at
    FROM ai_model
    WHERE id = ${id}
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as AiModel;
}

export async function getAiModelByModelKey(model_key: string): Promise<AiModel | null> {
  const result = await sql`
    SELECT id, provider, model_key, display_name, description, context_length, pricing, capabilities, enabled, chat_type_to_type, created, expiration_date, created_at, updated_at
    FROM ai_model
    WHERE model_key = ${model_key}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (result.length === 0) return null;
  return result[0] as unknown as AiModel;
}

export async function createAiModel(data: CreateAiModelRequest): Promise<AiModel> {
  const id = crypto.randomUUID();
  const expirationDateValue =
    data.expiration_date === null || data.expiration_date === undefined
      ? null
      : data.expiration_date;
  const result = await sql`
    INSERT INTO ai_model (id, provider, model_key, display_name, description, context_length, pricing, capabilities, enabled, chat_type_to_type, created, expiration_date, created_at, updated_at)
    VALUES (${id}, ${data.provider}, ${data.model_key}, ${data.display_name}, ${data.description ?? ""}, ${
      data.context_length
    }, ${sql.json(data.pricing as any)}::jsonb, ${sql.json(data.capabilities as any)}::jsonb, ${
      data.enabled ?? true
    }, ${data.chat_type_to_type ?? "unknown"}, ${data.created ?? 0}, ${expirationDateValue}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, provider, model_key, display_name, description, context_length, pricing, capabilities, enabled, chat_type_to_type, created, expiration_date, created_at, updated_at
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
  if (data.description !== undefined) {
    setParts.push("description = $" + (values.length + 1));
    values.push(data.description);
  }
  if (data.context_length !== undefined) {
    setParts.push("context_length = $" + (values.length + 1));
    values.push(data.context_length);
  }
  if (data.pricing !== undefined) {
    setParts.push("pricing = $" + (values.length + 1));
    values.push(JSON.stringify(data.pricing));
  }
  if (data.capabilities !== undefined) {
    setParts.push("capabilities = $" + (values.length + 1));
    values.push(JSON.stringify(data.capabilities));
  }
  if (data.enabled !== undefined) {
    setParts.push("enabled = $" + (values.length + 1));
    values.push(data.enabled);
  }
  if (data.chat_type_to_type !== undefined) {
    setParts.push("chat_type_to_type = $" + (values.length + 1));
    values.push(data.chat_type_to_type);
  }
  if (data.created !== undefined) {
    setParts.push("created = $" + (values.length + 1));
    values.push(data.created);
  }
  if (data.expiration_date !== undefined) {
    setParts.push("expiration_date = $" + (values.length + 1));
    const expirationDateValue = data.expiration_date === null ? null : data.expiration_date;
    values.push(expirationDateValue);
  }
  if (setParts.length === 0) return getAiModelById(id);

  setParts.push("updated_at = CURRENT_TIMESTAMP");
  const query = `UPDATE ai_model SET ${setParts.join(", ")} WHERE id = $${
    values.length + 1
  } RETURNING id, provider, model_key, display_name, description, context_length, pricing, capabilities, enabled, chat_type_to_type, created, expiration_date, created_at, updated_at`;
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

//* Get or create AI model by model key (auto-insert if missing)
export async function getOrCreateAiModel(modelKey: string): Promise<AiModel> {
  // First try to get existing model
  let model = await getAiModelByModelKey(modelKey);
  if (model) {
    return model;
  }

  // Model doesn't exist, fetch from OpenRouter API to get full data
  // console.log(`[AI Query] Auto-creating missing model: ${modelKey}`);

  try {
    // Import here to avoid circular dependency
    const { openRouterClient } = await import("./ai_openrouter");
    if (openRouterClient) {
      const response = await openRouterClient.getModels();
      const openRouterModel = response.data.find((m) => m.id === modelKey);

      if (openRouterModel) {
        // Import AiService to use mapping function
        const { AiService } = await import("./ai_service");
        const modelData = (AiService as any).mapOpenRouterModelToAiModel(openRouterModel);
        return await createAiModel(modelData);
      }
    }
  } catch (error) {
    console.warn(`[AI Query] Failed to fetch model from OpenRouter: ${error}`);
  }

  // Fallback: create model with default values
  // Extract provider from model key (e.g., "mistralai/devstral-2512:free" -> "mistralai")
  const provider = modelKey.split("/")[0] || "openrouter";

  // Create display name from model key
  const displayName = modelKey
    .replace(/\//g, " ")
    .replace(/:/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Create model with default values
  const newModel: CreateAiModelRequest = {
    provider,
    model_key: modelKey,
    display_name: displayName,
    description: "",
    context_length: 32768, // Default context length
    pricing: {
      prompt: "0.000001",
      completion: "0.000002",
      request: "0",
      image: "0",
    },
    capabilities: {
      reasoning: true,
      coding: true,
      vision: false,
      fast: true,
    },
    enabled: true,
    chat_type_to_type: "unknown",
    created: 0,
    expiration_date: null,
  };

  return await createAiModel(newModel);
}
