import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
interface AIRequest {
    prompt: string;
    model: string;
    maxTokens: number;
    temperature: number;
    userId: string;
    purpose: string;
}
export declare class AICostOptimizerService {
    private configService;
    private prisma;
    private readonly logger;
    private requestCache;
    private monthlyBudget;
    private monthlySpent;
    constructor(configService: ConfigService, prisma: PrismaService);
    optimizeAIRequest(request: AIRequest): Promise<any>;
    private selectProvider;
    private optimizeParameters;
    private canBatch;
    private addToBatch;
    private generateCacheKey;
    private getFromCache;
    private cacheResponse;
    private estimateTokens;
    private calculateCost;
    private isSimpleTask;
    private executeRequest;
    private trackCost;
    resetMonthlyBudget(): Promise<void>;
    loadMonthlySpending(): Promise<void>;
    getUsageReport(): Promise<any>;
    private calculateCacheHitRate;
    processBatch(requests: AIRequest[]): Promise<any[]>;
    private groupSimilarRequests;
    private processBatchGroup;
    private createBatchPrompt;
    private splitBatchResponse;
}
export {};
//# sourceMappingURL=ai-cost-optimizer.service.d.ts.map