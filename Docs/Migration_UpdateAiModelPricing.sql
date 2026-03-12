-- Migration: Update ai_model table to use JSON pricing structure
-- Date: 2026-03-12
-- Description: Migrate from cost_per_1k_token (decimal) to pricing (JSONB) column

-- Step 1: Add the new pricing column
ALTER TABLE ai_model ADD COLUMN IF NOT EXISTS pricing JSONB;

-- Step 2: Migrate existing data from cost_per_1k_token to pricing JSONB
UPDATE ai_model
SET pricing = jsonb_build_object(
  'prompt', (cost_per_1k_token / 2000)::text,
  'completion', (cost_per_1k_token / 2000)::text,
  'request', '0',
  'image', '0'
)
WHERE pricing IS NULL;

-- Step 3: Set pricing as NOT NULL (after migration)
ALTER TABLE ai_model ALTER COLUMN pricing SET NOT NULL;

-- Step 4: Drop the old cost_per_1k_token column
ALTER TABLE ai_model DROP COLUMN IF EXISTS cost_per_1k_token;

-- Step 5: Add index on pricing for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_ai_model_pricing ON ai_model USING GIN (pricing);

-- Verification query (run after migration to verify)
SELECT 
  id,
  display_name,
  pricing,
  pricing->>'prompt' as prompt_cost,
  pricing->>'completion' as completion_cost,
  pricing->>'request' as request_cost,
  pricing->>'image' as image_cost
FROM ai_model
ORDER BY display_name;

-- Rollback script (if needed, run this to revert)
/*
ALTER TABLE ai_model ADD COLUMN IF NOT EXISTS cost_per_1k_token DECIMAL(14,10);

UPDATE ai_model
SET cost_per_1k_token = COALESCE(
  ((pricing->>'prompt')::numeric + (pricing->>'completion')::numeric) * 1000,
  0
);

ALTER TABLE ai_model ALTER COLUMN cost_per_1k_token SET NOT NULL;

DROP INDEX IF EXISTS idx_ai_model_pricing;

ALTER TABLE ai_model DROP COLUMN IF EXISTS pricing;
*/
