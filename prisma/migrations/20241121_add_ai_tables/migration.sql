-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "feature" TEXT NOT NULL,
    "agentId" TEXT,
    "model" TEXT NOT NULL,
    "tokensInput" INTEGER NOT NULL,
    "tokensOutput" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_charges" (
    "id" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "totalTokensInput" INTEGER NOT NULL,
    "totalTokensOutput" INTEGER NOT NULL,
    "totalCostUsd" DECIMAL(10,6) NOT NULL,
    "planPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "monthly_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_logs_creatorId_createdAt_idx" ON "usage_logs"("creatorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_charges_creatorId_month_key" ON "monthly_charges"("creatorId", "month");

-- CreateIndex
CREATE INDEX "ai_insights_creatorId_type_createdAt_idx" ON "ai_insights"("creatorId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_charges" ADD CONSTRAINT "monthly_charges_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
