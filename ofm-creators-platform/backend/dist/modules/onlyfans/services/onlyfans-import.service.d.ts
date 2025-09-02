import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { OffPlatformService } from '@modules/ledger/services/off-platform.service';
import { OnlyFansCSVImportDto, OnlyFansImportResultDto } from '../dto/csv-import.dto';
export declare class OnlyFansImportService {
    private readonly prisma;
    private readonly offPlatformService;
    private readonly logger;
    constructor(prisma: PrismaService, offPlatformService: OffPlatformService);
    importCSV(dto: OnlyFansCSVImportDto): Promise<OnlyFansImportResultDto>;
    private importSubscribers;
    private importRevenue;
    private importContent;
    private calculateEngagementScore;
    private getTierFromScore;
    getEngagementAnalytics(creatorId: string): Promise<{
        totalFans: number;
        averageEngagementScore: number;
        totalLifetimeValue: number;
        tierDistribution: {
            VIP: {
                count: number;
                percentage: string;
            };
            PREMIUM: {
                count: number;
                percentage: string;
            };
            ACTIVE: {
                count: number;
                percentage: string;
            };
            BASIC: {
                count: number;
                percentage: string;
            };
        };
        topFans: {
            username: string | null;
            score: number;
            lifetimeValue: number;
            lastInteraction: Date | null;
        }[];
    }>;
}
//# sourceMappingURL=onlyfans-import.service.d.ts.map