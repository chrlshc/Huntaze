import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { StripeService } from '@infrastructure/stripe/stripe.service';
import { CacheService } from '@infrastructure/cache/cache.service';
interface ReconciliationResult {
    date: Date;
    status: 'matched' | 'partial' | 'unmatched';
    stripeBalance: bigint;
    ledgerBalance: bigint;
    difference: bigint;
    details: {
        matched: number;
        unmatched: number;
        missing: number;
        errors: string[];
    };
}
export declare class ReconciliationService {
    private readonly prisma;
    private readonly stripe;
    private readonly cache;
    constructor(prisma: PrismaService, stripe: StripeService, cache: CacheService);
    /**
     * Daily reconciliation job
     */
    runDailyReconciliation(): Promise<void>;
    /**
     * Reconcile Stripe transactions with ledger
     */
    reconcileStripeTransactions(startDate: Date, endDate: Date): Promise<ReconciliationResult>;
    /**
     * Reconcile AR balances
     */
    reconcileAccountsReceivable(): Promise<{
        total: bigint;
        byCreator: Record<string, bigint>;
        aging: {
            current: bigint;
            days30: bigint;
            days60: bigint;
            days90Plus: bigint;
        };
    }>;
    /**
     * Verify ledger balance integrity
     */
    verifyLedgerIntegrity(): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    private fetchStripeBalanceTransactions;
    private calculateLedgerAmount;
    private calculateAccountBalance;
    private storeReconciliationResult;
    private sendReconciliationAlert;
}
export {};
//# sourceMappingURL=reconciliation.service.d.ts.map