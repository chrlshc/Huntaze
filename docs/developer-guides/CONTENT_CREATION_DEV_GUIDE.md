# 🔧 Content Creation - Developer Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ContentEditor│  │ MediaPicker  │  │ AIAssistant  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/content │  │ /api/media   │  │ /api/ai      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ mediaUploadService│  │ aiContentService │                │
│  │ imageEditService  │  │ videoEditService │                │
│  │ platformOptimizer │  │ variationService │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Storage & Database                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ AWS S3       │  │ CloudFront   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### content_items

```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  caption TEXT,
  content_type VARCHAR(50) NOT NULL, -- 'text' | 'image' | 'video' | 'carousel'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft' | 'scheduled' | 'published'
  platforms TEXT[], -- ['instagram', 'tiktok', 'twitter']
  hashtags TEXT[],
  mentions TEXT[],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  metadata JSONB, -- Platform-specific data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_items_user_id ON content_items(user_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_scheduled_at ON content_items(scheduled_at);
```

### media_assets

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  content_item_id UUID REFERENCES content_items(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'image' | 'video'
  mime_type VARCHAR(100),
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- For videos, in seconds
  s3_key VARCHAR(500) NOT NULL,
  s3_url TEXT NOT NULL,
  cloudfront_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX idx_media_assets_content_item_id ON media_assets(content_item_id);
```

### templates

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), -- NULL for system templates
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  platform VARCHAR(50),
  template_data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_platform ON templates(platform);
```

### content_variations

```sql
CREATE TABLE content_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_content_id UUID NOT NULL REFERENCES content_items(id),
  variation_name VARCHAR(255),
  caption TEXT,
  media_asset_id UUID REFERENCES media_assets(id),
  hashtags TEXT[],
  performance_score DECIMAL(5,2),
  impressions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_variations_parent ON content_variations(parent_content_id);
```

---

## API Endpoints

### Content Management

#### Create Content
```typescript
POST /api/content
Content-Type: application/json

{
  "title": "Beach Sunset",
  "caption": "Amazing sunset at the beach 🌅",
  "content_type": "image",
  "platforms": ["instagram", "tiktok"],
  "hashtags": ["sunset", "beach", "nature"],
  "status": "draft"
}

Response: 201 Created
{
  "id": "uuid",
  "title": "Beach Sunset",
  "status": "draft",
  "created_at": "2024-11-01T12:00:00Z"
}
```

#### Get Content
```typescript
GET /api/content?status=draft&platform=instagram&limit=20

Response: 200 OK
{
  "items": [...],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

#### Update Content
```typescript
PATCH /api/content/[id]
Content-Type: application/json

{
  "caption": "Updated caption",
  "status": "scheduled",
  "scheduled_at": "2024-11-02T10:00:00Z"
}

Response: 200 OK
```

### Media Upload

#### Upload Media
```typescript
POST /api/content/media/upload
Content-Type: multipart/form-data

FormData:
- file: File
- content_item_id: UUID (optional)

Response: 201 Created
{
  "id": "uuid",
  "file_name": "beach.jpg",
  "s3_url": "https://s3.amazonaws.com/...",
  "cloudfront_url": "https://d123.cloudfront.net/...",
  "thumbnail_url": "https://...",
  "width": 1080,
  "height": 1080,
  "file_size": 2048576
}
```

#### Edit Image
```typescript
POST /api/content/media/[id]/edit
Content-Type: application/json

{
  "operations": [
    {
      "type": "crop",
      "params": { "x": 0, "y": 0, "width": 1080, "height": 1080 }
    },
    {
      "type": "filter",
      "params": { "name": "vintage" }
    },
    {
      "type": "adjust",
      "params": { "brightness": 10, "contrast": 5 }
    }
  ]
}

Response: 200 OK
{
  "edited_url": "https://...",
  "thumbnail_url": "https://..."
}
```

### AI Assistant

#### Get AI Suggestions
```typescript
POST /api/content/ai/suggestions
Content-Type: application/json

{
  "prompt": "Write a caption for a beach sunset photo",
  "context": {
    "platform": "instagram",
    "tone": "casual",
    "include_hashtags": true
  }
}

Response: 200 OK
{
  "suggestions": [
    {
      "caption": "Chasing sunsets and good vibes 🌅✨",
      "hashtags": ["sunset", "beachlife", "goldenhour"],
      "confidence": 0.95
    }
  ]
}
```

### Platform Optimization

#### Optimize Content
```typescript
POST /api/content/optimize
Content-Type: application/json

{
  "content_id": "uuid",
  "platform": "instagram",
  "post_type": "feed" // or 'story', 'reel'
}

Response: 200 OK
{
  "optimized": {
    "image_url": "https://...",
    "dimensions": { "width": 1080, "height": 1080 },
    "caption": "Truncated to 2200 chars...",
    "hashtags": ["first30hashtags"],
    "recommendations": [
      "Image aspect ratio optimized for Instagram feed",
      "Caption length within limits"
    ]
  }
}
```

---

## Services

### MediaUploadService

```typescript
// lib/services/mediaUploadService.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

export class MediaUploadService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
    this.bucket = process.env.AWS_S3_BUCKET!;
  }

  async uploadImage(file: File, userId: string): Promise<UploadResult> {
    // Generate unique key
    const key = `users/${userId}/images/${Date.now()}-${file.name}`;

    // Process image with sharp
    const buffer = await file.arrayBuffer();
    const processed = await sharp(Buffer.from(buffer))
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload to S3
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: processed,
      ContentType: 'image/jpeg',
    }));

    // Generate thumbnail
    const thumbnail = await this.generateThumbnail(processed);
    const thumbnailKey = `${key}-thumb.jpg`;
    await this.uploadThumbnail(thumbnailKey, thumbnail);

    return {
      s3_key: key,
      s3_url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
      cloudfront_url: `${process.env.CLOUDFRONT_DOMAIN}/${key}`,
      thumbnail_url: `${process.env.CLOUDFRONT_DOMAIN}/${thumbnailKey}`,
    };
  }

  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}
```

### AIContentService

```typescript
// lib/services/aiContentService.ts
import OpenAI from 'openai';

export class AIContentService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateCaption(params: CaptionParams): Promise<string[]> {
    const { prompt, platform, tone, includeHashtags } = params;

    const systemPrompt = `You are a social media content expert. 
Generate engaging captions for ${platform}.
Tone: ${tone}.
${includeHashtags ? 'Include relevant hashtags.' : 'No hashtags.'}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      n: 3, // Generate 3 variations
      temperature: 0.8,
    });

    return response.choices.map(choice => choice.message.content || '');
  }

  async suggestHashtags(caption: string, platform: string): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Suggest relevant hashtags for ${platform}. Return only hashtags, comma-separated.`,
        },
        { role: 'user', content: caption },
      ],
      temperature: 0.7,
    });

    const hashtags = response.choices[0].message.content || '';
    return hashtags.split(',').map(tag => tag.trim().replace('#', ''));
  }
}
```

### PlatformOptimizerService

```typescript
// lib/services/platformOptimizerService.ts
import { platformRequirements } from '@/lib/config/platformRequirements';

export class PlatformOptimizerService {
  async optimizeForPlatform(
    content: ContentItem,
    platform: Platform,
    postType: PostType
  ): Promise<OptimizedContent> {
    const requirements = platformRequirements[platform][postType];

    // Optimize image dimensions
    const optimizedImage = await this.optimizeImage(
      content.media_url,
      requirements.dimensions
    );

    // Truncate caption if needed
    const optimizedCaption = this.truncateCaption(
      content.caption,
      requirements.captionLimit
    );

    // Limit hashtags
    const optimizedHashtags = content.hashtags.slice(
      0,
      requirements.maxHashtags
    );

    return {
      image_url: optimizedImage,
      caption: optimizedCaption,
      hashtags: optimizedHashtags,
      recommendations: this.generateRecommendations(content, requirements),
    };
  }

  private truncateCaption(caption: string, limit: number): string {
    if (caption.length <= limit) return caption;
    return caption.substring(0, limit - 3) + '...';
  }
}
```

---

## Workers

### Content Scheduling Worker

```typescript
// lib/workers/contentSchedulingWorker.ts
export class ContentSchedulingWorker {
  async processScheduledContent() {
    const now = new Date();
    
    // Find content scheduled for now
    const scheduledContent = await db.content_items.findMany({
      where: {
        status: 'scheduled',
        scheduled_at: {
          lte: now,
        },
      },
    });

    for (const content of scheduledContent) {
      try {
        // Publish to each platform
        for (const platform of content.platforms) {
          await this.publishToPlatform(content, platform);
        }

        // Update status
        await db.content_items.update({
          where: { id: content.id },
          data: {
            status: 'published',
            published_at: now,
          },
        });

        // Send notification
        await this.notifyUser(content.user_id, content.id);
      } catch (error) {
        console.error(`Failed to publish content ${content.id}:`, error);
        // Log error and continue
      }
    }
  }

  private async publishToPlatform(content: ContentItem, platform: string) {
    switch (platform) {
      case 'instagram':
        return await instagramPublish.publish(content);
      case 'tiktok':
        return await tiktokUpload.upload(content);
      case 'twitter':
        return await twitterPublish.tweet(content);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}
```

---

## Testing

### Unit Tests

```typescript
// tests/unit/services/mediaUploadService.test.ts
import { MediaUploadService } from '@/lib/services/mediaUploadService';

describe('MediaUploadService', () => {
  let service: MediaUploadService;

  beforeEach(() => {
    service = new MediaUploadService();
  });

  it('should upload image to S3', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = await service.uploadImage(file, 'user-123');

    expect(result.s3_key).toContain('users/user-123/images/');
    expect(result.s3_url).toContain('s3.amazonaws.com');
    expect(result.thumbnail_url).toBeDefined();
  });

  it('should generate thumbnail', async () => {
    const buffer = Buffer.from('test image data');
    const thumbnail = await service['generateThumbnail'](buffer);

    expect(thumbnail).toBeInstanceOf(Buffer);
    expect(thumbnail.length).toBeLessThan(buffer.length);
  });
});
```

### Integration Tests

```typescript
// tests/integration/api/content-media-endpoints.test.ts
describe('Content Media API', () => {
  it('should upload and retrieve media', async () => {
    // Upload
    const formData = new FormData();
    formData.append('file', testImage);

    const uploadRes = await fetch('/api/content/media/upload', {
      method: 'POST',
      body: formData,
    });

    expect(uploadRes.status).toBe(201);
    const { id, s3_url } = await uploadRes.json();

    // Retrieve
    const getRes = await fetch(`/api/content/media/${id}`);
    expect(getRes.status).toBe(200);
    const media = await getRes.json();
    expect(media.s3_url).toBe(s3_url);
  });
});
```

---

## Performance Optimization

### Image Optimization

- Use Sharp for server-side processing
- Generate multiple sizes (thumbnail, medium, full)
- Serve via CloudFront CDN
- Lazy load images in UI
- Use WebP format when supported

### Caching Strategy

```typescript
// Cache AI suggestions
const cacheKey = `ai:caption:${hash(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await aiService.generateCaption(prompt);
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

### Database Optimization

- Index frequently queried fields
- Use pagination for large result sets
- Implement connection pooling
- Cache frequently accessed data

---

## Security

### File Upload Security

```typescript
// Validate file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Validate file size
const maxSize = 500 * 1024 * 1024; // 500MB
if (file.size > maxSize) {
  throw new Error('File too large');
}

// Scan for malware (optional)
await virusScan(file);
```

### API Rate Limiting

```typescript
// Rate limit AI requests
const limit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: 'Too many AI requests',
});

app.use('/api/content/ai', limit);
```

---

## Monitoring

### Key Metrics

- Media upload success rate
- AI API response time
- Content publishing success rate
- Storage usage (S3)
- CDN bandwidth
- AI API costs

### Logging

```typescript
import { logger } from '@/lib/utils/logger';

logger.info('Media uploaded', {
  userId,
  mediaId,
  fileSize,
  duration: Date.now() - startTime,
});

logger.error('AI request failed', {
  error: error.message,
  prompt,
  userId,
});
```

---

## Deployment

See [CONTENT_CREATION_DEPLOYMENT.md](../deployment/CONTENT_CREATION_DEPLOYMENT.md) for full deployment guide.

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Maintainer**: Huntaze Dev Team
