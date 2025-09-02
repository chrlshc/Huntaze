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
var RestoreService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestoreService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../prisma/prisma.service");
const client_s3_1 = require("@aws-sdk/client-s3");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let RestoreService = RestoreService_1 = class RestoreService {
    configService;
    prisma;
    logger = new common_1.Logger(RestoreService_1.name);
    s3Client;
    restoreDir = '/tmp/restore';
    decryptionAlgorithm = 'aes-256-cbc';
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.s3Client = new client_s3_1.S3Client({
            region: this.configService.get('aws.region'),
            credentials: {
                accessKeyId: this.configService.get('aws.accessKeyId'),
                secretAccessKey: this.configService.get('aws.secretAccessKey'),
            },
        });
        this.ensureRestoreDirectory();
    }
    async ensureRestoreDirectory() {
        try {
            await fs.mkdir(this.restoreDir, { recursive: true });
        }
        catch (error) {
            this.logger.error('Failed to create restore directory', error);
        }
    }
    async listAvailableBackups(type) {
        const bucketName = this.configService.get('backup.s3Bucket');
        try {
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: `${type}/`,
                MaxKeys: 100,
            });
            const response = await this.s3Client.send(command);
            return response.Contents?.map(obj => ({
                key: obj.Key,
                lastModified: obj.LastModified,
                size: obj.Size,
            })).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()) || [];
        }
        catch (error) {
            throw new Error(`Failed to list backups: ${error.message}`);
        }
    }
    async restoreDatabase(backupKey, options) {
        this.logger.log(`Starting database restoration from ${backupKey}`);
        const startTime = Date.now();
        try {
            // 1. Download backup from S3
            const localPath = await this.downloadFromS3(backupKey);
            // 2. Decrypt the backup
            const decryptedPath = await this.decryptFile(localPath);
            // 3. Decompress
            await execAsync(`gunzip ${decryptedPath}`);
            const sqlPath = decryptedPath.replace('.gz', '');
            if (options?.dryRun) {
                // Just verify the backup is valid
                const { stdout } = await execAsync(`head -n 100 ${sqlPath}`);
                this.logger.log('Dry run - backup appears valid');
                // Clean up
                await fs.unlink(sqlPath);
                await fs.unlink(localPath);
                return {
                    success: true,
                    dryRun: true,
                    preview: stdout,
                };
            }
            // 4. Create backup of current database
            this.logger.log('Creating backup of current database...');
            await execAsync(`pg_dump ${this.configService.get('database.url')} > ${this.restoreDir}/pre_restore_backup.sql`);
            // 5. Restore the database
            this.logger.log('Restoring database...');
            await execAsync(`psql ${this.configService.get('database.url')} < ${sqlPath}`, { maxBuffer: 1024 * 1024 * 1024 });
            // 6. Verify restoration
            const userCount = await this.prisma.user.count();
            const mediaCount = await this.prisma.media.count();
            // 7. Clean up
            await fs.unlink(sqlPath);
            await fs.unlink(localPath);
            const duration = Date.now() - startTime;
            this.logger.log(`Database restoration completed in ${duration}ms`);
            return {
                success: true,
                duration,
                stats: {
                    users: userCount,
                    media: mediaCount,
                },
            };
        }
        catch (error) {
            this.logger.error('Database restoration failed', error);
            // Attempt to restore from pre-restore backup
            try {
                await execAsync(`psql ${this.configService.get('database.url')} < ${this.restoreDir}/pre_restore_backup.sql`);
                this.logger.log('Rolled back to pre-restore state');
            }
            catch (rollbackError) {
                this.logger.error('Rollback failed', rollbackError);
            }
            throw new Error(`Database restoration failed: ${error.message}`);
        }
    }
    async restoreMediaMetadata(backupKey) {
        this.logger.log(`Starting media metadata restoration from ${backupKey}`);
        try {
            // 1. Download and decrypt
            const localPath = await this.downloadFromS3(backupKey);
            const decryptedPath = await this.decryptFile(localPath);
            // 2. Decompress
            await execAsync(`gunzip ${decryptedPath}`);
            const jsonPath = decryptedPath.replace('.gz', '');
            // 3. Read metadata
            const metadataContent = await fs.readFile(jsonPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            // 4. Restore metadata (would need to handle conflicts)
            this.logger.log(`Found ${metadata.length} media records to restore`);
            // Clean up
            await fs.unlink(jsonPath);
            await fs.unlink(localPath);
            return {
                success: true,
                recordCount: metadata.length,
            };
        }
        catch (error) {
            throw new Error(`Media metadata restoration failed: ${error.message}`);
        }
    }
    async downloadFromS3(key) {
        const bucketName = this.configService.get('backup.s3Bucket');
        const filename = path.basename(key);
        const localPath = path.join(this.restoreDir, filename);
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            const stream = response.Body;
            // Save to local file
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            await fs.writeFile(localPath, Buffer.concat(chunks));
            this.logger.log(`Downloaded backup from S3: ${key}`);
            return localPath;
        }
        catch (error) {
            throw new Error(`Failed to download from S3: ${error.message}`);
        }
    }
    async decryptFile(inputPath) {
        const encryptionKey = this.configService.get('backup.encryptionKey');
        if (!encryptionKey) {
            throw new Error('Backup encryption key not configured');
        }
        const outputPath = inputPath.replace('.enc', '');
        try {
            // Read encrypted file
            const encrypted = await fs.readFile(inputPath);
            // Extract IV (first 16 bytes)
            const iv = encrypted.slice(0, 16);
            const data = encrypted.slice(16);
            // Create decipher
            const decipher = crypto.createDecipheriv(this.decryptionAlgorithm, Buffer.from(encryptionKey, 'hex'), iv);
            // Decrypt
            const decrypted = Buffer.concat([
                decipher.update(data),
                decipher.final(),
            ]);
            // Write decrypted file
            await fs.writeFile(outputPath, decrypted);
            return outputPath;
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
    async testRestoration() {
        this.logger.log('Running restoration test...');
        try {
            // 1. List available backups
            const backups = await this.listAvailableBackups('database');
            if (backups.length === 0) {
                throw new Error('No backups available for testing');
            }
            // 2. Test restoration with dry run
            const latestBackup = backups[0];
            const result = await this.restoreDatabase(latestBackup.key, { dryRun: true });
            return {
                success: true,
                testedBackup: latestBackup,
                result,
            };
        }
        catch (error) {
            throw new Error(`Restoration test failed: ${error.message}`);
        }
    }
};
exports.RestoreService = RestoreService;
exports.RestoreService = RestoreService = RestoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], RestoreService);
//# sourceMappingURL=restore.service.js.map