import { ConfigService } from '@nestjs/config';
interface EncryptedData {
    encryptedDataKey: string;
    encryptedContent: Buffer;
    keyId: string;
    algorithm: string;
    timestamp: Date;
}
export declare class KmsEncryptionService {
    private configService;
    private readonly logger;
    private readonly kmsClient;
    private readonly keyAlias;
    private currentKeyId;
    constructor(configService: ConfigService);
    private initializeKey;
    private createBackupKey;
    encryptData(data: Buffer): Promise<EncryptedData>;
    decryptData(encryptedData: EncryptedData): Promise<Buffer>;
    rotateKey(): Promise<string>;
    listKeys(): Promise<any[]>;
    validateKeyAccess(): Promise<boolean>;
}
export {};
//# sourceMappingURL=kms-encryption.service.d.ts.map