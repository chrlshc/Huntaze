import { S3Event } from 'aws-lambda';
import { S3Service } from '../s3/s3.service';
export declare class ExifCleanerService {
    private readonly s3Service;
    private readonly logger;
    private readonly tempDir;
    constructor(s3Service: S3Service);
    /**
     * Lambda handler for S3 upload events
     */
    handleS3Upload(event: S3Event): Promise<void>;
    /**
     * Process a single file
     */
    processFile(bucket: string, key: string): Promise<void>;
    /**
     * Clean EXIF from image
     */
    private cleanImage;
    /**
     * Clean metadata from video
     */
    private cleanVideo;
    /**
     * Extract EXIF data for verification
     */
    private extractExif;
    /**
     * Get cleaned file key
     */
    private getCleanedKey;
    /**
     * Batch process existing files
     */
    backfillExistingFiles(bucket: string, prefix?: string, batchSize?: number): Promise<{
        processed: number;
        skipped: number;
        errors: number;
    }>;
    /**
     * Validate EXIF removal
     */
    validateExifRemoval(bucket: string, key: string): Promise<boolean>;
}
//# sourceMappingURL=exif-cleaner.service.d.ts.map