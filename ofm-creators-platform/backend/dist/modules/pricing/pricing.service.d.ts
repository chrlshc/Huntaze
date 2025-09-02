import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';
export type Currency = 'USD' | 'EUR' | 'GBP';
export type PricingMode = 'flat_by_band' | 'marginal';
export type PlanType = 'STARTER' | 'PRO' | 'SCALE' | 'ENTERPRISE';
export declare class PricingService {
    private readonly configService;
    private readonly prisma;
    private readonly cache;
    private readonly config;
    constructor(configService: ConfigService, prisma: PrismaService, cache: CacheService);
    /**
     * Calculate commission for a given amount and plan
     */
    calculateCommission({ creatorId, netAmountCents, currency, month, plan }: {
        creatorId: string;
        netAmountCents: bigint;
        currency?: Currency;
        month: string;
        plan?: PlanType;
    }): Promise<{
        netAmountCents: bigint;
        baseCommissionCents: bigint;
        capAppliedCents: bigint;
        softTailCents: bigint;
        finalCommissionCents: bigint;
        effectiveRate: number;
        breakdown: {
            monthToDateBeforeCents: bigint;
            inGrowthPeriod: boolean;
            capUsage: {
                limitCents: number | null;
                usedCents: number;
                remainingCents: number | null;
            };
        };
    }>;
    /**
     * Simulate pricing for different plans
     */
    simulatePricing({ creatorId, monthlyNetCents, currency }: {
        creatorId?: string;
        monthlyNetCents: bigint;
        currency?: Currency;
    }): Promise<{
        monthlyNetCents: number;
        currency: Currency;
        recommendations: string[];
        plans: Record<PlanType, any>;
    }>;
    /**
     * Get plan recommendations
     */
    getPlanAdvice(creatorId: string): Promise<{
        currentPlan: string;
        avgMonthlyNetCents: bigint;
        capHitRate: number;
        recommendation: string | null;
        reason: string | null;
        potentialSavings: number | null;
    }>;
    private calculateBaseCommission;
    private calculateFlatByBand;
    private calculateMarginal;
    private getMonthToDateNet;
    private getMonthlyCapUsage;
    private isInStarterGrowth;
    private getEffectiveRate;
    private checkPlanEligibility;
    private getRecommendations;
    private getRevenueHistory;
    private calculateAverageNet;
    private getCapHitRate;
}
//# sourceMappingURL=pricing.service.d.ts.map