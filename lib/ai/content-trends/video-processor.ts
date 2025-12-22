/**
 * Video Processing Pipeline for Content & Trends AI Engine
 * 
 * Handles video keyframe extraction, composite grid generation,
 * and Azure Blob Storage integration for multimodal analysis.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Keyframe {
  timestamp: number;
  imageData: Buffer;
  sceneChangeScore: number;
  position: KeyframePosition;
}

export type KeyframePosition = 'beginning' | 'quarter' | 'half' | 'three_quarter' | 'end';

export interface CompositeImage {
  gridData: Buffer;
  dimensions: { width: number; height: number };
  keyframePositions: GridPosition[];
  format: 'jpeg' | 'png';
  quality: number;
}

export interface GridPosition {
  keyframePosition: KeyframePosition;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  format: string;
}

export interface BlobUploadResult {
  url: string;
  sasUrl: string;
  blobName: string;
  containerName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export interface VideoProcessingResult {
  videoId: string;
  metadata: VideoMetadata;
  keyframes: Keyframe[];
  compositeImage: CompositeImage;
  blobResult?: BlobUploadResult;
  processingTimeMs: number;
}

export interface VideoProcessorConfig {
  maxImageDimension: number;
  gridLayout: '2x2' | '3x3';
  imageQuality: number;
  imageFormat: 'jpeg' | 'png';
  tempDirectory?: string;
  azureBlobConfig?: AzureBlobConfig;
}

export interface AzureBlobConfig {
  connectionString: string;
  containerName: string;
  sasTokenDuration: number; // in hours
}

export interface SceneChangeResult {
  timestamp: number;
  score: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: VideoProcessorConfig = {
  maxImageDimension: 2048,
  gridLayout: '2x2',
  imageQuality: 85,
  imageFormat: 'jpeg',
};

// ============================================================================
// Video Processor Class
// ============================================================================

export class VideoProcessor {
  private config: VideoProcessorConfig;
  private tempDir: string;

  constructor(config: Partial<VideoProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tempDir = this.config.tempDirectory || os.tmpdir();
  }

  /**
   * Process a video and extract keyframes into a composite grid
   */
  async processVideo(videoSource: string | Buffer): Promise<VideoProcessingResult> {
    const startTime = Date.now();
    const videoId = uuidv4();
    const workDir = path.join(this.tempDir, `video-${videoId}`);

    try {
      await fs.mkdir(workDir, { recursive: true });

      // Handle video source (URL or Buffer)
      const videoPath = await this.prepareVideoSource(videoSource, workDir);

      // Get video metadata
      const metadata = await this.getVideoMetadata(videoPath);

      // Extract keyframes at strategic positions
      const keyframes = await this.extractKeyframes(videoPath, metadata, workDir);

      // Create composite grid image
      const compositeImage = await this.createCompositeGrid(keyframes, workDir);

      // Upload to Azure Blob Storage if configured
      let blobResult: BlobUploadResult | undefined;
      if (this.config.azureBlobConfig) {
        blobResult = await this.uploadToBlob(compositeImage, videoId);
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        videoId,
        metadata,
        keyframes,
        compositeImage,
        blobResult,
        processingTimeMs,
      };
    } finally {
      // Cleanup temp directory
      await this.cleanup(workDir);
    }
  }

  /**
   * Prepare video source - download if URL, save if Buffer
   */
  private async prepareVideoSource(source: string | Buffer, workDir: string): Promise<string> {
    const videoPath = path.join(workDir, 'input.mp4');

    if (Buffer.isBuffer(source)) {
      await fs.writeFile(videoPath, source);
      return videoPath;
    }

    // If it's a URL, download it
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await fetch(source);
      if (!response.ok) {
        throw new VideoProcessingError(`Failed to download video: ${response.statusText}`, 'DOWNLOAD_FAILED');
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(videoPath, buffer);
      return videoPath;
    }

    // Assume it's a local file path
    return source;
  }

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath,
      ];

      const ffprobe = spawn('ffprobe', args);
      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new VideoProcessingError(`FFprobe failed: ${stderr}`, 'FFPROBE_FAILED'));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const videoStream = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
          const format = data.format;

          if (!videoStream) {
            reject(new VideoProcessingError('No video stream found', 'NO_VIDEO_STREAM'));
            return;
          }

          // Parse frame rate (can be "30/1" or "29.97")
          let fps = 30;
          if (videoStream.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
            fps = den ? num / den : num;
          }

          resolve({
            duration: parseFloat(format?.duration || videoStream.duration || '0'),
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            fps,
            codec: videoStream.codec_name || 'unknown',
            bitrate: parseInt(format?.bit_rate || '0', 10),
            format: format?.format_name || 'unknown',
          });
        } catch (error) {
          reject(new VideoProcessingError(`Failed to parse metadata: ${error}`, 'METADATA_PARSE_FAILED'));
        }
      });

      ffprobe.on('error', (error) => {
        reject(new VideoProcessingError(`FFprobe spawn error: ${error.message}`, 'FFPROBE_SPAWN_FAILED'));
      });
    });
  }

  /**
   * Extract keyframes at strategic positions (beginning, 25%, 50%, 75%, end)
   */
  async extractKeyframes(
    videoPath: string,
    metadata: VideoMetadata,
    workDir: string
  ): Promise<Keyframe[]> {
    const positions: { position: KeyframePosition; percentage: number }[] = [
      { position: 'beginning', percentage: 0.02 }, // 2% to avoid black frames
      { position: 'quarter', percentage: 0.25 },
      { position: 'half', percentage: 0.50 },
      { position: 'three_quarter', percentage: 0.75 },
      { position: 'end', percentage: 0.98 }, // 98% to avoid end credits
    ];

    // For 2x2 grid, use 4 keyframes; for 3x3, use all 5 (center will be larger)
    const positionsToUse = this.config.gridLayout === '2x2' 
      ? positions.filter(p => p.position !== 'half')
      : positions;

    const keyframes: Keyframe[] = [];

    for (const { position, percentage } of positionsToUse) {
      const timestamp = metadata.duration * percentage;
      const outputPath = path.join(workDir, `keyframe_${position}.jpg`);

      await this.extractFrame(videoPath, timestamp, outputPath);

      const imageData = await fs.readFile(outputPath);
      const sceneChangeScore = await this.calculateSceneChangeScore(videoPath, timestamp);

      keyframes.push({
        timestamp,
        imageData,
        sceneChangeScore,
        position,
      });
    }

    return keyframes;
  }

  /**
   * Extract a single frame at a specific timestamp
   */
  private async extractFrame(videoPath: string, timestamp: number, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-ss', timestamp.toFixed(3),
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new VideoProcessingError(`Frame extraction failed: ${stderr}`, 'FRAME_EXTRACTION_FAILED'));
          return;
        }
        resolve();
      });

      ffmpeg.on('error', (error) => {
        reject(new VideoProcessingError(`FFmpeg spawn error: ${error.message}`, 'FFMPEG_SPAWN_FAILED'));
      });
    });
  }

  /**
   * Calculate scene change score at a timestamp
   */
  private async calculateSceneChangeScore(videoPath: string, timestamp: number): Promise<number> {
    return new Promise((resolve) => {
      // Use FFmpeg's scene detection filter
      const startTime = Math.max(0, timestamp - 0.5);
      const args = [
        '-ss', startTime.toFixed(3),
        '-i', videoPath,
        '-t', '1',
        '-vf', 'select=\'gt(scene,0.1)\',showinfo',
        '-f', 'null',
        '-',
      ];

      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', () => {
        // Parse scene change scores from FFmpeg output
        const sceneMatches = stderr.match(/scene:(\d+\.\d+)/g);
        if (sceneMatches && sceneMatches.length > 0) {
          const scores = sceneMatches.map(m => parseFloat(m.split(':')[1]));
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          resolve(avgScore);
        } else {
          resolve(0.5); // Default score if no scene changes detected
        }
      });

      ffmpeg.on('error', () => {
        resolve(0.5); // Default score on error
      });
    });
  }

  /**
   * Create composite grid image from keyframes
   */
  async createCompositeGrid(keyframes: Keyframe[], workDir: string): Promise<CompositeImage> {
    const gridSize = this.config.gridLayout === '2x2' ? 2 : 3;
    const cellSize = Math.floor(this.config.maxImageDimension / gridSize);
    const totalSize = cellSize * gridSize;

    const outputPath = path.join(workDir, `composite.${this.config.imageFormat}`);
    const gridPositions: GridPosition[] = [];

    // Build FFmpeg filter complex for grid composition
    const inputs: string[] = [];
    const filterParts: string[] = [];

    // Prepare input files
    for (let i = 0; i < keyframes.length; i++) {
      const keyframePath = path.join(workDir, `keyframe_${keyframes[i].position}.jpg`);
      inputs.push('-i', keyframePath);
    }

    // Scale each input to cell size
    for (let i = 0; i < keyframes.length; i++) {
      filterParts.push(`[${i}:v]scale=${cellSize}:${cellSize}:force_original_aspect_ratio=decrease,pad=${cellSize}:${cellSize}:(ow-iw)/2:(oh-ih)/2[s${i}]`);
    }

    // Create grid layout
    if (gridSize === 2) {
      // 2x2 grid
      filterParts.push(`[s0][s1]hstack[top]`);
      filterParts.push(`[s2][s3]hstack[bottom]`);
      filterParts.push(`[top][bottom]vstack[out]`);

      gridPositions.push(
        { keyframePosition: keyframes[0].position, gridX: 0, gridY: 0, width: cellSize, height: cellSize },
        { keyframePosition: keyframes[1].position, gridX: cellSize, gridY: 0, width: cellSize, height: cellSize },
        { keyframePosition: keyframes[2].position, gridX: 0, gridY: cellSize, width: cellSize, height: cellSize },
        { keyframePosition: keyframes[3].position, gridX: cellSize, gridY: cellSize, width: cellSize, height: cellSize }
      );
    } else {
      // 3x3 grid (with center being the middle frame)
      filterParts.push(`[s0][s1][s2]hstack=inputs=3[top]`);
      filterParts.push(`[s3][s4][s3]hstack=inputs=3[middle]`); // Duplicate s3 for symmetry if only 5 frames
      filterParts.push(`[s2][s1][s0]hstack=inputs=3[bottom]`); // Mirror for visual balance
      filterParts.push(`[top][middle][bottom]vstack=inputs=3[out]`);

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const idx = Math.min(row * 3 + col, keyframes.length - 1);
          gridPositions.push({
            keyframePosition: keyframes[idx].position,
            gridX: col * cellSize,
            gridY: row * cellSize,
            width: cellSize,
            height: cellSize,
          });
        }
      }
    }

    const filterComplex = filterParts.join(';');

    await this.runFFmpegComposite(inputs, filterComplex, outputPath);

    const gridData = await fs.readFile(outputPath);

    return {
      gridData,
      dimensions: { width: totalSize, height: totalSize },
      keyframePositions: gridPositions,
      format: this.config.imageFormat,
      quality: this.config.imageQuality,
    };
  }

  /**
   * Run FFmpeg to create composite image
   */
  private async runFFmpegComposite(
    inputs: string[],
    filterComplex: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[out]',
        '-q:v', String(Math.floor((100 - this.config.imageQuality) / 10) + 1),
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new VideoProcessingError(`Grid composition failed: ${stderr}`, 'GRID_COMPOSITION_FAILED'));
          return;
        }
        resolve();
      });

      ffmpeg.on('error', (error) => {
        reject(new VideoProcessingError(`FFmpeg spawn error: ${error.message}`, 'FFMPEG_SPAWN_FAILED'));
      });
    });
  }

  /**
   * Upload composite image to Azure Blob Storage
   * Note: Requires @azure/storage-blob package to be installed
   */
  async uploadToBlob(compositeImage: CompositeImage, videoId: string): Promise<BlobUploadResult> {
    if (!this.config.azureBlobConfig) {
      throw new VideoProcessingError('Azure Blob config not provided', 'BLOB_CONFIG_MISSING');
    }

    const { connectionString, containerName, sasTokenDuration } = this.config.azureBlobConfig;
    const blobName = `video-grids/${videoId}/composite.${compositeImage.format}`;
    const contentType = compositeImage.format === 'jpeg' ? 'image/jpeg' : 'image/png';

    // Check if Azure SDK is available
    const azureBlobModule = await this.loadAzureBlobModule();
    if (!azureBlobModule) {
      throw new VideoProcessingError(
        'Azure Blob Storage SDK not installed. Run: npm install @azure/storage-blob',
        'AZURE_SDK_MISSING'
      );
    }

    const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = azureBlobModule;

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({ access: 'blob' });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the image
    await blockBlobClient.upload(compositeImage.gridData, compositeImage.gridData.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // Generate SAS token
    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + sasTokenDuration);

    // Extract account name and key from connection string for SAS generation
    const accountName = connectionString.match(/AccountName=([^;]+)/)?.[1];
    const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1];

    let sasUrl = blockBlobClient.url;
    if (accountName && accountKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      const sasToken = generateBlobSASQueryParameters({
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn,
      }, sharedKeyCredential).toString();
      sasUrl = `${blockBlobClient.url}?${sasToken}`;
    }

    return {
      url: blockBlobClient.url,
      sasUrl,
      blobName,
      containerName,
      contentType,
      size: compositeImage.gridData.length,
      uploadedAt: new Date(),
    };
  }

  /**
   * Dynamically load Azure Blob Storage module
   */
  private async loadAzureBlobModule(): Promise<typeof import('@azure/storage-blob') | null> {
    try {
      // Use Function constructor to avoid static analysis
      const dynamicImport = new Function('modulePath', 'return import(modulePath)');
      return await dynamicImport('@azure/storage-blob');
    } catch {
      return null;
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(workDir: string): Promise<void> {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Detect scene changes throughout the video
   */
  async detectSceneChanges(videoPath: string, threshold: number = 0.3): Promise<SceneChangeResult[]> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', videoPath,
        '-vf', `select='gt(scene,${threshold})',showinfo`,
        '-f', 'null',
        '-',
      ];

      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0 && code !== 1) {
          reject(new VideoProcessingError(`Scene detection failed`, 'SCENE_DETECTION_FAILED'));
          return;
        }

        const results: SceneChangeResult[] = [];
        const lines = stderr.split('\n');

        for (const line of lines) {
          const ptsMatch = line.match(/pts_time:(\d+\.?\d*)/);
          const sceneMatch = line.match(/scene:(\d+\.?\d*)/);

          if (ptsMatch && sceneMatch) {
            results.push({
              timestamp: parseFloat(ptsMatch[1]),
              score: parseFloat(sceneMatch[1]),
            });
          }
        }

        resolve(results);
      });

      ffmpeg.on('error', (error) => {
        reject(new VideoProcessingError(`FFmpeg spawn error: ${error.message}`, 'FFMPEG_SPAWN_FAILED'));
      });
    });
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class VideoProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VideoProcessingError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createVideoProcessor(config?: Partial<VideoProcessorConfig>): VideoProcessor {
  return new VideoProcessor(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if FFmpeg is available on the system
 */
export async function checkFFmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });

    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Get supported video formats
 */
export function getSupportedVideoFormats(): string[] {
  return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'm4v'];
}

/**
 * Validate video file extension
 */
export function isValidVideoFormat(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return getSupportedVideoFormats().includes(ext);
}
