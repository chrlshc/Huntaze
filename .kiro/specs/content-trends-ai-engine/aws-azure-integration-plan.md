# Content Trends AI Engine - AWS-Azure Integration Plan

## Overview

This document outlines the integration plan for deploying the Content Trends AI Engine within the existing hybrid AWS-Azure infrastructure. The system will leverage the existing AI Coordinator, Router Client, and AWS ECS deployment while adding new Content Trends capabilities.

## Current Infrastructure Analysis

### Existing Components
- **AI Coordinator** (`lib/ai/coordinator.ts`) - Routes between Foundry and Legacy providers
- **Router Client** (`lib/ai/foundry/router-client.ts`) - TypeScript client for Python AI Router
- **AWS ECS Service** (`infra/aws/ecs-router-service.tf`) - Deployed AI Router on ECS Fargate
- **Azure AI Foundry** - Already configured with DeepSeek R1, V3, and Llama Vision models

### Content Trends Components (Completed)
- **Azure Foundry Config** (`lib/ai/content-trends/azure-foundry-config.ts`) - Model endpoints
- **AI Router** (`lib/ai/content-trends/ai-router.ts`) - Task routing logic
- **Video Processing** (`lib/ai/content-trends/video-processor.ts`) - FFmpeg + Azure Blob
- **Queue System** (`lib/ai/content-trends/queue/`) - BullMQ with Redis
- **Viral Analysis** (`lib/ai/content-trends/viral-prediction/`) - Complete engine
- **Security & Monitoring** (`lib/ai/content-trends/security/`, `lib/ai/content-trends/monitoring/`)

## Integration Strategy

### Phase 1: AI Coordinator Integration

#### Task 1.1: Extend AI Coordinator for Content Trends
**File**: `lib/ai/coordinator.ts`
**Changes**:
- Add new request type: `'content_trends_analysis'`
- Integrate ContentTrendsAIRouter for specialized routing
- Add Content Trends agent to Foundry registry

```typescript
// New request type in AIRequest union
type ContentTrendsRequest = {
  type: 'content_trends_analysis';
  creatorId: number;
  contentUrl: string;
  platform: string;
  analysisType: 'viral_prediction' | 'trend_detection' | 'content_generation';
  context?: any;
};
```

#### Task 1.2: Create Content Trends Foundry Agent
**File**: `lib/ai/agents/content-trends.foundry.ts`
**Purpose**: Bridge between AI Coordinator and Content Trends Engine

```typescript
export class ContentTrendsFoundryAgent {
  async processRequest(request: ContentTrendsRequest): Promise<AIResponse> {
    // Route to appropriate Content Trends service
    // Handle video processing, viral analysis, etc.
  }
}
```

### Phase 2: AWS Infrastructure Extension

#### Task 2.1: Extend ECS Service for Content Trends
**File**: `infra/aws/ecs-content-trends-service.tf`
**Components**:
- New ECS service for Content Trends workers
- Redis cluster for BullMQ queues
- Additional security groups for video processing
- S3 bucket for temporary video storage
- CloudWatch logs for Content Trends metrics

#### Task 2.2: Update Existing ECS Router Service
**File**: `infra/aws/ecs-router-service.tf`
**Changes**:
- Add environment variables for Content Trends endpoints
- Update security groups for inter-service communication
- Add secrets for Azure Blob Storage and Redis

```hcl
# Additional environment variables
environment = [
  # Existing variables...
  { name = "CONTENT_TRENDS_ENABLED", value = "true" },
  { name = "REDIS_CLUSTER_ENDPOINT", value = aws_elasticache_replication_group.content_trends.primary_endpoint },
  { name = "S3_VIDEO_BUCKET", value = aws_s3_bucket.video_processing.bucket }
]

# Additional secrets
secrets = [
  # Existing secrets...
  {
    name      = "AZURE_BLOB_CONNECTION_STRING"
    valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/content-trends/blob-storage"
  }
]
```

### Phase 3: Queue and Processing Infrastructure

#### Task 3.1: Deploy Redis Cluster for BullMQ
**File**: `infra/aws/redis-cluster.tf`
**Components**:
- ElastiCache Redis cluster with Multi-AZ
- Security groups for queue access
- Parameter groups optimized for BullMQ

#### Task 3.2: Deploy Content Trends Workers
**File**: `infra/aws/content-trends-workers.tf`
**Components**:
- ECS service for video processing workers
- ECS service for viral analysis workers
- ECS service for trend detection workers
- Auto-scaling based on queue depth

### Phase 4: API Integration

#### Task 4.1: Create Content Trends API Routes
**Files**: 
- `app/api/ai/content-trends/analyze/route.ts`
- `app/api/ai/content-trends/trends/route.ts`
- `app/api/ai/content-trends/generate/route.ts`

**Integration Points**:
- Use existing AI Coordinator for routing
- Leverage existing authentication and rate limiting
- Add Content Trends-specific validation

```typescript
// app/api/ai/content-trends/analyze/route.ts
export async function POST(request: Request) {
  const coordinator = new AITeamCoordinator();
  
  const result = await coordinator.route({
    type: 'content_trends_analysis',
    creatorId: userId,
    contentUrl: body.contentUrl,
    platform: body.platform,
    analysisType: 'viral_prediction'
  });
  
  return NextResponse.json(result);
}
```

#### Task 4.2: Update Router Client for Content Trends
**File**: `lib/ai/foundry/router-client.ts`
**Changes**:
- Add Content Trends type hints
- Support for multimodal requests (video + text)
- Streaming support for long-running analysis

### Phase 5: Monitoring and Observability Integration

#### Task 5.1: Extend Existing Monitoring
**Integration Points**:
- Use existing CloudWatch log groups
- Extend existing metrics collection
- Add Content Trends dashboards to existing monitoring

#### Task 5.2: Update Alerting Rules
**File**: `infra/aws/cloudwatch-alarms.tf`
**New Alarms**:
- Queue depth monitoring
- Video processing failures
- AI model latency for Content Trends
- Cost monitoring for new models

## Deployment Plan

### Step 1: Infrastructure Preparation
1. Deploy Redis cluster for queues
2. Create S3 bucket for video processing
3. Update secrets in AWS Secrets Manager
4. Configure Azure Blob Storage integration

### Step 2: Code Integration
1. Extend AI Coordinator with Content Trends support
2. Create Content Trends Foundry Agent
3. Add API routes for Content Trends
4. Update Router Client for new capabilities

### Step 3: Service Deployment
1. Deploy Content Trends workers to ECS
2. Update existing AI Router service
3. Configure queue workers and monitoring
4. Test end-to-end integration

### Step 4: Validation and Testing
1. Run integration tests
2. Validate monitoring and alerting
3. Performance testing under load
4. Security validation

## Environment Variables and Configuration

### New Environment Variables
```bash
# Content Trends Configuration
CONTENT_TRENDS_ENABLED=true
REDIS_CLUSTER_ENDPOINT=content-trends-redis.cache.amazonaws.com:6379
S3_VIDEO_BUCKET=huntaze-content-trends-video-processing
AZURE_BLOB_CONTAINER=content-trends-analysis

# Queue Configuration
BULLMQ_REDIS_HOST=content-trends-redis.cache.amazonaws.com
BULLMQ_REDIS_PORT=6379
QUEUE_CONCURRENCY_VIDEO=2
QUEUE_CONCURRENCY_ANALYSIS=5

# Processing Configuration
FFMPEG_PATH=/usr/bin/ffmpeg
VIDEO_MAX_SIZE_MB=100
KEYFRAME_COUNT=5
```

### Updated Secrets
```bash
# Azure Integration
AZURE_BLOB_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_AI_CONTENT_TRENDS_KEY=REDACTED-content-trends-key

# Queue Authentication
REDIS_AUTH_TOKEN=your-redis-auth-token
```

## Cost Optimization

### Model Usage Strategy
- **DeepSeek V3**: Primary model for content generation (cost-efficient MoE)
- **DeepSeek R1**: Complex reasoning tasks only (higher cost, better quality)
- **Llama Vision**: Visual analysis (moderate cost, good performance)

### Infrastructure Optimization
- Use Spot instances for non-critical workers
- Auto-scaling based on queue depth
- S3 Intelligent Tiering for video storage
- Redis cluster sizing based on actual usage

## Security Considerations

### Network Security
- Private subnets for all processing workers
- Security groups restricting inter-service communication
- VPC endpoints for AWS services

### Data Security
- Encryption at rest for S3 and Redis
- Encryption in transit for all API calls
- Temporary video storage with automatic cleanup
- PII detection and anonymization

### Access Control
- IAM roles with least privilege
- Service-to-service authentication
- API key rotation for external services

## Monitoring and Alerting

### Key Metrics
- Queue depth and processing time
- AI model latency and success rates
- Video processing success/failure rates
- Cost per analysis operation

### Alert Conditions
- Queue depth > 1000 items
- Processing time > 5 minutes
- Error rate > 5%
- Daily cost > budget threshold

## Rollback Strategy

### Deployment Rollback
- Blue-green deployment for ECS services
- Feature flags for Content Trends functionality
- Database migration rollback procedures
- Queue drain and replay capabilities

### Monitoring Rollback
- Automated rollback triggers based on error rates
- Manual rollback procedures documented
- Data consistency validation post-rollback

## Success Criteria

### Technical Metrics
- End-to-end analysis time < 2 minutes
- Queue processing latency < 30 seconds
- System availability > 99.9%
- Error rate < 1%

### Business Metrics
- Cost per analysis < $0.50
- Viral prediction accuracy > 75%
- User satisfaction > 90%
- Time to insights < 5 minutes

## Next Steps

1. **Review and Approve Plan**: Validate integration approach with team
2. **Infrastructure Setup**: Deploy Redis, S3, and update ECS configuration
3. **Code Integration**: Implement AI Coordinator extensions and API routes
4. **Testing Phase**: Comprehensive testing of integrated system
5. **Production Deployment**: Gradual rollout with monitoring
6. **Performance Optimization**: Fine-tune based on production metrics

This integration plan leverages your existing hybrid AWS-Azure infrastructure while adding the powerful Content Trends AI Engine capabilities. The modular approach ensures minimal disruption to existing services while providing a clear path to production deployment.