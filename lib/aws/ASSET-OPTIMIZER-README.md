# Asset Optimizer - Image Optimization with S3 and CloudFront

## Overview

The Asset Optimizer provides a complete solution for image optimization, multi-format generation, and CDN delivery using AWS S3 and CloudFront.

## Features

✅ **Multi-Format Generation**
- AVIF (best compression, modern browsers)
- WebP (good compression, wide support)
- JPEG (universal fallback)

✅ **Multiple Size Variants**
- Thumbnail (150x150)
- Medium (800x800)
- Large (1920x1920)
- Original (unchanged)

✅ **CloudFront CDN Integration**
- Automatic CDN URL generation
- Cache invalidation support
- 1-year cache duration

✅ **Lazy Loading**
- Intersection Observer API
- Configurable viewport margin
- Skeleton loading states

✅ **Smart Format Selection**
- Automatic fallback chain
- Browser capability detection
- Optimal format delivery

## Configuration

### Environment Variables

```bash
# Required
AWS_REGION=us-east-1
AWS_S3_ASSETS_BUCKET=your-bucket-name

# Optional (for CloudFront)
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
```

### AWS Setup

1. **Create S3 Bucket**
```bash
aws s3 mb s3://your-assets-bucket
```

2. **Configure Bucket Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-assets-bucket/*"
    }
  ]
}
```

3. **Create CloudFront Distribution** (Optional)
- Origin: Your S3 bucket
- Cache Policy: CachingOptimized
- Origin Access: Public
- Viewer Protocol: Redirect HTTP to HTTPS

## Usage

### Server-Side (API Route)

```typescript
import { getAssetOptimizer } from '@/lib/aws/asset-optimizer';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Convert to buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Get optimizer
  const optimizer = getAssetOptimizer();
  
  // Optimize image
  const optimized = await optimizer.optimizeImage({
    buffer,
    filename: file.name,
    contentType: file.type,
  });
  
  // Upload to S3
  const assetMetadata = await optimizer.uploadOptimizedImage(
    optimized,
    `uploads/${Date.now()}`
  );
  
  return Response.json({ assetMetadata });
}
```

### Client-Side (React Hook)

```typescript
import { useAssetOptimizer } from '@/hooks/useAssetOptimizer';

function ImageUploader() {
  const { uploadImage, isUploading, progress, error } = useAssetOptimizer();
  
  const handleUpload = async (file: File) => {
    const result = await uploadImage(file);
    
    if (result.success) {
      console.log('Uploaded:', result.assetMetadata);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {isUploading && <p>Uploading: {progress?.percentage}%</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Display Optimized Images

```typescript
import OptimizedImage from '@/components/OptimizedImage';

function Gallery({ assetMetadata }) {
  return (
    <OptimizedImage
      src={assetMetadata.cdnUrl}
      alt="Optimized image"
      formats={assetMetadata.formats}
      sizes={assetMetadata.sizes}
      preferredFormat="avif"
      preferredSize="medium"
      enableLazyLoading={true}
      aspectRatio={16/9}
    />
  );
}
```

## API Reference

### AssetOptimizer

#### `optimizeImage(input: ImageInput): Promise<OptimizedImage>`

Optimizes an image by generating multiple formats and sizes.

**Parameters:**
- `input.buffer`: Image buffer
- `input.filename`: Original filename
- `input.contentType`: MIME type

**Returns:**
- `formats`: Object with AVIF, WebP, and JPEG buffers
- `sizes`: Object with thumbnail, medium, large, and original variants
- `metadata`: Image metadata (dimensions, format, etc.)

#### `uploadToS3(file: Buffer, options: S3UploadOptions): Promise<S3Object>`

Uploads a file to S3.

**Parameters:**
- `file`: File buffer
- `options.bucket`: S3 bucket name
- `options.key`: S3 object key
- `options.contentType`: MIME type
- `options.cacheControl`: Cache-Control header (optional)
- `options.metadata`: Custom metadata (optional)

**Returns:**
- `bucket`: Bucket name
- `key`: Object key
- `url`: S3 URL
- `cdnUrl`: CloudFront URL (if configured)
- `etag`: ETag header

#### `uploadOptimizedImage(optimized: OptimizedImage, baseKey: string): Promise<AssetMetadata>`

Uploads all format/size combinations to S3.

**Parameters:**
- `optimized`: Result from `optimizeImage()`
- `baseKey`: Base S3 key (e.g., "uploads/123")

**Returns:**
- Complete asset metadata with all URLs

#### `generateCDNUrl(key: string, transformations?: ImageTransformations): string`

Generates a CloudFront URL with optional transformations.

**Parameters:**
- `key`: S3 object key
- `transformations.width`: Target width (optional)
- `transformations.height`: Target height (optional)
- `transformations.format`: Target format (optional)
- `transformations.quality`: Quality 1-100 (optional)

**Returns:**
- CloudFront URL with query parameters

#### `invalidateCache(paths: string[]): Promise<void>`

Invalidates CloudFront cache for specific paths.

**Parameters:**
- `paths`: Array of paths to invalidate

## Performance

### Optimization Results

Typical compression improvements:
- AVIF: 50-70% smaller than JPEG
- WebP: 25-35% smaller than JPEG
- JPEG: Baseline (progressive encoding)

### Size Variants

| Size | Dimensions | Use Case |
|------|-----------|----------|
| Thumbnail | 150x150 | Avatars, previews |
| Medium | 800x800 | Content images |
| Large | 1920x1920 | Hero images |
| Original | Unchanged | Downloads |

### Cache Strategy

- **Browser Cache**: 1 year (immutable)
- **CloudFront Cache**: 1 year
- **S3 Storage**: Permanent (until deleted)

## Testing

### Run Tests

```bash
# Unit tests
npm run test tests/properties/asset-optimizer.property.test.ts

# Integration test
tsx scripts/test-asset-optimizer.ts
```

### Property Tests

The asset optimizer includes property-based tests that verify:

1. **Property 11**: Multi-format generation (AVIF, WebP, JPEG)
2. **Property 12**: Lazy loading support
3. **Property 13**: Responsive image sizes
4. **Property 14**: Cache duration (24+ hours)

Each test runs 100 iterations with random inputs.

## Troubleshooting

### Sharp Installation Issues

If you encounter issues installing `sharp`:

```bash
npm install sharp --legacy-peer-deps
```

### AWS Credentials

Ensure AWS credentials are configured:

```bash
aws configure
# or
export AWS_ACCESS_KEY_ID=REDACTED-key
export AWS_SECRET_ACCESS_KEY=REDACTED-secret
```

### CloudFront Not Working

1. Verify distribution is deployed
2. Check origin settings point to S3 bucket
3. Ensure bucket policy allows public read
4. Wait for distribution to propagate (15-20 minutes)

### Images Not Loading

1. Check S3 bucket permissions
2. Verify CORS configuration
3. Check CloudFront cache behavior
4. Inspect browser network tab for errors

## Best Practices

1. **Always use lazy loading** for off-screen images
2. **Prefer AVIF format** for modern browsers
3. **Use appropriate sizes** based on viewport
4. **Set proper aspect ratios** to prevent layout shifts
5. **Implement LQIP** (Low Quality Image Placeholder) for better UX
6. **Monitor CloudWatch metrics** for optimization effectiveness
7. **Invalidate cache** after updating images
8. **Use CDN URLs** instead of direct S3 URLs

## Next Steps

1. Configure AWS credentials
2. Create S3 bucket
3. Set up CloudFront distribution (optional)
4. Test image upload
5. Integrate into your application
6. Monitor performance metrics

## Related Documentation

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
