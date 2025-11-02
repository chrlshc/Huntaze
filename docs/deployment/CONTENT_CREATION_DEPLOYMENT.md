# 🎨 Content Creation - AWS Amplify Deployment

## Environment Variables Required

### Core Application
```bash
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
JWT_SECRET=<same-as-onlyfans>
NEXTAUTH_SECRET=<same-as-onlyfans>
NEXTAUTH_URL=https://your-domain.com
```

### AWS S3 Storage
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_S3_BUCKET=huntaze-content-media-prod
CLOUDFRONT_DOMAIN=https://d1234567890.cloudfront.net
```

### AI Services
```bash
OPENAI_API_KEY=sk-<your-openai-api-key>
OPENAI_MODEL=gpt-4
STABILITY_API_KEY=sk-<your-stability-api-key>
```

### Media Processing
```bash
MAX_FILE_SIZE=100MB
ALLOWED_VIDEO_FORMATS=mp4,mov,avi,mkv
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp
```

### Preview System
```bash
PREVIEW_TOKEN_SECRET=<generate-with-openssl-rand-base64-32>
PREVIEW_BASE_URL=https://your-domain.com/preview
PREVIEW_EXPIRY_HOURS=24
```

## AWS Amplify Build Settings

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npm run db:migrate
        # Install FFmpeg for video processing
        - yum install -y ffmpeg || apt-get install -y ffmpeg
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## Infrastructure Setup

### 1. Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://huntaze-content-media-prod --region us-east-1

# Configure CORS
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://your-domain.com"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket huntaze-content-media-prod \
  --cors-configuration file://cors.json

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket huntaze-content-media-prod \
  --versioning-configuration Status=Enabled
```

### 2. Create CloudFront Distribution

```bash
# Create distribution for S3
aws cloudfront create-distribution \
  --origin-domain-name huntaze-content-media-prod.s3.amazonaws.com \
  --default-root-object index.html
```

### 3. IAM Policy for Content Creation

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::huntaze-content-media-prod",
        "arn:aws:s3:::huntaze-content-media-prod/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## Next.js Configuration

```javascript
// next.config.js
module.exports = {
  experimental: {
    isrMemoryCacheSize: 0,
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: false,
  },
  images: {
    domains: ['huntaze-content-media-prod.s3.amazonaws.com', 'd1234567890.cloudfront.net'],
  },
}
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] S3 bucket created with CORS
- [ ] CloudFront distribution created
- [ ] IAM policies attached
- [ ] OpenAI API key valid
- [ ] Stability AI key valid (optional)
- [ ] FFmpeg available in build
- [ ] Media upload tested
- [ ] Preview system tested

## Post-Deployment Verification

```bash
# Test media upload
curl -X POST -F "file=@test-image.jpg" \
  https://your-domain.com/api/content/media/upload

# Test AI assistant
curl -X POST https://your-domain.com/api/content/ai/suggestions \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a caption for a beach photo"}'

# Test preview generation
curl https://your-domain.com/api/content/preview
```

## Monitoring

- S3 Metrics: Storage size, request count
- CloudFront: Cache hit ratio, bandwidth
- OpenAI: API usage, costs
- Media Processing: Upload success rate, processing time

**Estimated Monthly Cost**: $50-100 (depending on AI usage and storage)
