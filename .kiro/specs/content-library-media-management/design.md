# Design Document - Content Library & Media Management

## Overview

Ce système fournit une bibliothèque complète de gestion de contenu avec stockage S3, CDN CloudFront, processing Lambda automatique, et interface frontend moderne. Les services de génération de contenu existent déjà, ce design se concentre sur le stockage, l'organisation, et le processing des médias.

### Objectifs

1. **Stockage scalable** avec S3 et lifecycle policies
2. **Distribution rapide** via CloudFront CDN
3. **Processing automatique** avec Lambda (resize, compression, watermark)
4. **Organisation intuitive** avec collections et tags
5. **Recherche puissante** avec filtres et métadonnées

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application                          │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  Frontend        │────────▶│  ContentLibraryService       │  │
│  │  /app/content/   │         │  - Asset management          │  │
│  │                  │         │  - Collection management     │  │
│  └──────────────────┘         │  - Search & filters          │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  StorageService              │  │
│  │  /api/content/   │         │  - S3 upload/download        │  │
│  │  upload          │         │  - Signed URLs               │  │
│  └──────────────────┘         │  - Lifecycle management      │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  CDNService                  │  │
│  │  /api/content/   │         │  - CloudFront distribution   │  │
│  │  cdn             │         │  - Cache invalidation        │  │
│  └──────────────────┘         │  - Signed URLs               │  │
│                                └──────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                            │
                                            │ AWS Services
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Infrastructure                        │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │  S3 Bucket       │  │  CloudFront      │  │  Lambda        ││
│  │  - Raw storage   │  │  - CDN           │  │  - Processing  ││
│  │  - Versioning    │  │  - Caching       │  │  - Resize      ││
│  │  - Lifecycle     │  │  - Signed URLs   │  │  - Compress    ││
│  └────────┬─────────┘  └──────────────────┘  └────────┬───────┘│
│           │                                             │        │
│           │ S3 Event                                    │        │
│           └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### 1. ContentLibraryService

Service principal pour la gestion de la bibliothèque de contenu.

```typescript
export class ContentLibraryService {
  constructor(
    private prisma: PrismaClient,
    private storageService: StorageService,
    private cdnService: CDNService,
    private metrics: CloudWatchMetricsService
  ) {}

  // Asset management
  async createAsset(params: CreateAssetParams): Promise<Asset>;
  async getAsset(id: string): Promise<Asset | null>;
  async updateAsset(id: string, data: UpdateAssetParams): Promise<Asset>;
  async deleteAsset(id: string): Promise<void>;
  async listAssets(filters: AssetFilters): Promise<PaginatedAssets>;
  
  // Upload
  async getUploadUrl(filename: string, contentType: string): Promise<UploadUrl>;
  async completeUpload(assetId: string, s3Key: string): Promise<Asset>;
  
  // Collections
  async createCollection(params: CreateCollectionParams): Promise<Collection>;
  async addToCollection(assetId: string, collectionId: string): Promise<void>;
  async removeFromCollection(assetId: string, collectionId: string): Promise<void>;
  async listCollections(userId: string): Promise<Collection[]>;
  
  // Tags
  async addTags(assetId: string, tags: string[]): Promise<void>;
  async removeTags(assetId: string, tags: string[]): Promise<void>;
  async suggestTags(assetId: string): Promise<string[]>;
  async getTagCloud(userId: string): Promise<TagCloud>;
  
  // Search
  async searchAssets(query: SearchQuery): Promise<SearchResults>;
  async filterAssets(filters: AssetFilters): Promise<Asset[]>;
  
  // Metadata
  async extractMetadata(assetId: string): Promise<Metadata>;
  async updateMetadata(assetId: string, metadata: Metadata): Promise<Asset>;
  
  // Versioning
  async getVersionHistory(assetId: string): Promise<AssetVersion[]>;
  async restoreVersion(assetId: string, versionId: string): Promise<Asset>;
  
  // Sharing
  async createShareLink(assetId: string, options: ShareOptions): Promise<ShareLink>;
  async revokeShareLink(linkId: string): Promise<void>;
  async trackAccess(linkId: string, userId?: string): Promise<void>;
}
```

### 2. StorageService

Service pour la gestion du stockage S3.

```typescript
export class StorageService {
  constructor(
    private s3Client: S3Client,
    private config: StorageConfig
  ) {}

  // Upload
  async getPresignedUploadUrl(key: string, contentType: string): Promise<string>;
  async uploadFile(file: Buffer, key: string, metadata: Record<string, string>): Promise<string>;
  async uploadMultipart(file: Buffer, key: string): Promise<string>;
  
  // Download
  async getPresignedDownloadUrl(key: string, expiresIn: number): Promise<string>;
  async downloadFile(key: string): Promise<Buffer>;
  async streamFile(key: string): Promise<ReadableStream>;
  
  // Management
  async copyFile(sourceKey: string, destKey: string): Promise<void>;
  async moveFile(sourceKey: string, destKey: string): Promise<void>;
  async deleteFile(key: string): Promise<void>;
  async listFiles(prefix: string): Promise<S3Object[]>;
  
  // Metadata
  async getFileMetadata(key: string): Promise<S3Metadata>;
  async updateFileMetadata(key: string, metadata: Record<string, string>): Promise<void>;
  
  // Versioning
  async enableVersioning(bucket: string): Promise<void>;
  async listVersions(key: string): Promise<S3Version[]>;
  async restoreVersion(key: string, versionId: string): Promise<void>;
  
  // Lifecycle
  async setLifecyclePolicy(bucket: string, policy: LifecyclePolicy): Promise<void>;
  async transitionToIntelligentTiering(key: string): Promise<void>;
}
```

### 3. CDNService

Service pour la gestion du CDN CloudFront.

```typescript
export class CDNService {
  constructor(
    private cloudFrontClient: CloudFrontClient,
    private config: CDNConfig
  ) {}

  // Distribution
  async getDistributionUrl(key: string): Promise<string>;
  async getSignedUrl(key: string, expiresIn: number): Promise<string>;
  async getSignedCookies(keyPattern: string, expiresIn: number): Promise<SignedCookies>;
  
  // Cache
  async invalidateCache(paths: string[]): Promise<string>; // Returns invalidation ID
  async getInvalidationStatus(invalidationId: string): Promise<InvalidationStatus>;
  async setCachePolicy(distributionId: string, policy: CachePolicy): Promise<void>;
  
  // Configuration
  async createDistribution(config: DistributionConfig): Promise<Distribution>;
  async updateDistribution(distributionId: string, config: DistributionConfig): Promise<Distribution>;
  async deleteDistribution(distributionId: string): Promise<void>;
}
```

### 4. MediaProcessingService

Service pour le processing des médias via Lambda.

```typescript
export class MediaProcessingService {
  constructor(
    private lambdaClient: LambdaClient,
    private storageService: StorageService
  ) {}

  // Image processing
  async resizeImage(s3Key: string, sizes: ImageSize[]): Promise<ProcessedImage[]>;
  async compressImage(s3Key: string, quality: number): Promise<string>;
  async convertToWebP(s3Key: string): Promise<string>;
  async generateThumbnail(s3Key: string, size: number): Promise<string>;
  async addWatermark(s3Key: string, watermark: WatermarkConfig): Promise<string>;
  
  // Video processing
  async transcodeVideo(s3Key: string, resolutions: VideoResolution[]): Promise<ProcessedVideo[]>;
  async generateVideoThumbnails(s3Key: string, timestamps: number[]): Promise<string[]>;
  async extractVideoMetadata(s3Key: string): Promise<VideoMetadata>;
  async compressVideo(s3Key: string, bitrate: number): Promise<string>;
  async generateHLS(s3Key: string): Promise<HLSManifest>;
  
  // Audio processing
  async transcodeAudio(s3Key: string, format: AudioFormat): Promise<string>;
  async generateWaveform(s3Key: string): Promise<string>;
  async extractAudioMetadata(s3Key: string): Promise<AudioMetadata>;
  
  // Batch processing
  async processBatch(jobs: ProcessingJob[]): Promise<ProcessingResult[]>;
  async getProcessingStatus(jobId: string): Promise<ProcessingStatus>;
}
```

## Data Models

### Prisma Schema Extensions

```prisma
// Asset
model Asset {
  id              String   @id @default(cuid())
  userId          String
  
  // File info
  filename        String
  originalName    String
  s3Key           String   @unique
  s3Bucket        String
  cdnUrl          String
  
  // Type and format
  type            String   // image, video, audio, document
  mimeType        String
  format          String   // jpg, png, mp4, etc.
  
  // Size and dimensions
  size            BigInt   // bytes
  width           Int?
  height          Int?
  duration        Int?     // seconds for video/audio
  
  // Metadata
  metadata        Json     // EXIF, codec, bitrate, etc.
  tags            String[]
  description     String?
  
  // Processing
  processed       Boolean  @default(false)
  processingStatus String? // pending, processing, completed, failed
  variants        Json?    // { thumbnail: url, small: url, medium: url, large: url }
  
  // Versioning
  version         Int      @default(1)
  previousVersionId String?
  
  // Status
  status          String   @default("active") // active, archived, deleted
  deletedAt       DateTime?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  collections     AssetCollection[]
  versions        AssetVersion[]
  shares          ShareLink[]
  
  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@index([tags])
  @@map("assets")
}

// Collection
model Collection {
  id              String   @id @default(cuid())
  userId          String
  name            String
  description     String?
  parentId        String?  // For nested collections
  
  // Display
  thumbnailUrl    String?
  color           String?
  icon            String?
  
  // Stats
  assetCount      Int      @default(0)
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  parent          Collection? @relation("CollectionHierarchy", fields: [parentId], references: [id])
  children        Collection[] @relation("CollectionHierarchy")
  assets          AssetCollection[]
  
  @@index([userId])
  @@index([parentId])
  @@map("collections")
}

// Asset-Collection junction
model AssetCollection {
  id              String   @id @default(cuid())
  assetId         String
  collectionId    String
  order           Int      @default(0)
  
  addedAt         DateTime @default(now())
  
  asset           Asset    @relation(fields: [assetId], references: [id])
  collection      Collection @relation(fields: [collectionId], references: [id])
  
  @@unique([assetId, collectionId])
  @@index([assetId])
  @@index([collectionId])
  @@map("asset_collections")
}

// Asset Version
model AssetVersion {
  id              String   @id @default(cuid())
  assetId         String
  version         Int
  
  // File info
  s3Key           String
  s3VersionId     String?
  size            BigInt
  
  // Metadata
  metadata        Json
  changes         String?  // Description of changes
  
  // Timestamps
  createdAt       DateTime @default(now())
  createdBy       String
  
  asset           Asset    @relation(fields: [assetId], references: [id])
  
  @@unique([assetId, version])
  @@index([assetId])
  @@map("asset_versions")
}

// Share Link
model ShareLink {
  id              String   @id @default(cuid())
  assetId         String
  userId          String
  
  // Link config
  token           String   @unique
  password        String?
  expiresAt       DateTime?
  maxAccess       Int?
  accessCount     Int      @default(0)
  
  // Permissions
  canView         Boolean  @default(true)
  canDownload     Boolean  @default(false)
  canEdit         Boolean  @default(false)
  
  // Status
  active          Boolean  @default(true)
  revokedAt       DateTime?
  
  // Timestamps
  createdAt       DateTime @default(now())
  lastAccessedAt  DateTime?
  
  asset           Asset    @relation(fields: [assetId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  accesses        ShareAccess[]
  
  @@index([assetId])
  @@index([userId])
  @@index([token])
  @@map("share_links")
}

// Share Access Log
model ShareAccess {
  id              String   @id @default(cuid())
  shareLinkId     String
  
  // Access info
  ipAddress       String?
  userAgent       String?
  userId          String?
  
  // Action
  action          String   // view, download
  
  // Timestamp
  accessedAt      DateTime @default(now())
  
  shareLink       ShareLink @relation(fields: [shareLinkId], references: [id])
  
  @@index([shareLinkId])
  @@index([accessedAt])
  @@map("share_accesses")
}

// Processing Job
model ProcessingJob {
  id              String   @id @default(cuid())
  assetId         String
  userId          String
  
  // Job config
  type            String   // resize, compress, transcode, watermark
  config          Json
  
  // Status
  status          String   // pending, processing, completed, failed
  progress        Int      @default(0)
  error           String?
  
  // Results
  outputKeys      String[] // S3 keys of processed files
  
  // Timestamps
  createdAt       DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  
  @@index([assetId])
  @@index([userId])
  @@index([status])
  @@map("processing_jobs")
}
```

## AWS Infrastructure

### S3 Bucket Configuration

```typescript
const S3_CONFIG = {
  bucket: 'huntaze-content-library',
  region: 'us-east-1',
  
  // Folder structure
  structure: {
    raw: 'raw/{userId}/{YYYY}/{MM}/{DD}/{filename}',
    processed: 'processed/{userId}/{assetId}/{variant}/{filename}',
    thumbnails: 'thumbnails/{userId}/{assetId}/{filename}',
  },
  
  // Storage classes
  storageClass: {
    recent: 'STANDARD',           // < 30 days
    frequent: 'INTELLIGENT_TIERING', // 30-90 days
    archive: 'GLACIER',           // > 90 days
  },
  
  // Lifecycle policies
  lifecycle: [
    {
      id: 'TransitionToIntelligentTiering',
      status: 'Enabled',
      transitions: [
        { days: 30, storageClass: 'INTELLIGENT_TIERING' }
      ]
    },
    {
      id: 'DeleteOldVersions',
      status: 'Enabled',
      noncurrentVersionExpiration: { days: 90 }
    },
    {
      id: 'CleanupIncompleteUploads',
      status: 'Enabled',
      abortIncompleteMultipartUpload: { daysAfterInitiation: 7 }
    }
  ],
  
  // Versioning
  versioning: {
    status: 'Enabled',
    mfaDelete: 'Disabled'
  },
  
  // CORS
  cors: [
    {
      allowedOrigins: ['https://huntaze.com'],
      allowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
      allowedHeaders: ['*'],
      maxAgeSeconds: 3000
    }
  ]
};
```

### CloudFront Distribution

```typescript
const CLOUDFRONT_CONFIG = {
  distributionId: 'E1234567890ABC',
  domainName: 'cdn.huntaze.com',
  
  // Origins
  origins: [
    {
      id: 's3-content-library',
      domainName: 'huntaze-content-library.s3.amazonaws.com',
      s3OriginConfig: {
        originAccessIdentity: 'origin-access-identity/cloudfront/ABCDEFG1234567'
      }
    }
  ],
  
  // Cache behaviors
  cacheBehaviors: [
    {
      pathPattern: '/images/*',
      targetOriginId: 's3-content-library',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      defaultTTL: 604800, // 7 days
      maxTTL: 2592000,    // 30 days
      minTTL: 0
    },
    {
      pathPattern: '/videos/*',
      targetOriginId: 's3-content-library',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: false,
      defaultTTL: 2592000, // 30 days
      maxTTL: 31536000,    // 1 year
      minTTL: 0
    }
  ],
  
  // Signed URLs
  trustedSigners: {
    enabled: true,
    quantity: 1,
    items: ['self']
  },
  
  // Geo restriction
  geoRestriction: {
    restrictionType: 'none'
  }
};
```

### Lambda Functions

#### Image Processing Lambda

```typescript
// lambda/image-processor/index.ts
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export const handler = async (event: S3Event) => {
  const s3 = new S3Client({ region: 'us-east-1' });
  
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    // Download original
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const { Body } = await s3.send(getCommand);
    const buffer = await streamToBuffer(Body);
    
    // Generate variants
    const variants = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 400, height: 400 },
      { name: 'medium', width: 800, height: 800 },
      { name: 'large', width: 1600, height: 1600 }
    ];
    
    for (const variant of variants) {
      const processed = await sharp(buffer)
        .resize(variant.width, variant.height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      
      const variantKey = key.replace('/raw/', `/processed/${variant.name}/`);
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: variantKey,
        Body: processed,
        ContentType: 'image/webp'
      });
      
      await s3.send(putCommand);
    }
  }
};
```

#### Video Processing Lambda

```typescript
// lambda/video-processor/index.ts
import ffmpeg from 'fluent-ffmpeg';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export const handler = async (event: S3Event) => {
  const s3 = new S3Client({ region: 'us-east-1' });
  
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    // Download original
    const inputPath = `/tmp/input-${Date.now()}.mp4`;
    await downloadFromS3(s3, bucket, key, inputPath);
    
    // Generate resolutions
    const resolutions = [
      { name: '360p', width: 640, height: 360, bitrate: '800k' },
      { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
      { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
    ];
    
    for (const res of resolutions) {
      const outputPath = `/tmp/output-${res.name}-${Date.now()}.mp4`;
      
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .size(`${res.width}x${res.height}`)
          .videoBitrate(res.bitrate)
          .audioCodec('aac')
          .videoCodec('libx264')
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath);
      });
      
      const variantKey = key.replace('/raw/', `/processed/${res.name}/`);
      await uploadToS3(s3, bucket, variantKey, outputPath);
    }
    
    // Generate thumbnails
    const thumbnailPath = `/tmp/thumbnail-${Date.now()}.jpg`;
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['10%', '50%', '90%'],
          filename: 'thumbnail-%i.jpg',
          folder: '/tmp'
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }
};
```

## Frontend Components

### Content Library Page

```typescript
// app/content/page.tsx
'use client';

import { useState } from 'react';
import { Upload, Grid, List, Search, Filter } from 'lucide-react';

export default function ContentLibraryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [assets, setAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Content Library</h1>
          <div className="flex gap-3">
            <button className="btn-secondary">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="btn-primary">
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>
      </header>
      
      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => setView('grid')} className={view === 'grid' ? 'active' : ''}>
            <Grid className="w-5 h-5" />
          </button>
          <button onClick={() => setView('list')} className={view === 'list' ? 'active' : ''}>
            <List className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <input
            type="search"
            placeholder="Search assets..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        
        <div className="text-sm text-gray-600">
          {selectedAssets.length > 0 && `${selectedAssets.length} selected`}
        </div>
      </div>
      
      {/* Content */}
      <main className="p-6">
        {view === 'grid' ? <GridView assets={assets} /> : <ListView assets={assets} />}
      </main>
    </div>
  );
}
```

## Error Handling

### Upload Errors
- File too large → Show size limit
- Invalid file type → Show supported formats
- Upload failed → Retry with exponential backoff
- Processing failed → Show error and allow re-processing

### Storage Errors
- S3 unavailable → Queue for retry
- Quota exceeded → Alert user
- Permission denied → Check IAM roles

## Testing Strategy

### Unit Tests
- ContentLibraryService CRUD operations
- StorageService S3 operations
- CDNService CloudFront operations
- MediaProcessingService processing logic

### Integration Tests
- Upload flow (presigned URL → S3 → Lambda → CDN)
- Processing pipeline (S3 event → Lambda → variants)
- Search and filters
- Sharing and permissions

### E2E Tests
- Complete upload and processing flow
- Collection management
- Search and retrieval
- Version history

## Monitoring

### CloudWatch Metrics
- `AssetsUploaded` (Count)
- `ProcessingJobs` (Count)
- `ProcessingDuration` (Milliseconds)
- `StorageUsed` (Bytes)
- `CDNRequests` (Count)
- `CDNCacheHitRate` (Percentage)

### CloudWatch Alarms
- High processing failure rate (>5%)
- Storage quota warning (>80%)
- CDN error rate (>1%)
- Lambda timeout (>10/hour)

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-29  
**Status:** Ready for Tasks
