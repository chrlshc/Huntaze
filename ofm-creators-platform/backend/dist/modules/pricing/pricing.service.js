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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const cache_service_1 = require("@infrastructure/cache/cache.service");
let PricingService = class PricingService {
    configService;
    prisma;
    cache;
    config;
    constructor(configService, prisma, cache) {
        this.configService = configService;
        this.prisma = prisma;
        this.cache = cache;
        // Default USD pricing configuration
        this.config = {
            mode: 'flat_by_band',
            tiers: [
                { upToCents: 1000000, bps: 2000 }, // 0-$10k: 20%
                { upToCents: 2000000, bps: 1500 }, // $10k-$20k: 15%
                { upToCents: 5000000, bps: 1000 }, // $20k-$50k: 10%
                { upToCents: null, bps: 500 } // >$50k: 5%
            ],
            starter: {
                growth: {
                    enabled: true,
                    days: 90,
                    monthlyFreeNetCents: 50000 // $500
                },
                minFeeCents: 900 // $9
            },
            plans: {
                PRO: {
                    feeCents: 6900, // $69/mo
                    capCents: 69900, // $699 cap
                    eligibleNetPrevMonthCents: 400000, // $4k
                    softTailBps: 100 // 1% above cap
                },
                SCALE: {
                    feeCents: 9900, // $99/mo
                    capCents: 199900, // $1,999 cap
                    eligibleNetPrevMonthCents: 1500000, // $15k
                    softTailBps: 25 // 0.25% above cap
                },
                ENT: {
                    feeCents: 49900, // $499/mo
                    flatBps: 200 // 2% flat
                }
            }
        };
    }
    /**
     * Calculate commission for a given amount and plan
     */
    async calculateCommission({ creatorId, netAmountCents, currency = 'USD', month, plan = 'STARTER' }) {
        // Get month-to-date NET before this amount
        const monthToDate = await this.getMonthToDateNet(creatorId, month, currency);
        // Check if in Starter Growth period
        const inGrowthPeriod = await this.isInStarterGrowth(creatorId);
        // Get cap usage for the month
        const capUsage = await this.getMonthlyCapUsage(creatorId, month, currency);
        // Calculate base commission
        const baseCommission = this.calculateBaseCommission(monthToDate, netAmountCents, this.config.mode, this.config.tiers);
        // Apply plan-specific rules
        let finalCommission = baseCommission;
        let capApplied = 0n;
        let softTailAmount = 0n;
        if (plan === 'STARTER' && inGrowthPeriod) {
            // Apply Starter Growth: 0% on first $500/month
            const growthRemaining = BigInt(this.config.starter.growth.monthlyFreeNetCents) - monthToDate;
            if (growthRemaining > 0n) {
                const exemptAmount = growthRemaining < netAmountCents ? growthRemaining : netAmountCents;
                const exemptCommission = this.calculateBaseCommission(monthToDate, exemptAmount, this.config.mode, this.config.tiers);
                finalCommission -= exemptCommission;
            }
        }
        // Apply cap for PRO/SCALE plans
        const planConfig = this.config.plans[plan];
        if (planConfig?.capCents) {
            const capCents = BigInt(planConfig.capCents);
            const capRemaining = capCents - capUsage.appliedCents;
            if (finalCommission > capRemaining) {
                capApplied = finalCommission - capRemaining;
                finalCommission = capRemaining;
                // Apply soft tail if configured
                if (planConfig.softTailBps && capApplied > 0n) {
                    const effectiveRate = this.getEffectiveRate(monthToDate, netAmountCents);
                    const capThreshold = (capCents * 10000n) / BigInt(effectiveRate);
                    const netAboveCap = (monthToDate + netAmountCents) - capThreshold;
                    if (netAboveCap > 0n) {
                        softTailAmount = (netAboveCap * BigInt(planConfig.softTailBps)) / 10000n;
                    }
                }
            }
        }
        // Apply minimum fee (after growth period)
        if (plan === 'STARTER' && !inGrowthPeriod) {
            const minFee = BigInt(this.config.starter.minFeeCents);
            if (finalCommission < minFee) {
                finalCommission = minFee;
            }
        }
        // Apply Enterprise flat rate
        if (plan === 'ENTERPRISE' && this.config.plans.ENT?.flatBps) {
            finalCommission = (netAmountCents * BigInt(this.config.plans.ENT.flatBps)) / 10000n;
        }
        return {
            netAmountCents,
            baseCommissionCents: baseCommission,
            capAppliedCents: capApplied,
            softTailCents: softTailAmount,
            finalCommissionCents: finalCommission + softTailAmount,
            effectiveRate: Number(((finalCommission + softTailAmount) * 10000n) / netAmountCents) / 100,
            breakdown: {
                monthToDateBeforeCents: monthToDate,
                inGrowthPeriod,
                capUsage: {
                    limitCents: planConfig?.capCents || null,
                    usedCents: Number(capUsage.appliedCents),
                    remainingCents: planConfig?.capCents
                        ? planConfig.capCents - Number(capUsage.appliedCents)
                        : null
                }
            }
        };
    }
    /**
     * Simulate pricing for different plans
     */
    async simulatePricing({ creatorId, monthlyNetCents, currency = 'USD' }) {
        const results = {};
        for (const plan of ['STARTER', 'PRO', 'SCALE', 'ENTERPRISE']) {
            const planConfig = this.config.plans[plan];
            // Calculate commission for the full month
            const commission = await this.calculateCommission({
                creatorId: creatorId || 'simulation',
                netAmountCents: monthlyNetCents,
                currency,
                month: new Date().toISOString().slice(0, 7),
                plan
            });
            const monthlyFeeCents = plan === 'STARTER' ? 0 : (planConfig?.feeCents || 0);
            const totalCostCents = commission.finalCommissionCents + BigInt(monthlyFeeCents);
            results[plan] = {
                plan,
                monthlyFeeCents,
                commissionCents: Number(commission.finalCommissionCents),
                totalCostCents: Number(totalCostCents),
                effectiveRate: commission.effectiveRate,
                takeHomeNetCents: Number(monthlyNetCents - commission.finalCommissionCents),
                eligibility: this.checkPlanEligibility(plan, monthlyNetCents),
                savings: plan !== 'STARTER' ? {
                    vsStarter: Number(results.STARTER?.totalCostCents || 0) - Number(totalCostCents),
                    percentage: results.STARTER
                        ? ((Number(results.STARTER.totalCostCents) - Number(totalCostCents)) / Number(results.STARTER.totalCostCents) * 100).toFixed(1)
                        : '0'
                } : null
            };
        }
        return {
            monthlyNetCents: Number(monthlyNetCents),
            currency,
            recommendations: this.getRecommendations(results, monthlyNetCents),
            plans: results
        };
    }
    /**
     * Get plan recommendations
     */
    async getPlanAdvice(creatorId) {
        // Get last 3 months of NET revenue
        const revenueHistory = await this.getRevenueHistory(creatorId, 3);
        // Get current plan and cap usage
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId },
            select: { currentPlan: true }
        });
        const currentPlan = creator?.currentPlan || 'STARTER';
        const avgMonthlyNet = this.calculateAverageNet(revenueHistory);
        // Get cap hit rate
        const capHitRate = await this.getCapHitRate(creatorId, 3);
        // Generate advice
        const advice = {
            currentPlan,
            avgMonthlyNetCents: avgMonthlyNet,
            capHitRate,
            recommendation: null,
            reason: null,
            potentialSavings: null
        };
        // Check if should upgrade
        if (currentPlan === 'STARTER' && avgMonthlyNet > 400000n) { // >$4k
            advice.recommendation = 'PRO';
            advice.reason = 'Your revenue exceeds $4,000/month. PRO plan would cap your commission at $699.';
            const simulation = await this.simulatePricing({ creatorId, monthlyNetCents: avgMonthlyNet });
            advice.potentialSavings = simulation.plans.STARTER.totalCostCents - simulation.plans.PRO.totalCostCents;
        }
        else if (currentPlan === 'PRO' && capHitRate > 0.66) {
            advice.recommendation = 'SCALE';
            advice.reason = 'You hit the PRO cap frequently. SCALE offers a higher cap of $1,999.';
            const simulation = await this.simulatePricing({ creatorId, monthlyNetCents: avgMonthlyNet });
            advice.potentialSavings = simulation.plans.PRO.totalCostCents - simulation.plans.SCALE.totalCostCents;
        }
        else if (avgMonthlyNet > 5000000n) { // >$50k
            advice.recommendation = 'ENTERPRISE';
            advice.reason = 'Your high volume qualifies for Enterprise pricing with custom terms.';
        }
        return advice;
    }
    // Private helper methods
    calculateBaseCommission(netBeforeCents, deltaNetCents, mode, tiers) {
        if (mode === 'flat_by_band') {
            return this.calculateFlatByBand(netBeforeCents, deltaNetCents, tiers);
        }
        else {
            return this.calculateMarginal(netBeforeCents, deltaNetCents, tiers);
        }
    }
    calculateFlatByBand(netBeforeCents, deltaNetCents, tiers) {
        const totalNet = netBeforeCents + deltaNetCents;
        // Find which tier the total falls into
        const tier = tiers.find(t => t.upToCents === null || totalNet <= BigInt(t.upToCents)) || tiers[tiers.length - 1];
        // Apply the tier rate to the delta
        return (deltaNetCents * BigInt(tier.bps)) / 10000n;
    }
    calculateMarginal(netBeforeCents, deltaNetCents, tiers) {
        let remaining = deltaNetCents;
        let commission = 0n;
        let currentPosition = netBeforeCents;
        for (const tier of tiers) {
            const tierLimit = tier.upToCents ? BigInt(tier.upToCents) : null;
            if (remaining <= 0n)
                break;
            if (!tierLimit || currentPosition < tierLimit) {
                const spaceInTier = tierLimit
                    ? tierLimit - currentPosition
                    : remaining;
                const amountInTier = spaceInTier < remaining ? spaceInTier : remaining;
                commission += (amountInTier * BigInt(tier.bps)) / 10000n;
                remaining -= amountInTier;
                currentPosition += amountInTier;
            }
        }
        return commission;
    }
    async getMonthToDateNet(creatorId, month, currency) {
        const cacheKey = `net:${creatorId}:${month}:${currency}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return BigInt(cached);
        }
        // Calculate from normalized earnings
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        const result = await this.prisma.normalizedEarning.aggregate({
            where: {
                source: { creatorId },
                occurredAt: {
                    gte: startDate,
                    lt: endDate
                },
                currency
            },
            _sum: { netCents: true }
        });
        const total = result._sum.netCents || 0n;
        await this.cache.set(cacheKey, total.toString(), 300); // Cache for 5 minutes
        return total;
    }
    async getMonthlyCapUsage(creatorId, month, currency) {
        const cap = await this.prisma.commissionCapMonthly.findUnique({
            where: {
                creatorId_yearMonth_currency: {
                    creatorId,
                    yearMonth: month,
                    currency
                }
            }
        });
        return {
            appliedCents: cap?.appliedCents || 0n,
            capCents: cap?.capCents || 0n
        };
    }
    async isInStarterGrowth(creatorId) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId },
            select: { createdAt: true, currentPlan: true }
        });
        if (!creator || creator.currentPlan !== 'STARTER') {
            return false;
        }
        const daysSinceCreation = Math.floor((Date.now() - creator.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreation <= this.config.starter.growth.days;
    }
    getEffectiveRate(netBeforeCents, deltaNetCents) {
        const commission = this.calculateBaseCommission(netBeforeCents, deltaNetCents, this.config.mode, this.config.tiers);
        return Number((commission * 10000n) / deltaNetCents);
    }
    checkPlanEligibility(plan, monthlyNetCents) {
        const planConfig = this.config.plans[plan];
        if (!planConfig?.eligibleNetPrevMonthCents) {
            return true; // No eligibility requirement
        }
        return monthlyNetCents >= BigInt(planConfig.eligibleNetPrevMonthCents);
    }
    getRecommendations(results, monthlyNetCents) {
        const recommendations = [];
        // Check if PRO would save money
        if (results.PRO.totalCostCents < results.STARTER.totalCostCents) {
            recommendations.push(`PRO plan would save you $${(results.STARTER.totalCostCents - results.PRO.totalCostCents) / 100}/month`);
        }
        // Check if approaching PRO cap
        if (monthlyNetCents > 600000n && monthlyNetCents < 1500000n) {
            recommendations.push('Consider SCALE plan as you approach the PRO cap');
        }
        // Check if eligible for Enterprise
        if (monthlyNetCents > 5000000n) {
            recommendations.push('You qualify for Enterprise pricing - contact sales');
        }
        return recommendations;
    }
    async getRevenueHistory(creatorId, months) {
        const history = [];
        const now = new Date();
        for (let i = 0; i < months; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.toISOString().slice(0, 7);
            const net = await this.getMonthToDateNet(creatorId, month, 'USD');
            history.push({ month, netCents: net });
        }
        return history;
    }
    calculateAverageNet(history) {
        if (history.length === 0)
            return 0n;
        const total = history.reduce((sum, h) => sum + h.netCents, 0n);
        return total / BigInt(history.length);
    }
    async getCapHitRate(creatorId, months) {
        const history = await this.prisma.commissionCapMonthly.findMany({
            where: {
                creatorId,
                currency: 'USD'
            },
            orderBy: { yearMonth: 'desc' },
            take: months
        });
        if (history.length === 0)
            return 0;
        const hitCount = history.filter(h => h.appliedCents >= h.capCents).length;
        return hitCount / history.length;
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, typeof (_a = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _a : Object])
], PricingService);
//# sourceMappingURL=pricing.service.js.map