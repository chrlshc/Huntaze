-- CreateTable
CREATE TABLE "signup_analytics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "landingPage" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "pageViewed" TIMESTAMP(3),
    "formStarted" TIMESTAMP(3),
    "methodSelected" TEXT,
    "formSubmitted" TIMESTAMP(3),
    "signupCompleted" TIMESTAMP(3),
    "signupFailed" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "timeToSubmit" INTEGER,
    "timeToComplete" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signup_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signup_analytics_sessionId_key" ON "signup_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "signup_analytics_userId_idx" ON "signup_analytics"("userId");

-- CreateIndex
CREATE INDEX "signup_analytics_email_idx" ON "signup_analytics"("email");

-- CreateIndex
CREATE INDEX "signup_analytics_sessionId_idx" ON "signup_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "signup_analytics_createdAt_idx" ON "signup_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "signup_analytics_methodSelected_idx" ON "signup_analytics"("methodSelected");
