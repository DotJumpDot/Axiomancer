-- API Key and Session Tables for Authentication
-- Run this SQL to add authentication tables to your database

-- API Key table for API key authentication
CREATE TABLE IF NOT EXISTS api_key (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User session table for refresh tokens
CREATE TABLE IF NOT EXISTS user_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_key_user_id ON api_key(user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_expires_at ON api_key(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_session(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_expires_at ON user_session(expires_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_api_key_updated_at BEFORE UPDATE ON api_key
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_session_updated_at BEFORE UPDATE ON user_session
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();