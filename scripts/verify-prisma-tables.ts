import { prisma } from '../lib/prisma';

async function verifyTables() {
  try {
    console.log('Verifying Prisma tables...\n');

    // Check if we can query each table
    const contentCount = await prisma.content.count();
    console.log(`✓ Content table exists (${contentCount} records)`);

    const campaignsCount = await prisma.marketingCampaign.count();
    console.log(`✓ MarketingCampaign table exists (${campaignsCount} records)`);

    const transactionsCount = await prisma.transaction.count();
    console.log(`✓ Transaction table exists (${transactionsCount} records)`);

    const subscriptionsCount = await prisma.subscription.count();
    console.log(`✓ Subscription table exists (${subscriptionsCount} records)`);

    const usersCount = await prisma.user.count();
    console.log(`✓ User table exists (${usersCount} records)`);

    console.log('\n✅ All tables verified successfully!');
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
