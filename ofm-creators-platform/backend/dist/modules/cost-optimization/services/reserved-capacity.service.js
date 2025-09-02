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
var ReservedCapacityService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservedCapacityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ReservedCapacityService = ReservedCapacityService_1 = class ReservedCapacityService {
    configService;
    prisma;
    logger = new common_1.Logger(ReservedCapacityService_1.name);
    reservedPlans = [];
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.loadReservedPlans();
    }
    async analyzeUsagePatterns() {
        const patterns = new Map();
        // Analyze last 6 months of usage
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        // AI Usage Analysis
        const aiUsage = await this.prisma.aiUsageLog.groupBy({
            by: ['provider', 'model'],
            where: {
                timestamp: { gte: sixMonthsAgo },
            },
            _sum: { totalTokens: true, cost: true },
            _count: true,
        });
        // Calculate patterns
        for (const usage of aiUsage) {
            const monthlyAvg = usage._sum.totalTokens / 6;
            const pattern = {
                provider: usage.provider,
                service: usage.model,
                avgMonthlyUsage: monthlyAvg,
                minUsage: monthlyAvg * 0.8, // Assume 20% variance
                maxUsage: monthlyAvg * 1.2,
                trend: this.calculateTrend(usage.provider, usage.model),
            };
            patterns.set(`${usage.provider}-${usage.model}`, pattern);
        }
        return patterns;
    }
    async recommendReservedPlans() {
        const patterns = await this.analyzeUsagePatterns();
        const recommendations = [];
        // OpenAI Reserved Capacity
        const openAIPattern = patterns.get('azure-gpt-4');
        if (openAIPattern && openAIPattern.avgMonthlyUsage > 1000000) { // 1M tokens/month
            const monthlyCommitment = Math.floor(openAIPattern.minUsage * 0.9); // Conservative
            recommendations.push({
                provider: 'OpenAI',
                service: 'GPT-4',
                type: 'Reserved Throughput',
                recommendation: 'monthly',
                commitment: monthlyCommitment,
                estimatedSavings: this.calculateOpenAISavings(monthlyCommitment),
                riskLevel: 'low',
                breakEvenDays: 15,
            });
        }
        // AWS Reserved Instances for backup
        const s3Usage = await this.getS3UsagePattern();
        if (s3Usage.avgMonthlyGB > 1000) { // 1TB/month
            recommendations.push({
                provider: 'AWS',
                service: 'S3 Storage',
                type: 'Storage Commitment',
                recommendation: 'annual',
                commitment: Math.floor(s3Usage.avgMonthlyGB * 0.8),
                estimatedSavings: this.calculateS3Savings(s3Usage.avgMonthlyGB),
                riskLevel: 'very-low',
                breakEvenDays: 180,
            });
        }
        // Anthropic Usage Commitment
        const claudePattern = patterns.get('anthropic-claude-3');
        if (claudePattern && claudePattern.avgMonthlyUsage > 500000) {
            recommendations.push({
                provider: 'Anthropic',
                service: 'Claude',
                type: 'Usage Commitment',
                recommendation: 'monthly',
                commitment: claudePattern.minUsage,
                estimatedSavings: this.calculateClaudeSavings(claudePattern.minUsage),
                riskLevel: 'medium',
                breakEvenDays: 20,
            });
        }
        return recommendations;
    }
    calculateOpenAISavings(monthlyTokens) {
        const regularCost = (monthlyTokens / 1000) * 0.06; // $0.06 per 1K tokens
        const reservedCost = (monthlyTokens / 1000) * 0.048; // 20% discount
        return regularCost - reservedCost;
    }
    calculateS3Savings(monthlyGB) {
        const regularCost = monthlyGB * 0.023; // Standard storage
        const commitmentCost = monthlyGB * 0.0184; // 20% discount for commitment
        return (regularCost - commitmentCost) * 12; // Annual savings
    }
    calculateClaudeSavings(monthlyTokens) {
        const regularCost = (monthlyTokens / 1000) * 0.015;
        const commitmentCost = (monthlyTokens / 1000) * 0.012; // 20% discount
        return regularCost - commitmentCost;
    }
    async purchaseReservedCapacity(recommendation) {
        this.logger.log(`Purchasing reserved capacity: ${JSON.stringify(recommendation)}`);
        // Create reservation record
        const reservation = {
            provider: recommendation.provider,
            service: recommendation.service,
            commitment: recommendation.recommendation,
            units: recommendation.commitment,
            unitPrice: recommendation.estimatedSavings / recommendation.commitment,
            regularPrice: recommendation.estimatedSavings * 1.25,
            savings: recommendation.estimatedSavings,
            startDate: new Date(),
            endDate: this.calculateEndDate(recommendation.recommendation),
        };
        // Store in database
        await this.prisma.costReservation.create({
            data: {
                provider: reservation.provider,
                service: reservation.service,
                commitment: reservation.commitment,
                units: reservation.units,
                unitPrice: reservation.unitPrice,
                savings: reservation.savings,
                startDate: reservation.startDate,
                endDate: reservation.endDate,
                status: 'active',
            },
        });
        this.reservedPlans.push(reservation);
        // Log to audit trail
        await this.prisma.auditLog.create({
            data: {
                userId: 'system',
                action: 'purchase_reserved_capacity',
                resource: 'cost_optimization',
                resourceId: `${reservation.provider}-${reservation.service}`,
                details: reservation,
                ipAddress: '127.0.0.1',
                userAgent: 'system',
            },
        });
    }
    async reviewReservations() {
        this.logger.log('Reviewing reserved capacity utilization...');
        for (const plan of this.reservedPlans) {
            const utilization = await this.calculateUtilization(plan);
            if (utilization < 0.7) {
                this.logger.warn(`Low utilization for ${plan.provider} ${plan.service}: ${(utilization * 100).toFixed(1)}%`);
                // Send alert
                await this.sendUtilizationAlert(plan, utilization);
            }
            // Check if reservation is expiring soon
            const daysUntilExpiry = Math.floor((plan.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30) {
                await this.planRenewal(plan);
            }
        }
    }
    async calculateUtilization(plan) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        if (plan.provider === 'azure' || plan.provider === 'OpenAI') {
            const usage = await this.prisma.aiUsageLog.aggregate({
                where: {
                    provider: plan.provider,
                    timestamp: { gte: startOfMonth },
                },
                _sum: { totalTokens: true },
            });
            return (usage._sum.totalTokens || 0) / plan.units;
        }
        // Add other providers as needed
        return 0;
    }
    calculateEndDate(commitment) {
        const endDate = new Date();
        if (commitment === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        else if (commitment === 'annual') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        return endDate;
    }
    calculateTrend(provider, service) {
        // Would implement actual trend calculation based on historical data
        return 'stable';
    }
    async getS3UsagePattern() {
        // Would fetch from CloudWatch metrics
        return {
            avgMonthlyGB: 2000,
            trend: 'growing',
        };
    }
    async loadReservedPlans() {
        const plans = await this.prisma.costReservation.findMany({
            where: {
                status: 'active',
                endDate: { gte: new Date() },
            },
        });
        this.reservedPlans = plans.map(p => ({
            provider: p.provider,
            service: p.service,
            commitment: p.commitment,
            units: p.units,
            unitPrice: p.unitPrice,
            regularPrice: p.unitPrice * 1.25,
            savings: p.savings,
            startDate: p.startDate,
            endDate: p.endDate,
        }));
    }
    async sendUtilizationAlert(plan, utilization) {
        // Would send actual alert
        this.logger.warn(`Alert: ${plan.provider} utilization at ${(utilization * 100).toFixed(1)}%`);
    }
    async planRenewal(plan) {
        // Analyze if renewal makes sense
        const recentUtilization = await this.calculateUtilization(plan);
        if (recentUtilization > 0.8) {
            this.logger.log(`Planning renewal for ${plan.provider} ${plan.service}`);
            // Would implement auto-renewal logic
        }
    }
    async getCostOptimizationReport() {
        const activeReservations = await this.prisma.costReservation.findMany({
            where: { status: 'active' },
        });
        const totalSavings = activeReservations.reduce((sum, r) => sum + r.savings, 0);
        const recommendations = await this.recommendReservedPlans();
        const potentialSavings = recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0);
        return {
            currentReservations: activeReservations,
            monthlyReservedSavings: totalSavings,
            recommendations,
            potentialAdditionalSavings: potentialSavings,
            utilizationRates: await this.getAllUtilizationRates(),
        };
    }
    async getAllUtilizationRates() {
        const rates = [];
        for (const plan of this.reservedPlans) {
            rates.push({
                provider: plan.provider,
                service: plan.service,
                utilization: await this.calculateUtilization(plan),
            });
        }
        return rates;
    }
};
exports.ReservedCapacityService = ReservedCapacityService;
__decorate([
    (0, schedule_1.Cron)('0 0 * * MON') // Every Monday
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReservedCapacityService.prototype, "reviewReservations", null);
exports.ReservedCapacityService = ReservedCapacityService = ReservedCapacityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ReservedCapacityService);
//# sourceMappingURL=reserved-capacity.service.js.map