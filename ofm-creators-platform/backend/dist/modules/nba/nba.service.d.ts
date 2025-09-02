import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export interface NBAAction {
    id: string;
    title: string;
    description: string;
    priority: number;
    score: number;
    impact: number;
    probability: number;
    confidence: number;
    effort: number;
    risk: number;
    reason: string;
    params: Record<string, any>;
    expectedRevenue?: number;
    affectedFans?: number;
}
export interface NBAContext {
    creatorId: string;
    maxActions?: number;
    includeReasons?: boolean;
    filters?: {
        minScore?: number;
        categories?: string[];
    };
}
export declare class NBAService {
    private prisma;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    getNextBestActions(context: NBAContext): Promise<NBAAction[]>;
    private gatherCreatorMetrics;
    private generateCandidateActions;
    private calculateScore;
    private getExpiringSubscriptions;
    private getInactiveVips;
    private getTopPerformingAsset;
    private getNonSubscribedActiveFans;
    executeAction(creatorId: string, actionId: string, params: Record<string, any>): Promise<{
        actionId: string;
        status: string;
        message: string;
    }>;
}
//# sourceMappingURL=nba.service.d.ts.map