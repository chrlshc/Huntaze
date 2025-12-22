# Huntaze Video Processor

ECS/Fargate worker for video processing with ffmpeg + captions generation.

## Architecture

```
Frontend → S3 (presigned upload) → API → SQS → Fargate Worker → S3 → DB
```

### Features

- **Video Processing**: Download → Transcribe → Generate captions → Create variants
- **Captions**: .ASS format with word-level timestamps for karaoke effects
- **Variants**: Hook cut (3s), Main (full), Teaser (15s)
- **Auto-scaling**: 0-10 tasks based on queue depth
- **Storage**: 100GiB ephemeral storage per task

## Local Development

### Prerequisites

- Docker & Docker Compose
- AWS CLI (for LocalStack)
- Node.js 20+ (for local testing)

### Setup

1. Clone and navigate to worker directory:
```bash
cd workers/video-processor
```

2. Start local services:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
psql postgresql://postgres:postgres@localhost:5432/huntaze_test < ../../migrations/001_production_jobs.sql
```

4. Test the worker:
```bash
# Build and run locally
npm run build
npm run dev
```

### Environment Variables

```bash
AWS_REGION=us-east-1
SQS_QUEUE_URL=http://localhost:4566/000000000000/huntaze-video-processing-local
S3_BUCKET=test-videos
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/huntaze_test
```

## Production Deployment

### 1. Build and Push to ECR

```bash
# Build for production
./build.sh production latest

# Or for staging
./build.sh staging v1.0.0
```

### 2. Deploy CloudFormation Stack

```bash
aws cloudformation deploy \
  --template-file ../../infra/aws/video-processor/cloudformation.yaml \
  --stack-name huntaze-video-processor \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=production \
    VpcId=vpc-xxxxx \
    SubnetIds=subnet-xxxxx,subnet-yyyyy \
    DatabaseUrl=postgresql://...
```

### 3. Update Environment Variables

Add these to your Next.js environment:

```bash
# .env.local
AWS_REGION=us-east-1
S3_BUCKET=huntaze-videos-production
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxxxx/huntaze-video-processing-production
DATABASE_URL=postgresql://...
```

## API Integration

### Upload Video (Direct to S3)

```typescript
// 1. Get presigned URL
const upload = await fetch('/api/content-factory/upload', {
  method: 'POST',
  body: JSON.stringify({
    fileName: 'video.mp4',
    contentType: 'video/mp4',
    fileSize: 50000000, // 50MB
  }),
});

const { presignedUrl, s3Key } = await upload.json();

// 2. Upload directly to S3
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'video/mp4' },
});
```

### Start Processing

```typescript
const job = await fetch('/api/content-factory/produce', {
  method: 'POST',
  body: formData, // FormData with s3Key, options, etc.
});

const { jobId } = await job.json();
```

### Check Status

```typescript
const status = await fetch(`/api/content-factory/jobs/${jobId}`);
const { status, progress, createdContentIds } = await status.json();
```

## Worker Pipeline

1. **Download**: Fetch video from S3 to `/tmp`
2. **Transcribe**: AWS Transcribe with word timestamps
3. **Captions**: Generate .ASS with karaoke styling
4. **Process**: Create 3 variants with ffmpeg
5. **Upload**: Store outputs in S3
6. **Create**: Add drafts to database & marketing queue

## Monitoring

### CloudWatch Metrics

- Queue depth (ApproximateNumberOfMessagesVisible)
- Processing time (custom metric from worker)
- Error rates (DLQ messages)

### Health Check

Worker exposes health status at `/health` (internal endpoint):

```json
{
  "status": "healthy",
  "checks": {
    "s3": true,
    "sqs": true,
    "database": true,
    "ffmpeg": true
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure base image includes ffmpeg
2. **Permission denied**: Check IAM roles for S3/SQS access
3. **Out of memory**: Increase task memory (8GB default)
4. **Storage full**: Monitor `/tmp` usage, increase ephemeral storage

### Debugging

```bash
# Check logs
aws logs tail /huntaze/video-processor --follow

# Inspect queue
aws sqs get-queue-attributes --queue-url $SQS_QUEUE_URL --attribute-names All

# Check S3
aws s3 ls s3://huntaze-videos-production/outputs/
```

## Cost Optimization

- Use Fargate Spot for 70% savings
- Auto-scale to 0 when idle
- Lifecycle policy for S3 (move to IA after 30 days)
- Clean up temp files automatically
