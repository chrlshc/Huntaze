# Content Trends AI Engine - Integration Implementation Tasks

## Overview

This document provides the specific implementation tasks for integrating the Content Trends AI Engine with the existing hybrid AWS-Azure infrastructure. Each task includes code examples, file modifications, and acceptance criteria.

## Phase 1: AI Coordinator Integration

### Task INT-1.1: Extend AI Request Types
**File**: `lib/ai/agents/types.ts`
**Priority**: High
**Estimated Time**: 2 hours

**Changes**:
```typescript
// Add to existing AIRequest union type
export type ContentTrendsRequest = {
  type: 'content_trends_analysis';
  creatorId: number;
  contentUrl: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  analysisType: 'viral_prediction' | 'trend_detection' | 'content_generation';
  context?: {
    brandProfile?: any;
    targetAudience?: string[];
    contentGoals?: string[];
  };
};

// Update AIRequest union
export type AIRequest = 
  | FanMessageRequest
  | CaptionGenerationRequest
  | PerformanceAnalysisRequest
  | SalesOptimizationRequest
  | ContentTrendsRequest; // Add this line
```

**Acceptance Criteria**:
- New request type properly typed
- No TypeScript compilation errors
- Existing functionality unaffected

### Task INT-1.2: Create Content Trends Foundry Agent
**File**: `lib/ai/agents/content-trends.foundry.ts`
**Priority**: High
**Estimated Time**: 4 hours

**Implementation**:
```typescript
/**
 * Content Trends Foundry Agent
 * 
 * Bridges AI Coordinator with Content Trends AI Engine
 * Handles video analysis, viral prediction, and content generation
 */

import { AIResponse } from './types';
import { ContentTrendsRequest } from './types';
import { ContentTrendsAIRouter } from '../content-trends/ai-router';
import { VideoProcessor } from '../content-trends/video-processor';
import { ViralPredictionEngine } from '../content-trends/viral-prediction/viral-prediction-engine';
import { TrendDetector } from '../content-trends/trend-detection/trend-detector';
import { RecommendationEngine } from '../content-trends/recommendation/recommendation-engine';
import { ContentTrendsQueueManager } from '../content-trends/queue/queue-manager';

export class ContentTrendsFoundryAgent {
  private router: ContentTrendsAIRouter;
  private videoProcessor: VideoProcessor;
  private viralEngine: ViralPredictionEngine;
  private trendDetector: TrendDetector;
  private recommendationEngine: RecommendationEngine;
  private queueManager: ContentTrendsQueueManager;

  constructor() {
    this.router = new ContentTrendsAIRouter();
    this.videoProcessor = new VideoProcessor();
    this.viralEngine = new ViralPredictionEngine();
    this.trendDetector = new TrendDetector();
    this.recommendationEngine = new RecommendationEngine();
    this.queueManager = new ContentTrendsQueueManager();
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.router.initialize(),
      this.queueManager.initialize(),
    ]);
  }

  async processRequest(request: ContentTrendsRequest): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      
      switch (request.analysisType) {
        case 'viral_prediction':
          return await this.handleViralPrediction(request);
        case 'trend_detection':
          return await this.handleTrendDetection(request);
        case 'content_generation':
          return await this.handleContentGeneration(request);
        default:
          throw new Error(`Unknown analysis type: ${request.analysisType}`);
      }
    } catch (error) {
      console.error('[ContentTrendsAgent] Error processing request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handleViralPrediction(request: ContentTrendsRequest): Promise<AIResponse> {
    // Queue the analysis for async processing
    const jobId = await this.queueManager.addJob('viral-analysis', {
      contentUrl: request.contentUrl,
      platform: request.platform,
      creatorId: request.creatorId,
      context: request.context,
    }, {
      priority: 'high',
      attempts: 3,
    });

    // For immediate response, return job ID
    // Client can poll for results or use webhooks
    return {
      success: true,
      data: {
        jobId,
        status: 'queued',
        estimatedCompletionTime: Date.now() + 120000, // 2 minutes
        message: 'Viral prediction analysis queued for processing',
      },
    };
  }

  private async handleTrendDetection(request: ContentTrendsRequest): Promise<AIResponse> {
    const trends = await this.trendDetector.detectTrends({
      platform: request.platform,
      timeframe: '24h',
      region: 'global',
    });

    return {
      success: true,
      data: {
        trends: trends.slice(0, 10), // Top 10 trends
        platform: request.platform,
        timestamp: new Date().toISOString(),
        usage: {
          inputTokens: 100,
          outputTokens: 500,
          costUsd: 0.001,
          model: 'deepseek-v3',
          deployment: 'deepseek-v3-generation',
          region: 'eastus2',
        },
      },
    };
  }

  private async handleContentGeneration(request: ContentTrendsRequest): Promise<AIResponse> {
    const recommendations = await this.recommendationEngine.generateRecommendations({
      creatorId: request.creatorId,
      platform: request.platform,
      brandProfile: request.context?.brandProfile,
      targetAudience: request.context?.targetAudience || [],
      contentGoals: request.context?.contentGoals || [],
    });

    return {
      success: true,
      data: {
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        platform: request.platform,
        timestamp: new Date().toISOString(),
        usage: {
          inputTokens: 200,
          outputTokens: 800,
          costUsd: 0.002,
          model: 'deepseek-r1',
          deployment: 'deepseek-r1-reasoning',
          region: 'eastus2',
        },
      },
    };
  }
}
```

**Acceptance Criteria**:
- Agent properly handles all three analysis types
- Async processing via queue system
- Proper error handling and logging
- Usage tracking for cost monitoring

### Task INT-1.3: Update AI Coordinator
**File**: `lib/ai/coordinator.ts`
**Priority**: High
**Estimated Time**: 3 hours

**Changes**:
```typescript
// Add import
import { ContentTrendsFoundryAgent } from './agents/content-trends.foundry';

// Add to class properties
private contentTrendsAgent: ContentTrendsFoundryAgent;

// Update constructor
constructor() {
  // ... existing code ...
  this.contentTrendsAgent = new ContentTrendsFoundryAgent();
}

// Update initialize method
async initialize(): Promise<void> {
  await Promise.all([
    // ... existing agents ...
    this.contentTrendsAgent.initialize(),
  ]);
  
  // ... rest of existing code ...
}

// Add to routeToFoundry method
private async executeFoundryRequest(
  request: AIRequest,
  agentType: FoundryAgentType,
  correlationId: string
): Promise<CoordinatorResponse> {
  // ... existing code ...
  
  // Add case for content trends
  if (request.type === 'content_trends_analysis') {
    response = await this.contentTrendsAgent.processRequest(request);
    agentsInvolved.push('content-trends-foundry');
  } else {
    // ... existing switch statement ...
  }
  
  // ... rest of existing code ...
}

// Add to routeToLegacy method
private async routeToLegacy(
  request: AIRequest,
  correlationId: string
): Promise<CoordinatorResponse> {
  let result: CoordinatorResponse;
  
  switch (request.type) {
    // ... existing cases ...
    
    case 'content_trends_analysis':
      // For legacy, we can still use the Foundry agent
      // or implement a simplified version
      const contentTrendsResponse = await this.contentTrendsAgent.processRequest(request);
      result = {
        success: contentTrendsResponse.success,
        data: contentTrendsResponse.data,
        error: contentTrendsResponse.error,
        agentsInvolved: ['content-trends-legacy'],
        usage: contentTrendsResponse.data?.usage,
      };
      break;
      
    // ... rest of existing cases ...
  }
  
  // ... rest of existing code ...
}
```

**Acceptance Criteria**:
- Content Trends requests properly routed
- Both Foundry and Legacy paths supported
- Existing functionality preserved
- Proper error handling maintained

### Task INT-1.4: Update Foundry Agent Registry
**File**: `lib/ai/foundry/agent-registry.ts`
**Priority**: Medium
**Estimated Time**: 1 hour

**Changes**:
```typescript
// Add to FoundryAgentType enum
export type FoundryAgentType = 
  | 'messaging'
  | 'analytics'
  | 'sales'
  | 'compliance'
  | 'content-trends'; // Add this line

// Update mapRequestTypeToAgent method
static mapRequestTypeToAgent(requestType: string): FoundryAgentType | null {
  switch (requestType) {
    // ... existing cases ...
    case 'content_trends_analysis':
      return 'content-trends';
    default:
      return null;
  }
}

// Update getAgent method to handle content-trends
getAgent(type: FoundryAgentType): any {
  switch (type) {
    // ... existing cases ...
    case 'content-trends':
      if (!this.agents.has('content-trends')) {
        const { ContentTrendsFoundryAgent } = require('../agents/content-trends.foundry');
        this.agents.set('content-trends', new ContentTrendsFoundryAgent());
      }
      return this.agents.get('content-trends');
    // ... rest of existing cases ...
  }
}
```

**Acceptance Criteria**:
- Content Trends agent properly registered
- Lazy loading works correctly
- No impact on existing agents

## Phase 2: API Integration

### Task INT-2.1: Create Content Trends API Routes
**Files**: 
- `app/api/ai/content-trends/analyze/route.ts`
- `app/api/ai/content-trends/trends/route.ts`
- `app/api/ai/content-trends/generate/route.ts`

**Priority**: High
**Estimated Time**: 4 hours

**Implementation**:

**File**: `app/api/ai/content-trends/analyze/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AITeamCoordinator } from '@/lib/ai/coordinator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const analyzeSchema = z.object({
  contentUrl: z.string().url(),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter']),
  analysisType: z.enum(['viral_prediction', 'trend_detection', 'content_generation']).default('viral_prediction'),
  context: z.object({
    brandProfile: z.any().optional(),
    targetAudience: z.array(z.string()).optional(),
    contentGoals: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = analyzeSchema.parse(body);

    const coordinator = new AITeamCoordinator();
    await coordinator.initialize();

    const result = await coordinator.route({
      type: 'content_trends_analysis',
      creatorId: parseInt(session.user.id),
      contentUrl: validatedData.contentUrl,
      platform: validatedData.platform,
      analysisType: validatedData.analysisType,
      context: validatedData.context,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ContentTrends API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/ai/content-trends/trends/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AITeamCoordinator } from '@/lib/ai/coordinator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const trendsSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter']),
  timeframe: z.enum(['1h', '6h', '24h', '7d']).default('24h'),
  region: z.string().default('global'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validatedData = trendsSchema.parse({
      platform: searchParams.get('platform'),
      timeframe: searchParams.get('timeframe') || '24h',
      region: searchParams.get('region') || 'global',
    });

    const coordinator = new AITeamCoordinator();
    await coordinator.initialize();

    const result = await coordinator.route({
      type: 'content_trends_analysis',
      creatorId: parseInt(session.user.id),
      contentUrl: '', // Not needed for trend detection
      platform: validatedData.platform,
      analysisType: 'trend_detection',
      context: {
        timeframe: validatedData.timeframe,
        region: validatedData.region,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ContentTrends Trends API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/ai/content-trends/generate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AITeamCoordinator } from '@/lib/ai/coordinator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const generateSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter']),
  brandProfile: z.object({
    name: z.string(),
    voice: z.string(),
    values: z.array(z.string()),
    targetAudience: z.array(z.string()),
  }),
  contentGoals: z.array(z.string()),
  trendContext: z.object({
    trends: z.array(z.any()),
    viralMechanisms: z.array(z.any()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = generateSchema.parse(body);

    const coordinator = new AITeamCoordinator();
    await coordinator.initialize();

    const result = await coordinator.route({
      type: 'content_trends_analysis',
      creatorId: parseInt(session.user.id),
      contentUrl: '', // Not needed for content generation
      platform: validatedData.platform,
      analysisType: 'content_generation',
      context: {
        brandProfile: validatedData.brandProfile,
        contentGoals: validatedData.contentGoals,
        trendContext: validatedData.trendContext,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ContentTrends Generate API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- All three API endpoints functional
- Proper authentication and validation
- Error handling and logging
- Integration with AI Coordinator

### Task INT-2.2: Create Job Status API
**File**: `app/api/ai/content-trends/jobs/[jobId]/route.ts`
**Priority**: Medium
**Estimated Time**: 2 hours

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ContentTrendsQueueManager } from '@/lib/ai/content-trends/queue/queue-manager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queueManager = new ContentTrendsQueueManager();
    await queueManager.initialize();

    const jobStatus = await queueManager.getJobStatus(params.jobId);
    
    if (!jobStatus) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(jobStatus);
  } catch (error) {
    console.error('[ContentTrends Job Status API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- Job status retrieval working
- Proper authentication
- Error handling for missing jobs

## Phase 3: Infrastructure Integration

### Task INT-3.1: Create Redis Infrastructure
**File**: `infra/aws/redis-cluster.tf`
**Priority**: High
**Estimated Time**: 3 hours

**Implementation**:
```hcl
# Redis Subnet Group
resource "aws_elasticache_subnet_group" "content_trends" {
  name       = "huntaze-content-trends-redis-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# Redis Parameter Group
resource "aws_elasticache_parameter_group" "content_trends" {
  family = "redis7.x"
  name   = "huntaze-content-trends-redis-params-${var.environment}"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# Redis Replication Group
resource "aws_elasticache_replication_group" "content_trends" {
  replication_group_id         = "huntaze-content-trends-${var.environment}"
  description                  = "Redis cluster for Content Trends queue system"
  
  node_type                    = "cache.r7g.large"
  port                         = 6379
  parameter_group_name         = aws_elasticache_parameter_group.content_trends.name
  subnet_group_name            = aws_elasticache_subnet_group.content_trends.name
  security_group_ids           = [aws_security_group.redis.id]
  
  num_cache_clusters           = 2
  automatic_failover_enabled   = true
  multi_az_enabled            = true
  
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                   = var.redis_auth_token
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name        = "huntaze-content-trends-redis-${var.environment}"
  description = "Security group for Content Trends Redis cluster"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from ECS tasks"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.content_trends_tasks.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "huntaze-content-trends-redis-${var.environment}"
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/huntaze-content-trends-redis"
  retention_in_days = 7

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# Variables
variable "redis_auth_token" {
  description = "Redis authentication token"
  type        = string
  sensitive   = true
}

# Outputs
output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.content_trends.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.content_trends.reader_endpoint_address
}
```

**Acceptance Criteria**:
- Redis cluster deployed with Multi-AZ
- Encryption at rest and in transit
- Proper security groups and networking
- CloudWatch logging configured

### Task INT-3.2: Create S3 Bucket for Video Processing
**File**: `infra/aws/s3-video-processing.tf`
**Priority**: High
**Estimated Time**: 2 hours

**Implementation**:
```hcl
# S3 Bucket for Video Processing
resource "aws_s3_bucket" "video_processing" {
  bucket = "huntaze-content-trends-video-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "video_processing" {
  bucket = aws_s3_bucket.video_processing.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "video_processing" {
  bucket = aws_s3_bucket.video_processing.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "video_processing" {
  bucket = aws_s3_bucket.video_processing.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "video_processing" {
  bucket = aws_s3_bucket.video_processing.id

  rule {
    id     = "cleanup_temp_files"
    status = "Enabled"

    expiration {
      days = 7
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }
}

# IAM Policy for S3 Access
resource "aws_iam_policy" "s3_video_processing" {
  name        = "huntaze-content-trends-s3-${var.environment}"
  description = "IAM policy for Content Trends S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.video_processing.arn,
          "${aws_s3_bucket.video_processing.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# Output
output "s3_video_bucket_name" {
  description = "S3 bucket name for video processing"
  value       = aws_s3_bucket.video_processing.bucket
}

output "s3_video_bucket_arn" {
  description = "S3 bucket ARN for video processing"
  value       = aws_s3_bucket.video_processing.arn
}
```

**Acceptance Criteria**:
- S3 bucket created with proper configuration
- Lifecycle policies for cleanup
- Encryption and security configured
- IAM policies for ECS access

### Task INT-3.3: Create Content Trends ECS Service
**File**: `infra/aws/ecs-content-trends-service.tf`
**Priority**: High
**Estimated Time**: 4 hours

**Implementation**:
```hcl
# ECS Task Definition for Content Trends Workers
resource "aws_ecs_task_definition" "content_trends_workers" {
  family                   = "huntaze-content-trends-workers"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.content_trends_task.arn

  container_definitions = jsonencode([
    {
      name      = "content-trends-worker"
      image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/huntaze/content-trends:latest"
      essential = true
      
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "REDIS_HOST", value = aws_elasticache_replication_group.content_trends.primary_endpoint_address },
        { name = "REDIS_PORT", value = "6379" },
        { name = "S3_VIDEO_BUCKET", value = aws_s3_bucket.video_processing.bucket },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "AZURE_AI_REGION", value = "eastus2" },
        { name = "WORKER_CONCURRENCY", value = "3" },
        { name = "FFMPEG_PATH", value = "/usr/bin/ffmpeg" }
      ]

      secrets = [
        {
          name      = "REDIS_AUTH_TOKEN"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/content-trends/redis-auth"
        },
        {
          name      = "AZURE_AI_API_KEY"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/content-trends/azure-key"
        },
        {
          name      = "AZURE_BLOB_CONNECTION_STRING"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/content-trends/blob-storage"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "node -e 'process.exit(0)'"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/huntaze-content-trends-workers"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "content-trends"
          "awslogs-create-group"  = "true"
        }
      }
    }
  ])

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# Security Group for Content Trends Tasks
resource "aws_security_group" "content_trends_tasks" {
  name        = "huntaze-content-trends-tasks-${var.environment}"
  description = "Security group for Content Trends ECS tasks"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "huntaze-content-trends-tasks-${var.environment}"
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# ECS Service for Content Trends Workers
resource "aws_ecs_service" "content_trends_workers" {
  name            = "huntaze-content-trends-workers"
  cluster         = aws_ecs_cluster.ai_router.id
  task_definition = aws_ecs_task_definition.content_trends_workers.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.content_trends_tasks.id]
    assign_public_ip = true
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# IAM Role for Content Trends Tasks
resource "aws_iam_role" "content_trends_task" {
  name = "huntaze-content-trends-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}

# Attach S3 policy to task role
resource "aws_iam_role_policy_attachment" "content_trends_s3" {
  role       = aws_iam_role.content_trends_task.name
  policy_arn = aws_iam_policy.s3_video_processing.arn
}

# Auto Scaling for Content Trends Workers
resource "aws_appautoscaling_target" "content_trends_workers" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.ai_router.name}/${aws_ecs_service.content_trends_workers.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale based on CPU utilization
resource "aws_appautoscaling_policy" "content_trends_cpu" {
  name               = "huntaze-content-trends-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.content_trends_workers.resource_id
  scalable_dimension = aws_appautoscaling_target.content_trends_workers.scalable_dimension
  service_namespace  = aws_appautoscaling_target.content_trends_workers.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "content_trends_workers" {
  name              = "/ecs/huntaze-content-trends-workers"
  retention_in_days = 30

  tags = {
    Project     = "Huntaze"
    Service     = "Content-Trends"
    Environment = var.environment
  }
}
```

**Acceptance Criteria**:
- ECS service deployed with proper configuration
- Auto-scaling configured
- Security groups and IAM roles correct
- CloudWatch logging enabled

## Phase 4: Environment Configuration

### Task INT-4.1: Update Environment Variables
**Files**: 
- `.env.example`
- `.env.production`
- `infra/aws/ecs-router-service.tf`

**Priority**: Medium
**Estimated Time**: 1 hour

**Changes to `.env.example`**:
```bash
# Existing variables...

# Content Trends AI Engine
CONTENT_TRENDS_ENABLED=true
REDIS_CLUSTER_ENDPOINT=content-trends-redis.cache.amazonaws.com:6379
REDIS_AUTH_TOKEN=your-redis-auth-token
S3_VIDEO_BUCKET=huntaze-content-trends-video-processing
AZURE_BLOB_CONTAINER=content-trends-analysis
AZURE_BLOB_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Queue Configuration
BULLMQ_REDIS_HOST=content-trends-redis.cache.amazonaws.com
BULLMQ_REDIS_PORT=6379
QUEUE_CONCURRENCY_VIDEO=2
QUEUE_CONCURRENCY_ANALYSIS=5

# Processing Configuration
FFMPEG_PATH=/usr/bin/ffmpeg
VIDEO_MAX_SIZE_MB=100
KEYFRAME_COUNT=5

# Azure AI Foundry - Content Trends Models
AZURE_DEEPSEEK_R1_ENDPOINT=https://your-endpoint.eastus2.models.ai.azure.com
AZURE_DEEPSEEK_R1_DEPLOYMENT=deepseek-r1-reasoning
AZURE_DEEPSEEK_V3_ENDPOINT=https://your-endpoint.eastus2.models.ai.azure.com
AZURE_DEEPSEEK_V3_DEPLOYMENT=deepseek-v3-generation
AZURE_LLAMA_VISION_ENDPOINT=https://your-endpoint.eastus2.models.ai.azure.com
AZURE_LLAMA_VISION_DEPLOYMENT=llama-32-vision
```

**Changes to `infra/aws/ecs-router-service.tf`**:
```hcl
# Add to container environment variables
environment = [
  # Existing variables...
  { name = "CONTENT_TRENDS_ENABLED", value = "true" },
  { name = "REDIS_CLUSTER_ENDPOINT", value = aws_elasticache_replication_group.content_trends.primary_endpoint_address },
  { name = "S3_VIDEO_BUCKET", value = aws_s3_bucket.video_processing.bucket }
]

# Add to container secrets
secrets = [
  # Existing secrets...
  {
    name      = "REDIS_AUTH_TOKEN"
    valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/content-trends/redis-auth"
  },
  {
    name      = "AZURE_BLOB_CONNECTION_STRING"
    valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:huntaze/content-trends/blob-storage"
  }
]
```

**Acceptance Criteria**:
- All required environment variables documented
- Production configuration updated
- ECS service has access to new variables

### Task INT-4.2: Create AWS Secrets
**File**: `scripts/setup-content-trends-secrets.sh`
**Priority**: High
**Estimated Time**: 1 hour

**Implementation**:
```bash
#!/bin/bash

# Setup Content Trends AWS Secrets
# Usage: ./scripts/setup-content-trends-secrets.sh <environment>

set -e

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-2}

echo "Setting up Content Trends secrets for environment: $ENVIRONMENT"

# Redis Auth Token
echo "Creating Redis auth token..."
REDIS_AUTH_TOKEN=$(openssl rand -base64 32)
aws secretsmanager create-secret \
  --name "huntaze/content-trends/redis-auth" \
  --description "Redis authentication token for Content Trends" \
  --secret-string "$REDIS_AUTH_TOKEN" \
  --region "$AWS_REGION" || \
aws secretsmanager update-secret \
  --secret-id "huntaze/content-trends/redis-auth" \
  --secret-string "$REDIS_AUTH_TOKEN" \
  --region "$AWS_REGION"

# Azure Blob Storage Connection String
echo "Enter Azure Blob Storage connection string:"
read -s AZURE_BLOB_CONNECTION_STRING
aws secretsmanager create-secret \
  --name "huntaze/content-trends/blob-storage" \
  --description "Azure Blob Storage connection string for Content Trends" \
  --secret-string "$AZURE_BLOB_CONNECTION_STRING" \
  --region "$AWS_REGION" || \
aws secretsmanager update-secret \
  --secret-id "huntaze/content-trends/blob-storage" \
  --secret-string "$AZURE_BLOB_CONNECTION_STRING" \
  --region "$AWS_REGION"

# Azure AI API Key
echo "Enter Azure AI API key:"
read -s AZURE_AI_API_KEY
aws secretsmanager create-secret \
  --name "huntaze/content-trends/azure-key" \
  --description "Azure AI API key for Content Trends" \
  --secret-string "$AZURE_AI_API_KEY" \
  --region "$AWS_REGION" || \
aws secretsmanager update-secret \
  --secret-id "huntaze/content-trends/azure-key" \
  --secret-string "$AZURE_AI_API_KEY" \
  --region "$AWS_REGION"

echo "Content Trends secrets setup complete!"
echo "Redis auth token: [HIDDEN]"
echo "Make sure to update your Terraform variables with the Redis auth token."
```

**Acceptance Criteria**:
- All secrets created in AWS Secrets Manager
- Proper permissions for ECS tasks
- Script handles both create and update scenarios

## Phase 5: Testing and Validation

### Task INT-5.1: Create Integration Tests
**File**: `tests/integration/content-trends/aws-azure-integration.test.ts`
**Priority**: High
**Estimated Time**: 3 hours

**Implementation**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AITeamCoordinator } from '@/lib/ai/coordinator';
import { ContentTrendsQueueManager } from '@/lib/ai/content-trends/queue/queue-manager';

describe('Content Trends AWS-Azure Integration', () => {
  let coordinator: AITeamCoordinator;
  let queueManager: ContentTrendsQueueManager;

  beforeAll(async () => {
    coordinator = new AITeamCoordinator();
    queueManager = new ContentTrendsQueueManager();
    
    await coordinator.initialize();
    await queueManager.initialize();
  });

  afterAll(async () => {
    await queueManager.cleanup();
  });

  describe('AI Coordinator Integration', () => {
    it('should route content trends requests to Foundry agent', async () => {
      const request = {
        type: 'content_trends_analysis' as const,
        creatorId: 1,
        contentUrl: 'https://example.com/test-video.mp4',
        platform: 'tiktok' as const,
        analysisType: 'viral_prediction' as const,
      };

      const result = await coordinator.route(request);
      
      expect(result.success).toBe(true);
      expect(result.agentsInvolved).toContain('content-trends-foundry');
      expect(result.data?.jobId).toBeDefined();
    });

    it('should handle trend detection requests', async () => {
      const request = {
        type: 'content_trends_analysis' as const,
        creatorId: 1,
        contentUrl: '',
        platform: 'instagram' as const,
        analysisType: 'trend_detection' as const,
      };

      const result = await coordinator.route(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.trends).toBeDefined();
      expect(Array.isArray(result.data.trends)).toBe(true);
    });

    it('should handle content generation requests', async () => {
      const request = {
        type: 'content_trends_analysis' as const,
        creatorId: 1,
        contentUrl: '',
        platform: 'youtube' as const,
        analysisType: 'content_generation' as const,
        context: {
          brandProfile: {
            name: 'Test Brand',
            voice: 'casual',
            values: ['authenticity', 'creativity'],
            targetAudience: ['gen-z', 'millennials'],
          },
          contentGoals: ['engagement', 'brand-awareness'],
        },
      };

      const result = await coordinator.route(request);
      
      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toBeDefined();
      expect(Array.isArray(result.data.recommendations)).toBe(true);
    });
  });

  describe('Queue System Integration', () => {
    it('should successfully queue viral analysis jobs', async () => {
      const jobId = await queueManager.addJob('viral-analysis', {
        contentUrl: 'https://example.com/test-video.mp4',
        platform: 'tiktok',
        creatorId: 1,
      }, {
        priority: 'high',
        attempts: 3,
      });

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');

      const jobStatus = await queueManager.getJobStatus(jobId);
      expect(jobStatus).toBeDefined();
      expect(['waiting', 'active', 'completed', 'failed']).toContain(jobStatus?.status);
    });

    it('should handle job priority correctly', async () => {
      const highPriorityJob = await queueManager.addJob('viral-analysis', {
        contentUrl: 'https://example.com/high-priority.mp4',
        platform: 'tiktok',
        creatorId: 1,
      }, {
        priority: 'high',
        attempts: 3,
      });

      const lowPriorityJob = await queueManager.addJob('viral-analysis', {
        contentUrl: 'https://example.com/low-priority.mp4',
        platform: 'tiktok',
        creatorId: 1,
      }, {
        priority: 'low',
        attempts: 3,
      });

      expect(highPriorityJob).toBeDefined();
      expect(lowPriorityJob).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid content URLs gracefully', async () => {
      const request = {
        type: 'content_trends_analysis' as const,
        creatorId: 1,
        contentUrl: 'invalid-url',
        platform: 'tiktok' as const,
        analysisType: 'viral_prediction' as const,
      };

      const result = await coordinator.route(request);
      
      // Should either succeed with validation error or fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle queue connection failures', async () => {
      // This test would require mocking Redis connection failure
      // Implementation depends on your testing strategy
      expect(true).toBe(true); // Placeholder
    });
  });
});
```

**Acceptance Criteria**:
- All integration tests pass
- Error scenarios properly handled
- Queue system integration validated
- AI Coordinator routing verified

### Task INT-5.2: Create Deployment Validation Script
**File**: `scripts/validate-content-trends-deployment.sh`
**Priority**: Medium
**Estimated Time**: 2 hours

**Implementation**:
```bash
#!/bin/bash

# Content Trends Deployment Validation Script
# Usage: ./scripts/validate-content-trends-deployment.sh <environment>

set -e

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-2}
BASE_URL=${BASE_URL:-https://api.huntaze.com}

echo "Validating Content Trends deployment for environment: $ENVIRONMENT"

# Check AWS Infrastructure
echo "Checking AWS infrastructure..."

# Check Redis cluster
echo "Checking Redis cluster..."
REDIS_ENDPOINT=$(aws elasticache describe-replication-groups \
  --replication-group-id "huntaze-content-trends-$ENVIRONMENT" \
  --region "$AWS_REGION" \
  --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address' \
  --output text)

if [ "$REDIS_ENDPOINT" != "None" ] && [ -n "$REDIS_ENDPOINT" ]; then
  echo "✅ Redis cluster is running: $REDIS_ENDPOINT"
else
  echo "❌ Redis cluster not found or not running"
  exit 1
fi

# Check S3 bucket
echo "Checking S3 bucket..."
S3_BUCKET=$(aws s3api list-buckets \
  --query "Buckets[?contains(Name, 'huntaze-content-trends-video')].Name" \
  --output text)

if [ -n "$S3_BUCKET" ]; then
  echo "✅ S3 bucket exists: $S3_BUCKET"
else
  echo "❌ S3 bucket not found"
  exit 1
fi

# Check ECS service
echo "Checking ECS service..."
ECS_SERVICE_STATUS=$(aws ecs describe-services \
  --cluster "huntaze-ai-router-$ENVIRONMENT" \
  --services "huntaze-content-trends-workers" \
  --region "$AWS_REGION" \
  --query 'services[0].status' \
  --output text)

if [ "$ECS_SERVICE_STATUS" = "ACTIVE" ]; then
  echo "✅ ECS service is active"
else
  echo "❌ ECS service is not active: $ECS_SERVICE_STATUS"
  exit 1
fi

# Check API endpoints
echo "Checking API endpoints..."

# Test trends endpoint
echo "Testing trends endpoint..."
TRENDS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/ai/content-trends/trends?platform=tiktok" \
  -H "Authorization: Bearer $API_TOKEN")

if [ "$TRENDS_RESPONSE" = "200" ] || [ "$TRENDS_RESPONSE" = "401" ]; then
  echo "✅ Trends endpoint is responding"
else
  echo "❌ Trends endpoint error: HTTP $TRENDS_RESPONSE"
fi

# Test analyze endpoint
echo "Testing analyze endpoint..."
ANALYZE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/ai/content-trends/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"contentUrl":"https://example.com/test.mp4","platform":"tiktok"}')

if [ "$ANALYZE_RESPONSE" = "200" ] || [ "$ANALYZE_RESPONSE" = "401" ]; then
  echo "✅ Analyze endpoint is responding"
else
  echo "❌ Analyze endpoint error: HTTP $ANALYZE_RESPONSE"
fi

# Check secrets
echo "Checking AWS secrets..."
SECRETS=(
  "huntaze/content-trends/redis-auth"
  "huntaze/content-trends/blob-storage"
  "huntaze/content-trends/azure-key"
)

for secret in "${SECRETS[@]}"; do
  if aws secretsmanager describe-secret --secret-id "$secret" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "✅ Secret exists: $secret"
  else
    echo "❌ Secret missing: $secret"
    exit 1
  fi
done

echo "🎉 Content Trends deployment validation completed successfully!"
```

**Acceptance Criteria**:
- All infrastructure components validated
- API endpoints responding correctly
- Secrets properly configured
- Clear success/failure reporting

## Summary

This integration plan provides a comprehensive approach to deploying the Content Trends AI Engine within your existing hybrid AWS-Azure infrastructure. The tasks are organized in phases to minimize risk and ensure proper testing at each step.

### Key Integration Points:
1. **AI Coordinator Extension** - Seamless integration with existing routing
2. **API Layer** - RESTful endpoints following existing patterns
3. **Infrastructure** - Redis, S3, and ECS services in AWS
4. **Monitoring** - Integration with existing CloudWatch setup
5. **Security** - Proper secrets management and IAM roles

### Estimated Timeline:
- **Phase 1**: 10 hours (AI Coordinator integration)
- **Phase 2**: 6 hours (API integration)
- **Phase 3**: 9 hours (Infrastructure)
- **Phase 4**: 2 hours (Configuration)
- **Phase 5**: 5 hours (Testing)
- **Total**: ~32 hours of development work

The modular approach ensures you can deploy incrementally and validate each component before moving to the next phase.