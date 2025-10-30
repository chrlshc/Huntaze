-- AlterTable: Update OnlyFansMessage for rate limiter integration
-- Add new fields: mediaUrls, priority, queuedAt, sentAt
-- Remove: workflowId, scheduledFor (moved to metadata JSON)

-- Add new columns
ALTER TABLE "onlyfans_messages" 
  ADD COLUMN IF NOT EXISTS "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "queued_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Update status default
ALTER TABLE "onlyfans_messages" 
  ALTER COLUMN "status" SET DEFAULT 'queued';

-- Drop old columns if they exist (safe migration)
ALTER TABLE "onlyfans_messages" 
  DROP COLUMN IF EXISTS "workflow_id",
  DROP COLUMN IF EXISTS "scheduled_for";

-- Create new indexes
CREATE INDEX IF NOT EXISTS "onlyfans_messages_queued_at_idx" ON "onlyfans_messages"("queued_at");
CREATE INDEX IF NOT EXISTS "onlyfans_messages_recipient_id_idx" ON "onlyfans_messages"("recipient_id");

-- Drop old indexes if they exist
DROP INDEX IF EXISTS "onlyfans_messages_workflow_id_idx";
DROP INDEX IF EXISTS "onlyfans_messages_scheduled_for_idx";
