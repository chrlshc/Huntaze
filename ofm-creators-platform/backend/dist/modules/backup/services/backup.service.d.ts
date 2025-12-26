import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class BackupService {
    private configService;
    private prisma;
    private readonly logger;
    private readonly s3Client;
    private readonly backupDir;
    private readonly encryptionAlgorithm;
    constructor(configService: ConfigService, prisma: PrismaService);
    private ensureBackupDirectory;
    performDailyBackup(): Promise<void>;
    private backupDatabase;
    private backupMediaMetadata;
    private backupConfiguration;
    private encryptFile;
    private uploadToS3;
    private cleanupLocalBackups;
    private verifyBackups;
    private logBackupStatus;
    private sendBackupAlert;
    createManualBackup(type: 'full' | 'database' | 'media' | 'config'): Promise<{
        success: boolean;
        timestamp: Date;
        results: {
            type: string;
            status: string;
        }[];
    }>;
}
//# sourceMappingURL=backup.service.d.ts.map