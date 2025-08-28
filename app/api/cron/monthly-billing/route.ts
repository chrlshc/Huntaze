import { NextRequest, NextResponse } from 'next/server';
import { OnlyFansAPI, decryptApiKey } from '@/lib/integrations/onlyfans';
import { CommissionTracker } from '@/lib/billing/commission-tracker';

// This endpoint should be called monthly by a cron job
// Use Vercel Cron, AWS EventBridge, or GitHub Actions
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active users with OnlyFans connections
    const users = await getActiveUsersWithOnlyFans();
    
    const results = [];
    
    for (const user of users) {
      try {
        // Decrypt stored API key
        const apiKey = decryptApiKey(user.onlyfansApiKeyEncrypted);
        
        // Initialize OnlyFans API
        const onlyFans = new OnlyFansAPI({
          userId: user.onlyfansUserId,
          apiKey: apiKey,
        });
        
        // Get current month earnings
        const now = new Date();
        const monthlyEarnings = await onlyFans.getMonthlyEarnings(
          now.getFullYear(),
          now.getMonth() + 1
        );
        
        // Report earnings for commission calculation
        const commission = await CommissionTracker.reportEarnings({
          userId: user.id,
          monthlyRevenue: monthlyEarnings,
          platform: 'onlyfans',
          period: {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          },
        });
        
        results.push({
          userId: user.id,
          earnings: monthlyEarnings,
          commission: commission,
          status: 'success',
        });
        
        // Store earnings in database for records
        await storeMonthlyEarnings(user.id, monthlyEarnings, commission);
        
      } catch (error) {
        console.error(`Failed to process user ${user.id}:`, error);
        results.push({
          userId: user.id,
          status: 'error',
          error: error.message,
        });
      }
    }
    
    return NextResponse.json({
      processed: results.length,
      results: results,
    });
    
  } catch (error) {
    console.error('Monthly billing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

// Helper functions (implement with your database)
async function getActiveUsersWithOnlyFans(): Promise<any[]> {
  // TODO: Query database for users with:
  // - Active subscription
  // - OnlyFans connection
  // Return user data including encrypted API keys
  return [];
}

async function storeMonthlyEarnings(userId: string, earnings: number, commission: any): Promise<void> {
  // TODO: Store in database for records and analytics
  // This helps with disputes and revenue tracking
}