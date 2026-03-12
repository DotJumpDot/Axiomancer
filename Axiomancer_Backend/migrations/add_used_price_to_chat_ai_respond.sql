-- Migration: Add used_price column to chat_ai_respond table
-- This column will store the calculated cost for each AI response

ALTER TABLE chat_ai_respond 
ADD COLUMN used_price NUMERIC(20, 10) DEFAULT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN chat_ai_respond.used_price IS 'Calculated cost for this AI response based on token usage and model pricing (in USD)';
