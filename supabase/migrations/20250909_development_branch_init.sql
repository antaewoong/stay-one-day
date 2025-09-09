-- Development branch initialization
-- This migration is created to trigger Supabase branch creation for MCP testing

-- Simple development tracking table
CREATE TABLE IF NOT EXISTS development_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL DEFAULT 'INFO',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);