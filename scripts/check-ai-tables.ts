#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking AI tables...\n');
    
    const usageLogCount = await prisma.usageLog.count();
    console.log(`✅ UsageLog table exists (${usageLogCount} records)`);
    
    const monthlyChargeCount = await prisma.monthlyCharge.count();
    console.log(`✅ MonthlyCharge table exists (${monthlyChargeCount} records)`);
    
    const aiInsightCount = await prisma.aIInsight.count();
    console.log(`✅ AIInsight table exists (${aiInsightCount} records)`);
    
    console.log('\n✨ All AI tables are ready!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
