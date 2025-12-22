-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
DO $$ BEGIN
    CREATE TYPE "KnowledgeKind" AS ENUM('CHAT_CLOSER_PLAY', 'VIRAL_STRUCTURE', 'EDITING_RULESET', 'ANALYTICS_PLAYBOOK', 'TREND_TEMPLATE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KnowledgeSource" AS ENUM('USER_HISTORY', 'CURATED', 'IMPORTED', 'PARTNER_DATA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KnowledgeStatus" AS ENUM('ACTIVE', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create KnowledgeBaseItem table
CREATE TABLE "KnowledgeBaseItem" (
    "id" TEXT NOT NULL,
    "status" "KnowledgeStatus" NOT NULL DEFAULT E'ACTIVE',
    "creatorId" INTEGER,
    "kind" "KnowledgeKind" NOT NULL,
    "source" "KnowledgeSource" NOT NULL DEFAULT E'USER_HISTORY',
    "niche" TEXT,
    "platform" TEXT,
    "language" TEXT NOT NULL DEFAULT E'en',
    "title" TEXT,
    "inputText" TEXT NOT NULL,
    "outputText" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueUsd" DOUBLE PRECISION,
    "conversions" INTEGER,
    "views" INTEGER,
    "retention50" DOUBLE PRECISION,
    "lastUsedAt" TIMESTAMP(3),
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseItem_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "KnowledgeBaseItem_creatorId_kind_status_idx" ON "KnowledgeBaseItem"("creatorId", "kind", "status");
CREATE INDEX "KnowledgeBaseItem_kind_niche_platform_status_idx" ON "KnowledgeBaseItem"("kind", "niche", "platform", "status");
CREATE INDEX "KnowledgeBaseItem_score_idx" ON "KnowledgeBaseItem"("score");

-- Create HNSW vector index for fast semantic search
CREATE INDEX "KnowledgeBaseItem_embedding_hnsw_idx" ON "KnowledgeBaseItem" USING hnsw ("embedding" vector_cosine_ops);

-- Add foreign key constraint
ALTER TABLE "KnowledgeBaseItem" ADD CONSTRAINT "KnowledgeBaseItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
