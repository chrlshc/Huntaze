"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffPlatformService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const stripe_service_1 = require("@infrastructure/stripe/stripe.service");
const ledger_service_1 = require("./ledger.service");
const crypto_1 = require("crypto");
let OffPlatformService = class OffPlatformService {
    prisma;
    stripe;
    ledger;
    constructor(prisma, stripe, ledger) {
        this.prisma = prisma;
        this.stripe = stripe;
        this.ledger = ledger;
    }
    /**
     * Import earnings from external platform
     */
    async importEarnings(dto) {
        const { creatorId, platform, externalHandle, periodStart, periodEnd, earnings } = dto;
        // Ensure source exists
        const source = await this.ensureSource(creatorId, platform, externalHandle);
        // Create hash of earnings data for deduplication
        const rawData = JSON.stringify({ periodStart, periodEnd, earnings });
        const rawHash = (0, crypto_1.createHash)('sha256').update(rawData).digest('hex');
        // Check if already imported
        const existing = await this.prisma.externalEarningsImport.findUnique({
            where: {
                sourceId_periodStart_periodEnd_rawHash: {
                    sourceId: source.id,
                    periodStart,
                    periodEnd,
                    rawHash
                }
            }
        });
        if (existing?.processedAt) {
            return { status: 'already_processed', importId: existing.id };
        }
        // Create import record
        const import_ = await this.prisma.externalEarningsImport.upsert({
            where: {
                sourceId_periodStart_periodEnd_rawHash: {
                    sourceId: source.id,
                    periodStart,
                    periodEnd,
                    rawHash
                }
            },
            create: {
                sourceId: source.id,
                periodStart,
                periodEnd,
                rawHash,
                rawJson: { earnings }
            },
            update: {}
        });
        try {
            // Normalize and store earnings
            const normalized = await this.normalizeEarnings(source.id, earnings);
            // Process commission accruals
            await this.processCommissionAccruals(creatorId, platform, source.currency, normalized);
            // Mark as processed
            await this.prisma.externalEarningsImport.update({
                where: { id: import_.id },
                data: { processedAt: new Date() }
            });
            // Update last sync
            await this.prisma.externalEarningsSource.update({
                where: { id: source.id },
                data: { lastSync: new Date() }
            });
            return { status: 'success', importId: import_.id, count: normalized.length };
        }
        catch (error) {
            // Mark import as failed
            await this.prisma.externalEarningsImport.update({
                where: { id: import_.id },
                data: { errorMessage: error.message }
            });
            throw error;
        }
    }
    /**
     * Close monthly statement and create invoice
     */
    async closeMonthlyStatement(dto) {
        const { creatorId, platform, yearMonth, currency } = dto;
        // Check if already closed
        const existing = await this.prisma.commissionStatement.findUnique({
            where: {
                creatorId_platform_yearMonth_currency: {
                    creatorId,
                    platform,
                    yearMonth,
                    currency
                }
            }
        });
        if (existing?.closedAt) {
            throw new common_1.BadRequestException('Statement already closed');
        }
        // Calculate totals for the month
        const startDate = new Date(`${yearMonth}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        const sources = await this.prisma.externalEarningsSource.findMany({
            where: {
                creatorId,
                platform,
                currency
            }
        });
        const earnings = await this.prisma.normalizedEarning.findMany({
            where: {
                sourceId: { in: sources.map(s => s.id) },
                occurredAt: {
                    gte: startDate,
                    lt: endDate
                }
            }
        });
        // Calculate base and commission
        const baseNetCents = earnings.reduce((sum, e) => sum + e.netCents, 0n);
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId }
        });
        const rateBps = this.getRateForTier(creator?.commissionTier || 'STARTER');
        const rawCommission = (baseNetCents * BigInt(rateBps)) / 10000n;
        // Check cap
        const capUsage = await this.ledger.getMonthlyCapUsage(creatorId, yearMonth, currency);
        const capAppliedCents = rawCommission > capUsage.remainingCents
            ? rawCommission - capUsage.remainingCents
            : 0n;
        const finalCents = rawCommission - capAppliedCents;
        // Create or update statement
        const statement = await this.prisma.commissionStatement.upsert({
            where: {
                creatorId_platform_yearMonth_currency: {
                    creatorId,
                    platform,
                    yearMonth,
                    currency
                }
            },
            create: {
                creatorId,
                platform,
                yearMonth,
                currency,
                baseNetCents,
                rateBps,
                commissionCents: rawCommission,
                capAppliedCents,
                finalCents,
                closedAt: new Date()
            },
            update: {
                baseNetCents,
                rateBps,
                commissionCents: rawCommission,
                capAppliedCents,
                finalCents,
                closedAt: new Date()
            }
        });
        // Create invoice if amount > 0
        if (finalCents > 0n) {
            await this.createInvoice(statement);
        }
        return statement;
    }
    /**
     * Create Stripe invoice for commission
     */
    async createInvoice(statement) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: statement.creatorId }
        });
        if (!creator?.stripeCustomerId) {
            throw new common_1.BadRequestException('Creator has no Stripe customer ID');
        }
        // Create invoice
        const invoice = await this.stripe.invoices.create({
            customer: creator.stripeCustomerId,
            currency: statement.currency.toLowerCase(),
            collection_method: 'charge_automatically',
            description: `Huntaze commission ${statement.platform} ${statement.yearMonth}`,
            auto_advance: true,
            metadata: {
                creatorId: statement.creatorId,
                platform: statement.platform,
                yearMonth: statement.yearMonth,
                statementId: statement.id
            }
        });
        // Add line item
        await this.stripe.invoiceItems.create({
            customer: creator.stripeCustomerId,
            currency: statement.currency.toLowerCase(),
            amount: Number(statement.finalCents),
            description: `Platform commission ${statement.platform} ${statement.yearMonth}`,
            invoice: invoice.id
        });
        // Finalize invoice
        const finalized = await this.stripe.invoices.finalizeInvoice(invoice.id);
        // Update statement with invoice ID
        await this.prisma.commissionStatement.update({
            where: { id: statement.id },
            data: {
                stripeInvoiceId: finalized.id,
                invoicedAt: new Date()
            }
        });
        return finalized;
    }
    /**
     * Handle invoice payment webhook
     */
    async handleInvoicePaid(invoice) {
        // Find statement by invoice ID
        const statement = await this.prisma.commissionStatement.findUnique({
            where: { stripeInvoiceId: invoice.id }
        });
        if (!statement) {
            console.error(`No statement found for invoice ${invoice.id}`);
            return;
        }
        // Post AR settlement to ledger
        await this.ledger.postARSettlement({
            tenantId: 'default',
            creatorId: statement.creatorId,
            currency: statement.currency,
            amountCents: BigInt(invoice.amount_paid),
            stripeInvoiceId: invoice.id
        });
        // Update statement
        await this.prisma.commissionStatement.update({
            where: { id: statement.id },
            data: { paidAt: new Date() }
        });
    }
    /**
     * Get platform-specific parsers
     */
    async parseStatementFile(platform, fileContent) {
        switch (platform) {
            case 'OF':
                return this.parseOnlyFansCSV(fileContent);
            case 'PATREON':
                return this.parsePatreonCSV(fileContent);
            case 'FANSLY':
                return this.parseFanslyJSON(fileContent);
            default:
                throw new common_1.BadRequestException(`Parser not implemented for ${platform}`);
        }
    }
    // Private helpers
    async ensureSource(creatorId, platform, externalHandle) {
        return this.prisma.externalEarningsSource.upsert({
            where: {
                creatorId_platform_externalHandle: {
                    creatorId,
                    platform,
                    externalHandle
                }
            },
            create: {
                creatorId,
                platform,
                externalHandle,
                currency: 'USD' // Default, should be configurable
            },
            update: {
                active: true
            }
        });
    }
    async normalizeEarnings(sourceId, earnings) {
        const normalized = [];
        for (const earning of earnings) {
            const record = await this.prisma.normalizedEarning.create({
                data: {
                    sourceId,
                    occurredAt: earning.date,
                    currency: 'USD', // Should come from source
                    grossCents: earning.grossCents,
                    feesCents: earning.feesCents,
                    netCents: earning.netCents,
                    payoutId: earning.payoutId,
                    extRef: earning.extRef,
                    metadata: earning.metadata
                }
            });
            normalized.push(record);
        }
        return normalized;
    }
    async processCommissionAccruals(creatorId, platform, currency, earnings) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId }
        });
        const rateBps = this.getRateForTier(creator?.commissionTier || 'STARTER');
        for (const earning of earnings) {
            const yearMonth = this.formatYearMonth(earning.occurredAt);
            const capUsage = await this.ledger.getMonthlyCapUsage(creatorId, yearMonth, currency);
            await this.ledger.postOffPlatformAccrual({
                tenantId: 'default',
                creatorId,
                currency: currency,
                platform,
                date: earning.occurredAt,
                netCents: earning.netCents,
                rateBps,
                capLeftCents: capUsage.remainingCents
            });
        }
    }
    getRateForTier(tier) {
        const rates = {
            STARTER: 2000, // 20%
            PRO: 1500, // 15%
            SCALE: 1000, // 10%
            ENTERPRISE: 500 // 5%
        };
        return rates[tier] || 2000;
    }
    formatYearMonth(date) {
        return date.toISOString().slice(0, 7);
    }
    // Platform-specific parsers
    parseOnlyFansCSV(csv) {
        // Implementation would parse OF CSV format
        // This is a placeholder
        const lines = csv.split('\n').slice(1); // Skip header
        return lines.map(line => {
            const [date, type, gross, fees, net] = line.split(',');
            return {
                date: new Date(date),
                grossCents: BigInt(Math.round(parseFloat(gross) * 100)),
                feesCents: BigInt(Math.round(parseFloat(fees) * 100)),
                netCents: BigInt(Math.round(parseFloat(net) * 100))
            };
        });
    }
    parsePatreonCSV(csv) {
        // Patreon-specific parser
        return [];
    }
    parseFanslyJSON(json) {
        // Fansly-specific parser
        const data = JSON.parse(json);
        return data.transactions || [];
    }
};
exports.OffPlatformService = OffPlatformService;
exports.OffPlatformService = OffPlatformService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof stripe_service_1.StripeService !== "undefined" && stripe_service_1.StripeService) === "function" ? _a : Object, ledger_service_1.LedgerService])
], OffPlatformService);
//# sourceMappingURL=off-platform.service.js.map