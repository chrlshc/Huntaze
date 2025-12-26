"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionService = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
const client_1 = require("@prisma/client");
let CommissionService = class CommissionService {
    tiers = [
        {
            tier: client_1.CommissionTier.STARTER,
            rate: 0.20,
            minRevenue: 0,
            maxRevenue: 10000,
            cap: 500 // Cap mensuel à 500$ pour le plan Starter
        },
        {
            tier: client_1.CommissionTier.PRO,
            rate: 0.15,
            minRevenue: 10000,
            maxRevenue: 50000,
            cap: 2000 // Cap mensuel à 2000$ pour le plan Pro
        },
        {
            tier: client_1.CommissionTier.SCALE,
            rate: 0.10,
            minRevenue: 50000,
            maxRevenue: 200000,
            cap: 5000 // Cap mensuel à 5000$ pour le plan Scale
        },
        {
            tier: client_1.CommissionTier.ENTERPRISE,
            rate: 0.05,
            minRevenue: 200000,
            maxRevenue: null,
            cap: null // Pas de cap pour Enterprise
        }
    ];
    /**
     * Calcule la commission pour une transaction
     */
    calculateCommission(amount, creatorTier, monthlyCommissionToDate) {
        const tierConfig = this.tiers.find(t => t.tier === creatorTier);
        if (!tierConfig) {
            throw new Error(`Invalid commission tier: ${creatorTier}`);
        }
        const amountNumber = amount.toNumber();
        const monthlyCommissionNumber = monthlyCommissionToDate.toNumber();
        // Calcul de base de la commission
        let platformFee = amountNumber * tierConfig.rate;
        let capReached = false;
        // Application du cap si défini
        if (tierConfig.cap !== null) {
            const remainingCap = tierConfig.cap - monthlyCommissionNumber;
            if (remainingCap <= 0) {
                // Cap déjà atteint, pas de commission
                platformFee = 0;
                capReached = true;
            }
            else if (platformFee > remainingCap) {
                // La commission dépasse le cap restant
                platformFee = remainingCap;
                capReached = true;
            }
        }
        const netAmount = amountNumber - platformFee;
        return {
            platformFee: new library_1.Decimal(platformFee),
            platformFeeRate: new library_1.Decimal(tierConfig.rate),
            netAmount: new library_1.Decimal(netAmount),
            tierApplied: creatorTier,
            capReached
        };
    }
    /**
     * Détermine automatiquement le tier basé sur le revenu total
     */
    determineTier(totalRevenue) {
        const revenue = totalRevenue.toNumber();
        for (const tier of this.tiers) {
            if (revenue >= tier.minRevenue &&
                (tier.maxRevenue === null || revenue < tier.maxRevenue)) {
                return tier.tier;
            }
        }
        // Par défaut, retourner STARTER
        return client_1.CommissionTier.STARTER;
    }
    /**
     * Met à jour le tier d'un créateur si nécessaire
     */
    shouldUpdateTier(currentTier, totalRevenue) {
        const recommendedTier = this.determineTier(totalRevenue);
        if (recommendedTier !== currentTier) {
            return {
                shouldUpdate: true,
                newTier: recommendedTier
            };
        }
        return { shouldUpdate: false };
    }
    /**
     * Obtient les informations sur un tier
     */
    getTierInfo(tier) {
        return this.tiers.find(t => t.tier === tier);
    }
    /**
     * Calcule les économies potentielles pour le prochain tier
     */
    calculateSavingsForNextTier(currentTier, monthlyRevenue) {
        const currentTierIndex = this.tiers.findIndex(t => t.tier === currentTier);
        if (currentTierIndex === -1 || currentTierIndex === this.tiers.length - 1) {
            return null; // Tier invalide ou déjà au maximum
        }
        const currentTierConfig = this.tiers[currentTierIndex];
        const nextTierConfig = this.tiers[currentTierIndex + 1];
        const currentMonthlyFee = Math.min(monthlyRevenue * currentTierConfig.rate, currentTierConfig.cap || Infinity);
        const nextMonthlyFee = Math.min(monthlyRevenue * nextTierConfig.rate, nextTierConfig.cap || Infinity);
        const savings = currentMonthlyFee - nextMonthlyFee;
        const savingsPercentage = (savings / currentMonthlyFee) * 100;
        return {
            nextTier: nextTierConfig.tier,
            currentMonthlyFee,
            nextMonthlyFee,
            savings,
            savingsPercentage
        };
    }
};
exports.CommissionService = CommissionService;
exports.CommissionService = CommissionService = __decorate([
    (0, common_1.Injectable)()
], CommissionService);
//# sourceMappingURL=commission.service.js.map