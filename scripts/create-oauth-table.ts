import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOAuthTable() {
  try {
    console.log('Creating oauth_accounts table...');
    
    await prisma.$executeRawUnsafe(`
      -- CreateTable
      CREATE TABLE IF NOT EXISTS "oauth_accounts" (
          "id" SERIAL NOT NULL,
          "user_id" INTEGER NOT NULL,
          "provider" VARCHAR(50) NOT NULL,
          "provider_account_id" VARCHAR(255) NOT NULL,
          "access_token" TEXT,
          "refresh_token" TEXT,
          "expires_at" TIMESTAMP(6),
          "token_type" VARCHAR(50),
          "scope" TEXT,
          "metadata" JSONB,
          "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('Creating unique index...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "oauth_accounts_provider_provider_account_id_key" 
      ON "oauth_accounts"("provider", "provider_account_id");
    `);
    
    console.log('Creating user_id index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "oauth_accounts_user_id_provider_idx" 
      ON "oauth_accounts"("user_id", "provider");
    `);
    
    console.log('Adding foreign key constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "oauth_accounts" 
      ADD CONSTRAINT "oauth_accounts_user_id_fkey" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    
    console.log('✅ oauth_accounts table created successfully!');
    
    // Verify
    const count = await prisma.oauth_accounts.count();
    console.log(`OAuthAccount count: ${count}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createOAuthTable();
