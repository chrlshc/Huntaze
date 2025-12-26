import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { KmsEncryptionService } from './kms-encryption.service';
export declare class BackupEnhancedService {
    private configService;
    private prisma;
    private kmsEncryption;
    private readonly logger;
    private readonly s3Client;
    private readonly backupDir;
    constructor(configService: ConfigService, prisma: PrismaService, kmsEncryption: KmsEncryptionService);
    private ensureBackupDirectory;
    performDailyBackup(): Promise<void>;
    private backupDatabaseWithChecksum;
    private uploadToS3WithMetadata;
    private verifyBackupIntegrity;
    rotateEncryptionKeys(): Promise<void>;
    private sendBackupAlert;
    private logBackupStatus;
    private cleanupLocalBackups;
    private backupMediaMetadata;
    private backupConfiguration;
}
//# sourceMappingURL=backup-enhanced.service.d.ts.map