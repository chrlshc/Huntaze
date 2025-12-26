-- Enable pgvector extension for PostgreSQL
-- Run this before running prisma db push

-- Create the extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';
