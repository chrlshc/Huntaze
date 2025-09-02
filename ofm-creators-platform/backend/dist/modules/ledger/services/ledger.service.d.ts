import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { LedgerTransactionKind, LedgerDirection, LedgerAccountType } from '@prisma/client';
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
type Bps = number;
interface LedgerEntry {
    accountType: LedgerAccountType;
    direction: LedgerDirection;
    amountCents: bigint;
    ownerId?: string;
}
interface CreateTransactionDto {
    tenantId: string;
    kind: LedgerTransactionKind;
    currency: Currency;
    occurredAt: Date;
    entries: LedgerEntry[];
    memo?: string;
    source?: string;
    extRef?: string;
    stripeEventId?: string;
    idempotencyKey?: string;
}
export declare class LedgerService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    /**
     * Creates a balanced ledger transaction with multiple entries
     */
    createTransaction(dto: CreateTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        idempotencyKey: string | null;
        occurredAt: Date;
        source: string | null;
        stripeEventId: string | null;
        tenantId: string;
        kind: import(".prisma/client").$Enums.LedgerTransactionKind;
        memo: string | null;
        extRef: string | null;
        reversedBy: string | null;
    }>;
    /**
     * Post an on-platform charge with application fee
     */
    postCharge({ tenantId, creatorId, currency, chargeCents, appFeeCents, stripeEventId, occurredAt }: {
        tenantId: string;
        creatorId: string;
        currency: Currency;
        chargeCents: bigint;
        appFeeCents: bigint;
        stripeEventId: string;
        occurredAt?: Date;
    }): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        idempotencyKey: string | null;
        occurredAt: Date;
        source: string | null;
        stripeEventId: string | null;
        tenantId: string;
        kind: import(".prisma/client").$Enums.LedgerTransactionKind;
        memo: string | null;
        extRef: string | null;
        reversedBy: string | null;
    }>;
    /**
     * Post an off-platform commission accrual
     */
    postOffPlatformAccrual({ tenantId, creatorId, currency, platform, date, netCents, rateBps, capLeftCents }: {
        tenantId: string;
        creatorId: string;
        currency: Currency;
        platform: string;
        date: Date;
        netCents: bigint;
        rateBps: Bps;
        capLeftCents: bigint;
    }): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        idempotencyKey: string | null;
        occurredAt: Date;
        source: string | null;
        stripeEventId: string | null;
        tenantId: string;
        kind: import(".prisma/client").$Enums.LedgerTransactionKind;
        memo: string | null;
        extRef: string | null;
        reversedBy: string | null;
    } | null>;
    /**
     * Post AR settlement when invoice is paid
     */
    postARSettlement({ tenantId, creatorId, currency, amountCents, stripeInvoiceId, occurredAt }: {
        tenantId: string;
        creatorId: string;
        currency: Currency;
        amountCents: bigint;
        stripeInvoiceId: string;
        occurredAt?: Date;
    }): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        idempotencyKey: string | null;
        occurredAt: Date;
        source: string | null;
        stripeEventId: string | null;
        tenantId: string;
        kind: import(".prisma/client").$Enums.LedgerTransactionKind;
        memo: string | null;
        extRef: string | null;
        reversedBy: string | null;
    }>;
    /**
     * Post refund
     */
    postRefund({ tenantId, creatorId, currency, refundCents, feeRefundCents, stripeEventId, occurredAt }: {
        tenantId: string;
        creatorId: string;
        currency: Currency;
        refundCents: bigint;
        feeRefundCents: bigint;
        stripeEventId: string;
        occurredAt?: Date;
    }): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        idempotencyKey: string | null;
        occurredAt: Date;
        source: string | null;
        stripeEventId: string | null;
        tenantId: string;
        kind: import(".prisma/client").$Enums.LedgerTransactionKind;
        memo: string | null;
        extRef: string | null;
        reversedBy: string | null;
    }>;
    /**
     * Get account balance
     */
    getAccountBalance(tenantId: string, type: LedgerAccountType, currency: Currency, ownerId?: string): Promise<bigint>;
    /**
     * Get creator AR balance across all currencies
     */
    getCreatorARBalance(creatorId: string): Promise<Record<string, bigint>>;
    /**
     * Get monthly cap usage
     */
    getMonthlyCapUsage(creatorId: string, yearMonth: string, currency: Currency): Promise<{
        capCents: bigint;
        appliedCents: bigint;
        remainingCents: bigint;
    }>;
    private ensureAccount;
    private calculateTotals;
    private formatYearMonth;
    private updateMonthlyCapUsage;
    private getCapForTier;
}
export {};
//# sourceMappingURL=ledger.service.d.ts.map