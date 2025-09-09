-- Development branch initialization
-- This migration is created to trigger Supabase branch creation for MCP testing

-- Add a comment to indicate this is development environment
COMMENT ON SCHEMA public IS 'Development environment for MCP (Model Context Protocol) testing - Created 2025-01-09';

-- Create a development tracking table (optional, for testing purposes)
CREATE TABLE IF NOT EXISTS development_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial development log
INSERT INTO development_logs (event_type, message) 
VALUES ('BRANCH_INIT', 'Development branch initialized for MCP testing');

-- Enable RLS on development_logs
ALTER TABLE development_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for development_logs (allow all for development)
CREATE POLICY "Allow all operations in development" ON development_logs
FOR ALL USING (true) WITH CHECK (true);