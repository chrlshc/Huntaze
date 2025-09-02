import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
interface ValidationResult {
    backupId: string;
    type: string;
    status: 'valid' | 'invalid' | 'error';
    expectedChecksum: string;
    actualChecksum?: string;
    error?: string;
    timestamp: Date;
}
export declare class ChecksumValidationService {
    private configService;
    private prisma;
    private readonly logger;
    private readonly s3Client;
    constructor(configService: ConfigService, prisma: PrismaService);
    validateDailyBackups(): Promise<void>;
    validateBackupType(type: string, datePrefix: string): Promise<ValidationResult[]>;
    validateBackup(key: string, type: string): Promise<ValidationResult>;
    private calculateChecksum;
    validateSpecificBackup(backupId: string): Promise<ValidationResult[]>;
    private summarizeResults;
    private logValidationResults;
    private sendValidationAlert;
    validateAllBackups(): Promise<any>;
}
export {};
//# sourceMappingURL=checksum-validation.service.d.ts.map