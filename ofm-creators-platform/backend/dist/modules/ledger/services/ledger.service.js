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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const crypto_1 = require("crypto");
let LedgerService = class LedgerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Creates a balanced ledger transaction with multiple entries
     */
    async createTransaction(dto) {
        // Validate entries are balanced
        const { debits, credits } = this.calculateTotals(dto.entries);
        if (debits !== credits) {
            throw new common_1.BadRequestException(`Unbalanced transaction: debits=${debits} credits=${credits}`);
        }
        // Use idempotency key if provided
        const idempotencyKey = dto.idempotencyKey || (0, crypto_1.randomUUID)();
        return this.prisma.$transaction(async (tx) => {
            // Check for existing transaction with same idempotency key
            if (dto.idempotencyKey) {
                const existing = await tx.ledgerTransaction.findUnique({
                    where: { idempotencyKey: dto.idempotencyKey }
                });
                if (existing)
                    return existing;
            }
            // Create transaction
            const transaction = await tx.ledgerTransaction.create({
                data: {
                    tenantId: dto.tenantId,
                    kind: dto.kind,
                    currency: dto.currency,
                    occurredAt: dto.occurredAt,
                    memo: dto.memo,
                    source: dto.source,
                    extRef: dto.extRef,
                    stripeEventId: dto.stripeEventId,
                    idempotencyKey
                }
            });
            // Create entries
            for (const entry of dto.entries) {
                const account = await this.ensureAccount(tx, {
                    tenantId: dto.tenantId,
                    type: entry.accountType,
                    currency: dto.currency,
                    ownerId: entry.ownerId
                });
                await tx.ledgerEntry.create({
                    data: {
                        txId: transaction.id,
                        accountId: account.id,
                        direction: entry.direction,
                        amountCents: entry.amountCents,
                        currency: dto.currency
                    }
                });
            }
            return transaction;
        });
    }
    /**
     * Post an on-platform charge with application fee
     */
    async postCharge({ tenantId, creatorId, currency, chargeCents, appFeeCents, stripeEventId, occurredAt = new Date() }) {
        const netCents = chargeCents - appFeeCents;
        return this.createTransaction({
            tenantId,
            kind: 'CHARGE',
            currency,
            occurredAt,
            stripeEventId,
            memo: `Charge ${chargeCents} ${currency}, fee ${appFeeCents}`,
            entries: [
                // Debit platform Stripe account
                {
                    accountType: 'CASH_PLATFORM_STRIPE',
                    direction: 'DEBIT',
                    amountCents: chargeCents
                },
                // Credit creator balance
                {
                    accountType: 'CREATOR_BALANCE',
                    direction: 'CREDIT',
                    amountCents: netCents,
                    ownerId: creatorId
                },
                // Credit platform revenue
                {
                    accountType: 'PLATFORM_REV_COMMISSION',
                    direction: 'CREDIT',
                    amountCents: appFeeCents
                }
            ]
        });
    }
    /**
     * Post an off-platform commission accrual
     */
    async postOffPlatformAccrual({ tenantId, creatorId, currency, platform, date, netCents, rateBps, capLeftCents }) {
        // Calculate commission with cap
        const rawCommission = (netCents * BigInt(rateBps)) / 10000n;
        const commission = capLeftCents > 0n
            ? (rawCommission <= capLeftCents ? rawCommission : capLeftCents)
            : 0n;
        if (commission <= 0n)
            return null;
        // Create accrual transaction
        const tx = await this.createTransaction({
            tenantId,
            kind: 'OFFPLAT_COMM_ACCRUAL',
            currency,
            occurredAt: date,
            source: platform,
            memo: `${platform} commission accrual ${date.toISOString().slice(0, 10)}`,
            entries: [
                // Debit AR (amount owed by creator)
                {
                    accountType: 'AR_COMMISSION',
                    direction: 'DEBIT',
                    amountCents: commission,
                    ownerId: creatorId
                },
                // Credit platform revenue
                {
                    accountType: 'PLATFORM_REV_COMMISSION',
                    direction: 'CREDIT',
                    amountCents: commission
                }
            ]
        });
        // Update monthly cap
        const yearMonth = this.formatYearMonth(date);
        await this.updateMonthlyCapUsage(creatorId, yearMonth, currency, commission);
        return tx;
    }
    /**
     * Post AR settlement when invoice is paid
     */
    async postARSettlement({ tenantId, creatorId, currency, amountCents, stripeInvoiceId, occurredAt = new Date() }) {
        return this.createTransaction({
            tenantId,
            kind: 'AR_SETTLEMENT',
            currency,
            occurredAt,
            extRef: stripeInvoiceId,
            memo: `Invoice ${stripeInvoiceId} payment`,
            entries: [
                // Debit cash
                {
                    accountType: 'CASH_PLATFORM_STRIPE',
                    direction: 'DEBIT',
                    amountCents
                },
                // Credit AR (reduce amount owed)
                {
                    accountType: 'AR_COMMISSION',
                    direction: 'CREDIT',
                    amountCents,
                    ownerId: creatorId
                }
            ]
        });
    }
    /**
     * Post refund
     */
    async postRefund({ tenantId, creatorId, currency, refundCents, feeRefundCents, stripeEventId, occurredAt = new Date() }) {
        const netRefund = refundCents - feeRefundCents;
        return this.createTransaction({
            tenantId,
            kind: 'REFUND',
            currency,
            occurredAt,
            stripeEventId,
            memo: `Refund ${refundCents} ${currency}`,
            entries: [
                // Credit cash (money goes out)
                {
                    accountType: 'CASH_PLATFORM_STRIPE',
                    direction: 'CREDIT',
                    amountCents: refundCents
                },
                // Debit creator balance
                {
                    accountType: 'CREATOR_BALANCE',
                    direction: 'DEBIT',
                    amountCents: netRefund,
                    ownerId: creatorId
                },
                // Debit platform revenue (reverse commission)
                {
                    accountType: 'PLATFORM_REV_COMMISSION',
                    direction: 'DEBIT',
                    amountCents: feeRefundCents
                }
            ]
        });
    }
    /**
     * Get account balance
     */
    async getAccountBalance(tenantId, type, currency, ownerId) {
        const account = await this.prisma.ledgerAccount.findUnique({
            where: {
                tenantId_type_currency_ownerId: {
                    tenantId,
                    type,
                    currency,
                    ownerId: ownerId || null
                }
            }
        });
        return account?.balance || 0n;
    }
    /**
     * Get creator AR balance across all currencies
     */
    async getCreatorARBalance(creatorId) {
        const accounts = await this.prisma.ledgerAccount.findMany({
            where: {
                type: 'AR_COMMISSION',
                ownerId: creatorId
            }
        });
        return accounts.reduce((acc, account) => {
            acc[account.currency] = account.balance;
            return acc;
        }, {});
    }
    /**
     * Get monthly cap usage
     */
    async getMonthlyCapUsage(creatorId, yearMonth, currency) {
        const cap = await this.prisma.commissionCapMonthly.findUnique({
            where: {
                creatorId_yearMonth_currency: {
                    creatorId,
                    yearMonth,
                    currency
                }
            }
        });
        return {
            capCents: cap?.capCents || 0n,
            appliedCents: cap?.appliedCents || 0n,
            remainingCents: cap ? cap.capCents - cap.appliedCents : 0n
        };
    }
    // Private helpers
    async ensureAccount(tx, params) {
        const { tenantId, type, currency, ownerId } = params;
        return tx.ledgerAccount.upsert({
            where: {
                tenantId_type_currency_ownerId: {
                    tenantId,
                    type,
                    currency,
                    ownerId: ownerId || null
                }
            },
            create: {
                tenantId,
                type,
                currency,
                ownerId
            },
            update: {}
        });
    }
    calculateTotals(entries) {
        let debits = 0n;
        let credits = 0n;
        for (const entry of entries) {
            if (entry.direction === 'DEBIT') {
                debits += entry.amountCents;
            }
            else {
                credits += entry.amountCents;
            }
        }
        return { debits, credits };
    }
    formatYearMonth(date) {
        return date.toISOString().slice(0, 7);
    }
    async updateMonthlyCapUsage(creatorId, yearMonth, currency, amountCents) {
        // Get creator's current tier to determine cap
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId },
            select: { commissionTier: true }
        });
        const capCents = this.getCapForTier(creator?.commissionTier || 'STARTER');
        await this.prisma.commissionCapMonthly.upsert({
            where: {
                creatorId_yearMonth_currency: {
                    creatorId,
                    yearMonth,
                    currency
                }
            },
            create: {
                creatorId,
                yearMonth,
                currency,
                capCents,
                appliedCents: amountCents
            },
            update: {
                appliedCents: {
                    increment: amountCents
                }
            }
        });
    }
    getCapForTier(tier) {
        const caps = {
            STARTER: 50000n, // $500
            PRO: 250000n, // $2,500
            SCALE: 500000n, // $5,000
            ENTERPRISE: 1000000n // $10,000
        };
        return caps[tier] || 50000n;
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map