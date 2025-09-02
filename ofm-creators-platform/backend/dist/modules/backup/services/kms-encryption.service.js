"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KmsEncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KmsEncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_kms_1 = require("@aws-sdk/client-kms");
const crypto = __importStar(require("crypto"));
let KmsEncryptionService = KmsEncryptionService_1 = class KmsEncryptionService {
    configService;
    logger = new common_1.Logger(KmsEncryptionService_1.name);
    kmsClient;
    keyAlias = 'alias/huntaze-backup-key';
    currentKeyId;
    constructor(configService) {
        this.configService = configService;
        this.kmsClient = new client_kms_1.KMSClient({
            region: this.configService.get('aws.region'),
            credentials: {
                accessKeyId: this.configService.get('aws.accessKeyId'),
                secretAccessKey: this.configService.get('aws.secretAccessKey'),
            },
        });
        this.initializeKey();
    }
    async initializeKey() {
        try {
            // Get current key from alias
            const command = new client_kms_1.DescribeKeyCommand({
                KeyId: this.keyAlias,
            });
            const response = await this.kmsClient.send(command);
            this.currentKeyId = response.KeyMetadata.KeyId;
            this.logger.log(`Using KMS key: ${this.currentKeyId}`);
        }
        catch (error) {
            if (error.name === 'NotFoundException') {
                // Create new key if alias doesn't exist
                await this.createBackupKey();
            }
            else {
                this.logger.error('Failed to initialize KMS key', error);
            }
        }
    }
    async createBackupKey() {
        try {
            // Create new KMS key
            const createKeyCommand = new client_kms_1.CreateKeyCommand({
                Description: 'Huntaze Platform Backup Encryption Key',
                KeyUsage: 'ENCRYPT_DECRYPT',
                Origin: 'AWS_KMS',
                MultiRegion: true, // Enable multi-region for disaster recovery
                Tags: [
                    { TagKey: 'Application', TagValue: 'Huntaze' },
                    { TagKey: 'Purpose', TagValue: 'BackupEncryption' },
                    { TagKey: 'Environment', TagValue: this.configService.get('app.env') },
                ],
            });
            const keyResponse = await this.kmsClient.send(createKeyCommand);
            this.currentKeyId = keyResponse.KeyMetadata.KeyId;
            // Create alias
            const createAliasCommand = new client_kms_1.CreateAliasCommand({
                AliasName: this.keyAlias,
                TargetKeyId: this.currentKeyId,
            });
            await this.kmsClient.send(createAliasCommand);
            this.logger.log(`Created new KMS key: ${this.currentKeyId}`);
        }
        catch (error) {
            this.logger.error('Failed to create KMS key', error);
            throw error;
        }
    }
    async encryptData(data) {
        try {
            // Generate data encryption key
            const generateKeyCommand = new client_kms_1.GenerateDataKeyCommand({
                KeyId: this.keyAlias,
                KeySpec: 'AES_256',
            });
            const keyResponse = await this.kmsClient.send(generateKeyCommand);
            // Use the plaintext key to encrypt data
            const cipher = crypto.createCipheriv('aes-256-gcm', keyResponse.Plaintext, crypto.randomBytes(16));
            const encrypted = Buffer.concat([
                cipher.update(data),
                cipher.final(),
                cipher.getAuthTag(),
            ]);
            // Clear plaintext key from memory
            keyResponse.Plaintext.fill(0);
            return {
                encryptedDataKey: Buffer.from(keyResponse.CiphertextBlob).toString('base64'),
                encryptedContent: encrypted,
                keyId: this.currentKeyId,
                algorithm: 'AES-256-GCM',
                timestamp: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Encryption failed', error);
            throw error;
        }
    }
    async decryptData(encryptedData) {
        try {
            // Decrypt the data encryption key
            const decryptCommand = new client_kms_1.DecryptCommand({
                CiphertextBlob: Buffer.from(encryptedData.encryptedDataKey, 'base64'),
                KeyId: encryptedData.keyId,
            });
            const keyResponse = await this.kmsClient.send(decryptCommand);
            // Use the decrypted key to decrypt data
            const decipher = crypto.createDecipheriv('aes-256-gcm', keyResponse.Plaintext, encryptedData.encryptedContent.slice(0, 16));
            decipher.setAuthTag(encryptedData.encryptedContent.slice(-16));
            const decrypted = Buffer.concat([
                decipher.update(encryptedData.encryptedContent.slice(16, -16)),
                decipher.final(),
            ]);
            // Clear plaintext key from memory
            keyResponse.Plaintext.fill(0);
            return decrypted;
        }
        catch (error) {
            this.logger.error('Decryption failed', error);
            throw error;
        }
    }
    async rotateKey() {
        this.logger.log('Starting KMS key rotation...');
        try {
            // Create new key
            const createKeyCommand = new client_kms_1.CreateKeyCommand({
                Description: `Huntaze Backup Key - Rotated ${new Date().toISOString()}`,
                KeyUsage: 'ENCRYPT_DECRYPT',
                Origin: 'AWS_KMS',
                MultiRegion: true,
                Tags: [
                    { TagKey: 'Application', TagValue: 'Huntaze' },
                    { TagKey: 'Purpose', TagValue: 'BackupEncryption' },
                    { TagKey: 'RotatedFrom', TagValue: this.currentKeyId },
                    { TagKey: 'RotationDate', TagValue: new Date().toISOString() },
                ],
            });
            const newKeyResponse = await this.kmsClient.send(createKeyCommand);
            const newKeyId = newKeyResponse.KeyMetadata.KeyId;
            // Update alias to point to new key
            const updateAliasCommand = new client_kms_1.UpdateAliasCommand({
                AliasName: this.keyAlias,
                TargetKeyId: newKeyId,
            });
            await this.kmsClient.send(updateAliasCommand);
            // Schedule old key for deletion (in 30 days)
            const scheduleDeleteCommand = new client_kms_1.ScheduleKeyDeletionCommand({
                KeyId: this.currentKeyId,
                PendingWindowInDays: 30,
            });
            await this.kmsClient.send(scheduleDeleteCommand);
            // Update current key reference
            const oldKeyId = this.currentKeyId;
            this.currentKeyId = newKeyId;
            this.logger.log(`Key rotation completed. Old: ${oldKeyId}, New: ${newKeyId}`);
            return newKeyId;
        }
        catch (error) {
            this.logger.error('Key rotation failed', error);
            throw error;
        }
    }
    async listKeys() {
        try {
            const command = new client_kms_1.ListKeysCommand({
                Limit: 100,
            });
            const response = await this.kmsClient.send(command);
            // Get details for each key
            const keyDetails = await Promise.all(response.Keys.map(async (key) => {
                try {
                    const describeCommand = new client_kms_1.DescribeKeyCommand({
                        KeyId: key.KeyId,
                    });
                    const details = await this.kmsClient.send(describeCommand);
                    return details.KeyMetadata;
                }
                catch {
                    return null;
                }
            }));
            // Filter Huntaze backup keys
            return keyDetails.filter((key) => key && key.Description?.includes('Huntaze') && key.Description?.includes('Backup'));
        }
        catch (error) {
            this.logger.error('Failed to list keys', error);
            throw error;
        }
    }
    async validateKeyAccess() {
        try {
            // Test encryption
            const testData = Buffer.from('test');
            const encrypted = await this.encryptData(testData);
            const decrypted = await this.decryptData(encrypted);
            return testData.equals(decrypted);
        }
        catch (error) {
            this.logger.error('Key validation failed', error);
            return false;
        }
    }
};
exports.KmsEncryptionService = KmsEncryptionService;
exports.KmsEncryptionService = KmsEncryptionService = KmsEncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KmsEncryptionService);
//# sourceMappingURL=kms-encryption.service.js.map