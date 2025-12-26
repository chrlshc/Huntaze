import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class RestoreService {
    private configService;
    private prisma;
    private readonly logger;
    private readonly s3Client;
    private readonly restoreDir;
    private readonly decryptionAlgorithm;
    constructor(configService: ConfigService, prisma: PrismaService);
    private ensureRestoreDirectory;
    listAvailableBackups(type: 'database' | 'media-metadata' | 'configuration'): Promise<any>;
    restoreDatabase(backupKey: string, options?: {
        dryRun?: boolean;
    }): Promise<{
        success: boolean;
        dryRun: boolean;
        preview: string;
        duration?: undefined;
        stats?: undefined;
    } | {
        success: boolean;
        duration: number;
        stats: {
            users: any;
            media: any;
        };
        dryRun?: undefined;
        preview?: undefined;
    }>;
    restoreMediaMetadata(backupKey: string): Promise<{
        success: boolean;
        recordCount: any;
    }>;
    private downloadFromS3;
    private decryptFile;
    testRestoration(): Promise<any>;
}
//# sourceMappingURL=restore.service.d.ts.map