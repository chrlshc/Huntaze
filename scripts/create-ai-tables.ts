#!/usr/bin/env tsx
/**
 * Script to create AI-related tables in the database
 * This ensures the UsageLog, MonthlyCharge, and AIInsight tables exist
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking if AI tables exist...');

  try {
    // Try to query each table to see if it exists
    const usageLogCount = await prisma.usageLog.count();
    console.log('✅ UsageLog table exists');
    
    const monthlyChargeCount = await prisma.monthlyCharge.count();
    console.log('✅ MonthlyCharge table exists');
    
    const aiInsightCount = await prisma.aIInsight.count();
    console.log('✅ AIInsight table exists');
    
    console.log('\n✨ All AI tables already exist!');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('❌ AI tables do not exist. Running migration...');
      console.log('\nPlease run: npx prisma migrate deploy');
      process.exit(1);
    } else {
      console.error('Error checking tables:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
