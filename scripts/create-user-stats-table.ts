import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserStatsTable() {
  try {
    console.log('Creating user_stats table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "user_stats" (
          "id" TEXT NOT NULL,
          "user_id" INTEGER NOT NULL,
          "messages_sent" INTEGER NOT NULL DEFAULT 0,
          "messages_trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "response_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "response_rate_trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "revenue_trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "active_chats" INTEGER NOT NULL DEFAULT 0,
          "active_chats_trend" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('Creating unique index on user_id...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "user_stats_user_id_key" 
      ON "user_stats"("user_id");
    `);
    
    console.log('Creating user_id index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "user_stats_user_id_idx" 
      ON "user_stats"("user_id");
    `);
    
    console.log('Adding foreign key constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user_stats" 
      ADD CONSTRAINT "user_stats_user_id_fkey" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    
    console.log('✅ user_stats table created successfully!');
    
    // Verify
    const count = await prisma.userStats.count();
    console.log(`UserStats count: ${count}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUserStatsTable();
