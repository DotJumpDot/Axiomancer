-- Migration: Add used_token_detail column to chat_ai_respond table
-- Description: Adds detailed cost breakdown tracking for AI responses
-- Author: Axiomancer Development Team
-- Date: 2025-03-13

-- Add used_price column for storing total cost
ALTER TABLE chat_ai_respond 
ADD COLUMN IF NOT EXISTS used_price NUMERIC;

-- Add used_token_detail column for storing detailed cost breakdown
ALTER TABLE chat_ai_respond 
ADD COLUMN IF NOT EXISTS used_token_detail JSONB;

-- Add comment to describe the columns
COMMENT ON COLUMN chat_ai_respond.used_price IS 'Total cost of the API call in USD';

COMMENT ON COLUMN chat_ai_respond.used_token_detail IS 'Detailed cost breakdown including inputCost, outputCost, requestCost, imageCost, and totalCost';

-- Create index for used_token_detail for efficient queries on cost data
CREATE INDEX IF NOT EXISTS idx_chat_ai_respond_used_token_detail ON chat_ai_respond USING GIN (used_token_detail);
