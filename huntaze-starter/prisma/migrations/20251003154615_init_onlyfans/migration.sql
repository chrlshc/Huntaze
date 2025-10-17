-- CreateTable
CREATE TABLE "Content" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" TEXT NOT NULL,
    "creatorName" TEXT,
    "type" TEXT NOT NULL DEFAULT 'POST',
    "title" TEXT,
    "caption" TEXT,
    "mediaUrl" TEXT,
    "thumbUrl" TEXT,
    "postedAt" DATETIME NOT NULL,
    "price" REAL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentPerformance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contentId" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "bookmarks" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "tips" REAL NOT NULL DEFAULT 0,
    "engagementRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentPerformance_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creatorId" TEXT NOT NULL,
    "onlyfansId" TEXT NOT NULL,
    "username" TEXT,
    "country" TEXT,
    "subscribedAt" DATETIME,
    "lastActiveAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lifetimeValue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Fan_onlyfansId_key" ON "Fan"("onlyfansId");
