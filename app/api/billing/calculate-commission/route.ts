import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

// Commission structure based on pricing page
const COMMISSION_TIERS = {
  starter: {
    basePrice: 0,
    commissionRates: [
      { threshold: 0, rate: 0.20 },      // 20% default
      { threshold: 10000, rate: 0.15 },  // 15% after $10k
      { threshold: 25000, rate: 0.10 },  // 10% after $25k
      { threshold: 50000, rate: 0.05 },  // 5% after $50k
    ],
    freeMonths: { threshold: 1500, duration: 1 }, // Free if <$1.5k
    gracePeriod: { days: 90, amount: 500 },       // 0% on first $500 for 90 days
    cap: null, // No cap on STARTER
  },
  pro: {
    basePrice: 69,
    commissionRate: 0.15,  // 15% flat
    cap: 699,             // Capped at $699/mo
  },
  scale: {
    basePrice: 99,
    commissionRate: 0.10,  // 10% flat
    cap: 1999,            // Capped at $1,999/mo
  },
  enterprise: {
    basePrice: 499,
    commissionRate: 0.02,  // 2% flat
    cap: null,            // No cap
  },
};

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    // Allow internal/system invocations (EventBridge/API Destination, Cron) using a shared key
    const apiKey = request.headers.get('x-api-key');
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const allowInternal = (apiKey && apiKey === process.env.EVENTBRIDGE_API_KEY) || (cronSecret && cronSecret === process.env.CRON_SECRET);

    // Otherwise require an authenticated user
    let userId: string | null = null;
    if (!allowInternal) {
      const user = await getUserFromRequest(request);
      if (!user?.userId) {
        const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
      userId = user.userId as string;
    }

    const { monthlyRevenue, subscriptionTier, accountAge } = await request.json();

    // Calculate commission based on tier
    let commission = 0;
    const breakdown = {
      basePrice: 0,
      commission: 0,
      total: 0,
      notes: [] as string[],
    };

    const tier = COMMISSION_TIERS[subscriptionTier as keyof typeof COMMISSION_TIERS];
    
    if (!tier) {
      const r = NextResponse.json({ error: 'Invalid subscription tier', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    breakdown.basePrice = tier.basePrice;

    // Special handling for STARTER tier
    if (subscriptionTier === 'starter' && 'freeMonths' in tier) {
      // Check if eligible for free month
      if (monthlyRevenue < tier.freeMonths.threshold) {
        breakdown.notes.push(`Free month (revenue < $${tier.freeMonths.threshold})`);
        breakdown.total = 0;
        {
          const r = NextResponse.json({ ...breakdown, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
      }

      // Apply grace period if within 90 days
      let adjustedRevenue = monthlyRevenue;
      if ('gracePeriod' in tier && accountAge <= tier.gracePeriod.days) {
        adjustedRevenue = Math.max(0, monthlyRevenue - tier.gracePeriod.amount);
        breakdown.notes.push(`Grace period: 0% on first $${tier.gracePeriod.amount}`);
      }

      // Calculate tiered commission
      if ('commissionRates' in tier) {
        for (let i = tier.commissionRates.length - 1; i >= 0; i--) {
          const rate = tier.commissionRates[i];
          if (adjustedRevenue >= rate.threshold) {
            commission = adjustedRevenue * rate.rate;
            breakdown.notes.push(`${rate.rate * 100}% commission rate`);
            break;
          }
        }
      }
    } else {
      // Fixed commission rate for other tiers
      if ('commissionRate' in tier) {
        commission = monthlyRevenue * tier.commissionRate;
        breakdown.notes.push(`${tier.commissionRate * 100}% commission rate`);

        // Apply cap if exists
        if ('cap' in tier && tier.cap && commission > tier.cap) {
          commission = tier.cap;
          breakdown.notes.push(`Commission capped at $${tier.cap}`);
        }
      }
    }

    breakdown.commission = Math.round(commission * 100) / 100; // Round to cents
    breakdown.total = breakdown.basePrice + breakdown.commission;

    const r = NextResponse.json({ ...breakdown, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('commission_calculation_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to calculate commission', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export const POST = withMonitoring('billing.calculate-commission', handler as any);
