import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';

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

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const userId = user.userId as string;

    const { monthlyRevenue, subscriptionTier, accountAge } = await request.json();

    // Calculate commission based on tier
    let commission = 0;
    let breakdown = {
      basePrice: 0,
      commission: 0,
      total: 0,
      notes: [] as string[],
    };

    const tier = COMMISSION_TIERS[subscriptionTier as keyof typeof COMMISSION_TIERS];
    
    if (!tier) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    breakdown.basePrice = tier.basePrice;

    // Special handling for STARTER tier
    if (subscriptionTier === 'starter' && 'freeMonths' in tier) {
      // Check if eligible for free month
      if (monthlyRevenue < tier.freeMonths.threshold) {
        breakdown.notes.push(`Free month (revenue < $${tier.freeMonths.threshold})`);
        breakdown.total = 0;
        return NextResponse.json(breakdown);
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

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Commission calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate commission' }, { status: 500 });
  }
}
