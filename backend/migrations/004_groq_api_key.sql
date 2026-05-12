-- Add Groq API key to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS groq_api_key TEXT;
