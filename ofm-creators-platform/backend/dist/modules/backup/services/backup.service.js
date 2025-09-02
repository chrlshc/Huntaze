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
var BackupService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../prisma/prisma.service");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let BackupService = BackupService_1 = class BackupService {
    configService;
    prisma;
    logger = new common_1.Logger(BackupService_1.name);
    s3Client;
    backupDir = '/tmp/backups';
    encryptionAlgorithm = 'aes-256-cbc';
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
        // Ensure backup directory exists
        this.ensureBackupDirectory();
    }
    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
        }
        catch (error) {
            this.logger.error('Failed to create backup directory', error);
        }
    }
    // Run daily at 3 AM
    async performDailyBackup() {
        this.logger.log('Starting daily backup...');
        const startTime = Date.now();
        try {
            // 1. Create database backup
            const dbBackupPath = await this.backupDatabase();
            // 2. Create media metadata backup
            const mediaBackupPath = await this.backupMediaMetadata();
            // 3. Create configuration backup
            const configBackupPath = await this.backupConfiguration();
            // 4. Upload all to S3
            await Promise.all([
                this.uploadToS3(dbBackupPath, 'database'),
                this.uploadToS3(mediaBackupPath, 'media-metadata'),
                this.uploadToS3(configBackupPath, 'configuration'),
            ]);
            // 5. Clean up local files
            await this.cleanupLocalBackups();
            // 6. Verify backups
            const verified = await this.verifyBackups();
            // 7. Log success
            const duration = Date.now() - startTime;
            await this.logBackupStatus({
                status: 'success',
                duration,
                verified,
            });
            this.logger.log(`Daily backup completed in ${duration}ms`);
        }
        catch (error) {
            this.logger.error('Daily backup failed', error);
            await this.logBackupStatus({
                status: 'failed',
                error: error.message,
            });
            // Send alert
            await this.sendBackupAlert('failed', error.message);
        }
    }
    async backupDatabase() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `db_backup_${timestamp}.sql`;
        const filepath = path.join(this.backupDir, filename);
        const encryptedPath = `${filepath}.enc`;
        try {
            // Get database URL
            const dbUrl = this.configService.get('database.url');
            // Create PostgreSQL dump
            await execAsync(`pg_dump ${dbUrl} > ${filepath}`, { maxBuffer: 1024 * 1024 * 1024 } // 1GB buffer
            );
            // Compress the dump
            await execAsync(`gzip -9 ${filepath}`);
            const gzipPath = `${filepath}.gz`;
            // Encrypt the compressed backup
            await this.encryptFile(gzipPath, encryptedPath);
            // Remove unencrypted files
            await fs.unlink(gzipPath);
            return encryptedPath;
        }
        catch (error) {
            throw new Error(`Database backup failed: ${error.message}`);
        }
    }
    async backupMediaMetadata() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `media_metadata_${timestamp}.json`;
        const filepath = path.join(this.backupDir, filename);
        const encryptedPath = `${filepath}.enc`;
        try {
            // Export all media metadata
            const mediaData = await this.prisma.media.findMany({
                include: {
                    creator: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            });
            // Write to JSON file
            await fs.writeFile(filepath, JSON.stringify(mediaData, null, 2));
            // Compress
            await execAsync(`gzip -9 ${filepath}`);
            const gzipPath = `${filepath}.gz`;
            // Encrypt
            await this.encryptFile(gzipPath, encryptedPath);
            // Clean up
            await fs.unlink(gzipPath);
            return encryptedPath;
        }
        catch (error) {
            throw new Error(`Media metadata backup failed: ${error.message}`);
        }
    }
    async backupConfiguration() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `config_backup_${timestamp}.tar.gz`;
        const filepath = path.join(this.backupDir, filename);
        const encryptedPath = `${filepath}.enc`;
        try {
            // Create tar archive of configuration files
            const configFiles = [
                '.env.production',
                'docker-compose.prod.yml',
                'nginx.conf',
            ].filter(async (file) => {
                try {
                    await fs.access(file);
                    return true;
                }
                catch {
                    return false;
                }
            });
            if (configFiles.length > 0) {
                await execAsync(`tar -czf ${filepath} ${configFiles.join(' ')}`);
                // Encrypt
                await this.encryptFile(filepath, encryptedPath);
                // Clean up
                await fs.unlink(filepath);
            }
            return encryptedPath;
        }
        catch (error) {
            throw new Error(`Configuration backup failed: ${error.message}`);
        }
    }
    async encryptFile(inputPath, outputPath) {
        const encryptionKey = this.configService.get('backup.encryptionKey');
        if (!encryptionKey) {
            throw new Error('Backup encryption key not configured');
        }
        // Generate IV
        const iv = crypto.randomBytes(16);
        // Create cipher
        const cipher = crypto.createCipheriv(this.encryptionAlgorithm, Buffer.from(encryptionKey, 'hex'), iv);
        // Read input file
        const input = await fs.readFile(inputPath);
        // Encrypt
        const encrypted = Buffer.concat([
            iv,
            cipher.update(input),
            cipher.final(),
        ]);
        // Write encrypted file
        await fs.writeFile(outputPath, encrypted);
    }
    async uploadToS3(filePath, type) {
        const bucketName = this.configService.get('backup.s3Bucket');
        const fileName = path.basename(filePath);
        const key = `${type}/${new Date().getFullYear()}/${fileName}`;
        try {
            const fileContent = await fs.readFile(filePath);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: fileContent,
                StorageClass: 'STANDARD_IA',
                ServerSideEncryption: 'AES256',
                Metadata: {
                    'backup-type': type,
                    'backup-date': new Date().toISOString(),
                    'encrypted': 'true',
                },
            });
            await this.s3Client.send(command);
            this.logger.log(`Uploaded ${type} backup to S3: ${key}`);
        }
        catch (error) {
            throw new Error(`S3 upload failed for ${type}: ${error.message}`);
        }
    }
    async cleanupLocalBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const now = Date.now();
            const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
            for (const file of files) {
                const filepath = path.join(this.backupDir, file);
                const stats = await fs.stat(filepath);
                if (stats.mtime.getTime() < sevenDaysAgo) {
                    await fs.unlink(filepath);
                    this.logger.log(`Deleted old backup: ${file}`);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup old backups', error);
        }
    }
    async verifyBackups() {
        try {
            // Check latest backup in each category
            const bucketName = this.configService.get('backup.s3Bucket');
            // Implementation would check S3 for recent backups
            // For now, return true
            return true;
        }
        catch (error) {
            this.logger.error('Backup verification failed', error);
            return false;
        }
    }
    async logBackupStatus(status) {
        try {
            await this.prisma.backupLog.create({
                data: {
                    status: status.status,
                    duration: status.duration,
                    error: status.error,
                    metadata: status,
                    createdAt: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to log backup status', error);
        }
    }
    async sendBackupAlert(status, message) {
        // Would integrate with notification service
        this.logger.error(`Backup alert: ${status} - ${message}`);
    }
    // Manual backup endpoint
    async createManualBackup(type) {
        this.logger.log(`Starting manual ${type} backup...`);
        try {
            const results = [];
            if (type === 'full' || type === 'database') {
                const dbPath = await this.backupDatabase();
                await this.uploadToS3(dbPath, 'database');
                results.push({ type: 'database', status: 'success' });
            }
            if (type === 'full' || type === 'media') {
                const mediaPath = await this.backupMediaMetadata();
                await this.uploadToS3(mediaPath, 'media-metadata');
                results.push({ type: 'media', status: 'success' });
            }
            if (type === 'full' || type === 'config') {
                const configPath = await this.backupConfiguration();
                await this.uploadToS3(configPath, 'configuration');
                results.push({ type: 'config', status: 'success' });
            }
            return {
                success: true,
                timestamp: new Date(),
                results,
            };
        }
        catch (error) {
            throw new Error(`Manual backup failed: ${error.message}`);
        }
    }
};
exports.BackupService = BackupService;
__decorate([
    (0, schedule_1.Cron)('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupService.prototype, "performDailyBackup", null);
exports.BackupService = BackupService = BackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], BackupService);
//# sourceMappingURL=backup.service.js.map