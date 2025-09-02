import { PrismaService } from '@infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '@infrastructure/cache/cache.service';
import { FanRelation } from '@prisma/client';
import { FanFilterDto, FanEngagementDto } from '../dto/fan-management.dto';
interface FanSegment {
    id: string;
    name: string;
    description: string;
    criteria: SegmentCriteria;
    fanCount?: number;
}
interface SegmentCriteria {
    tags?: string[];
    minLifetimeValue?: number;
    maxLifetimeValue?: number;
    minEngagementScore?: number;
    subscriptionStatus?: string[];
    daysSinceLastPurchase?: {
        min?: number;
        max?: number;
    };
    source?: string[];
    location?: string[];
    customFields?: Record<string, any>;
}
export declare class FanManagementService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly cache;
    private readonly segmentDefinitions;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, cache: CacheService);
    /**
     * Crée ou met à jour une relation fan-créateur
     */
    upsertFanRelation(creatorId: string, fanId: string, data: Partial<FanRelation>): Promise<FanRelation>;
    /**
     * Ajoute des tags à un fan
     */
    addTags(creatorId: string, fanId: string, tags: string[]): Promise<FanRelation>;
    /**
     * Retire des tags d'un fan
     */
    removeTags(creatorId: string, fanId: string, tags: string[]): Promise<FanRelation>;
    /**
     * Calcule et met à jour le score d'engagement
     */
    updateEngagementScore(creatorId: string, fanId: string): Promise<number>;
    /**
     * Obtient les fans par segment
     */
    getFansBySegment(creatorId: string, segmentId: string, options?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        fans: any[];
        total: number;
        segment: FanSegment;
    }>;
    /**
     * Crée un segment personnalisé
     */
    createCustomSegment(creatorId: string, name: string, description: string, criteria: SegmentCriteria): Promise<FanSegment>;
    /**
     * Met à jour les opt-ins de communication
     */
    updateCommunicationPreferences(creatorId: string, fanId: string, preferences: {
        emailOptIn?: boolean;
        smsOptIn?: boolean;
        pushOptIn?: boolean;
    }): Promise<FanRelation>;
    /**
     * Obtient les statistiques d'engagement des fans
     */
    getFanEngagementStats(creatorId: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<FanEngagementDto>;
    /**
     * Recherche avancée de fans
     */
    searchFans(creatorId: string, filter: FanFilterDto): Promise<{
        fans: any[];
        total: number;
        facets: Record<string, any>;
    }>;
    /**
     * Exporte les données des fans
     */
    exportFans(creatorId: string, format: 'csv' | 'json', filter?: FanFilterDto): Promise<Buffer>;
    private getSegmentDefinition;
    private getSegmentDescription;
    private getSubscriptionMetrics;
    private getPurchaseMetrics;
    private getInteractionMetrics;
    private enrichFanData;
    private countFansInSegment;
    private logConsentUpdate;
    private getDateRange;
    private countActiveFans;
    private countVIPFans;
    private countChurnedFans;
    private getAverageEngagementScore;
    private getAverageLTV;
    private getSegmentDistribution;
    private getTopFans;
    private getEngagementTrends;
    private getCommunicationOptInStats;
    private calculateFacets;
    private getTagCounts;
    private getEngagementRanges;
    private getValueRanges;
}
export {};
//# sourceMappingURL=fan-management.service.d.ts.map