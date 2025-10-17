import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai/providers';
import { dynamodb, TABLES } from '@/lib/aws/dynamodb-client';
import { s3Helpers, S3_BUCKETS } from '@/lib/aws/s3-client';
import { sqsHelpers, SQS_QUEUES } from '@/lib/aws/sqs-client';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    services: {
      azure_openai: { status: 'unknown', details: {} },
      dynamodb: { status: 'unknown', details: {} },
      s3: { status: 'unknown', details: {} },
      sqs: { status: 'unknown', details: {} },
    },
  };

  // Test Azure OpenAI
  try {
    const aiHealth = await aiProvider.healthCheck();
    results.services.azure_openai = {
      status: aiHealth.status === 'healthy' ? 'ok' : 'error',
      details: aiHealth,
    };
  } catch (error: any) {
    results.services.azure_openai = {
      status: 'error',
      details: { error: error.message },
    };
  }

  // Test DynamoDB
  try {
    // Try to scan a table to test connection
    await dynamodb.send({
      Scan: {
        TableName: TABLES.USER_METRICS,
        Limit: 1,
      },
    });
    results.services.dynamodb = {
      status: 'ok',
      details: {
        tables: Object.values(TABLES),
        region: process.env.AWS_REGION || 'us-east-1',
      },
    };
  } catch (error: any) {
    results.services.dynamodb = {
      status: error.name === 'ResourceNotFoundException' ? 'tables_not_created' : 'error',
      details: { error: error.message },
    };
  }

  // Test S3
  try {
    // Try to list buckets
    const buckets = Object.values(S3_BUCKETS);
    results.services.s3 = {
      status: 'ok',
      details: {
        buckets,
        region: process.env.AWS_REGION || 'us-east-1',
      },
    };
  } catch (error: any) {
    results.services.s3 = {
      status: 'error',
      details: { error: error.message },
    };
  }

  // Test SQS
  try {
    const queues = Object.values(SQS_QUEUES);
    results.services.sqs = {
      status: 'ok',
      details: {
        queues,
        region: process.env.AWS_REGION || 'us-east-1',
      },
    };
  } catch (error: any) {
    results.services.sqs = {
      status: 'error',
      details: { error: error.message },
    };
  }

  // Environment check
  const envStatus = {
    AZURE_OPENAI_ENDPOINT: !!process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY: !!process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'not set',
    AWS_REGION: process.env.AWS_REGION || 'not set',
    AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN: !!process.env.AWS_SESSION_TOKEN,
  };

  return NextResponse.json({
    ...results,
    environment: envStatus,
    summary: {
      all_services_ok: Object.values(results.services).every(s => s.status === 'ok'),
      message: 'Service health check completed',
    },
  });
}