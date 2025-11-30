import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Check if oauth_accounts table exists
    const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Tables in public schema:');
    result.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Try to count oauth accounts
    try {
      const count = await prisma.oauth_accounts.count();
      console.log(`\nOAuthAccount count: ${count}`);
    } catch (error: any) {
      console.error(`\nError counting OAuthAccount: ${error.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
