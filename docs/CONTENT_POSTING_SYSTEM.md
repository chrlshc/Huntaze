# Content Posting System Documentation

## Overview

The Content Posting System allows users to create and schedule content for TikTok and Instagram. It handles video uploads, task creation, background processing, and posting to social media platforms.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │      │   API       │      │   Worker    │
│             │      │             │      │             │
│ - Forms     │◄────►│ - Routes    │◄────►│ - Process   │
│ - Upload    │      │ - Validation│      │ - Post      │
│ - Queue UI  │      │ - SQS       │      │ - Retry     │
└─────────────┘      └─────────────┘      └─────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│     S3      │      │  Database   │      │  TikTok/    │
│             │      │             │      │ Instagram   │
│ - Videos    │      │ - Tasks     │      │ - APIs      │
│ - Assets    │      │ - Accounts  │      │ - OAuth     │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Features

### 1. Content Creation
- Upload videos directly to S3
- Provide video URLs
- Add captions, hooks, CTAs
- Select platforms (TikTok, Instagram)
- Schedule posts for future

### 2. Task Management
- View all content tasks
- Filter by status and platform
- Real-time updates
- Task cancellation

### 3. Background Processing
- Automatic retry on failure
- Exponential backoff
- Circuit breaker for API limits
- Detailed logging

## Quick Start

### 1. Set up Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:
- Database URL
- AWS credentials
- OAuth app credentials
- Encryption key

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Start the Worker

In a separate terminal:

```bash
npm run worker
```

## API Endpoints

### Content Creation

```http
POST /api/content/create
Content-Type: application/json

{
  "platforms": ["TIKTOK"],
  "sourceType": "UPLOAD",
  "assetKey": "uploads/1/video.mp4",
  "caption": "Check out my new video! #viral",
  "hook": "You won't believe this...",
  "cta": "Follow for more!",
  "scheduledAt": "2024-01-01T12:00:00Z"
}
```

### Get Presigned URL

```http
POST /api/content/presigned-url
Content-Type: application/json

{
  "filename": "video.mp4",
  "contentType": "video/mp4"
}
```

### Get Tasks

```http
GET /api/content/tasks
```

### Cancel Task

```http
POST /api/content/tasks/{id}/cancel
```

## Components

### ContentFactory

The main form for creating content posts.

```tsx
import { ContentFactory } from '@/components/content/ContentFactory';

function MyPage() {
  return (
    <ContentFactory
      onSuccess={(task) => console.log('Created:', task)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

### ContentQueue

Displays and manages content tasks.

```tsx
import { ContentQueue } from '@/components/content/ContentQueue';

function QueuePage() {
  return (
    <ContentQueue
      autoRefreshInterval={5000}
      onTaskClick={(task) => showTaskDetails(task)}
    />
  );
}
```

### useContentTasks Hook

React hook for managing tasks.

```tsx
import { useContentTasks } from '@/lib/hooks/useContentTasks';

function MyComponent() {
  const { tasks, isLoading, error, refresh } = useContentTasks({
    autoRefresh: true,
    refreshInterval: 5000,
  });

  // ...
}
```

## Worker Configuration

The worker processes tasks from the SQS queue. Configure it with:

```bash
# Worker settings
WORKER_CONCURRENCY=10          # Max concurrent tasks
WORKER_VISIBILITY_TIMEOUT=300  # SQS visibility timeout (seconds)
WORKER_MESSAGE_RETENTION=1209600 # Message retention (seconds)
```

### Deploy Worker

```bash
# Deploy to AWS Lambda
npm run deploy:worker

# Or deploy to ECS
DEPLOYMENT_TYPE=ecs npm run deploy:worker
```

## Error Handling

### Common Errors

1. **Asset Not Found**
   - Ensure the video was uploaded to S3
   - Check the `assetKey` is correct

2. **OAuth Token Expired**
   - Re-authenticate with the platform
   - Check token refresh is working

3. **Rate Limit Exceeded**
   - The worker will automatically retry
   - Check circuit breaker status

4. **Invalid Caption**
   - Caption must be 1-2200 characters
   - Check for special characters

### Monitoring

Monitor the system via:
- CloudWatch logs
- Database task status
- SQS queue metrics
- Error alerts

## Security

### Token Encryption

OAuth tokens are encrypted using AES-256:
- Set `ENCRYPTION_KEY` to a 32-character string
- Never commit the key to version control

### Rate Limiting

API endpoints are rate-limited:
- 100 requests per minute per user
- 1000 requests per minute per IP

### Permissions

- Workers need SQS, S3, and database access
- API needs database and S3 access
- Frontend only accesses API endpoints

## Troubleshooting

### Task Stuck in PENDING
1. Check if worker is running
2. Verify SQS queue URL
3. Check worker logs

### Upload Fails
1. Check S3 credentials
2. Verify bucket exists
3. Check file size limits

### OAuth Fails
1. Verify app credentials
2. Check redirect URI
3. Ensure app is approved

### Worker Crashes
1. Check environment variables
2. Verify database connection
3. Review error logs

## Best Practices

1. **Always validate inputs** before creating tasks
2. **Use scheduled posts** for optimal timing
3. **Monitor task status** regularly
4. **Handle errors gracefully** in the UI
5. **Keep tokens secure** with proper encryption

## Support

For issues:
1. Check the logs
2. Review this documentation
3. Create an issue with:
   - Error messages
   - Steps to reproduce
   - Environment details

## Roadmap

- [ ] Support for more platforms
- [ ] Video editing features
- [ ] Analytics dashboard
- [ ] Bulk posting
- [ ] Content templates
