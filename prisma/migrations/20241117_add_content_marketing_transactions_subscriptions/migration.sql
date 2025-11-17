-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "category" VARCHAR(100),
    "tags" TEXT[],
    "media_ids" TEXT[],
    "scheduled_at" TIMESTAMP,
    "published_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "goal" VARCHAR(50) NOT NULL,
    "audience_segment" VARCHAR(100) NOT NULL,
    "audience_size" INTEGER NOT NULL,
    "message" JSONB NOT NULL,
    "schedule" JSONB,
    "stats" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "platform" VARCHAR(50),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "fan_id" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "tier" VARCHAR(50),
    "amount" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "started_at" TIMESTAMP NOT NULL,
    "ends_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_user_id_status_idx" ON "content"("user_id", "status");

-- CreateIndex
CREATE INDEX "content_user_id_platform_idx" ON "content"("user_id", "platform");

-- CreateIndex
CREATE INDEX "content_user_id_created_at_idx" ON "content"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "marketing_campaigns_user_id_status_idx" ON "marketing_campaigns"("user_id", "status");

-- CreateIndex
CREATE INDEX "marketing_campaigns_user_id_channel_idx" ON "marketing_campaigns"("user_id", "channel");

-- CreateIndex
CREATE INDEX "transactions_user_id_status_idx" ON "transactions"("user_id", "status");

-- CreateIndex
CREATE INDEX "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_idx" ON "subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_platform_idx" ON "subscriptions"("user_id", "platform");

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
