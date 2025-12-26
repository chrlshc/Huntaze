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
var ChecksumValidationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChecksumValidationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../../prisma/prisma.service");
let ChecksumValidationService = ChecksumValidationService_1 = class ChecksumValidationService {
    configService;
    prisma;
    logger = new common_1.Logger(ChecksumValidationService_1.name);
    s3Client;
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
    }
    // Run validation daily at 5 AM (after backups complete)
    async validateDailyBackups() {
        this.logger.log('Starting daily backup checksum validation...');
        const results = [];
        try {
            // Get yesterday's backups
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const datePrefix = yesterday.toISOString().split('T')[0];
            // Validate each backup type
            for (const backupType of ['database', 'media-metadata', 'configuration']) {
                const validationResult = await this.validateBackupType(backupType, datePrefix);
                results.push(...validationResult);
            }
            // Log results
            const summary = this.summarizeResults(results);
            await this.logValidationResults(results, summary);
            // Alert if any failures
            if (summary.invalid > 0 || summary.errors > 0) {
                await this.sendValidationAlert(summary, results);
            }
            this.logger.log(`Validation completed: ${summary.valid} valid, ${summary.invalid} invalid, ${summary.errors} errors`);
        }
        catch (error) {
            this.logger.error('Backup validation failed', error);
            await this.sendValidationAlert({ error: error.message }, []);
        }
    }
    async validateBackupType(type, datePrefix) {
        const bucketName = this.configService.get('backup.s3Bucket');
        const results = [];
        try {
            // List objects for the given type and date
            const listCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: `${type}/${new Date().getFullYear()}/`,
                MaxKeys: 100,
            });
            const response = await this.s3Client.send(listCommand);
            const objects = response.Contents || [];
            // Filter for today's backups
            const todaysBackups = objects.filter(obj => obj.Key.includes(datePrefix.replace(/-/g, '')));
            // Validate each backup
            for (const obj of todaysBackups) {
                const result = await this.validateBackup(obj.Key, type);
                results.push(result);
            }
            return results;
        }
        catch (error) {
            this.logger.error(`Failed to validate ${type} backups`, error);
            return [{
                    backupId: 'unknown',
                    type,
                    status: 'error',
                    expectedChecksum: 'unknown',
                    error: error.message,
                    timestamp: new Date(),
                }];
        }
    }
    async validateBackup(key, type) {
        const bucketName = this.configService.get('backup.s3Bucket');
        try {
            // Get object metadata
            const headCommand = new client_s3_1.HeadObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            const metadata = await this.s3Client.send(headCommand);
            const expectedChecksum = metadata.Metadata?.checksum;
            const backupId = metadata.Metadata?.['backup-id'] || 'unknown';
            if (!expectedChecksum) {
                return {
                    backupId,
                    type,
                    status: 'error',
                    expectedChecksum: 'missing',
                    error: 'No checksum in metadata',
                    timestamp: new Date(),
                };
            }
            // Download and calculate actual checksum
            const actualChecksum = await this.calculateChecksum(bucketName, key);
            return {
                backupId,
                type,
                status: expectedChecksum === actualChecksum ? 'valid' : 'invalid',
                expectedChecksum,
                actualChecksum,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                backupId: 'unknown',
                type,
                status: 'error',
                expectedChecksum: 'unknown',
                error: error.message,
                timestamp: new Date(),
            };
        }
    }
    async calculateChecksum(bucket, key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const response = await this.s3Client.send(command);
        const stream = response.Body;
        const hash = crypto.createHash('sha256');
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }
    async validateSpecificBackup(backupId) {
        this.logger.log(`Validating specific backup: ${backupId}`);
        const results = [];
        try {
            // Find all objects with this backup ID
            const bucketName = this.configService.get('backup.s3Bucket');
            for (const type of ['database', 'media-metadata', 'configuration']) {
                const listCommand = new client_s3_1.ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: `${type}/`,
                });
                const response = await this.s3Client.send(listCommand);
                const objects = response.Contents || [];
                // Find objects with matching backup ID
                for (const obj of objects) {
                    const headCommand = new client_s3_1.HeadObjectCommand({
                        Bucket: bucketName,
                        Key: obj.Key,
                    });
                    const metadata = await this.s3Client.send(headCommand);
                    if (metadata.Metadata?.['backup-id'] === backupId) {
                        const result = await this.validateBackup(obj.Key, type);
                        results.push(result);
                    }
                }
            }
            return results;
        }
        catch (error) {
            this.logger.error(`Failed to validate backup ${backupId}`, error);
            throw error;
        }
    }
    summarizeResults(results) {
        return {
            total: results.length,
            valid: results.filter(r => r.status === 'valid').length,
            invalid: results.filter(r => r.status === 'invalid').length,
            errors: results.filter(r => r.status === 'error').length,
        };
    }
    async logValidationResults(results, summary) {
        try {
            // Log to database
            await this.prisma.backupValidation.create({
                data: {
                    timestamp: new Date(),
                    results: results,
                    summary: summary,
                    status: summary.invalid > 0 || summary.errors > 0 ? 'failed' : 'success',
                },
            });
            // Log to audit trail
            if (summary.invalid > 0 || summary.errors > 0) {
                await this.prisma.auditLog.create({
                    data: {
                        userId: 'system',
                        action: 'backup_validation_failed',
                        resource: 'backup',
                        resourceId: 'daily_validation',
                        details: {
                            summary,
                            failures: results.filter(r => r.status !== 'valid'),
                        },
                        ipAddress: '127.0.0.1',
                        userAgent: 'system',
                    },
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to log validation results', error);
        }
    }
    async sendValidationAlert(summary, results) {
        const webhook = this.configService.get('monitoring.webhook');
        if (!webhook)
            return;
        try {
            const message = summary.error
                ? `Backup validation error: ${summary.error}`
                : `Backup validation failed: ${summary.invalid} invalid, ${summary.errors} errors`;
            const payload = {
                event: 'backup_validation_alert',
                severity: 'high',
                message,
                summary,
                failures: results.filter(r => r.status !== 'valid'),
                timestamp: new Date(),
            };
            // Would send to monitoring webhook
            this.logger.warn(`Validation alert: ${message}`);
        }
        catch (error) {
            this.logger.error('Failed to send validation alert', error);
        }
    }
    // Manual validation endpoint
    async validateAllBackups() {
        const bucketName = this.configService.get('backup.s3Bucket');
        const allResults = [];
        try {
            for (const type of ['database', 'media-metadata', 'configuration']) {
                const listCommand = new client_s3_1.ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: `${type}/`,
                    MaxKeys: 1000,
                });
                const response = await this.s3Client.send(listCommand);
                const objects = response.Contents || [];
                // Validate each object
                for (const obj of objects) {
                    const result = await this.validateBackup(obj.Key, type);
                    allResults.push(result);
                    // Log progress
                    if (allResults.length % 10 === 0) {
                        this.logger.log(`Validated ${allResults.length} backups...`);
                    }
                }
            }
            const summary = this.summarizeResults(allResults);
            await this.logValidationResults(allResults, summary);
            return {
                summary,
                results: allResults,
                timestamp: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Full validation failed', error);
            throw error;
        }
    }
};
exports.ChecksumValidationService = ChecksumValidationService;
__decorate([
    (0, schedule_1.Cron)('0 5 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChecksumValidationService.prototype, "validateDailyBackups", null);
exports.ChecksumValidationService = ChecksumValidationService = ChecksumValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ChecksumValidationService);
//# sourceMappingURL=checksum-validation.service.js.map