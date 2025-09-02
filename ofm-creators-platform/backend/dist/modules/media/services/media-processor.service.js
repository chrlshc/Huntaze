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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaProcessorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sharp = __importStar(require("sharp"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let MediaProcessorService = class MediaProcessorService {
    configService;
    uploadDir;
    watermarkEnabled;
    constructor(configService) {
        this.configService = configService;
        this.uploadDir = this.configService.get('storage.uploadDir', './uploads');
        this.watermarkEnabled = this.configService.get('media.watermarkEnabled', true);
    }
    /**
     * Process uploaded media: strip EXIF, add watermark, generate hash
     */
    async processMedia(filePath, options) {
        const fileExt = path.extname(filePath).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExt);
        const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(fileExt);
        if (!isImage && !isVideo) {
            throw new Error(`Unsupported file type: ${fileExt}`);
        }
        // Generate content hash for duplicate detection
        const fileHash = await this.generateFileHash(filePath);
        let processedPath;
        let metadata;
        if (isImage) {
            const result = await this.processImage(filePath, {
                ...options,
                watermark: options.watermark ?? this.watermarkEnabled,
            });
            processedPath = result.path;
            metadata = result.metadata;
        }
        else {
            const result = await this.processVideo(filePath, {
                ...options,
                watermark: options.watermark ?? this.watermarkEnabled,
            });
            processedPath = result.path;
            metadata = result.metadata;
        }
        return {
            path: processedPath,
            hash: fileHash,
            metadata,
            watermarked: options.watermark ?? this.watermarkEnabled,
        };
    }
    /**
     * Process image: strip EXIF and add watermark
     */
    async processImage(inputPath, options) {
        const outputPath = inputPath.replace(/(\.[^.]+)$/, '_processed$1');
        // Load image with Sharp
        let pipeline = sharp(inputPath);
        // Get metadata before processing
        const metadata = await pipeline.metadata();
        // Strip EXIF data by rotating based on orientation then removing all metadata
        pipeline = pipeline.rotate(); // Auto-rotate based on EXIF
        // Add watermark if enabled
        if (options.watermark) {
            pipeline = await this.addImageWatermark(pipeline, {
                userId: options.userId,
                sessionId: options.sessionId,
                ...options.watermarkOptions,
            });
        }
        // Save without metadata (strips EXIF)
        await pipeline
            .withMetadata({
            // Only keep essential metadata, strip all EXIF
            orientation: undefined,
            exif: {},
            icc: undefined,
            iptc: {},
            xmp: {},
        })
            .toFile(outputPath);
        // Get file size
        const stats = await fs.stat(outputPath);
        // Clean up original
        await fs.unlink(inputPath);
        return {
            path: outputPath,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: stats.size,
            },
        };
    }
    /**
     * Add watermark to image
     */
    async addImageWatermark(pipeline, options) {
        const metadata = await pipeline.metadata();
        const width = metadata.width || 800;
        const height = metadata.height || 600;
        // Generate watermark text
        const watermarkText = options.text || this.generateWatermarkText(options);
        // Create watermark SVG
        const fontSize = Math.max(12, Math.min(width / 30, 24));
        const padding = fontSize;
        const textWidth = watermarkText.length * fontSize * 0.6;
        const textHeight = fontSize * 1.5;
        const watermarkSvg = Buffer.from(`
      <svg width="${textWidth + padding * 2}" height="${textHeight + padding}">
        <style>
          .watermark {
            fill: white;
            font-family: Arial, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          }
        </style>
        <rect x="0" y="0" width="${textWidth + padding * 2}" height="${textHeight + padding}" 
              fill="rgba(0,0,0,0.3)" rx="4"/>
        <text x="${padding}" y="${fontSize + padding / 2}" class="watermark">
          ${watermarkText}
        </text>
      </svg>
    `);
        // Calculate position
        let gravity;
        switch (options.position || 'bottom-right') {
            case 'center':
                gravity = 'center';
                break;
            case 'bottom-left':
                gravity = 'southwest';
                break;
            case 'top-right':
                gravity = 'northeast';
                break;
            case 'top-left':
                gravity = 'northwest';
                break;
            default:
                gravity = 'southeast';
        }
        // Apply watermark
        return pipeline.composite([
            {
                input: watermarkSvg,
                gravity,
                blend: 'over',
            },
        ]);
    }
    /**
     * Process video: strip metadata and add watermark
     */
    async processVideo(inputPath, options) {
        const outputPath = inputPath.replace(/(\.[^.]+)$/, '_processed$1');
        // Build FFmpeg command
        let ffmpegCmd = `ffmpeg -i "${inputPath}" -map_metadata -1 -c:v copy -c:a copy`;
        // Add watermark if enabled
        if (options.watermark) {
            const watermarkText = options.text || this.generateWatermarkText(options);
            const position = this.getVideoWatermarkPosition(options.position || 'bottom-right');
            ffmpegCmd = `ffmpeg -i "${inputPath}" -map_metadata -1 ` +
                `-vf "drawtext=text='${watermarkText}':fontcolor=white:fontsize=24:` +
                `box=1:boxcolor=black@0.5:boxborderw=5:${position}" ` +
                `-c:a copy`;
        }
        ffmpegCmd += ` -y "${outputPath}"`;
        // Execute FFmpeg
        try {
            await execAsync(ffmpegCmd);
        }
        catch (error) {
            console.error('FFmpeg error:', error);
            throw new Error('Failed to process video');
        }
        // Get video metadata
        const metadata = await this.getVideoMetadata(outputPath);
        // Clean up original
        await fs.unlink(inputPath);
        return {
            path: outputPath,
            metadata,
        };
    }
    /**
     * Get video metadata using FFprobe
     */
    async getVideoMetadata(videoPath) {
        try {
            const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration ` +
                `-of csv=s=x:p=0 "${videoPath}"`);
            const [width, height, duration] = stdout.trim().split('x').map(v => parseFloat(v));
            const stats = await fs.stat(videoPath);
            return {
                width: Math.round(width),
                height: Math.round(height),
                duration: Math.round(duration),
                format: 'video',
                size: stats.size,
            };
        }
        catch (error) {
            console.error('FFprobe error:', error);
            const stats = await fs.stat(videoPath);
            return {
                format: 'video',
                size: stats.size,
            };
        }
    }
    /**
     * Generate watermark text
     */
    generateWatermarkText(options) {
        const parts = [];
        // Add user ID (shortened)
        parts.push(`ID: ${options.userId.slice(-8)}`);
        // Add session ID if provided
        if (options.sessionId) {
            parts.push(`S: ${options.sessionId.slice(-6)}`);
        }
        // Add timestamp if requested
        if (options.timestamp !== false) {
            parts.push(new Date().toISOString().split('T')[0]);
        }
        return parts.join(' | ');
    }
    /**
     * Get FFmpeg watermark position
     */
    getVideoWatermarkPosition(position) {
        switch (position) {
            case 'center':
                return 'x=(w-text_w)/2:y=(h-text_h)/2';
            case 'bottom-left':
                return 'x=10:y=h-th-10';
            case 'top-right':
                return 'x=w-tw-10:y=10';
            case 'top-left':
                return 'x=10:y=10';
            default: // bottom-right
                return 'x=w-tw-10:y=h-th-10';
        }
    }
    /**
     * Generate file hash for duplicate detection
     */
    async generateFileHash(filePath) {
        const fileBuffer = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }
    /**
     * Check if a file hash already exists (duplicate detection)
     */
    async checkDuplicate(hash, userId) {
        // TODO: Check database for existing hash
        // This would query your media table to see if this hash exists
        // for this user or globally (depending on your requirements)
        return false;
    }
    /**
     * Generate unique filename
     */
    generateUniqueFilename(originalName, userId) {
        const ext = path.extname(originalName);
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        return `${userId}_${timestamp}_${random}${ext}`;
    }
};
exports.MediaProcessorService = MediaProcessorService;
exports.MediaProcessorService = MediaProcessorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MediaProcessorService);
//# sourceMappingURL=media-processor.service.js.map