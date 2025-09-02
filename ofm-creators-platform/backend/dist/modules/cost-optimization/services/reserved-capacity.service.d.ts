import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
interface UsagePattern {
    provider: string;
    service: string;
    avgMonthlyUsage: number;
    minUsage: number;
    maxUsage: number;
    trend: 'stable' | 'growing' | 'declining';
}
export declare class ReservedCapacityService {
    private configService;
    private prisma;
    private readonly logger;
    private reservedPlans;
    constructor(configService: ConfigService, prisma: PrismaService);
    analyzeUsagePatterns(): Promise<Map<string, UsagePattern>>;
    recommendReservedPlans(): Promise<any[]>;
    private calculateOpenAISavings;
    private calculateS3Savings;
    private calculateClaudeSavings;
    purchaseReservedCapacity(recommendation: any): Promise<void>;
    reviewReservations(): Promise<void>;
    private calculateUtilization;
    private calculateEndDate;
    private calculateTrend;
    private getS3UsagePattern;
    private loadReservedPlans;
    private sendUtilizationAlert;
    private planRenewal;
    getCostOptimizationReport(): Promise<any>;
    private getAllUtilizationRates;
}
export {};
//# sourceMappingURL=reserved-capacity.service.d.ts.map