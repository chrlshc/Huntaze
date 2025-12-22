-- CreateEnum
CREATE TYPE "ContentPlatform" AS ENUM ('TIKTOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "ContentTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContentSourceType" AS ENUM ('UPLOAD', 'URL');

-- CreateTable
CREATE TABLE "content_tasks" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform" "ContentPlatform" NOT NULL,
    "status" "ContentTaskStatus" NOT NULL DEFAULT 'PENDING',
    "source_type" "ContentSourceType" NOT NULL,
    "source_url" TEXT,
    "asset_key" TEXT,
    "caption" TEXT,
    "hook" TEXT,
    "body" TEXT,
    "cta" TEXT,
    "trend_label" TEXT,
    "scheduled_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "posted_at" TIMESTAMPTZ(6),
    "external_post_id" VARCHAR(255),
    "error_message" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform" "ContentPlatform" NOT NULL,
    "platform_user_id" VARCHAR(255) NOT NULL,
    "page_id" VARCHAR(255),
    "page_access_token" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_content_task_user_status" ON "content_tasks"("user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_content_task_platform_status" ON "content_tasks"("platform", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_social_account_unique" ON "social_accounts"("user_id", "platform");
