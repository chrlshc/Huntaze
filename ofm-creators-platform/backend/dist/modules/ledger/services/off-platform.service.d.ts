import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { StripeService } from '@infrastructure/stripe/stripe.service';
import { LedgerService } from './ledger.service';
import { ExternalPlatform } from '@prisma/client';
import Stripe from 'stripe';
interface ImportEarningsDto {
    creatorId: string;
    platform: ExternalPlatform;
    externalHandle: string;
    periodStart: Date;
    periodEnd: Date;
    earnings: Array<{
        date: Date;
        grossCents: bigint;
        feesCents: bigint;
        netCents: bigint;
        payoutId?: string;
        extRef?: string;
        metadata?: any;
    }>;
}
interface MonthlyStatementDto {
    creatorId: string;
    platform: ExternalPlatform;
    yearMonth: string;
    currency: string;
}
export declare class OffPlatformService {
    private readonly prisma;
    private readonly stripe;
    private readonly ledger;
    constructor(prisma: PrismaService, stripe: StripeService, ledger: LedgerService);
    /**
     * Import earnings from external platform
     */
    importEarnings(dto: ImportEarningsDto): Promise<{
        status: string;
        importId: string;
        count?: undefined;
    } | {
        status: string;
        importId: string;
        count: number;
    }>;
    /**
     * Close monthly statement and create invoice
     */
    closeMonthlyStatement(dto: MonthlyStatementDto): Promise<{
        id: string;
        creatorId: string;
        createdAt: Date;
        updatedAt: Date;
        platform: import(".prisma/client").$Enums.ExternalPlatform;
        currency: string;
        rateBps: number;
        stripeInvoiceId: string | null;
        yearMonth: string;
        baseNetCents: bigint;
        commissionCents: bigint;
        capAppliedCents: bigint;
        finalCents: bigint;
        closedAt: Date | null;
        invoicedAt: Date | null;
        paidAt: Date | null;
        writeOffAt: Date | null;
    }>;
    /**
     * Create Stripe invoice for commission
     */
    private createInvoice;
    /**
     * Handle invoice payment webhook
     */
    handleInvoicePaid(invoice: Stripe.Invoice): Promise<void>;
    /**
     * Get platform-specific parsers
     */
    parseStatementFile(platform: ExternalPlatform, fileContent: string): Promise<any[]>;
    private ensureSource;
    private normalizeEarnings;
    private processCommissionAccruals;
    private getRateForTier;
    private formatYearMonth;
    private parseOnlyFansCSV;
    private parsePatreonCSV;
    private parseFanslyJSON;
}
export {};
//# sourceMappingURL=off-platform.service.d.ts.map