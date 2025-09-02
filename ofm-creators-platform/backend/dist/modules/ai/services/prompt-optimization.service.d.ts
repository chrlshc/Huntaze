import { PrismaService } from '../../../prisma/prisma.service';
interface OptimizationResult {
    original: string;
    optimized: string;
    originalTokens: number;
    optimizedTokens: number;
    reduction: number;
    qualityScore?: number;
}
export declare class PromptOptimizationService {
    private prisma;
    private readonly logger;
    private readonly compressionRules;
    constructor(prisma: PrismaService);
    optimizePrompt(prompt: string, context: {
        purpose: string;
        maxReduction?: number;
        preserveKeywords?: string[];
    }): Promise<OptimizationResult>;
    private applyCompressionRules;
    private removeExcessWhitespace;
    private optimizeByPurpose;
    private compressInstructions;
    private lightOptimization;
    private estimateTokens;
    runABTest(originalPrompt: string, optimizedPrompt: string, testConfig: {
        testId: string;
        iterations: number;
        model: string;
        evaluationCriteria: string[];
    }): Promise<any>;
    private simulateAPICall;
    private evaluateResponseQuality;
    private scoreRelevance;
    private scoreCompleteness;
    private scoreAccuracy;
    private scoreConciseness;
    private extractKeywords;
    private calculateCost;
    private analyzeABTestResults;
    private average;
    private getRecommendation;
    saveOptimizationResults(userId: string, results: OptimizationResult & {
        abTest?: any;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=prompt-optimization.service.d.ts.map