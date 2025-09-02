import { Decimal } from '@prisma/client/runtime/library';
import { CommissionTier } from '@prisma/client';
interface CommissionTierConfig {
    tier: CommissionTier;
    rate: number;
    minRevenue: number;
    maxRevenue: number | null;
    cap: number | null;
}
export declare class CommissionService {
    private readonly tiers;
    /**
     * Calcule la commission pour une transaction
     */
    calculateCommission(amount: Decimal, creatorTier: CommissionTier, monthlyCommissionToDate: Decimal): {
        platformFee: Decimal;
        platformFeeRate: Decimal;
        netAmount: Decimal;
        tierApplied: CommissionTier;
        capReached: boolean;
    };
    /**
     * Détermine automatiquement le tier basé sur le revenu total
     */
    determineTier(totalRevenue: Decimal): CommissionTier;
    /**
     * Met à jour le tier d'un créateur si nécessaire
     */
    shouldUpdateTier(currentTier: CommissionTier, totalRevenue: Decimal): {
        shouldUpdate: boolean;
        newTier?: CommissionTier;
    };
    /**
     * Obtient les informations sur un tier
     */
    getTierInfo(tier: CommissionTier): CommissionTierConfig | undefined;
    /**
     * Calcule les économies potentielles pour le prochain tier
     */
    calculateSavingsForNextTier(currentTier: CommissionTier, monthlyRevenue: number): {
        nextTier: CommissionTier | null;
        currentMonthlyFee: number;
        nextMonthlyFee: number;
        savings: number;
        savingsPercentage: number;
    } | null;
}
export {};
//# sourceMappingURL=commission.service.d.ts.map