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
var ExifCleanerService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExifCleanerService = void 0;
const common_1 = require("@nestjs/common");
const sharp = __importStar(require("sharp"));
const ffmpeg = __importStar(require("fluent-ffmpeg"));
const exifr = __importStar(require("exifr"));
const s3_service_1 = require("../s3/s3.service");
const fs_1 = require("fs");
const promises_1 = require("stream/promises");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const uuid_1 = require("uuid");
let ExifCleanerService = ExifCleanerService_1 = class ExifCleanerService {
    s3Service;
    logger = new common_1.Logger(ExifCleanerService_1.name);
    tempDir = path.join(os.tmpdir(), 'exif-cleaner');
    constructor(s3Service) {
        this.s3Service = s3Service;
        // Ensure temp directory exists
        fs_1.promises.mkdir(this.tempDir, { recursive: true }).catch(() => { });
    }
    /**
     * Lambda handler for S3 upload events
     */
    async handleS3Upload(event) {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            try {
                await this.processFile(bucket, key);
            }
            catch (error) {
                this.logger.error(`Failed to process ${key}: ${error.message}`);
                throw error; // Let Lambda retry
            }
        }
    }
    /**
     * Process a single file
     */
    async processFile(bucket, key) {
        const startTime = Date.now();
        this.logger.log(`Processing file: s3://${bucket}/${key}`);
        // Check if already processed
        const tags = await this.s3Service.getObjectTags(bucket, key);
        if (tags['exif_cleaned'] === 'true') {
            this.logger.log('File already cleaned, skipping');
            return;
        }
        // Get file metadata
        const metadata = await this.s3Service.headObject(bucket, key);
        const contentType = metadata.ContentType || '';
        const fileSize = metadata.ContentLength || 0;
        // Process based on content type
        let cleanedKey;
        if (contentType.startsWith('image/')) {
            cleanedKey = await this.cleanImage(bucket, key);
        }
        else if (contentType.startsWith('video/')) {
            cleanedKey = await this.cleanVideo(bucket, key);
        }
        else {
            this.logger.log(`Skipping non-media file: ${contentType}`);
            return;
        }
        // Update tags
        await this.s3Service.putObjectTags(bucket, cleanedKey, {
            exif_cleaned: 'true',
            original_key: key,
            cleaned_at: new Date().toISOString(),
            processing_time_ms: (Date.now() - startTime).toString()
        });
        // Delete original if different key
        if (cleanedKey !== key && process.env.DELETE_ORIGINAL === 'true') {
            await this.s3Service.deleteObject(bucket, key);
            this.logger.log(`Deleted original file: ${key}`);
        }
        this.logger.log(`File cleaned successfully in ${Date.now() - startTime}ms`);
    }
    /**
     * Clean EXIF from image
     */
    async cleanImage(bucket, key) {
        const tempInput = path.join(this.tempDir, `${(0, uuid_1.v4)()}_input`);
        const tempOutput = path.join(this.tempDir, `${(0, uuid_1.v4)()}_output`);
        try {
            // Download file
            await this.s3Service.downloadFile(bucket, key, tempInput);
            // Check EXIF data before cleaning
            const exifBefore = await this.extractExif(tempInput);
            if (Object.keys(exifBefore).length > 0) {
                this.logger.log(`Found EXIF data: ${JSON.stringify(Object.keys(exifBefore))}`);
            }
            // Clean EXIF using sharp
            await sharp(tempInput)
                .rotate() // Auto-rotate based on EXIF orientation
                .withMetadata({
                // Remove all metadata except copyright
                exif: {},
                icc: undefined,
                xmp: undefined,
                iptc: undefined
            })
                .toFile(tempOutput);
            // Verify EXIF removed
            const exifAfter = await this.extractExif(tempOutput);
            if (Object.keys(exifAfter).length > 0) {
                this.logger.warn(`Remaining EXIF data: ${JSON.stringify(exifAfter)}`);
            }
            // Upload cleaned file
            const cleanedKey = this.getCleanedKey(key);
            await this.s3Service.uploadFile({
                Bucket: bucket,
                Key: cleanedKey,
                Body: (0, fs_1.createReadStream)(tempOutput),
                ContentType: `image/${path.extname(key).slice(1)}`,
                Metadata: {
                    exif_cleaned: 'true',
                    cleaned_at: new Date().toISOString()
                }
            });
            return cleanedKey;
        }
        finally {
            // Cleanup temp files
            await Promise.all([
                fs_1.promises.unlink(tempInput).catch(() => { }),
                fs_1.promises.unlink(tempOutput).catch(() => { })
            ]);
        }
    }
    /**
     * Clean metadata from video
     */
    async cleanVideo(bucket, key) {
        const tempInput = path.join(this.tempDir, `${(0, uuid_1.v4)()}_input.mp4`);
        const tempOutput = path.join(this.tempDir, `${(0, uuid_1.v4)()}_output.mp4`);
        try {
            // Download file
            await this.s3Service.downloadFile(bucket, key, tempInput);
            // Clean metadata using ffmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .outputOptions([
                    '-map_metadata', '-1', // Remove all metadata
                    '-c', 'copy', // Copy streams without re-encoding
                    '-movflags', '+faststart' // Optimize for streaming
                ])
                    .on('start', (cmd) => {
                    this.logger.debug(`FFmpeg command: ${cmd}`);
                })
                    .on('progress', (progress) => {
                    this.logger.debug(`Processing: ${progress.percent}% done`);
                })
                    .on('error', (err) => {
                    this.logger.error(`FFmpeg error: ${err.message}`);
                    reject(err);
                })
                    .on('end', () => {
                    this.logger.log('Video metadata cleaned successfully');
                    resolve();
                })
                    .save(tempOutput);
            });
            // Upload cleaned file
            const cleanedKey = this.getCleanedKey(key);
            const uploadStream = this.s3Service.createMultipartUpload({
                Bucket: bucket,
                Key: cleanedKey,
                ContentType: 'video/mp4',
                Metadata: {
                    exif_cleaned: 'true',
                    cleaned_at: new Date().toISOString()
                }
            });
            await (0, promises_1.pipeline)((0, fs_1.createReadStream)(tempOutput), uploadStream);
            return cleanedKey;
        }
        finally {
            // Cleanup temp files
            await Promise.all([
                fs_1.promises.unlink(tempInput).catch(() => { }),
                fs_1.promises.unlink(tempOutput).catch(() => { })
            ]);
        }
    }
    /**
     * Extract EXIF data for verification
     */
    async extractExif(filePath) {
        try {
            const exif = await exifr.parse(filePath, {
                pick: ['GPS', 'Make', 'Model', 'DateTime', 'Software', 'Artist', 'Copyright']
            });
            return exif || {};
        }
        catch {
            return {};
        }
    }
    /**
     * Get cleaned file key
     */
    getCleanedKey(originalKey) {
        if (process.env.REPLACE_ORIGINAL === 'true') {
            return originalKey;
        }
        const dir = path.dirname(originalKey);
        const basename = path.basename(originalKey, path.extname(originalKey));
        const ext = path.extname(originalKey);
        return path.join(dir, `${basename}_clean${ext}`);
    }
    /**
     * Batch process existing files
     */
    async backfillExistingFiles(bucket, prefix = '', batchSize = 100) {
        this.logger.log(`Starting backfill for bucket: ${bucket}, prefix: ${prefix}`);
        let continuationToken;
        let totalProcessed = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        do {
            const listResult = await this.s3Service.listObjects({
                Bucket: bucket,
                Prefix: prefix,
                MaxKeys: batchSize,
                ContinuationToken: continuationToken
            });
            const objects = listResult.Contents || [];
            // Process in parallel with concurrency limit
            const concurrency = 5;
            for (let i = 0; i < objects.length; i += concurrency) {
                const batch = objects.slice(i, i + concurrency);
                await Promise.all(batch.map(async (obj) => {
                    try {
                        const tags = await this.s3Service.getObjectTags(bucket, obj.Key);
                        if (tags['exif_cleaned'] === 'true') {
                            totalSkipped++;
                            return;
                        }
                        await this.processFile(bucket, obj.Key);
                        totalProcessed++;
                    }
                    catch (error) {
                        this.logger.error(`Failed to process ${obj.Key}: ${error.message}`);
                        totalErrors++;
                    }
                }));
            }
            continuationToken = listResult.NextContinuationToken;
            this.logger.log(`Progress: Processed=${totalProcessed}, Skipped=${totalSkipped}, Errors=${totalErrors}`);
        } while (continuationToken);
        this.logger.log(`Backfill completed: Processed=${totalProcessed}, Skipped=${totalSkipped}, Errors=${totalErrors}`);
        return {
            processed: totalProcessed,
            skipped: totalSkipped,
            errors: totalErrors
        };
    }
    /**
     * Validate EXIF removal
     */
    async validateExifRemoval(bucket, key) {
        const tempFile = path.join(this.tempDir, `${(0, uuid_1.v4)()}_validate`);
        try {
            await this.s3Service.downloadFile(bucket, key, tempFile);
            const exif = await this.extractExif(tempFile);
            // Check for sensitive EXIF fields
            const sensitiveFields = ['GPS', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model', 'Software'];
            const foundSensitive = sensitiveFields.filter(field => exif[field] !== undefined);
            if (foundSensitive.length > 0) {
                this.logger.warn(`Found sensitive EXIF data in ${key}: ${foundSensitive.join(', ')}`);
                return false;
            }
            return true;
        }
        finally {
            await fs_1.promises.unlink(tempFile).catch(() => { });
        }
    }
};
exports.ExifCleanerService = ExifCleanerService;
exports.ExifCleanerService = ExifCleanerService = ExifCleanerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _a : Object])
], ExifCleanerService);
//# sourceMappingURL=exif-cleaner.service.js.map