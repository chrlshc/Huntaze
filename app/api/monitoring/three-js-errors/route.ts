import { NextRequest, NextResponse } from 'next/server';

interface ThreeJsError {
  type: 'webgl' | 'rendering' | 'performance' | 'memory';
  message: string;
  component?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * POST /api/monitoring/three-js-errors
 * Receive and log Three.js errors from the client
 */
export async function POST(request: NextRequest) {
  try {
    const error: ThreeJsError = await request.json();

    // Validate error data
    if (!error.type || !error.message || !error.timestamp) {
      return NextResponse.json(
        { error: 'Invalid error data' },
        { status: 400 }
      );
    }

    // Log error to console (in production, you'd send to a logging service)
    console.error('[Three.js Error]', {
      type: error.type,
      message: error.message,
      component: error.component,
      timestamp: new Date(error.timestamp).toISOString(),
      userAgent: error.userAgent,
      url: error.url,
      stack: error.stack,
      context: error.context
    });

    // In production, you would:
    // 1. Send to logging service (e.g., CloudWatch, Sentry, LogRocket)
    // 2. Store in database for analysis
    // 3. Trigger alerts for critical errors
    
    if (process.env.NODE_ENV === 'production') {
      await logToCloudWatch(error);
      
      // Trigger alert for critical errors
      if (error.type === 'webgl' || error.type === 'rendering') {
        await triggerAlert(error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error processing Three.js error report:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/monitoring/three-js-errors
 * Get Three.js error statistics (for admin dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    // In production, you'd fetch from your logging service or database
    // For now, return mock data
    const stats = {
      totalErrors: 0,
      errorsByType: {
        webgl: 0,
        rendering: 0,
        performance: 0,
        memory: 0
      },
      recentErrors: [],
      healthStatus: 'healthy'
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error('Error fetching Three.js error stats:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Log error to CloudWatch (production)
 */
async function logToCloudWatch(error: ThreeJsError): Promise<void> {
  try {
    // Implementation would depend on your AWS setup
    // Example using AWS SDK:
    /*
    const { CloudWatchLogsClient, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
    
    const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION });
    
    const command = new PutLogEventsCommand({
      logGroupName: '/aws/lambda/three-js-errors',
      logStreamName: new Date().toISOString().split('T')[0],
      logEvents: [{
        timestamp: error.timestamp,
        message: JSON.stringify(error)
      }]
    });
    
    await client.send(command);
    */
    
    console.log('[CloudWatch] Would log Three.js error:', error.type);
  } catch (err) {
    console.error('Failed to log to CloudWatch:', err);
  }
}

/**
 * Trigger alert for critical errors
 */
async function triggerAlert(error: ThreeJsError): Promise<void> {
  try {
    // Implementation would depend on your alerting system
    // Example: Send to Slack, email, or SNS
    
    console.log('[Alert] Critical Three.js error detected:', {
      type: error.type,
      message: error.message,
      url: error.url
    });
    
    // Example SNS notification:
    /*
    const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
    
    const client = new SNSClient({ region: process.env.AWS_REGION });
    
    const command = new PublishCommand({
      TopicArn: process.env.THREE_JS_ALERT_TOPIC_ARN,
      Subject: `Critical Three.js Error: ${error.type}`,
      Message: JSON.stringify(error, null, 2)
    });
    
    await client.send(command);
    */
  } catch (err) {
    console.error('Failed to trigger alert:', err);
  }
}