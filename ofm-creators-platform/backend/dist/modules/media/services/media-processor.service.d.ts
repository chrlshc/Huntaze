import { ConfigService } from '@nestjs/config';
export interface ProcessedMedia {
    path: string;
    hash: string;
    metadata: {
        width?: number;
        height?: number;
        format?: string;
        size: number;
        duration?: number;
    };
    watermarked: boolean;
}
export interface WatermarkOptions {
    text?: string;
    userId?: string;
    timestamp?: boolean;
    opacity?: number;
    position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}
export declare class MediaProcessorService {
    private configService;
    private readonly uploadDir;
    private readonly watermarkEnabled;
    constructor(configService: ConfigService);
    /**
     * Process uploaded media: strip EXIF, add watermark, generate hash
     */
    processMedia(filePath: string, options: {
        userId: string;
        sessionId?: string;
        watermark?: boolean;
        watermarkOptions?: WatermarkOptions;
    }): Promise<ProcessedMedia>;
    /**
     * Process image: strip EXIF and add watermark
     */
    private processImage;
    /**
     * Add watermark to image
     */
    private addImageWatermark;
    /**
     * Process video: strip metadata and add watermark
     */
    private processVideo;
    /**
     * Get video metadata using FFprobe
     */
    private getVideoMetadata;
    /**
     * Generate watermark text
     */
    private generateWatermarkText;
    /**
     * Get FFmpeg watermark position
     */
    private getVideoWatermarkPosition;
    /**
     * Generate file hash for duplicate detection
     */
    private generateFileHash;
    /**
     * Check if a file hash already exists (duplicate detection)
     */
    checkDuplicate(hash: string, userId: string): Promise<boolean>;
    /**
     * Generate unique filename
     */
    generateUniqueFilename(originalName: string, userId: string): string;
}
//# sourceMappingURL=media-processor.service.d.ts.map