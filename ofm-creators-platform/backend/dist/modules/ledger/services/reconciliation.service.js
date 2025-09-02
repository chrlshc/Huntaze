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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const stripe_service_1 = require("@infrastructure/stripe/stripe.service");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const schedule_1 = require("@nestjs/schedule");
let ReconciliationService = class ReconciliationService {
    prisma;
    stripe;
    cache;
    constructor(prisma, stripe, cache) {
        this.prisma = prisma;
        this.stripe = stripe;
        this.cache = cache;
    }
    /**
     * Daily reconciliation job
     */
    async runDailyReconciliation() {
        console.log('Starting daily reconciliation...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        try {
            const result = await this.reconcileStripeTransactions(yesterday, today);
            // Store result
            await this.storeReconciliationResult(result);
            // Alert if issues found
            if (result.status !== 'matched') {
                await this.sendReconciliationAlert(result);
            }
            console.log('Daily reconciliation completed:', result);
        }
        catch (error) {
            console.error('Reconciliation failed:', error);
            // Send critical alert
        }
    }
    /**
     * Reconcile Stripe transactions with ledger
     */
    async reconcileStripeTransactions(startDate, endDate) {
        const result = {
            date: new Date(),
            status: 'matched',
            stripeBalance: 0n,
            ledgerBalance: 0n,
            difference: 0n,
            details: {
                matched: 0,
                unmatched: 0,
                missing: 0,
                errors: []
            }
        };
        try {
            // Fetch Stripe balance transactions
            const stripeTransactions = await this.fetchStripeBalanceTransactions(startDate, endDate);
            // Fetch ledger transactions
            const ledgerTransactions = await this.prisma.ledgerTransaction.findMany({
                where: {
                    occurredAt: {
                        gte: startDate,
                        lt: endDate
                    },
                    source: 'stripe'
                },
                include: {
                    entries: true
                }
            });
            // Create maps for comparison
            const stripeMap = new Map(stripeTransactions.map(tx => [tx.source?.charge || tx.id, tx]));
            const ledgerMap = new Map(ledgerTransactions.map(tx => [tx.stripeEventId || tx.id, tx]));
            // Compare transactions
            for (const [stripeId, stripeTx] of stripeMap) {
                const ledgerTx = ledgerMap.get(stripeId);
                if (!ledgerTx) {
                    result.details.missing++;
                    result.details.errors.push(`Missing in ledger: ${stripeId}`);
                    continue;
                }
                // Verify amounts match
                const stripeAmount = BigInt(stripeTx.amount);
                const ledgerAmount = this.calculateLedgerAmount(ledgerTx);
                if (stripeAmount !== ledgerAmount) {
                    result.details.unmatched++;
                    result.details.errors.push(`Amount mismatch for ${stripeId}: Stripe=${stripeAmount}, Ledger=${ledgerAmount}`);
                }
                else {
                    result.details.matched++;
                }
                result.stripeBalance += stripeAmount;
            }
            // Check for ledger entries without Stripe match
            for (const [ledgerId, ledgerTx] of ledgerMap) {
                if (!stripeMap.has(ledgerId)) {
                    result.details.unmatched++;
                    result.details.errors.push(`Extra in ledger: ${ledgerId}`);
                }
                result.ledgerBalance += this.calculateLedgerAmount(ledgerTx);
            }
            // Calculate final difference
            result.difference = result.stripeBalance - result.ledgerBalance;
            // Determine overall status
            if (result.difference === 0n && result.details.errors.length === 0) {
                result.status = 'matched';
            }
            else if (Math.abs(Number(result.difference)) < 100) { // $1 tolerance
                result.status = 'partial';
            }
            else {
                result.status = 'unmatched';
            }
        }
        catch (error) {
            result.status = 'unmatched';
            result.details.errors.push(`Exception: ${error.message}`);
        }
        return result;
    }
    /**
     * Reconcile AR balances
     */
    async reconcileAccountsReceivable() {
        // Get all AR accounts
        const arAccounts = await this.prisma.ledgerAccount.findMany({
            where: {
                type: 'AR_COMMISSION'
            }
        });
        let total = 0n;
        const byCreator = {};
        for (const account of arAccounts) {
            total += account.balance;
            if (account.ownerId) {
                byCreator[account.ownerId] = account.balance;
            }
        }
        // Calculate aging
        const now = new Date();
        const statements = await this.prisma.commissionStatement.findMany({
            where: {
                closedAt: { not: null },
                paidAt: null
            }
        });
        const aging = {
            current: 0n,
            days30: 0n,
            days60: 0n,
            days90Plus: 0n
        };
        for (const statement of statements) {
            const daysSinceClosed = Math.floor((now.getTime() - statement.closedAt.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceClosed <= 30) {
                aging.current += statement.finalCents;
            }
            else if (daysSinceClosed <= 60) {
                aging.days30 += statement.finalCents;
            }
            else if (daysSinceClosed <= 90) {
                aging.days60 += statement.finalCents;
            }
            else {
                aging.days90Plus += statement.finalCents;
            }
        }
        return { total, byCreator, aging };
    }
    /**
     * Verify ledger balance integrity
     */
    async verifyLedgerIntegrity() {
        const errors = [];
        // Check all transactions are balanced
        const unbalancedTxs = await this.prisma.$queryRaw `
      SELECT t.id, t.kind, t.currency,
        SUM(CASE WHEN e.direction = 'DEBIT' THEN e."amountCents" ELSE 0 END) as debits,
        SUM(CASE WHEN e.direction = 'CREDIT' THEN e."amountCents" ELSE 0 END) as credits
      FROM "LedgerTransaction" t
      JOIN "LedgerEntry" e ON e."txId" = t.id
      GROUP BY t.id, t.kind, t.currency
      HAVING SUM(CASE WHEN e.direction = 'DEBIT' THEN e."amountCents" ELSE 0 END) !=
             SUM(CASE WHEN e.direction = 'CREDIT' THEN e."amountCents" ELSE 0 END)
    `;
        for (const tx of unbalancedTxs) {
            errors.push(`Unbalanced transaction ${tx.id}: debits=${tx.debits}, credits=${tx.credits}`);
        }
        // Verify account balances match entries
        const accounts = await this.prisma.ledgerAccount.findMany();
        for (const account of accounts) {
            const calculatedBalance = await this.calculateAccountBalance(account.id);
            if (calculatedBalance !== account.balance) {
                errors.push(`Account ${account.id} balance mismatch: stored=${account.balance}, calculated=${calculatedBalance}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    // Private helpers
    async fetchStripeBalanceTransactions(startDate, endDate) {
        const transactions = [];
        let hasMore = true;
        let startingAfter;
        while (hasMore) {
            const response = await this.stripe.balanceTransactions.list({
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lt: Math.floor(endDate.getTime() / 1000)
                },
                limit: 100,
                starting_after: startingAfter
            });
            transactions.push(...response.data);
            hasMore = response.has_more;
            if (response.data.length > 0) {
                startingAfter = response.data[response.data.length - 1].id;
            }
        }
        return transactions;
    }
    calculateLedgerAmount(transaction) {
        // Sum all debit entries (should equal credit entries)
        return transaction.entries
            .filter((e) => e.direction === 'DEBIT')
            .reduce((sum, e) => sum + BigInt(e.amountCents), 0n);
    }
    async calculateAccountBalance(accountId) {
        const result = await this.prisma.$queryRaw `
      SELECT 
        SUM(CASE 
          WHEN e.direction = 'DEBIT' AND a.type IN ('CASH_PLATFORM_STRIPE', 'AR_COMMISSION', 'CREATOR_BALANCE') 
            THEN e."amountCents"
          WHEN e.direction = 'CREDIT' AND a.type IN ('CASH_PLATFORM_STRIPE', 'AR_COMMISSION', 'CREATOR_BALANCE') 
            THEN -e."amountCents"
          WHEN e.direction = 'DEBIT' AND a.type IN ('PLATFORM_REV_COMMISSION', 'TAX_PAYABLE', 'ALLOWANCE_DOUBTFUL') 
            THEN -e."amountCents"
          WHEN e.direction = 'CREDIT' AND a.type IN ('PLATFORM_REV_COMMISSION', 'TAX_PAYABLE', 'ALLOWANCE_DOUBTFUL') 
            THEN e."amountCents"
          ELSE 0
        END) as balance
      FROM "LedgerEntry" e
      JOIN "LedgerAccount" a ON a.id = e."accountId"
      WHERE e."accountId" = ${accountId}
    `;
        return BigInt(result[0]?.balance || 0);
    }
    async storeReconciliationResult(result) {
        const key = `reconciliation:${result.date.toISOString().split('T')[0]}`;
        await this.cache.set(key, result, 86400 * 30); // Store for 30 days
    }
    async sendReconciliationAlert(result) {
        // In production, this would send to monitoring service
        console.error('RECONCILIATION ALERT:', {
            status: result.status,
            difference: result.difference.toString(),
            errors: result.details.errors
        });
    }
};
exports.ReconciliationService = ReconciliationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReconciliationService.prototype, "runDailyReconciliation", null);
exports.ReconciliationService = ReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof stripe_service_1.StripeService !== "undefined" && stripe_service_1.StripeService) === "function" ? _a : Object, typeof (_b = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _b : Object])
], ReconciliationService);
//# sourceMappingURL=reconciliation.service.js.map